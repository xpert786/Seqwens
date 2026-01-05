import React, { useState, useEffect } from "react";
import "../../styles/icon.css";
import { SaveIcon } from "../../component/icons";
import { toast } from "react-toastify";
import { taxPreparerNotificationAPI, handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";

const Notifications = ({ notifications, onUpdate }) => {
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    sms_notifications: false,
    document_upload_confirmation: true,
    appointment_reminders: true,
    invoice_alerts: true,
    message_notifications: true,
    marketing_emails: false,
    login_alerts: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [domainName, setDomainName] = useState("seqwens.com");

  // Fetch notification preferences on component mount
  useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await taxPreparerNotificationAPI.getNotificationPreferences();
        console.log('Fetched notification preferences:', response);

        // Map API response to component state
        if (response.success && response.data) {
          setPreferences({
            email_notifications: response.data.email_notifications ?? true,
            sms_notifications: response.data.sms_notifications ?? false,
            document_upload_confirmation: response.data.document_upload_confirmation ?? true,
            appointment_reminders: response.data.appointment_reminders ?? true,
            invoice_alerts: response.data.invoice_alerts ?? true,
            message_notifications: response.data.message_notifications ?? true,
            marketing_emails: response.data.marketing_emails ?? false,
            login_alerts: response.data.login_alerts ?? true,
          });
        } else if (notifications) {
          // Fallback to props if API doesn't return data
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
      } catch (err) {
        console.error('Error fetching notification preferences:', err);
        const errorMessage = handleAPIError(err);
        setError(errorMessage);
        // If API fails, use props as fallback
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
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
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
      console.log('Saving notification preferences:', preferences);

      await taxPreparerNotificationAPI.updateNotificationPreferences(preferences);

      // Show success toast
      toast.success("Notification preferences updated successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      if (onUpdate) {
        onUpdate();
      }
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

        

        {/* Save Button */}
        <div className="mt-6">
          <button
            className="btn d-flex align-items-center gap-2 px-6 py-2 rounded-lg"
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              backgroundColor: "#F56D2D",
              opacity: (saving || loading) ? 0.7 : 1,
              color: "#fff",
              fontWeight: "400",
              fontSize: "15px",
              fontFamily: "BasisGrotesquePro",
              border: "none",
              cursor: (saving || loading) ? "not-allowed" : "pointer",
            }}
          >
            {saving ? (
              <>
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Saving...</span>
                </div>
                Saving...
              </>
            ) : (
              <>
                <SaveIcon />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
