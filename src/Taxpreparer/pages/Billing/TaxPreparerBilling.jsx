import React, { useState, useEffect, useCallback } from "react";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import TaxPreparerCreateInvoiceModal from "./TaxPreparerCreateInvoiceModal";
import TaxPreparerInvoiceDetailsModal from "./TaxPreparerInvoiceDetailsModal";
import { hasTaxPreparerPermission } from "../../../ClientOnboarding/utils/privilegeUtils";

const API_BASE_URL = getApiBaseUrl();

export default function TaxPreparerBilling() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({
    outstanding_balance: 0,
    paid_this_year: 0,
    next_due_date: null,
    total_invoices: 0,
    outstanding_count: 0,
    overdue_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInvoiceDetailsModalOpen, setIsInvoiceDetailsModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    client_id: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Check if user has create_invoices permission
  const canCreateInvoices = hasTaxPreparerPermission('create_invoices');

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = getAccessToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams();
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.client_id) {
        params.append('client_id', filters.client_id);
      }
      params.append('page', currentPage.toString());
      params.append('page_size', itemsPerPage.toString());

      const queryString = params.toString();
      const url = `${API_BASE_URL}/firm/invoices/list/${queryString ? `?${queryString}` : ''}`;

      const response = await fetchWithCors(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setInvoices(result.data.invoices || []);
        setSummary(result.data.summary || {
          outstanding_balance: 0,
          paid_this_year: 0,
          next_due_date: null,
          total_invoices: 0,
          outstanding_count: 0,
          overdue_count: 0
        });
      } else {
        throw new Error(result.message || 'Failed to fetch invoices');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(handleAPIError(err) || 'Failed to load invoices. Please try again.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase();
    const statusConfig = {
      paid: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
      overdue: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
    };

    const config = statusConfig[statusLower] || statusConfig.draft;
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${config.bg} ${config.text} ${config.border}`}>
        {status || 'Draft'}
      </span>
    );
  };

  const handleInvoiceCreated = () => {
    fetchInvoices();
  };

  return (
    <div className="p-6 !bg-[#F3F7FF]" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h4 className="text-3xl font-bold mb-2" style={{ color: '#1F2937' }}>
            Billing & Invoicing
          </h4>
          <p className="text-base" style={{ color: '#6B7280' }}>
            Manage invoices and track payments
          </p>
        </div>
        {canCreateInvoices && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2 !rounded-lg flex items-center gap-2 text-white font-medium"
            style={{ backgroundColor: '#F97316' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Invoice
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-4">
          <p className="text-sm text-gray-600 mb-1">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total_invoices || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-4">
          <p className="text-sm text-gray-600 mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.outstanding_balance || 0)}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-4">
          <p className="text-sm text-gray-600 mb-1">Paid This Year</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.paid_this_year || 0)}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-4">
          <p className="text-sm text-gray-600 mb-1">Outstanding Count</p>
          <p className="text-2xl font-bold text-gray-900">{summary.outstanding_count || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-4">
          <p className="text-sm text-gray-600 mb-1">Overdue Count</p>
          <p className="text-2xl font-bold text-gray-900">{summary.overdue_count || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-4">
          <p className="text-sm text-gray-600 mb-1">Next Due Date</p>
          <p className="text-lg font-semibold text-gray-900">{summary.next_due_date ? formatDate(summary.next_due_date) : 'N/A'}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-[#E8F0FF] p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-[#E8F0FF] shadow-sm">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#32B582]"></div>
            <p className="mt-4 text-sm text-gray-600">Loading invoices...</p>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <strong>Error:</strong> {error}
              <button
                className="ml-4 text-sm underline"
                onClick={fetchInvoices}
              >
                Retry
              </button>
            </div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">No invoices found</p>
            {canCreateInvoices && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Create Your First Invoice
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#E8F0FF] bg-gray-50">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  // Extract client ID from various possible fields
                  // client can be a number (ID) or an object with id property
                  const clientId = invoice.client_id || 
                                  (typeof invoice.client === 'number' ? invoice.client : null) ||
                                  invoice.client?.id || 
                                  invoice.taxpayer_id || 
                                  invoice.taxpayer?.id;
                  
                  return (
                  <tr key={invoice.id} className="border-b border-[#E8F0FF] hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-gray-900">{invoice.invoice_number || `#${invoice.id}`}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">
                        {invoice.client_name || invoice.client?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">{formatDate(invoice.issue_date)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">{formatDate(invoice.due_date)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(invoice.total_amount || invoice.amount || 0)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => {
                          setSelectedInvoiceId(invoice.id);
                          // Use the clientId extracted above
                          if (clientId) {
                            setSelectedClientId(clientId);
                          } else {
                            // If clientId is not available, still open modal but let it use fallback
                            console.warn('Client ID not found in invoice, using fallback endpoint. Invoice:', invoice);
                            setSelectedClientId(null);
                          }
                          setIsInvoiceDetailsModalOpen(true);
                        }}
                        className="text-[#3AD6F2] hover:text-[#2BC4E0] text-sm font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && canCreateInvoices && (
        <TaxPreparerCreateInvoiceModal
          onClose={() => setIsCreateModalOpen(false)}
          onInvoiceCreated={handleInvoiceCreated}
        />
      )}

      {/* Invoice Details Modal */}
      {isInvoiceDetailsModalOpen && selectedInvoiceId && (
        <TaxPreparerInvoiceDetailsModal
          isOpen={isInvoiceDetailsModalOpen}
          onClose={() => {
            setIsInvoiceDetailsModalOpen(false);
            setSelectedInvoiceId(null);
            setSelectedClientId(null);
          }}
          invoiceId={selectedInvoiceId}
          clientId={selectedClientId}
        />
      )}
    </div>
  );
}

