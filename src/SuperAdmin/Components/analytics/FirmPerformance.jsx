import React from 'react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function FirmPerformance() {
  // Data for API Usage chart
  const apiUsageData = [
    { month: 'Jan', calls: 130000 },
    { month: 'Feb', calls: 140000 },
    { month: 'Mar', calls: 145000 },
    { month: 'Apr', calls: 150000 },
    { month: 'May', calls: 155000 },
    { month: 'Jun', calls: 160000 }
  ];

  // Data for IRS E-File Stats pie chart
  const eFileData = [
    { name: 'Completed', value: 80, color: '#10B981' },
    { name: 'Rejected', value: 20, color: '#F59E0B' }
  ];

  // Data for Client Adoption Rates double bar chart
  const adoptionData = [
    { 
      month: 'Jan', 
      portalLogins: 100, 
      documentUploads: 25 
    },
    { 
      month: 'Feb', 
      portalLogins: 125, 
      documentUploads: 88 
    },
    { 
      month: 'Mar', 
      portalLogins: 80, 
      documentUploads: 40 
    },
    { 
      month: 'Apr', 
      portalLogins: 110, 
      documentUploads: 70 
    },
    { 
      month: 'May', 
      portalLogins: 140, 
      documentUploads: 100 
    },
    { 
      month: 'Jun', 
      portalLogins: 125, 
      documentUploads: 75 
    }
  ];

  // Custom tooltip for API Usage chart
  const ApiTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
  return (
        <div className="bg-white rounded-lg shadow-xl p-3 border" style={{minWidth: '140px'}}>
          <div className="text-sm font-semibold mb-1" style={{color: '#374151'}}>{label}</div>
          <div className="text-sm" style={{color: '#374151'}}>
            Calls: {payload[0].value.toLocaleString()}
            </div>
          </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-900 text-white rounded-lg shadow-xl p-3 border-0" style={{minWidth: '100px'}}>
          <div className="text-sm font-semibold mb-1">{data.name}</div>
          <div className="text-lg font-bold" style={{color: data.payload.color}}>
            {data.value}%
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for double bar chart
  const AdoptionTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-xl p-3 border" style={{minWidth: '140px'}}>
          <div className="text-sm font-semibold mb-1" style={{color: '#374151'}}>{label}</div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm" style={{color: '#374151'}}>
                {entry.dataKey === 'portalLogins' ? 'Portal logins' : 'Document uploads'}: {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom label function for pie chart with connecting lines
  const renderLabel = (entry) => {
    const RADIAN = Math.PI / 180;
    const radius = entry.outerRadius;
    const x = entry.cx + radius * Math.cos(-entry.midAngle * RADIAN);
    const y = entry.cy + radius * Math.sin(-entry.midAngle * RADIAN);
    
    // Calculate label position (further out)
    const labelRadius = radius + 20;
    const labelX = entry.cx + labelRadius * Math.cos(-entry.midAngle * RADIAN);
    const labelY = entry.cy + labelRadius * Math.sin(-entry.midAngle * RADIAN);

    return (
      <g>
        {/* Connecting line - same color as pie segment */}
        <line
          x1={x}
          y1={y}
          x2={labelX}
          y2={labelY}
          stroke={entry.fill}
          strokeWidth="2"
        />
        {/* Label text */}
        <text 
          x={labelX} 
          y={labelY} 
          fill="#374151" 
          textAnchor={labelX > entry.cx ? 'start' : 'end'} 
          dominantBaseline="central"
          fontSize="11"
          fontWeight="500"
        >
          {`${entry.name}: ${entry.value}%`}
        </text>
      </g>
    );
  };

  return (
    <div className="transition-all duration-500 ease-in-out h-fit mb-8">
      {/* Two Charts Dashboard */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Left Chart - API Usage (Area Chart) */}
        <div className="bg-white p-6 transition-all duration-300 ease-in-out" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-6">
            <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>API Usage</h3>
            <p className="text-sm" style={{color: '#3B4A66'}}>
              <span className="text-lg font-bold">1.2M</span> Calls this month
            </p>
        </div>
        
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={apiUsageData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="colorApiUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
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
                <Tooltip content={<ApiTooltip />} />
                <Area
                  type="monotone"
                  dataKey="calls"
                  stroke="#06B6D4"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorApiUsage)"
                  dot={{ fill: 'white', stroke: '#06B6D4', strokeWidth: 3, r: 5 }}
                  activeDot={{ r: 7, stroke: '#06B6D4', strokeWidth: 2, fill: 'white' }}
                />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </div>
          
        {/* Right Chart - IRS E-File Stats (Pie Chart) */}
        <div className="bg-white p-6 transition-all duration-300 ease-in-out" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-6">
            <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>IRS E-File Stats</h3>
              <p className="text-sm" style={{color: '#3B4A66'}}>Accepted vs. Rejected</p>
            </div>
            
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={eFileData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {eFileData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="space-y-3 mt-6">
            {eFileData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{backgroundColor: item.color}}></div>
                  <span className="text-sm font-medium" style={{color: '#3B4A66'}}>{item.name}</span>
                </div>
                <span className="text-sm font-semibold" style={{color: '#3B4A66'}}>
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Client Adoption Rates Double Bar Chart */}
      <div className="bg-white p-6 mb-8" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>Client Adoption Rates</h3>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={adoptionData}
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
                domain={[0, 160]}
                ticks={[0, 40, 80, 120, 160]}
              />
              <Tooltip content={<AdoptionTooltip />} />
              
              {/* Portal Logins Bar - Blue */}
              <Bar
                dataKey="portalLogins"
                fill="#1E40AF"
                radius={[4, 4, 0, 0]}
                name="Portal logins"
                maxBarSize={30}
              />
              
              {/* Document Uploads Bar - Red */}
              <Bar
                dataKey="documentUploads"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
                name="Document uploads"
                maxBarSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{backgroundColor: '#1E40AF'}}></div>
            <span className="text-sm" style={{color: '#3B4A66'}}>Portal logins.</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{backgroundColor: '#EF4444'}}></div>
            <span className="text-sm" style={{color: '#3B4A66'}}>Document uploads</span>
          </div>
        </div>
      </div>
    </div>
  );
}

