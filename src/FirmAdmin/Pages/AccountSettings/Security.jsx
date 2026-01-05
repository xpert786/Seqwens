import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { userAPI, handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import TwoFactorSetupModal from "../../../Taxpreparer/pages/AccountSettings/TwoFactorSetupModal";
import "../../../Taxpreparer/styles/icon.css";

export default function Security() {
    const [twoFactor, setTwoFactor] = useState(false);
    const [twoFactorEnabledAt, setTwoFactorEnabledAt] = useState(null);
    const [loginAlerts, setLoginAlerts] = useState(true);
    const [sessionTimeout, setSessionTimeout] = useState(30);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // 2FA Setup Modal state
    const [show2FASetupModal, setShow2FASetupModal] = useState(false);

    // 2FA Disable states
    const [showDisable2FA, setShowDisable2FA] = useState(false);
    const [disablePassword, setDisablePassword] = useState('');
    const [disabling, setDisabling] = useState(false);
    const [disableError, setDisableError] = useState(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState(null);

    useEffect(() => {
        const fetchSecurityPreferences = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch 2FA status using user API
                try {
                    const response = await userAPI.setup2FA();
                    if (response.success && response.data.is_enabled) {
                        setTwoFactor(true);
                        setTwoFactorEnabledAt(response.data.enabled_at || null);
                    }
                } catch (err) {
                    // If 2FA is not enabled, this is fine
                    console.log('2FA status check:', err.message);
                }
                // TODO: Replace with actual FirmAdmin API call for other settings
                // const data = await firmAdminDashboardAPI.getSecurityPreferences();
                // setLoginAlerts(data.login_alerts || false);
                // setSessionTimeout(data.session_timeout || 30);
            } catch (err) {
                console.error('Error fetching security preferences:', err);
                setError(handleAPIError(err));
            } finally {
                setLoading(false);
            }
        };
        fetchSecurityPreferences();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            // TODO: Replace with actual FirmAdmin API call
            // await firmAdminDashboardAPI.updateSecurityPreferences({
            //     login_alerts: loginAlerts,
            //     session_timeout: sessionTimeout,
            // });
            toast.success("Security settings updated successfully!", {
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

    // 2FA Setup Functions
    const handleSetup2FA = () => {
        setShow2FASetupModal(true);
    };

    const handle2FASetupSuccess = async () => {
        // Refresh 2FA status after setup
        try {
            const response = await userAPI.setup2FA();
            if (response.success && response.data.is_enabled) {
                setTwoFactor(true);
                setTwoFactorEnabledAt(response.data.enabled_at || null);
            }
        } catch (err) {
            console.error('Error fetching updated 2FA status:', err);
        }
    };

    const handleDisable2FA = async () => {
        if (!disablePassword) {
            setDisableError('Please enter your password');
            return;
        }

        setDisabling(true);
        setDisableError(null);

        try {
            const response = await userAPI.disable2FA(disablePassword);
            
            if (response.success) {
                setTwoFactor(false);
                setTwoFactorEnabledAt(null);
                setShowDisable2FA(false);
                setDisablePassword('');
                
                toast.success("2FA disabled successfully", {
                    position: "top-right",
                    autoClose: 3000,
                });
            } else {
                throw new Error(response.message || 'Failed to disable 2FA');
            }
        } catch (err) {
            console.error('Error disabling 2FA:', err);
            const errorMessage = handleAPIError(err);
            setDisableError(errorMessage);
            toast.error(errorMessage || "Failed to disable 2FA", {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setDisabling(false);
        }
    };

    const cancelDisable2FA = () => {
        setShowDisable2FA(false);
        setDisablePassword('');
        setDisableError(null);
    };

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match");
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters long");
            return;
        }

        setPasswordSaving(true);
        setPasswordError(null);
        try {
            // TODO: Replace with actual FirmAdmin API call
            // await firmAdminDashboardAPI.changePassword({
            //     current_password: currentPassword,
            //     new_password: newPassword,
            // });
            toast.success("Password changed successfully!", {
                position: "top-right",
                autoClose: 3000,
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setPasswordError(errorMessage);
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setPasswordSaving(false);
        }
    };

    // Show loading state while fetching preferences
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <span className="ms-2">Loading security settings...</span>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: "#F3F7FF",
            padding: "10px",
            borderRadius: "12px",
            border: "none"
        }}>
            <div className="flex flex-col gap-4 border border-[#E8F0FF] p-4 rounded-lg bg-white">
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
                        Manage your account security and privacy
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert" style={{ fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
                        {error}
                    </div>
                )}

                {/* Two-Factor Authentication */}
                <div className="py-3 border-bottom" style={{ borderColor: "#E8F0FF" }}>
                    <div className="d-flex justify-content-between align-items-start mb-3">
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
                                Two-Factor Authentication
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
                                Add an extra layer of security to your account
                            </p>
                            {twoFactor && twoFactorEnabledAt && (
                                <p
                                    className="mb-0 mt-2"
                                    style={{
                                        color: "#10B981",
                                        fontSize: "12px",
                                        fontWeight: "400",
                                        fontFamily: "BasisGrotesquePro",
                                    }}
                                >
                                    ✓ Enabled {twoFactorEnabledAt ? `on ${new Date(twoFactorEnabledAt).toLocaleDateString()}` : ''}
                                </p>
                            )}
                        </div>
                        <div>
                            {!twoFactor ? (
                                <button
                                    type="button"
                                    onClick={handleSetup2FA}
                                    className="btn btn-sm"
                                    style={{
                                        backgroundColor: "#F56D2D",
                                        color: "#ffffff",
                                        fontSize: "14px",
                                        fontWeight: "400",
                                        fontFamily: "BasisGrotesquePro",
                                        border: "none",
                                        padding: "6px 16px",
                                        borderRadius: "6px",
                                    }}
                                >
                                    Enable 2FA
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowDisable2FA(true)}
                                    className="btn btn-sm"
                                    style={{
                                        backgroundColor: "#dc3545",
                                        color: "#ffffff",
                                        fontSize: "14px",
                                        fontWeight: "400",
                                        fontFamily: "BasisGrotesquePro",
                                        border: "none",
                                        padding: "6px 16px",
                                        borderRadius: "6px",
                                    }}
                                >
                                    Disable 2FA
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 2FA Disable Modal */}
                    {showDisable2FA && (
                        <div className="mt-4 p-4 border rounded" style={{ borderColor: "#E8F0FF", backgroundColor: "#F9FAFB" }}>
                            <h6 style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro", marginBottom: "8px" }}>
                                Disable Two-Factor Authentication
                            </h6>
                            <p style={{ color: "#4B5563", fontSize: "14px", fontFamily: "BasisGrotesquePro", marginBottom: "16px" }}>
                                For security reasons, please enter your current password to disable 2FA.
                            </p>
                            
                            <div className="mb-3">
                                <label style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro", marginBottom: "8px", display: "block" }}>
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={disablePassword}
                                    onChange={(e) => {
                                        setDisablePassword(e.target.value);
                                        setDisableError(null);
                                    }}
                                    placeholder="Enter your password"
                                    style={{
                                        color: "#3B4A66",
                                        fontSize: "14px",
                                        fontFamily: "BasisGrotesquePro",
                                        border: disableError ? "1px solid #dc3545" : "1px solid #E8F0FF",
                                        borderRadius: "8px",
                                        padding: "8px 12px"
                                    }}
                                />
                                {disableError && (
                                    <div className="text-danger mt-1" style={{ fontSize: "12px", fontFamily: "BasisGrotesquePro" }}>
                                        {disableError}
                                    </div>
                                )}
                            </div>

                            <div className="d-flex gap-2 justify-content-end">
                                <button
                                    type="button"
                                    onClick={cancelDisable2FA}
                                    className="btn btn-sm"
                                    style={{
                                        backgroundColor: "transparent",
                                        color: "#3B4A66",
                                        fontSize: "14px",
                                        fontFamily: "BasisGrotesquePro",
                                        border: "1px solid #E8F0FF",
                                        padding: "6px 16px",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDisable2FA}
                                    disabled={disabling || !disablePassword}
                                    className="btn btn-sm"
                                    style={{
                                        backgroundColor: "#dc3545",
                                        color: "#ffffff",
                                        fontSize: "14px",
                                        fontFamily: "BasisGrotesquePro",
                                        border: "none",
                                        padding: "6px 16px",
                                        opacity: (disabling || !disablePassword) ? 0.6 : 1,
                                        cursor: (disabling || !disablePassword) ? "not-allowed" : "pointer",
                                    }}
                                >
                                    {disabling ? 'Disabling...' : 'Disable 2FA'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Session Timeout */}
                <div className="py-3">
                    <label
                        htmlFor="sessionTimeout"
                        style={{
                            color: "#3B4A66",
                            fontSize: "16px",
                            fontWeight: "500",
                            fontFamily: "BasisGrotesquePro",
                            marginBottom: "8px",
                            display: "block"
                        }}
                    >
                        Session Timeout
                    </label>
                    <select
                        id="sessionTimeout"
                        className="form-select"
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(Number(e.target.value))}
                        style={{
                            maxWidth: "300px",
                            borderRadius: "8px",
                            fontFamily: "BasisGrotesquePro",
                            border: "1px solid #E8F0FF",
                            padding: "8px 12px"
                        }}
                    >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                    </select>
                </div>

                {/* Login Alerts */}
                <div className="flex justify-between items-center py-3 border-top border-bottom" style={{ borderColor: "#E8F0FF" }}>
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
                            Login Alerts
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
                            Get notified when someone logs into your account
                        </p>
                    </div>
                    <div className="custom-toggle ml-4">
                        <input
                            type="checkbox"
                            id="loginAlerts"
                            checked={loginAlerts}
                            onChange={(e) => setLoginAlerts(e.target.checked)}
                        />
                        <label htmlFor="loginAlerts"></label>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-1">
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
                            'Save Security Settings'
                        )}
                    </button>
                </div>
            </div>

            {/* Password Section */}
            <div className="flex flex-col gap-4 border border-[#E8F0FF] p-4 rounded-lg bg-white mt-4">
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
                        Password
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
                        Update your password to keep your account secure
                    </p>
                </div>

                {passwordError && (
                    <div className="alert alert-danger" role="alert" style={{ fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
                        {passwordError}
                    </div>
                )}

                <form>
                    <div className="mb-3">
                        <label
                            className="form-label"
                            style={{
                                color: "#3B4A66",
                                fontSize: "14px",
                                fontWeight: "500",
                                fontFamily: "BasisGrotesquePro"
                            }}
                        >
                            Current Password
                        </label>
                        <input
                            type="password"
                            className="form-control w-full"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            style={{
                                color: "#3B4A66",
                                fontSize: "14px",
                                fontWeight: "400",
                                fontFamily: "BasisGrotesquePro",
                                border: "1px solid #E8F0FF",
                                borderRadius: "8px",
                                padding: "8px 12px"
                            }}
                        />
                    </div>
                    <div className="mb-3">
                        <label
                            className="form-label"
                            style={{
                                color: "#3B4A66",
                                fontSize: "14px",
                                fontWeight: "500",
                                fontFamily: "BasisGrotesquePro"
                            }}
                        >
                            New Password
                        </label>
                        <input
                            type="password"
                            className="form-control w-full"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={{
                                color: "#3B4A66",
                                fontSize: "14px",
                                fontWeight: "400",
                                fontFamily: "BasisGrotesquePro",
                                border: "1px solid #E8F0FF",
                                borderRadius: "8px",
                                padding: "8px 12px"
                            }}
                        />
                    </div>
                    <div className="mb-3">
                        <label
                            className="form-label"
                            style={{
                                color: "#3B4A66",
                                fontSize: "14px",
                                fontWeight: "500",
                                fontFamily: "BasisGrotesquePro"
                            }}
                        >
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            className="form-control w-full"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{
                                color: "#3B4A66",
                                fontSize: "14px",
                                fontWeight: "400",
                                fontFamily: "BasisGrotesquePro",
                                border: "1px solid #E8F0FF",
                                borderRadius: "8px",
                                padding: "8px 12px"
                            }}
                        />
                    </div>
                    <button
                        type="button"
                        className="btn px-4 py-2 rounded-lg"
                        onClick={handlePasswordChange}
                        disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                        style={{
                            color: "#3B4A66",
                            fontSize: "15px",
                            fontWeight: "400",
                            fontFamily: "BasisGrotesquePro",
                            background: "#F3F7FF",
                            border: "1px solid #E8F0FF",
                            opacity: (passwordSaving || !currentPassword || !newPassword || !confirmPassword) ? 0.6 : 1,
                            cursor: (passwordSaving || !currentPassword || !newPassword || !confirmPassword) ? "not-allowed" : "pointer",
                        }}
                    >
                        {passwordSaving ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>

            {/* 2FA Setup Modal */}
            <TwoFactorSetupModal
                show={show2FASetupModal}
                onClose={() => setShow2FASetupModal(false)}
                onSuccess={handle2FASetupSuccess}
            />
        </div>
    );
}

