import React, { useState } from 'react';
import AnalyticsOverview from './AnalyticsOverview';
import RevenueAnalysis from './RevenueAnalysis';
import ClientAnalytics from './ClientAnalytics';
import ServicePerformance from './ServicePerformance';
import ComplianceReporting from './ComplianceReporting';
import TabNavigation from '../Integrations/TabNavigation';

export default function AnalyticsMain() {
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = [
    'Overview',
    'Revenue Analysis',
    'Client Analytics',
    'Service Performance',
    'Staff Productivity',
    'Compliance Reporting'
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return <AnalyticsOverview
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
        />;

      case 'Revenue Analysis':
        return <RevenueAnalysis
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
        />;

      case 'Client Analytics':
        return <ClientAnalytics
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
        />;

      case 'Service Performance':
        return <ServicePerformance
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
        />;

      case 'Staff Productivity':
        return (
          <div>
            {/* Tab Navigation with Filters */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col 2xl:flex-row 2xl:justify-between 2xl:items-center space-y-4 2xl:space-y-0">
                <div className="w-full 2xl:w-auto 2xl:flex-none">
                  <TabNavigation
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                </div>

                {/* Tab-specific filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full 2xl:w-auto 2xl:ml-4">
                  <div className="relative w-full sm:w-40">
                    <select className="w-full appearance-none text-[#3B4A66] bg-white border-1 border-[#E8F0FF] rounded-lg px-3 sm:px-4 py-2 pr-8 text-sm focus:outline-none">
                      <option>Tax Year 2024</option>
                      <option>Tax Year 2023</option>
                      <option>Tax Year 2022</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div className="relative w-full sm:w-32">
                    <select className="w-full appearance-none text-[#3B4A66] bg-white border-1 border-[#E8F0FF] rounded-lg px-3 sm:px-4 py-2 pr-8 text-sm focus:outline-none">
                      <option>All Office</option>
                      <option>Office A</option>
                      <option>Office B</option>
                      <option>Office C</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Productivity</h3>
              <p className="text-gray-600">Staff productivity content goes here...</p>
            </div>
          </div>
        );

      case 'Compliance Reporting':
        return <ComplianceReporting
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
        />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-2 sm:p-4 lg:p-6">
      <div className="px-4 py-4 mx-auto">
        {/* Fixed Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-6 lg:mb-8 space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h3>
            <p className="text-gray-600 text-sm">Comprehensive insights into your firm's performance</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Date Range Dropdown */}
            <div className="relative w-full sm:w-auto">
              <select className="w-full appearance-none text-[#3B4A66] bg-white border-1 border-[#E8F0FF] rounded-lg px-3 sm:px-4 py-2 pr-10 text-sm focus:outline-none">
                <option>Last 6 months</option>
                <option>Last 3 months</option>
                <option>Last year</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Export Report Button */}
            <button className="w-full sm:w-auto bg-white text-[#3B4A66] border-1 border-[#E8F0FF] px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors" style={{ borderRadius: '7px' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25" stroke="#4B5563" stroke-linecap="round" stroke-linejoin="round" />
              </svg>

              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* Dynamic Content Based on Active Tab */}
        <div className="w-full overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
