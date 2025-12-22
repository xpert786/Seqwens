import React, { useState } from 'react';
import { toast } from 'react-toastify';
import OfficePricing from './BillingManagement/OfficePricing';
import UserPricing from './BillingManagement/UserPricing';
import BillingRules from './BillingManagement/BillingRules';
import BillingCharges from './BillingManagement/BillingCharges';

export default function BillingManagement() {
  const [activeTab, setActiveTab] = useState('Office Pricing');

  const tabs = [
    { id: 'Office Pricing', label: 'Office Pricing' },
    { id: 'User Pricing', label: 'User Pricing' },
    { id: 'Billing Rules', label: 'Billing Rules' },
    { id: 'Billing Charges', label: 'Billing Charges' }
  ];

  return (
    <div className="p-6 bg-[rgb(243,247,255)] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2">
          Billing Management
        </h2>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
          Manage billing for firm growth - office locations and staff members
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-1.5 w-fit">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap font-[BasisGrotesquePro] ${
                  activeTab === tab.id
                    ? 'bg-[#3AD6F2] text-white'
                    : 'bg-transparent text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'Office Pricing' && <OfficePricing />}
        {activeTab === 'User Pricing' && <UserPricing />}
        {activeTab === 'Billing Rules' && <BillingRules />}
        {activeTab === 'Billing Charges' && <BillingCharges />}
      </div>
    </div>
  );
}

