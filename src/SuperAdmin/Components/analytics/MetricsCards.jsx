import React from 'react';
import { BlueDollarIcon, BlueUserIcon, TotalFirmsIcon, BlueDownIcon, ArrowgreenIcon, RedDownIcon } from '../icons';

export default function MetricsCards() {
  return (
    <div className="grid grid-cols-4 gap-6 mb-8 transition-all duration-300 ease-in-out">
      Monthly Recurring Revenue
      <div className="bg-white p-4 transition-all duration-300 ease-in-out" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: '#3B4A66' }}>Monthly Recurring Revenue</p>
            <p className="text-xl font-bold mb-1" style={{ color: '#3B4A66' }}>$295,000</p>
            <div className="flex items-center gap-1">
              <ArrowgreenIcon />
              <span className="text-xs font-medium" style={{ color: '#10B981' }}>+3.9%</span>
            </div>
          </div>
          <BlueDollarIcon />
        </div>
      </div>

      {/* Active Firms */}
      <div className="bg-white p-4 transition-all duration-300 ease-in-out" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: '#3B4A66' }}>Active Firms</p>
            <p className="text-xl font-bold mb-1" style={{ color: '#3B4A66' }}>1,260</p>
            <div className="flex items-center gap-1">
              <ArrowgreenIcon />
              <span className="text-xs font-medium" style={{ color: '#10B981' }}>+1.2%</span>
            </div>
          </div>
          <TotalFirmsIcon />
        </div>
      </div>

      {/* Total Users */}
      <div className="bg-white p-4 transition-all duration-300 ease-in-out" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: '#3B4A66' }}>Total Users</p>
            <p className="text-xl font-bold mb-1" style={{ color: '#3B4A66' }}>8,432</p>
            <div className="flex items-center gap-1">
              <ArrowgreenIcon />
              <span className="text-xs font-medium" style={{ color: '#10B981' }}>+4.1%</span>
            </div>
          </div>
          <BlueUserIcon />
        </div>
      </div>

      {/* Churn Rate */}
      <div className="bg-white p-4 transition-all duration-300 ease-in-out" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: '#3B4A66' }}>Churn Rate</p>
            <p className="text-xl font-bold mb-1" style={{ color: '#3B4A66' }}>2.1%</p>
            <div className="flex items-center gap-1">
              <RedDownIcon />
              <span className="text-xs font-medium" style={{ color: '#EF4444' }}>-0.3%</span>
            </div>
          </div>
          <BlueDownIcon />
        </div>
      </div>
    </div>
  );
}



