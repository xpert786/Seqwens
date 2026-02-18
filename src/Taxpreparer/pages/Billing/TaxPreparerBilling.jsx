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
    <div className="p-4 sm:p-6 !bg-[#F3F7FF]" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h4 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-gray-900 font-[BasisGrotesquePro]">
            Billing & Invoicing
          </h4>
          <p className="text-sm sm:text-base text-gray-500 font-[BasisGrotesquePro]">
            {activeTab === 'clients' ? 'Manage invoices and track payments' : 'View and pay for your portion of platform usage'}
          </p>
        </div>
        {canCreateInvoices && activeTab === 'clients' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 !rounded-lg flex items-center justify-center gap-2 text-white font-medium shadow-sm transition-transform active:scale-95"
            style={{ backgroundColor: '#F97316' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Invoice</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('clients')}
          className={`px-4 sm:px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'clients'
            ? 'border-[#3AD6F2] text-[#3AD6F2]'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          Client Invoices
        </button>
        <button
          onClick={() => setActiveTab('platform')}
          className={`px-4 sm:px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'platform'
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
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
            {[
              { id: 'total', label: 'Total Invoices', val: summary.total_invoices || 0, icon: <FiFileText size={18} />, bg: 'bg-blue-50', text: 'text-blue-500' },
              { id: 'outstanding', label: 'Outstanding', val: formatCurrency(summary.outstanding_balance || 0), icon: <FiAlertCircle size={18} />, bg: 'bg-orange-50', text: 'text-orange-500' },
              { id: 'paid', label: 'Paid This Year', val: formatCurrency(summary.paid_this_year || 0), icon: <FiDollarSign size={18} />, bg: 'bg-green-50', text: 'text-green-500' },
              { id: 'count', label: 'Outstanding Count', val: summary.outstanding_count || 0, icon: <FiClock size={18} />, bg: 'bg-purple-50', text: 'text-purple-500' },
              { id: 'overdue', label: 'Overdue Count', val: summary.overdue_count || 0, icon: <FiAlertCircle size={18} />, bg: 'bg-red-50', text: 'text-red-500' },
              { id: 'next', label: 'Next Due Date', val: summary.next_due_date ? formatDate(summary.next_due_date) : 'N/A', icon: <FiCalendar size={18} />, bg: 'bg-indigo-50', text: 'text-indigo-500' },
            ].map((card) => (
              <div key={card.id} className="bg-white rounded-xl border border-[#E8F0FF] p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 transition-all hover:shadow-md">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${card.bg} flex items-center justify-center ${card.text} flex-shrink-0`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-[10px] sm:text-[11px] font-medium text-gray-400 mb-0 uppercase tracking-wider font-[BasisGrotesquePro]">
                    {card.label}
                  </p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 m-0 font-[BasisGrotesquePro]">
                    {card.val}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-64">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Filter by Status</label>
                <select
                  className="w-full px-4 py-2 bg-white border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] transition-all font-[BasisGrotesquePro]"
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
          <div className="bg-white rounded-xl border border-[#E8F0FF] shadow-sm overflow-hidden">
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#3AD6F2]"></div>
                <p className="mt-4 text-sm text-gray-500 font-[BasisGrotesquePro]">Loading invoices...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600 font-[BasisGrotesquePro]">
                <p className="mb-4">{error}</p>
                <button
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg border border-red-100 font-medium"
                  onClick={fetchInvoices}
                >
                  Retry
                </button>
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiFileText size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-500 mb-6 font-[BasisGrotesquePro]">No invoices found</p>
                {canCreateInvoices && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-orange-600 transition-all font-medium"
                  >
                    Create Your First Invoice
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-[#E8F0FF]">
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest font-[BasisGrotesquePro]">Invoice #</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest font-[BasisGrotesquePro]">Client</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest font-[BasisGrotesquePro]">Dates</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest font-[BasisGrotesquePro]">Amount</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest font-[BasisGrotesquePro]">Status</th>
                        <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest font-[BasisGrotesquePro]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoices.map((invoice) => {
                        const clientId = invoice.client_id ||
                          (typeof invoice.client === 'number' ? invoice.client : null) ||
                          invoice.client?.id ||
                          invoice.taxpayer_id ||
                          invoice.taxpayer?.id;

                        return (
                          <tr key={invoice.id} className="hover:bg-[#F9FBFF] transition-colors">
                            <td className="py-4 px-6">
                              <span className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">{invoice.invoice_number || `#${invoice.id}`}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                {invoice.client_name || invoice.client?.name || 'N/A'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-gray-500">Issued: {formatDate(invoice.issue_date)}</span>
                                <span className="text-xs font-medium text-gray-700">Due: {formatDate(invoice.due_date)}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">
                                {formatCurrency(invoice.total_amount || invoice.amount || 0)}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {getStatusBadge(invoice.status)}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => {
                                  setSelectedInvoiceId(invoice.id);
                                  setSelectedClientId(clientId || null);
                                  setIsInvoiceDetailsModalOpen(true);
                                }}
                                className="px-4 py-1.5 rounded-lg text-[#32B582] hover:bg-[#32B582]/10 transition-colors text-sm font-bold font-[BasisGrotesquePro]"
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

                {/* Mobile view */}
                <div className="md:hidden divide-y divide-[#E8F0FF]">
                  {invoices.map((invoice) => {
                    const clientId = invoice.client_id ||
                      (typeof invoice.client === 'number' ? invoice.client : null) ||
                      invoice.client?.id ||
                      invoice.taxpayer_id ||
                      invoice.taxpayer?.id;

                    return (
                      <div
                        key={invoice.id}
                        className="p-4 active:bg-gray-50 transition-colors"
                        onClick={() => {
                          setSelectedInvoiceId(invoice.id);
                          setSelectedClientId(clientId || null);
                          setIsInvoiceDetailsModalOpen(true);
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-bold text-gray-900 m-0 font-[BasisGrotesquePro]">
                              {invoice.invoice_number || `#${invoice.id}`}
                            </p>
                            <p className="text-xs text-gray-500 m-0 font-[BasisGrotesquePro]">
                              {invoice.client_name || invoice.client?.name || 'N/A'}
                            </p>
                          </div>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-gray-400 m-0 uppercase font-bold tracking-tight">Due Date</p>
                            <p className="text-xs font-semibold text-gray-700 m-0">{formatDate(invoice.due_date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-[#F97316] m-0">
                              {formatCurrency(invoice.total_amount || invoice.amount || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
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
              <div className="bg-white rounded-xl border border-[#E8F0FF] p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">Split Billing Estimate</h3>
                    <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">Period: {platformBilling.billing_summary.period_start} to {platformBilling.billing_summary.period_end}</p>
                  </div>
                  <div className="w-full sm:w-auto p-3 sm:p-0 bg-orange-50 sm:bg-transparent rounded-lg sm:text-right border border-orange-100 sm:border-0 shadow-sm sm:shadow-none">
                    <p className="text-xs text-orange-600 sm:text-gray-500 font-bold sm:font-normal uppercase sm:capitalize tracking-wider sm:tracking-normal">Estimated Total</p>
                    <p className="text-2xl sm:text-3xl font-black text-[#F97316] font-[BasisGrotesquePro] leading-tight">${platformBilling.billing_summary.estimated_monthly_total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {platformBilling.sections.map((section) => (
                    <div key={section.id} className="border border-[#E8F0FF] rounded-xl p-4 sm:p-5 bg-gradient-to-br from-white to-gray-50 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base font-[BasisGrotesquePro]">{section.title}</h4>
                        <span className={`text-[9px] sm:text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-sm ${section.is_covered ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {section.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed min-h-[32px]">{section.description}</p>
                      <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-auto">
                        <div className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider">PORTION</div>
                        <div className="text-base sm:text-lg font-black text-gray-900 font-[BasisGrotesquePro]">${section.portion_estimate.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {platformBilling.billing_summary.estimated_monthly_total > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full sm:w-auto sm:float-right px-8 py-3.5 bg-[#F97316] text-white rounded-lg font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 active:scale-95"
                      style={{ borderRadius: '10px' }}
                    >
                      Pay Outstanding Portion
                    </button>
                    <div className="clear-both"></div>
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
        <div
          className="fixed inset-0 z-[1200] flex items-start justify-center p-4 bg-black/50 overflow-y-auto sm:pt-24 pt-20"
          onClick={() => !paymentProcessing && setShowPaymentModal(false)}
        >
          <div
            className="bg-white !rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-[#E8F0FF]">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">Platform Payment</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 font-[BasisGrotesquePro]">One-time payment for your portion</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                disabled={paymentProcessing}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 sm:p-8">
              <div className="mb-6 p-4 bg-orange-50 border border-orange-100 !rounded-xl flex justify-between items-center shadow-sm">
                <span className="text-orange-800 font-bold uppercase text-xs tracking-wider">Amount to Pay</span>
                <span className="text-2xl sm:text-3xl font-black text-orange-900 font-[BasisGrotesquePro]">${platformBilling?.billing_summary.estimated_monthly_total.toFixed(2)}</span>
              </div>

              <StripePaymentForm
                stripePublishableKey={stripeKey}
                onSubmit={handlePlatformPayment}
                onCancel={() => setShowPaymentModal(false)}
                processing={paymentProcessing}
              />
            </div>
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
