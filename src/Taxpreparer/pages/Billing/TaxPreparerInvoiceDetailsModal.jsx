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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
        style={{
          border: "1px solid #E8F0FF",
          borderRadius: "12px",
          zIndex: 10000
        }}
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
          <div className="p-6 pt-12">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors z-10"
              aria-label="Close"
            >
              <FiX size={28} />
            </button>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h5 className="text-xl font-bold text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>
                    Invoice {invoice.invoice_number || `#${invoice.id}`}
                  </h5>
                  {statusDisplay && (
                    <span
                      className="px-3 py-1 text-xs font-semibold rounded-full border"
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
                </div>
                <p className="text-gray-600 text-sm mb-3" style={{ fontFamily: "BasisGrotesquePro" }}>
                  Invoice details and payment information
                </p>

                {invoice.firm_name && (
                  <p className="text-xs font-semibold text-[#3B4A66] mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                    {invoice.firm_name}
                  </p>
                )}
                {invoice.firm_address && (
                  <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                    {invoice.firm_address}
                  </p>
                )}
                {invoice.firm_city && (
                  <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                    {invoice.firm_city}, {invoice.firm_state || ''} {invoice.firm_zip || ''}
                  </p>
                )}
                {invoice.firm_phone && (
                  <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                    Phone: {invoice.firm_phone}
                  </p>
                )}
                {invoice.firm_email && (
                  <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                    Email: {invoice.firm_email}
                  </p>
                )}
                {createdByName && (
                  <p className="text-xs text-gray-500 mt-2" style={{ fontFamily: "BasisGrotesquePro" }}>
                    Created by: {createdByName}
                  </p>
                )}
              </div>

              <div className="text-right">
                <h6 className="text-lg font-semibold text-[#3B4A66] mb-2" style={{ fontFamily: "BasisGrotesquePro" }}>INVOICE</h6>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600" style={{ fontFamily: "BasisGrotesquePro" }}>
                    <strong>Issue Date:</strong> {issueDate || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-600" style={{ fontFamily: "BasisGrotesquePro" }}>
                    <strong>Due Date:</strong> {dueDate || 'N/A'}
                  </p>
                  {paidDate && (
                    <p className="text-xs text-gray-600" style={{ fontFamily: "BasisGrotesquePro" }}>
                      <strong>Paid Date:</strong> {formatDate(paidDate)}
                    </p>
                  )}
                  {invoice.is_overdue && (
                    <p className="text-xs text-red-600 font-semibold mt-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                      Overdue
                    </p>
                  )}
                </div>
              </div>
            </div>

            <hr style={{ borderTop: "2px solid #4B5563", margin: "16px 0" }} />

            {/* Bill To */}
            <div className="mb-4 mt-2">
              <h5 className="text-base font-medium text-[#3B4A66] mb-2" style={{ fontFamily: "BasisGrotesquePro" }}>Bill To:</h5>
              <p className="text-xs font-semibold text-[#3B4A66] mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                {invoice.client_name || 'Client'}
              </p>
              {invoice.client_email && (
                <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                  {invoice.client_email}
                </p>
              )}
              {invoice.client_phone_number && (
                <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                  {invoice.client_phone_number}
                </p>
              )}
              {invoice.client_address_details?.full_address ? (
                <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                  {invoice.client_address_details.full_address}
                </p>
              ) : invoice.client_address ? (
                <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                  {invoice.client_address}
                </p>
              ) : invoice.client_address_details ? (
                <>
                  {invoice.client_address_details.street_address && (
                    <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                      {invoice.client_address_details.street_address}
                    </p>
                  )}
                  {(invoice.client_address_details.city || invoice.client_address_details.state || invoice.client_address_details.zip_code) && (
                    <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                      {[invoice.client_address_details.city, invoice.client_address_details.state, invoice.client_address_details.zip_code].filter(Boolean).join(', ')}
                    </p>
                  )}
                </>
              ) : null}
            </div>

            <hr style={{ borderTop: "2px solid #4B5563", margin: "16px 0" }} />

            {/* Services */}
            <div className="mb-4">
              <h5 className="text-base font-medium text-[#3B4A66] mb-2" style={{ fontFamily: "BasisGrotesquePro" }}>
                Services
              </h5>

              <div className="flex font-semibold p-2 mb-1 rounded-lg" style={{ backgroundColor: "#F3F7FF" }}>
                <div className="flex-1 text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>Description</div>
                <div className="w-20 text-center text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>Qty</div>
                <div className="w-20 text-center text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>Rate</div>
                <div className="w-20 text-right text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>Amount</div>
              </div>

              {invoiceItems.length > 0 ? (
                invoiceItems.map((item, index) => {
                  // Handle value as number or string
                  const itemValue = typeof item.value === 'number' ? item.value : parseFloat(item.value || item.amount || 0);
                  return (
                    <div key={index} className="flex items-center border-b pb-2 mb-2">
                      <div className="flex-1 text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>
                        {item.description || 'Service'}
                      </div>
                      <div className="w-20 text-center text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>1</div>
                      <div className="w-20 text-center text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>
                        {formatCurrency(itemValue)}
                      </div>
                      <div className="w-20 text-right text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>
                        {formatCurrency(itemValue)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center border-b pb-2 mb-2">
                  <div className="flex-1 text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>
                    {invoice.description || 'Service'}
                  </div>
                  <div className="w-20 text-center text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>1</div>
                  <div className="w-20 text-center text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>
                    {formatCurrency(totalAmount)}
                  </div>
                  <div className="w-20 text-right text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-2">
                <div className="w-40 text-right text-xs font-normal text-[#3B4A66] mr-20" style={{ fontFamily: "BasisGrotesquePro" }}>
                  Subtotal:
                </div>
                <div className="w-20 text-right text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>
                  {formatCurrency(subtotal)}
                </div>
              </div>

              <div className="flex justify-end mt-3">
                <div className="w-40 text-right text-xs font-normal text-[#3B4A66] mr-20" style={{ fontFamily: "BasisGrotesquePro" }}>
                  Tax (0%):
                </div>
                <div className="w-20 text-right text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>
                  {formatCurrency(taxAmount)}
                </div>
              </div>

              <hr style={{ width: "30%", borderTop: "2px solid #000", marginLeft: "70%", marginTop: "8px" }} />

              <div className="flex justify-end mt-2">
                <div className="w-40 text-right text-sm font-semibold text-[#3B4A66] mr-20" style={{ fontFamily: "BasisGrotesquePro" }}>
                  Total:
                </div>
                <div className="w-20 text-right text-sm font-bold text-[#3B4A66]">
                  {formattedTotalAmount}
                </div>
              </div>
            </div>

            <hr style={{ borderTop: "2px solid #4B5563", margin: "16px 0" }} />

            {/* Payment Information */}
            <div className="mt-4 mb-4">
              <div className="flex justify-between items-center mb-3 p-3 rounded-lg" style={{ backgroundColor: "#F3F7FF", border: "1px solid #E8F0FF" }}>
                <div>
                  <h6 className="text-sm font-semibold text-[#3B4A66] mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                    Outstanding Balance
                  </h6>
                  <p className="text-xs text-gray-600" style={{ fontFamily: "BasisGrotesquePro" }}>
                    Total amount due for this invoice
                  </p>
                  {invoice.is_overdue && (
                    <p className="text-xs text-red-600 font-semibold mt-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                      This invoice is overdue
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <h5 className="text-xl font-semibold text-[#F56D2D]" style={{ fontFamily: "BasisGrotesquePro" }}>
                    {formatCurrency(remainingAmount)}
                  </h5>
                </div>
              </div>

              {paidAmount > 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <div>
                    <h6 className="text-sm font-semibold text-[#3B4A66] mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                      Paid Amount
                    </h6>
                    <p className="text-xs text-gray-600" style={{ fontFamily: "BasisGrotesquePro" }}>
                      Amount already paid
                    </p>
                  </div>
                  <div className="text-right">
                    <h5 className="text-xl font-semibold text-[#166534]" style={{ fontFamily: "BasisGrotesquePro" }}>
                      {formattedPaidAmount}
                    </h5>
                  </div>
                </div>
              )}
            </div>

            {/* Payment History */}
            {payments && payments.length > 0 && (
              <>
                <hr style={{ borderTop: "2px solid #4B5563", margin: "16px 0" }} />
                <div className="mt-4 mb-4">
                  <h5 className="text-base font-medium text-[#3B4A66] mb-3" style={{ fontFamily: "BasisGrotesquePro" }}>
                    Payment History
                  </h5>
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 rounded-lg border border-[#E8F0FF]" style={{ backgroundColor: "#F9FAFB" }}>
                        <div>
                          <p className="text-sm font-semibold text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-xs text-gray-600" style={{ fontFamily: "BasisGrotesquePro" }}>
                            {payment.payment_method_display || payment.payment_method || 'N/A'} • {formatDate(payment.payment_date)}
                          </p>
                          {payment.transaction_id && (
                            <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                              Transaction ID: {payment.transaction_id}
                            </p>
                          )}
                        </div>
                        <span className="badge bg-success text-white px-2 py-1" style={{ borderRadius: "12px", fontSize: "11px" }}>
                          Paid
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <hr style={{ borderTop: "2px solid #4B5563", margin: "16px 0" }} />

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-2 mb-2">
                <p className="text-xs text-gray-600" style={{ fontFamily: "BasisGrotesquePro" }}>
                  <strong className="text-sm font-bold text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>Notes:</strong><br />
                  {invoice.notes}
                </p>
              </div>
            )}

            {/* Payment Terms */}
            <p className="mt-2 text-xs text-gray-600" style={{ fontFamily: "BasisGrotesquePro" }}>
              <strong className="text-sm font-bold text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>Payment Terms:</strong><br />
              Payment is due within 30 days of invoice date.<br />
              Late payments may be subject to a 1.5% monthly service charge.
            </p>

            <hr style={{ borderTop: "2px solid #4B5563", margin: "16px 0" }} />

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs bg-[#E8F0FF] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                style={{ fontFamily: "BasisGrotesquePro", borderRadius: "10px" }}
              >
                Print
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                style={{ fontFamily: "BasisGrotesquePro", borderRadius: "10px" }}
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

