import React, { useState } from 'react';
import LicenseManagement from './AdminAll-tab/LicenseManagement';
import UsageDashboard from './AdminAll-tab/UsageDashboard';
import UsageAlerts from './AdminAll-tab/UsageAlerts';
import StaffPermissions from './AdminAll-tab/StaffPermissions';

const AdminControls = () => {
    const [activeTab, setActiveTab] = useState('License Management');

    return (
        <div className="bg-white !rounded-xl !border border-[#E8F0FF] p-5 sm:p-8 shadow-sm">
            {/* Admin Controls & Usage Dashboard */}
            <div>
                <div className="mb-8">
                    <h5 className="text-2xl sm:text-3xl font-bold text-[#1F2A55] mb-1 font-[BasisGrotesquePro]">Admin Controls</h5>
                    <p className="text-sm sm:text-base text-gray-500 font-[BasisGrotesquePro]">Manage licenses, real-time usage metrics, and staff permissions</p>
                </div>

                {/* Navigation Tabs - Optimized for Mobile Swipe */}
                <div className="overflow-x-auto custom-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0 mb-8 scroll-smooth">
                    <div className="bg-[#F8FAFF] !rounded-xl !border border-[#E8F0FF] p-1.5 flex gap-1.5 sm:gap-2 w-fit min-w-full sm:min-w-0">
                        {['License Management', 'Usage Dashboard', 'Usage Alerts', 'Staff Permissions'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 sm:px-6 !rounded-lg font-[BasisGrotesquePro] text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeTab === tab
                                    ? 'bg-[#3AD6F2] text-white shadow-md shadow-[#3AD6F2]/20'
                                    : 'bg-transparent text-[#6B7280] hover:text-[#3B4A66] hover:bg-white/50'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content with Smooth Transition */}
                <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                    {activeTab === 'License Management' && <LicenseManagement />}
                    {activeTab === 'Usage Dashboard' && <UsageDashboard />}
                    {activeTab === 'Usage Alerts' && <UsageAlerts />}
                    {activeTab === 'Staff Permissions' && <StaffPermissions />}
                </div>
            </div>
        </div>
    );
};

export default AdminControls;

