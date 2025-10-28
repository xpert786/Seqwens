import React from 'react';
import TabNavigation from '../../Components/TabNavigation';

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

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 mb-8">
        {kpiData.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg border-1 border-[#E8F0FF] p-6 h-[160px]">
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
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          {/* Tab-specific filters */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select className="appearance-none text-[#3B4A66] bg-white border-1 border-[#E8F0FF] rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
            
            <div className="relative">
              <select className="appearance-none text-[#3B4A66] bg-white border-1 border-[#E8F0FF] rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue & Profit Trend</h3>
        </div>
        <div className="h-96 relative">
          {/* Chart Container */}
          <div className="absolute inset-0 bg-white rounded-lg">
            {/* Y-axis labels (Left - Money) */}
            <div className="absolute left-0 right-8 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
              <span>38000</span>
              <span>28500</span>
              <span>19000</span>
              <span>9500</span>
              <span>0</span>
            </div>
            
            {/* Y-axis labels (Right - Percentage) */}
            <div className="absolute right-0 left-8 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
              <span>80%</span>
              <span>60%</span>
              <span>40%</span>
              <span>20%</span>
              <span>0%</span>
            </div>
            
            {/* Chart Area */}
            <div className="absolute left-12 right-12 top-4 bottom-8">
              {/* Grid Lines */}
              <div className="absolute inset-0">
                {/* Horizontal grid lines */}
                <div className="absolute top-0 left-0 right-0 h-px border-t border-dashed border-[#E5E7EB]"></div>
                <div className="absolute top-1/4 left-0 right-0 h-px border-t border-dashed border-[#E5E7EB]"></div>
                <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-[#E5E7EB]"></div>
                <div className="absolute top-3/4 left-0 right-0 h-px border-t border-dashed border-[#E5E7EB]"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px border-t border-dashed border-[#E5E7EB]"></div>
                
                {/* Vertical grid lines */}
                <div className="absolute left-0 top-0 bottom-0 w-px border-l border-dashed border-[#E5E7EB]"></div>
                <div className="absolute left-1/5 top-0 bottom-0 w-px border-l border-dashed border-[#E5E7EB]"></div>
                <div className="absolute left-2/5 top-0 bottom-0 w-px border-l border-dashed border-[#E5E7EB]"></div>
                <div className="absolute left-3/5 top-0 bottom-0 w-px border-l border-dashed border-[#E5E7EB]"></div>
                <div className="absolute left-4/5 top-0 bottom-0 w-px border-l border-dashed border-[#E5E7EB]"></div>
                <div className="absolute right-0 top-0 bottom-0 w-px border-l border-dashed border-[#E5E7EB]"></div>
              </div>
              
              {/* Combination Chart */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Stacked Bars - January */}
                <rect x="2" y="26" width="14" height="48" fill="#1E40AF" /> {/* Collected: 23000 */}
                <rect x="2" y="74" width="14" height="13" fill="#3B82F6" /> {/* Outstanding: 5000 */}
                <rect x="2" y="87" width="14" height="5" fill="#EF4444" /> {/* Refund Transfer: 2000 */}
                
                {/* Stacked Bars - February */}
                <rect x="18" y="24" width="14" height="50" fill="#1E40AF" /> {/* Collected: 25000 */}
                <rect x="18" y="74" width="14" height="13" fill="#3B82F6" /> {/* Outstanding: 5000 */}
                <rect x="18" y="87" width="14" height="8" fill="#EF4444" /> {/* Refund Transfer: 3000 */}
                
                {/* Stacked Bars - March */}
                <rect x="34" y="18" width="14" height="56" fill="#1E40AF" /> {/* Collected: 31000 */}
                <rect x="34" y="74" width="14" height="13" fill="#3B82F6" /> {/* Outstanding: 5000 */}
                <rect x="34" y="87" width="14" height="8" fill="#EF4444" /> {/* Refund Transfer: 3000 */}
                
                {/* Stacked Bars - April */}
                <rect x="50" y="20" width="14" height="54" fill="#1E40AF" /> {/* Collected: 29000 */}
                <rect x="50" y="74" width="14" height="13" fill="#3B82F6" /> {/* Outstanding: 5000 */}
                <rect x="50" y="87" width="14" height="8" fill="#EF4444" /> {/* Refund Transfer: 3000 */}
                
                {/* Stacked Bars - May */}
                <rect x="66" y="16" width="14" height="58" fill="#1E40AF" /> {/* Collected: 33000 */}
                <rect x="66" y="74" width="14" height="13" fill="#3B82F6" /> {/* Outstanding: 5000 */}
                <rect x="66" y="87" width="14" height="10" fill="#EF4444" /> {/* Refund Transfer: 5000 */}
                
                {/* Stacked Bars - June */}
                <rect x="82" y="24" width="14" height="50" fill="#1E40AF" /> {/* Collected: 26000 */}
                <rect x="82" y="74" width="14" height="13" fill="#3B82F6" /> {/* Outstanding: 5000 */}
                <rect x="82" y="87" width="14" height="8" fill="#EF4444" /> {/* Refund Transfer: 4000 */}
                
                {/* Net Profit Line (Green) */}
                <path
                  d="M 9,44 L 25,40 L 41,36 L 57,38 L 73,34 L 89,42"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                />
                
                {/* Net Profit Data Points */}
                <circle cx="9" cy="44" r="3" fill="#10B981" />
                <circle cx="25" cy="40" r="3" fill="#10B981" />
                <circle cx="41" cy="36" r="3" fill="#10B981" />
                <circle cx="57" cy="38" r="3" fill="#10B981" />
                <circle cx="73" cy="34" r="3" fill="#10B981" />
                <circle cx="89" cy="42" r="3" fill="#10B981" />
                
                {/* Bank Adoption % Line (Orange) */}
                <path
                  d="M 9,25 L 25,27 L 41,29 L 57,31 L 73,33 L 89,35"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
                
                {/* Bank Adoption Data Points */}
                <circle cx="9" cy="25" r="3" fill="#F97316" />
                <circle cx="25" cy="27" r="3" fill="#F97316" />
                <circle cx="41" cy="29" r="3" fill="#F97316" />
                <circle cx="57" cy="31" r="3" fill="#F97316" />
                <circle cx="73" cy="33" r="3" fill="#F97316" />
                <circle cx="89" cy="35" r="3" fill="#F97316" />
              </svg>
              
              {/* Tooltip for January */}
              <div className="absolute top-8 left-1/6 transform -translate-x-1/2 -translate-y-full">
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-xs shadow-lg">
                  <div className="font-semibold text-gray-900 mb-2">Jan</div>
                  <div className="space-y-1">
                    <div className="text-gray-600">Gross: <span className="font-medium">$28,000</span></div>
                    <div className="text-blue-600">Collected: <span className="font-medium">$23,000</span></div>
                    <div className="text-blue-400">Outstanding: <span className="font-medium">$5,000</span></div>
                    <div className="text-red-500">Refund Transfer: <span className="font-medium">$2,000</span></div>
                    <div className="text-gray-600">Fees (Bank + Software): <span className="font-medium">$1,850</span></div>
                    <div className="text-green-600">Net Profit: <span className="font-medium">$21,150</span></div>
                  </div>
                </div>
                {/* Tooltip connector line */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-px h-2 bg-gray-300 border-dashed border-l"></div>
                {/* Data point circle */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-1 w-1 h-1 bg-white rounded-full border border-gray-300"></div>
              </div>
            </div>
            
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-12 right-12 flex justify-between text-xs text-gray-500">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Fees Collected</h3>
          <p className="text-sm text-gray-600">Total collected vs outstanding in the selected time range.</p>
        </div>
        <div className="h-80 relative">
          {/* Chart Container */}
          <div className="absolute inset-0 bg-white rounded-lg">
            {/* Y-axis labels */}
            <div className="absolute left-0 right-8 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
              <span>28000</span>
              <span>21000</span>
              <span>14000</span>
              <span>7000</span>
              <span>0</span>
            </div>
            
            {/* Chart Area */}
            <div className="absolute left-12 right-4 top-4 bottom-8">
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
              
              {/* Bar Chart */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Office A Bars (Blue) */}
                <rect x="5" y="65" width="12" height="30" fill="#3B82F6" />
                <rect x="25" y="60" width="12" height="35" fill="#3B82F6" />
                <rect x="45" y="55" width="12" height="40" fill="#3B82F6" />
                <rect x="65" y="50" width="12" height="45" fill="#3B82F6" />
                <rect x="85" y="45" width="12" height="50" fill="#3B82F6" />
                
                {/* Office B Bars (Light Purple) */}
                <rect x="5" y="80" width="12" height="15" fill="#8B5CF6" />
                <rect x="25" y="75" width="12" height="20" fill="#8B5CF6" />
                <rect x="45" y="70" width="12" height="25" fill="#8B5CF6" />
                <rect x="65" y="65" width="12" height="30" fill="#8B5CF6" />
                <rect x="85" y="60" width="12" height="35" fill="#8B5CF6" />
                
                {/* Office C Bars (Dark Purple) */}
                <rect x="5" y="90" width="12" height="5" fill="#5B21B6" />
                <rect x="25" y="85" width="12" height="10" fill="#5B21B6" />
                <rect x="45" y="80" width="12" height="15" fill="#5B21B6" />
                <rect x="65" y="75" width="12" height="20" fill="#5B21B6" />
                <rect x="85" y="70" width="12" height="25" fill="#5B21B6" />
                
                {/* Net Profit Line (Green) */}
                <path
                  d="M 11,70 L 31,65 L 51,60 L 71,55 L 91,50"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="1.5"
                />
                
                {/* Net Profit Data Points */}
                <circle cx="11" cy="70" r="2" fill="#10B981" />
                <circle cx="31" cy="65" r="2" fill="#10B981" />
                <circle cx="51" cy="60" r="2" fill="#10B981" />
                <circle cx="71" cy="55" r="2" fill="#10B981" />
                <circle cx="91" cy="50" r="2" fill="#10B981" />
              </svg>
              
              {/* Tooltip for January */}
              <div className="absolute top-8 left-1/5 transform -translate-x-1/2 -translate-y-full">
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-xs shadow-lg">
                  <div className="font-semibold text-gray-900 mb-2">Jan</div>
                  <div className="space-y-1">
                    <div className="text-green-600">Net Profit: <span className="font-medium">19,400</span></div>
                    <div className="text-blue-600">Office A: <span className="font-medium">10000</span></div>
                    <div className="text-purple-600">Office B: <span className="font-medium">9000</span></div>
                    <div className="text-purple-800">Office C: <span className="font-medium">7000</span></div>
                  </div>
                </div>
                {/* Tooltip connector line */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-px h-2 bg-gray-300 border-dotted border-l"></div>
                {/* Data point circle */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-1 w-1 h-1 bg-white rounded-full border border-gray-300"></div>
              </div>
            </div>
            
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-12 right-4 flex justify-between text-xs text-gray-500">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
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
