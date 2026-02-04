import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { File } from "../../component/icons";
import { FaEye, FaFilePdf } from "react-icons/fa";
import { taxPreparerClientAPI, handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import TaxPreparerInvoiceDetailsModal from "../Billing/TaxPreparerInvoiceDetailsModal";
import TaxPreparerCreateInvoiceModal from "../Billing/TaxPreparerCreateInvoiceModal";

export default function ClientInvoices() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'paid', 'pending', 'overdue', 'outstanding'
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({
    total_invoices: 0,
    paid_invoices_count: 0,
    paid_total: 0,
    outstanding_total: 0,
    overdue_total: 0
  });
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false
  });
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("-issue_date");
  const [statusFilter, setStatusFilter] = useState(""); // Empty means all
  
  // Invoice detail modal state
  const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // Create invoice modal state
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);

  // Fetch invoices from API
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!clientId) {
        throw new Error('Client ID is required');
      }

      // Determine status filter based on active tab
      let status = statusFilter;
      if (!statusFilter && activeTab !== 'all') {
        if (activeTab === 'paid') {
          status = 'paid';
        } else if (activeTab === 'pending') {
          status = 'pending';
        } else if (activeTab === 'overdue') {
          status = 'overdue';
        } else if (activeTab === 'outstanding') {
          // Outstanding means not fully paid (pending, overdue, partial)
          status = ''; // We'll filter client-side or use a different approach
        }
      }

      const params = {
        page: pagination.page,
        page_size: pagination.page_size,
        sort_by: sortBy
      };

      if (status) {
        params.status = status;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await taxPreparerClientAPI.getClientInvoices(clientId, params);

      if (response.success && response.data) {
        let invoicesList = response.data.invoices || [];
        
        // Filter for outstanding if needed (pending, overdue, partial)
        if (activeTab === 'outstanding' && !statusFilter) {
          invoicesList = invoicesList.filter(inv => 
            inv.status === 'pending' || inv.status === 'overdue' || inv.status === 'partial'
          );
        }

        setInvoices(invoicesList);
        setSummary(response.data.summary || {
          total_invoices: 0,
          paid_invoices_count: 0,
          paid_total: 0,
          outstanding_total: 0,
          overdue_total: 0
        });
        setClientInfo(response.data.client || null);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError(handleAPIError(error));
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch invoices when filters change
  useEffect(() => {
    if (clientId) {
      fetchInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, activeTab, searchQuery, startDate, endDate, sortBy, statusFilter, pagination.page, pagination.page_size]);

  // Format currency - handles both string and number amounts
  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on search
  };

  // Handle date range change
  const handleDateRangeChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setStatusFilter(""); // Clear status filter when changing tabs
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle invoice click to view details
  const handleInvoiceClick = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setShowInvoiceDetailModal(true);
  };

  // Get status badge color
  const getStatusBadge = (status, isOverdue) => {
    const statusLower = status?.toLowerCase() || '';
    if (isOverdue || statusLower === 'overdue') {
      return 'bg-danger text-white';
    }
    switch (statusLower) {
      case 'paid':
        return 'bg-success text-white';
      case 'pending':
        return 'bg-warning text-dark';
      case 'partial':
        return 'bg-info text-white';
      case 'draft':
        return 'bg-secondary text-white';
      case 'cancelled':
        return 'bg-dark text-white';
      default:
        return 'bg-secondary text-white';
    }
  };

  // Get status display text
  const getStatusDisplay = (status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'overdue':
        return 'Overdue';
      case 'partial':
        return 'Partial';
      case 'draft':
        return 'Draft';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="mt-6">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6">
        <div className="alert alert-danger" role="alert">
          <strong>Error:</strong> {error}
          <button className="btn  btn-outline-danger ms-2" onClick={fetchInvoices}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="bg-white rounded-xl p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-lg font-semibold" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>
              {clientInfo?.name ? `${clientInfo.name}'s Invoices` : 'Client Invoices'}
            </h4>
            <p className="text-sm text-gray-500">Manage and track client invoices</p>
          </div>
          <button
            onClick={() => setShowCreateInvoiceModal(true)}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
            style={{ backgroundColor: '#F56D2D' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 1V7M7 7V13M7 7H13M7 7H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Create Invoice
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="row g-3 mb-4">
            <div className="col-md-3 col-sm-6">
              <div className="bg-light rounded p-3">
                <div className="text-muted small mb-1">Total Invoices</div>
                <div className="fw-semibold" style={{ fontSize: "20px", color: "#3B4A66" }}>
                  {summary.total_invoices || 0}
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="bg-light rounded p-3">
                <div className="text-muted small mb-1">Paid Invoices</div>
                <div className="fw-semibold" style={{ fontSize: "20px", color: "#22C55E" }}>
                  {summary.paid_invoices_count || 0}
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="bg-light rounded p-3">
                <div className="text-muted small mb-1">Total Paid</div>
                <div className="fw-semibold" style={{ fontSize: "20px", color: "#22C55E" }}>
                  {formatCurrency(summary.paid_total)}
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="bg-light rounded p-3">
                <div className="text-muted small mb-1">Outstanding</div>
                <div className="fw-semibold" style={{ fontSize: "20px", color: "#EF4444" }}>
                  {formatCurrency(summary.outstanding_total)}
                </div>
              </div>
            </div>
            {summary.overdue_total > 0 && (
              <div className="col-md-3 col-sm-6">
                <div className="bg-light rounded p-3" style={{ border: "2px solid #EF4444" }}>
                  <div className="text-muted small mb-1">Overdue</div>
                  <div className="fw-semibold" style={{ fontSize: "20px", color: "#EF4444" }}>
                    {formatCurrency(summary.overdue_total)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="d-inline-block mb-4" style={{
          padding: "6px 10px",
          border: "1px solid #E8F0FF",
          backgroundColor: "#FFFFFF",
          borderRadius: "15px",
          fontFamily: "BasisGrotesquePro",
        }}>
          <ul className="d-flex mb-0 flex-wrap" style={{ listStyle: "none", padding: 0, margin: 0, gap: "10px" }}>
            <li>
              <button
                onClick={() => handleTabChange('all')}
                style={{
                  padding: "8px 22px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "15px",
                  fontFamily: "BasisGrotesquePro",
                  backgroundColor: activeTab === 'all' ? "#00C0C6" : "transparent",
                  color: activeTab === 'all' ? "#ffffff" : "#3B4A66",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
              >
                All Invoices ({summary.total_invoices || 0})
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('paid')}
                style={{
                  padding: "8px 22px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "15px",
                  fontFamily: "BasisGrotesquePro",
                  backgroundColor: activeTab === 'paid' ? "#00C0C6" : "transparent",
                  color: activeTab === 'paid' ? "#ffffff" : "#3B4A66",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
              >
                Paid ({summary.paid_invoices_count || 0})
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('outstanding')}
                style={{
                  padding: "8px 22px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "15px",
                  fontFamily: "BasisGrotesquePro",
                  backgroundColor: activeTab === 'outstanding' ? "#00C0C6" : "transparent",
                  color: activeTab === 'outstanding' ? "#ffffff" : "#3B4A66",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
              >
                Outstanding
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('pending')}
                style={{
                  padding: "8px 22px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "15px",
                  fontFamily: "BasisGrotesquePro",
                  backgroundColor: activeTab === 'pending' ? "#00C0C6" : "transparent",
                  color: activeTab === 'pending' ? "#ffffff" : "#3B4A66",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
              >
                Pending
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('overdue')}
                style={{
                  padding: "8px 22px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "15px",
                  fontFamily: "BasisGrotesquePro",
                  backgroundColor: activeTab === 'overdue' ? "#00C0C6" : "transparent",
                  color: activeTab === 'overdue' ? "#ffffff" : "#3B4A66",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
              >
                Overdue
              </button>
            </li>
          </ul>
        </div>

        {/* Invoices Tab */}
        {(activeTab === 'all' || activeTab === 'paid' || activeTab === 'outstanding' || activeTab === 'pending' || activeTab === 'overdue') && (
          <>
            {/* Search and Filters */}
            <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
              <div className="position-relative flex-grow-1" style={{ minWidth: "200px" }}>
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search by invoice number or description..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  style={{
                    border: "1px solid #E8F0FF",
                  }}
                />
                <i className="bi bi-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6B7280" }}></i>
              </div>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                style={{
                  border: "1px solid #E8F0FF",
                  width: "150px"
                }}
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input
                type="date"
                className="form-control"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => handleDateRangeChange(e.target.value, endDate)}
                style={{
                  border: "1px solid #E8F0FF",
                  width: "150px"
                }}
              />
              <input
                type="date"
                className="form-control"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => handleDateRangeChange(startDate, e.target.value)}
                style={{
                  border: "1px solid #E8F0FF",
                  width: "150px"
                }}
              />
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                style={{
                  border: "1px solid #E8F0FF",
                  width: "180px"
                }}
              >
                <option value="-issue_date">Issue Date (Newest)</option>
                <option value="issue_date">Issue Date (Oldest)</option>
                <option value="-due_date">Due Date (Latest)</option>
                <option value="due_date">Due Date (Earliest)</option>
                <option value="-amount">Amount (High to Low)</option>
                <option value="amount">Amount (Low to High)</option>
                <option value="-invoice_number">Invoice # (Desc)</option>
                <option value="invoice_number">Invoice # (Asc)</option>
                <option value="status">Status (A-Z)</option>
                <option value="-status">Status (Z-A)</option>
              </select>
              {(searchQuery || startDate || endDate || statusFilter) && (
                <button
                  className="btn  btn-outline-secondary"
                  onClick={() => {
                    setSearchQuery("");
                    setStartDate("");
                    setEndDate("");
                    setStatusFilter("");
                  }}
                  style={{
                    border: "1px solid #E8F0FF",
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Invoices List */}
            {invoices.length > 0 ? (
              <>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr style={{ backgroundColor: "#F9FAFB" }}>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "600", color: "#3B4A66" }}>Invoice #</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "600", color: "#3B4A66" }}>Description</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "600", color: "#3B4A66" }}>Amount</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "600", color: "#3B4A66" }}>Paid</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "600", color: "#3B4A66" }}>Remaining</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "600", color: "#3B4A66" }}>Issue Date</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "600", color: "#3B4A66" }}>Due Date</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "600", color: "#3B4A66" }}>Status</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "600", color: "#3B4A66" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr 
                          key={invoice.id} 
                          style={{ cursor: "pointer" }}
                          className="hover:bg-[#F0FDFF] transition-colors"
                          onClick={() => handleInvoiceClick(invoice.id)}
                        >
                          <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500" }}>
                            {invoice.invoice_number || `#${invoice.id}`}
                          </td>
                          <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>
                            {invoice.description || 'N/A'}
                          </td>
                          <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "600" }}>
                            {formatCurrency(invoice.amount)}
                          </td>
                          <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", color: "#22C55E" }}>
                            {formatCurrency(invoice.paid_amount || 0)}
                          </td>
                          <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", color: invoice.remaining_amount > 0 ? "#EF4444" : "#22C55E", fontWeight: "500" }}>
                            {formatCurrency(invoice.remaining_amount || 0)}
                          </td>
                          <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>
                            {formatDate(invoice.issue_date || invoice.formatted_issue_date)}
                          </td>
                          <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>
                            {formatDate(invoice.due_date || invoice.formatted_due_date)}
                          </td>
                          <td>
                            <span className={`badge px-3 py-1 ${getStatusBadge(invoice.status, invoice.is_overdue)}`} style={{ borderRadius: "12px", fontSize: "12px", fontFamily: "BasisGrotesquePro" }}>
                              {getStatusDisplay(invoice.status)}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="d-flex gap-2">
                              <button
                                className="btn  btn-outline-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInvoiceClick(invoice.id);
                                }}
                                title="View Details"
                                style={{
                                  border: "1px solid #00C0C6",
                                  color: "#00C0C6",
                                  borderRadius: "6px",
                                  padding: "4px 8px"
                                }}
                              >
                                <FaEye size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted small">
                      Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total_count)} of {pagination.total_count} invoices
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn  btn-outline-secondary"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.has_previous}
                      >
                        Previous
                      </button>
                      <span className="d-flex align-items-center px-3">
                        Page {pagination.page} of {pagination.total_pages}
                      </span>
                      <button
                        className="btn  btn-outline-secondary"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.has_next}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-5">
                <div className="mb-3">
                  <File size={48} color="#9CA3AF" />
                </div>
                <p className="text-muted mb-2">No invoices found</p>
                {(searchQuery || startDate || endDate || statusFilter) && (
                  <button 
                    className="btn  btn-outline-primary mt-2" 
                    onClick={() => {
                      setSearchQuery("");
                      setStartDate("");
                      setEndDate("");
                      setStatusFilter("");
                    }}
                    style={{
                      border: "1px solid #00C0C6",
                      color: "#00C0C6"
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </>
        )}

      {/* Invoice Detail Modal */}
      {showInvoiceDetailModal && selectedInvoiceId && (
        <TaxPreparerInvoiceDetailsModal
          isOpen={showInvoiceDetailModal}
          onClose={() => {
            setShowInvoiceDetailModal(false);
            setSelectedInvoiceId(null);
          }}
          invoiceId={selectedInvoiceId}
          clientId={clientId}
        />
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && (
        <TaxPreparerCreateInvoiceModal
          onClose={() => setShowCreateInvoiceModal(false)}
          onInvoiceCreated={() => {
            setShowCreateInvoiceModal(false);
            // Refresh invoices list
            fetchInvoices();
          }}
          preSelectedClient={clientInfo}
        />
      )}
      </div>
    </div>
  );
}
