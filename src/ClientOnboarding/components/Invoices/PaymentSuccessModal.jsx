import React from 'react';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';

const PaymentSuccessModal = ({ show, onClose, invoice }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Show success toast when modal opens
  React.useEffect(() => {
    if (show) {
      toast.success('Payment processed successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  }, [show]);

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      backdrop="static"
      keyboard={false}
      style={{ fontFamily: "BasisGrotesquePro" }}
    >
      <Modal.Body className="p-4">
        <div className="text-center">
          <div className="mb-4">
            <svg 
              className="w-20 h-20 mx-auto text-green-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ width: '80px', height: '80px', color: '#10B981' }}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ 
              color: "#3B4A66", 
              fontFamily: "BasisGrotesquePro",
              fontSize: "24px",
              fontWeight: "700"
            }}
          >
            Payment Successful!
          </h2>
          <p 
            className="text-gray-600 mb-4"
            style={{ 
              fontFamily: "BasisGrotesquePro", 
              fontSize: "14px",
              color: "#4B5563"
            }}
          >
            Your payment has been processed successfully.
          </p>
        </div>

        {invoice && (
          <div 
            className="border rounded-lg p-4 mb-4" 
            style={{ 
              backgroundColor: "#F3F7FF", 
              borderColor: "#E8F0FF" 
            }}
          >
            <h4 
              className="font-semibold mb-3"
              style={{ 
                color: "#3B4A66", 
                fontFamily: "BasisGrotesquePro",
                fontSize: "16px",
                fontWeight: "600"
              }}
            >
              Payment Details
            </h4>
            <div className="space-y-2">
              <div className="d-flex justify-content-between">
                <span style={{ 
                  color: "#4B5563", 
                  fontSize: "14px", 
                  fontFamily: "BasisGrotesquePro" 
                }}>
                  Invoice Number:
                </span>
                <span style={{ 
                  color: "#3B4A66", 
                  fontSize: "14px", 
                  fontWeight: "500", 
                  fontFamily: "BasisGrotesquePro" 
                }}>
                  {invoice.invoice_number || `INV-${invoice.id}`}
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span style={{ 
                  color: "#4B5563", 
                  fontSize: "14px", 
                  fontFamily: "BasisGrotesquePro" 
                }}>
                  Amount Paid:
                </span>
                <span style={{ 
                  color: "#166534", 
                  fontSize: "14px", 
                  fontWeight: "600", 
                  fontFamily: "BasisGrotesquePro" 
                }}>
                  {formatCurrency(invoice.paid_amount || invoice.amount)}
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span style={{ 
                  color: "#4B5563", 
                  fontSize: "14px", 
                  fontFamily: "BasisGrotesquePro" 
                }}>
                  Status:
                </span>
                <span 
                  className="badge"
                  style={{ 
                    backgroundColor: "#DCFCE7", 
                    color: "#166534",
                    fontSize: "12px",
                    fontFamily: "BasisGrotesquePro",
                    padding: "4px 12px",
                    borderRadius: "12px"
                  }}
                >
                  {invoice.status === 'paid' ? 'Paid' : invoice.status_display || invoice.status || 'Paid'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="d-flex justify-content-center">
          <button
            onClick={onClose}
            className="btn"
            style={{
              backgroundColor: "#F56D2D",
              borderColor: "#F56D2D",
              color: "#FFFFFF",
              fontFamily: "BasisGrotesquePro",
              padding: "10px 32px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            Close
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default PaymentSuccessModal;

