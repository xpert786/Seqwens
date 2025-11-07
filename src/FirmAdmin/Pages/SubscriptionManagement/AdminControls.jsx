import React, { useState } from 'react';
import LicenseManagement from './AdminAll-tab/LicenseManagement';
import UsageDashboard from './AdminAll-tab/UsageDashboard';
import UsageAlerts from './AdminAll-tab/UsageAlerts';
import StaffPermissions from './AdminAll-tab/StaffPermissions';

const AdminControls = () => {
    const [activeTab, setActiveTab] = useState('License Management');

    return (
        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
            {/* Admin Controls & Usage Dashboard */}
            <div>
                <h5 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Admin Controls & Usage Dashboard</h5>
                <p className="text-sm sm:text-base text-gray-600 font-[BasisGrotesquePro] mb-6">Manage licenses, monitor usage, and control staff permissions</p>

                {/* Navigation Tabs */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-1.5 sm:p-2 w-fit mb-6">
                    <div className="flex gap-2 sm:gap-3">
                        {['License Management', 'Usage Dashboard', 'Usage Alerts', 'Staff Permissions'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 !rounded-lg font-[BasisGrotesquePro] text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                                    activeTab === tab
                                        ? 'bg-[#3AD6F2] text-white'
                                        : 'bg-transparent text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'License Management' && <LicenseManagement />}
                {activeTab === 'Usage Dashboard' && <UsageDashboard />}
                {activeTab === 'Usage Alerts' && <UsageAlerts />}
                {activeTab === 'Staff Permissions' && <StaffPermissions />}
            </div>
        </div>
    );
};

export default AdminControls;

