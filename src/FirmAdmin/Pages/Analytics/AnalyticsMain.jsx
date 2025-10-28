import React, { useState } from 'react';
import AnalyticsOverview from './AnalyticsOverview';
import RevenueAnalysis from './RevenueAnalysis';
import TabNavigation from '../../Components/TabNavigation';

export default function AnalyticsMain() {
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = [
    'Overview',
    'Revenue Analysis',
    'Client Analytics',
    'Service Performance',
    'Staff Productivity',
    'Compliance Reporting',
    'Data Sharing'
  ];

  const renderTabContent = () => {
    switch(activeTab) {
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
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Analytics</h3>
            <p className="text-gray-600">Client analytics content goes here...</p>
          </div>
        );
        
      case 'Service Performance':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Performance</h3>
            <p className="text-gray-600">Service performance content goes here...</p>
          </div>
        );
        
      case 'Staff Productivity':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Productivity</h3>
            <p className="text-gray-600">Staff productivity content goes here...</p>
          </div>
        );
        
      case 'Compliance Reporting':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Reporting</h3>
            <p className="text-gray-600">Compliance reporting content goes here...</p>
          </div>
        );
        
      case 'Data Sharing':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sharing</h3>
            <p className="text-gray-600">Data sharing content goes here...</p>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Fixed Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h3>
            <p className="text-gray-600 text-sm">Comprehensive insights into your firm's performance</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Date Range Dropdown */}
            <div className="relative">
              <select className="appearance-none text-[#3B4A66] bg-white border-1 border-[#E8F0FF] rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
            <button className="bg-white text-[#3B4A66] border-1 border-[#E8F0FF] px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors" style={{borderRadius: '7px'}}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export Report</span>
            </button>
          </div>
        </div>


        {/* Dynamic Content Based on Active Tab */}
        {renderTabContent()}
      </div>
    </div>
  );
}
