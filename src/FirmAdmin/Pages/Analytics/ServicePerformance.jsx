import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import TabNavigation from '../../Components/TabNavigation';

export default function ServicePerformance({ activeTab, setActiveTab, tabs }) {
  // KPI Data
  const kpiData = [
    {
      title: 'Total Revenue',
      value: '$34,000'
    },
    {
      title: 'Avg Turnaround',
      value: '3.8 days'
    },
    {
      title: 'Upsell Rate',
      value: '38%'
    },
    {
      title: 'Top Satisfaction',
      value: 'Payroll — 94%'
    }
  ];

  // Service Adoption Heatmap Data
  const serviceAdoptionData = [
    { month: 'Jan', bookkeeping: 35, taxPlanning: 22, individualTax: 55, businessTax: 18, payroll: 12, auditProtection: 8 },
    { month: 'Feb', bookkeeping: 38, taxPlanning: 25, individualTax: 58, businessTax: 20, payroll: 14, auditProtection: 9 },
    { month: 'Mar', bookkeeping: 40, taxPlanning: 28, individualTax: 60, businessTax: 22, payroll: 15, auditProtection: 11 },
    { month: 'Apr', bookkeeping: 37, taxPlanning: 27, individualTax: 62, businessTax: 19, payroll: 13, auditProtection: 10 },
    { month: 'May', bookkeeping: 42, taxPlanning: 31, individualTax: 65, businessTax: 25, payroll: 18, auditProtection: 12 },
    { month: 'June', bookkeeping: 39, taxPlanning: 29, individualTax: 61, businessTax: 21, payroll: 16, auditProtection: 11 }
  ];

  // Upsell Performance Data
  const upsellData = [
    { service: 'Bookkeeping', rate: 45 },
    { service: 'Tax Planning', rate: 52 },
    { service: 'Individual Tax Returns', rate: 38 },
    { service: 'Business Tax Returns', rate: 41 }
  ];

  // Turnaround Time Data
  const turnaroundData = [
    { service: 'Bookkeeping', days: 2.8 },
    { service: 'Tax Planning', days: 7.5 },
    { service: 'Business Tax Returns', days: 4.0 },
    { service: 'Payroll', days: 2.8 },
    { service: 'Audit Protection', days: 6.5 }
  ];

  // Conversion Funnel Data
  const conversionData = [
    { completion: 25, satisfaction: 75, size: 100 },
    { completion: 50, satisfaction: 50, size: 80 },
    { completion: 75, satisfaction: 95, size: 120 },
    { completion: 100, satisfaction: 75, size: 90 }
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

  const ScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg text-xs">
          <p className="font-medium">Completion %: {data.completion}%</p>
          <p className="font-medium">Satisfaction %: {data.satisfaction}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {kpiData.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg border-1 border-[#E8F0FF] p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <p className="text-sm font-thin text-gray-600">{kpi.title}</p>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation with Filters */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-6">
        <div className="w-fit">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Tab-specific filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative">
            <select className="appearance-none text-[#3B4A66] bg-white border border-[#E8F0FF] rounded-lg px-2 py-1 pr-6 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[60px]">
              <option>2025</option>
              <option>2024</option>
              <option>2023</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-2 h-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="relative">
            <select className="appearance-none text-[#3B4A66] bg-white border border-[#E8F0FF] rounded-lg px-2 py-1 pr-6 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[70px]">
              <option>All offices</option>
              <option>Office A</option>
              <option>Office B</option>
              <option>Office C</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-2 h-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="relative">
            <select className="appearance-none text-[#3B4A66] bg-white border border-[#E8F0FF] rounded-lg px-2 py-1 pr-6 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[40px]">
              <option>All</option>
              <option>Q1</option>
              <option>Q2</option>
              <option>Q3</option>
              <option>Q4</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-2 h-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <button className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors min-w-[60px]" style={{borderRadius: "7px"}}>
            Compare
          </button>
        </div>
      </div>

      {/* Service Performance Section */}
      <div className="mb-8 ">
       

        {/* Service Adoption Heatmap */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h4 className="text-xl font-thin text-[#3B4A66] mb-2">Service Performance</h4>
        <p className="text-sm text-gray-600 mb-6">Revenue and growth by service type</p>
          <h5 className="text-lg font-thin text-[#3B4A66] mb-4">Service Adoption Heatmap</h5>
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-7 gap-4 py-1 px-3 text-sm font-thin text-gray-600 ">
                <div>Month</div>
                <div>Bookkeeping</div>
                <div>Tax Planning</div>
                <div>Individual Tax Returns</div>
                <div>Business Tax Returns</div>
                <div>Payroll</div>
                <div>Audit Protection</div>
              </div>
              
              {/* Rows */}
              {serviceAdoptionData.map((row, index) => (
                <div key={index} className="grid grid-cols-7 gap-4 py-2 px-3 border border-[#E8F0FF] rounded-md bg-white">
                  <div className="font-medium text-gray-900 flex items-center">{row.month}</div>
                  <div className="flex items-center">
                    <div className="w-20 h-8 rounded flex items-center justify-center text-xs font-medium" 
                         style={{ 
                           backgroundColor: `rgba(59, 130, 246, ${Math.max(0.1, row.bookkeeping / 100)})`,
                           color: row.bookkeeping > 30 ? 'white' : 'black'
                         }}>
                      {row.bookkeeping}%
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 h-8 rounded flex items-center justify-center text-xs font-medium" 
                         style={{ 
                           backgroundColor: `rgba(59, 130, 246, ${Math.max(0.1, row.taxPlanning / 100)})`,
                           color: row.taxPlanning > 30 ? 'white' : 'black'
                         }}>
                      {row.taxPlanning}%
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 h-8 rounded flex items-center justify-center text-xs font-medium" 
                         style={{ 
                           backgroundColor: `rgba(59, 130, 246, ${Math.max(0.1, row.individualTax / 100)})`,
                           color: row.individualTax > 30 ? 'white' : 'black'
                         }}>
                      {row.individualTax}%
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 h-8 rounded flex items-center justify-center text-xs font-medium" 
                         style={{ 
                           backgroundColor: `rgba(59, 130, 246, ${Math.max(0.1, row.businessTax / 100)})`,
                           color: row.businessTax > 30 ? 'white' : 'black'
                         }}>
                      {row.businessTax}%
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 h-8 rounded flex items-center justify-center text-xs font-medium" 
                         style={{ 
                           backgroundColor: `rgba(59, 130, 246, ${Math.max(0.1, row.payroll / 100)})`,
                           color: row.payroll > 30 ? 'white' : 'black'
                         }}>
                      {row.payroll}%
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 h-8 rounded flex items-center justify-center text-xs font-medium" 
                         style={{ 
                           backgroundColor: `rgba(59, 130, 246, ${Math.max(0.1, row.auditProtection / 100)})`,
                           color: row.auditProtection > 30 ? 'white' : 'black'
                         }}>
                      {row.auditProtection}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </div>

        {/* Upsell Performance - Full Width */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upsell / Add-On Performance</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800">Export CSV</button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={upsellData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
                <XAxis dataKey="service" />
                <YAxis domain={[0, 60]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Turnaround Time */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Avg Turnaround Time (Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turnaroundData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
                  <XAxis dataKey="service" />
                  <YAxis domain={[0, 8]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="days" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Conversion Funnel</h3>
              <button className="text-sm text-[#3B4A66] bg-white border border-[#E8F0FF] px-2 py-1 rounded-full" style={{borderRadius: "7px"}}>View Clients</button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
                  <XAxis type="number" dataKey="completion" domain={[0, 100]} />
                  <YAxis type="number" dataKey="satisfaction" domain={[0, 100]} />
                  <Tooltip content={<ScatterTooltip />} />
                  <Scatter dataKey="size" fill="#10B981">
                    {conversionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#10B981" />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
    