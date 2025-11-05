import React, { useState, useEffect } from "react";
import "../../styles/icon.css";
import { SaveIcon } from "../../component/icons"

const Notifications = ({ notifications, onUpdate }) => {
  const [preferences, setPreferences] = useState({
    email_notifications: notifications?.email_notifications ?? true,
    sms_notifications: notifications?.sms_notifications ?? false,
    document_upload_confirmation: notifications?.document_upload_confirmation ?? true,
    appointment_reminders: notifications?.appointment_reminders ?? true,
    invoice_alerts: notifications?.invoice_alerts ?? true,
    message_notifications: notifications?.message_notifications ?? true,
    marketing_emails: notifications?.marketing_emails ?? false,
    login_alerts: notifications?.login_alerts ?? true,
  });

  const [domainName, setDomainName] = useState("seqwens.com");

  // Update preferences when notifications prop changes
  useEffect(() => {
    if (notifications) {
      setPreferences({
        email_notifications: notifications.email_notifications ?? true,
        sms_notifications: notifications.sms_notifications ?? false,
        document_upload_confirmation: notifications.document_upload_confirmation ?? true,
        appointment_reminders: notifications.appointment_reminders ?? true,
        invoice_alerts: notifications.invoice_alerts ?? true,
        message_notifications: notifications.message_notifications ?? true,
        marketing_emails: notifications.marketing_emails ?? false,
        login_alerts: notifications.login_alerts ?? true,
      });
    }
  }, [notifications]);

  const togglePreference = (key) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const handleSave = () => {
    // TODO: Implement save functionality with API call
    console.log('Notification preferences:', preferences);
    if (onUpdate) {
      onUpdate();
    }
  };

  const notificationItems = [
    {
      key: "email_notifications",
      title: "Email Notifications",
      desc: "Receive notifications via email",
    },
    {
      key: "sms_notifications",
      title: "SMS Notifications",
      desc: "Receive notifications via text message",
    },
    {
      key: "document_upload_confirmation",
      title: "Document Upload Confirmations",
      desc: "Get notified when documents are processed",
    },
    {
      key: "appointment_reminders",
      title: "Appointment Reminders",
      desc: "Reminders for upcoming appointments",
    },
    {
      key: "invoice_alerts",
      title: "Invoice Alerts",
      desc: "Notifications for new invoices and payment due dates",
    },
    {
      key: "message_notifications",
      title: "Message Notifications",
      desc: "Alerts for new messages from your tax professional",
    },
    {
      key: "marketing_emails",
      title: "Marketing Emails",
      desc: "Receive updates about new features and services",
    },
    {
      key: "login_alerts",
      title: "Login Alerts",
      desc: "Get notified when someone logs into your account",
    },
  ];

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
          {notificationItems.map((item) => (
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
                  checked={preferences[item.key] || false}
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
            onClick={handleSave}
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
