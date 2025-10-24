import React from 'react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

import { RefreshIcon, UserManage, SubscriptionIcon, MesIcon, SystemSettingsIcon, HelpsIcon, TotalFirmsIcon, ActiveUsersIcon, MonthlyRevenueIcon, SystemHealthIcon, SecurityGreenIcon, SecurityBlueIcon, SecurityYellowIcon, DashIcon   } from '../Components/icons';
// Mock data for charts
const revenueData = [
  { month: 'Jan', revenue: 180000, users: 6500 },
  { month: 'Feb', revenue: 200000, users: 7200 },
  { month: 'Mar', revenue: 220000, users: 7800 },
  { month: 'Apr', revenue: 240000, users: 8200 },
  { month: 'May', revenue: 265000, users: 8500 },
  { month: 'Jun', revenue: 290000, users: 8432 }
];

const subscriptionData = [
  { name: 'Solo', value: 650, color: '#10B981' },
  { name: 'Solo', value: 456, color: '#3B82F6' },
  { name: 'Team', value: 270, color: '#F59E0B' },
  { name: 'Team', value: 90, color: '#06B6D4' }
];

const activityData = [
  { time: '00:00', users: 1400 },
  { time: '04:00', users: 800 },
  { time: '08:00', users: 3200 },
  { time: '12:00', users: 4800 },
  { time: '16:00', users: 5200 },
  { time: '20:00', users: 3800 }
];

const performanceData = [
  { metric: 'API Response', current: 24, target: 300, unit: 'ms' },
  { metric: 'Database Query', current: 88, target: 100, unit: 'ms' },
  { metric: 'Page Load', current: 1.2, target: 3, unit: 's' },
  { metric: 'Error Rate', current: 0.01, target: 0.01, unit: '%' }
];

const recentFirms = [
  {
    name: 'Johnson & Associates',
    users: 18,
    cost: 2999,
    lastActive: '2 hours ago',
    plan: 'Professional',
    planColor: 'bg-blue-100 text-blue-800'
  },
  {
    name: 'Metro Tax Services',
    users: 8,
    cost: 1499,
    lastActive: '1 day ago',
    plan: 'Team',
    planColor: 'bg-orange-100 text-orange-800'
  },
  {
    name: 'Elite CPA Group',
    users: 45,
    cost: 0,
    lastActive: '3 hours ago',
    plan: 'Enterprise',
    planColor: 'bg-green-100 text-green-800'
  },
  {
    name: 'Coastal Accounting',
    users: 1,
    cost: 499,
    lastActive: '5 hours ago',
    plan: 'Solo',
    planColor: 'bg-blue-100 text-blue-800'
  }
];

const securityStatus = [
  { name: 'SSL Certificates', status: 'Valid', color: 'green' },
  { name: 'Firewall', status: 'Active', color: 'green' },
  { name: 'Backup', status: 'Scheduled', color: 'yellow' },
  { name: 'Updates', status: 'Optimized', color: 'blue' }
];

const quickActions = [
  { name: 'User Management', icon: <UserManage /> },
  { name: 'Subscriptions', icon: <SubscriptionIcon /> },
  { name: 'Analytics', icon: <MesIcon /> },
  { name: 'System Settings', icon: <SystemSettingsIcon /> },
  { name: 'Support Center', icon: <HelpsIcon /> }
];

