import React, { useState } from 'react';
import '../style/Analytics.css';
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
      <div className="flex justify-between items-start mb-8 analytics-header">
        <div>
          <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--sa-text-primary)' }}>Platform Analytics & Reporting</h3>
          <p style={{ color: 'var(--sa-text-primary)' }}>Comprehensive insights into platform performance and growth</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-8 bg-[var(--sa-bg-secondary)] p-1.5 w-fit transition-all duration-300 ease-in-out analytics-tabs" style={{ border: '1px solid var(--sa-border-color)', borderRadius: '10px' }}>
        {['Overview', 'Revenue', 'Firm Performance', 'Usage & Performance', 'Reports'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-1.5 text-xs font-semibold transition-all duration-300 ease-in-out analytics-tab-btn ${selectedTab === tab
              ? 'transform scale-105 shadow-md'
              : 'hover:bg-[var(--sa-bg-active)] hover:transform hover:scale-102'
              }`}
            style={{
              backgroundColor: selectedTab === tab ? '#f56d2d' : 'transparent',
              color: selectedTab === tab ? 'white' : 'var(--sa-text-primary)',
              borderRadius: '8px',
              border: 'none'
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
