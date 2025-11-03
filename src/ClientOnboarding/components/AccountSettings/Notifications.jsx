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
      <div style={{ background: "#fff" }}>
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
          {
            key: "login",
            title: "Login Alerts",
            desc: "Get notified when someone logs into your account",
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
          onClick={handleSave}
          disabled={saving || loading}
          style={{
            backgroundColor: "#F56D2D",
            opacity: (saving || loading) ? 0.7 : 1,
            color: "#fff",
            fontWeight: "400",
            fontSize: "15px",
            fontFamily: "BasisGrotesquePro",
            cursor: (saving || loading) ? "not-allowed" : "pointer",
            transition: "opacity 0.2s ease",
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
