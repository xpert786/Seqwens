import React, { useState } from 'react';
import AutoRenewal from './Automation-tab/AutoRenewal';
import AutomationRules from './Automation-tab/AutomationRules';
import Notifications from './Automation-tab/Notifications';
import Templates from './Automation-tab/Templates';

const Automation = () => {
    const [activeSubTab, setActiveSubTab] = useState('Auto Renewal');

    const subTabs = ['Auto Renewal', 'Automation Rules', 'Notifications', 'Templates'];

    return (
        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
            <h5 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Automation & Notifications</h5>

            {/* Sub-navigation Tabs */}
            <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-1.5 sm:p-2 w-fit mb-6">
                <div className="flex gap-2 sm:gap-3">
                    {subTabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveSubTab(tab)}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 !rounded-lg font-[BasisGrotesquePro] text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${activeSubTab === tab
                                ? 'bg-[#3AD6F2] text-white'
                                : 'bg-transparent text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sub-tab Content */}
            {activeSubTab === 'Auto Renewal' && <AutoRenewal />}
            {activeSubTab === 'Automation Rules' && <AutomationRules />}
            {activeSubTab === 'Notifications' && <Notifications />}
            {activeSubTab === 'Templates' && <Templates />}
        </div>
    );
};

export default Automation;

