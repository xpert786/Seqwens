import React, { useState } from 'react';

const PurchaseRestrictions = () => {
    const [pciCompliance, setPciCompliance] = useState(true);
    const [approvalAmount, setApprovalAmount] = useState('50');
    const [maxMonthlySpend, setMaxMonthlySpend] = useState('500');
    const [paymentMethods, setPaymentMethods] = useState({
        creditCard: true,
        ach: true,
        paypal: true
    });

    const togglePaymentMethod = (method) => {
        setPaymentMethods({
            ...paymentMethods,
            [method]: !paymentMethods[method]
        });
    };

    return (
        <div>
            <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Purchase Restrictions</h6>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Control staff purchasing permissions and spending limits</p>

            <div className="space-y-6">
                {/* PCI DSS Compliance */}
                <div className="">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h6 className="text-base font-bold text-gray-900 mb-2 font-[BasisGrotesquePro] mt-3">PCI DSS Compliance</h6>
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Payment Card Industry Data Security Standard compliance</p>
                        </div>
                        <div className="flex-shrink-0">
                            <button
                                onClick={() => setPciCompliance(!pciCompliance)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pciCompliance ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pciCompliance ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Require Approval Over */}
                <div className="">
                    <label className="block text-base font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">Require Approval Over ($)</label>
                    <select
                        className="px-3 py-2 bg-white !border border-gray-300 !rounded-lg text-sm text-gray-700 font-[BasisGrotesquePro] w-full mb-2"
                        value={approvalAmount}
                        onChange={(e) => setApprovalAmount(e.target.value)}
                    >
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="500">500</option>
                    </select>
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Purchases above this amount require admin approval.</p>
                </div>

                {/* Maximum Monthly Spend */}
                <div className="">
                    <label className="block text-base font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">Maximum Monthly Spend ($)</label>
                    <select
                        className="px-3 py-2 bg-white !border border-gray-300 !rounded-lg text-sm text-gray-700 font-[BasisGrotesquePro] w-full mb-2"
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
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Total spending limit per user per month.</p>
                </div>

                {/* Allowed Payment Methods */}
                <div className="">
                    <h6 className="text-base font-bold text-gray-900 mb-4 font-[BasisGrotesquePro]">Allowed Payment Methods</h6>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => togglePaymentMethod('creditCard')}
                                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                                    paymentMethods.creditCard 
                                        ? 'bg-[#3AD6F2] border-2 border-[#3AD6F2]' 
                                        : 'bg-white border-2 border-gray-300'
                                }`}
                            >
                                {paymentMethods.creditCard && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                            <label onClick={() => togglePaymentMethod('creditCard')} className="text-sm text-gray-700 font-[BasisGrotesquePro] cursor-pointer">
                                Credit Card
                            </label>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => togglePaymentMethod('ach')}
                                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                                    paymentMethods.ach 
                                        ? 'bg-[#3AD6F2] border-2 border-[#3AD6F2]' 
                                        : 'bg-white border-2 border-gray-300'
                                }`}
                            >
                                {paymentMethods.ach && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                            <label onClick={() => togglePaymentMethod('ach')} className="text-sm text-gray-700 font-[BasisGrotesquePro] cursor-pointer">
                                ACH/Bank Transfer
                            </label>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => togglePaymentMethod('paypal')}
                                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                                    paymentMethods.paypal 
                                        ? 'bg-[#3AD6F2] border-2 border-[#3AD6F2]' 
                                        : 'bg-white border-2 border-gray-300'
                                }`}
                            >
                                {paymentMethods.paypal && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                            <label onClick={() => togglePaymentMethod('paypal')} className="text-sm text-gray-700 font-[BasisGrotesquePro] cursor-pointer">
                                Pay Pal
                            </label>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-start">
                    <button className="px-6 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#EA580C] transition-colors font-[BasisGrotesquePro] text-sm font-medium">
                        Save Restrictions
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseRestrictions;

