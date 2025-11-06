import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function PerformanceTab() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  // Format data for Recharts - each month is an object with all series values
  // Pattern: Increase Jan→Feb, slight dip in Mar, rise to peak in Apr, maintain through May-Jun
  const chartData = months.map((month, index) => {
    const dataPoint = { month };
    
    // Meetings - Red (Top line): ~92.5 → ~95 → dip → ~97 → maintain
    dataPoint['Meetings'] = [92.5, 95, 94, 97, 97, 97][index];
    
    // Tax Prep - Light blue (Second from top): ~88.5 → ~90 → dip → ~91 → maintain
    dataPoint['Tax Prep'] = [88.5, 90, 89, 91, 91, 91][index];
    
    // Doc Review - Orange/Brown (Middle): ~87 → ~89.5 → dip → ~90 → maintain
    dataPoint['Doc Review'] = [87, 89.5, 88.5, 90, 90, 90][index];
    
    // Follow-ups - Green (Second from bottom): ~84 → ~86 → dip → ~88 → maintain
    dataPoint['Follow-ups'] = [84, 86, 85, 88, 88, 88][index];
    
    // Tax Planning - Yellow (Bottom): ~82 → ~84 → dip → ~86 → maintain
    dataPoint['Tax Planning'] = [82, 84, 83, 86, 86, 86][index];
    
    return dataPoint;
  });

  // Legend data - matching image description
  const legendData = [
    { name: 'Tax Prep', color: '#60A5FA', current: 90 },
    { name: 'Follow-ups', color: '#22C55E', current: 80 },
    { name: 'Doc Review', color: '#FB923C', current: 90 },
    { name: 'Tax Planning', color: '#FACC15', current: 80 },
    { name: 'Meetings', color: '#EF4444', current: 90 },
    { name: 'Overall', color: '#1E40AF', current: 90 }
  ];

  return (
    <div className="bg-white rounded-xl !border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">Current Tasks (3)</h5>
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">Active tasks and their progress</p>
        </div>
        <div className="relative">
          <select className="px-4 py-2 text-sm font-medium text-[#4A5568] bg-[#F0F4F8] !rounded-lg appearance-none pr-12 font-[BasisGrotesquePro] cursor-pointer hover:bg-[#E2E8F0] transition !border border-[#E8F0FF]">
            <option>Monthly</option>
            <option>Weekly</option>
            <option>Daily</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-[#4A5568]">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex gap-4">
        {/* Chart Area */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="2 2" 
                stroke="#E5E7EB" 
                vertical={true}
                horizontal={true}
              />
              <XAxis 
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'BasisGrotesquePro' }}
                interval={0}
              />
              <YAxis 
                domain={[75, 100]}
                ticks={[75, 82, 89, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'BasisGrotesquePro' }}
                width={30}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontFamily: 'BasisGrotesquePro'
                }}
              />
              
              {/* Meetings - Red (Top) */}
              <Line
                type="monotone"
                dataKey="Meetings"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: '#EF4444', strokeWidth: 2, stroke: 'white', r: 3 }}
                activeDot={{ r: 5 }}
              />
              
              {/* Tax Prep - Light Blue (Second from top) */}
              <Line
                type="monotone"
                dataKey="Tax Prep"
                stroke="#60A5FA"
                strokeWidth={2}
                dot={{ fill: '#60A5FA', strokeWidth: 2, stroke: 'white', r: 3 }}
                activeDot={{ r: 5 }}
              />
              
              {/* Doc Review - Orange/Brown (Middle) */}
              <Line
                type="monotone"
                dataKey="Doc Review"
                stroke="#FB923C"
                strokeWidth={2}
                dot={{ fill: '#FB923C', strokeWidth: 2, stroke: 'white', r: 3 }}
                activeDot={{ r: 5 }}
              />
              
              {/* Follow-ups - Green (Second from bottom) */}
              <Line
                type="monotone"
                dataKey="Follow-ups"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ fill: '#22C55E', strokeWidth: 2, stroke: 'white', r: 3 }}
                activeDot={{ r: 5 }}
              />
              
              {/* Tax Planning - Yellow (Bottom) */}
              <Line
                type="monotone"
                dataKey="Tax Planning"
                stroke="#FACC15"
                strokeWidth={2}
                dot={{ fill: '#FACC15', strokeWidth: 2, stroke: 'white', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 text-sm font-[BasisGrotesquePro] min-w-[180px] flex-shrink-0">
          {legendData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 flex-shrink-0"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-gray-700 font-[BasisGrotesquePro]">{item.name}:</span>
              <span className="text-gray-900 font-semibold font-[BasisGrotesquePro]">{item.current}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

