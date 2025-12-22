import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const API_BASE_URL = getApiBaseUrl();

export default function TaxPreparerInvoiceDetailsModal({ isOpen, onClose, invoiceId }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [firmLogo, setFirmLogo] = useState(null);
  const [firmName, setFirmName] = useState('');

  useEffect(() => {
    if (isOpen && invoiceId) {
      fetchInvoiceDetails();
      fetchFirmInfo();
    }
  }, [isOpen, invoiceId]);

  const fetchInvoiceDetails = async () => {
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
        setInvoice(result.data.invoice || result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch invoice details');
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

  const fetchFirmInfo = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const response = await fetchWithCors(`${API_BASE_URL}/firm/settings/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setFirmName(result.data.firm_name || '');
          if (result.data.logo_url) {
            setFirmLogo(result.data.logo_url);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching firm info:', err);
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

  const invoiceItems = invoice?.invoice_items || [];
  const totalAmount = parseFloat(invoice?.total_amount || invoice?.amount || 0);
  const taxAmount = parseFloat(invoice?.tax_amount || 0);
  const subtotal = totalAmount - taxAmount;
  const paidAmount = parseFloat(invoice?.paid_amount || 0);
  const remainingAmount = parseFloat(invoice?.remaining_amount || totalAmount - paidAmount);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
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
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h5 className="text-xl font-bold text-[#3B4A66] mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                  Invoice {invoice.invoice_number || `#${invoice.id}`}
                </h5>
                <p className="text-gray-600 text-sm mb-3" style={{ fontFamily: "BasisGrotesquePro" }}>
                  Invoice details and payment information
                </p>

                {firmLogo && (
                  <div
                    className="p-2 rounded flex items-center justify-center mb-2"
                    style={{
                      width: "80px",
                      height: "50px",
                      backgroundColor: "#E8F0FF",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={firmLogo}
                      alt={firmName || "Firm Logo"}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain"
                      }}
                      onError={() => setFirmLogo(null)}
                    />
                  </div>
                )}

                <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                  {invoice.firm_address || '123 Business Street'}
                </p>
                <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                  {invoice.firm_city || 'City'}, {invoice.firm_state || 'State'} {invoice.firm_zip || '12345'}
                </p>
                <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                  Phone: {invoice.firm_phone || '(555) 123-4567'}
                </p>
                <p className="text-xs text-gray-600" style={{ fontFamily: "BasisGrotesquePro" }}>
                  Email: {invoice.firm_email || 'billing@seqwens.com'}
                </p>
              </div>

              <div className="mt-16">
                <h6 className="text-lg font-semibold text-[#3B4A66] mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>INVOICE</h6>
                <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>{invoice.invoice_number || `#${invoice.id}`}</p>
                <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>Phone: {invoice.firm_phone || '(555) 123-4567'}</p>
                <p className="text-xs text-gray-600" style={{ fontFamily: "BasisGrotesquePro" }}>Email: {invoice.firm_email || 'billing@seqwens.com'}</p>
              </div>
            </div>

            <hr style={{ borderTop: "2px solid #4B5563", margin: "16px 0" }} />

            {/* Bill To */}
            <div className="mb-4 mt-2">
              <h5 className="text-base font-medium text-[#3B4A66] mb-2" style={{ fontFamily: "BasisGrotesquePro" }}>Bill To:</h5>
              <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                {invoice.client_name || 'Client'}
              </p>
              {invoice.client_address && (
                <>
                  <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                    {invoice.client_address}
                  </p>
                </>
              )}
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
                invoiceItems.map((item, index) => (
                  <div key={index} className="flex items-center border-b pb-2 mb-2">
                    <div className="flex-1 text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>
                      {item.description || 'Service'}
                    </div>
                    <div className="w-20 text-center text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>1</div>
                    <div className="w-20 text-center text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>
                      {formatCurrency(parseFloat(item.value || 0))}
                    </div>
                    <div className="w-20 text-right text-xs font-normal text-[#3B4A66]" style={{ fontFamily: "BasisGrotesquePro" }}>
                      {formatCurrency(parseFloat(item.value || 0))}
                    </div>
                  </div>
                ))
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
                  {formatCurrency(totalAmount)}
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
                      {formatCurrency(paidAmount)}
                    </h5>
                  </div>
                </div>
              )}
            </div>

            <hr style={{ borderTop: "2px solid #4B5563", margin: "16px 0" }} />

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
                style={{ fontFamily: "BasisGrotesquePro" }}
              >
                Print
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                style={{ fontFamily: "BasisGrotesquePro" }}
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

