import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PaymentCancelled = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to invoices page with payment cancelled parameter
    navigate('/invoices?payment_cancelled=true', { replace: true });
  }, [navigate]);

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

export default PaymentCancelled;

