import React, { useState } from 'react';
import { FaDollarSign, FaUsers, FaClock, FaExclamationTriangle, FaChevronUp, FaChevronDown, FaDownload, FaEdit, FaEllipsisV } from 'react-icons/fa';
import { BlueDollarIcon, BlueUserIcon, BlueClockIcon, BlueExclamationTriangleIcon, ActiveIcon, arrowgreenIcon } from '../Components/icons';

export default function Subscriptions() {
  const [showPlanDetails, setShowPlanDetails] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  return (
    <div className="w-full h-full p-6">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-3xl font-bold mb-2" style={{color: '#3B4A66'}}>Subscription & Billing Management</h3>
            <p style={{color: '#3B4A66'}}>Monitor and manage all platform subscriptions</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white transition-colors" style={{border: '1px solid #E8F0FF', borderRadius: '7px', color: '#3B4A66'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'} onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}>
              <FaDownload className="text-sm" />
              Export Report
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-white transition-colors" style={{backgroundColor: '#F56D2D', borderRadius: '7px'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#e55a2b'} onMouseLeave={(e) => e.target.style.backgroundColor = '#F56D2D'}>
              <FaEdit className="text-sm" />
              Edit Plan
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white p-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
            <div className="flex justify-between items-start">
              <div>
                <p  className="text-xs font-medium mb-2" style={{color: '#3B4A66'}}>Total Revenue</p>
                <p className="text-xl font-bold mb-1" style={{color: '#3B4A66'}}>$284,750.00</p>
                <div className="flex items-center gap-1">
                    <arrowgreenIcon className="text-xs" style={{color: '#10B981'}} />
                  <span className="text-xs font-medium" style={{color: '#10B981'}}>+15.2%</span>
                  
                </div>
              </div>
             
                <BlueDollarIcon className="text-lg" />
           
            </div>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-white p-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium mb-2" style={{color: '#3B4A66'}}>Active Subscriptions</p>
                <p className="text-xl font-bold mb-1" style={{color: '#3B4A66'}}>1,432</p>
                <div className="flex items-center gap-1">
                <arrowgreenIcon className="text-xs" style={{color: '#10B981'}} />
                  <span className="text-xs font-medium" style={{color: '#10B981'}}>+12%</span>
                  
                </div>
              </div>
              <BlueUserIcon className="text-lg" />
            </div>
          </div>

          {/* Trial Subscriptions */}
          <div className="bg-white p-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium mb-2" style={{color: '#3B4A66'}}>Trial Subscriptions</p>
                <p className="text-xl font-bold mb-1" style={{color: '#3B4A66'}}>89</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium" style={{color: '#10B981'}}>Active trials</span>
                   <BlueClockIcon className="text-xs" style={{color: '#10B981'}} />
                </div>
              </div>
              <BlueClockIcon className="text-lg" />
            </div>
          </div>

          {/* Churn Rate */}
          <div className="bg-white p-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium mb-2" style={{color: '#3B4A66'}}>Churn Rate</p>
                <p className="text-xl font-bold mb-1" style={{color: '#3B4A66'}}>2.3%</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium" style={{color: '#EF4444'}}>Monthly</span>
                  <FaChevronDown className="text-xs" style={{color: '#EF4444'}} />
                </div>
              </div>
              <BlueExclamationTriangleIcon className="text-lg" />
            </div>
          </div>
        </div>

        {/* Plan and Alerts Section */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Plan Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold" style={{color: '#3B4A66'}}>Plan</h2>
                <p className="text-sm" style={{color: '#3B4A66'}}>Revenue and growth metrics by subscription plan</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Solo Plan */}
              <div className="bg-white p-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">Solo</span>
                    <div>
                      <p className="text-sm" style={{color: '#3B4A66'}}>456 subscribers</p>
                      <p className="text-sm" style={{color: '#3B4A66'}}>$22,800.00 revenue</p>
                      <p className="text-sm" style={{color: '#3B4A66'}}>8.2% growth</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{color: '#3B4A66'}}>$49.00/month</p>
                    <p className="text-sm" style={{color: '#3B4A66'}}>12.5% conversion</p>
                  </div>
                </div>
              </div>

              {/* Team Plan */}
              <div className="bg-white p-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">Team</span>
                    <div>
                      <p className="text-sm" style={{color: '#3B4A66'}}>523 subscribers</p>
                      <p className="text-sm" style={{color: '#3B4A66'}}>$78,450.00 revenue</p>
                      <p className="text-sm" style={{color: '#3B4A66'}}>12.8% growth</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{color: '#3B4A66'}}>$149.00/month</p>
                    <p className="text-sm" style={{color: '#3B4A66'}}>18.4% conversion</p>
                  </div>
                </div>
              </div>

              {/* Professional Plan */}
              <div className="bg-white p-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">Professional</span>
                    <div>
                      <p className="text-sm" style={{color: '#3B4A66'}}>234 subscribers</p>
                      <p className="text-sm" style={{color: '#3B4A66'}}>$70,020.00 revenue</p>
                      <p className="text-sm" style={{color: '#3B4A66'}}>18.5% growth</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{color: '#3B4A66'}}>$299.00/month</p>
                    <p className="text-sm" style={{color: '#3B4A66'}}>24.3% conversion</p>
                  </div>
                </div>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white p-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">Enterprise</span>
                    <div>
                      <p className="text-sm" style={{color: '#3B4A66'}}>34 subscribers</p>
                      <p className="text-sm" style={{color: '#3B4A66'}}>$113,480.00 revenue</p>
                      <p className="text-sm" style={{color: '#3B4A66'}}>25.3% growth</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{color: '#3B4A66'}}>$.00/month</p>
                    <p className="text-sm" style={{color: '#3B4A66'}}>35.9% conversion</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts & Notifications */}
          <div>
            <h2 className="text-lg font-bold mb-4" style={{color: '#3B4A66'}}>Alerts & Notifications</h2>
            
            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="bg-white p-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium" style={{color: '#3B4A66'}}>Email Notifications</p>
                    <p className="text-sm" style={{color: '#3B4A66'}}>Send email when subscription events occur</p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      emailNotifications ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* SMS Alerts */}
              <div className="bg-white p-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium" style={{color: '#3B4A66'}}>SMS Alerts</p>
                    <p className="text-sm" style={{color: '#3B4A66'}}>Optional SMS notifications</p>
                  </div>
                  <button
                    onClick={() => setSmsAlerts(!smsAlerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      smsAlerts ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        smsAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Performance Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2" style={{color: '#3B4A66'}}>Plan Performance</h2>
          <p className="text-sm mb-6" style={{color: '#3B4A66'}}>MRR, churn, and plan distribution</p>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Line Chart */}
            <div className="bg-white p-6" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
              <div className="h-64 flex items-end justify-between px-4 pb-4">
                {/* Simple line chart representation */}
                <div className="flex items-end gap-2 h-full">
                  {[15000, 18000, 19000, 22000, 25000, 19000].map((value, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-8 bg-green-500 rounded-t"
                        style={{ height: `${(value / 28000) * 200}px` }}
                      ></div>
                      <span className="text-xs mt-2" style={{color: '#3B4A66'}}>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white p-6" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
              <div className="h-64 flex items-end justify-between px-4 pb-4">
                {[
                  { label: 'Solo', value: 456, height: 60 },
                  { label: 'Team', value: 523, height: 80 },
                  { label: 'Professional', value: 234, height: 40 },
                  { label: 'Enterprise', value: 34, height: 15 }
                ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-12 bg-blue-500 rounded-t"
                      style={{ height: `${item.height}px` }}
                    ></div>
                    <span className="text-xs mt-2" style={{color: '#3B4A66'}}>{item.label}</span>
                    <span className="text-xs" style={{color: '#3B4A66'}}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold" style={{color: '#3B4A66'}}>Subscriptions</h2>
              <p className="text-sm" style={{color: '#3B4A66'}}>Detailed view of all platform subscriptions</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 mb-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <input 
                  type="text" 
                  placeholder="Search Firm, Tickets or Users.."
                  style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}
                  className="w-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <select className="px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <select className="px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
                <option>All Plans</option>
                <option>Solo</option>
                <option>Team</option>
                <option>Professional</option>
                <option>Enterprise</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white overflow-hidden" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-3 border-b" style={{borderColor: '#E8F0FF'}}>
              <div className="grid grid-cols-7 gap-4 text-sm font-semibold" style={{color: '#3B4A66'}}>
                <div>Firm</div>
                <div>Plan</div>
                <div>Status</div>
                <div>Amount</div>
                <div>Next Billing</div>
                <div>Total Paid</div>
                <div>Actions</div>
              </div>
            </div>

            {/* Table Rows */}
            <div className="divide-y" style={{borderColor: '#E8F0FF'}}>
              {/* Row 1 */}
              <div className="px-6 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-7 gap-4 items-center">
                  <div>
                    <p className="text-sm font-medium" style={{color: '#3B4A66'}}>Johnson & Associates</p>
                    <p className="text-sm" style={{color: '#3B4A66'}}>Michael Johnson</p>
                  </div>
                  <div>
                    <span className="bg-blue-500 text-white px-2 py-1 text-xs font-medium" style={{borderRadius: '7px'}}>Professional</span>
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#3B4A66'}}>$299.00</p>
                    <p className="text-sm" style={{color: '#3B4A66'}}>Monthly</p>
                    <span className="bg-green-500 text-white px-2 py-1 text-xs font-medium mt-1 inline-block" style={{borderRadius: '7px'}}>Active</span>
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#3B4A66'}}>$299.00</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#3B4A66'}}>15-01-2025</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#3B4A66'}}>$2,990.00</p>
                  </div>
                  <div>
                    <button className="w-8 h-8 bg-gray-100 flex items-center justify-center hover:bg-gray-200" style={{borderRadius: '7px'}}>
                      <FaEllipsisV className="text-sm" style={{color: '#3B4A66'}} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="px-6 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-7 gap-4 items-center">
                  <div>
                    <p className="text-sm font-medium" style={{color: '#3B4A66'}}>Metro Tax Services</p>
                    <p className="text-sm" style={{color: '#3B4A66'}}>Michael Johnson</p>
                  </div>
                  <div>
                    <span className="bg-green-500 text-white px-2 py-1 text-xs font-medium" style={{borderRadius: '7px'}}>Team</span>
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#3B4A66'}}>$149.00</p>
                    <p className="text-sm" style={{color: '#3B4A66'}}>Monthly</p>
                    <span className="bg-green-500 text-white px-2 py-1 text-xs font-medium mt-1 inline-block" style={{borderRadius: '7px'}}>Active</span>
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#3B4A66'}}>$149.00</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#3B4A66'}}>12-02-2025</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#3B4A66'}}>$1,490.00</p>
                  </div>
                  <div>
                    <button className="w-8 h-8 bg-gray-100 flex items-center justify-center hover:bg-gray-200" style={{borderRadius: '7px'}}>
                      <FaEllipsisV className="text-sm" style={{color: '#3B4A66'}} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
