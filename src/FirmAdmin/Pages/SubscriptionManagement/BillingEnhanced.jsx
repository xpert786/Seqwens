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
        <div className="space-y-4 sm:space-y-6">
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Billing Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl border border-[#E8F0FF] p-5 sm:p-6 shadow-sm">
                    <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro] mb-2 uppercase tracking-wider font-semibold">Outstanding Balance</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#1F2A55] font-[BasisGrotesquePro]">
                        ${billingSummary?.outstanding_balance?.toFixed(2) || '0.00'}
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-[#E8F0FF] p-5 sm:p-6 shadow-sm">
                    <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro] mb-2 uppercase tracking-wider font-semibold">Paid This Year</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#1F2A55] font-[BasisGrotesquePro]">
                        ${billingSummary?.paid_this_year?.toFixed(2) || '0.00'}
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-[#E8F0FF] p-5 sm:p-6 shadow-sm sm:col-span-2 lg:col-span-1">
                    <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro] mb-2 uppercase tracking-wider font-semibold">Total Invoices</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#1F2A55] font-[BasisGrotesquePro]">
                        {billingSummary?.total_invoices || 0}
                    </p>
                </div>
            </div>

            {/* Invoices Section */}
            <div className="bg-white rounded-xl border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
                <h3 className="text-lg sm:text-xl font-bold text-[#1F2A55] mb-4 font-[BasisGrotesquePro]">Invoices</h3>
                {invoices.length === 0 ? (
                    <p className="text-sm text-gray-600 text-center py-8">No invoices found</p>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar -mx-4 sm:mx-0">
                        <div className="min-w-[600px] px-4 sm:px-0">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-3 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Invoice #</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Date</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Total</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Firm Pays</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Staff Pays</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {new Date(invoice.date).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4 text-sm font-bold text-[#1F2A55]">
                                                ${invoice.total_amount?.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                ${invoice.firm_amount?.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                ${invoice.staff_amount?.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${invoice.status === 'completed'
                                                    ? 'bg-green-50 text-green-700 border border-green-100'
                                                    : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                                    }`}>
                                                    {invoice.status}
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

            {/* Split Billing Management */}
            {splitConfig && (
                <div className="bg-white rounded-xl border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg sm:text-xl font-bold text-[#1F2A55] mb-1 font-[BasisGrotesquePro]">
                            Split Billing Management
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">
                            Configure how costs are distributed between firm and staff
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Base Plan Coverage */}
                        <div className="border border-[#E8F0FF] rounded-xl p-5 sm:p-6 bg-[#FBFCFF]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
                                <div>
                                    <h4 className="text-[17px] font-bold text-[#3B4A66] font-[BasisGrotesquePro]">
                                        Base Plan Coverage
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro] mt-0.5">
                                        Firm pays for all base plan features and core functionality
                                    </p>
                                </div>
                                <button
                                    onClick={toggleBasePlanCoverage}
                                    disabled={savingConfig}
                                    className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${splitConfig.base_plan.firm_pays
                                        ? 'bg-[#3AD6F2] text-white shadow-md hover:bg-[#2BC4E0]'
                                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                                        }`}
                                    style={{ borderRadius: '10px' }}
                                >
                                    {splitConfig.base_plan.firm_pays ? 'Firm Pays' : 'Staff Pays'}
                                </button>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-[#E8F0FF]">
                                <p className="text-[10px] uppercase font-bold text-[#9CA3AF] mb-3 tracking-widest">Applies to:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {splitConfig.base_plan.applies_to.map((item, idx) => (
                                        <div key={idx} className="text-sm text-[#4B5563] flex items-center bg-[#F3F7FF] px-3 py-2 rounded-lg border border-[#E8F0FF]/50">
                                            <span className="w-1.5 h-1.5 bg-[#3AD6F2] rounded-full mr-2 shrink-0"></span>
                                            <span className="font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Staff Add-Ons */}
                        <div className="border border-[#E8F0FF] rounded-xl p-5 sm:p-6 bg-[#FBFCFF]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
                                <div>
                                    <h4 className="text-[17px] font-bold text-[#3B4A66] font-[BasisGrotesquePro]">
                                        Staff Add-Ons
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro] mt-0.5">
                                        {splitConfig.staff_addons.firm_pays
                                            ? 'Firm pays for staff premium add-ons and extras'
                                            : 'Staff members pay for their own premium add-ons and extras'}
                                    </p>
                                </div>
                                <button
                                    onClick={toggleStaffAddonsCoverage}
                                    disabled={savingConfig}
                                    className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${splitConfig.staff_addons.firm_pays
                                        ? 'bg-[#3AD6F2] text-white shadow-md hover:bg-[#2BC4E0]'
                                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                                        }`}
                                    style={{ borderRadius: '10px' }}
                                >
                                    {splitConfig.staff_addons.firm_pays ? 'Firm Pays' : 'Staff Pays'}
                                </button>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-[#E8F0FF]">
                                <p className="text-[10px] uppercase font-bold text-[#9CA3AF] mb-3 tracking-widest">Applies to:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {splitConfig.staff_addons.applies_to.map((item, idx) => (
                                        <div key={idx} className="text-sm text-[#4B5563] flex items-center bg-[#F3F7FF] px-3 py-2 rounded-lg border border-[#E8F0FF]/50">
                                            <span className="w-1.5 h-1.5 bg-[#3AD6F2] rounded-full mr-2 shrink-0"></span>
                                            <span className="font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Shared Resources */}
                        <div className="border border-[#E8F0FF] rounded-xl p-5 sm:p-6 bg-[#FBFCFF]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
                                <div>
                                    <h4 className="text-[17px] font-bold text-[#3B4A66] font-[BasisGrotesquePro]">
                                        Shared Resources
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro] mt-0.5">
                                        Split costs for shared resources based on usage
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-bold bg-[#F3F7FF] text-[#3AD6F2] hover:bg-[#E8F0FF] transition-all border border-[#E8F0FF]"
                                    style={{ borderRadius: "10px" }}
                                >
                                    Configure Split
                                </button>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-[#E8F0FF]">
                                <p className="text-[10px] uppercase font-bold text-[#9CA3AF] mb-3 tracking-widest">Applies to:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {splitConfig.shared_resources.applies_to.map((item, idx) => (
                                        <div key={idx} className="text-sm text-[#4B5563] flex items-center bg-[#F3F7FF] px-3 py-2 rounded-lg border border-[#E8F0FF]/50">
                                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 shrink-0"></span>
                                            <span className="font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Split Percentage Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-8 animate-in fade-in zoom-in duration-200" style={{ borderRadius: '15px' }}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-[#1F2A55] font-[BasisGrotesquePro]">
                                    Resource Split
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">Define usage-based cost sharing</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F3F7FF] text-[#3AD6F2] hover:bg-[#E8F0FF] transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-bold text-[#3B4A66] font-[BasisGrotesquePro]">
                                        Staff Responsibility
                                    </label>
                                    <span className="px-3 py-1 bg-[#F3F7FF] text-[#3AD6F2] rounded-lg text-lg font-bold border border-[#E8F0FF]">
                                        {splitPercentage}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={splitPercentage}
                                    onChange={(e) => setSplitPercentage(parseInt(e.target.value))}
                                    className="w-full h-2.5 bg-[#F3F7FF] rounded-lg appearance-none cursor-pointer accent-[#3AD6F2] border border-[#E8F0FF]"
                                />
                                <div className="flex justify-between mt-3 text-xs font-bold font-[BasisGrotesquePro]">
                                    <span className="text-gray-400">Firm: <span className="text-[#3B4A66]">{100 - splitPercentage}%</span></span>
                                    <span className="text-gray-400">Staff: <span className="text-[#3AD6F2]">{splitPercentage}%</span></span>
                                </div>
                            </div>

                            <div className="bg-[#F3F7FF] rounded-xl p-4 border border-[#E8F0FF]">
                                <p className="text-xs text-[#3B4A66] font-[BasisGrotesquePro] leading-relaxed">
                                    <span className="font-bold text-[#3AD6F2] uppercase text-[10px] block mb-1">Usage-Based Logic</span>
                                    Costs for SMS and E-Signatures will be calculated at the end of each billing cycle and distributed according to these percentages.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 border border-[#E8F0FF] text-[#3B4A66] rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
                                    style={{ borderRadius: '10px' }}
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
                                    className="flex-1 px-4 py-3 bg-[#F97316] text-white rounded-xl font-bold text-sm hover:bg-orange-600 shadow-md hover:shadow-lg transition-all disabled:opacity-50 font-[BasisGrotesquePro]"
                                    style={{ borderRadius: '10px' }}
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
