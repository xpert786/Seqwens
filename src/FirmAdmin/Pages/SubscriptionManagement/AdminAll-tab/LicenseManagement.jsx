import React from 'react';

const LicenseManagement = () => {
    const staffMembers = [
        {
            id: 1,
            name: 'Sarah Johnson',
            email: 'sarah@firm.com',
            role: 'Senior Tax Preparer',
            status: ['Advanced Analytics', 'Premium Support', 'AI Compliance']
        },
        {
            id: 2,
            name: 'Mike Davis',
            email: 'mike@firm.com',
            role: 'Tax Preparer',
            status: ['Basic Analytics']
        },
        {
            id: 3,
            name: 'Lisa Chen',
            email: 'Lisa Chen@firm.com',
            role: 'Junior Associate',
            status: ['No licenses']
        }
    ];

    return (
        <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {/* Total Staff Card */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Total Staff</p>
                    <p className="text-xl sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">3</p>
                    <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Active team members</p>
                </div>

                {/* Licensed Features Card */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Licensed Features</p>
                    <p className="text-xl sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">4</p>
                    <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Total active licenses</p>
                </div>

                {/* Restricted Staff Card */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 ">
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Restricted Staff</p>
                    <p className="text-xl sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">01-03-2025</p>
                    <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Cannot purchase add-ons</p>
                </div>
            </div>

            {/* Staff License Assignment */}
            <div className=" p-4 sm:p-6">
                <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Staff License Assignment</h6>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Manage who has access to advanced features</p>

                {/* Table Header */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 pb-2 sm:pb-3">
                    <div className="font-regular text-gray-600 text-xs sm:text-sm font-[BasisGrotesquePro]">Staff Member</div>
                    <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Role</div>
                    <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Status</div>
                    <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Actions</div>
                </div>

                {/* Staff Rows */}
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    {staffMembers.map((staff) => (
                        <div key={staff.id} className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4 items-center p-2 sm:p-3 lg:p-4 !border border-[#E8F0FF] rounded-lg">
                            {/* Staff Member Column */}
                            <div>
                                <p className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro] mb-0.5 sm:mb-1">{staff.name}</p>
                                <p className="text-xs text-gray-600 font-[BasisGrotesquePro]">{staff.email}</p>
                            </div>

                            {/* Role Column */}
                            <div className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                {staff.role}
                            </div>

                            {/* Status Column */}
                            <div>
                                <div className="flex flex-wrap gap-2">
                                    {staff.status.map((statusItem, index) => (
                                        <span key={index} className="px-3 py-1 bg-white !border border-gray-300 text-gray-700 !rounded-full text-xs font-[BasisGrotesquePro]">
                                            {statusItem}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Actions Column */}
                            <div>
                                <button className="px-4 py-2 bg-[#FFFFFF] !border border-[#22C55E] text-[#22C55E] !rounded-lg hover:bg-[#F0FDF4] transition-colors font-[BasisGrotesquePro] text-sm font-medium">
                                    Manage
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LicenseManagement;

