import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import InvoiceDetailsTab from './InvoiceDetailsTab';
import { firmAdminInvoiceAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';

export default function InvoiceDetails() {
  const { invoiceId } = useParams();
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
      <span className={`${config.color} text-white px-2 py-0.5 !rounded-[10px] text-xs font-medium whitespace-nowrap`}>
        {config.text}
      </span>
    );
  };

  const getIcon = (iconName) => {
    const icons = {
      send: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.5 1.5L11.4166 16.0239C11.3568 16.1948 11.1187 16.2045 11.0451 16.039L8.25 9.75M16.5 1.5L1.97614 6.58335C1.80518 6.64319 1.79546 6.88132 1.96099 6.95488L8.25 9.75M16.5 1.5L8.25 9.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      edit: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 2.25H3.75C3.35218 2.25 2.97064 2.40804 2.68934 2.68934C2.40804 2.97064 2.25 3.35218 2.25 3.75V14.25C2.25 14.6478 2.40804 15.0294 2.68934 15.3107C2.97064 15.592 3.35218 15.75 3.75 15.75H14.25C14.6478 15.75 15.0294 15.592 15.3107 15.3107C15.592 15.0294 15.75 14.6478 15.75 14.25V9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.7813 1.9699C14.0797 1.67153 14.4844 1.50391 14.9063 1.50391C15.3283 1.50391 15.733 1.67153 16.0313 1.9699C16.3297 2.26826 16.4973 2.67294 16.4973 3.0949C16.4973 3.51685 16.3297 3.92153 16.0313 4.2199L9.27157 10.9804C9.09348 11.1583 8.87347 11.2886 8.63182 11.3591L6.47707 11.9891C6.41253 12.008 6.34412 12.0091 6.279 11.9924C6.21388 11.9757 6.15444 11.9418 6.10691 11.8943C6.05937 11.8468 6.02549 11.7873 6.0088 11.7222C5.99212 11.6571 5.99325 11.5887 6.01207 11.5241L6.64207 9.3694C6.71297 9.12793 6.84347 8.90819 7.02157 8.7304L13.7813 1.9699Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      download: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round"/>
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
    <div className="p-6" style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="text-3xl font-bold font-[BasisGrotesquePro] mb-2" style={{ color: '#1F2937' }}>
              {invoiceData.invoiceNumber}
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-base font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>
                {invoiceData.client} • ${invoiceData.amount.toLocaleString()}
              </span>
              {getStatusBadge(invoiceData.status, invoiceData.statusColor)}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSendModal(true)}
              className="px-4 py-2 !rounded-lg !border border-gray-300 bg-white flex items-center gap-2 hover:bg-gray-50 transition"
            >
              {getIcon('send')}
              Send to Client
            </button>
            <button className="px-4 py-2 !rounded-lg !border border-gray-300 bg-white flex items-center gap-2 hover:bg-gray-50 transition">
              {getIcon('download')}
              Download PDF
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="px-5 py-2 !rounded-lg flex items-center gap-2  !border border-gray-300 bg-white font-medium"
            >
              {getIcon('edit')}
              Edit Invoice
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h6 className="text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Total Amount</h6>
            <p className="text-2xl font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{invoiceData.formattedAmount || `$${invoiceData.total.toLocaleString()}`}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h6 className="text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Paid Amount</h6>
            <p className="text-2xl font-bold font-[BasisGrotesquePro]" style={{ color: '#10B981' }}>{invoiceData.formattedPaidAmount || `$${invoiceData.paidAmount.toLocaleString()}`}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h6 className="text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Remaining Amount</h6>
            <p className="text-2xl font-bold font-[BasisGrotesquePro]" style={{ color: invoiceData.remainingAmount > 0 ? '#EF4444' : '#10B981' }}>
              ${invoiceData.remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h6 className="text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Issue Date</h6>
            <p className="text-2xl font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{invoiceData.issueDate}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h6 className="text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Due Date</h6>
            <p className="text-2xl font-bold font-[BasisGrotesquePro]" style={{ color: invoiceData.isOverdue ? '#EF4444' : '#1F2937' }}>
              {invoiceData.dueDate}
              {invoiceData.isOverdue && (
                <span className="block text-xs text-red-500 mt-1 font-normal">Overdue</span>
              )}
            </p>
          </div>
        </div>

        {/* Invoice Details Content */}
        <InvoiceDetailsTab invoiceData={invoiceData} />
      </div>

      {/* Edit Invoice Modal */}
      {showEditModal && createPortal(
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-4 p-4"
            style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0 font-[BasisGrotesquePro]" style={{ fontWeight: 600, fontSize: '20px', color: '#3B4A66' }}>
                Edit Invoice
              </h5>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                  <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                </svg>
              </button>
            </div>

            <div className="mb-3">
              <label className="form-label mb-1 font-[BasisGrotesquePro]" style={{ fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                Status
              </label>
              <select
                className="form-select form-select-sm"
                value={editFormData.status}
                onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
                <option value="partial">Partially Paid</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label mb-1 font-[BasisGrotesquePro]" style={{ fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                Paid Amount
              </label>
              <input
                type="number"
                className="form-control form-control-sm"
                value={editFormData.paid_amount}
                onChange={(e) => setEditFormData(prev => ({ ...prev, paid_amount: e.target.value }))}
                placeholder="0.00"
                step="0.01"
                min="0"
                style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1 font-[BasisGrotesquePro]" style={{ fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                Due Date
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={editFormData.due_date}
                onChange={(e) => setEditFormData(prev => ({ ...prev, due_date: e.target.value }))}
                style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
              />
            </div>

            <div className="mb-4">
              <label className="form-label mb-1 font-[BasisGrotesquePro]" style={{ fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                Notes
              </label>
              <textarea
                className="form-control form-control-sm"
                value={editFormData.notes}
                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                placeholder="Enter notes..."
                style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                disabled={updating}
                className="btn btn-sm"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#3B4A66',
                  border: '1px solid #E8F0FF',
                  fontFamily: 'BasisGrotesquePro',
                  fontSize: '14px',
                  padding: '8px 16px'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateInvoice}
                disabled={updating}
                className="btn btn-sm"
                style={{
                  backgroundColor: '#F56D2D',
                  color: '#FFFFFF',
                  border: 'none',
                  fontFamily: 'BasisGrotesquePro',
                  fontSize: '14px',
                  padding: '8px 16px'
                }}
              >
                {updating ? 'Updating...' : 'Update Invoice'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Send Invoice Modal */}
      {showSendModal && createPortal(
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}
          onClick={() => setShowSendModal(false)}
        >
          <div
            className="bg-white rounded-4 p-4"
            style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0 font-[BasisGrotesquePro]" style={{ fontWeight: 600, fontSize: '20px', color: '#3B4A66' }}>
                Send Invoice to Client
              </h5>
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                  <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                </svg>
              </button>
            </div>

            <div className="mb-3">
              <p className="font-[BasisGrotesquePro]" style={{ fontSize: '14px', color: '#6B7280' }}>
                Invoice will be sent to: <strong>{invoiceData.clientInfo.email}</strong>
              </p>
            </div>

            <div className="mb-4">
              <label className="form-label mb-1 font-[BasisGrotesquePro]" style={{ fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                Custom Message (Optional)
              </label>
              <textarea
                className="form-control form-control-sm"
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                rows={4}
                placeholder="Enter a custom message to include in the email..."
                style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                disabled={sending}
                className="btn btn-sm"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#3B4A66',
                  border: '1px solid #E8F0FF',
                  fontFamily: 'BasisGrotesquePro',
                  fontSize: '14px',
                  padding: '8px 16px'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendInvoice}
                disabled={sending}
                className="btn btn-sm"
                style={{
                  backgroundColor: '#F56D2D',
                  color: '#FFFFFF',
                  border: 'none',
                  fontFamily: 'BasisGrotesquePro',
                  fontSize: '14px',
                  padding: '8px 16px'
                }}
              >
                {sending ? 'Sending...' : 'Send Invoice'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
