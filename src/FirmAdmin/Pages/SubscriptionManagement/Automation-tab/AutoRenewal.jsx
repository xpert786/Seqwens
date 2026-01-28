import React, { useState, useEffect, useCallback } from 'react';
import { firmAdminSubscriptionAPI, handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const AutoRenewal = () => {
    const [enableAutoRenewal, setEnableAutoRenewal] = useState(true);
    const [requireApprovalOver, setRequireApprovalOver] = useState('50.00');
    const [maximumMonthlySpend, setMaximumMonthlySpend] = useState('500.00');
    const [retryFailedPaymentsDays, setRetryFailedPaymentsDays] = useState(3);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Fetch auto-renewal settings
    const fetchAutoRenewalSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await firmAdminSubscriptionAPI.getAutoRenewalSettings();

            if (response.success && response.data) {
                setEnableAutoRenewal(response.data.enable_auto_renewal || false);
                setRequireApprovalOver(response.data.require_approval_over || '50.00');
                setMaximumMonthlySpend(response.data.maximum_monthly_spend || '500.00');
                setRetryFailedPaymentsDays(response.data.retry_failed_payments_days || 3);
            }
        } catch (err) {
            console.error('Error fetching auto-renewal settings:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to load auto-renewal settings');
            toast.error(errorMsg || 'Failed to load auto-renewal settings', {
                position: 'top-right',
                autoClose: 3000
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAutoRenewalSettings();
    }, [fetchAutoRenewalSettings]);

    // Save auto-renewal settings
    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            setError('');

            const settings = {
                enable_auto_renewal: enableAutoRenewal,
                require_approval_over: requireApprovalOver,
                maximum_monthly_spend: maximumMonthlySpend,
                retry_failed_payments_days: retryFailedPaymentsDays
            };

            const response = await firmAdminSubscriptionAPI.updateAutoRenewalSettings(settings);

            if (response.success) {
                toast.success(response.message || 'Auto-renewal settings saved successfully!', {
                    position: 'top-right',
                    autoClose: 3000
                });
            } else {
                throw new Error(response.message || 'Failed to save settings');
            }
        } catch (err) {
            console.error('Error saving auto-renewal settings:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to save auto-renewal settings');
            toast.error(errorMsg || 'Failed to save auto-renewal settings', {
                position: 'top-right',
                autoClose: 5000
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div>
                <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Auto-Renewal Settings</h6>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Configure automatic subscription renewal preferences</p>
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Auto-Renewal Settings</h6>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Configure automatic subscription renewal preferences</p>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-[BasisGrotesquePro]">
                    {error}
                </div>
            )}

            <div className="space-y-6">
                {/* Enable Auto-Renewal */}
                <div className="mt-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h6 className="text-base font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Enable Auto-Renewal</h6>
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Automatically renew subscriptions to prevent service interruption</p>
                        </div>
                        <div className="flex-shrink-0">
                            <button
                                onClick={() => setEnableAutoRenewal(!enableAutoRenewal)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enableAutoRenewal ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableAutoRenewal ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Approval and Spend Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Require Approval Over */}
                    <div>
                        <label className="block text-base font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">Require Approval Over ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="px-3 py-2 bg-white !border border-gray-300 !rounded-lg text-sm text-gray-700 font-[BasisGrotesquePro] w-full"
                            value={requireApprovalOver}
                            onChange={(e) => setRequireApprovalOver(e.target.value)}
                            placeholder="50.00"
                        />
                        <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">Require approval for charges above this amount</p>
                    </div>

                    {/* Maximum Monthly Spend */}
                    <div>
                        <label className="block text-base font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">Maximum Monthly Spend ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="px-3 py-2 bg-white !border border-gray-300 !rounded-lg text-sm text-gray-700 font-[BasisGrotesquePro] w-full"
                            value={maximumMonthlySpend}
                            onChange={(e) => setMaximumMonthlySpend(e.target.value)}
                            placeholder="500.00"
                        />
                        <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">Maximum amount that can be spent per month</p>
                    </div>
                </div>

                {/* Retry Failed Payments Days */}
                <div>
                    <label className="block text-base font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">Days to Retry Failed Payments</label>
                    <input
                        type="number"
                        min="0"
                        max="30"
                        className="px-3 py-2 bg-white !border border-gray-300 !rounded-lg text-sm text-gray-700 font-[BasisGrotesquePro] w-full max-w-xs"
                        value={retryFailedPaymentsDays}
                        onChange={(e) => setRetryFailedPaymentsDays(parseInt(e.target.value) || 0)}
                        placeholder="3"
                    />
                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">Number of days to retry failed payments before suspension</p>
                </div>

                {/* Save Button */}
                <div className="flex justify-start">
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="px-6 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#EA580C] transition-colors font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Saving...
                            </>
                        ) : (
                            'Save Auto-Renewal Settings'
                        )}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default AutoRenewal;

