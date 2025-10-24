import React, { useState, useEffect } from "react";
import "../../styles/icon.css";
import { SaveIcon } from "../icons";
import { notificationAPI, handleAPIError } from "../../utils/apiUtils";

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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch notification preferences on component mount
  useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await notificationAPI.getNotificationPreferences();
        console.log('Fetched notification preferences:', data);
        
        // Map API response to component state
        if (data) {
          setPreferences({
            email: data.email_notifications || false,
            sms: data.sms_notifications || false,
            upload: data.document_upload_confirmation || false,
            appointment: data.appointment_reminders || false,
            invoice: data.invoice_alerts || false,
            message: data.message_notifications || false,
            marketing: data.marketing_emails || false,
          });
        }
      } catch (err) {
        console.error('Error fetching notification preferences:', err);
        setError(handleAPIError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const togglePreference = (key) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Map component state to API format
      const apiData = {
        email_notifications: preferences.email,
        sms_notifications: preferences.sms,
        document_upload_confirmation: preferences.upload,
        appointment_reminders: preferences.appointment,
        invoice_alerts: preferences.invoice,
        message_notifications: preferences.message,
        marketing_emails: preferences.marketing,
      };

      console.log('Saving notification preferences:', apiData);
      
      await notificationAPI.updateNotificationPreferences(apiData);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      setError(handleAPIError(err));
    } finally {
      setSaving(false);
    }
  };

  // Show loading state while fetching preferences
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading notification preferences...</span>
      </div>
    );
  }

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
            desc: "Get reminded about upcoming appointments and meetings",
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

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}

    

      {/* Save Button */}
      <div className="mt-4">
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={handleSave}
          disabled={saving || loading}
          style={{
            backgroundColor: saving || loading ? "#ccc" : "#F56D2D",
            color: "#fff",
            fontWeight: "400",
            fontSize: "15px",
            fontFamily: "BasisGrotesquePro",
            cursor: saving || loading ? "not-allowed" : "pointer",
          }}
        >
          <SaveIcon />
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
};

export default Notifications;
