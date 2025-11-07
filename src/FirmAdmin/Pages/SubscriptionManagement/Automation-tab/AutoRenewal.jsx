import React, { useState } from 'react';

const AutoRenewal = () => {
    const [enableAutoRenewal, setEnableAutoRenewal] = useState(true);
    const [approvalAmount, setApprovalAmount] = useState('50');
    const [maxMonthlySpend, setMaxMonthlySpend] = useState('500');

    return (
        <div>
            <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Auto-Renewal Settings</h6>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Configure automatic subscription renewal preferences</p>

            <div className="space-y-6">
                {/* Enable Auto-Renewal */}
                <div className="mt-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h6 className="text-base font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Enable Auto-Renewal</h6>
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Automatically renew subscriptions to prevent service interruption</p>
                        </div>
                        <div className="flex-shrink-0">
                            <button
                                onClick={() => setEnableAutoRenewal(!enableAutoRenewal)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    enableAutoRenewal ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        enableAutoRenewal ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Approval and Spend Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Require Approval Over */}
                    <div>
                        <label className="block text-base font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">Require Approval Over ($)</label>
                        <select
                            className="px-3 py-2 bg-white !border border-gray-300 !rounded-lg text-sm text-gray-700 font-[BasisGrotesquePro] w-full"
                            value={approvalAmount}
                            onChange={(e) => setApprovalAmount(e.target.value)}
                        >
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="200">200</option>
                            <option value="500">500</option>
                        </select>
                    </div>

                    {/* Maximum Monthly Spend */}
                    <div>
                        <label className="block text-base font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">Maximum Monthly Spend ($)</label>
                        <select
                            className="px-3 py-2 bg-white !border border-gray-300 !rounded-lg text-sm text-gray-700 font-[BasisGrotesquePro] w-full"
                            value={maxMonthlySpend}
                            onChange={(e) => setMaxMonthlySpend(e.target.value)}
                        >
                            <option value="100">100</option>
                            <option value="200">200</option>
                            <option value="300">300</option>
                            <option value="400">400</option>
                            <option value="500">500</option>
                            <option value="1000">1000</option>
                        </select>
                    </div>
                </div>

                 {/* Approval and Spend Fields */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Require Approval Over */}
                    <div>
                        <label className="block text-base font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">Require Approval Over ($)</label>
                        <select
                            className="px-3 py-2 bg-white !border border-gray-300 !rounded-lg text-sm text-gray-700 font-[BasisGrotesquePro] w-full"
                            value={approvalAmount}
                            onChange={(e) => setApprovalAmount(e.target.value)}
                        >
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="200">200</option>
                            <option value="500">500</option>
                        </select>
                    </div>

                    {/* Maximum Monthly Spend */}
                    <div>
                        <label className="block text-base font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">Maximum Monthly Spend ($)</label>
                        <select
                            className="px-3 py-2 bg-white !border border-gray-300 !rounded-lg text-sm text-gray-700 font-[BasisGrotesquePro] w-full"
                            value={maxMonthlySpend}
                            onChange={(e) => setMaxMonthlySpend(e.target.value)}
                        >
                            <option value="100">100</option>
                            <option value="200">200</option>
                            <option value="300">300</option>
                            <option value="400">400</option>
                            <option value="500">500</option>
                            <option value="1000">1000</option>
                        </select>
                    </div>
                </div>

                {/* Payment Retry Information */}
                <div className="">
                    <p className="text-sm text-gray-900 font-[BasisGrotesquePro]">Days to retry failed payments before suspension</p>
                </div>

                {/* Save Button */}
                <div className="flex justify-start">
                    <button className="px-6 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#EA580C] transition-colors font-[BasisGrotesquePro] text-sm font-medium">
                        Save Auto-Renewal Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AutoRenewal;

