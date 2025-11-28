import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoicesAPI, handleAPIError } from '../utils/apiUtils';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';

const PaymentSuccess = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true);
        // Fetch invoice to check payment status
        const response = await invoicesAPI.getInvoices();
        
        if (response.success && response.data && response.data.invoices) {
          const foundInvoice = response.data.invoices.find(inv => inv.id === parseInt(invoiceId));
          if (foundInvoice) {
            setInvoice(foundInvoice);
            // Check if payment was successful
            if (foundInvoice.status === 'paid' || foundInvoice.remaining_amount === 0) {
              toast.success('Payment processed successfully!', {
                position: "top-right",
                autoClose: 3000,
              });
            }
          }
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError(handleAPIError(err));
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      verifyPayment();
    }
  }, [invoiceId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Verifying payment...</span>
              </div>
              <p style={{ color: "#4B5563", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
                Verifying payment...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: "BasisGrotesquePro" }}>
                Error Verifying Payment
              </h3>
              <p className="text-gray-600 mb-4" style={{ fontFamily: "BasisGrotesquePro" }}>{error}</p>
              <button
                onClick={() => navigate('/invoices')}
                className="btn btn-primary"
                style={{ fontFamily: "BasisGrotesquePro" }}
              >
                Back to Invoices
              </button>
            </div>
          ) : (
            <>
              <div className="text-center py-6">
                <div className="mb-4">
                  <svg className="w-20 h-20 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 
                  className="text-2xl font-bold mb-2"
                  style={{ color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}
                >
                  Payment Successful!
                </h2>
                <p 
                  className="text-gray-600 mb-6"
                  style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}
                >
                  Your payment has been processed successfully.
                </p>
              </div>

              {invoice && (
                <div className="border rounded-lg p-4 mb-6" style={{ backgroundColor: "#F3F7FF", borderColor: "#E8F0FF" }}>
                  <h4 
                    className="font-semibold mb-3"
                    style={{ color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}
                  >
                    Payment Details
                  </h4>
                  <div className="space-y-2">
                    <div className="d-flex justify-content-between">
                      <span style={{ color: "#4B5563", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
                        Invoice Number:
                      </span>
                      <span style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                        {invoice.invoice_number || `INV-${invoice.id}`}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span style={{ color: "#4B5563", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
                        Amount Paid:
                      </span>
                      <span style={{ color: "#166534", fontSize: "14px", fontWeight: "600", fontFamily: "BasisGrotesquePro" }}>
                        {formatCurrency(invoice.paid_amount || invoice.amount)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span style={{ color: "#4B5563", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
                        Status:
                      </span>
                      <span 
                        className="badge"
                        style={{ 
                          backgroundColor: "#DCFCE7", 
                          color: "#166534",
                          fontSize: "12px",
                          fontFamily: "BasisGrotesquePro"
                        }}
                      >
                        {invoice.status === 'paid' ? 'Paid' : invoice.status_display || invoice.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-center gap-3">
                <button
                  onClick={() => navigate('/invoices')}
                  className="btn"
                  style={{
                    backgroundColor: "#E8F0FF",
                    borderColor: "#E8F0FF",
                    color: "#3B4A66",
                    fontFamily: "BasisGrotesquePro",
                    padding: "8px 24px"
                  }}
                >
                  View All Invoices
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn"
                  style={{
                    backgroundColor: "#F56D2D",
                    borderColor: "#F56D2D",
                    color: "#FFFFFF",
                    fontFamily: "BasisGrotesquePro",
                    padding: "8px 24px"
                  }}
                >
                  Go to Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentSuccess;

