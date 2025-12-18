import React, { useState } from "react";
import Faq from "./Faq";
import ContactSupport from "./ContactSupport";
import MyTickets from "./MyTickets";
import Resources from "./Resources";
import '../../styles/HelpSuportMain.css';
export default function HelpSupport() {
  const [activeTab, setActiveTab] = useState("faq");

  const tabs = [
    { id: "faq", label: "FAQ" },
    { id: "contact", label: "Contact Support" },
    { id: "tickets", label: "My Tickets" },
    { id: "resources", label: "Resources" },
  ];

  return (
    <div className="container-fluid lg:px-4 md:px-2 px-1 help-support-page">
      <div className="align-items-center mb-3">
        <h5
          className="mb-0 me-3"
          style={{
            color: "#3B4A66",
            fontSize: "28px",
            fontWeight: "500",
            fontFamily: "BasisGrotesquePro",
          }}
        >
          Help & Support
        </h5>
        <p
          className="mb-0"
          style={{
            color: "#4B5563",
            fontSize: "16px",
            fontWeight: "400",
            fontFamily: "BasisGrotesquePro",
          }}
        >
          Get help and find answers to your questions
        </p>
      </div>

      <div
        className="d-inline-block mb-4 help-tabs"
        style={{
          padding: "10px 12px",
          border: "1px solid #E8F0FF",
          borderRadius: "12px",
          backgroundColor: "#FFFFFF",
          fontSize: "14px",
          fontWeight: "400",
          fontFamily: "BasisGrotesquePro",
        }}
      >
        <ul
          className="d-flex gap-2 mb-0"
          style={{ listStyle: "none", padding: 0, margin: 0 }}
        >
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "15px",
                  fontFamily: "BasisGrotesquePro",
                  backgroundColor: activeTab === tab.id ? "#00C0C6" : "transparent",
                  color: activeTab === tab.id ? "#ffffff" : "#3B4A66",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {activeTab === "contact" && (
        <div className="mb-4">
          <ContactSupport />
        </div>
      )}


      {activeTab === "resources" && (
        <div className="mb-4">
          <Resources />
        </div>
      )}


      {(activeTab === "faq" ||
        activeTab === "tickets") && (

          <div
            className="card"
            style={{
              borderRadius: "15px",
              border: "1px solid #E8F0FF",
              backgroundColor: "#FFFFFF",
            }}
          >
            <div
              className="card-body help-card-body"
              style={{
                marginRight: "2px",
                marginBottom: "30px",
                marginLeft: "2px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "28px",
              }}
            >
              {activeTab === "faq" && <Faq />}
              {activeTab === "tickets" && <MyTickets />}

            </div>
          </div>
        )}
    </div>
  );
}
