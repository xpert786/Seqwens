import React from 'react';

const UsageAlerts = () => {
    const alerts = [
        {
            id: 1,
            title: 'Approaching Usage Limit',
            description: 'E-Signature Envelopes: 85/100 - Sarah Johnson',
            timestamp: '1/15/2024, 4:00:00 PM',
            severity: 'MEDIUM',
            severityColor: 'bg-white !text-[#FBBF24] !border border-[#FBBF24]'
        },
        {
            id: 2,
            title: 'Usage Limit Exceeded',
            description: 'Storage: 105/100',
            timestamp: '1/15/2024, 2:45:00 PM',
            severity: 'HIGH',
            severityColor: 'bg-white !text-[#EF4444] !border border-[#EF4444] '
        },
        {
            id: 3,
            title: 'Unusual Activity Detected',
            description: 'API Calls: 2500/1000 - Mike Davis',
            timestamp: '1/15/2024, 2:15:00 PM',
            severity: 'LOW',
            severityColor: 'bg-white !text-[#22C55E] !border border-[#22C55E]'
        }
    ];

    return (
        <div>


            <div className="space-y-4">
                {alerts.map((alert) => (
                    <div key={alert.id} className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <h6 className="text-base font-bold text-gray-900 mb-1 font-[BasisGrotesquePro]">{alert.title}</h6>
                                <p className="text-sm text-gray-700 font-[BasisGrotesquePro] mb-1">{alert.description}</p>
                                <p className="text-xs text-gray-700 font-[BasisGrotesquePro]">{alert.timestamp}</p>
                            </div>
                            <div className="flex-shrink-0">
                                <span className={`px-3 py-1 ${alert.severityColor} text-white !rounded-full text-xs font-medium font-[BasisGrotesquePro]`}>
                                    {alert.severity}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UsageAlerts;

