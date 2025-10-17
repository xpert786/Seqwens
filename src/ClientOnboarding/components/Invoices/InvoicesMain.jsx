import React, { useState } from 'react';
import OutstandingTab from './OutstandingTab';
import PaymentHistoryTab from './PaymentHistoryTab';
import { BalanceIcon, DateIcons } from "../icons";

const InvoicesMain = () => {
  const [activeTab, setActiveTab] = useState('outstanding');

  const tabs = [
    { id: "outstanding", label: "Outstanding (2)" },
    { id: "history", label: "Payment History" },
  ];

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

      {/* Stat Cards */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="bg-white p-3 rounded shadow-sm d-flex align-items-center justify-content-between">
            <div>
              <small style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Outstanding Balance</small>
              <h5 style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>$1250.00</h5>
            </div>
            <BalanceIcon size={30} className="text-warning" />
          </div>
        </div>
        <div className="col-md-4">
          <div className="bg-white p-3 rounded shadow-sm d-flex align-items-center justify-content-between">
            <div>
              <small style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Paid This Year</small>
              <h5 style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>$1400.00</h5>
            </div>
            <BalanceIcon size={30} className="text-success" />
          </div>
        </div>
        <div className="col-md-4">
          <div className="bg-white p-3 rounded shadow-sm d-flex align-items-center justify-content-between">
            <div>
              <small style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Next Due Date</small>
              <h5 style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Mar 15</h5>
            </div>
            <DateIcons size={24} className="text-primary" />
          </div>
        </div>
      </div>


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
        {activeTab === 'outstanding' ? <OutstandingTab /> : <PaymentHistoryTab />}
      </div>
    </div>
  );
};

export default InvoicesMain;
