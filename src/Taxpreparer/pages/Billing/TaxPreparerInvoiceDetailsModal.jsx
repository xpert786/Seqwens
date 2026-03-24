import React, { useState, useEffect } from 'react';
import { FiX, FiPrinter, FiDownload, FiCheckCircle, FiAlertTriangle, FiClock, FiFileText } from 'react-icons/fi';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { taxPreparerClientAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const API_BASE_URL = getApiBaseUrl();

export default function TaxPreparerInvoiceDetailsModal({ isOpen, onClose, invoiceId, clientId }) {
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && invoiceId) {
      if (clientId) {
        fetchInvoiceDetails();
      } else {
        console.warn('Client ID not provided, attempting fallback fetch');
        fetchInvoiceDetailsFallback();
      }
    }
  }, [isOpen, invoiceId, clientId]);

  useEffect(() => {
    if (!isOpen) {
      setInvoice(null);
      setPayments([]);
      setError(null);
    }
  }, [isOpen]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!clientId) throw new Error('Client ID is required');
      const response = await taxPreparerClientAPI.getClientInvoiceDetail(clientId, invoiceId);
      if (response.success && response.data) {
        const invoiceData = response.data.invoice || response.data;
        if (invoiceData && !invoiceData.invoice_items && response.data.invoice?.invoice_items) {
          invoiceData.invoice_items = response.data.invoice.invoice_items;
        }
        setInvoice(invoiceData);
        setPayments(response.data.payments || []);
      } else {
        throw new Error(response.message || 'Failed to fetch invoice details');
      }
    } catch (err) {
      setError(handleAPIError(err) || 'Failed to load invoice details. Please try again.');
      toast.error(handleAPIError(err) || 'Failed to load invoice details', { position: 'top-right', autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetailsFallback = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAccessToken();
      if (!token) throw new Error('No authentication token found');
      const response = await fetchWithCors(`${API_BASE_URL}/firm/invoices/${invoiceId}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && result.data) {
        const invoiceData = result.data.invoice || result.data;
        if (invoiceData && !invoiceData.invoice_items && result.data.invoice?.invoice_items) {
          invoiceData.invoice_items = result.data.invoice.invoice_items;
        }
        setInvoice(invoiceData);
        setPayments(result.data.payments || []);
      } else {
        throw new Error(result.message || 'Failed to fetch invoice details');
      }
    } catch (err) {
      setError(handleAPIError(err) || 'Failed to load invoice details. Please try again.');
      toast.error(handleAPIError(err) || 'Failed to load invoice details', { position: 'top-right', autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numAmount);
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

  if (!isOpen) return null;

  const invoiceItems = invoice?.invoice_items && Array.isArray(invoice.invoice_items) && invoice.invoice_items.length > 0
    ? invoice.invoice_items : [];

  const totalAmount = parseFloat(invoice?.amount || invoice?.total_amount || 0);
  const taxAmount = parseFloat(invoice?.tax_amount || 0);
  const subtotal = totalAmount - taxAmount;
  const paidAmount = parseFloat(invoice?.paid_amount || 0);
  const remainingAmount = parseFloat(invoice?.remaining_amount || (totalAmount - paidAmount));

  const issueDate = invoice?.formatted_issue_date || invoice?.issue_date;
  const dueDate = invoice?.formatted_due_date || invoice?.due_date;
  const paidDate = invoice?.paid_date;
  const formattedTotalAmount = invoice?.formatted_amount || formatCurrency(totalAmount);
  const formattedPaidAmount = invoice?.formatted_paid_amount || formatCurrency(paidAmount);
  const statusDisplay = invoice?.status_display || invoice?.status || 'Draft';
  const statusColor = invoice?.status_color || 'gray';
  const createdByName = invoice?.created_by_name;
  const isPaid = statusColor === 'green';
  const isOverdue = invoice?.is_overdue;
  const isPending = statusColor === 'yellow';

  const getStatusConfig = () => {
    if (isPaid) return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0', icon: <FiCheckCircle size={13} /> };
    if (isOverdue) return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA', icon: <FiAlertTriangle size={13} /> };
    if (isPending) return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', icon: <FiClock size={13} /> };
    return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB', icon: <FiFileText size={13} /> };
  };
  const statusConfig = getStatusConfig();

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto pt-16"
      onClick={onClose}
    >
      <div
        className="bg-white !rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
      >
        {/* Loading State */}
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center gap-4">
            <div className="relative w-14 py-2">
              <div className="absolute inset-0 rounded-full border-4 border-[#E8F0FF]"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#3AD6F2] animate-spin"></div>
            </div>
            <p className="text-sm text-gray-500 font-[BasisGrotesquePro] font-medium">Loading invoice details...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <FiAlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700 font-[BasisGrotesquePro]">Failed to load invoice</p>
                <p className="text-xs text-red-600 font-[BasisGrotesquePro] mt-0.5">{error}</p>
                <button onClick={fetchInvoiceDetails} className="mt-2 text-xs font-bold text-red-700 underline underline-offset-2 hover:text-red-800">
                  Try again
                </button>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 !rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all font-[BasisGrotesquePro]">
                Close
              </button>
            </div>
          </div>
        ) : invoice ? (
          <>
            {/* ── Header ── */}
            <div className="flex justify-between items-start p-6 border-b border-[#E8F0FF]">
              <div className="flex items-start gap-4">
                {/* Invoice Icon */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', border: '1.5px solid #FDBA74' }}>
                  <FiFileText size={20} style={{ color: '#F97316' }} />
                </div>
                <div>
                  <h4 className="text-xl font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>
                    Invoice {invoice.invoice_number || `#${invoice.id}`}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {statusDisplay && (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full uppercase tracking-wider"
                        style={{ backgroundColor: statusConfig.bg, color: statusConfig.text, border: `1.5px solid ${statusConfig.border}` }}
                      >
                        {statusConfig.icon}
                        {statusDisplay}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 font-[BasisGrotesquePro]">Invoice details</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 !rounded-xl transition-all ml-2 flex-shrink-0"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-220px)] custom-scrollbar space-y-6">

              {/* Firm & Dates Row */}
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Firm Info */}
                <div className="flex-1 bg-gray-50/60 rounded-xl p-4 border border-[#E8F0FF]">
                  {invoice.firm_name && (
                    <p className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro] uppercase tracking-tight mb-1">
                      {invoice.firm_name}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 space-y-0.5 font-[BasisGrotesquePro]">
                    {invoice.firm_address && <p>{invoice.firm_address}</p>}
                    {invoice.firm_city && (
                      <p>{invoice.firm_city}{invoice.firm_state ? `, ${invoice.firm_state}` : ''} {invoice.firm_zip || ''}</p>
                    )}
                    {invoice.firm_phone && <p>{invoice.firm_phone}</p>}
                    {invoice.firm_email && <p className="break-all">{invoice.firm_email}</p>}
                  </div>
                  {createdByName && (
                    <p className="text-[10px] text-gray-400 mt-2 italic font-[BasisGrotesquePro]">Created by: {createdByName}</p>
                  )}
                </div>

                {/* Dates */}
                <div className="sm:w-44 bg-gray-50/60 rounded-xl p-4 border border-[#E8F0FF] space-y-2.5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Date Info</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-[BasisGrotesquePro]">Issued</span>
                      <span className="text-xs text-gray-700 font-semibold font-[BasisGrotesquePro]">{issueDate || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-[BasisGrotesquePro]">Due</span>
                      <span className={`text-xs font-semibold font-[BasisGrotesquePro] ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                        {dueDate || 'N/A'}
                      </span>
                    </div>
                    {paidDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-[BasisGrotesquePro]">Paid</span>
                        <span className="text-xs text-green-600 font-semibold font-[BasisGrotesquePro]">{formatDate(paidDate)}</span>
                      </div>
                    )}
                  </div>
                  {isOverdue && (
                    <div className="flex items-center gap-1 bg-red-50 border border-red-100 rounded-lg px-2 py-1">
                      <FiAlertTriangle size={10} className="text-red-500 flex-shrink-0" />
                      <span className="text-[9px] text-red-600 font-black uppercase tracking-tight">Overdue</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bill To */}
              <div className="bg-gray-50/60 rounded-xl p-4 border border-[#E8F0FF]">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 font-[BasisGrotesquePro]">Bill To</p>
                <p className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">{invoice.client_name || 'Client'}</p>
                <div className="text-xs text-gray-500 space-y-0.5 font-[BasisGrotesquePro] mt-1">
                  {invoice.client_email && <p className="break-all">{invoice.client_email}</p>}
                  {invoice.client_phone_number && <p>{invoice.client_phone_number}</p>}
                  {invoice.client_address_details?.full_address ? (
                    <p>{invoice.client_address_details.full_address}</p>
                  ) : invoice.client_address ? (
                    <p>{invoice.client_address}</p>
                  ) : invoice.client_address_details ? (
                    <>
                      {invoice.client_address_details.street_address && <p>{invoice.client_address_details.street_address}</p>}
                      {(invoice.client_address_details.city || invoice.client_address_details.state || invoice.client_address_details.zip_code) && (
                        <p>{[invoice.client_address_details.city, invoice.client_address_details.state, invoice.client_address_details.zip_code].filter(Boolean).join(', ')}</p>
                      )}
                    </>
                  ) : null}
                </div>
              </div>

              {/* Services Table */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 font-[BasisGrotesquePro]">Services</p>
                <div className="border border-[#E8F0FF] rounded-xl overflow-hidden">
                  {/* Table Header */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#F8FAFF]">
                    <div className="col-span-6 text-[10px] text-gray-500 uppercase tracking-widest font-black font-[BasisGrotesquePro]">Description</div>
                    <div className="col-span-2 text-center text-[10px] text-gray-500 uppercase tracking-widest font-black font-[BasisGrotesquePro]">Qty</div>
                    <div className="col-span-2 text-center text-[10px] text-gray-500 uppercase tracking-widest font-black font-[BasisGrotesquePro]">Rate</div>
                    <div className="col-span-2 text-right text-[10px] text-gray-500 uppercase tracking-widest font-black font-[BasisGrotesquePro]">Amount</div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-[#F0F4FF]">
                    {(invoiceItems.length > 0 ? invoiceItems : [{ description: invoice.description || 'Service', value: totalAmount }]).map((item, index) => {
                      const itemValue = typeof item.value === 'number' ? item.value : parseFloat(item.value || item.amount || 0);
                      return (
                        <div key={index} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 px-4 py-3 hover:bg-[#FAFBFF] transition-colors">
                          <div className="sm:col-span-6 text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">{item.description}</div>
                          <div className="sm:col-span-2 text-center text-xs text-gray-500 font-[BasisGrotesquePro]">
                            <span className="sm:hidden text-[10px] text-gray-400 font-bold mr-1">Qty:</span>1
                          </div>
                          <div className="sm:col-span-2 text-center text-xs text-gray-500 font-[BasisGrotesquePro]">
                            <span className="sm:hidden text-[10px] text-gray-400 font-bold mr-1">Rate:</span>{formatCurrency(itemValue)}
                          </div>
                          <div className="sm:col-span-2 text-right text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">{formatCurrency(itemValue)}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-[#E8F0FF] bg-[#F8FAFF] px-4 py-3 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Subtotal</span>
                      <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Tax (0%)</span>
                      <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="h-px bg-[#E8F0FF] my-1"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-gray-900 uppercase tracking-tight font-[BasisGrotesquePro]">Total</span>
                      <span className="text-xl font-black font-[BasisGrotesquePro]" style={{ color: '#F97316' }}>{formattedTotalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Outstanding */}
                <div className="rounded-xl p-4 border"
                  style={{ background: 'linear-gradient(135deg, #FFFBF5 0%, #FFF7ED 100%)', borderColor: '#FDBA74' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 font-[BasisGrotesquePro]" style={{ color: '#C2410C' }}>
                    Outstanding Balance
                  </p>
                  <p className="text-2xl font-black font-[BasisGrotesquePro]" style={{ color: '#F56D2D' }}>
                    {formatCurrency(remainingAmount)}
                  </p>
                  {isOverdue ? (
                    <div className="flex items-center gap-1 mt-2">
                      <FiAlertTriangle size={10} className="text-red-500" />
                      <p className="text-[9px] text-red-600 font-black uppercase tracking-tight">Overdue invoice</p>
                    </div>
                  ) : (
                    <p className="text-[9px] text-orange-400 font-medium uppercase tracking-tight mt-1">Remaining balance</p>
                  )}
                </div>

                {/* Paid */}
                <div className="rounded-xl p-4 border"
                  style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', borderColor: '#86EFAC' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 font-[BasisGrotesquePro]" style={{ color: '#15803D' }}>
                    Amount Paid
                  </p>
                  <p className="text-2xl font-black font-[BasisGrotesquePro]" style={{ color: '#16A34A' }}>
                    {formattedPaidAmount}
                  </p>
                  <p className="text-[9px] text-green-500 font-medium uppercase tracking-tight mt-1">Total received so far</p>
                </div>
              </div>

              {/* Payment History */}
              {payments && payments.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 font-[BasisGrotesquePro]">Payment History</p>
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div key={payment.id}
                        className="flex justify-between items-center bg-white border border-[#E8F0FF] rounded-xl px-4 py-3 hover:bg-[#FAFBFF] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-50 border border-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FiCheckCircle size={14} className="text-green-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">{formatCurrency(payment.amount)}</p>
                            <p className="text-[10px] text-gray-500 font-[BasisGrotesquePro]">
                              {payment.payment_method_display || payment.payment_method || 'N/A'} · {formatDate(payment.payment_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-green-100 text-green-700 font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                            Success
                          </span>
                          {payment.transaction_id && (
                            <p className="text-[9px] text-gray-300 font-mono uppercase hidden sm:block">
                              #{payment.transaction_id.slice(0, 10)}…
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes & Terms */}
              <div className="space-y-4">
                {invoice.notes && (
                  <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-4">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 font-[BasisGrotesquePro]">Notes</p>
                    <p className="text-xs text-gray-600 leading-relaxed font-[BasisGrotesquePro]">{invoice.notes}</p>
                  </div>
                )}
                <div className="bg-gray-50/60 border border-[#E8F0FF] rounded-xl p-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-[BasisGrotesquePro]">Payment Terms</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-[BasisGrotesquePro]">
                    Payment is due within 30 days of invoice date. Late payments may be subject to a 1.5% monthly service charge.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-[#E8F0FF] bg-[#FAFBFF]">
              <button
                onClick={() => window.print()}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E8F0FF] !rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-200 transition-all font-[BasisGrotesquePro]"
              >
                <FiPrinter size={14} />
                Print
              </button>
              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white border border-[#E8F0FF] !rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all font-[BasisGrotesquePro] active:scale-95"
                >
                  Close
                </button>
                <button
                  onClick={onClose}
                  className="px-7 py-2.5 text-white !rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 font-[BasisGrotesquePro]"
                  style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', boxShadow: '0 4px 14px rgba(249,115,22,0.3)' }}
                >
                  Done
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E8F0FF; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #C7D7FF; }
      `}</style>
    </div>
  );
}
