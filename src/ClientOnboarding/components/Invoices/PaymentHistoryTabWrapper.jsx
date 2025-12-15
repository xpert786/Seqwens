import React, { useState, useEffect } from "react";
import InvoicePopupWithPDF from "./PaymentHistoryTab";
import { paymentsAPI, handleAPIError } from "../../utils/apiUtils";
import { toast } from "react-toastify";

const PaymentHistoryTab = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch completed payments from API
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await paymentsAPI.getCompletedPayments();

        // Handle different response structures
        if (response.success && response.data) {
          // Response with success and data wrapper
          if (Array.isArray(response.data)) {
            setPayments(response.data);
          } else if (Array.isArray(response.data.payments)) {
            setPayments(response.data.payments);
          } else if (response.data.results) {
            setPayments(response.data.results);
          } else {
            setPayments([]);
          }
        } else if (Array.isArray(response)) {
          // Direct array response
          setPayments(response);
        } else if (response.results) {
          // Paginated response
          setPayments(response.results);
        } else {
          setPayments([]);
        }
      } catch (err) {
        console.error('Error fetching payments:', err);
        const errorMessage = handleAPIError(err);
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
        });
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-3 rounded">
        <div className="text-center py-4" style={{ marginLeft: "10px" }}>
          <p style={{ color: "#4B5563", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
            Loading payment history...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-3 rounded">
        <div className="text-center py-4" style={{ marginLeft: "10px" }}>
          <p style={{ color: "#DC2626", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  return <InvoicePopupWithPDF payments={payments} />;
};

export default PaymentHistoryTab;

