import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to invoices page with payment success parameter
    if (invoiceId) {
      navigate(`/invoices?payment_success=true&invoice_id=${invoiceId}`, { replace: true });
    } else {
      navigate('/invoices?payment_success=true', { replace: true });
    }
  }, [invoiceId, navigate]);

  // Show loading state while redirecting
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Redirecting...</span>
        </div>
        <p style={{ color: "#4B5563", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
          Redirecting to invoices...
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;

