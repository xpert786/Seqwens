import React, { useState } from 'react';
import { FaDollarSign, FaUsers, FaClock, FaExclamationTriangle, FaChevronUp, FaChevronDown, FaDownload, FaEdit, FaEllipsisV } from 'react-icons/fa';
import { BlueDollarIcon, BlueUserIcon, BlueClockIcon, BlueExclamationTriangleIcon, ActiveIcon, ArrowgreenIcon, ClockgreenIcon, RedDownIcon, Action3Icon } from '../Components/icons';
import EditSubscriptionPlan from './EditSubscriptionPlan';

export default function Subscriptions() {
  const [showPlanDetails, setShowPlanDetails] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Solo');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipTimeout, setTooltipTimeout] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [barTooltipTimeout, setBarTooltipTimeout] = useState(null);

  // If edit plan is open, show the edit plan screen
  if (showEditPlan) {
    return (
      <EditSubscriptionPlan 
        planType={selectedPlan}
        onClose={() => setShowEditPlan(false)}
      />
    );
  }

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
            <button 
              onClick={() => {
                setSelectedPlan('Solo');
                setShowEditPlan(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-white transition-colors" 
              style={{backgroundColor: '#F56D2D', borderRadius: '7px'}} 
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e55a2b'} 
              onMouseLeave={(e) => e.target.style.backgroundColor = '#F56D2D'}
            >
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
                    <ArrowgreenIcon className="text-xs" style={{color: '#10B981'}} />
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
                <ArrowgreenIcon className="text-xs" style={{color: '#10B981'}} />
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
                <ClockgreenIcon className="text-xs" style={{color: '#10B981'}} />
                  <span className="text-xs font-medium" style={{color: '#10B981'}}>Active trials</span>
                    
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
                      <RedDownIcon className="text-xs" style={{color: '#EF4444'}} />
                  <span className="text-xs font-medium" style={{color: '#EF4444'}}>Monthly</span>
                 
                </div>
              </div>
              <BlueExclamationTriangleIcon className="text-lg" />
            </div>
          </div>
        </div>

        {/* Plan and Alerts Section */}
        <div className="grid gap-8 mb-8" style={{gridTemplateColumns: '60% 35%'}}>
          {/* Plan Section */}
          <div className='bg-white p-3' style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
            <div className="flex justify-between items-center mb-3 ">
              <div>
                <h3 className="text-lg font-bold" style={{color: '#3B4A66'}}>Plan</h3>
                <p className="text-sm" style={{color: '#3B4A66'}}>Revenue and growth metrics by subscription plan</p>
              </div>
            </div>
            
            <div className="space-y-2">
                {/* Solo Plan */}
                <div 
                  className="bg-white p-2 cursor-pointer hover:bg-gray-50 transition-colors" 
                  style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}
                  onClick={() => {
                    setSelectedPlan('Solo');
                    setShowEditPlan(true);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <span className="bg-[#FBBF24] text-white px-3 py-1 rounded-full text-sm font-medium">Solo</span>
                      <div>
                        <p className="text-xs mb-1" style={{color: '#3B4A66', fontWeight: '800'}}>456 subscribers</p>
                         <div className='flex flex-row gap-2'>
                          <p className="text-xs" style={{color: '#3B4A66'}}>$22,800.00 revenue.</p>
                          <p className="text-xs" style={{color: '#3B4A66'}}>8.2% growth</p>
                         </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold mb-1" style={{color: '#3B4A66'}}>$49.00/month</p>
                      <p className="text-xs" style={{color: '#3B4A66'}}>12.5% conversion</p>
                    </div>
                  </div>
                </div>

                {/* Team Plan */}
                <div 
                  className="bg-white p-2 cursor-pointer hover:bg-gray-50 transition-colors" 
                  style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}
                  onClick={() => {
                    setSelectedPlan('Team');
                    setShowEditPlan(true);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">Team</span>
                      <div>
                        <p className="text-xs mb-1" style={{color: '#3B4A66', fontWeight: '800'}}>523 subscribers</p>
                         <div className='flex flex-row gap-2'> 
                          <p className="text-xs" style={{color: '#3B4A66'}}>$78,450.00 revenue.</p>
                           <p className="text-xs" style={{color: '#3B4A66'}}>12.8% growth</p>
                          </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold mb-1" style={{color: '#3B4A66'}}>$149.00/month</p>
                      <p className="text-xs" style={{color: '#3B4A66'}}>18.4% conversion</p>
                    </div>
                  </div>
                </div>

                {/* Professional Plan */}
                <div 
                  className="bg-white p-2 cursor-pointer hover:bg-gray-50 transition-colors" 
                  style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}
                  onClick={() => {
                    setSelectedPlan('Professional');
                    setShowEditPlan(true);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <span className="bg-[#1E40AF] text-white px-3 py-1 rounded-full text-sm font-medium">Professional</span>
                      <div>
                        <p className="text-xs mb-1" style={{color: '#3B4A66', fontWeight: '800'}}>234 subscribers</p>
                         <div className='flex flex-row gap-2'>
                          <p className="text-xs" style={{color: '#3B4A66'}}>$70,020.00 revenue.</p>
                          <p className="text-xs" style={{color: '#3B4A66'}}>18.5% growth</p>
                          </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold mb-1" style={{color: '#3B4A66'}}>$299.00/month</p>
                      <p className="text-xs" style={{color: '#3B4A66'}}>24.3% conversion</p>
                    </div>
                  </div>
                </div>

                {/* Enterprise Plan */}
                <div 
                  className="bg-white p-2 cursor-pointer hover:bg-gray-50 transition-colors" 
                  style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}
                  onClick={() => {
                    setSelectedPlan('Enterprise');
                    setShowEditPlan(true);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <span className="bg-[#CEC6FF] text-white px-3 py-1 rounded-full text-sm font-medium">Enterprise</span>
                      <div>
                        <p className="text-xs mb-1" style={{color: '#3B4A66', fontWeight: '800'}}>34 subscribers</p>
                         <div className='flex flex-row gap-2'> 
                          <p className="text-xs" style={{color: '#3B4A66'}}>$113,480.00 revenue.</p>
                          <p className="text-xs" style={{color: '#3B4A66'}}>25.3% growth</p>
                          </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold mb-1" style={{color: '#3B4A66'}}>$.00/month</p>
                      <p className="text-xs" style={{color: '#3B4A66'}}>35.9% conversion</p>
                    </div>
                  </div>
                </div>
            </div>
          </div>

            {/* Alerts & Notifications */}
            <div className='bg-white p-3' style={{border: '1px solid #E8F0FF', borderRadius: '7px', height: 'fit-content'}}>
              <h3 className="text-lg font-bold mb-4" style={{color: '#3B4A66'}}>Alerts & Notifications</h3>
              
              <div className="space-y-4">
              {/* Email Notifications */}
              <div className="bg-white p-4">
                <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium" style={{color: '#3B4A66'}}>Email Notifications</p>
                      <p className="text-xs" style={{color: '#3B4A66'}}>Send email when  <br /> subscription events occur</p>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className="relative inline-flex h-6 w-11 items-center transition-colors"
                      style={{ 
                        borderRadius: '20px',
                        backgroundColor: emailNotifications ? '#F56D2D' : '#D1D5DB'
                      }}
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                        style={{
                          transform: emailNotifications ? 'translateX(24px)' : 'translateX(4px)'
                        }}
                      />
                    </button>
                </div>
              </div>

              {/* SMS Alerts */}
              <div className="bg-white p-4" >
                <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium" style={{color: '#3B4A66'}}>SMS Alerts</p>
                      <p className="text-xs" style={{color: '#3B4A66'}}>Optional SMS notifications</p>
                    </div>
                    <button
                      onClick={() => setSmsAlerts(!smsAlerts)}
                      className="relative inline-flex h-6 w-11 items-center transition-colors"
                      style={{ 
                        borderRadius: '20px',
                        backgroundColor: smsAlerts ? '#F56D2D' : '#D1D5DB'
                      }}
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                        style={{
                          transform: smsAlerts ? 'translateX(24px)' : 'translateX(4px)'
                        }}
                      />
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Performance Section */}
        <div className="mb-8 bg-white p-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
          <h3 className="text-xl font-bold mb-2" style={{color: '#3B4A66'}}>Plan Performance</h3>
          <p className="text-xs mb-6" style={{color: '#3B4A66'}}>MRR, churn, and plan distribution</p>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Line Chart */}
            <div className="bg-white p-6" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
              <div className="h-64 relative">
                {/* Grid lines */}
                <div className="absolute inset-0 ml-8">
                  {/* Horizontal grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div 
                      key={i}
                      className="absolute w-full border-t border-dashed opacity-30"
                      style={{ 
                        top: `${i * 25}%`, 
                        borderColor: '#E5E7EB',
                        height: '1px'
                      }}
                    />
                  ))}
                  {/* Vertical grid lines */}
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i}
                      className="absolute h-full border-l border-dashed opacity-30"
                      style={{ 
                        left: `${(i * 100) / 5}%`, 
                        borderColor: '#E5E7EB',
                        width: '1px'
                      }}
                    />
                  ))}
                </div>

                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs" style={{color: '#3B4A66'}}>
                  <span>28000</span>
                  <span>21000</span>
                  <span>14000</span>
                  <span>7000</span>
                  <span>0</span>
                </div>
                
                {/* Chart area */}
                <div className="ml-8 h-full flex items-end justify-between px-4 pb-4 relative">
                  {/* Chart lines and points */}
                  <svg className="absolute inset-0 w-full h-full" style={{zIndex: 10}}>
                    {/* Green line - connecting all points */}
                    <path
                      d={`M 16,${200 - (15500 / 28000) * 200} L 96,${200 - (19000 / 28000) * 200} L 176,${200 - (19000 / 28000) * 200} L 256,${200 - (19500 / 28000) * 200} L 336,${200 - (22000 / 28000) * 200} L 416,${200 - (17000 / 28000) * 200}`}
                      fill="none"
                      stroke="#4CAF50"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Orange line - connecting all points */}
                    <path
                      d={`M 16,${200 - (7000 / 28000) * 200} L 96,${200 - (8500 / 28000) * 200} L 176,${200 - (10000 / 28000) * 200} L 256,${200 - (11500 / 28000) * 200} L 336,${200 - (13000 / 28000) * 200} L 416,${200 - (13800 / 28000) * 200}`}
                      fill="none"
                      stroke="#FF7043"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                  {/* Green line data points */}
                    {[15500, 19000, 19000, 19500, 22000, 17000].map((value, index) => (
                      <g key={`green-${index}`}>
                        {/* Invisible larger hover area */}
                        <circle
                          cx={index * 80 + 16}
                          cy={200 - (value / 28000) * 200}
                          r="12"
                          fill="transparent"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={() => {
                            if (tooltipTimeout) clearTimeout(tooltipTimeout);
                            setHoveredPoint({ 
                              type: 'green', 
                              index, 
                              value, 
                              month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index],
                              x: index * 80 + 16,
                              y: 200 - (value / 28000) * 200
                            });
                          }}
                          onMouseLeave={() => {
                            const timeout = setTimeout(() => setHoveredPoint(null), 100);
                            setTooltipTimeout(timeout);
                          }}
                        />
                        {/* Visible dot */}
                        <circle
                          cx={index * 80 + 16}
                          cy={200 - (value / 28000) * 200}
                          r="4"
                          fill="white"
                          stroke="#4CAF50"
                          strokeWidth="2"
                        />
                      </g>
                    ))}
                    
                    {/* Orange line data points */}
                    {[7000, 8500, 10000, 11500, 13000, 13800].map((value, index) => (
                      <g key={`orange-${index}`}>
                        {/* Invisible larger hover area */}
                        <circle
                          cx={index * 80 + 16}
                          cy={200 - (value / 28000) * 200}
                          r="12"
                          fill="transparent"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={() => {
                            if (tooltipTimeout) clearTimeout(tooltipTimeout);
                            setHoveredPoint({ 
                              type: 'orange', 
                              index, 
                              value, 
                              month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index],
                              x: index * 80 + 16,
                              y: 200 - (value / 28000) * 200
                            });
                          }}
                          onMouseLeave={() => {
                            const timeout = setTimeout(() => setHoveredPoint(null), 100);
                            setTooltipTimeout(timeout);
                          }}
                        />
                        {/* Visible dot */}
                        <circle
                          cx={index * 80 + 16}
                          cy={200 - (value / 28000) * 200}
                          r="4"
                          fill="white"
                          stroke="#FF7043"
                          strokeWidth="2"
                        />
                      </g>
                    ))}
                  </svg>

                  {/* X-axis labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => (
                      <span key={index} className="text-xs" style={{color: '#3B4A66'}}>{month}</span>
                    ))}
                  </div>

                  {/* Dynamic Tooltip - shows on hover */}
                  {hoveredPoint && (
                    <div 
                      className="absolute" 
                      style={{
                        left: `${hoveredPoint.x}px`,
                        top: `${hoveredPoint.y - 50}px`,
                        zIndex: 20,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div className="bg-white rounded-lg shadow-lg p-3 border" style={{minWidth: '120px'}}>
                        <div className="text-sm font-medium" style={{color: '#374151'}}>{hoveredPoint.month}</div>
                        <div 
                          className="text-sm" 
                          style={{color: hoveredPoint.type === 'green' ? '#4CAF50' : '#FF7043'}}
                        >
                          Value: {hoveredPoint.value.toLocaleString()}
                        </div>
                      </div>
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white mx-auto"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white p-6" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
              <div className="h-64 relative">
                {/* Grid lines */}
                <div className="absolute inset-0 ml-8">
                  {/* Horizontal grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div 
                      key={i}
                      className="absolute w-full border-t border-dashed opacity-30"
                      style={{ 
                        top: `${i * 25}%`, 
                        borderColor: '#E5E7EB',
                        height: '1px'
                      }}
                    />
                  ))}
                </div>

                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs" style={{color: '#3B4A66'}}>
                  <span>600</span>
                  <span>450</span>
                  <span>300</span>
                  <span>150</span>
                  <span>0</span>
                </div>
                
                {/* Chart area */}
                <div className="ml-8 h-full flex items-end justify-between px-4 pb-4 relative">
                  {[
                    { label: 'Solo', value: 440, height: (440/600) * 200 },
                    { label: 'Team', value: 450, height: (450/600) * 200 },
                    { label: 'Professional', value: 240, height: (240/600) * 200 },
                    { label: 'Enterprise', value: 35, height: (35/600) * 200 }
                  ].map((item, index) => (
                    <div key={index} className="flex flex-col items-center relative">
                      {/* Invisible larger hover area */}
                      <div 
                        className="absolute inset-0 cursor-pointer"
                        style={{ 
                          width: '60px', // Wider hover area
                          height: `${item.height + 20}px`, // Taller hover area
                          zIndex: 10,
                          transform: 'translateX(-50%)'
                        }}
                        onMouseEnter={() => {
                          if (barTooltipTimeout) clearTimeout(barTooltipTimeout);
                          setHoveredBar({ 
                            label: item.label,
                            value: item.value,
                            x: index * 80 + 40, // Center of the bar area
                            y: 200 - item.height - 20 // Above the bar
                          });
                        }}
                        onMouseLeave={() => {
                          const timeout = setTimeout(() => setHoveredBar(null), 100);
                          setBarTooltipTimeout(timeout);
                        }}
                      />
                      {/* Visible bar */}
                      <div 
                        className="w-12 rounded-t transition-opacity"
                        style={{ 
                          height: `${item.height}px`,
                          backgroundColor: '#4285F4',
                          opacity: hoveredBar?.label === item.label ? 0.8 : 1
                        }}
                      ></div>
                      <span className="text-xs mt-2" style={{color: '#3B4A66'}}>{item.label}</span>
                    </div>
                  ))}

                  {/* Dynamic Bar Tooltip */}
                  {hoveredBar && (
                    <div 
                      className="absolute" 
                      style={{
                        left: `${hoveredBar.x}px`,
                        top: `${hoveredBar.y}px`,
                        zIndex: 20,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div className="bg-white rounded-lg shadow-lg p-3 border" style={{minWidth: '100px'}}>
                        <div className="text-sm font-medium" style={{color: '#374151'}}>{hoveredBar.label}</div>
                        <div className="text-sm" style={{color: '#4285F4'}}>Firms: {hoveredBar.value}</div>
                      </div>
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white mx-auto"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div>
          {/* Filter Bar */}
          <div className='mb-4'>
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-md">
                <input 
                  type="text" 
                  placeholder="Search Firm, Tickets or Users.."
                  style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}
                  className="w-[400px] pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <select className="px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <select className="px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
                <option>All Plans</option>
                <option>Solo</option>
                <option>Team</option>
                <option>Professional</option>
                <option>Enterprise</option>
              </select>
            </div>
          </div>
            <div className="bg-white p-4" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold" style={{color: '#3B4A66'}}>Subscriptions</h3>
              <p className="text-sm" style={{color: '#3B4A66'}}>Detailed view of all platform subscriptions</p>
            </div>
          </div>

            {/* Table Header */}
            <div className=" px-6 py-3 mb-2">
              <div className="grid grid-cols-7 gap-4 text-sm font-medium" style={{color: '#3B4A66'}}>
                <div>Firm</div>
                <div>Plan</div>
                <div>Status</div>
                <div>Amount</div>
                <div>Next Billing</div>
                <div>Total Paid</div>
                <div>Actions</div>
              </div>
            </div>

            {/* Table */}
            <div className="space-y-4">
              {/* Row 1 */}
              <div className="bg-white p-4" style={{border: '1px solid #E0E0E0', borderRadius: '8px'}}>
                <div className="grid grid-cols-7 gap-4 items-center">
                  <div>
                    <p className="text-sm font-semibold" style={{color: '#3B4A66'}}>Johnson & Associates</p>
                    <p className="text-xs" style={{color: '#6C757D'}}>Michael Johnson</p>
                  </div>
                  <div>
                    <span className="bg-[#1E40AF] text-white px-3 py-1 text-xs font-medium" style={{borderRadius: '12px'}}>Professional</span>
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#3B4A66',   fontWeight: '600'}}>$299.00</p>
                    <p className="text-xs" style={{color: '#6C757D', fontWeight: '600'  }}>Monthly</p>
                  </div>
                  <div>
                    <span className="bg-green-500 text-white px-3 py-1 text-xs font-medium" style={{borderRadius: '12px'}}>Active</span>
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#3B4A66'}}>15-01-2025</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#3B4A66'}}>$2,990.00</p>
                  </div>
                  <div>
                    <Action3Icon className="text-sm" style={{color: '#3B4A66'}} />  
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="bg-white p-4" style={{border: '1px solid #E0E0E0', borderRadius: '8px'}}>
                <div className="grid grid-cols-7 gap-4 items-center">
                  <div>
                    <p className="text-sm font-semibold" style={{color: '#3B4A66'}}>Metro Tax Services</p>
                    <p className="text-xs" style={{color: '#6C757D'}}>Michael Johnson</p>
                  </div>
                  <div>
                    <span className="bg-green-500 text-white px-3 py-1 text-xs font-medium" style={{borderRadius: '12px'}}>Team</span>
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#3B4A66', fontWeight: '600'}}>$149.00</p>
                    <p className="text-xs" style={{color: '#6C757D', fontWeight: '600'  }}>Monthly</p>
                  </div>
                  <div>
                    <span className="bg-green-500 text-white px-3 py-1 text-xs font-medium" style={{borderRadius: '12px'}}>Active</span>
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#3B4A66'}}>12-02-2025</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#3B4A66'}}>$1,490.00</p>
                  </div>
                  <div>
                    <Action3Icon className="text-sm" style={{color: '#3B4A66'}} />  
                  </div>
                </div>
              </div>
            </div>
        </div>
        </div>
    </div>
  );
}
