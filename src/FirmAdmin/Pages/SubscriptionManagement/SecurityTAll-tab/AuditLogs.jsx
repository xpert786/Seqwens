import React from 'react';

const AuditLogs = () => {
    const auditLogs = [
        {
            id: 1,
            timestamp: '2024-01-15 14:30:22',
            user: 'Michael Chen',
            action: 'Plan Upgrade',
            details: 'Upgraded from Basic to Professional plan',
            ipAddress: '192.168.1.100',
            amount: '$99.00',
            status: 'Success'
        },
        {
            id: 2,
            timestamp: '2024-01-15 13:45:10',
            user: 'Sarah Johnson',
            action: 'Add-On Purchase',
            details: 'Purchased 100 additional e-signature envelopes',
            ipAddress: '192.168.1.101',
            amount: '$25.00',
            status: 'Success'
        },
        {
            id: 3,
            timestamp: '2024-01-15 14:30:22',
            user: 'System',
            action: 'Auto-Renewal',
            details: 'Monthly subscription auto-renewed',
            ipAddress: 'system',
            amount: '$149.00',
            status: 'Failed'
        }
    ];

    return (
        <div>
            <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Billing Audit Trail</h6>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Complete log of all billing-related activities and transactions</p>

            {/* Table Header */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 pb-2 sm:pb-3 mt-6">
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro] ml-3">Timestamp</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro] ml-3">User</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro] ml-3">Action</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Details</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">IP Address</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Amount</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Status</div>
            </div>

            {/* Table Rows */}
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                {auditLogs.map((log) => (
                    <div key={log.id} className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4 items-center p-2 sm:p-3 lg:p-4 !border border-[#E8F0FF] rounded-lg bg-white">
                        {/* Timestamp Column */}
                        <div className="text-sm  font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                            {log.timestamp}
                        </div>

                        {/* User Column */}
                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                            {log.user}
                        </div>

                        {/* Action Column */}
                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                            {log.action}
                        </div>

                        {/* Details Column */}
                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                            {log.details}
                        </div>

                        {/* IP Address Column */}
                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                            {log.ipAddress}
                        </div>

                        {/* Amount Column */}
                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                            {log.amount}
                        </div>

                        {/* Status Column */}
                        <div>
                            <span className={`px-3 py-1 !rounded-full text-xs font-medium font-[BasisGrotesquePro] ${
                                log.status === 'Success' 
                                    ? 'bg-[#22C55E] text-white' 
                                    : 'bg-[#EF4444] text-white'
                            }`}>
                                {log.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AuditLogs;

