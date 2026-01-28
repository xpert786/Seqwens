import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';

const API_BASE_URL = getApiBaseUrl();

const UsageAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hasCritical, setHasCritical] = useState(false);

    // Fetch usage alerts from backend
    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const token = getAccessToken();
            const url = `${API_BASE_URL}/user/firm-admin/subscriptions/usage-alerts/`;

            const response = await fetchWithCors(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                setAlerts(result.data.alerts || []);
                setHasCritical(result.data.has_critical || false);
            } else {
                setAlerts([]);
            }
        } catch (err) {
            console.error('Error fetching usage alerts:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to load usage alerts.');
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch alerts on mount
    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-sm text-gray-600">Loading usage alerts...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
            </div>
        );
    }

    return (
        <div>
            {/* Summary Header */}
            {hasCritical && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm font-medium">
                    ⚠️ Critical: You have usage limits that have been exceeded. Please review and take action.
                </div>
            )}

            {alerts.length === 0 ? (
                <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
                    <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-4 text-sm text-green-700 font-[BasisGrotesquePro]">All usage is within normal limits. No alerts at this time.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {alerts.map((alert) => (
                        <div key={alert.id} className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h6 className="text-base font-bold text-gray-900 mb-1 font-[BasisGrotesquePro]">{alert.title}</h6>
                                    <p className="text-sm text-gray-700 font-[BasisGrotesquePro] mb-1">{alert.description}</p>
                                    <p className="text-xs text-gray-700 font-[BasisGrotesquePro]">{alert.timestamp}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <span className={`px-3 py-1 ${alert.severityColor} text-white !rounded-full text-xs font-medium font-[BasisGrotesquePro]`}>
                                        {alert.severity}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Refresh Button */}
            <div className="mt-6 text-center">
                <button
                    onClick={fetchAlerts}
                    className="px-4 py-2 bg-white !border border-gray-300 text-gray-700 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm font-medium"
                >
                    Refresh Alerts
                </button>
            </div>
        </div>
    );
};

export default UsageAlerts;
