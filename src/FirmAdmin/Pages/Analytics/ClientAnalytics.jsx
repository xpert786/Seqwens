import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart, Line } from 'recharts';
import TabNavigation from '../../Components/TabNavigation';

export default function ClientAnalytics({ activeTab, setActiveTab, tabs }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  // KPI Data
  const kpiData = [
    {
      title: 'Leads',
      value: '990',
     
    },
    {
      title: 'Paying Clients',
      value: '481',
     
    },
    {
      title: 'Repeat Clients',
      value: '268',
    
    },
    {
      title: 'Conversion Rate',
      value: '49%',
      subtitle: 'Paying / Leads',
   
    },
    {
      title: 'Retention Rate',
      value: '94%',
  
    },
    {
      title: 'Avg CLV',
      value: '$1502',

    }
  ];

  // Chart Data
  const clientSegmentationData = [
    { name: 'Individual', value: 59, color: '#3B82F6' },
    { name: 'Amended', value: 35, color: '#8B5CF6' },
    { name: 'Business', value: 25, color: '#1E40AF' },
    { name: 'Extensions', value: 12, color: '#F97316' }
  ];

  const retentionCLVData = [
    { month: 'Jan', avgCLV: 550, retention: 92 },
    { month: 'Feb', avgCLV: 850, retention: 94 },
    { month: 'Mar', avgCLV: 720, retention: 94 },
    { month: 'Apr', avgCLV: 400, retention: 91 },
    { month: 'May', avgCLV: 750, retention: 95 },
    { month: 'Jun', avgCLV: 800, retention: 93 }
  ];

  const ageDistributionData = [
    { age: '18-24', clients: 60 },
    { age: '25-34', clients: 105 },
    { age: '35-44', clients: 75 },
    { age: '45-54', clients: 110 },
    { age: '55+', clients: 125 }
  ];

  // Dynamic data - can be easily modified or fetched from API
  const conversionFunnelData = [
    { stage: 'Leads', count: 990, color: '#3B82F6' },
    { stage: 'Consultations', count: 680, color: '#8B5CF6' },
    { stage: 'Paying', count: 780, color: '#10B981' },
    { stage: 'Repeat', count: 980, color: '#F59E0B' }
  ];

  // Dynamic configuration - easily customizable
  const chartConfig = {
    maxValue: Math.max(...conversionFunnelData.map(item => item.count)),
    chartWidth: 340, // Reduced from 360 to 300
    barHeight: 20,
    barSpacing: 35,
    gridLines: [0, 250, 500, 750, 1000],
    showBackground: true,
    showTooltips: true,
    showValues: true
  };

  const referralTrackingData = [
    { source: 'Referrals', clients: 95 },
    { source: 'Marketing', clients: 125 },
    { source: 'Walk-ins', clients: 45 }
  ];

  const filingStatusData = [
    { name: 'Single', value: 45, color: '#3B82F6' },
    { name: 'Married', value: 35, color: '#8B5CF6' },
    { name: 'Head of Household', value: 8, color: '#1E40AF' },
    { name: 'Other', value: 3, color: '#F97316' }
  ];

  const incomeBracketsData = [
    { bracket: '<50k', clients: 125 },
    { bracket: '50-100k', clients: 80 },
    { bracket: '100-150k', clients: 45 },
    { bracket: '150-250k', clients: 115 },
    { bracket: '>250k', clients: 75 }
  ];

  // Custom Tooltips
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg text-xs">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-6  sm:mb-8 h-fit">
        {kpiData.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg border-1 border-[#E8F0FF] p-4 sm:p-6">
            <div className="flex items-start justify-between ">
            <p className="text-sm font-thin text-gray-600">{kpi.title}</p>
             
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">{kpi.value}</p>
            {kpi.subtitle && <p className="text-xs text-gray-500">{kpi.subtitle}</p>}
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 sm:mb-8">
        <TabNavigation className='w-fit'
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Charts Section - Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Client Segmentation */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Client Segmentation</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800">View Clients</button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clientSegmentationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {clientSegmentationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs">
            {clientSegmentationData.map((segment, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: segment.color }}></div>
                <span>{segment.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Conversion Funnel</h3>
            <button className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">View Clients</button>
          </div>
          <div className="h-64">
            <svg width="100%" height="100%" viewBox="0 0 480 200">
              {/* Dynamic chart configuration */}
              {(() => {
                const { maxValue, chartWidth, barHeight, barSpacing, gridLines, showBackground, showTooltips, showValues } = chartConfig;
                const startY = 40;
                const startX = 90; // Much more space for labels
                
                return (
                  <>
                    {/* Grid lines */}
                    <defs>
                      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,3" opacity="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Dynamic X-axis labels */}
                    {gridLines.map((value, index) => {
                      const x = startX + (value / 1000) * chartWidth;
                      return (
                        <text key={value} x={x} y="190" fontSize="12" fill="#6B7280" textAnchor="middle">
                          {value}
                        </text>
                      );
                    })}
                    
                    {/* Dynamic Y-axis labels and bars */}
                    {conversionFunnelData.map((item, index) => {
                      const y = startY + (index * barSpacing);
                      const barWidth = (item.count / maxValue) * chartWidth;
                      const isHovered = hoveredBar === index;
                      
                      return (
                        <g key={item.stage}>
                          {/* Y-axis label */}
                          <text x="85" y={y + 5} fontSize="12" fill="#374151" textAnchor="end">
                            {item.stage}
                          </text>
                          
                          {/* Bar background (optional) */}
                          {showBackground && (
                            <rect
                              x={startX}
                              y={y - 10}
                              width={chartWidth}
                              height={barHeight}
                              fill="#F3F4F6"
                              rx="4"
                              opacity="0.3"
                            />
                          )}
                          
                          {/* Bar */}
                          <rect
                            x={startX}
                            y={y - 10}
                            width={barWidth}
                            height={barHeight}
                            fill={isHovered ? item.color : item.color}
                            rx="4"
                            className="cursor-pointer transition-all duration-300"
                            onMouseEnter={() => setHoveredBar(index)}
                            onMouseLeave={() => setHoveredBar(null)}
                            opacity={isHovered ? 0.8 : 1}
                          />
                          
                          {/* Bar value text */}
                          {showValues && (
                            <text 
                              x={barWidth + startX + 5} 
                              y={y + 5} 
                              fontSize="10" 
                              fill="#6B7280"
                              fontWeight={isHovered ? "bold" : "normal"}
                            >
                              {item.count}
                            </text>
                          )}
                          
                          {/* Tooltip */}
                          {showTooltips && isHovered && (
                            <g>
                              <rect
                                x={barWidth + startX + 10}
                                y={y - 25}
                                width="80"
                                height="30"
                                fill="white"
                                stroke="#E5E7EB"
                                strokeWidth="1"
                                rx="6"
                              />
                              <text x={barWidth + startX + 15} y={y - 10} fontSize="10" fill="#374151" fontWeight="bold">
                                {item.stage}
                              </text>
                              <text x={barWidth + startX + 15} y={y + 2} fontSize="9" fill="#3B82F6">
                                Count : {item.count}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>

      {/* Charts Section - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Retention & CLV */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Retention & CLV</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={retentionCLVData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
                 <XAxis dataKey="month" />
                 <YAxis yAxisId="left" domain={[0, 1600]} />
                 <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                 <Tooltip content={<CustomTooltip />} />
                 <Bar yAxisId="left" dataKey="avgCLV" fill="#3B82F6" name="Average CLV" maxBarSize={30} radius={[4, 4, 0, 0]} />
                 <Line yAxisId="right" type="monotone" dataKey="retention" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} name="Retention %" />
               </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span>Average CLV</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span>Retention %</span>
            </div>
          </div>
        </div>

        {/* Referral Tracking */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Referral Tracking</h3>
            <button className="text-sm text-[#3B4A66] border-1 border-[#E8F0FF] rounded-md px-2 py-1" style={{borderRadius: "6px"}}>View New Clients</button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={referralTrackingData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
                 <XAxis dataKey="source" />
                 <YAxis domain={[0, 140]} />
                 <Tooltip content={<CustomTooltip />} />
                 <Bar dataKey="clients" fill="#F97316" maxBarSize={30} radius={[4, 4, 0, 0]} />
               </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section - Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Age Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
                <XAxis dataKey="age" />
                <YAxis domain={[0, 140]} />
                <Tooltip content={<CustomTooltip />} />
                 <Bar dataKey="clients" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filing Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filing Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filingStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {filingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs">
            {filingStatusData.map((segment, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: segment.color }}></div>
                <span>{segment.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Income Brackets */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Brackets</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeBracketsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
                <XAxis dataKey="bracket" />
                <YAxis domain={[0, 140]} />
                <Tooltip content={<CustomTooltip />} />
                 <Bar dataKey="clients" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
