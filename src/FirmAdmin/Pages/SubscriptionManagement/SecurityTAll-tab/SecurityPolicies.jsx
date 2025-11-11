import React, { useState } from 'react';

const SecurityPolicies = () => {
    const [policies, setPolicies] = useState([
        {
            id: 1,
            title: 'PCI DSS Compliance',
            description: 'Payment Card Industry Data Security Standard compliance',
            severity: 'MEDIUM',
            severityColor: '!text-[#F59E0B] !border border-[#F59E0B]',
            enabled: true
        },
        {
            id: 2,
            title: 'Two-Factor Authentication',
            description: 'Require 2FA for all billing-related actions',
            severity: 'HIGH',
            severityColor: '!text-[#EF4444] !border border-[#EF4444]',
            enabled: true
        },
        {
            id: 3,
            title: 'IP Restriction',
            description: 'Restrict billing access to office IP addresses',
            severity: 'CRITICAL',
            severityColor: '!text-[#10B981] !border border-[#10B981]',
            enabled: true
        }
    ]);

    const togglePolicy = (id) => {
        setPolicies(policies.map(policy => 
            policy.id === id ? { ...policy, enabled: !policy.enabled } : policy
        ));
    };

    return (
        <div>
            <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Security Policies</h6>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Configure security policies and compliance requirements</p>

            <div className="space-y-4 mt-6">
                {policies.map((policy) => (
                    <div key={policy.id} className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h6 className="text-base font-bold text-gray-900 font-[BasisGrotesquePro]">{policy.title}</h6>
                                    <span className={`px-3 py-1 ${policy.severityColor} !rounded-full text-xs font-medium font-[BasisGrotesquePro]`}>
                                        {policy.severity}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 font-medium font-[BasisGrotesquePro]">{policy.description}</p>
                            </div>
                            <div className="flex-shrink-0">
                                <button
                                    onClick={() => togglePolicy(policy.id)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        policy.enabled ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            policy.enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SecurityPolicies;

