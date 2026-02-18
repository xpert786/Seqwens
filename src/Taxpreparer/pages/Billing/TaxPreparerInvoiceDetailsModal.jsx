import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
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
        // If clientId is not provided, try to fetch invoice using firm endpoint as fallback
        console.warn('Client ID not provided, attempting fallback fetch');
        fetchInvoiceDetailsFallback();
      }
    }
  }, [isOpen, invoiceId, clientId]);

  // Reset state when modal closes
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

      if (!clientId) {
        throw new Error('Client ID is required');
      }

      // Use the new tax preparer endpoint
      const response = await taxPreparerClientAPI.getClientInvoiceDetail(clientId, invoiceId);

      if (response.success && response.data) {
        const invoiceData = response.data.invoice || response.data;

        // Ensure invoice_items is properly set
        if (invoiceData && !invoiceData.invoice_items && response.data.invoice?.invoice_items) {
          invoiceData.invoice_items = response.data.invoice.invoice_items;
        }

        console.log('Invoice data (tax preparer endpoint):', invoiceData);
        console.log('Invoice items:', invoiceData?.invoice_items);

        setInvoice(invoiceData);
        setPayments(response.data.payments || []);
      } else {
        throw new Error(response.message || 'Failed to fetch invoice details');
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      setError(handleAPIError(err) || 'Failed to load invoice details. Please try again.');
      toast.error(handleAPIError(err) || 'Failed to load invoice details', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fallback method if clientId is not available (uses firm endpoint)
  const fetchInvoiceDetailsFallback = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetchWithCors(`${API_BASE_URL}/firm/invoices/${invoiceId}/`, {
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
        // Handle the response structure: data.invoice, data.payments
        // The invoice object has client as a number (ID), not an object
        const invoiceData = result.data.invoice || result.data;

        // Ensure invoice_items is properly set
        if (invoiceData && !invoiceData.invoice_items && result.data.invoice?.invoice_items) {
          invoiceData.invoice_items = result.data.invoice.invoice_items;
        }

        console.log('Invoice data (fallback endpoint):', invoiceData);
        console.log('Invoice items:', invoiceData?.invoice_items);

        setInvoice(invoiceData);
        setPayments(result.data.payments || []);

        // If we have client ID from invoice but didn't have it before, we can use it
        // for future tax preparer endpoint calls if needed
        if (invoiceData.client && typeof invoiceData.client === 'number' && !clientId) {
          console.log('Found client ID in invoice response:', invoiceData.client);
        }
      } else {
        throw new Error(result.message || 'Failed to fetch invoice details');
      }
    } catch (err) {
      console.error('Error fetching invoice details (fallback):', err);
      setError(handleAPIError(err) || 'Failed to load invoice details. Please try again.');
      toast.error(handleAPIError(err) || 'Failed to load invoice details', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
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

  if (!isOpen) return null;

  // Extract invoice items - handle both array and single item cases
  const invoiceItems = invoice?.invoice_items && Array.isArray(invoice.invoice_items) && invoice.invoice_items.length > 0
    ? invoice.invoice_items
    : [];

  // Debug logging
  if (invoice) {
    console.log('Current invoice:', invoice);
    console.log('Invoice items:', invoice.invoice_items);
    console.log('Extracted invoiceItems:', invoiceItems);
  }
  const totalAmount = parseFloat(invoice?.amount || invoice?.total_amount || 0);
  const taxAmount = parseFloat(invoice?.tax_amount || 0);
  const subtotal = totalAmount - taxAmount;
  const paidAmount = parseFloat(invoice?.paid_amount || 0);
  const remainingAmount = parseFloat(invoice?.remaining_amount || (totalAmount - paidAmount));

  // Use formatted dates from API if available
  const issueDate = invoice?.formatted_issue_date || invoice?.issue_date;
  const dueDate = invoice?.formatted_due_date || invoice?.due_date;
  const paidDate = invoice?.paid_date;

  // Use formatted amounts from API if available
  const formattedTotalAmount = invoice?.formatted_amount || formatCurrency(totalAmount);
  const formattedPaidAmount = invoice?.formatted_paid_amount || formatCurrency(paidAmount);

  // Status information
  const statusDisplay = invoice?.status_display || invoice?.status || 'Draft';
  const statusColor = invoice?.status_color || 'gray';

  // Created by information
  const createdByName = invoice?.created_by_name;
  return (
    <div
      className="fixed inset-0 z-[1200] flex items-start justify-center p-4 bg-black/50 overflow-y-auto sm:pt-24 pt-20"
      onClick={onClose}
    >
      <div
        className="bg-white !rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto sm:my-0"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#32B582]"></div>
            <p className="mt-4 text-sm text-gray-600">Loading invoice details...</p>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <strong>Error:</strong> {error}
              <button
                className="ml-4 text-sm underline"
                onClick={fetchInvoiceDetails}
              >
                Retry
              </button>
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        ) : invoice ? (
          <>
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-[#E8F0FF]">
              <div>
                <h4 className="text-xl sm:text-2xl font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>
                  Invoice {invoice.invoice_number || `#${invoice.id}`}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {statusDisplay && (
                    <span
                      className="px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full border border-opacity-50 uppercase tracking-wider"
                      style={{
                        backgroundColor: statusColor === 'green' ? '#D1FAE5' :
                          statusColor === 'yellow' ? '#FEF3C7' :
                            statusColor === 'red' ? '#FEE2E2' : '#F3F4F6',
                        color: statusColor === 'green' ? '#065F46' :
                          statusColor === 'yellow' ? '#92400E' :
                            statusColor === 'red' ? '#991B1B' : '#374151',
                        borderColor: statusColor === 'green' ? '#A7F3D0' :
                          statusColor === 'yellow' ? '#FDE68A' :
                            statusColor === 'red' ? '#FECACA' : '#D1D5DB'
                      }}
                    >
                      {statusDisplay}
                    </span>
                  )}
                  <p className="text-xs sm:text-sm text-gray-400 font-[BasisGrotesquePro]">Invoice details</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
              <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8">
                <div className="flex-1 space-y-1">
                  {invoice.firm_name && (
                    <p className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro] uppercase tracking-tight">
                      {invoice.firm_name}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 space-y-0.5 font-[BasisGrotesquePro]">
                    {invoice.firm_address && <p>{invoice.firm_address}</p>}
                    {invoice.firm_city && (
                      <p>{invoice.firm_city}, {invoice.firm_state || ''} {invoice.firm_zip || ''}</p>
                    )}
                    {invoice.firm_phone && <p>Phone: {invoice.firm_phone}</p>}
                    {invoice.firm_email && <p className="break-all">{invoice.firm_email}</p>}
                  </div>
                  {createdByName && (
                    <p className="text-[10px] text-gray-400 mt-2 italic" style={{ fontFamily: "BasisGrotesquePro" }}>
                      Created by: {createdByName}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:items-end text-left sm:text-right gap-3 pr-4 sm:pr-0">
                  <h6 className="text-2xl font-black text-gray-300 font-[BasisGrotesquePro] hidden sm:block">INVOICE</h6>
                  <div className="space-y-1 bg-gray-50/50 p-3 sm:p-0 rounded-lg sm:bg-transparent border border-gray-100 sm:border-0">
                    <p className="text-xs text-gray-500" style={{ fontFamily: "BasisGrotesquePro" }}>
                      <strong className="text-gray-700 font-bold uppercase tracking-widest text-[10px] mr-1">Issue:</strong> {issueDate || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500" style={{ fontFamily: "BasisGrotesquePro" }}>
                      <strong className="text-gray-700 font-bold uppercase tracking-widest text-[10px] mr-1">Due:</strong> {dueDate || 'N/A'}
                    </p>
                    {paidDate && (
                      <p className="text-xs text-gray-500" style={{ fontFamily: "BasisGrotesquePro" }}>
                        <strong className="text-gray-700 font-bold uppercase tracking-widest text-[10px] mr-1">Paid:</strong> {formatDate(paidDate)}
                      </p>
                    )}
                    {invoice.is_overdue && (
                      <div className="inline-block bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded mt-1">
                        Overdue
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 mb-8"></div>

              {/* Bill To */}
              <div className="mb-8">
                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 font-[BasisGrotesquePro]">Bill To</h5>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">
                    {invoice.client_name || 'Client'}
                  </p>
                  <div className="text-xs text-gray-500 space-y-0.5 font-[BasisGrotesquePro]">
                    {invoice.client_email && <p className="break-all">{invoice.client_email}</p>}
                    {invoice.client_phone_number && <p>{invoice.client_phone_number}</p>}
                    {invoice.client_address_details?.full_address ? (
                      <p>{invoice.client_address_details.full_address}</p>
                    ) : invoice.client_address ? (
                      <p>{invoice.client_address}</p>
                    ) : invoice.client_address_details ? (
                      <>
                        {invoice.client_address_details.street_address && (
                          <p>{invoice.client_address_details.street_address}</p>
                        )}
                        {(invoice.client_address_details.city || invoice.client_address_details.state || invoice.client_address_details.zip_code) && (
                          <p>{[invoice.client_address_details.city, invoice.client_address_details.state, invoice.client_address_details.zip_code].filter(Boolean).join(', ')}</p>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 mb-8"></div>

              {/* Services */}
              <div className="mb-8">
                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 font-[BasisGrotesquePro]">Services</h5>

                <div className="hidden sm:flex font-bold p-3 mb-1 rounded-lg bg-gray-50 items-center">
                  <div className="flex-1 text-[10px] text-gray-500 uppercase tracking-widest font-[BasisGrotesquePro]">Description</div>
                  <div className="w-16 text-center text-[10px] text-gray-500 uppercase tracking-widest font-[BasisGrotesquePro]">Qty</div>
                  <div className="w-24 text-center text-[10px] text-gray-500 uppercase tracking-widest font-[BasisGrotesquePro]">Rate</div>
                  <div className="w-24 text-right text-[10px] text-gray-500 uppercase tracking-widest font-[BasisGrotesquePro]">Amount</div>
                </div>

                <div className="divide-y divide-gray-50">
                  {(invoiceItems.length > 0 ? invoiceItems : [{ description: invoice.description || 'Service', value: totalAmount }]).map((item, index) => {
                    const itemValue = typeof item.value === 'number' ? item.value : parseFloat(item.value || item.amount || 0);
                    return (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center py-3 sm:px-3">
                        <div className="flex-1 text-sm font-medium text-gray-900 font-[BasisGrotesquePro] mb-1 sm:mb-0">
                          {item.description}
                        </div>
                        <div className="flex items-center justify-between sm:justify-start gap-4">
                          <div className="w-16 text-left sm:text-center text-xs text-gray-500 font-[BasisGrotesquePro]">
                            <span className="sm:hidden font-bold mr-1">Qty:</span>1
                          </div>
                          <div className="w-24 text-left sm:text-center text-xs text-gray-500 font-[BasisGrotesquePro]">
                            <span className="sm:hidden font-bold mr-1">Rate:</span>{formatCurrency(itemValue)}
                          </div>
                          <div className="w-24 text-right text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">
                            {formatCurrency(itemValue)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-col items-end space-y-2 pr-0 sm:pr-3">
                  <div className="flex justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest pr-4 sm:pr-20">Subtotal</span>
                    <span className="text-sm font-medium text-gray-700 w-24 text-right">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest pr-4 sm:pr-20">Tax (0%)</span>
                    <span className="text-sm font-medium text-gray-700 w-24 text-right">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="w-full sm:w-auto h-px bg-gray-200 my-2 block sm:ml-auto" style={{ minWidth: '200px' }}></div>
                  <div className="flex justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <span className="text-sm font-black text-gray-900 uppercase tracking-tight pr-4 sm:pr-20">Total</span>
                    <span className="text-lg font-black text-[#F97316] w-24 text-right">{formattedTotalAmount}</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 mb-8"></div>

              {/* Payment Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-white to-orange-50/30 p-4 rounded-xl border border-orange-100 shadow-sm">
                  <h6 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 font-[BasisGrotesquePro]">Outstanding Balance</h6>
                  <p className="text-2xl font-black text-[#F56D2D] font-[BasisGrotesquePro]">{formatCurrency(remainingAmount)}</p>
                  {invoice.is_overdue && (
                    <p className="text-[9px] text-red-600 font-bold uppercase tracking-tight mt-1 animate-pulse">OVERDUE INVOICE</p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-white to-green-50/30 p-4 rounded-xl border border-green-100 shadow-sm">
                  <h6 className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1 font-[BasisGrotesquePro]">Amount Paid</h6>
                  <p className="text-2xl font-black text-green-700 font-[BasisGrotesquePro]">{formattedPaidAmount}</p>
                  <p className="text-[9px] text-green-600 font-medium uppercase tracking-tight mt-1">Total received so far</p>
                </div>
              </div>

              {/* Payment History */}
              {payments && payments.length > 0 && (
                <div className="mb-8 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 font-[BasisGrotesquePro]">Payment History</h5>
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">
                              {formatCurrency(payment.amount)}
                            </p>
                            <span className="text-[9px] bg-green-100 text-green-700 font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">
                              Success
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-[BasisGrotesquePro] mt-0.5">
                            {payment.payment_method_display || payment.payment_method || 'N/A'} • {formatDate(payment.payment_date)}
                          </p>
                        </div>
                        {payment.transaction_id && (
                          <div className="text-right hidden sm:block">
                            <p className="text-[9px] text-gray-300 font-mono uppercase">TxID: {payment.transaction_id.slice(0, 12)}...</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="h-px bg-gray-100 mb-8"></div>

              {/* Notes & Terms */}
              <div className="space-y-6 mb-8 pr-2">
                {invoice.notes && (
                  <div>
                    <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 font-[BasisGrotesquePro]">Notes</h6>
                    <p className="text-xs text-gray-600 leading-relaxed font-[BasisGrotesquePro]">
                      {invoice.notes}
                    </p>
                  </div>
                )}
                <div>
                  <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 font-[BasisGrotesquePro]">Payment Terms</h6>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-[BasisGrotesquePro]">
                    Payment is due within 30 days of invoice date. Late payments may be subject to a 1.5% monthly service charge.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 p-5 sm:p-6 border-t border-[#E8F0FF] bg-gray-50/50 mt-auto">
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-white border border-gray-300 !rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all hidden sm:block"
              >
                Print
              </button>
              <button
                onClick={onClose}
                className="px-8 py-2.5 bg-gray-900 text-white !rounded-lg text-sm font-bold shadow-lg shadow-gray-200 transition-all active:scale-95 w-full sm:w-auto"
              >
                Close Details
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
