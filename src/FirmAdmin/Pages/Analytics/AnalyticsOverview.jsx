import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import TabNavigation from '../../Components/TabNavigation';


export default function AnalyticsOverview({ activeTab, setActiveTab, tabs }) {

  const kpiData = [
    {
      title: 'Total Revenue',
      value: '$338,000',
      change: '+12.5%',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
      )
    },
    {
      title: 'Active Clients',
      value: '247',
      change: '+37',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21M22 21V19C21.9993 18.1137 21.7044 17.2528 21.1614 16.5523C20.6184 15.8519 19.8581 15.3516 19 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
      )
    },
    {
      title: 'Avg. Client Value',
      value: '$1,369',
      change: '+8.2%',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Client Retention',
      value: '96.3%',
      change: '+1.2%',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22 7L14.2071 14.7929C13.8166 15.1834 13.1834 15.1834 12.7929 14.7929L9.20711 11.2071C8.81658 10.8166 8.18342 10.8166 7.79289 11.2071L2 17M22 7H16M22 7V13" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
      )
    }
  ];

  const clientSegments = [
    {
      name: 'Individual Clients',
      value: '$125,000',
      average: '$801 avg',
      info: '2 hours ago',
      color: 'bg-blue-500',
      percentage: 40
    },
    {
      name: 'Small Business',
      value: '$87,000',
      average: '$1,299 avg',
      info: '67 clients',
      color: 'bg-green-500',
      percentage: 28
    },
    {
      name: 'Medium Business',
      value: '$69,000',
      average: '$3,833 avg',
      info: '18 clients',
      color: 'bg-orange-500',
      percentage: 22
    },
    {
      name: 'Enterprise',
      value: '$34,000',
      average: '$5,667 avg',
      info: '6 clients',
      color: 'bg-red-500',
      percentage: 10
    }
  ];

  const chartData = [
    { name: 'Individual Clients', value: 125000, color: '#3B82F6' },
    { name: 'Small Business', value: 87000, color: '#10B981' },
    { name: 'Medium Business', value: 69000, color: '#F97316' },
    { name: 'Enterprise', value: 34000, color: '#EF4444' }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-blue-600">${payload[0].value.toLocaleString()}</p>
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
              <div className="text-[#3B4A66]">
                {kpi.icon}
              </div>
            </div>
             <p className="text-lg font-medium text-gray-900">{kpi.value}</p>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.9166 3.79297L7.31242 8.39714L4.60409 5.6888L1.08325 9.20964M11.9166 3.79297H8.66658M11.9166 3.79297L11.9166 7.04297" stroke="#32B582" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="ml-1">{kpi.change}</span>
            </div>
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <p className="text-sm text-gray-600">Monthly revenue, expenses, and profit</p>
          </div>
          <div className="h-56 sm:h-64 relative">
            {/* Chart Container */}
            <div className="absolute inset-0 bg-white rounded-lg">
              {/* Y-axis labels */}
              <div className="absolute left-0 right-8 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
                <span>80000</span>
                <span>60000</span>
                <span>40000</span>
                <span>20000</span>
                <span>0</span>
              </div>
              
              {/* Chart Area */}
              <div className="absolute left-11 right-4 top-4 bottom-8">
                {/* Grid Lines */}
                <div className="absolute inset-0">
                  {/* Horizontal grid lines */}
                  <div className="absolute top-0 left-0 right-0 h-px border-t border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute top-1/4 left-0 right-0 h-px border-t border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute top-3/4 left-0 right-0 h-px border-t border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-px border-t border-dotted border-[#E5E7EB]"></div>
                  
                  {/* Vertical grid lines */}
                  <div className="absolute left-0 top-0 bottom-0 w-px border-l border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute left-1/5 top-0 bottom-0 w-px border-l border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute left-2/5 top-0 bottom-0 w-px border-l border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute left-3/5 top-0 bottom-0 w-px border-l border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute left-4/5 top-0 bottom-0 w-px border-l border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-px border-l border-dotted border-[#E5E7EB]"></div>
                </div>
                
                {/* Stacked Area Chart */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Expenses Area (Bottom - Red/Pink) */}
                  <path
                    d="M 0,75 L 20,78 L 40,75 L 60,68 L 80,69 L 100,64 L 100,100 L 0,100 Z"
                    fill="rgb(220, 90, 110)"
                    opacity="0.8"
                  />
                  
                  {/* Profit Area (Top - Blue) */}
                  <path
                    d="M 0,50 L 20,44 L 40,48 L 60,36 L 80,38 L 100,28 L 100,64 L 80,69 L 60,68 L 40,75 L 20,78 L 0,75 Z"
                    fill="rgb(100, 170, 240)"
                    opacity="0.8"
                  />
                  
                  {/* Revenue Line (Top boundary) */}
                  <path
                    d="M 0,50 L 20,44 L 40,48 L 60,36 L 80,38 L 100,28"
                    fill="none"
                    stroke="rgb(100, 170, 240)"
                    strokeWidth="0.5"
                  />
                </svg>
                
                {/* Tooltip for April (hover state) */}
                <div className="absolute top-8 left-3/5 transform -translate-x-1/2 -translate-y-full">
                  <div className="bg-white rounded-lg  border border-gray-200 p-2 text-xs">
                    <div className="font-semibold text-gray-900">April</div>
                    <div className="text-blue-600">$ 61,000</div>
                    <div className="text-red-500">$ 32,000</div>
                  </div>
                  {/* Tooltip connector line */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-px h-2 bg-gray-300 border-dashed border-l"></div>
                  {/* Data point circle */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-1 w-1 h-1 bg-white rounded-full border border-gray-300"></div>
                </div>
              </div>
              
              {/* X-axis labels */}
              <div className="absolute bottom-0 left-8 right-4 flex justify-between text-xs text-gray-500">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>
          </div>
        </div>

        {/* Client Growth Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Client Growth</h3>
            <p className="text-sm text-gray-600">New vs lost clients and retention rate</p>
          </div>
          <div className="h-56 sm:h-64 relative">
            {/* Chart Container */}
            <div className="absolute inset-0 bg-white rounded-lg">
              {/* Y-axis labels */}
              <div className="absolute left-0 right-8 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
                <span>28</span>
                <span>21</span>
                <span>14</span>
                <span>7</span>
                <span>0</span>
              </div>
              
              {/* Chart Area */}
              <div className="absolute left-11 right-4 top-4 bottom-8">
                {/* Grid Lines */}
                <div className="absolute inset-0">
                  {/* Horizontal grid lines */}
                  <div className="absolute top-0 left-0 right-0 h-px border-t border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute top-1/4 left-0 right-0 h-px border-t border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute top-3/4 left-0 right-0 h-px border-t border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-px border-t border-dotted border-[#E5E7EB]"></div>
                  
                  {/* Vertical grid lines */}
                  <div className="absolute left-0 top-0 bottom-0 w-px border-l border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute left-1/5 top-0 bottom-0 w-px border-l border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute left-2/5 top-0 bottom-0 w-px border-l border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute left-3/5 top-0 bottom-0 w-px border-l border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute left-4/5 top-0 bottom-0 w-px border-l border-dotted border-[#E5E7EB]"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-px border-l border-dotted border-[#E5E7EB]"></div>
                </div>
                
                {/* Line Chart */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* New Client Line (Green) */}
                  <path
                    d="M 0,46 L 20,32 L 40,21 L 60,25 L 80,4 L 100,54"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                  />
                  
                  {/* Lost Client Line (Red) */}
                  <path
                    d="M 0,89 L 20,93 L 40,89 L 60,86 L 80,89 L 100,93"
                    fill="none"
                    stroke="#DC5A6E"
                    strokeWidth="2"
                  />
                  
                  {/* New Client Data Points */}
                  <circle cx="0" cy="46" r="1.5" fill="#E5E7EB"  strokeWidth="1px" stroke="#10B981" />
                  <circle cx="20" cy="32" r="1.5" fill="#E5E7EB"  strokeWidth="1px" stroke="#10B981" />
                  <circle cx="40" cy="21" r="1.5" fill="#E5E7EB"  strokeWidth="1px" stroke="#10B981" />
                  <circle cx="60" cy="25" r="1.5" fill="#E5E7EB"  strokeWidth="1px" stroke="#10B981" />
                  <circle cx="80" cy="4" r="1.5" fill="#E5E7EB"  strokeWidth="1px" stroke="#10B981" />
                  <circle cx="100" cy="54" r="1.5" fill="#E5E7EB"  strokeWidth="1px" stroke="#10B981" />
                  
                  {/* Lost Client Data Points */}
                  <circle cx="0" cy="89" r="1.5" fill="#E5E7EB" strokeWidth="1px" stroke="#DC5A6E" />
                  <circle cx="20" cy="93" r="1.5" fill="#E5E7EB" strokeWidth="1px" stroke="#DC5A6E" />
                  <circle cx="40" cy="89" r="1.5" fill="#E5E7EB" strokeWidth="1px" stroke="#DC5A6E" />
                  <circle cx="60" cy="86" r="1.5" fill="#E5E7EB" strokeWidth="1px" stroke="#DC5A6E" />
                  <circle cx="80" cy="89" r="1.5" fill="#E5E7EB" strokeWidth="1px" stroke="#DC5A6E" />
                  <circle cx="100" cy="93" r="1.5" fill="#E5E7EB" strokeWidth="1px" stroke="#DC5A6E" />
                </svg>
                
                {/* Tooltip for March (hover state) */}
                <div className="absolute top-8 left-2/5 transform -translate-x-1/2 -translate-y-full">
                  <div className="bg-white rounded-lg  border border-gray-200 p-2 text-xs">
                    <div className="font-semibold text-gray-900">March</div>
                    <div className="text-[#3AD6F2]">New Client: 22</div>
                    <div className="text-[#DC5A6E]">Lost Client: 3</div>
                  </div>
                  {/* Tooltip connector line */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-px h-2 bg-gray-300 border-dotted border-l"></div>
                  {/* Data point circle */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-1 w-1 h-1 bg-white rounded-full border border-gray-300"></div>
                </div>
              </div>
              
              {/* X-axis labels */}
              <div className="absolute bottom-0 left-11 right-4 flex justify-between text-xs text-gray-500">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Segmentation Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Client Segmentation</h3>
          <p className="text-sm text-gray-600">Revenue and client distribution by segment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Donut Chart */}
          <div className="flex items-center justify-center">
            <div className="w-56 h-56 sm:w-64 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Segment List */}
          <div className="space-y-4">
            {clientSegments.map((segment, index) => (
              <div key={index} className="flex items-center justify-between px-2 py-1 border border-[#E8F0FF] rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${segment.color}`}></div>
                  <div>
                    <h6 className="font-medium text-gray-900">{segment.name}</h6>
                    <p className="text-sm text-gray-600">{segment.average}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{segment.value}</div>
                  <div className="text-xs text-gray-500">{segment.info}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
