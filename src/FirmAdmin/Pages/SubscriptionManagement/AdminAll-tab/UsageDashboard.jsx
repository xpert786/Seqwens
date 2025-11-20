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
            const url = `${API_BASE_URL}/superadmin/subscriptions/usage-dashboard/`;

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
        <div>
            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Usage Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {loading ? (
                    <>
                        {[1, 2, 3].map((index) => (
                            <div key={index} className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                                <div className="animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                                    <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                                    <div className="h-2 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </>
                ) : overallUsage.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <p className="text-sm text-gray-600">No usage data available</p>
                    </div>
                ) : (
                    overallUsage.map((card, index) => (
                        <div key={index} className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                            <p className="text-sm text-[#3B4A66] font-[BasisGrotesquePro] mb-2 text-[15px]">{card.label}</p>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs text-gray-600 font-[BasisGrotesquePro]">{card.status}</p>
                                <p className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                                    {card.display || `${card.used}/${card.total}`}
                                </p>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full transition-all ${
                                        card.percentage >= 90 
                                            ? 'bg-[#EF4444]' 
                                            : card.percentage >= 70 
                                            ? 'bg-[#F59E0B]' 
                                            : 'bg-[#3AD6F2]'
                                    }`}
                                    style={{ width: `${Math.min(card.percentage || 0, 100)}%` }}
                                ></div>
                            </div>
                            {card.percentage !== undefined && (
                                <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">
                                    {card.percentage.toFixed(1)}% used
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Individual Usage Breakdown */}
            <div className="p-4 sm:p-6">
                <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Individual Usage Breakdown</h6>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Monitor resource consumption by staff member</p>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-sm text-gray-600">Loading usage data...</p>
                    </div>
                ) : individualUsage.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-sm text-gray-600">No individual usage data available</p>
                    </div>
                ) : (
                    <>
                        {/* Table Header */}
                        <div className="grid grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
                            <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Staff Member</div>
                            <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">E-Signatures</div>
                            <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Storage (GB)</div>
                            <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">API Calls</div>
                            <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Status</div>
                        </div>

                        {/* Staff Rows */}
                        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                            {individualUsage.map((staff) => (
                                <div key={staff.staff_id} className="grid grid-cols-5 gap-2 sm:gap-3 lg:gap-4 items-center p-2 sm:p-3 lg:p-4 !border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition-colors">
                                    {/* Staff Member Column */}
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro] mb-0.5">{staff.staff_name}</p>
                                        <p className="text-xs text-gray-600 font-[BasisGrotesquePro]">{staff.staff_email}</p>
                                    </div>

                                    {/* E-Signatures Column */}
                                    <div className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                        {staff.e_signatures || 0}
                                    </div>

                                    {/* Storage Column */}
                                    <div className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                        {formatStorage(staff.storage_mb)}
                                    </div>

                                    {/* API Calls Column */}
                                    <div className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                        {staff.api_calls || 0}
                                    </div>

                                    {/* Status Column */}
                                    <div>
                                        <span className={`px-3 py-1 !rounded-full text-xs font-medium font-[BasisGrotesquePro] ${getStatusColor(staff.status)}`}>
                                            {staff.status || 'Normal'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default UsageDashboard;
