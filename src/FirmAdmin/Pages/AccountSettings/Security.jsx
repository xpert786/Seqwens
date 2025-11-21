import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";

export default function Security() {
    const [twoFactor, setTwoFactor] = useState(false);
    const [loginAlerts, setLoginAlerts] = useState(true);
    const [sessionTimeout, setSessionTimeout] = useState(30);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

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
                // TODO: Replace with actual FirmAdmin API call
                // const data = await firmAdminDashboardAPI.getSecurityPreferences();
                // setTwoFactor(data.two_factor_authentication || false);
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
            //     two_factor_authentication: twoFactor,
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

    return (
        <div className="space-y-6">
            {/* Security Settings */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                            Security Settings
                        </h3>
                        <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                            Manage your account security preferences
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                                    Two-Factor Authentication
                                </h4>
                                <p className="text-xs text-[#6B7280] font-[BasisGrotesquePro] mt-1">
                                    Add an extra layer of security to your account
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={twoFactor}
                                    onChange={(e) => setTwoFactor(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#3AD6F2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3AD6F2]"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                                    Login Alerts
                                </h4>
                                <p className="text-xs text-[#6B7280] font-[BasisGrotesquePro] mt-1">
                                    Get notified when someone logs into your account
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={loginAlerts}
                                    onChange={(e) => setLoginAlerts(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#3AD6F2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3AD6F2]"></div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                Session Timeout (minutes)
                            </label>
                            <input
                                type="number"
                                value={sessionTimeout}
                                onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 30)}
                                min="5"
                                max="480"
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
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
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                            Change Password
                        </h3>
                        <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                            Update your password to keep your account secure
                        </p>
                    </div>

                    {passwordError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {passwordError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                                placeholder="Enter current password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                                placeholder="Enter new password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                                placeholder="Confirm new password"
                            />
                        </div>
                        <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
                            <button
                                onClick={handlePasswordChange}
                                disabled={passwordSaving}
                                className="px-6 py-2 bg-[#3AD6F2] text-white rounded-lg hover:bg-[#2BC5E0] transition font-[BasisGrotesquePro] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {passwordSaving ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

