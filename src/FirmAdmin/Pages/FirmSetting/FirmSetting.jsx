import React, { useState } from 'react';
import TabNavigation from '../Integrations/TabNavigation';
import GeneralTab from './GeneralTab';
import BrandingTab from './BrandingTab';
import BusinessTab from './BusinessTab';
import ServicesTab from './ServicesTab';
import IntegrationsTab from './IntegrationsTab';
import AdvancedTab from './AdvancedTab';
import SubdomainTab from './SubdomainTab';

export default function FirmSetting() {
  const [activeTab, setActiveTab] = useState('General');

  const tabs = ['General', 'Business', 'Services', 'Integrations', 'Advanced', 'Branding'];
  return (
    <div className="w-full px-6 py-6 bg-[#F6F7FF] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">

        <div>
          <h4 className="text-2xl font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Settings
          </h4>
          <p className="text-sm text-[#7B8AB2] font-[BasisGrotesquePro]">
            Configure your information and preferences
          </p>
        </div>
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
        {activeTab === 'General' && <GeneralTab />}
        {/* {activeTab === 'Branding' && <BrandingTab />} */}
        {activeTab === 'Business' && <BusinessTab />}
        {activeTab === 'Services' && <ServicesTab />}
        {activeTab === 'Integrations' && <IntegrationsTab />}
        {activeTab === 'Advanced' && <AdvancedTab />}
        {activeTab === 'Branding' && <SubdomainTab />}
      </div>
    </div>
  );
}

