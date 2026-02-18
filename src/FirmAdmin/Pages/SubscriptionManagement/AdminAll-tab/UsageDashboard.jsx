import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';

const API_BASE_URL = getApiBaseUrl();

const UsageDashboard = () => {
    // State management
    const [overallUsage, setOverallUsage] = useState([]);
    const [individualUsage, setIndividualUsage] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch usage dashboard data
    const fetchUsageData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const token = getAccessToken();
            // Using superadmin endpoint as provided
            // If there's a firm-admin specific endpoint, it can be changed here
            const url = `${API_BASE_URL}/user/firm-admin/subscriptions/usage-dashboard/`;

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
                setOverallUsage(result.data.overall_usage || []);
                setIndividualUsage(result.data.individual_usage || []);
            } else {
                setOverallUsage([]);
                setIndividualUsage([]);
            }
        } catch (err) {
            console.error('Error fetching usage dashboard data:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to load usage dashboard data. Please try again.');
            setOverallUsage([]);
            setIndividualUsage([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch data on mount
    useEffect(() => {
        fetchUsageData();
    }, [fetchUsageData]);

    // Get status color for individual usage
    const getStatusColor = (status) => {
        const statusLower = (status || '').toLowerCase();
        switch (statusLower) {
            case 'normal':
                return 'bg-[#22C55E] text-white';
            case 'warning':
                return 'bg-[#F59E0B] text-white';
            case 'critical':
                return 'bg-[#EF4444] text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    // Format storage from MB to GB
    const formatStorage = (storageMb) => {
        if (!storageMb) return '0';
        const storageGb = storageMb / 1024;
        return storageGb.toFixed(2);
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Error Message */}
            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Usage Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {loading ? (
                    <>
                        {[1, 2, 3].map((index) => (
                            <div key={index} className="bg-white !rounded-xl !border border-[#E8F0FF] p-5 sm:p-6 shadow-sm">
                                <div className="animate-pulse">
                                    <div className="h-4 bg-gray-100 rounded w-24 mb-4"></div>
                                    <div className="h-8 bg-gray-100 rounded w-32 mb-4"></div>
                                    <div className="h-2 bg-gray-100 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </>
                ) : overallUsage.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">No usage data available at this time</p>
                    </div>
                ) : (
                    overallUsage.map((card, index) => (
                        <div key={index} className="bg-white !rounded-xl !border border-[#E8F0FF] p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-xs sm:text-sm text-[#3B4A66] font-bold uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">{card.label}</p>
                            <div className="flex justify-between items-end mb-3">
                                <p className="text-2xl sm:text-3xl font-bold text-[#1F2A55] font-[BasisGrotesquePro]">
                                    {card.display || `${card.used}/${card.total}`}
                                </p>
                                <p className="text-sm font-bold text-[#3AD6F2] font-[BasisGrotesquePro]">
                                    {card.percentage?.toFixed(1)}%
                                </p>
                            </div>
                            <div className="w-full bg-[#F3F7FF] rounded-full h-2.5 overflow-hidden border border-[#E8F0FF]">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ease-out ${card.percentage >= 90
                                        ? 'bg-red-500'
                                        : card.percentage >= 70
                                            ? 'bg-orange-500'
                                            : 'bg-[#3AD6F2]'
                                        }`}
                                    style={{ width: `${Math.min(card.percentage || 0, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-500 font-[BasisGrotesquePro] mt-2 flex items-center">
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${(card.status || '').toLowerCase() === 'normal' ? 'bg-green-500' : 'bg-orange-500'
                                    }`}></span>
                                {card.status}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Individual Usage Breakdown */}
            <div className="bg-white !rounded-xl !border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
                <div className="mb-6">
                    <h6 className="text-lg sm:text-xl font-bold text-[#1F2A55] mb-1 font-[BasisGrotesquePro]">Individual Usage Breakdown</h6>
                    <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">Monitor resource consumption by staff member</p>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#3AD6F2]/30 border-t-[#3AD6F2]"></div>
                        <p className="mt-4 text-sm text-gray-500 font-[BasisGrotesquePro]">Analyzing usage patterns...</p>
                    </div>
                ) : individualUsage.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">No individual usage records found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar -mx-4 sm:mx-0">
                        <div className="min-w-[800px] px-4 sm:px-0">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-4 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Staff Member</th>
                                        <th className="text-left py-4 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">E-Signatures</th>
                                        <th className="text-left py-4 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Storage (GB)</th>
                                        <th className="text-left py-4 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">API Calls</th>
                                        <th className="text-left py-4 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {individualUsage.map((staff) => (
                                        <tr key={staff.staff_id} className="hover:bg-[#F8FAFF] transition-colors group">
                                            <td className="py-4 px-4">
                                                <div>
                                                    <p className="text-sm font-bold text-[#1F2A55] font-[BasisGrotesquePro]">{staff.staff_name}</p>
                                                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">{staff.staff_email}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                                                    {staff.e_signatures || 0}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                                                    {formatStorage(staff.storage_mb)} GB
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                                                    {staff.api_calls || 0}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border ${(staff.status || '').toLowerCase() === 'normal'
                                                    ? 'bg-green-50 text-green-700 border-green-100'
                                                    : (staff.status || '').toLowerCase() === 'warning'
                                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                        : 'bg-red-50 text-red-700 border-red-100'
                                                    }`}>
                                                    {staff.status || 'Normal'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsageDashboard;
