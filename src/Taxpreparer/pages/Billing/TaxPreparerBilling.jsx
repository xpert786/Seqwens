import React, { useState, useEffect, useCallback } from "react";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import TaxPreparerCreateInvoiceModal from "./TaxPreparerCreateInvoiceModal";
import TaxPreparerInvoiceDetailsModal from "./TaxPreparerInvoiceDetailsModal";
import { hasTaxPreparerPermission } from "../../../ClientOnboarding/utils/privilegeUtils";
import StripePaymentForm from "../../../components/StripePaymentForm";
import { toast } from "react-toastify";
import { loadStripe } from "@stripe/stripe-js";
import { FiFileText, FiDollarSign, FiCheckCircle, FiClock, FiAlertCircle, FiCalendar } from "react-icons/fi";

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
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' or 'platform'
  const [platformBilling, setPlatformBilling] = useState(null);
  const [platformLoading, setPlatformLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [stripeKey, setStripeKey] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
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

  const fetchPlatformBilling = useCallback(async () => {
    try {
      setPlatformLoading(true);
      const token = getAccessToken();
      const response = await fetchWithCors(`${API_BASE_URL}/user/staff/split-billing-management/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      const result = await response.json();
      if (result.success) {
        setPlatformBilling(result.data);
      }
    } catch (err) {
      console.error('Error fetching platform billing:', err);
    } finally {
      setPlatformLoading(false);
    }
  }, []);

  const fetchStripeKey = useCallback(async () => {
    try {
      const token = getAccessToken();
      const response = await fetchWithCors(`${API_BASE_URL}/user/firm-admin/subscription/stripe-publishable-key/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      const result = await response.json();
      if (result.success) {
        setStripeKey(result.data.publishable_key);
      }
    } catch (err) {
      console.error('Error fetching stripe key:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'platform') {
      fetchPlatformBilling();
      fetchStripeKey();
    }
  }, [activeTab, fetchPlatformBilling, fetchStripeKey]);

  const handlePlatformPayment = async (paymentMethodId) => {
    try {
      setPaymentProcessing(true);
      const token = getAccessToken();

      // 1. Create payment intent
      const response = await fetchWithCors(`${API_BASE_URL}/user/staff/split-billing-management/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to initiate payment');
      }

      const { client_secret } = result.data;

      // 2. Confirm payment with Stripe
      const stripe = await loadStripe(stripeKey);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: paymentMethodId
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        toast.success("Payment completed successfully!");
        setShowPaymentModal(false);
        fetchPlatformBilling();
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error(err.message || "Payment failed");
    } finally {
      setPaymentProcessing(false);
    }
  };

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
            {activeTab === 'clients' ? 'Manage invoices and track payments' : 'View and pay for your portion of platform usage'}
          </p>
        </div>
        {canCreateInvoices && activeTab === 'clients' && (
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('clients')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'clients'
            ? 'border-[#3AD6F2] text-[#3AD6F2]'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          Client Invoices
        </button>
        <button
          onClick={() => setActiveTab('platform')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'platform'
            ? 'border-[#3AD6F2] text-[#3AD6F2]'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          Platform Charges
        </button>
      </div>

      {activeTab === 'clients' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-[#E8F0FF] p-2 flex items-center gap-2 transition-all hover:shadow-md">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                <FiFileText size={18} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 mb-0" style={{ fontFamily: 'BasisGrotesquePro' }}>Total Invoices</p>
                <p className="text-lg font-bold text-gray-900 m-0" style={{ fontFamily: 'BasisGrotesquePro' }}>{summary.total_invoices || 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E8F0FF] p-2 flex items-center gap-2 transition-all hover:shadow-md">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
                <FiAlertCircle size={18} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 mb-0" style={{ fontFamily: 'BasisGrotesquePro' }}>Outstanding</p>
                <p className="text-lg font-bold text-gray-900 m-0" style={{ fontFamily: 'BasisGrotesquePro' }}>{formatCurrency(summary.outstanding_balance || 0)}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E8F0FF] p-2 flex items-center gap-2 transition-all hover:shadow-md">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500 flex-shrink-0">
                <FiDollarSign size={18} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 mb-0" style={{ fontFamily: 'BasisGrotesquePro' }}>Paid This Year</p>
                <p className="text-lg font-bold text-gray-900 m-0" style={{ fontFamily: 'BasisGrotesquePro' }}>{formatCurrency(summary.paid_this_year || 0)}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E8F0FF] p-2 flex items-center gap-2 transition-all hover:shadow-md">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 flex-shrink-0">
                <FiClock size={18} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 mb-0" style={{ fontFamily: 'BasisGrotesquePro' }}>Outstanding Count</p>
                <p className="text-lg font-bold text-gray-900 m-0" style={{ fontFamily: 'BasisGrotesquePro' }}>{summary.outstanding_count || 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E8F0FF] p-2 flex items-center gap-2 transition-all hover:shadow-md">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
                <FiAlertCircle size={18} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 mb-0" style={{ fontFamily: 'BasisGrotesquePro' }}>Overdue Count</p>
                <p className="text-lg font-bold text-gray-900 m-0" style={{ fontFamily: 'BasisGrotesquePro' }}>{summary.overdue_count || 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E8F0FF] p-2 flex items-center gap-2 transition-all hover:shadow-md">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                <FiCalendar size={18} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 mb-0" style={{ fontFamily: 'BasisGrotesquePro' }}>Next Due Date</p>
                <p className="text-lg font-bold text-gray-900 m-0" style={{ fontFamily: 'BasisGrotesquePro' }}>{summary.next_due_date ? formatDate(summary.next_due_date) : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>Filter by Status</label>
                <select
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] bg-transparent"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  style={{ fontFamily: 'BasisGrotesquePro' }}
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
                                if (clientId) {
                                  setSelectedClientId(clientId);
                                } else {
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
        </>
      ) : (
        <div className="space-y-6">
          {/* Platform Billing Summary */}
          {platformLoading ? (
            <div className="text-center py-12 bg-white rounded-lg border border-[#E8F0FF]">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AD6F2]"></div>
              <p className="mt-4 text-sm text-gray-600">Loading platform billing estimate...</p>
            </div>
          ) : platformBilling ? (
            <>
              <div className="bg-white rounded-lg border border-[#E8F0FF] p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Current Split Billing Estimate</h3>
                    <p className="text-sm text-gray-600">Period: {platformBilling.billing_summary.period_start} to {platformBilling.billing_summary.period_end}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Estimated Total</p>
                    <p className="text-3xl font-bold text-[#F97316]">${platformBilling.billing_summary.estimated_monthly_total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {platformBilling.sections.map((section) => (
                    <div key={section.id} className="border border-[#E8F0FF] rounded-xl p-5 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-gray-900">{section.title}</h4>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${section.is_covered ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {section.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-4 line-clamp-2 leading-relaxed">{section.description}</p>
                      <div className="flex justify-between items-end">
                        <div className="text-[10px] text-gray-500 font-medium">ESTIMATED PORTION</div>
                        <div className="text-lg font-bold text-gray-900">${section.portion_estimate.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {platformBilling.billing_summary.estimated_monthly_total > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-8 py-3 bg-[#F97316] text-white rounded-lg font-bold hover:bg-orange-600 transition-all shadow-md shadow-orange-100"
                    >
                      Pay Outstanding Portion
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-[#E8F0FF] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Resource Breakdown</h3>
                <div className="space-y-4">
                  {platformBilling.sections.map((section) => (
                    <div key={section.id}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-2 h-2 rounded-full ${section.is_covered ? 'bg-green-400' : 'bg-[#3AD6F2]'}`}></div>
                        <span className="text-sm font-semibold text-gray-700">{section.title}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-5">
                        {section.applies_to.map((item, idx) => (
                          <span key={idx} className="bg-white border border-gray-100 text-gray-500 text-[11px] px-2.5 py-1 rounded-full">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg border border-[#E8F0FF] p-12 text-center">
              <p className="text-gray-600">No split billing information available.</p>
            </div>
          )}
        </div>
      )}

      {/* stripe payment modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Platform Payment</h3>
                <p className="text-sm text-gray-500 mt-1">One-time payment for your split billing portion</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                disabled={paymentProcessing}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-8 p-4 bg-orange-50 border border-orange-100 rounded-lg flex justify-between items-center">
              <span className="text-orange-800 font-medium">Amount to Pay</span>
              <span className="text-2xl font-black text-orange-900">${platformBilling?.billing_summary.estimated_monthly_total.toFixed(2)}</span>
            </div>

            <StripePaymentForm
              stripePublishableKey={stripeKey}
              onSubmit={handlePlatformPayment}
              onCancel={() => setShowPaymentModal(false)}
              processing={paymentProcessing}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && canCreateInvoices && (
        <TaxPreparerCreateInvoiceModal
          onClose={() => setIsCreateModalOpen(false)}
          onInvoiceCreated={handleInvoiceCreated}
        />
      )}

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
