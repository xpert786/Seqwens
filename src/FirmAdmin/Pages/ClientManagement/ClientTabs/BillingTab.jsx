import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firmAdminBillingHistoryAPI, firmAdminInvoiceAPI, taxpayerFirmAPI, handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { toast } from 'react-toastify';
import CreateInvoiceModal from '../../Billing/CreateInvoiceModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function BillingTab({ client, billingHistory: propBillingHistory = [] }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(null);
  const dropdownRefs = useRef({});
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 1
  });
  const [filters, setFilters] = useState({
    status: '',
    start_date: '',
    end_date: '',
    search: ''
  });
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown !== null) {
        const dropdownElement = dropdownRefs.current[showDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target)) {
          setShowDropdown(null);
        }
      }
    };

    if (showDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Get status color based on invoice status
  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'paid':
        return 'bg-[#22C55E] text-white';
      case 'overdue':
        return 'bg-[#EF4444] text-white';
      case 'pending':
        return 'bg-[#F59E0B] text-white';
      case 'draft':
        return 'bg-gray-500 text-white';
      case 'partial':
        return 'bg-blue-500 text-white';
      case 'cancelled':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleDropdownToggle = (invoiceId) => {
    setShowDropdown(showDropdown === invoiceId ? null : invoiceId);
  };

  // Fetch billing history from API
  const fetchBillingHistory = async () => {
    if (!client?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = {
        client_id: client.id,
        page: pagination.page,
        page_size: pagination.page_size,
        sort_by: '-issue_date',
        include_payments: true
      };

      if (filters.status) params.status = filters.status;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.search) params.search = filters.search;

      const response = await firmAdminBillingHistoryAPI.getBillingHistory(params);

      // Handle different response structures
      if (response?.success && response?.data) {
        // New API structure with data wrapper
        setBillingHistory(response.data.invoices || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else if (response?.invoices) {
        // Direct response with invoices
        setBillingHistory(response.invoices || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else if (Array.isArray(response)) {
        // Array of invoices
        setBillingHistory(response);
      } else {
        setBillingHistory([]);
      }
    } catch (err) {
      console.error('Error fetching billing history:', err);
      setError(handleAPIError(err));
      toast.error(handleAPIError(err));
      setBillingHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingHistory();
  }, [client?.id, pagination.page, pagination.page_size, filters.status, filters.start_date, filters.end_date, filters.search]);

  // Handle download invoice PDF
  const handleDownloadInvoice = async (invoice) => {
    if (!invoice?.id) return;
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }
      toast.info('Preparing invoice PDF...', { autoClose: 2000 });

      // 1. Fetch full details (including items)
      const detailsResponse = await firmAdminInvoiceAPI.getInvoiceDetails(invoice.id);
      if (!detailsResponse.success || !detailsResponse.data) {
        throw new Error(detailsResponse.message || 'Failed to fetch invoice details');
      }

      const fullInvoice = detailsResponse.data.invoice;

      // 2. Try to fetch firm logo/name
      let firmInfo = { name: 'Seqwens', logo: null };
      try {
        const firmResponse = await taxpayerFirmAPI.getFirmLogo();
        if (firmResponse.success && firmResponse.data) {
          firmInfo.name = firmResponse.data.firm_name || 'Seqwens';
          firmInfo.logo = firmResponse.data.logo_url;
        }
      } catch (e) {
        console.warn('Could not fetch firm info', e);
      }

      // 3. Generate PDF
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
      doc.text(fullInvoice.client_name || fullInvoice.client || 'N/A', 14, yPos);

      // Billing Details
      doc.text('Invoice #:', pageWidth / 2 + 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(fullInvoice.invoice_number || `INV-${fullInvoice.id}`, pageWidth - 14, yPos, { align: 'right' });

      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(fullInvoice.client_address || '', 14, yPos, { maxWidth: 80 });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('Issue Date:', pageWidth / 2 + 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(fullInvoice.formatted_issue_date || fullInvoice.issue_date || 'N/A', pageWidth - 14, yPos, { align: 'right' });

      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Due Date:', pageWidth / 2 + 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(fullInvoice.formatted_due_date || fullInvoice.due_date || 'N/A', pageWidth - 14, yPos, { align: 'right' });

      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Status:', pageWidth / 2 + 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(fullInvoice.status_display || fullInvoice.status || 'N/A', pageWidth - 14, yPos, { align: 'right' });

      yPos += 20;

      // Items Table
      const tableBody = (fullInvoice.invoice_items || []).map(item => [
        item.description || 'Service',
        1,
        `$${parseFloat(item.value || 0).toFixed(2)}`,
        `$${parseFloat(item.value || 0).toFixed(2)}`
      ]);

      if (tableBody.length === 0) {
        tableBody.push(['General Services', 1, `$${parseFloat(fullInvoice.amount || 0).toFixed(2)}`, `$${parseFloat(fullInvoice.amount || 0).toFixed(2)}`]);
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
      doc.text(`$${(parseFloat(fullInvoice.amount || 0) - parseFloat(fullInvoice.tax_amount || 0)).toFixed(2)}`, totalX, yPos, { align: 'right' });

      yPos += 7;
      doc.text(`Tax (${fullInvoice.tax_percentage || 0}%):`, labelX, yPos);
      doc.text(`$${parseFloat(fullInvoice.tax_amount || 0).toFixed(2)}`, totalX, yPos, { align: 'right' });

      yPos += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('TOTAL:', labelX, yPos);
      doc.text(`$${parseFloat(fullInvoice.amount || 0).toFixed(2)}`, totalX, yPos, { align: 'right' });

      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('Amount Paid:', labelX, yPos);
      doc.text(`$${parseFloat(fullInvoice.paid_amount || 0).toFixed(2)}`, totalX, yPos, { align: 'right' });

      yPos += 7;
      doc.setTextColor(239, 68, 68);
      doc.text('Balance Due:', labelX, yPos);
      doc.text(`$${parseFloat(fullInvoice.remaining_amount || 0).toFixed(2)}`, totalX, yPos, { align: 'right' });

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text('Thank you for your business!', pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });

      // Save
      const fileName = `${fullInvoice.invoice_number || 'Invoice'}.pdf`;
      doc.save(fileName);

      toast.success('Invoice PDF generated successfully');
      setShowDropdown(null);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      toast.error(handleAPIError(error) || 'Failed to generate invoice PDF');
    }
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    if (typeof amount === 'string') {
      amount = parseFloat(amount);
    }
    return amount ? `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h5 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2">Billing History</h5>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">All invoices and payments for this client</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowCreateInvoiceModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro] flex items-center gap-2"
              style={{ borderRadius: "10px" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 1V7M7 7V13M7 7H13M7 7H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Create Invoice
            </button>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-[BasisGrotesquePro]"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-[BasisGrotesquePro]"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading billing history...</p>
        </div>
      ) : billingHistory.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">No billing history available</p>
        </div>
      ) : (
        <>
          {/* Table Headers */}
          <div className="grid grid-cols-7 gap-4 pb-4 mb-4 border-b border-gray-200 font-[BasisGrotesquePro]">
            <div className="text-sm text-[#4B5563]">Invoice ID</div>
            <div className="text-sm text-[#4B5563]">Description</div>
            <div className="text-sm text-[#4B5563]">Amount</div>
            <div className="text-sm text-[#4B5563]">Date</div>
            <div className="text-sm text-[#4B5563]">Due Date</div>
            <div className="text-sm text-[#4B5563]">Status</div>
            <div className="text-sm text-[#4B5563] text-center">Action</div>
          </div>

          {/* Invoice Rows */}
          <div className="space-y-3">
            {billingHistory.map((invoice) => {
              // Map API response fields to display fields
              const invoiceNumber = invoice.invoice_number || invoice.invoice_id || `INV-${invoice.id}`;
              const description = invoice.description || invoice.notes || 'N/A';
              const amount = parseFloat(invoice.amount || invoice.total_amount || 0);
              const formattedAmount = invoice.formatted_amount || formatCurrency(amount);
              const issueDate = invoice.formatted_issue_date || invoice.formatted_date || formatDate(invoice.issue_date);
              const dueDate = invoice.formatted_due_date || formatDate(invoice.due_date);
              const status = invoice.status || 'draft';
              const statusDisplay = invoice.status_display || status.charAt(0).toUpperCase() + status.slice(1);

              return (
                <div
                  key={invoice.id}
                  className="grid grid-cols-7 gap-4 items-center bg-white !rounded-lg p-4 !border border-[#E8F0FF] font-[BasisGrotesquePro]"
                >
                  <div className="text-sm font-medium text-gray-900">{invoiceNumber}</div>
                  <div className="text-sm text-gray-900">{description}</div>
                  <div className="text-sm font-medium text-gray-900">{formattedAmount}</div>
                  <div className="text-sm text-gray-900">{issueDate}</div>
                  <div className="text-sm text-gray-900">{dueDate}</div>
                  <div>
                    <span className={`px-3 py-1 text-xs font-medium !rounded-[20px] ${getStatusColor(status)} font-[BasisGrotesquePro]`}>
                      {statusDisplay}
                    </span>
                  </div>
                  <div className="flex justify-center relative">
                    <div
                      ref={(el) => { dropdownRefs.current[invoice.id] = el; }}
                    >
                      <button
                        onClick={() => handleDropdownToggle(invoice.id)}
                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M8 8.66667C8.73638 8.66667 9.33333 8.06971 9.33333 7.33333C9.33333 6.59695 8.73638 6 8 6C7.26362 6 6.66667 6.59695 6.66667 7.33333C6.66667 8.06971 7.26362 8.66667 8 8.66667Z"
                            fill="currentColor"
                          />
                          <path
                            d="M8 4C8.73638 4 9.33333 3.40305 9.33333 2.66667C9.33333 1.93029 8.73638 1.33333 8 1.33333C7.26362 1.33333 6.66667 1.93029 6.66667 2.66667C6.66667 3.40305 7.26362 4 8 4Z"
                            fill="currentColor"
                          />
                          <path
                            d="M8 14.6667C8.73638 14.6667 9.33333 14.0697 9.33333 13.3333C9.33333 12.597 8.73638 12 8 12C7.26362 12 6.66667 12.597 6.66667 13.3333C6.66667 14.0697 7.26362 14.6667 8 14.6667Z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                      {showDropdown === invoice.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                navigate(`/firmadmin/billing/${invoice.id}`);
                                setShowDropdown(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 font-[BasisGrotesquePro] rounded"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(invoice)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 font-[BasisGrotesquePro] rounded"
                            >
                              Download Invoice
                            </button>
                            <button
                              onClick={() => setShowDropdown(null)}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 font-[BasisGrotesquePro] rounded"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination.total_pages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total_count)} of {pagination.total_count} invoices
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={!pagination.has_previous}
                  className={`px-3 py-2 text-sm border rounded-lg font-[BasisGrotesquePro] ${!pagination.has_previous
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={!pagination.has_next}
                  className={`px-3 py-2 text-sm border rounded-lg font-[BasisGrotesquePro] ${!pagination.has_next
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateInvoiceModal(false)}
          onInvoiceCreated={() => {
            // Refresh billing history
            fetchBillingHistory();
          }}
          preSelectedClient={client}
        />
      )}
    </div>
  );
}
