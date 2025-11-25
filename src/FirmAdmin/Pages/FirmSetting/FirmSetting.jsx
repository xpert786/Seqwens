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

  const tabs = ['General', 'Branding', 'Business', 'Services', 'Integrations', 'Advanced', 'Subdomain'];

  return (
    <div className="w-full px-6 py-6 bg-[#F6F7FF] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="text-2xl font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Firm Settings
          </h4>
          <p className="text-sm text-[#7B8AB2] font-[BasisGrotesquePro]">
            Configure your firm's information and preferences
          </p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] !rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro] flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.4 2.25C11.7957 2.25564 12.1731 2.41738 12.45 2.7L15.3 5.55C15.5826 5.82695 15.7444 6.20435 15.75 6.6V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V3.75C2.25 3.35218 2.40804 2.97064 2.68934 2.68934C2.97064 2.40804 3.35218 2.25 3.75 2.25H11.4Z" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M12.75 15.75V10.5C12.75 10.3011 12.671 10.1103 12.5303 9.96967C12.3897 9.82902 12.1989 9.75 12 9.75H6C5.80109 9.75 5.61032 9.82902 5.46967 9.96967C5.32902 10.1103 5.25 10.3011 5.25 10.5V15.75" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M5.25 2.25V5.25C5.25 5.44891 5.32902 5.63968 5.46967 5.78033C5.61032 5.92098 5.80109 6 6 6H11.25" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
          </svg>

          Save All Changes
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
        {activeTab === 'General' && <GeneralTab />}
        {activeTab === 'Branding' && <BrandingTab />}
        {activeTab === 'Business' && <BusinessTab />}
        {activeTab === 'Services' && <ServicesTab />}
        {activeTab === 'Integrations' && <IntegrationsTab />}
        {activeTab === 'Advanced' && <AdvancedTab />}
        {activeTab === 'Subdomain' && <SubdomainTab />}
      </div>
    </div>
  );
}

