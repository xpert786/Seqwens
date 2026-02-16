import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../../styles/Icon.css";
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
    login: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notification preferences on component mount
  useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await notificationAPI.getNotificationPreferences();
        console.log('Fetched notification preferences:', response);

        // Map API response to component state
        if (response.success && response.data) {
          setPreferences({
            email: response.data.email_notifications || false,
            sms: response.data.sms_notifications || false,
            upload: response.data.document_upload_confirmation || false,
            appointment: response.data.appointment_reminders || false,
            invoice: response.data.invoice_alerts || false,
            message: response.data.message_notifications || false,
            marketing: response.data.marketing_emails || false,
            login: response.data.login_alerts || false,
          });
        }
      } catch (err) {
        console.error('Error fetching notification preferences:', err);
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

    fetchPreferences();
  }, []);

  const togglePreference = (key) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

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
        login_alerts: preferences.login,
      };

      console.log('Saving notification preferences:', apiData);

      await notificationAPI.updateNotificationPreferences(apiData);

      // Show success toast
      toast.success("Notification preferences updated successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        icon: false,
        className: "custom-toast-success",
        bodyClassName: "custom-toast-body",
      });
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      const errorMessage = handleAPIError(err);
      setError(errorMessage);

      // Show error toast
      toast.error(errorMessage || "Failed to update notification preferences", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
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
   <div 
  className="container-fluid px-3 py-4" 
  style={{ 
    minHeight: "100vh", 
    display: "flex", 
    flexDirection: "column",
    backgroundColor: "#fff" 
  }}
>
  {/* Header */}
  <div className="mb-4 px-1">
    <h5
      style={{
        color: "#3B4A66",
        fontSize: "22px",
        fontWeight: "600",
        fontFamily: "BasisGrotesquePro",
      }}
    >
      Notification Preferences
    </h5>
    <p
      className="mb-0 text-muted"
      style={{
        fontSize: "15px",
        fontFamily: "BasisGrotesquePro",
      }}
    >
      Choose how you want to be notified
    </p>
  </div>

  {/* Preferences List Container */}
  <div 
    className="rounded-4 overflow-hidden mb-4 shadow-sm" 
    style={{ background: "#fff", border: "1px solid #F1F5F9" }}
  >
    {[
      { key: "email", title: "Email Notifications", desc: "Receive notifications via email" },
      { key: "sms", title: "SMS Notifications", desc: "Receive notifications via text message" },
      { key: "upload", title: "Document Upload Confirmations", desc: "Get notified when documents are processed" },
      { key: "appointment", title: "Appointment Reminders", desc: "Get reminded about upcoming appointments and meetings" },
      { key: "invoice", title: "Invoice Alerts", desc: "Notifications for new invoices and payment due dates" },
      { key: "message", title: "Message Notifications", desc: "Alerts for new messages from your tax professional" },
      { key: "marketing", title: "Marketing Emails", desc: "Receive updates about new features and services" },
      { key: "login", title: "Login Alerts", desc: "Get notified when someone logs into your account" },
    ].map((item, index, array) => (
      <div key={item.key} className="px-3">
        <div
          className="d-flex justify-content-between align-items-center py-3 py-md-4"
          style={{ gap: "16px" }}
        >
          <div style={{ flex: "1" }}>
            <label
              htmlFor={item.key}
              className="d-block mb-1"
              style={{
                color: "#3B4A66",
                fontSize: "16px",
                fontWeight: "600",
                fontFamily: "BasisGrotesquePro",
                cursor: "pointer"
              }}
            >
              {item.title}
            </label>
            <p
              className="mb-0 text-muted"
              style={{
                fontSize: "13px",
                lineHeight: "1.4",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              {item.desc}
            </p>
          </div>

          <div className="custom-toggle flex-shrink-0">
            <input
              type="checkbox"
              id={item.key}
              checked={preferences[item.key]}
              onChange={() => togglePreference(item.key)}
            />
            <label htmlFor={item.key}></label>
          </div>
        </div>

        {index !== array.length - 1 && (
          <hr className="my-0" style={{ borderTop: "1px solid #F1F5F9", opacity: 1 }} />
        )}
      </div>
    ))}
  </div>

  {/* Save Button Container */}
  {/* pb-5 is critical here to ensure the button is visible above mobile browser bars */}
  <div className="mt-2 pb-5 mb-5">
    <button
      className="btn w-100 d-flex align-items-center justify-content-center gap-2"
      onClick={handleSave}
      disabled={saving || loading}
      style={{
        backgroundColor: "#F56D2D",
        color: "#fff",
        padding: "16px",
        borderRadius: "12px",
        border: "none",
        fontWeight: "600",
        fontSize: "16px",
        fontFamily: "BasisGrotesquePro",
        opacity: (saving || loading) ? 0.7 : 1,
        transition: "all 0.2s ease",
        boxShadow: "0 4px 12px rgba(245, 109, 45, 0.2)"
      }}
    >
      <SaveIcon />
      {saving ? "Saving Changes..." : "Save Preferences"}
    </button>
  </div>
</div>
  );
};

export default Notifications;
