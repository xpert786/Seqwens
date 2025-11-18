import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const API_BASE_URL = getApiBaseUrl();

const Billing = () => {
    // Invoice states
    const [invoices, setInvoices] = useState([]);
    const [invoiceSummary, setInvoiceSummary] = useState({
        outstanding_balance: 0,
        paid_this_year: 0,
        next_due_date: null,
        total_invoices: 0,
        outstanding_count: 0,
        overdue_count: 0
    });
    const [invoicesLoading, setInvoicesLoading] = useState(true);
    const [invoicesError, setInvoicesError] = useState('');

    // Split billing states
    const [splitBilling, setSplitBilling] = useState(null);
    const [splitBillingSections, setSplitBillingSections] = useState([]);
    const [splitBillingLoading, setSplitBillingLoading] = useState(true);
    const [splitBillingError, setSplitBillingError] = useState('');
    const [savingSplitBilling, setSavingSplitBilling] = useState(false);

    // Spending by category states
    const [spendingData, setSpendingData] = useState(null);
    const [spendingLoading, setSpendingLoading] = useState(true);
    const [spendingError, setSpendingError] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Fetch invoices
    const fetchInvoices = useCallback(async () => {
        try {
            setInvoicesLoading(true);
            setInvoicesError('');

            const token = getAccessToken();
            const url = `${API_BASE_URL}/firm/invoices/`;

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
                setInvoices(result.data.invoices || []);
                setInvoiceSummary(result.data.summary || {});
            } else {
                setInvoices([]);
                setInvoiceSummary({});
            }
        } catch (err) {
            console.error('Error fetching invoices:', err);
            const errorMsg = handleAPIError(err);
            setInvoicesError(errorMsg || 'Failed to load invoices. Please try again.');
            setInvoices([]);
        } finally {
            setInvoicesLoading(false);
        }
    }, []);

    // Fetch split billing settings
    const fetchSplitBilling = useCallback(async () => {
        try {
            setSplitBillingLoading(true);
            setSplitBillingError('');

            const token = getAccessToken();
            const url = `${API_BASE_URL}/user/firm-admin/split-billing/`;

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
                setSplitBilling(result.data.split_billing);
                setSplitBillingSections(result.data.sections || []);
            } else {
                setSplitBilling(null);
                setSplitBillingSections([]);
            }
        } catch (err) {
            console.error('Error fetching split billing settings:', err);
            const errorMsg = handleAPIError(err);
            setSplitBillingError(errorMsg || 'Failed to load split billing settings. Please try again.');
        } finally {
            setSplitBillingLoading(false);
        }
    }, []);

    // Update split billing settings
    const updateSplitBilling = useCallback(async (updatedData) => {
        try {
            setSavingSplitBilling(true);
            const token = getAccessToken();
            const url = `${API_BASE_URL}/user/firm-admin/split-billing/`;

            const response = await fetchWithCors(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                toast.success(result.message || 'Split billing settings updated successfully!');
                await fetchSplitBilling();
            } else {
                throw new Error(result.message || 'Failed to update split billing settings');
            }
        } catch (err) {
            console.error('Error updating split billing settings:', err);
            const errorMsg = handleAPIError(err);
            toast.error(errorMsg || 'Failed to update split billing settings. Please try again.');
        } finally {
            setSavingSplitBilling(false);
        }
    }, [fetchSplitBilling]);

    // Fetch spending by category
    const fetchSpendingByCategory = useCallback(async (year) => {
        try {
            setSpendingLoading(true);
            setSpendingError('');

            const token = getAccessToken();
            const url = `${API_BASE_URL}/user/firm-admin/spending-by-category/${year ? `?year=${year}` : ''}`;

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
                setSpendingData(result.data);
            } else {
                setSpendingData(null);
            }
        } catch (err) {
            console.error('Error fetching spending by category:', err);
            const errorMsg = handleAPIError(err);
            setSpendingError(errorMsg || 'Failed to load spending data. Please try again.');
            setSpendingData(null);
        } finally {
            setSpendingLoading(false);
        }
    }, []);

    // Fetch all data on mount
    useEffect(() => {
        fetchInvoices();
        fetchSplitBilling();
        fetchSpendingByCategory(selectedYear);
    }, [fetchInvoices, fetchSplitBilling, fetchSpendingByCategory, selectedYear]);

    // Get the actual toggle value for a section
    const getToggleValue = (section) => {
        if (!splitBilling) return false;
        
        if (section.title === 'Base Plan Coverage') {
            return splitBilling.base_plan_firm_pays || false;
        } else if (section.title === 'Staff Add-Ons') {
            return splitBilling.staff_addons_firm_pays || false;
        } else if (section.title === 'Shared Resources') {
            return splitBilling.shared_resources_split_billing || false;
        }
        return false;
    };

    // Handle split billing toggle
    const handleSplitBillingToggle = async (sectionIndex, newValue) => {
        if (!splitBilling) return;

        const section = splitBillingSections[sectionIndex];
        if (!section) return;

        let updatedData = { ...splitBilling };

        // Update based on section
        if (section.title === 'Base Plan Coverage') {
            updatedData.base_plan_firm_pays = newValue;
        } else if (section.title === 'Staff Add-Ons') {
            updatedData.staff_addons_firm_pays = newValue;
        } else if (section.title === 'Shared Resources') {
            updatedData.shared_resources_split_billing = newValue;
        }

        await updateSplitBilling(updatedData);
    };

    // Get status color
    const getStatusColor = (status, statusColor) => {
        if (statusColor) {
            const colorMap = {
                'green': 'bg-[#22C55E] text-white',
                'red': 'bg-[#EF4444] text-white',
                'yellow': 'bg-[#F59E0B] text-white',
                'gray': 'bg-gray-500 text-white',
                'blue': 'bg-blue-500 text-white'
            };
            return colorMap[statusColor] || 'bg-gray-500 text-white';
        }

        const statusLower = (status || '').toLowerCase();
        switch (statusLower) {
            case 'paid':
                return 'bg-[#22C55E] text-white';
            case 'overdue':
                return 'bg-[#EF4444] text-white';
            case 'pending':
                return 'bg-[#F59E0B] text-white';
            case 'draft':
                return 'bg-gray-500 text-white';
            case 'partial':
                return 'bg-blue-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    // Generate year options (current year and 3 previous years)
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    for (let i = 0; i < 4; i++) {
        yearOptions.push(currentYear - i);
    }

    return (
        <div>
            {/* Header Section */}
            <div className="mb-6">
                <h5 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Admin Controls & Usage Dashboard</h5>
                <p className="text-sm sm:text-base text-gray-600 font-[BasisGrotesquePro] mb-6">Manage licenses, monitor usage, and control staff permissions</p>
            </div>

            {/* Invoice Summary Cards */}
            {invoiceSummary && Object.keys(invoiceSummary).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
                    <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-1">Outstanding Balance</p>
                        <p className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                            ${invoiceSummary.outstanding_balance?.toFixed(2) || '0.00'}
                        </p>
                    </div>
                    <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-1">Paid This Year</p>
                        <p className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                            ${invoiceSummary.paid_this_year?.toFixed(2) || '0.00'}
                        </p>
                    </div>
                    <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-1">Total Invoices</p>
                        <p className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                            {invoiceSummary.total_invoices || 0}
                        </p>
                    </div>
                </div>
            )}

            {/* Invoice Table */}
            <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 overflow-x-auto mb-6">
                <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 font-[BasisGrotesquePro]">Invoices</h6>
                
                {invoicesError && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {invoicesError}
                    </div>
                )}

                {invoicesLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-sm text-gray-600">Loading invoices...</p>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-sm text-gray-600">No invoices found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Invoice ID</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Issue Date</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Due Date</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Description</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Amount</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Status</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm text-gray-700 font-[BasisGrotesquePro]">{invoice.invoice_number}</td>
                                        <td className="py-3 px-4 text-sm text-gray-700 font-[BasisGrotesquePro]">
                                            {invoice.formatted_issue_date || invoice.issue_date}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-700 font-[BasisGrotesquePro]">
                                            {invoice.formatted_due_date || invoice.due_date}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-700 font-[BasisGrotesquePro]">{invoice.description}</td>
                                        <td className="py-3 px-4 text-sm text-gray-700 font-[BasisGrotesquePro]">
                                            ${parseFloat(invoice.amount || 0).toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 !rounded-full text-xs font-medium font-[BasisGrotesquePro] ${getStatusColor(invoice.status, invoice.status_color)}`}>
                                                {invoice.status_display || invoice.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button 
                                                className="text-gray-600 hover:text-gray-900 transition-colors"
                                                title="Download Invoice"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Bottom Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Split Billing Management */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
                    <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Split Billing Management</h6>
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Configure how costs are distributed between firm and staff</p>

                    {splitBillingError && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {splitBillingError}
                        </div>
                    )}

                    {splitBillingLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-sm text-gray-600">Loading split billing settings...</p>
                        </div>
                    ) : splitBillingSections.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-sm text-gray-600">No split billing settings available</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {splitBillingSections.map((section, index) => {
                                const toggleValue = getToggleValue(section);
                                return (
                                    <div key={index} className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h6 className="text-base font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">{section.title}</h6>
                                                <p className="text-sm text-gray-700 font-[BasisGrotesquePro] mb-3">{section.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <span className="px-3 py-2 bg-white !border border-[#E8F0FF] text-gray-700 !rounded-lg text-sm font-[BasisGrotesquePro] whitespace-nowrap">
                                                    {section.toggle_label}
                                                </span>
                                                <button
                                                    onClick={() => handleSplitBillingToggle(index, !toggleValue)}
                                                    disabled={savingSplitBilling}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                        toggleValue ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                                    } ${savingSplitBilling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                            toggleValue ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-600 font-[BasisGrotesquePro] mb-2">Applies to:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {section.applies_to && section.applies_to.map((item, itemIndex) => (
                                                <span key={itemIndex} className="px-3 py-1 bg-white !border border-[#3B4A66] text-gray-700 !rounded-[10px] text-xs font-[BasisGrotesquePro]">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Spending By Category */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h6 className="text-lg sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">Spending By Category</h6>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="px-3 py-1.5 bg-white !border border-[#E8F0FF] text-gray-700 !rounded-lg text-sm font-[BasisGrotesquePro] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
                        >
                            {yearOptions.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Breakdown of expenses for tax reporting</p>

                    {spendingError && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {spendingError}
                        </div>
                    )}

                    {spendingLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-sm text-gray-600">Loading spending data...</p>
                        </div>
                    ) : !spendingData ? (
                        <div className="text-center py-12">
                            <p className="text-sm text-gray-600">No spending data available</p>
                        </div>
                    ) : (
                        <>
                            {spendingData.total_spending > 0 && (
                                <div className="mb-4 p-4 bg-[#F3F7FF] !rounded-lg">
                                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-1">Total Spending ({spendingData.year})</p>
                                    <p className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                                        {spendingData.total_spending_display || `$${spendingData.total_spending?.toFixed(2) || '0.00'}`}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {spendingData.categories && spendingData.categories.length > 0 ? (
                                    spendingData.categories.map((category, index) => (
                                        <div key={index} className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
                                            <div className="flex items-center justify-between gap-4">
                                                {/* Left: Label */}
                                                <div className="flex-shrink-0">
                                                    <span className="inline-block px-3 py-1 bg-[#FFFFFF] !border border-[#E8F0FF] text-gray-700 !rounded-lg text-xs font-[BasisGrotesquePro]">
                                                        {category.category}
                                                    </span>
                                                </div>
                                                
                                                {/* Middle: Title and Subtitle */}
                                                <div className="flex-1">
                                                    <h6 className="text-base font-semibold text-gray-900 mb-1 font-[BasisGrotesquePro]">
                                                        {category.category_display || category.category}
                                                    </h6>
                                                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                                        {category.transactions || 0} {category.transactions === 1 ? 'transaction' : 'transactions'}
                                                    </p>
                                                </div>
                                                
                                                {/* Right: Amount and Percentage */}
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro]">
                                                        {category.amount_display || `$${parseFloat(category.amount || 0).toFixed(2)}`}
                                                    </p>
                                                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                                        {category.percentage_display || `${category.percentage?.toFixed(1) || 0}% of total`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-gray-600">No spending categories found</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Billing;
