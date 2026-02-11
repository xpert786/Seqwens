import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';

const API_BASE_URL = getApiBaseUrl();

const MembershipBilling = () => {
    const [billingData, setBillingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchBillingData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const token = getAccessToken();
            const url = `${API_BASE_URL}/user/staff/split-billing-management/`;

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
                setBillingData(result.data);
            } else {
                setError(result.message || 'Failed to fetch billing information');
            }
        } catch (err) {
            console.error('Error fetching membership billing:', err);
            setError(handleAPIError(err) || 'Failed to load billing information. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBillingData();
    }, [fetchBillingData]);

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C0C6]"></div>
                <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading billing details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-[BasisGrotesquePro]">
                {error}
                <button onClick={fetchBillingData} className="ml-4 underline font-medium">Retry</button>
            </div>
        );
    }

    if (!billingData) return null;

    const { sections, billing_summary } = billingData;

    return (
        <div className="space-y-6">
            <div className="bg-white !rounded-xl !border border-[#E8F0FF] p-6 shadow-sm">
                <h6 className="text-xl font-bold text-[#3B4A66] mb-2 font-[BasisGrotesquePro]">Membership & Billing Summary</h6>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Your personal cost breakdown based on the firm's split billing configuration.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-[#F3F7FF] !rounded-lg p-5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1 font-[BasisGrotesquePro]">Current Month Estimate</p>
                        <p className="text-3xl font-bold text-[#1F2937] font-[BasisGrotesquePro]">
                            ${billing_summary.estimated_monthly_total.toFixed(2)}
                            <span className="text-sm font-normal text-gray-500 ml-1">{billing_summary.currency}</span>
                        </p>
                    </div>
                    <div className="bg-[#F3F7FF] !rounded-lg p-5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1 font-[BasisGrotesquePro]">Billing Period</p>
                        <p className="text-sm font-medium text-[#1F2937] font-[BasisGrotesquePro]">
                            {new Date(billing_summary.period_start).toLocaleDateString()} - {new Date(billing_summary.period_end).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h7 className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro] uppercase tracking-wide">Detailed Breakdown</h7>
                    {sections.map((section) => (
                        <div key={section.id} className="flex items-center justify-between p-4 bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h8 className="text-base font-bold text-[#3B4A66] font-[BasisGrotesquePro]">{section.title}</h8>
                                    <span className={`px-2 py-0.5 !rounded-full text-[10px] font-bold uppercase ${section.is_covered ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {section.status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">{section.description}</p>
                            </div>
                            <div className="text-right ml-4">
                                <p className="text-lg font-bold text-[#1F2937] font-[BasisGrotesquePro]">
                                    ${section.portion_estimate.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-[#E8F0FF]">
                    <div className="flex items-start gap-3 bg-blue-50 p-4 !rounded-lg">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm font-bold text-blue-800 font-[BasisGrotesquePro]">Note on Resource Usage</p>
                            <p className="text-xs text-blue-600 font-[BasisGrotesquePro] mt-1">
                                Shared resource costs (SMS, E-signatures) are calculated based on your actual usage during the billing period.
                                The firm configuration determines how these costs are split between you and the firm.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MembershipBilling;
