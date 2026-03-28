import React from 'react';
import { BlueDollarIcon, BlueUserIcon, TotalFirmsIcon, BlueDownIcon, ArrowgreenIcon, RedDownIcon } from '../icons';

export default function MetricsCards() {
  return (
    <div className="grid grid-cols-4 gap-6 mb-8 transition-all duration-300 ease-in-out">
      {/* Monthly Recurring Revenue */}
      <div className="bg-[var(--sa-bg-card)] dark:bg-gray-800 p-4 transition-all duration-300 ease-in-out dark:border dark:border-gray-700" style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium mb-2 text-[var(--sa-text-primary)] dark:text-gray-200">Monthly Recurring Revenue</p>
            <p className="text-xl font-bold mb-1 text-[var(--sa-text-primary)] dark:text-white">$295,000</p>
            <div className="flex items-center gap-1">
              <ArrowgreenIcon />
              <span className="text-xs font-medium text-green-500">+3.9%</span>
            </div>
          </div>
          <BlueDollarIcon />
        </div>
      </div>

      {/* Active Firms */}
      <div className="bg-[var(--sa-bg-card)] dark:bg-gray-800 p-4 transition-all duration-300 ease-in-out dark:border dark:border-gray-700" style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium mb-2 text-[var(--sa-text-primary)] dark:text-gray-200">Active Firms</p>
            <p className="text-xl font-bold mb-1 text-[var(--sa-text-primary)] dark:text-white">1,260</p>
            <div className="flex items-center gap-1">
              <ArrowgreenIcon />
              <span className="text-xs font-medium text-green-500">+1.2%</span>
            </div>
          </div>
          <TotalFirmsIcon />
        </div>
      </div>

      {/* Total Users */}
      <div className="bg-[var(--sa-bg-card)] dark:bg-gray-800 p-4 transition-all duration-300 ease-in-out dark:border dark:border-gray-700" style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium mb-2 text-[var(--sa-text-primary)] dark:text-gray-200">Total Users</p>
            <p className="text-xl font-bold mb-1 text-[var(--sa-text-primary)] dark:text-white">8,432</p>
            <div className="flex items-center gap-1">
              <ArrowgreenIcon />
              <span className="text-xs font-medium text-green-500">+4.1%</span>
            </div>
          </div>
          <BlueUserIcon />
        </div>
      </div>

      {/* Churn Rate */}
      <div className="bg-[var(--sa-bg-card)] dark:bg-gray-800 p-4 transition-all duration-300 ease-in-out dark:border dark:border-gray-700" style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium mb-2 text-[var(--sa-text-primary)] dark:text-gray-200">Churn Rate</p>
            <p className="text-xl font-bold mb-1 text-[var(--sa-text-primary)] dark:text-white">2.1%</p>
            <div className="flex items-center gap-1">
              <RedDownIcon />
              <span className="text-xs font-medium text-red-500">-0.3%</span>
            </div>
          </div>
          <BlueDownIcon />
        </div>
      </div>
    </div>
  );
}



