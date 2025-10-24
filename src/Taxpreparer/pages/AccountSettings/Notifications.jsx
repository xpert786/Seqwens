import React, { useState } from "react";
import "../../styles/icon.css";
import { SaveIcon } from "../../component/icons"

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

  const [domainName, setDomainName] = useState("seqwens.com");

  const togglePreference = (key) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  return (
    <div className="card">
      <div className="card-body" style={{
        padding: "28px",
        backgroundColor: "white",
        borderRadius: "12px",
       
      }}>
        {/* Header */}
        <div className="align-items-center mb-3">
        <h5
          className="mb-0 me-3"
          style={{
            color: "#3B4A66",
            fontSize: "24px",
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
      <div className="flex flex-col gap-4 rounded-lg bg-white">
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
            className="flex justify-between items-center py-3 last:border-b-0"
          >
            <div className="flex-1">
              <div
                style={{
                  color: "#3B4A66",
                  fontSize: "16px",
                  fontWeight: "500",
                  fontFamily: "BasisGrotesquePro",
                  marginBottom: "4px"
                }}
              >
                {item.title}
              </div>
              <p
                className="mb-0"
                style={{
                  color: "#4B5563",
                  fontSize: "14px",
                  fontWeight: "400",
                  fontFamily: "BasisGrotesquePro",
                }}
              >
                {item.desc}
              </p>
            </div>

            <div className="custom-toggle ml-4">
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

      {/* Domain Name Section */}
      <div className="mt-6">
        <h6
          style={{
            color: "#3B4A66",
            fontSize: "18px",
            fontWeight: "500",
            fontFamily: "BasisGrotesquePro",
            marginBottom: "16px"
          }}
        >
          Domain Name
        </h6>
        <div className="flex items-center gap-3 border border-[#E8F0FF] p-3 rounded-lg bg-white">
          <input
            type="text"
            placeholder="Enter domain name"
            value={domainName}
            onChange={(e) => setDomainName(e.target.value)}
            className="flex-1 border-none outline-none bg-transparent"
            style={{
              color: "#3B4A66",
              fontSize: "14px",
              fontWeight: "400",
              fontFamily: "BasisGrotesquePro",
            }}
          />
          <span
            style={{
              color: "#3B4A66",
              fontSize: "14px",
              fontWeight: "400",
              fontFamily: "BasisGrotesquePro",
            }}
          >
            seqwens.com
          </span>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6">
        <button
          className="btn d-flex align-items-center gap-2 px-6 py-2 rounded-lg"
          style={{
            backgroundColor: "#F56D2D",
            color: "#fff",
            fontWeight: "400",
            fontSize: "15px",
            fontFamily: "BasisGrotesquePro",
            border: "none"
          }}
        >
          <SaveIcon />
          Save Changes
        </button>
      </div>
      </div>
    </div>
  );
};

export default Notifications;
