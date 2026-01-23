import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SaveIcon } from "../../Components/icons";
import { superAdminAPI, handleAPIError } from "../../utils/superAdminAPI";
import { superToastOptions } from "../../utils/toastConfig";
import "../../style/Profile.css"
const TIMEZONE_OPTIONS = [
    { label: "Eastern (America/New_York)", value: "America/New_York" },
    { label: "Central (America/Chicago)", value: "America/Chicago" },
    { label: "Mountain (America/Denver)", value: "America/Denver" },
    { label: "Pacific (America/Los_Angeles)", value: "America/Los_Angeles" },
    { label: "UTC", value: "UTC" },
];

const SESSION_TIMEOUT_OPTIONS = [15, 30, 45, 60, 90, 120, 240];

const createDefaultFormState = () => ({
    platform_configuration: {
        platform_name: "",
        default_timezone: "UTC",
        session_timeout_minutes: 30,
        maintenance_mode: false,
        maintenance_message: "",
        support_email: "",
    },
    notification_settings: {
        email_notifications_enabled: false,
        sms_alerts_enabled: false,
        slack_integration_enabled: false,
        weekly_reports_enabled: false,
    },
    security_settings: {
        admin_2fa_required: false,
        audit_logging_enabled: false,
        max_login_attempts: 5,
    },
});

