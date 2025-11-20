import React, { useState } from 'react';
import TabNavigation from './TabNavigation';
import ConnectedTab from './ConnectedTab';
import AvailableTab from './AvailableTab';
import WebhooksTab from './WebhooksTab';
import APIKeysTab from './APIKeysTab';

export default function Integrations() {
  const [activeTab, setActiveTab] = useState('Connected');

  const tabs = ['Connected', 'Available', 'Webhooks', 'API Keys'];

  return (
    <div className="w-full px-6 py-6 bg-[#F6F7FF] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="text-2xl font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Integrations
          </h4>
          <p className="text-sm text-[#4B5563] font-[BasisGrotesquePro]">
            Connect and manage third-party services
          </p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro] flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 3V13M3 8H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Add Integration
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-4"
        />
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'Connected' && <ConnectedTab />}
        {activeTab === 'Available' && <AvailableTab />}
        {activeTab === 'Webhooks' && <WebhooksTab />}
        {activeTab === 'API Keys' && <APIKeysTab />}
      </div>
    </div>
  );
}

