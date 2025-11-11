import React, { useState } from 'react';
import AllPlans from './AllPlans';
import AddOns from './AddOns';
import Billing from './Billing';
import AdminControls from './AdminControls';
import Security from './Security';
import Automation from './Automation';

const SubscriptionManagement = () => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [isFailoverEnabled, setIsFailoverEnabled] = useState(true);

    const tabs = ['Overview', 'All Plan', 'Add-ons', 'Billing', 'Admin', 'Security', 'Automation', 'Enterprise'];

    const cards = [
        {
            title: "Business Visa",
            subtitle: "Credit Card",
            number: "**** **** **** 4242",
            expires: "12/2026",
            lastUsed: "2024-01-15",
            fee: "2.9% + $0.3",
            isPrimary: true,
        },
        {
            title: "Business Checking",
            subtitle: "Bank Account (ACH)",
            number: "****1234 - Chase Bank",
            expires: "12/2026",
            lastUsed: "2024-01-15",
            fee: "2.9% + $0.3",
        },
        {
            title: "Business Visa",
            subtitle: "PayPal",
            number: "business@example.com",
            lastUsed: "2024-01-15",
            fee: "2.9% + $0.3",
        },
    ];

    return (
        <div className="min-h-screen bg-[#F3F7FF] p-4 sm:p-6">
            <div className="mx-auto">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                        <div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-1 font-[BasisGrotesquePro]">Subscription Management</h4>
                            <p className="text-gray-600 font-[BasisGrotesquePro]">Manage your plan, usage, and billing</p>
                        </div>
                        <button className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#EA580C] transition-colors flex items-center gap-2 font-[BasisGrotesquePro] text-sm sm:text-base whitespace-nowrap">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16.5 5.25L10.125 11.625L6.375 7.875L1.5 12.75" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M12 5.25H16.5V9.75" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>

                            Upgrade Plan
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mb-6">
                        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-1.5 sm:p-2 w-fit">
                            <div className="flex gap-2 sm:gap-3 overflow-x-auto">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-[BasisGrotesquePro] transition-colors !rounded-lg whitespace-nowrap ${activeTab === tab
                                            ? 'bg-[#3AD6F2] !text-white font-semibold'
                                            : 'bg-transparent !text-black hover:bg-gray-50'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* All Plan Tab Content */}
                {activeTab === 'All Plan' && <AllPlans />}

                {/* Add-ons Tab Content */}
                {activeTab === 'Add-ons' && <AddOns />}

                {/* Billing Tab Content */}
                {activeTab === 'Billing' && <Billing />}

                {/* Admin Tab Content */}
                {activeTab === 'Admin' && <AdminControls />}

                {/* Security Tab Content */}
                {activeTab === 'Security' && <Security />}

                {/* Automation Tab Content */}
                {activeTab === 'Automation' && <Automation />}

                {/* Plan Details and Usage Overview - Show only for Overview tab */}
                {activeTab === 'Overview' && (
                <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    {/* Professional Plan Card */}
                    <div className="bg-white rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h5 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 font-[BasisGrotesquePro]">Professional Plan</h5>
                                <p className="t!ext-sm text-gray-600 font-[BasisGrotesquePro]">$299 per month</p>
                            </div>
                            <span className="px-3 py-1 bg-[#22C55E] text-white rounded-full text-xs font-medium font-[BasisGrotesquePro]">
                                Active
                            </span>
                        </div>

                        <div className="mb-6">
                            <h6 className="text-sm font-semibold text-gray-900 mb-3 font-[BasisGrotesquePro]">Plan Features</h6>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Up to 500 clients</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Unlimited staff users</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">100GB storage</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Advanced workflows</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Priority support</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Custom branding</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">API access</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button className="px-4 sm:px-5 py-2 bg-white !border border-[#E8F0FF] text-gray-700 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm font-medium">
                                Change Plan
                            </button>
                            <button className="px-4 sm:px-5 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E66F2F] transition-colors font-[BasisGrotesquePro] text-sm font-medium">
                                Cancel Subscription
                            </button>
                        </div>
                    </div>

                    {/* Usage Overview Card */}
                    <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative">

                        <h5 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 font-[BasisGrotesquePro]">Usage Overview</h5>
                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Current usage vs limits</p>

                        <div className="space-y-4">
                            {/* Clients */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Clients</span>
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">245/500</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-[#3AD6F2] h-2 rounded-full" style={{ width: '49%' }}></div>
                                </div>
                            </div>

                            {/* Staff Users */}
                            <div>
                                <div className="flex justify-between items-center mb-1 mt-6">
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Staff Users</span>
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">8/Unlimited</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-[#3AD6F2] h-2 rounded-full" style={{ width: '30%' }}></div>
                                </div>
                            </div>

                            {/* Storage */}
                            <div>
                                <div className="flex justify-between items-center mb-1 mt-6">
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Storage (GB)</span>
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">45/100</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-[#3AD6F2] h-2 rounded-full" style={{ width: '45%' }}></div>
                                </div>
                            </div>

                            {/* Workflows */}
                            <div>
                                <div className="flex justify-between items-center mb-1 mt-6">
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Workflows</span>
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">12/Unlimited</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-[#3AD6F2] h-2 rounded-full" style={{ width: '20%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Methods Section */}
                <div className="mb-6 !bg-white rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                        <div>
                            <h5 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 font-[BasisGrotesquePro]">Payment Methods</h5>
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Manage your billing payment methods with automatic failover</p>
                        </div>
                        <button className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center gap-2 font-[BasisGrotesquePro] text-sm sm:text-base whitespace-nowrap">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add payment Method
                        </button>
                    </div>

                    {/* Automatic Payment Failover Card */}
                    <div className="bg-[#FFF4E6] !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M2.44171 9.33334C2.50171 5.20001 5.89671 1.87501 10.0659 1.87501C11.3711 1.87299 12.6551 2.2057 13.7951 2.84136C14.9352 3.47703 15.8931 4.3944 16.5775 5.50584C16.6594 5.64679 16.6829 5.81413 16.6432 5.9722C16.6034 6.13026 16.5035 6.26654 16.3647 6.35197C16.2259 6.43741 16.0592 6.46524 15.9002 6.42953C15.7411 6.39383 15.6023 6.29741 15.5134 6.16084C14.9408 5.23117 14.1393 4.46391 13.1856 3.9324C12.2318 3.40089 11.1577 3.1229 10.0659 3.12501C6.57838 3.12501 3.75338 5.89834 3.69254 9.33168L4.02588 9.00084C4.14357 8.88404 4.30284 8.81877 4.46865 8.81939C4.63446 8.82002 4.79324 8.88649 4.91004 9.00418C5.02685 9.12187 5.09212 9.28114 5.09149 9.44695C5.09087 9.61276 5.0244 9.77154 4.90671 9.88834L3.50671 11.2767C3.38966 11.3927 3.23152 11.4578 3.06671 11.4578C2.9019 11.4578 2.74376 11.3927 2.62671 11.2767L1.22671 9.88834C1.16838 9.83056 1.12201 9.76186 1.09023 9.68615C1.05845 9.61045 1.0419 9.52922 1.04151 9.44712C1.04112 9.36502 1.05691 9.28364 1.08797 9.20764C1.11904 9.13164 1.16476 9.0625 1.22254 9.00418C1.28033 8.94585 1.34903 8.89947 1.42474 8.86769C1.50044 8.83592 1.58166 8.81936 1.66376 8.81898C1.74587 8.81859 1.82724 8.83438 1.90324 8.86544C1.97924 8.8965 2.04838 8.94223 2.10671 9.00001L2.44171 9.33334ZM16.4884 8.72251C16.6054 8.60673 16.7633 8.5418 16.928 8.5418C17.0926 8.5418 17.2505 8.60673 17.3675 8.72251L18.7725 10.1108C18.8325 10.1682 18.8804 10.2368 18.9135 10.3128C18.9467 10.3889 18.9644 10.4707 18.9655 10.5537C18.9667 10.6366 18.9514 10.7189 18.9204 10.7958C18.8895 10.8728 18.8435 10.9428 18.7852 11.0018C18.727 11.0608 18.6575 11.1076 18.581 11.1395C18.5044 11.1714 18.4223 11.1877 18.3393 11.1876C18.2564 11.1874 18.1743 11.1707 18.0979 11.1385C18.0215 11.1063 17.9522 11.0592 17.8942 11L17.5525 10.6625C17.4942 14.8 14.085 18.125 9.90254 18.125C8.59402 18.1279 7.30653 17.7959 6.16263 17.1605C5.01874 16.5251 4.05651 15.6075 3.36754 14.495C3.32443 14.4251 3.29549 14.3475 3.2824 14.2664C3.2693 14.1853 3.2723 14.1025 3.29122 14.0226C3.31014 13.9427 3.34461 13.8673 3.39267 13.8007C3.44072 13.7342 3.50142 13.6777 3.57129 13.6346C3.64117 13.5915 3.71885 13.5625 3.79991 13.5494C3.88096 13.5364 3.9638 13.5393 4.0437 13.5583C4.1236 13.5772 4.19898 13.6117 4.26556 13.6597C4.33213 13.7078 4.38859 13.7685 4.43171 13.8383C5.00864 14.7693 5.81427 15.5372 6.7719 16.0687C7.72953 16.6003 8.80728 16.8778 9.90254 16.875C13.4075 16.875 16.2442 14.0975 16.3025 10.6642L15.9625 11C15.8446 11.1166 15.6852 11.1816 15.5194 11.1806C15.3536 11.1797 15.195 11.1129 15.0784 10.995C14.9618 10.8771 14.8968 10.7177 14.8978 10.5519C14.8987 10.3861 14.9655 10.2274 15.0834 10.1108L16.4884 8.72251Z" fill="black" />
                                    </svg>

                                </div>
                                <div>
                                    <h6 className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro]">Automatic Payment Failover</h6>
                                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Automatically retry failed payments with backup methods to ensure uninterrupted service.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isFailoverEnabled}
                                    onChange={(e) => setIsFailoverEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#F56D2D] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F56D2D]"></div>
                            </label>
                        </div>
                    </div>

                    {/* Payment Method Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
                        {/* Card 1: Business Visa */}
                        <div className="!bg-white rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative shadow-sm">
                            <button className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors mt-3">
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" fill="white" />
                                    <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" stroke="#E8F0FF" />
                                    <path d="M9.25 11.5H22.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M21.25 11.5V22C21.25 22.75 20.5 23.5 19.75 23.5H12.25C11.5 23.5 10.75 22.75 10.75 22V11.5" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M13 11.5V10C13 9.25 13.75 8.5 14.5 8.5H17.5C18.25 8.5 19 9.25 19 10V11.5" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M14.5 15.25V19.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M17.5 15.25V19.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>

                            </button>
                            <div className="flex items-start gap-3 mb-4 pr-8">
                                <div className="w-10 h-10 bg-[#E8F0FF] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="24" height="24" rx="3" fill="#E8F0FF" />
                                        <path d="M18 6.75H6C5.17157 6.75 4.5 7.42157 4.5 8.25V15.75C4.5 16.5784 5.17157 17.25 6 17.25H18C18.8284 17.25 19.5 16.5784 19.5 15.75V8.25C19.5 7.42157 18.8284 6.75 18 6.75Z" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M4.5 10.5H19.5" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>

                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Business Visa</p>
                                        <span className="px-2 py-0.5 bg-[#F56D2D] text-white rounded-full text-xs font-medium font-[BasisGrotesquePro] whitespace-nowrap flex items-center">
                                            Primary
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-0.5">Credit Card</p>
                                </div>
                            </div>
                            <div className="flex items-end justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900 font-[BasisGrotesquePro] m-0 leading-tight">**** **** **** 4242</p>
                                    <p className="text-xs text-gray-600 font-[BasisGrotesquePro] m-0 leading-tight mt-1">Expires 12/2026</p>
                                    <p className="text-xs text-gray-600 font-[BasisGrotesquePro] m-0 leading-tight mt-1">Last used: 2024-01-15</p>
                                    <p className="text-xs text-gray-600 font-[BasisGrotesquePro] m-0 leading-tight mt-1">Fee: 2.9% + $0.3</p>
                                </div>

                                <button className="px-3 py-2 bg-white !border border-[#E8F0FF] text-gray-600 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-xs sm:text-sm whitespace-nowrap">
                                    Set Primary
                                </button>
                            </div>
                        </div>

                        {/* Card 2: Business Checking */}
                        <div className="!bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative shadow-sm">
                            <button className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors mt-3">
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" fill="white" />
                                    <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" stroke="#E8F0FF" />
                                    <path d="M9.25 11.5H22.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M21.25 11.5V22C21.25 22.75 20.5 23.5 19.75 23.5H12.25C11.5 23.5 10.75 22.75 10.75 22V11.5" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M13 11.5V10C13 9.25 13.75 8.5 14.5 8.5H17.5C18.25 8.5 19 9.25 19 10V11.5" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M14.5 15.25V19.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M17.5 15.25V19.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>

                            </button>
                            <div className="flex items-start gap-3 mb-4 pr-8">
                                <div className="w-10 h-10 bg-[#E8F0FF] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="24" height="24" rx="3" fill="#E8F0FF" />
                                        <path d="M16.5 4.5H7.5C6.67157 4.5 6 5.17157 6 6V18C6 18.8284 6.67157 19.5 7.5 19.5H16.5C17.3284 19.5 18 18.8284 18 18V6C18 5.17157 17.3284 4.5 16.5 4.5Z" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M9.75 19.5V16.5H14.25V19.5" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M9 7.5H9.00583" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M15 7.5H15.0058" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M12 7.5H12.0058" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M12 10.5H12.0058" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M12 13.5H12.0058" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M15 10.5H15.0058" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M15 13.5H15.0058" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M9 10.5H9.00583" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M9 13.5H9.00583" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>

                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Business Checking</p>
                                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-0.5">Bank Account (ACH)</p>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-900 font-[BasisGrotesquePro] m-0 leading-tight mt-1">****1234 - Chase Bank</p>
                                <p className="text-xs text-gray-600 font-[BasisGrotesquePro] m-0 leading-tight mt-1">Expires 12/2026</p>
                                <p className="text-xs text-gray-600 font-[BasisGrotesquePro] m-0 leading-tight mt-1">Last used: 2024-01-15</p>
                                <p className="text-xs text-gray-600 font-[BasisGrotesquePro] m-0 leading-tight mt-1">Fee: 2.9% + $0.3</p>
                            </div>

                        </div>

                        {/* Card 3: PayPal */}
                        <div className="!bg-white rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative shadow-sm">
                            <button className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors mt-3">
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" fill="white" />
                                    <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" stroke="#E8F0FF" />
                                    <path d="M9.25 11.5H22.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M21.25 11.5V22C21.25 22.75 20.5 23.5 19.75 23.5H12.25C11.5 23.5 10.75 22.75 10.75 22V11.5" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M13 11.5V10C13 9.25 13.75 8.5 14.5 8.5H17.5C18.25 8.5 19 9.25 19 10V11.5" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M14.5 15.25V19.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M17.5 15.25V19.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>

                            </button>
                            <div className="flex items-start gap-3 mb-4 pr-8">
                                <div className="w-10 h-10 bg-[#E8F0FF] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="24" height="24" rx="3" fill="#E8F0FF" />
                                        <path d="M15.75 4.5H8.25C7.42157 4.5 6.75 5.17157 6.75 6V18C6.75 18.8284 7.42157 19.5 8.25 19.5H15.75C16.5784 19.5 17.25 18.8284 17.25 18V6C17.25 5.17157 16.5784 4.5 15.75 4.5Z" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M12 16.5H12.0075" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>

                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Business Visa</p>
                                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-0.5">PayPal</p>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-900 font-[BasisGrotesquePro] m-0 leading-tight mt-1">business@example.com</p>
                                <p className="text-xs text-gray-600 font-[BasisGrotesquePro] m-0 leading-tight mt-1">Last used: 2024-01-15</p>
                                <p className="text-xs text-gray-600 font-[BasisGrotesquePro] m-0 leading-tight mt-1">Fee: 2.9% + $0.3</p>
                            </div>

                        </div>
                    </div>

                    {/* PCI-Compliant Banner */}
                    <div className="bg-[#F0FDF4] !border border-[#BBF7D0] !rounded-lg p-4 sm:p-6">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15 9.75034C15 13.5003 12.375 15.3753 9.255 16.4628C9.09162 16.5182 8.91415 16.5156 8.7525 16.4553C5.625 15.3753 3 13.5003 3 9.75034V4.50034C3 4.30142 3.07902 4.11066 3.21967 3.97001C3.36032 3.82936 3.55109 3.75034 3.75 3.75034C5.25 3.75034 7.125 2.85034 8.43 1.71034C8.58889 1.57459 8.79102 1.5 9 1.5C9.20898 1.5 9.41111 1.57459 9.57 1.71034C10.8825 2.85784 12.75 3.75034 14.25 3.75034C14.4489 3.75034 14.6397 3.82936 14.7803 3.97001C14.921 4.11066 15 4.30142 15 4.50034V9.75034Z" stroke="#166534" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>

                            </div>
                            <div>
                                <h6 className="text-base font-semibold !text-[#166534] mb-1 font-[BasisGrotesquePro]">PCI-Compliant Secure Payment Processing</h6>
                                <p className="text-sm text-green-700 font-[BasisGrotesquePro]">All payment information is encrypted with 256-bit SSL and processed through PCI DSS Level 1 compliant systems. We never store your full payment details and use tokenization for maximum security.</p>
                            </div>
                        </div>
                    </div>
                </div>
                </>
                )}

            </div>
        </div>
    );
};

export default SubscriptionManagement;
