import React, { useState } from "react";
import "../../styles/icon.css";
import { SaveIcon } from "../icons"

const Notifications = () => {
  const [preferences, setPreferences] = useState({
    email: true,
    sms: false,
    upload: true,
    appointment: true,
    invoice: true,
    message: true,
    marketing: false,
  });

  const togglePreference = (key) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  return (
    <div>
      {/* Header */}
        <div className="align-items-center mb-3 ">
      <h5
        className="mb-0 me-3"
        style={{
          color: "#3B4A66",
          fontSize: "20px",
          fontWeight: "500",
          fontFamily: "BasisGrotesquePro",
        
        }}
      >
        Notification Preferences
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
        Choose how you want to be notified
      </p>
       </div>


      {/* Preferences List */}
      <div  style={{ background: "#fff" }}>
        {[
          {
            key: "email",
            title: "Email Notifications",
            desc: "Receive notifications via email",
          },
          {
            key: "sms",
            title: "SMS Notifications",
            desc: "Receive notifications via text message",
          },
          {
            key: "upload",
            title: "Document Upload Confirmations",
            desc: "Get notified when documents are processed",
          },
          {
            key: "appointment",
            title: "Appointment Reminders",
            desc: "Reminders for upcoming appointments",
          },
          {
            key: "invoice",
            title: "Invoice Alerts",
            desc: "Notifications for new invoices and payment due dates",
          },
          {
            key: "message",
            title: "Message Notifications",
            desc: "Alerts for new messages from your tax professional",
          },
          {
            key: "marketing",
            title: "Marketing Emails",
            desc: "Receive updates about new features and services",
          },
        ].map((item) => (
          <div
            key={item.key}
            className="d-flex justify-content-between align-items-center py-3"
          >
            <div>
              <strong style={{
                color: "#3B4A66", fontSize: "18px", fontWeight: "500",
                fontFamily: "BasisGrotesquePro",
              }}>
                {item.title}
              </strong>
              <p
                className="mb-0"
                style={{
                  color: "#4B5563",
                  fontSize: "15px",
                  fontWeight: "400",
                  fontFamily: "BasisGrotesquePro",
                }}
              >
                {item.desc}
              </p>
            </div>

            <div className="custom-toggle">
              <input
                type="checkbox"
                id={item.key}
                checked={preferences[item.key]}
                onChange={() => togglePreference(item.key)}
              />
              <label htmlFor={item.key}></label>
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="mt-4">
        <button
          className="btn d-flex align-items-center gap-2"
          style={{
            backgroundColor: "#F56D2D",
            color: "#fff",
            fontWeight: "400",
             fontSize: "15px",
            fontFamily: "BasisGrotesquePro",
          
          }}
        >
             <SaveIcon />
          Save Preferences
        </button>
  
      </div>
    </div>
  );
};

export default Notifications;
