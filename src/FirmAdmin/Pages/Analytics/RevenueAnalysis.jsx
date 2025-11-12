import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts';
import TabNavigation from '../Integrations/TabNavigation';

export default function RevenueAnalysis({ activeTab, setActiveTab, tabs }) {

  const kpiData = [
    {
      title: 'Gross Revenue',
      value: '$196,000',
      subtitle: 'Before any fees',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Fees Collected',
      value: '$160,000',
      subtitle: 'Collection Rate 82%',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21M22 21V19C21.9993 18.1137 21.7044 17.2528 21.1614 16.5523C20.6184 15.8519 19.8581 15.3516 19 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Outstanding',
      value: '$36,000',
      subtitle: 'Unpaid / pending',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Refund Transfers',
      value: '$15,500',
      subtitle: 'Bank Adoption 59%',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 7L14.2071 14.7929C13.8166 15.1834 13.1834 15.1834 12.7929 14.7929L9.20711 11.2071C8.81658 10.8166 8.18342 10.8166 7.79289 11.2071L2 17M22 7H16M22 7V13" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Fees (Bank + Software)',
      value: '$11,810',
      subtitle: 'Bank $5,900 - Soft $5,910',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Net Profit',
      value: '$148,190',
      subtitle: 'After bank & software fees',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 7L14.2071 14.7929C13.8166 15.1834 13.1834 15.1834 12.7929 14.7929L9.20711 11.2071C8.81658 10.8166 8.18342 10.8166 7.79289 11.2071L2 17M22 7H16M22 7V13" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  // Chart data for Revenue & Profit Trend
  const revenueData = [
    { month: 'Jan', collected: 23000, outstanding: 5000, refundTransfer: 2000, netProfit: 21150, bankAdoption: 58 },
    { month: 'Feb', collected: 25000, outstanding: 5000, refundTransfer: 3000, netProfit: 24000, bankAdoption: 60 },
    { month: 'Mar', collected: 31000, outstanding: 5000, refundTransfer: 3000, netProfit: 28000, bankAdoption: 62 },
    { month: 'Apr', collected: 29000, outstanding: 5000, refundTransfer: 3000, netProfit: 27000, bankAdoption: 64 },
    { month: 'May', collected: 33000, outstanding: 5000, refundTransfer: 5000, netProfit: 30000, bankAdoption: 68 },
    { month: 'Jun', collected: 26000, outstanding: 5000, refundTransfer: 4000, netProfit: 24000, bankAdoption: 64 }
  ];

  // Chart data for Fees Collected
  const feesData = [
    { month: 'Jan', officeA: 10000, officeB: 9000, officeC: 7000, netProfit: 19400 },
    { month: 'Feb', officeA: 12000, officeB: 10000, officeC: 8000, netProfit: 22000 },
    { month: 'Mar', officeA: 15000, officeB: 12000, officeC: 10000, netProfit: 26000 },
    { month: 'Apr', officeA: 13000, officeB: 11000, officeC: 9000, netProfit: 24000 },
    { month: 'May', officeA: 16000, officeB: 13000, officeC: 11000, netProfit: 28000 },
    { month: 'Jun', officeA: 14000, officeB: 12000, officeC: 10000, netProfit: 25000 }
  ];

  // Custom tooltip for Revenue chart
  const RevenueTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-xs shadow-lg">
          <div className="font-semibold text-gray-900 mb-2">{label}</div>
          <div className="space-y-1">
            <div className="text-gray-600">Gross: <span className="font-medium">$28,000</span></div>
            <div className="text-blue-600">Collected: <span className="font-medium">${payload[0]?.value?.toLocaleString()}</span></div>
            <div className="text-blue-400">Outstanding: <span className="font-medium">${payload[1]?.value?.toLocaleString()}</span></div>
            <div className="text-red-500">Refund Transfer: <span className="font-medium">${payload[2]?.value?.toLocaleString()}</span></div>
            <div className="text-gray-600">Fees (Bank + Software): <span className="font-medium">$1,850</span></div>
            <div className="text-green-600">Net Profit: <span className="font-medium">${payload[3]?.value?.toLocaleString()}</span></div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for Fees chart
  const FeesTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-xs shadow-lg">
          <div className="font-semibold text-gray-900 mb-2">{label}</div>
          <div className="space-y-1">
            <div className="text-green-600">Net Profit: <span className="font-medium">{payload[3]?.value?.toLocaleString()}</span></div>
            <div className="text-blue-600">Office A: <span className="font-medium">{payload[0]?.value?.toLocaleString()}</span></div>
            <div className="text-purple-600">Office B: <span className="font-medium">{payload[1]?.value?.toLocaleString()}</span></div>
            <div className="text-purple-800">Office C: <span className="font-medium">{payload[2]?.value?.toLocaleString()}</span></div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-4 mb-6 sm:mb-8">
        {kpiData.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg border-1 border-[#E8F0FF] p-4 sm:p-6 h-[140px] sm:h-[160px]">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-thin text-gray-600">{kpi.title}</p>
              <div className="text-[#3B4A66]">
                {kpi.icon}
              </div>
            </div>
            <p className="text-md font-medium text-gray-900 mb-1">{kpi.value}</p>
            <p className="text-xs text-gray-500">{kpi.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div className="flex-1 lg:flex-none">
            <TabNavigation
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Tab-specific filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:ml-4">
            <div className="relative w-full sm:w-40">
              <select className="w-full appearance-none text-[#3B4A66] bg-white border-1 border-[#E8F0FF] rounded-lg px-3 sm:px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Tax Year 2024</option>
                <option>Tax Year 2023</option>
                <option>Tax Year 2022</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="relative w-full sm:w-32">
              <select className="w-full appearance-none text-[#3B4A66] bg-white border-1 border-[#E8F0FF] rounded-lg px-3 sm:px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>All Office</option>
                <option>Office A</option>
                <option>Office B</option>
                <option>Office C</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Profit Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue & Profit Trend</h3>
        </div>
        <div className="h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={revenueData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
              />
              <YAxis 
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                domain={[0, 38000]}
                ticks={[0, 9500, 19000, 28500, 38000]}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                domain={[0, 80]}
                ticks={[0, 20, 40, 60, 80]}
              />
              <Tooltip content={<RevenueTooltip />} />
              
              {/* Stacked Bars */}
              <Bar yAxisId="left" dataKey="collected" stackId="a" fill="#1E40AF" name="Collected" />
              <Bar yAxisId="left" dataKey="outstanding" stackId="a" fill="#3B82F6" name="Outstanding" />
              <Bar yAxisId="left" dataKey="refundTransfer" fill="#EF4444" name="Refund Transfer" />
              
              {/* Lines */}
              <Line yAxisId="left" type="monotone" dataKey="netProfit" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} name="Net Profit" />
              <Line yAxisId="right" type="monotone" dataKey="bankAdoption" stroke="#F97316" strokeWidth={2} strokeDasharray="4 4" dot={{ fill: '#F97316', r: 4 }} name="Bank Adoption %" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#1E40AF] rounded"></div>
            <span>Collected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#3B82F6] rounded"></div>
            <span>Outstanding</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#EF4444] rounded"></div>
            <span>Refund Transfer</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-[#10B981]"></div>
            <span>Net Profit</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-[#F97316] border-dashed border-t-2"></div>
            <span>Bank Adoption %</span>
          </div>
        </div>
      </div>

      {/* Fees Collected Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Fees Collected</h3>
          <p className="text-sm text-gray-600">Total collected vs outstanding in the selected time range.</p>
        </div>
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={feesData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
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
                domain={[0, 28000]}
                ticks={[0, 7000, 14000, 21000, 28000]}
              />
              <Tooltip content={<FeesTooltip />} />
              
              {/* Bars */}
              <Bar dataKey="officeA" fill="#3B82F6" name="Office A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="officeB" fill="#8B5CF6" name="Office B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="officeC" fill="#5B21B6" name="Office C" radius={[4, 4, 0, 0]} />
              
              {/* Net Profit Line */}
              <Line type="monotone" dataKey="netProfit" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} name="Net Profit" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-[#10B981]"></div>
            <span>Net Profit</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#3B82F6] rounded"></div>
            <span>Office A</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#8B5CF6] rounded"></div>
            <span>Office B</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#5B21B6] rounded"></div>
            <span>Office C</span>
          </div>
        </div>
      </div>
    </>
  );
}
