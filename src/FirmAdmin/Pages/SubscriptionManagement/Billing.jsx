import React, { useState } from 'react';

const Billing = () => {
    const [basePlanToggle, setBasePlanToggle] = useState(true);
    const [staffAddOnsToggle, setStaffAddOnsToggle] = useState(true);
    const [sharedResourcesToggle, setSharedResourcesToggle] = useState(true);

    const invoices = [
        {
            id: 'INV-001',
            date: '2024-01-01',
            description: 'Professional Plan - January 2024',
            amount: '$299.00',
            status: 'Active'
        },
        {
            id: 'INV-002',
            date: '2023-12-01',
            description: 'Professional Plan - December 2023',
            amount: '$299.00',
            status: 'Active'
        },
        {
            id: 'INV-003',
            date: '2023-11-01',
            description: 'Professional Plan - November 2023',
            amount: '$299.00',
            status: 'Active'
        },
        {
            id: 'INV-004',
            date: '2023-10-01',
            description: 'Team Plan - October 2023',
            amount: '$149.00',
            status: 'Active'
        }
    ];

    const spendingCategories = [
        {
            label: 'Subscription',
            title: 'Subscription Expenses',
            transactions: 1,
            amount: '$322.92',
            percentage: '66.7% of total'
        },
        {
            label: 'add-on',
            title: 'Add-On Expenses',
            transactions: 1,
            amount: '$106.92',
            percentage: '22.1% of total'
        },
        {
            label: 'usage',
            title: 'Usage Expenses',
            transactions: 1,
            amount: '$322.92',
            percentage: '66.7% of total'
        }
    ];

    return (
        <div>
            {/* Admin Controls & Usage Dashboard */}
            <div className="mb-6">
                <h5 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Admin Controls & Usage Dashboard</h5>
                <p className="text-sm sm:text-base text-gray-600 font-[BasisGrotesquePro] mb-6">Manage licenses, monitor usage, and control staff permissions</p>

                {/* Invoice Table */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 overflow-x-auto">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Invoice ID</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Date</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Description</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Amount</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Status</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice, index) => (
                                    <tr key={index} className="border-b border-gray-200 last:border-b-0">
                                        <td className="py-3 px-4 text-sm text-gray-700 font-[BasisGrotesquePro]">{invoice.id}</td>
                                        <td className="py-3 px-4 text-sm text-gray-700 font-[BasisGrotesquePro]">{invoice.date}</td>
                                        <td className="py-3 px-4 text-sm text-gray-700 font-[BasisGrotesquePro]">{invoice.description}</td>
                                        <td className="py-3 px-4 text-sm text-gray-700 font-[BasisGrotesquePro]">{invoice.amount}</td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 bg-[#22C55E] text-white !rounded-full text-xs font-medium font-[BasisGrotesquePro]">
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button className="text-gray-600 hover:text-gray-900">
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
                </div>
            </div>

            {/* Bottom Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Split Billing Management */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
                    <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Split Billing Management</h6>
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Configure how costs are distributed between firm and staff</p>

                    <div className="space-y-4">
                        {/* Base Plan Coverage Card */}
                        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h6 className="text-base font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Base Plan Coverage</h6>
                                    <p className="text-sm text-gray-700 font-[BasisGrotesquePro] mb-3">Firm pays for all base plan features and core functionality</p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <span className="px-3 py-2 bg-white !border border-[#E8F0FF] text-gray-700 !rounded-lg text-sm font-[BasisGrotesquePro]">Staff Pays</span>
                                    <button
                                        onClick={() => setBasePlanToggle(!basePlanToggle)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            basePlanToggle ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                basePlanToggle ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 font-[BasisGrotesquePro] mb-2">Applies to:</p>
                            <div className="flex flex-wrap gap-2">
                                {['Base subscription', 'Core features', 'Standard support', 'Basic storage'].map((tag, index) => (
                                    <span key={index} className="px-3 py-1 bg-white !border border-[#3B4A66] text-gray-700 !rounded-[10px] text-xs font-[BasisGrotesquePro]">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Staff Add-Ons Card */}
                        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h6 className="text-base font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Staff Add-Ons</h6>
                                    <p className="text-sm text-gray-700 font-[BasisGrotesquePro] mb-3">Staff members pay for their own premium add-ons and extras</p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <span className="px-3 py-2 bg-white !border border-[#E8F0FF] text-gray-700 !rounded-lg text-sm font-[BasisGrotesquePro]">Firm Pays</span>
                                    <button
                                        onClick={() => setStaffAddOnsToggle(!staffAddOnsToggle)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            staffAddOnsToggle ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                staffAddOnsToggle ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 font-[BasisGrotesquePro] mb-2">Applies to:</p>
                            <div className="flex flex-wrap gap-2">
                                {['Base subscription', 'Core features', 'Standard support', 'Basic storage'].map((tag, index) => (
                                    <span key={index} className="px-3 py-1 bg-white !border border-[#3B4A66] text-gray-700 !rounded-lg text-xs font-[BasisGrotesquePro]">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Shared Resources Card */}
                        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h6 className="text-base font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Shared Resources</h6>
                                    <p className="text-sm text-gray-700 font-[BasisGrotesquePro] mb-3">Split costs for shared resources based on usage</p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <span className="px-3 py-2 bg-white !border border-[#E8F0FF] text-gray-700 !rounded-lg text-sm font-[BasisGrotesquePro]">Split Billing</span>
                                    <button
                                        onClick={() => setSharedResourcesToggle(!sharedResourcesToggle)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            sharedResourcesToggle ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                sharedResourcesToggle ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 font-[BasisGrotesquePro] mb-2">Applies to:</p>
                            <div className="flex flex-wrap gap-2">
                                {['SMS credits', 'E-signature envelopes', 'API calls', 'Shared integrations'].map((tag, index) => (
                                    <span key={index} className="px-3 py-1 bg-white !border border-[#3B4A66] text-gray-700 !rounded-lg text-xs font-[BasisGrotesquePro]">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Spending By Category */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
                    <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Spending By Category (2024)</h6>
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Breakdown of expenses for tax reporting</p>

                    <div className="space-y-4">
                        {spendingCategories.map((category, index) => (
                            <div key={index} className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
                                <div className="flex items-center justify-between gap-4">
                                    {/* Left: Label */}
                                    <div className="flex-shrink-0">
                                        <span className="inline-block px-3 py-1 bg-[#FFFFFF] !border border-[#E8F0FF] text-gray-700 !rounded-lg text-xs font-[BasisGrotesquePro]">
                                            {category.label}
                                        </span>
                                    </div>
                                    
                                    {/* Middle: Title and Subtitle */}
                                    <div className="flex-1">
                                        <h6 className="text-base font-semibold text-gray-900 mb-1 font-[BasisGrotesquePro]">{category.title}</h6>
                                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">{category.transactions} transactions</p>
                                    </div>
                                    
                                    {/* Right: Amount and Percentage */}
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro]">{category.amount}</p>
                                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">{category.percentage}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Billing;

