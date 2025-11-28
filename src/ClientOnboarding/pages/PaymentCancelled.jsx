import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

const PaymentCancelled = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
          <div className="text-center py-6">
            <div className="mb-4">
              <svg className="w-20 h-20 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 
              className="text-2xl font-bold mb-2"
              style={{ color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}
            >
              Payment Cancelled
            </h2>
            <p 
              className="text-gray-600 mb-6"
              style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}
            >
              Your payment was cancelled. No charges were made to your account.
            </p>
          </div>

          {invoiceId && (
            <div className="border rounded-lg p-4 mb-6" style={{ backgroundColor: "#FEF9C3", borderColor: "#FDE047" }}>
              <p 
                className="mb-0 text-center"
                style={{ color: "#854D0E", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}
              >
                Invoice #{invoiceId} payment was not completed.
              </p>
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
              Back to Invoices
            </button>
            {invoiceId && (
              <button
                onClick={() => navigate(`/invoices`)}
                className="btn"
                style={{
                  backgroundColor: "#F56D2D",
                  borderColor: "#F56D2D",
                  color: "#FFFFFF",
                  fontFamily: "BasisGrotesquePro",
                  padding: "8px 24px"
                }}
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentCancelled;

