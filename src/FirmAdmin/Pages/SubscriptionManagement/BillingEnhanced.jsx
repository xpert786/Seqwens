import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const API_BASE_URL = getApiBaseUrl();

const BillingEnhanced = () => {
    const [billingSummary, setBillingSummary] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [splitConfig, setSplitConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingConfig, setSavingConfig] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [splitPercentage, setSplitPercentage] = useState(50);

    // Fetch billing summary
    const fetchBillingSummary = useCallback(async () => {
        try {
            const token = getAccessToken();
            const response = await fetchWithCors(`${API_BASE_URL}/user/firm-admin/billing/summary/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success && result.data) {
                setBillingSummary(result.data);
            }
        } catch (err) {
            console.error('Error fetching billing summary:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to load billing summary');
        }
    }, []);

    // Fetch invoices
    const fetchInvoices = useCallback(async () => {
        try {
            const token = getAccessToken();
            const response = await fetchWithCors(`${API_BASE_URL}/user/firm-admin/billing/invoices/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success && result.data) {
                setInvoices(result.data.invoices || []);
            }
        } catch (err) {
            console.error('Error fetching invoices:', err);
        }
    }, []);

    // Fetch split billing config
    const fetchSplitConfig = useCallback(async () => {
        try {
            const token = getAccessToken();
            const response = await fetchWithCors(`${API_BASE_URL}/user/firm-admin/billing/split-config/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success && result.data) {
                setSplitConfig(result.data);
                if (result.data.shared_resources?.split_percentage !== undefined) {
                    setSplitPercentage(result.data.shared_resources.split_percentage);
                }
            }
        } catch (err) {
            console.error('Error fetching split config:', err);
        }
    }, []);

    // Update split billing config
    const updateSplitConfig = async (updatedConfig) => {
        try {
            setSavingConfig(true);
            const token = getAccessToken();
            const response = await fetchWithCors(`${API_BASE_URL}/user/firm-admin/billing/split-config/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updatedConfig),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                setSplitConfig(result.data);
                if (result.data.shared_resources?.split_percentage !== undefined) {
                    setSplitPercentage(result.data.shared_resources.split_percentage);
                }
                toast.success('Split billing configuration updated successfully');
                setIsModalOpen(false);
            }
        } catch (err) {
            console.error('Error updating split config:', err);
            toast.error('Failed to update split billing configuration');
        } finally {
            setSavingConfig(false);
        }
    };

    // Fetch all data on mount
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            await Promise.all([
                fetchBillingSummary(),
                fetchInvoices(),
                fetchSplitConfig(),
            ]);
            setLoading(false);
        };
        fetchAllData();
    }, [fetchBillingSummary, fetchInvoices, fetchSplitConfig]);

    // Toggle base plan coverage
    const toggleBasePlanCoverage = () => {
        if (!splitConfig) return;
        const updated = {
            base_plan: {
                ...splitConfig.base_plan,
                firm_pays: !splitConfig.base_plan.firm_pays,
            },
        };
        updateSplitConfig(updated);
    };

    // Toggle staff addons coverage
    const toggleStaffAddonsCoverage = () => {
        if (!splitConfig) return;
        const updated = {
            staff_addons: {
                ...splitConfig.staff_addons,
                firm_pays: !splitConfig.staff_addons.firm_pays,
            },
        };
        updateSplitConfig(updated);
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AD6F2]"></div>
                <p className="mt-4 text-sm text-gray-600">Loading billing data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Billing Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-[#E8F0FF] p-6">
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Outstanding Balance</p>
                    <p className="text-3xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                        ${billingSummary?.outstanding_balance?.toFixed(2) || '0.00'}
                    </p>
                </div>

                <div className="bg-white rounded-lg border border-[#E8F0FF] p-6">
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Paid This Year</p>
                    <p className="text-3xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                        ${billingSummary?.paid_this_year?.toFixed(2) || '0.00'}
                    </p>
                </div>

                <div className="bg-white rounded-lg border border-[#E8F0FF] p-6">
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Total Invoices</p>
                    <p className="text-3xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                        {billingSummary?.total_invoices || 0}
                    </p>
                </div>
            </div>

            {/* Invoices Section */}
            <div className="bg-white rounded-lg border border-[#E8F0FF] p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 font-[BasisGrotesquePro]">Invoices</h3>
                {invoices.length === 0 ? (
                    <p className="text-sm text-gray-600 text-center py-8">No invoices found</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Invoice #</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Date</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Total</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Firm Pays</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Staff Pays</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm text-gray-900">{invoice.invoice_number}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            {new Date(invoice.date).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                                            ${invoice.total_amount?.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            ${invoice.firm_amount?.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            ${invoice.staff_amount?.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${invoice.status === 'completed'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Split Billing Management */}
            {splitConfig && (
                <div className="bg-white rounded-lg border border-[#E8F0FF] p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">
                        Split Billing Management
                    </h3>
                    <p className="text-sm text-gray-600 mb-6 font-[BasisGrotesquePro]">
                        Configure how costs are distributed between firm and staff
                    </p>

                    <div className="space-y-6">
                        {/* Base Plan Coverage */}
                        <div className="border border-[#E8F0FF] rounded-lg p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">
                                        Base Plan Coverage
                                    </h4>
                                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                        Firm pays for all base plan features and core functionality
                                    </p>
                                </div>
                                <button
                                    onClick={toggleBasePlanCoverage}
                                    disabled={savingConfig}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${splitConfig.base_plan.firm_pays
                                        ? 'bg-[#3AD6F2] text-white'
                                        : 'bg-gray-200 text-gray-700'
                                        }`}
                                    style={{ borderRadius: '8px' }}
                                >
                                    {splitConfig.base_plan.firm_pays ? 'Firm Pays' : 'Staff Pays'}
                                </button>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Applies to:</p>
                                <ul className="space-y-1">
                                    {splitConfig.base_plan.applies_to.map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 flex items-center">
                                            <span className="w-1.5 h-1.5 bg-[#3AD6F2] rounded-full mr-2"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Staff Add-Ons */}
                        <div className="border border-[#E8F0FF] rounded-lg p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">
                                        Staff Add-Ons
                                    </h4>
                                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                        {splitConfig.staff_addons.firm_pays
                                            ? 'Firm pays for staff premium add-ons and extras'
                                            : 'Staff members pay for their own premium add-ons and extras'}
                                    </p>
                                </div>
                                <button
                                    onClick={toggleStaffAddonsCoverage}
                                    disabled={savingConfig}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${splitConfig.staff_addons.firm_pays
                                        ? 'bg-[#3AD6F2] text-white'
                                        : 'bg-gray-200 text-gray-700'
                                        }`}
                                    style={{ borderRadius: '8px' }}
                                >
                                    {splitConfig.staff_addons.firm_pays ? 'Firm Pays' : 'Staff Pays'}
                                </button>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Applies to:</p>
                                <ul className="space-y-1">
                                    {splitConfig.staff_addons.applies_to.map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 flex items-center">
                                            <span className="w-1.5 h-1.5 bg-[#3AD6F2] rounded-full mr-2"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Shared Resources */}
                        <div className="border border-[#E8F0FF] rounded-lg p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">
                                        Shared Resources
                                    </h4>
                                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                        Split costs for shared resources based on usage
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
                                >
                                    Configure Split
                                </button>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Applies to:</p>
                                <ul className="space-y-1">
                                    {splitConfig.shared_resources.applies_to.map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 flex items-center">
                                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Split Percentage Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                                Configure Resource Split
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                                    Staff Responsibility (%): {splitPercentage}%
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={splitPercentage}
                                    onChange={(e) => setSplitPercentage(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3AD6F2]"
                                />
                                <div className="flex justify-between mt-2 text-xs text-gray-500 font-[BasisGrotesquePro]">
                                    <span>Firm: {100 - splitPercentage}%</span>
                                    <span>Staff: {splitPercentage}%</span>
                                </div>
                            </div>

                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                                <p className="text-sm text-purple-800 font-[BasisGrotesquePro]">
                                    <span className="font-bold">Usage-Based Logic:</span> Costs for SMS and E-Signatures will be calculated at the end of each billing cycle and distributed according to these percentages.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => updateSplitConfig({
                                        shared_resources: {
                                            ...splitConfig.shared_resources,
                                            split_percentage: splitPercentage,
                                            split_billing: true
                                        }
                                    })}
                                    disabled={savingConfig}
                                    className="flex-1 px-4 py-2 bg-[#F97316] text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 font-[BasisGrotesquePro]"
                                >
                                    {savingConfig ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingEnhanced;
