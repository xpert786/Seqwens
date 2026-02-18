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
        <div className="space-y-6">
            {/* Summary Header */}
            {hasCritical && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-pulse">
                    <span className="text-xl">⚠️</span>
                    <p>CRITICAL: Usage limits exceeded. Please review and take action immediately.</p>
                </div>
            )}

            {alerts.length === 0 ? (
                <div className="text-center py-20 bg-green-50/50 rounded-2xl border border-dashed border-green-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h6 className="text-lg font-bold text-green-800 font-[BasisGrotesquePro]">System All Clear</h6>
                    <p className="mt-1 text-sm text-green-600 font-[BasisGrotesquePro]">All usage is within normal limits. No active alerts.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {alerts.map((alert) => (
                        <div key={alert.id} className="bg-white !rounded-xl !border border-[#E8F0FF] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-2 h-2 rounded-full ${(alert.severity || '').toLowerCase() === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                                            }`}></div>
                                        <h6 className="text-base sm:text-lg font-bold text-[#1F2A55] font-[BasisGrotesquePro]">{alert.title}</h6>
                                    </div>
                                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] leading-relaxed mb-3">{alert.description}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {alert.timestamp}
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto text-right">
                                    <span className={`inline-block px-4 py-1.5 ${alert.severityColor} text-white !rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm`}>
                                        {alert.severity}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Refresh Button */}
            <div className="pt-4 flex justify-center">
                <button
                    onClick={fetchAlerts}
                    className="flex items-center gap-2 px-8 py-3 bg-white !border border-[#E8F0FF] text-[#3B4A66] !rounded-xl hover:bg-gray-50 hover:border-[#3AD6F2]/30 transition-all font-[BasisGrotesquePro] text-sm font-bold shadow-sm"
                >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loading ? 'Refreshing...' : 'Refresh Alerts'}
                </button>
            </div>
        </div>
    );
};

export default UsageAlerts;
