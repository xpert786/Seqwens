import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InvoiceDetailsTab from './InvoiceDetailsTab';
import { firmAdminInvoiceAPI, taxpayerFirmAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function InvoiceDetails() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: '',
    paid_amount: '',
    due_date: '',
    notes: ''
  });
  const [sendMessage, setSendMessage] = useState('');

  // Transform API response to component format
  const transformInvoiceData = useCallback((apiData) => {
    if (!apiData || !apiData.invoice) return null;

    const invoice = apiData.invoice;
    const payments = apiData.payments || [];

    // Transform invoice items (API provides description and value only)
    const items = invoice.invoice_items?.map((item, idx) => ({
      description: item.description || '',
      amount: parseFloat(item.value || 0)
    })) || [];

    // Calculate subtotal (total - tax)
    const total = parseFloat(invoice.amount || 0);
    const tax = parseFloat(invoice.tax_amount || 0);
    const subtotal = total - tax;
    const paidAmount = parseFloat(invoice.paid_amount || 0);
    const remainingAmount = parseFloat(invoice.remaining_amount || 0);

    // Transform payment history
    const paymentHistory = payments.map(payment => ({
      date: payment.formatted_payment_date || new Date(payment.payment_date).toLocaleDateString(),
      amount: parseFloat(payment.amount || 0),
      method: payment.payment_method_display || payment.payment_method || 'Unknown',
      reference: payment.transaction_id || payment.id?.toString() || '',
      status: payment.status_display || payment.status || 'Completed'
    }));

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number || '',
      client: invoice.client_name || '',
      amount: total,
      status: invoice.status || 'draft',
      issueDate: invoice.formatted_issue_date || invoice.issue_date || '',
      dueDate: invoice.formatted_due_date || invoice.due_date || '',
      paymentDate: invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString() : null,
      items,
      subtotal,
      total,
      tax,
      clientInfo: {
        name: invoice.client_name || '',
        company: '', // Not in API response
        address: invoice.client_address_details?.full_address || invoice.client_address || '',
        email: invoice.client_email || '',
        phone: invoice.client_phone_number || '',
        addressDetails: invoice.client_address_details || null
      },
      invoiceDetails: {
        invoiceNumber: invoice.invoice_number || '',
        assignedTo: invoice.created_by_name || '',
        office: '', // Not in API response
        status: invoice.status_display || invoice.status || 'Draft'
      },
      paymentHistory,
      activityLog: [], // Will be populated from activity log if available
      // Additional fields
      paidAmount,
      remainingAmount,
      isOverdue: invoice.is_overdue || false,
      statusColor: invoice.status_color || 'gray',
      formattedPaidAmount: invoice.formatted_paid_amount || `$${paidAmount.toFixed(2)}`,
      formattedAmount: invoice.formatted_amount || `$${total.toFixed(2)}`,
      notes: invoice.notes || '',
      // Store raw API data for editing
      rawData: invoice
    };
  }, []);

  // Fetch invoice details
  const fetchInvoiceDetails = useCallback(async () => {
    if (!invoiceId) {
      setError('Invoice ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await firmAdminInvoiceAPI.getInvoiceDetails(invoiceId);

      if (response.success && response.data) {
        const transformed = transformInvoiceData(response.data);
        if (transformed) {
          setInvoiceData(transformed);
          // Initialize edit form with current values
          setEditFormData({
            status: response.data.invoice.status || '',
            paid_amount: response.data.invoice.paid_amount || '',
            due_date: response.data.invoice.due_date || '',
            notes: response.data.invoice.notes || ''
          });
        } else {
          setError('Failed to parse invoice data');
        }
      } else {
        setError(response.message || 'Failed to fetch invoice details');
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      const errorMessage = handleAPIError(err);
      setError(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to fetch invoice details'));
    } finally {
      setLoading(false);
    }
  }, [invoiceId, transformInvoiceData]);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [fetchInvoiceDetails]);

  // Handle send invoice
  const handleSendInvoice = async () => {
    if (!invoiceId) return;

    try {
      setSending(true);
      const response = await firmAdminInvoiceAPI.sendInvoice(invoiceId, sendMessage);

      if (response.success) {
        toast.success(response.message || 'Invoice sent successfully!');
        setShowSendModal(false);
        setSendMessage('');
        // Refresh invoice data
        fetchInvoiceDetails();
      } else {
        throw new Error(response.message || 'Failed to send invoice');
      }
    } catch (err) {
      console.error('Error sending invoice:', err);
      const errorMessage = handleAPIError(err);
      toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to send invoice'));
    } finally {
      setSending(false);
    }
  };

  // Handle download invoice PDF
  const handleDownloadPDF = async () => {
    if (!invoiceId || !invoiceData) return;

    try {
      toast.info('Preparing invoice PDF...', { autoClose: 2000 });

      // Try to fetch firm logo/name for better branding
      let firmInfo = { name: invoiceData.rawData?.firm_name || 'Seqwens', logo: null };
      try {
        const firmResponse = await taxpayerFirmAPI.getFirmLogo();
        if (firmResponse.success && firmResponse.data) {
          firmInfo.name = firmResponse.data.firm_name || firmInfo.name;
          firmInfo.logo = firmResponse.data.logo_url;
        }
      } catch (e) {
        console.warn('Could not fetch firm info', e);
      }

      // Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header: Firm Info
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text(firmInfo.name, 14, yPos);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Professional CPA Services', 14, yPos + 7);

      // Invoice Label
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(245, 109, 45);
      doc.text('INVOICE', pageWidth - 14, yPos + 5, { align: 'right' });

      yPos += 30;

      // Horizontal Line
      doc.setDrawColor(229, 231, 235);
      doc.line(14, yPos - 5, pageWidth - 14, yPos - 5);

      // Client & Invoice details section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(75, 85, 99);
      doc.text('BILL TO:', 14, yPos);
      doc.text('INVOICE DETAILS:', pageWidth / 2 + 10, yPos);

      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text(invoiceData.clientInfo.name || 'N/A', 14, yPos);

      // Billing Details
      doc.text('Invoice #:', pageWidth / 2 + 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceData.invoiceNumber || `INV-${invoiceId}`, pageWidth - 14, yPos, { align: 'right' });

      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(invoiceData.clientInfo.address || '', 14, yPos, { maxWidth: 80 });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('Issue Date:', pageWidth / 2 + 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceData.issueDate || 'N/A', pageWidth - 14, yPos, { align: 'right' });

      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Due Date:', pageWidth / 2 + 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceData.dueDate || 'N/A', pageWidth - 14, yPos, { align: 'right' });

      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Status:', pageWidth / 2 + 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceData.invoiceDetails.status || 'N/A', pageWidth - 14, yPos, { align: 'right' });

      yPos += 20;

      // Items Table
      const tableBody = (invoiceData.items || []).map(item => [
        item.description || 'Service',
        1,
        `$${parseFloat(item.amount || 0).toFixed(2)}`,
        `$${parseFloat(item.amount || 0).toFixed(2)}`
      ]);

      if (tableBody.length === 0) {
        tableBody.push(['General Services', 1, `$${parseFloat(invoiceData.total || 0).toFixed(2)}`, `$${parseFloat(invoiceData.total || 0).toFixed(2)}`]);
      }

      autoTable(doc, {
        startY: yPos,
        head: [['Description', 'Qty', 'Rate', 'Amount']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [59, 74, 102], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' }
        }
      });

      yPos = doc.lastAutoTable.finalY + 15;

      // Totals
      const totalX = pageWidth - 14;
      const labelX = totalX - 55;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', labelX, yPos);
      doc.text(`$${parseFloat(invoiceData.subtotal || 0).toFixed(2)}`, totalX, yPos, { align: 'right' });

      yPos += 7;
      doc.text(`Tax:`, labelX, yPos);
      doc.text(`$${parseFloat(invoiceData.tax || 0).toFixed(2)}`, totalX, yPos, { align: 'right' });

      yPos += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('TOTAL:', labelX, yPos);
      doc.text(`$${parseFloat(invoiceData.total || 0).toFixed(2)}`, totalX, yPos, { align: 'right' });

      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('Amount Paid:', labelX, yPos);
      doc.text(`$${parseFloat(invoiceData.paidAmount || 0).toFixed(2)}`, totalX, yPos, { align: 'right' });

      yPos += 7;
      doc.setTextColor(239, 68, 68);
      doc.text('Balance Due:', labelX, yPos);
      doc.text(`$${parseFloat(invoiceData.remainingAmount || 0).toFixed(2)}`, totalX, yPos, { align: 'right' });

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text('Thank you for your business!', pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });

      // Save
      const fileName = `${invoiceData.invoiceNumber || 'Invoice'}.pdf`;
      doc.save(fileName);

      toast.success('Invoice PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      toast.error('Failed to generate invoice PDF');
    }
  };

  // Handle update invoice
  const handleUpdateInvoice = async () => {
    if (!invoiceId) return;

    try {
      setUpdating(true);

      // Prepare update data (only include fields that have values)
      const updateData = {};
      if (editFormData.status) updateData.status = editFormData.status;
      if (editFormData.paid_amount !== '') updateData.paid_amount = editFormData.paid_amount;
      if (editFormData.due_date) updateData.due_date = editFormData.due_date;
      if (editFormData.notes !== undefined) updateData.notes = editFormData.notes;

      const response = await firmAdminInvoiceAPI.updateInvoice(invoiceId, updateData);

      if (response.success) {
        toast.success(response.message || 'Invoice updated successfully!');
        setShowEditModal(false);
        // Refresh invoice data
        fetchInvoiceDetails();
      } else {
        throw new Error(response.message || 'Failed to update invoice');
      }
    } catch (err) {
      console.error('Error updating invoice:', err);
      const errorMessage = handleAPIError(err);
      toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to update invoice'));
    } finally {
      setUpdating(false);
    }
  };


  const getStatusBadge = (status, statusColor) => {
    const statusLower = (status || '').toLowerCase();
    // Use API status_color if available, otherwise fallback to default colors
    const colorMap = {
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      blue: 'bg-blue-500',
      gray: 'bg-gray-500'
    };

    const configs = {
      paid: { color: statusColor === 'green' ? colorMap.green : 'bg-green-500', text: 'Paid' },
      sent: { color: statusColor === 'blue' ? colorMap.blue : 'bg-blue-500', text: 'Sent' },
      overdue: { color: statusColor === 'red' ? colorMap.red : 'bg-red-500', text: 'Overdue' },
      draft: { color: statusColor === 'gray' ? colorMap.gray : 'bg-gray-500', text: 'Draft' },
      pending: { color: statusColor === 'yellow' ? colorMap.yellow : 'bg-yellow-500', text: 'Pending' },
      partial: { color: statusColor === 'orange' ? colorMap.orange : 'bg-orange-500', text: 'Partially Paid' },
      cancelled: { color: statusColor === 'gray' ? colorMap.gray : 'bg-gray-500', text: 'Cancelled' }
    };

    const config = configs[statusLower] || { color: colorMap[statusColor] || 'bg-gray-500', text: status };
    return (
      <span className={`${config.color} text-white px-2.5 py-1 !rounded-[10px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap inline-flex items-center justify-center min-w-[80px]`}>
        {config.text}
      </span>
    );
  };

  const getIcon = (iconName) => {
    const icons = {
      send: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.5 1.5L11.4166 16.0239C11.3568 16.1948 11.1187 16.2045 11.0451 16.039L8.25 9.75M16.5 1.5L1.97614 6.58335C1.80518 6.64319 1.79546 6.88132 1.96099 6.95488L8.25 9.75M16.5 1.5L8.25 9.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      edit: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 2.25H3.75C3.35218 2.25 2.97064 2.40804 2.68934 2.68934C2.40804 2.97064 2.25 3.35218 2.25 3.75V14.25C2.25 14.6478 2.40804 15.0294 2.68934 15.3107C2.97064 15.592 3.35218 15.75 3.75 15.75H14.25C14.6478 15.75 15.0294 15.592 15.3107 15.3107C15.592 15.0294 15.75 14.6478 15.75 14.25V9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.7813 1.9699C14.0797 1.67153 14.4844 1.50391 14.9063 1.50391C15.3283 1.50391 15.733 1.67153 16.0313 1.9699C16.3297 2.26826 16.4973 2.67294 16.4973 3.0949C16.4973 3.51685 16.3297 3.92153 16.0313 4.2199L9.27157 10.9804C9.09348 11.1583 8.87347 11.2886 8.63182 11.3591L6.47707 11.9891C6.41253 12.008 6.34412 12.0091 6.279 11.9924C6.21388 11.9757 6.15444 11.9418 6.10691 11.8943C6.05937 11.8468 6.02549 11.7873 6.0088 11.7222C5.99212 11.6571 5.99325 11.5887 6.01207 11.5241L6.64207 9.3694C6.71297 9.12793 6.84347 8.90819 7.02157 8.7304L13.7813 1.9699Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      download: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    };
    return icons[iconName] || null;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center" style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6" style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h5 className="text-red-800 font-[BasisGrotesquePro] mb-2">Error</h5>
          <p className="text-red-600 font-[BasisGrotesquePro]">{error}</p>
          <button
            onClick={fetchInvoiceDetails}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-[BasisGrotesquePro]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="p-6" style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
        <div className="text-center">
          <p className="font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>No invoice data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6" style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/firmadmin/billing')}
          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
          style={{ fontFamily: 'BasisGrotesquePro' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
      </div>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
          <div className="flex-1">
            <h4 className="text-2xl sm:text-4xl font-black font-[BasisGrotesquePro] mb-3 text-gray-900 tracking-tight">
              {invoiceData.invoiceNumber}
            </h4>
            <div className="flex flex-wrap items-center gap-3 text-gray-500">
              <span className="text-sm sm:text-base font-bold font-[BasisGrotesquePro]">
                {invoiceData.client} • {invoiceData.formattedAmount || `$${invoiceData.total.toLocaleString()}`}
              </span>
              {getStatusBadge(invoiceData.status, invoiceData.statusColor)}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowSendModal(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 !rounded-xl !border border-gray-200 bg-white flex items-center justify-center gap-2 hover:bg-gray-50 transition shadow-sm text-sm font-bold font-[BasisGrotesquePro]"
            >
              {getIcon('send')}
              <span>Send</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-none px-4 py-2.5 !rounded-xl !border border-gray-200 bg-white flex items-center justify-center gap-2 hover:bg-gray-50 transition shadow-sm text-sm font-bold font-[BasisGrotesquePro]"
            >
              {getIcon('download')}
              <span>PDF</span>
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="col-span-2 sm:col-auto px-6 py-2.5 !rounded-xl flex items-center justify-center gap-2 bg-[#F97316] text-white font-bold text-sm shadow-lg shadow-orange-100 transition-transform active:scale-95"
            >
              {getIcon('edit')}
              <span>Edit Invoice</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#E8F0FF]">
            <h6 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 font-[BasisGrotesquePro]">Total Amount</h6>
            <p className="text-xl sm:text-2xl font-black font-[BasisGrotesquePro] text-gray-900 tracking-tight">{invoiceData.formattedAmount || `$${invoiceData.total.toLocaleString()}`}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#E8F0FF]">
            <h6 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 font-[BasisGrotesquePro]">Paid Amount</h6>
            <p className="text-xl sm:text-2xl font-black font-[BasisGrotesquePro] text-green-500 tracking-tight">{invoiceData.formattedPaidAmount || `$${invoiceData.paidAmount.toLocaleString()}`}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#E8F0FF]">
            <h6 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 font-[BasisGrotesquePro]">Remaining</h6>
            <p className={`text-xl sm:text-2xl font-black font-[BasisGrotesquePro] tracking-tight ${invoiceData.remainingAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
              ${invoiceData.remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#E8F0FF]">
            <h6 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 font-[BasisGrotesquePro]">Issue Date</h6>
            <p className="text-lg sm:text-xl font-bold font-[BasisGrotesquePro] text-gray-900 tracking-tight">{invoiceData.issueDate}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#E8F0FF]">
            <h6 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 font-[BasisGrotesquePro]">Due Date</h6>
            <p className={`text-lg sm:text-xl font-bold font-[BasisGrotesquePro] tracking-tight ${invoiceData.isOverdue ? 'text-red-500' : 'text-gray-900'}`}>
              {invoiceData.dueDate}
            </p>
          </div>
        </div>

        {/* Invoice Details Content */}
        <InvoiceDetailsTab invoiceData={invoiceData} />
      </div>

      {/* Edit Invoice Modal */}
      {showEditModal && createPortal(
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[1100] p-2 sm:p-4 overflow-y-auto"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl relative max-w-[550px] w-full my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-[#F1F5F9]">
              <div>
                <h5 className="text-xl font-black text-gray-900 font-[BasisGrotesquePro]">Edit Invoice</h5>
                <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">Update invoice details and status</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="p-5 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Status</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 !rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-[BasisGrotesquePro]"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="partial">Partially Paid</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Paid Amount ($)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 !rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-[BasisGrotesquePro]"
                    value={editFormData.paid_amount}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, paid_amount: e.target.value }))}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Due Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 !rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-[BasisGrotesquePro]"
                  value={editFormData.due_date}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Internal Notes</label>
                <textarea
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 !rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-[BasisGrotesquePro]"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  placeholder="Enter invoice notes..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-row justify-end gap-3 p-5 sm:p-6 border-t border-[#F1F5F9] bg-gray-50">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                disabled={updating}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-gray-200 !rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all font-[BasisGrotesquePro]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateInvoice}
                disabled={updating}
                className="flex-1 sm:flex-none px-8 py-2.5 text-white !rounded-xl text-sm font-black transition-all shadow-lg shadow-orange-100 active:scale-95 disabled:opacity-50 font-[BasisGrotesquePro]"
                style={{ backgroundColor: '#F97316' }}
              >
                {updating ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Send Invoice Modal */}
      {showSendModal && createPortal(
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[1100] p-2 sm:p-4 overflow-y-auto"
          onClick={() => setShowSendModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl relative max-w-[480px] w-full my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-[#F1F5F9]">
              <div>
                <h5 className="text-xl font-black text-gray-900 font-[BasisGrotesquePro]">Send Invoice</h5>
                <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">Email this invoice to your client</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="p-5 sm:p-8 space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Recipient</p>
                    <p className="text-sm font-bold text-blue-900">{invoiceData.clientInfo.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Custom Message</label>
                <textarea
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 !rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-[BasisGrotesquePro]"
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  rows={4}
                  placeholder="Include a personal note to the client..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-row justify-end gap-3 p-5 sm:p-6 border-t border-[#F1F5F9] bg-gray-50">
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                disabled={sending}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-gray-200 !rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all font-[BasisGrotesquePro]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendInvoice}
                disabled={sending}
                className="flex-1 sm:flex-none px-8 py-2.5 text-white !rounded-xl text-sm font-black transition-all shadow-lg shadow-orange-100 active:scale-95 disabled:opacity-50 font-[BasisGrotesquePro]"
                style={{ backgroundColor: '#F97316' }}
              >
                {sending ? 'Sending...' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
