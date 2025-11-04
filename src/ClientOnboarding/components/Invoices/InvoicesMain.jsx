import React, { useState, useEffect } from 'react';
import OutstandingTab from './OutstandingTab';
import PaymentHistoryTab from './PaymentHistoryTab';
import { BalanceIcon, DateIcons } from "../icons";
import { invoicesAPI, handleAPIError } from '../../utils/apiUtils';

const InvoicesMain = () => {
  const [activeTab, setActiveTab] = useState('outstanding');
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({
    outstanding_balance: 0.0,
    paid_this_year: 0.0,
    next_due_date: null,
    total_invoices: 0,
    outstanding_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = [
    { id: "outstanding", label: `Outstanding (${summary.outstanding_count})` },
    { id: "history", label: "Payment History" },
  ];

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Fetch invoices data
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await invoicesAPI.getInvoices();

        if (response.success && response.data) {
          setInvoices(response.data.invoices || []);
          setSummary(response.data.summary || {
            outstanding_balance: 0.0,
            paid_this_year: 0.0,
            next_due_date: null,
            total_invoices: 0,
            outstanding_count: 0
          });
        } else {
          setError('Failed to load invoices');
        }
      } catch (err) {
        console.error('Error fetching invoices:', err);
        const errorMessage = handleAPIError(err);
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          icon: false,
          className: "custom-toast-error",
          bodyClassName: "custom-toast-body",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  return (
    <div className='px-4' >


      <div className="align-items-center mb-3 ">
        <h5
          className="mb-0 me-3"
          style={{
            color: "#3B4A66",
            fontSize: "28px",
            fontWeight: "500",
            fontFamily: "BasisGrotesquePro",
          }}
        >
          Invoices & Payments
        </h5>
        <p
          className="mb-0"
          style={{
            color: "#4B5563",
            fontSize: "14px",
            fontWeight: "400",
            fontFamily: "BasisGrotesquePro",
          }}
        >
          Manage your billing and payment history
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <small style={{ color: "#4B5563", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>Loading invoices...</small>
        </div>
      )}


      {/* Stat Cards */}
      {!loading && (
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="bg-white p-3 rounded shadow-sm d-flex align-items-center justify-content-between">
              <div>
                <small style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Outstanding Balance</small>
                <h5 style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                  {formatCurrency(summary.outstanding_balance)}
                </h5>
              </div>
              <BalanceIcon size={30} className="text-warning" />
            </div>
          </div>
          <div className="col-md-4">
            <div className="bg-white p-3 rounded shadow-sm d-flex align-items-center justify-content-between">
              <div>
                <small style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Paid This Year</small>
                <h5 style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                  {formatCurrency(summary.paid_this_year)}
                </h5>
              </div>
              <BalanceIcon size={30} className="text-success" />
            </div>
          </div>
          <div className="col-md-4">
            <div className="bg-white p-3 rounded shadow-sm d-flex align-items-center justify-content-between">
              <div>
                <small style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Next Due Date</small>
                <h5 style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                  {summary.next_due_date ? formatDate(summary.next_due_date) : 'N/A'}
                </h5>
              </div>
              <DateIcons size={24} className="text-primary" />
            </div>
          </div>
        </div>
      )}


      <div
        className="d-inline-block mb-4"
        style={{
          padding: "6px 10px",
          border: "1px solid #E8F0FF",
          backgroundColor: "#FFFFFF",
          borderRadius: "15px",
          fontFamily: "BasisGrotesquePro",
          fontSize: "14px",
          fontWeight: "400",
        }}
      >
        <ul
          className="d-flex mb-0"
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            gap: "10px",
          }}
        >
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 22px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "15px",
                  fontFamily: "BasisGrotesquePro",
                  backgroundColor: activeTab === tab.id ? "#00C0C6" : "transparent",
                  color: activeTab === tab.id ? "#ffffff" : "#3B4A66",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>



      <div>
        {!loading && (activeTab === 'outstanding' ? <OutstandingTab invoices={invoices} /> : <PaymentHistoryTab invoices={invoices} />)}
      </div>
    </div>
  );
};

export default InvoicesMain;
