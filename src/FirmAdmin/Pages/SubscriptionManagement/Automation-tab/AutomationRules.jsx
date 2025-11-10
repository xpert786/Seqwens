import React, { useState } from 'react';

const AutomationRules = () => {
    const [rules, setRules] = useState([
        {
            id: 1,
            ruleName: 'Monthly Renewal Reminder',
            type: 'Renewal',
            typeColor: 'bg-[#1E40AF]',
            trigger: '7 Days Before Renewal',
            action: 'Send Email Notification',
            lastRun: '2024-01-08 09:00:00',
            nextRun: '2024-01-08 09:00:00',
            status: true
        },
        {
            id: 2,
            ruleName: 'Usage Limit Alert',
            type: 'usage',
            typeColor: 'bg-[#22C55E]',
            trigger: '80% Of Limit Reached',
            action: 'Send Alert To Admin',
            lastRun: '2024-01-14 14:30:00',
            nextRun: 'Real-time monitoring',
            status: true
        },
        {
            id: 3,
            ruleName: 'Failed Payment Retry',
            type: 'notification',
            typeColor: 'bg-[#FBBF24]',
            trigger: 'Payment Failure',
            action: 'Offer Annual Discount',
            lastRun: '2024-01-14 14:30:00',
            nextRun: 'Real-time monitoring',
            status: true
        }
    ]);

    const toggleStatus = (id) => {
        setRules(rules.map(rule =>
            rule.id === id ? { ...rule, status: !rule.status } : rule
        ));
    };

    return (
        <div>
            <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Automation Rules</h6>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Configure automated workflows and triggers</p>

            {/* Table Header */}
            <div className="grid grid-cols-8 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 pb-2 sm:pb-3 mt-6">
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro] ml-3">Rule Name</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro] ml-3">Type</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro] ml-3">Trigger</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Action</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Last Run</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Next Run</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Status</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Actions</div>
            </div>

            {/* Table Rows */}
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                {rules.map((rule) => (
                    <div key={rule.id} className="grid grid-cols-8 gap-2 sm:gap-3 lg:gap-4 items-center p-2 sm:p-3 lg:p-4 !border border-[#E8F0FF] rounded-lg bg-white">
                        {/* Rule Name */}
                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                            {rule.ruleName}
                        </div>

                        {/* Type Badge */}
                        <div>
                            <span className={`inline-block px-3 py-1 ${rule.typeColor} text-white text-xs font-medium !rounded-full font-[BasisGrotesquePro]`}>
                                {rule.type}
                            </span>
                        </div>

                        {/* Trigger */}
                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                            {rule.trigger}
                        </div>

                        {/* Action */}
                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                            {rule.action}
                        </div>

                        {/* Last Run */}
                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                            {rule.lastRun}
                        </div>

                        {/* Next Run */}
                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                            {rule.nextRun}
                        </div>

                        {/* Status Toggle */}
                        <div>
                            <button
                                onClick={() => toggleStatus(rule.id)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rule.status ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.status ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Actions Icons */}
                        <div className="flex items-center gap-3">
                            {/* Eye Icon */}
                            <button className="text-gray-700 hover:text-gray-900">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#F3F7FF" />
                                    <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#E8F0FF" stroke-width="0.5" />
                                    <path d="M3.16602 9.0013C3.16602 9.0013 4.91602 4.91797 8.99935 4.91797C13.0827 4.91797 14.8327 9.0013 14.8327 9.0013C14.8327 9.0013 13.0827 13.0846 8.99935 13.0846C4.91602 13.0846 3.16602 9.0013 3.16602 9.0013Z" stroke="#131323" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M9 10.75C9.9665 10.75 10.75 9.9665 10.75 9C10.75 8.0335 9.9665 7.25 9 7.25C8.0335 7.25 7.25 8.0335 7.25 9C7.25 9.9665 8.0335 10.75 9 10.75Z" stroke="#131323" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>

                            </button>

                            {/* Download Icon */}
                            <button className="text-gray-700 hover:text-gray-900">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#F3F7FF" />
                                    <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#E8F0FF" stroke-width="0.5" />
                                    <path d="M14.25 10.75V13.0833C14.25 13.3928 14.1271 13.6895 13.9083 13.9083C13.6895 14.1271 13.3928 14.25 13.0833 14.25H4.91667C4.60725 14.25 4.3105 14.1271 4.09171 13.9083C3.87292 13.6895 3.75 13.3928 3.75 13.0833V10.75M6.08333 7.83333L9 10.75M9 10.75L11.9167 7.83333M9 10.75V3.75" stroke="#131323" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>

                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AutomationRules;
