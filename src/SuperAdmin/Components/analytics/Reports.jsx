import React from 'react';
import { FaDownload, FaBell } from 'react-icons/fa';

export default function Reports() {
  return (
    <div className="space-y-8 mb-8">
      {/* Custom Report Generator */}
      <div className="bg-white p-6 transition-all duration-300 ease-in-out" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>Custom Report Generator</h3>
          <p className="text-sm" style={{color: '#3B4A66'}}>Generate detailed reports for specific metrics and time periods.</p>
        </div>
        
        <div className="space-y-4">
          {/* Dropdowns Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Report Type Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Report Type</label>
              <select className="w-full px-3 py-2 bg-white border rounded-lg text-sm" style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}>
                <option value="">Select report type</option>
                <option value="revenue">Revenue Analysis</option>
                <option value="usage">Usage Statistics</option>
                <option value="performance">Performance Metrics</option>
                <option value="growth">Growth Analysis</option>
                <option value="comprehensive">Comprehensive Report</option>
              </select>
            </div>

            {/* Time Period Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Time Period</label>
              <select className="w-full px-3 py-2 bg-white border rounded-lg text-sm" style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}>
                <option value="">Select time period</option>
                <option value="last7days">Last 7 days</option>
                <option value="last30days">Last 30 days</option>
                <option value="last90days">Last 90 days</option>
                <option value="last6months">Last 6 months</option>
                <option value="lastyear">Last year</option>
                <option value="custom">Custom range</option>
              </select>
            </div>

            {/* Format Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Format</label>
              <select className="w-full px-3 py-2 bg-white border rounded-lg text-sm" style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}>
                <option value="">Select format</option>
                <option value="pdf">PDF</option>
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-3">
            <button className="flex items-center gap-2 px-6 py-2 text-white font-medium transition-colors" style={{backgroundColor: '#F56D2D', borderRadius: '7px'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#D97706'} onMouseLeave={(e) => e.target.style.backgroundColor = '#F56D2D'}>
              <FaDownload className="text-sm" />
              Generate Report
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-white border font-medium transition-colors" style={{border: '1px solid #E8F0FF', color: '#3B4A66', borderRadius: '7px'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'} onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}>
              <FaBell className="text-sm" />
              Schedule Report
            </button>
          </div>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white p-6 transition-all duration-300 ease-in-out" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>Scheduled Reports</h4>
          <p className="text-sm" style={{color: '#3B4A66'}}>Automated reports sent to stakeholders.</p>
        </div>
        
        <div className="space-y-4">
          {/* Weekly Revenue Summary */}
          <div className="flex justify-between items-center py-2 px-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
            <div>
              <h6 className="text-sm font-semibold mb-1" style={{color: '#3B4A66'}}>Weekly Revenue Summary</h6>
              <p className="text-xs" style={{color: '#6B7280'}}>Every Monday at 9:00 AM</p>
            </div>
            <span className="text-xs font-medium px-2 py-1" style={{border: '1px solid #E8F0FF', borderRadius: '50px'}}>Active</span>
          </div>

          {/* Monthly Growth Report */}
          <div className="flex justify-between items-center py-2 px-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
            <div>
              <h6 className="text-sm font-semibold mb-1" style={{color: '#3B4A66'}}>Monthly Growth Report</h6>
              <p className="text-xs" style={{color: '#6B7280'}}>First day of each month</p>
            </div>
            <span className="text-xs font-medium px-2 py-1 " style={{border: '1px solid #E8F0FF', borderRadius: '50px'}}>Active</span>
          </div>

          {/* Quarterly Business Review */}
          <div className="flex justify-between items-center py-2 px-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
            <div>
              <h6 className="text-sm font-semibold mb-1" style={{color: '#3B4A66'}}>Quarterly Business Review</h6>
              <p className="text-xs" style={{color: '#6B7280'}}>Every 3 months</p>
            </div>
            <span className="text-xs font-medium px-2 py-1" style={{border: '1px solid #E8F0FF', borderRadius: '50px'}}>Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}



