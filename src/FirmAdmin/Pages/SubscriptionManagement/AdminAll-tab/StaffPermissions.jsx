import React, { useState } from 'react';

const StaffPermissions = () => {
    const [staffPermissions, setStaffPermissions] = useState([
        {
            id: 1,
            name: 'Sarah Johnson',
            canPurchase: true,
            monthlyLimit: '$100'
        },
        {
            id: 2,
            name: 'Mike Davis',
            canPurchase: true,
            monthlyLimit: '$200'
        },
        {
            id: 3,
            name: 'Lisa Chen',
            canPurchase: true,
            monthlyLimit: '$500'
        }
    ]);

    const togglePurchasePermission = (id) => {
        setStaffPermissions(staffPermissions.map(staff => 
            staff.id === id ? { ...staff, canPurchase: !staff.canPurchase } : staff
        ));
    };

    return (
        <div>
            <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Staff Purchase Permissions</h6>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Control who can purchase add-ons and set spending limits</p>

            {/* Table Header */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 pb-2 sm:pb-3">
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Staff Member</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro] text-center">Can Purchase Add-ons</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro] text-center">Monthly Spend Limit</div>
                <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro] text-center ml-3">Actions</div>
            </div>

            {/* Staff Rows */}
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                {staffPermissions.map((staff) => (
                    <div key={staff.id} className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4 items-center p-2 sm:p-3 lg:p-4 !border border-[#E8F0FF] rounded-lg">
                        {/* Staff Member Column */}
                        <div>
                            <p className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">{staff.name}</p>
                        </div>

                        {/* Can Purchase Add-ons Column */}
                        <div className="flex justify-center">
                            <button
                                onClick={() => togglePurchasePermission(staff.id)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    staff.canPurchase ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        staff.canPurchase ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Monthly Spend Limit Column */}
                        <div className="flex justify-center">
                            <select 
                                className="px-3 py-1 bg-white !border border-[#3B4A66] !rounded-lg text-sm text-gray-700 font-[BasisGrotesquePro]  w-full max-w-[150px]"
                                defaultValue={staff.monthlyLimit}
                            >
                                <option value="$100">$100</option>
                                <option value="$200">$200</option>
                                <option value="$300">$300</option>
                                <option value="$400">$400</option>
                                <option value="$500">$500</option>
                            </select>
                        </div>

                        {/* Actions Column */}
                        <div className="flex ml-35">
                            <button className="px-4 py-2 bg-white !border border-[#3B4A66] text-gray-700 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm font-medium">
                                Configure
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StaffPermissions;

