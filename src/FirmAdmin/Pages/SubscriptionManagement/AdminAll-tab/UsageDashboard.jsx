import React from 'react';

const UsageDashboard = () => {
    const usageCards = [
        {
            title: 'E-Signatures',
            label: 'Used',
            current: 80,
            total: 500,
            percentage: (80 / 500) * 100
        },
        {
            title: 'Storage (GB)',
            label: 'Used',
            current: 23,
            total: 100,
            percentage: (23 / 100) * 100
        },
        {
            title: 'API Calls',
            label: 'Used',
            current: 2374,
            total: 10000,
            percentage: (2374 / 10000) * 100
        }
    ];

    const staffUsage = [
        {
            id: 1,
            name: 'Sarah Johnson',
            eSignatures: 45,
            storage: 1250,
            apiCalls: 12
        },
        {
            id: 2,
            name: 'Mike Davis',
            eSignatures: 45,
            storage: 1250,
            apiCalls: 12
        },
        {
            id: 3,
            name: 'Lisa Chen',
            eSignatures: 45,
            storage: 1250,
            apiCalls: 12
        }
    ];

    return (
        <div>
            {/* Usage Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {usageCards.map((card, index) => (
                    <div key={index} className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                        <p className="text-sm text-[#3B4A66] font-[BasisGrotesquePro] mb-2 text-[15px]">{card.title}</p>
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs text-gray-600 font-[BasisGrotesquePro]">{card.label}</p>
                            <p className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                                {card.current}/{card.total}
                            </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-[#3AD6F2] h-2 rounded-full transition-all" 
                                style={{ width: `${card.percentage}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Individual Usage Breakdown */}
            <div className=" p-4 sm:p-6">
                <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Individual Usage Breakdown</h6>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Monitor resource consumption by staff member</p>

                {/* Table Header */}
                <div className="grid grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 pb-2 sm:pb-3">
                    <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Staff Member</div>
                    <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">E-Signatures</div>
                    <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Storage (GB)</div>
                    <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">API Calls</div>
                    <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Actions</div>
                </div>

                {/* Staff Rows */}
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    {staffUsage.map((staff) => (
                        <div key={staff.id} className="grid grid-cols-5 gap-2 sm:gap-3 lg:gap-4 items-center p-2 sm:p-3 lg:p-4 !border border-[#E8F0FF] rounded-lg">
                            {/* Staff Member Column */}
                            <div>
                                <p className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">{staff.name}</p>
                            </div>

                            {/* E-Signatures Column */}
                            <div className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                {staff.eSignatures}
                            </div>

                            {/* Storage Column */}
                            <div className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                {staff.storage}
                            </div>

                            {/* API Calls Column */}
                            <div className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                {staff.apiCalls}
                            </div>

                            {/* Actions Column */}
                            <div>
                                <button className="px-4 py-2 bg-[#FFFFFF] !border border-[#22C55E] text-[#22C55E] !rounded-lg hover:bg-[#F0FDF4] transition-colors font-[BasisGrotesquePro] text-sm font-medium">
                                    Normal
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UsageDashboard;

