import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { File } from "../../component/icons";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";

export default function ClientInvoices() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('paid');
  const [paidInvoices, setPaidInvoices] = useState([]);
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
  const [sortBy, setSortBy] = useState("-amount");

  // Fetch paid invoices from API
  const fetchPaidInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!clientId) {
        throw new Error('Client ID is required');
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }
      if (sortBy) {
        params.append('sort_by', sortBy);
      }
      if (pagination.page > 1) {
        params.append('page', pagination.page);
      }
      if (pagination.page_size !== 20) {
        params.append('page_size', pagination.page_size);
      }

      const queryString = params.toString();
      const url = `${API_BASE_URL}/taxpayer/tax-preparer/clients/${clientId}/invoices/paid/${queryString ? `?${queryString}` : ''}`;

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      console.log('Fetching paid invoices from:', url);

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Paid invoices API response:', result);

      if (result.success && result.data) {
        setPaidInvoices(result.data.paid_invoices || []);
        setSummary(result.data.summary || {
          total_invoices: 0,
          paid_invoices_count: 0,
          paid_total: 0,
          outstanding_total: 0,
          overdue_total: 0
        });
        setClientInfo(result.data.client || null);
        if (result.data.pagination) {
          setPagination(result.data.pagination);
        }
      } else {
        throw new Error(result.message || 'Failed to fetch paid invoices');
      }
    } catch (error) {
      console.error('Error fetching paid invoices:', error);
      setError(handleAPIError(error));
      setPaidInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch invoices when filters change
  useEffect(() => {
    if (clientId && activeTab === 'paid') {
      fetchPaidInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, activeTab, searchQuery, startDate, endDate, sortBy, pagination.page, pagination.page_size]);

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
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={fetchPaidInvoices}>
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
            <h3 className="text-lg font-semibold" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>
              {clientInfo?.name ? `${clientInfo.name}'s Invoices` : 'Client Invoices'}
            </h3>
            <p className="text-sm text-gray-500">Manage and track client invoices</p>
          </div>
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
          <ul className="d-flex mb-0" style={{ listStyle: "none", padding: 0, margin: 0, gap: "10px" }}>
            <li>
              <button
                onClick={() => setActiveTab('paid')}
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
                Paid Invoices ({summary.paid_invoices_count || 0})
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('outstanding')}
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
          </ul>
        </div>

        {/* Paid Invoices Tab */}
        {activeTab === 'paid' && (
          <>
            {/* Search and Filters */}
            <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
              <div className="position-relative flex-grow-1" style={{ minWidth: "200px" }}>
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  style={{
                    border: "1px solid #E8F0FF",
                  }}
                />
                <i className="bi bi-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6B7280" }}></i>
              </div>
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
                  width: "150px"
                }}
              >
                <option value="-amount">Amount (High to Low)</option>
                <option value="amount">Amount (Low to High)</option>
                <option value="-paid_date_value">Date (Newest)</option>
                <option value="paid_date_value">Date (Oldest)</option>
                <option value="-invoice_number">Invoice # (Desc)</option>
                <option value="invoice_number">Invoice # (Asc)</option>
              </select>
            </div>

            {/* Paid Invoices List */}
            {paidInvoices.length > 0 ? (
              <>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Invoice #</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Description</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Amount</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Issue Date</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Due Date</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Paid Date</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Payment Method</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paidInvoices.map((invoice) => (
                        <tr key={invoice.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/taxdashboard/invoices/${invoice.id}`)}>
                          <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>{invoice.invoice_number}</td>
                          <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>{invoice.description || 'N/A'}</td>
                          <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500" }}>{formatCurrency(invoice.amount)}</td>
                          <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>{formatDate(invoice.issue_date)}</td>
                          <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>{formatDate(invoice.due_date)}</td>
                          <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>{formatDate(invoice.paid_date)}</td>
                          <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>{invoice.payment_method || 'N/A'}</td>
                          <td>
                            <span className="badge bg-success text-white px-2 py-1" style={{ borderRadius: "12px", fontSize: "12px" }}>
                              Paid
                            </span>
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
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.has_previous}
                      >
                        Previous
                      </button>
                      <span className="d-flex align-items-center px-3">
                        Page {pagination.page} of {pagination.total_pages}
                      </span>
                      <button
                        className="btn btn-sm btn-outline-secondary"
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
                <p className="text-muted">No paid invoices found</p>
                {(searchQuery || startDate || endDate) && (
                  <button className="btn btn-sm btn-outline-primary mt-2" onClick={() => {
                    setSearchQuery("");
                    setStartDate("");
                    setEndDate("");
                  }}>
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Outstanding Invoices Tab - Placeholder */}
        {activeTab === 'outstanding' && (
          <div className="text-center py-5">
            <p className="text-muted">Outstanding invoices will be displayed here</p>
          </div>
        )}
      </div>
    </div>
  );
}
