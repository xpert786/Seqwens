import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";

export default function Notifications() {
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

    useEffect(() => {
        const fetchPreferences = async () => {
            setLoading(true);
            setError(null);
            try {
                // TODO: Replace with actual FirmAdmin API call
                // const response = await firmAdminDashboardAPI.getNotificationPreferences();
                // if (response.success && response.data) {
                //     setPreferences({
                //         email: response.data.email_notifications || false,
                //         sms: response.data.sms_notifications || false,
                //         upload: response.data.document_upload_confirmation || false,
                //         appointment: response.data.appointment_reminders || false,
                //         invoice: response.data.invoice_alerts || false,
                //         message: response.data.message_notifications || false,
                //         marketing: response.data.marketing_emails || false,
                //         login: response.data.login_alerts || false,
                //     });
                // }
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
        try {
            // TODO: Replace with actual FirmAdmin API call
            // await firmAdminDashboardAPI.updateNotificationPreferences({
            //     email_notifications: preferences.email,
            //     sms_notifications: preferences.sms,
            //     document_upload_confirmation: preferences.upload,
            //     appointment_reminders: preferences.appointment,
            //     invoice_alerts: preferences.invoice,
            //     message_notifications: preferences.message,
            //     marketing_emails: preferences.marketing,
            //     login_alerts: preferences.login,
            // });
            toast.success("Notification preferences updated successfully!", {
                position: "top-right",
                autoClose: 3000,
            });
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setSaving(false);
        }
    };

    const notificationOptions = [
        { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
        { key: 'sms', label: 'SMS Notifications', description: 'Receive notifications via SMS' },
        { key: 'upload', label: 'Document Upload Confirmation', description: 'Get notified when documents are uploaded' },
        { key: 'appointment', label: 'Appointment Reminders', description: 'Receive reminders for upcoming appointments' },
        { key: 'invoice', label: 'Invoice Alerts', description: 'Get notified about invoice updates' },
        { key: 'message', label: 'Message Notifications', description: 'Receive notifications for new messages' },
        { key: 'marketing', label: 'Marketing Emails', description: 'Receive marketing and promotional emails' },
        { key: 'login', label: 'Login Alerts', description: 'Get notified when someone logs into your account' },
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                        Notification Preferences
                    </h3>
                    <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                        Choose how you want to be notified about important updates
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {notificationOptions.map((option) => (
                        <div key={option.key} className="flex items-center justify-between py-3 border-b border-[#E5E7EB] last:border-b-0">
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                                    {option.label}
                                </h4>
                                <p className="text-xs text-[#6B7280] font-[BasisGrotesquePro] mt-1">
                                    {option.description}
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer ml-4">
                                <input
                                    type="checkbox"
                                    checked={preferences[option.key]}
                                    onChange={() => togglePreference(option.key)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#3AD6F2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3AD6F2]"></div>
                            </label>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-6 mt-6 border-t border-[#E5E7EB]">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-[#3AD6F2] text-white rounded-lg hover:bg-[#2BC5E0] transition font-[BasisGrotesquePro] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

