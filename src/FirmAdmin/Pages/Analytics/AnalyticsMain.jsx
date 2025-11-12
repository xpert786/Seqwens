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
    'Revenue<br/>Analysis',
    'Client<br/>Analytics',
    'Service<br/>Performance',
    'Staff<br/>Productivity',
    'Compliance<br/>Reporting'
  ];

  const renderTabContent = () => {
    switch(activeTab) {
      case 'Overview':
        return <AnalyticsOverview 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
        />;
        
      case 'Revenue<br/>Analysis':
        return <RevenueAnalysis 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
        />;
        
      case 'Client<br/>Analytics':
        return <ClientAnalytics 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
        />;
        
      case 'Service<br/>Performance':
        return <ServicePerformance 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
        />;
        
      case 'Staff<br/>Productivity':
        return (
          <div>
            {/* Tab Navigation with Filters */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                <div className="flex-1 lg:flex-none">
                  <TabNavigation
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                </div>

                {/* Tab-specific filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:ml-4">
                  <div className="relative w-full sm:w-40">
                    <select className="w-full appearance-none text-[#3B4A66] bg-white border-1 border-[#E8F0FF] rounded-lg px-3 sm:px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                    <select className="w-full appearance-none text-[#3B4A66] bg-white border-1 border-[#E8F0FF] rounded-lg px-3 sm:px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
        
      case 'Compliance<br/>Reporting':
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
              <select className="w-full appearance-none text-[#3B4A66] bg-white border-1 border-[#E8F0FF] rounded-lg px-3 sm:px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Last 6 months</option>
                <option>Last 3 months</option>
                <option>Last year</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Export Report Button */}
            <button className="w-full sm:w-auto bg-white text-[#3B4A66] border-1 border-[#E8F0FF] px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors" style={{borderRadius: '7px'}}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
