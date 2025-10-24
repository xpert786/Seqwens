import React from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function Overview() {
  // Data for the first chart (Area Chart)
  const revenueData = [
    { month: 'Jan', value: 1500 },
    { month: 'Feb', value: 3000 },
    { month: 'Mar', value: 5000 },
    { month: 'Apr', value: 4000 },
    { month: 'May', value: 5500 },
    { month: 'Jun', value: 4800 }
  ];

  // Data for the second chart (Multi-line Chart)
  const engagementData = [
    { 
      month: 'Jan', 
      activeUsers: 7200, 
      newUsers: 180, 
      sessions: 12000 
    },
    { 
      month: 'Feb', 
      activeUsers: 7500, 
      newUsers: 220, 
      sessions: 12500 
    },
    { 
      month: 'Mar', 
      activeUsers: 7800, 
      newUsers: 190, 
      sessions: 13000 
    },
    { 
      month: 'Apr', 
      activeUsers: 7600, 
      newUsers: 210, 
      sessions: 12800 
    },
    { 
      month: 'May', 
      activeUsers: 7680, 
      newUsers: 203, 
      sessions: 13600 
    },
    { 
      month: 'Jun', 
      activeUsers: 7900, 
      newUsers: 240, 
      sessions: 13200 
    },
    { 
      month: 'Jul', 
      activeUsers: 8200, 
      newUsers: 280, 
      sessions: 14000 
    }
  ];

  // Data for the third chart (Bar Chart)
  const monthlyRevenueData = [
    { month: 'Jan', value: 240000 },
    { month: 'Feb', value: 260000 },
    { month: 'Mar', value: 270000 },
    { month: 'Apr', value: 275000 },
    { month: 'May', value: 285000 },
    { month: 'Jun', value: 300000 }
  ];

  // Custom tooltip component for single line charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white rounded-lg shadow-xl p-3 border-0" style={{minWidth: '140px'}}>
          <div className="text-sm font-semibold mb-1">{label}</div>
          <div className="text-lg font-bold" style={{color: payload[0].color}}>
            {payload[0].value.toLocaleString()}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip component for multi-line charts
  const MultiLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white rounded-lg shadow-xl p-3 border-0" style={{minWidth: '160px'}}>
          <div className="text-sm font-semibold mb-2">{label}</div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm" style={{color: entry.color}}>
                {entry.dataKey === 'activeUsers' ? 'Active Users' : 
                 entry.dataKey === 'newUsers' ? 'New Users' : 
                 'Sessions'}: {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip component for bar chart
  const BarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-xl p-3 border" style={{minWidth: '160px'}}>
          <div className="text-sm font-semibold mb-1" style={{color: '#374151'}}>{label}</div>
          <div className="text-sm" style={{color: '#374151'}}>
            Total Revenue: ${payload[0].value.toLocaleString()}.00
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 mb-8">
      {/* First Chart - Area Chart */}
      <div className="bg-white p-6 transition-all duration-300 ease-in-out" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>Revenue Growth Trend</h3>
          <p className="text-sm" style={{color: '#3B4A66'}}>Monthly recurring revenue and growth rate over time</p>
        </div>
        
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
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
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
                domain={[0, 6000]}
                ticks={[0, 1500, 3000, 4500, 6000]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                dot={{ fill: 'white', stroke: '#3B82F6', strokeWidth: 3, r: 5 }}
                activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2, fill: 'white' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Chart - Multi-line Chart */}
      <div className="bg-white p-6 transition-all duration-300 ease-in-out mb-8" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>User Engagement Metrics</h3>
          <p className="text-sm" style={{color: '#3B4A66'}}>Daily active users, new registrations, and session data</p>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={engagementData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
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
                domain={[0, 16000]}
                ticks={[0, 4000, 8000, 12000, 16000]}
              />
              <Tooltip content={<MultiLineTooltip />} />
              
              {/* Active Users Line - Blue */}
              <Line
                type="monotone"
                dataKey="activeUsers"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: 'white', stroke: '#3B82F6', strokeWidth: 3, r: 5 }}
                activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2, fill: 'white' }}
              />
              
              {/* New Users Line - Orange */}
              <Line
                type="monotone"
                dataKey="newUsers"
                stroke="#FF7043"
                strokeWidth={3}
                dot={{ fill: 'white', stroke: '#FF7043', strokeWidth: 3, r: 5 }}
                activeDot={{ r: 7, stroke: '#FF7043', strokeWidth: 2, fill: 'white' }}
              />
              
              {/* Sessions Line - Green */}
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: 'white', stroke: '#10B981', strokeWidth: 3, r: 5 }}
                activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2, fill: 'white' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#3B82F6'}}></div>
            <span className="text-sm" style={{color: '#3B4A66'}}>Active Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#FF7043'}}></div>
            <span className="text-sm" style={{color: '#3B4A66'}}>New Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#10B981'}}></div>
            <span className="text-sm" style={{color: '#3B4A66'}}>Sessions</span>
          </div>
        </div>
      </div>

      {/* Third Chart - Bar Chart */}
      <div className="bg-white p-6 transition-all duration-300 ease-in-out mb-8" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>Monthly Revenue Breakdown</h3>
          <p className="text-sm" style={{color: '#3B4A66'}}>Detailed revenue analysis by subscription plan.</p>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyRevenueData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
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
              <Tooltip content={<BarTooltip />} />
              <Bar
                dataKey="value"
                fill="#4285F4"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{backgroundColor: '#4285F4'}}></div>
            <span className="text-sm" style={{color: '#3B4A66'}}>Total Revenue</span>
          </div>
        </div>
      </div>
    </div>
  );
}