export default function SuperDashboardContent() {
  // Custom tooltip for area chart
  const RevenueTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-xl p-3 border" style={{minWidth: '140px'}}>
          <div className="text-sm font-semibold mb-1" style={{color: '#374151'}}>{label}</div>
          <div className="text-sm" style={{color: '#374151'}}>
            Revenue: {payload[0].value.toLocaleString()}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const SubscriptionTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white rounded-lg shadow-xl p-3 border" style={{minWidth: '140px'}}>
          <div className="text-sm font-semibold mb-1" style={{color: data.payload.color}}>{data.name}</div>
          <div className="text-lg font-bold" style={{color: data.payload.color}}>
            {data.value}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for activity chart
  const ActivityTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-xl p-3 border" style={{minWidth: '140px'}}>
          <div className="text-sm font-semibold mb-1" style={{color: '#374151'}}>{label}</div>
          <div className="text-sm" style={{color: '#374151'}}>
            Active : <span style={{color: '#10B981'}}>{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full px-3 py-4 bg-[#F6F7FF] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-gray-600 mt-1">Monitor and manage the entire tax practice platform</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3   text-black bg-white  rounded-3xl  transition-colors" style={{borderRadius: '7px'}}>
            <RefreshIcon className="w-4 h-4" />  
          Refresh Status
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-8">
        <div className="bg-white h-auto rounded-xl border border-[#E8F0FF] p-7 relative">
          <div className="absolute top-4 right-4">
            <TotalFirmsIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Firms</p>
            <p className="text-2xl font-bold text-gray-900">1,247</p>
            <div className="flex items-center mt-2">
              <span className="text-sm text-[#10B981] font-medium">+19%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E8F0FF] p-6 relative">
          <div className="absolute top-4 right-4">
            <ActiveUsersIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
            <p className="text-2xl font-bold text-gray-900">8,432</p>
            <div className="flex items-center mt-2">
              <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-600 font-medium">+8%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E8F0FF] p-6 relative">
          <div className="absolute top-4 right-4">
            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.25 2V22M17.25 5H9.75C8.82174 5 7.9315 5.36875 7.27513 6.02513C6.61875 6.6815 6.25 7.57174 6.25 8.5C6.25 9.42826 6.61875 10.3185 7.27513 10.9749C7.9315 11.6313 8.82174 12 9.75 12H14.75C15.6783 12 16.5685 12.3687 17.2249 13.0251C17.8813 13.6815 18.25 14.5717 18.25 15.5C18.25 16.4283 17.8813 17.3185 17.2249 17.9749C16.5685 18.6313 15.6783 19 14.75 19H6.25" stroke="#3AD6F2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Monthly Revenue</p>
            <p className="text-2xl font-bold text-gray-900">$284,750</p>
            <div className="flex items-center mt-2">
              <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-600 font-medium">+15%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E8F0FF] p-6 relative">
          <div className="absolute top-4 right-4">
            <SystemHealthIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">System Health</p>
            <p className="text-2xl font-bold text-gray-900">99.9%</p>
            <p className="text-sm text-gray-500 mt-1">Uptime</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-8">
        {/* Revenue Growth Trend */}
        <div className="bg-white rounded-xl border border-[#E8F0FF] p-6">
          <h3 className="text-base font-medium text-gray-900 mb-1">Revenue Growth Trend</h3>
          <p className="text-sm text-gray-600 mb-4">Monthly recurring revenue and user growth</p>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                  domain={[0, 300000]}
                  ticks={[0, 75000, 150000, 225000, 300000]}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  dot={{ fill: 'white', stroke: '#10B981', strokeWidth: 3, r: 5 }}
                  activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2, fill: 'white' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Revenue Growth</span>
            </div>
          </div>
        </div>

        {/* Subscription Distribution */}
        <div className="bg-white rounded-xl border border-[#E8F0FF] p-6">
          <h3 className="text-base font-medium text-gray-900 mb-1">Subscription Distribution</h3>
          <p className="text-sm text-gray-600 mb-4">Revenue breakdown by plan type</p>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<SubscriptionTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {subscriptionData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{backgroundColor: item.color}}></div>
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Real-Time Activity */}
          <div className="bg-white rounded-xl border border-[#E8F0FF] p-6 h-100 flex flex-col">
            <h4 className="text-base font-semibold text-gray-900 mb-1">Real-Time Activity</h4>
            <p className="text-sm text-gray-600 mb-4">Active users throughout the day</p>
            
            <div className="flex-1 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activityData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                    domain={[0, 6000]}
                    ticks={[0, 1500, 3000, 4500, 6000]}
                  />
                  <Tooltip content={<ActivityTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: 'white', stroke: '#10B981', strokeWidth: 3, r: 5 }}
                    activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2, fill: 'white' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Active Users</span>
              </div>
            </div>
          </div>

        </div>

        {/* Middle Column */}
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="bg-white rounded-xl  border border-[#E8F0FF] p-6 h-100 flex flex-col">
            <h4 className="text-base font-semibold text-gray-900 mb-1">Performance Metrics</h4>
            <p className="text-sm text-gray-600 mb-4">System performance indicators</p>
            <div className="flex-1 space-y-4">
              {performanceData.map((metric, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{metric.metric}</span>
                    <span className="text-sm text-gray-600">{metric.current}{metric.unit} / {metric.target}{metric.unit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${Math.min((metric.current / metric.target) * 100, 100)}%`,
                          backgroundColor: '#3B4A66'
                        }}
                      ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          {/* Security Status */}
          <div className="bg-white rounded-xl  border border-[#E8F0FF] p-6 h-100 flex flex-col">
            <h4 className="text-base font-semibold text-gray-900 mb-1">Security Status</h4>
            <p className="text-sm text-gray-600 mb-4">Platform security overview</p>
            <div className="flex-1 space-y-3">
              {securityStatus.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    item.color === 'green' ? 'bg-green-50 ' :
                    item.color === 'yellow' ? 'bg-yellow-50 ' :
                    item.color === 'blue' ? 'bg-blue-50 ' :
                    'bg-red-50 '
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.color === 'green' ? (
                      <SecurityGreenIcon className="w-5 h-5" />
                    ) : item.color === 'yellow' ? (
                      <SecurityYellowIcon className="w-5 h-5" />
                    ) : item.color === 'blue' ? (
                      <SecurityBlueIcon className="w-5 h-5"  />
                    ) : (
                      <SecurityGreenIcon className="w-5 h-5" />
                    )}
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    item.color === 'green' ? 'bg-green-500 text-white' :
                    item.color === 'yellow' ? 'bg-yellow-500 text-white border border-yellow-600' :
                    item.color === 'blue' ? 'bg-blue-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Recent Firms and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-6">
        {/* Recent Firm Registrations */}
          <div className="bg-white rounded-xl  border border-[#E8F0FF] p-6 h-100 flex flex-col">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-gray-900">Recent Firm Registrations</h4>
            <a href="#" className="text-black text-sm font-medium hover:underline cursor-pointer rounded-md px-3 py-2" style={{border: '1px solid #E8F0FF'}}>View All</a>
          </div>
          <p className="text-sm text-gray-500 mb-3">Latest firms that joined the platform</p>  
          <div className="flex-1 space-y-2 overflow-y-auto">
            {recentFirms.map((firm, index) => (
              <div key={index} className="flex items-center justify-between p-1 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h6 className="font-medium text-gray-900">{firm.name}</h6>
                  <p className="text-xs text-gray-600">{firm.users} users • ${firm.cost}/month • Last active: {firm.lastActive}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${firm.plan === 'Enterprise' ? 'bg-[#22C55E] text-white' : 'bg-[#E8F0FF] text-black'}`}>
                  {firm.plan}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
          <div className="bg-white rounded-xl  border border-[#E8F0FF] p-6 h-100 flex flex-col">
            <h4 className="text-lg font-semibold text-gray-900 mb-1">Quick Actions</h4>
            <p className="text-sm text-gray-500 mb-3">Common administrative tasks</p>  
          <div className="flex-1 grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="mb-2 w-6 h-6 text-gray-600">{action.icon}</div>
                <span className="text-xs font-medium text-gray-700 text-center">{action.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}