export default function Profile() {
    const [formState, setFormState] = useState(createDefaultFormState);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSystemSettings = async () => {
            setIsLoading(true);
            try {
                const response = await superAdminAPI.getSystemSettings();
                const payload = response?.data || response;

                if (payload && (response?.success !== false)) {
                    setFormState(() => {
                        const defaults = createDefaultFormState();
                        return {
                            platform_configuration: {
                                ...defaults.platform_configuration,
                                ...(payload.platform_configuration || {}),
                                session_timeout_minutes: Number(
                                    payload?.platform_configuration?.session_timeout_minutes ??
                                    defaults.platform_configuration.session_timeout_minutes
                                ),
                            },
                            notification_settings: {
                                ...defaults.notification_settings,
                                ...(payload.notification_settings || {}),
                            },
                            security_settings: {
                                ...defaults.security_settings,
                                ...(payload.security_settings || {}),
                                max_login_attempts: Number(
                                    payload?.security_settings?.max_login_attempts ??
                                    defaults.security_settings.max_login_attempts
                                ),
                            },
                        };
                    });
                }
            } catch (error) {
                const message = handleAPIError(error);
                toast.error(message, superToastOptions);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSystemSettings();
    }, []);

    const updateSectionField = (section, field, value) => {
        setFormState((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));
    };

    const handleToggle = (section, field) => {
        updateSectionField(section, field, !formState[section][field]);
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const payload = {
                platform_configuration: {
                    platform_name: formState.platform_configuration.platform_name,
                    default_timezone: formState.platform_configuration.default_timezone,
                    session_timeout_minutes: Number(
                        formState.platform_configuration.session_timeout_minutes
                    ),
                    maintenance_mode: formState.platform_configuration.maintenance_mode,
                    maintenance_message:
                        formState.platform_configuration.maintenance_message,
                },
                notification_settings: {
                    email_notifications_enabled:
                        formState.notification_settings.email_notifications_enabled,
                    sms_alerts_enabled:
                        formState.notification_settings.sms_alerts_enabled,
                    slack_integration_enabled:
                        formState.notification_settings.slack_integration_enabled,
                    weekly_reports_enabled:
                        formState.notification_settings.weekly_reports_enabled,
                },
                security_settings: {
                    admin_2fa_required:
                        formState.security_settings.admin_2fa_required,
                    audit_logging_enabled:
                        formState.security_settings.audit_logging_enabled,
                    max_login_attempts: Number(
                        formState.security_settings.max_login_attempts
                    ),
                },
            };

            if (formState.platform_configuration.support_email) {
                payload.platform_configuration.support_email =
                    formState.platform_configuration.support_email;
            }

            const response = await superAdminAPI.updateSystemSettings(payload);
            const responseData = response?.data || {};

            toast.success(
                response?.message || "System settings updated successfully.",
                superToastOptions
            );

            if (response && (response?.success !== false)) {
                setFormState((prev) => ({
                    ...prev,
                    platform_configuration: {
                        ...prev.platform_configuration,
                        ...(responseData.platform_configuration || response?.platform_configuration || {}),
                        session_timeout_minutes: Number(
                            responseData?.platform_configuration?.session_timeout_minutes ??
                            response?.platform_configuration?.session_timeout_minutes ??
                            prev.platform_configuration.session_timeout_minutes
                        ),
                    },
                    notification_settings: {
                        ...prev.notification_settings,
                        ...(responseData.notification_settings || response?.notification_settings || {}),
                    },
                    security_settings: {
                        ...prev.security_settings,
                        ...(responseData.security_settings || response?.security_settings || {}),
                        max_login_attempts: Number(
                            responseData?.security_settings?.max_login_attempts ??
                            response?.security_settings?.max_login_attempts ??
                            prev.security_settings.max_login_attempts
                        ),
                    },
                }));
            }
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message, superToastOptions);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            style={{
                backgroundColor: "#F3F7FF",
                padding: "10px",
                borderRadius: "12px",
                border: "none",
            }}
        >
            {isLoading && (
                <div
                    className="mb-3"
                    style={{
                        color: "#6B7280",
                        fontSize: "14px",
                        fontFamily: "BasisGrotesquePro",
                    }}
                >
                    Loading system settings...
                </div>
            )}

            <div className="flex flex-col gap-4 border border-[#E8F0FF] p-4 rounded-lg bg-white">
                {/* Platform Configuration Section */}
                <div>
                    <h5
                        className="mb-0 me-3"
                        style={{
                            color: "#3B4A66",
                            fontSize: "24px",
                            fontWeight: "500",
                            fontFamily: "BasisGrotesquePro",
                        }}
                    >
                        Platform Configuration
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
                        Core platform settings and configurations
                    </p>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <label
                                className="form-label"
                                style={{
                                    color: "#3B4A66",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    fontFamily: "BasisGrotesquePro",
                                }}
                            >
                                Platform Name
                            </label>
                            <input
                                type="text"
                                className="form-control w-full"
                                value={formState.platform_configuration.platform_name}
                                onChange={(event) =>
                                    updateSectionField(
                                        "platform_configuration",
                                        "platform_name",
                                        event.target.value
                                    )
                                }
                                disabled={isLoading || isSaving}
                                style={{
                                    backgroundColor: "white",
                                    border: "1px solid #E8F0FF",
                                    borderRadius: "6px",
                                    padding: "8px 12px",
                                    fontSize: "14px",
                                    color: "#495057",
                                }}
                            />
                        </div>

                        <div>
                            <label
                                className="form-label"
                                style={{
                                    color: "#3B4A66",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    fontFamily: "BasisGrotesquePro",
                                }}
                            >
                                Default Timezone
                            </label>
                            <select
                                className="form-control w-full"
                                value={formState.platform_configuration.default_timezone}
                                onChange={(event) =>
                                    updateSectionField(
                                        "platform_configuration",
                                        "default_timezone",
                                        event.target.value
                                    )
                                }
                                disabled={isLoading || isSaving}
                                style={{
                                    backgroundColor: "white",
                                    border: "1px solid #E8F0FF",
                                    borderRadius: "6px",
                                    padding: "8px 12px",
                                    fontSize: "14px",
                                    color: "#495057",
                                }}
                            >
                                {TIMEZONE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                className="form-label"
                                style={{
                                    color: "#3B4A66",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    fontFamily: "BasisGrotesquePro",
                                }}
                            >
                                Maintenance Message
                            </label>
                            <textarea
                                className="form-control w-full"
                                rows="4"
                                value={formState.platform_configuration.maintenance_message}
                                onChange={(event) =>
                                    updateSectionField(
                                        "platform_configuration",
                                        "maintenance_message",
                                        event.target.value
                                    )
                                }
                                disabled={isLoading || isSaving}
                                style={{
                                    backgroundColor: "white",
                                    border: "1px solid #E8F0FF",
                                    borderRadius: "6px",
                                    padding: "8px 12px",
                                    fontSize: "14px",
                                    color: "#495057",
                                    resize: "vertical",
                                }}
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <div>
                                <label
                                    className="form-label"
                                    style={{
                                        color: "#3B4A66",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        fontFamily: "BasisGrotesquePro",
                                    }}
                                >
                                    Enable Maintenance Mode
                                </label>
                            </div>
                            <div className="custom-toggle">
                                <input
                                    type="checkbox"
                                    id="maintenanceMode"
                                    checked={formState.platform_configuration.maintenance_mode}
                                    onChange={() =>
                                        handleToggle("platform_configuration", "maintenance_mode")
                                    }
                                    disabled={isLoading || isSaving}
                                />
                                <label htmlFor="maintenanceMode"></label>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <label
                                className="form-label"
                                style={{
                                    color: "#3B4A66",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    fontFamily: "BasisGrotesquePro",
                                }}
                            >
                                Support Email
                            </label>
                            <input
                                type="email"
                                className="form-control w-full"
                                value={formState.platform_configuration.support_email}
                                onChange={(event) =>
                                    updateSectionField(
                                        "platform_configuration",
                                        "support_email",
                                        event.target.value
                                    )
                                }
                                disabled={isLoading || isSaving}
                                style={{
                                    backgroundColor: "white",
                                    border: "1px solid #E8F0FF",
                                    borderRadius: "6px",
                                    padding: "8px 12px",
                                    fontSize: "14px",
                                    color: "#495057",
                                }}
                            />
                        </div>

                        <div>
                            <label
                                className="form-label"
                                style={{
                                    color: "#3B4A66",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    fontFamily: "BasisGrotesquePro",
                                }}
                            >
                                Session Timeout (minutes)
                            </label>
                            <select
                                className="form-control w-full"
                                value={
                                    formState.platform_configuration.session_timeout_minutes
                                }
                                onChange={(event) =>
                                    updateSectionField(
                                        "platform_configuration",
                                        "session_timeout_minutes",
                                        Number(event.target.value)
                                    )
                                }
                                disabled={isLoading || isSaving}
                                style={{
                                    backgroundColor: "white",
                                    border: "1px solid #E8F0FF",
                                    borderRadius: "6px",
                                    padding: "8px 12px",
                                    fontSize: "14px",
                                    color: "#495057",
                                }}
                            >
                                {SESSION_TIMEOUT_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border border-[#E8F0FF] p-4 rounded-lg bg-white mt-4">
                {/* Notification Settings Section */}
                <div>
                    <h5
                        className="mb-0 me-3"
                        style={{
                            color: "#3B4A66",
                            fontSize: "24px",
                            fontWeight: "500",
                            fontFamily: "BasisGrotesquePro",
                        }}
                    >
                        Notification Settings
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
                        Configure system-wide notification preferences
                    </p>
                </div>

                {/* Notification Toggles */}
                <div className="flex flex-col gap-4">
                    {/* Email Notifications */}
                    <div className="flex justify-between items-center">
                        <div>
                            <div
                                style={{
                                    color: "#3B4A66",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    fontFamily: "BasisGrotesquePro",
                                }}
                            >
                                Email Notifications
                            </div>
                            <p
                                style={{
                                    color: "#6B7280",
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    fontFamily: "BasisGrotesquePro",
                                    margin: "4px 0 0 0",
                                }}
                            >
                                Send email alerts for system events
                            </p>
                        </div>
                        <div className="custom-toggle">
                            <input
                                type="checkbox"
                                id="emailNotifications"
                                checked={
                                    formState.notification_settings.email_notifications_enabled
                                }
                                onChange={() =>
                                    handleToggle(
                                        "notification_settings",
                                        "email_notifications_enabled"
                                    )
                                }
                                disabled={isLoading || isSaving}
                            />
                            <label htmlFor="emailNotifications"></label>
                        </div>
                    </div>

                    {/* SMS Alerts */}
                    <div className="flex justify-between items-center">
                        <div>
                            <div
                                style={{
                                    color: "#3B4A66",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    fontFamily: "BasisGrotesquePro",
                                }}
                            >
                                SMS Alerts
                            </div>
                            <p
                                style={{
                                    color: "#6B7280",
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    fontFamily: "BasisGrotesquePro",
                                    margin: "4px 0 0 0",
                                }}
                            >
                                Send SMS for critical system issues
                            </p>
                        </div>
                        <div className="custom-toggle">
                            <input
                                type="checkbox"
                                id="smsAlerts"
                                checked={formState.notification_settings.sms_alerts_enabled}
                                onChange={() =>
                                    handleToggle(
                                        "notification_settings",
                                        "sms_alerts_enabled"
                                    )
                                }
                                disabled={isLoading || isSaving}
                            />
                            <label htmlFor="smsAlerts"></label>
                        </div>
                    </div>

                    {/* Weekly Reports */}
                    <div className="flex justify-between items-center">
                        <div>
                            <div
                                style={{
                                    color: "#3B4A66",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    fontFamily: "BasisGrotesquePro",
                                }}
                            >
                                Weekly Reports
                            </div>
                            <p
                                style={{
                                    color: "#6B7280",
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    fontFamily: "BasisGrotesquePro",
                                    margin: "4px 0 0 0",
                                }}
                            >
                                Automated weekly system reports
                            </p>
                        </div>
                        <div className="custom-toggle">
                            <input
                                type="checkbox"
                                id="weeklyReports"
                                checked={
                                    formState.notification_settings.weekly_reports_enabled
                                }
                                onChange={() =>
                                    handleToggle(
                                        "notification_settings",
                                        "weekly_reports_enabled"
                                    )
                                }
                                disabled={isLoading || isSaving}
                            />
                            <label htmlFor="weeklyReports"></label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border border-[#E8F0FF] p-4 rounded-lg bg-white mt-4">
                {/* Security Settings Section */}
                <div>
                    <h5
                        className="mb-0 me-3"
                        style={{
                            color: "#3B4A66",
                            fontSize: "24px",
                            fontWeight: "500",
                            fontFamily: "BasisGrotesquePro",
                        }}
                    >
                        Security Settings
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
                        Manage security requirements and login safeguards
                    </p>
                </div>

                <div className="flex flex-col gap-4 mt-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <div
                                style={{
                                    color: "#3B4A66",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    fontFamily: "BasisGrotesquePro",
                                }}
                            >
                                Require 2FA for Admins
                            </div>
                            <p
                                style={{
                                    color: "#6B7280",
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    fontFamily: "BasisGrotesquePro",
                                    margin: "4px 0 0 0",
                                }}
                            >
                                Enforce multi-factor authentication on all admin accounts
                            </p>
                        </div>
                        <div className="custom-toggle">
                            <input
                                type="checkbox"
                                id="admin2FA"
                                checked={formState.security_settings.admin_2fa_required}
                                onChange={() =>
                                    handleToggle("security_settings", "admin_2fa_required")
                                }
                                disabled={isLoading || isSaving}
                            />
                            <label htmlFor="admin2FA"></label>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <div
                                style={{
                                    color: "#3B4A66",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    fontFamily: "BasisGrotesquePro",
                                }}
                            >
                                Audit Logging
                            </div>
                            <p
                                style={{
                                    color: "#6B7280",
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    fontFamily: "BasisGrotesquePro",
                                    margin: "4px 0 0 0",
                                }}
                            >
                                Capture all admin activity for compliance tracking
                            </p>
                        </div>
                        <div className="custom-toggle">
                            <input
                                type="checkbox"
                                id="auditLogging"
                                checked={
                                    formState.security_settings.audit_logging_enabled
                                }
                                onChange={() =>
                                    handleToggle("security_settings", "audit_logging_enabled")
                                }
                                disabled={isLoading || isSaving}
                            />
                            <label htmlFor="auditLogging"></label>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label
                            className="form-label"
                            style={{
                                color: "#3B4A66",
                                fontSize: "14px",
                                fontWeight: "500",
                                fontFamily: "BasisGrotesquePro",
                            }}
                        >
                            Maximum Login Attempts
                        </label>
                        <input
                            type="number"
                            min={1}
                            className="form-control w-full"
                            value={formState.security_settings.max_login_attempts}
                            onChange={(event) =>
                                updateSectionField(
                                    "security_settings",
                                    "max_login_attempts",
                                    Number(event.target.value) || 1
                                )
                            }
                            disabled={isLoading || isSaving}
                            style={{
                                backgroundColor: "white",
                                border: "1px solid #E8F0FF",
                                borderRadius: "6px",
                                padding: "8px 12px",
                                fontSize: "14px",
                                color: "#495057",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="border border-[#E8F0FF] p-4 rounded-lg bg-white mt-4 save-config">

                <div className="d-flex justify-content-between align-items-center save-config-header">
                    <div className="save-config-text">
                        <h5
                            className="mb-0 me-3 save-config-title"
                            style={{
                                color: "#3B4A66",
                                fontSize: "24px",
                                fontWeight: "500",
                                fontFamily: "BasisGrotesquePro",
                            }}
                        >
                            Save Configuration
                        </h5>
                        <p
                            className="mb-0 save-config-subtitle"
                            style={{
                                color: "#4B5563",
                                fontSize: "14px",
                                fontWeight: "400",
                                fontFamily: "BasisGrotesquePro",
                            }}
                        >
                            Apply the latest configuration changes across the platform
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn d-flex align-items-center gap-2 px-6 py-2 rounded-lg save-config-btn"
                        style={{
                            backgroundColor: "#F56D2D",
                            color: "#ffffff",
                            fontSize: "15px",
                            fontWeight: "400",
                            fontFamily: "BasisGrotesquePro",
                            border: "none",
                            minWidth: "160px",
                            justifyContent: "center",
                        }}
                        onClick={handleSaveSettings}
                        disabled={isLoading || isSaving}
                    >
                        <SaveIcon />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>

            </div>

        </div>
    );
}
