import React, { useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import MetricsCards from '../Components/analytics/MetricsCards';
import Overview from '../Components/analytics/Overview';
import Revenue from '../Components/analytics/Revenue';
import FirmPerformance from '../Components/analytics/FirmPerformance';
import UsagePerformance from '../Components/analytics/UsagePerformance';
import Reports from '../Components/analytics/Reports';

export default function Analytics() {
  const [selectedTab, setSelectedTab] = useState('Overview');

  return (
    <div className="w-full p-6 space-y-6 pb-32 min-h-screen">
      {/* Header Section and Top Actions */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-2xl font-bold mb-2" style={{color: '#3B4A66'}}>Platform Analytics & Reporting</h3>
          <p style={{color: '#3B4A66'}}>Comprehensive insights into platform performance and growth</p>
        </div>
        <div className="flex items-center gap-4">
          <select className="px-4 py-2 bg-white" style={{border: '1px solid #E8F0FF', borderRadius: '7px', color: '#3B4A66'}}>
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-white transition-colors" style={{border: '1px solid #E8F0FF', borderRadius: '7px', color: '#3B4A66'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'} onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}>
            <FaDownload className="text-sm" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Cards - Only show on Overview tab */}
      {selectedTab === 'Overview' && <MetricsCards />}

      {/* Navigation Tabs */}
      <div className="flex gap-1 mb-8 bg-white p-2 w-fit transition-all duration-300 ease-in-out" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        {['Overview', 'Revenue', 'Firm Performance', 'Usage & Performance', 'Reports'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-2 py-1 text-xs font-medium transition-all duration-300 ease-in-out ${
              selectedTab === tab
                ? 'text-white transform scale-105'
                : 'hover:bg-gray-100 hover:transform hover:scale-102'
            }`}
            style={{
              backgroundColor: selectedTab === tab ? '#3B4A66' : 'white',
              color: selectedTab === tab ? 'white' : '#3B4A66',
              borderRadius: '7px',
              
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Revenue Section - Only show when Revenue tab is selected */}
      {selectedTab === 'Revenue' && <Revenue />}

      {/* Firm Performance Section - Only show when Firm Performance tab is selected */}
      {selectedTab === 'Firm Performance' && <FirmPerformance />}

      {/* Other tabs content - Overview, Usage & Performance, Reports */}
      {selectedTab === 'Overview' && <Overview />}
      {selectedTab === 'Usage & Performance' && <UsagePerformance />}
      {selectedTab === 'Reports' && <Reports />}
    </div>
  );
}
