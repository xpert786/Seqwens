import React from 'react';
import { ArrowgreenIcon, RedDownIcon } from '../icons';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

export default function Revenue() {
  // Pie chart data with exact values from the image
  const pieData = [
    { name: 'Enterprise', value: 113480, color: '#1E40AF' },
    { name: 'Team', value: 78450, color: '#10B981' },
    { name: 'Professional', value: 70020, color: '#06B6D4' },
    { name: 'Solo', value: 22800, color: '#F59E0B' }
  ];

  // Data for Monthly Revenue bar chart
  const monthlyRevenueData = [
    { month: 'Jan', value: 240000 },
    { month: 'Feb', value: 260000 },
    { month: 'Mar', value: 270000 },
    { month: 'Apr', value: 275000 },
    { month: 'May', value: 285000 },
    { month: 'Jun', value: 300000 }
  ];

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-900 text-white rounded-lg shadow-xl p-3 border-0" style={{minWidth: '160px'}}>
          <div className="text-sm font-semibold mb-1">{data.name}</div>
          <div className="text-lg font-bold" style={{color: data.payload.color}}>
            ${data.value.toLocaleString()}.00
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for bar chart
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

  // Custom label function to show values outside the pie with connecting lines
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
          {`${entry.name}: $${entry.value.toLocaleString()}`}
        </text>
      </g>
    );
  };

  return (
    <div className="transition-all duration-500 ease-in-out h-fit mb-8">
      {/* Revenue By Plan and Top Revenue Generating Firms */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Revenue By Plan - Pie Chart */}
        <div className="bg-white p-6 h-fit" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>Revenue By Plan</h3>
            <p className="text-sm" style={{color: '#3B4A66'}}>Distribution of revenue across subscription plans.</p>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
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
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
              
          {/* Legend */}
          <div className="space-y-3 mt-6">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{backgroundColor: item.color}}></div>
                  <span className="text-sm font-medium" style={{color: '#3B4A66'}}>{item.name}</span>
                </div>
                <span className="text-sm font-semibold" style={{color: '#3B4A66'}}>
                  ${item.value.toLocaleString()}.00
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Top Revenue Generating Firms */}
        <div className="bg-white p-6" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>Top Revenue Generating Firms</h3>
            <p className="text-sm" style={{color: '#3B4A66'}}>Highest revenue firms and their growth rates.</p>
          </div>
          
          <div className="space-y-4">
            {/* Firm 1 */}
            <div className="p-2  rounded-lg border border-[#E8F0FF]" >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold mr-2" style={{color: '#3B4A66'}}>1.</span>
                  <div>
                    <p className="text-xs font-semibold" style={{color: '#3B4A66'}}>Elite CPA Group</p>
                    <p className="text-xs" style={{color: '#6B7280'}}>45 users</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{color: '#3B4A66'}}>$3,340.00</p>
                  <div className="flex items-center gap-1">
                    <ArrowgreenIcon />
                    <span className="text-xs font-medium" style={{color: '#10B981'}}>+25.3%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Firm 2 */}
            <div className="p-2  rounded-lg border border-[#E8F0FF]" >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{color: '#3B4A66'}}>2.</span>
                  <div>
                    <p className="text-xs font-semibold" style={{color: '#3B4A66'}}>Johnson & Associates</p>
                    <p className="text-xs" style={{color: '#6B7280'}}>15 users</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{color: '#3B4A66'}}>$2,999.00</p>
                  <div className="flex items-center gap-1">
                    <ArrowgreenIcon />
                    <span className="text-xs font-medium" style={{color: '#10B981'}}>+18.7%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Firm 3 */}
            <div className="p-2  rounded-lg border border-[#E8F0FF]" >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{color: '#3B4A66'}}>3.</span>
                  <div>
                    <p className="text-xs font-semibold" style={{color: '#3B4A66'}}>Metro Tax Services</p>
                    <p className="text-xs" style={{color: '#6B7280'}}>8 users</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{color: '#3B4A66'}}>$1,499.00</p>
                  <div className="flex items-center gap-1">
                    <ArrowgreenIcon />
                    <span className="text-xs font-medium" style={{color: '#10B981'}}>+12.4%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Firm 4 */}
            <div className="p-2  rounded-lg border border-[#E8F0FF]" >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{color: '#3B4A66'}}>4.</span>
                  <div>
                    <p className="text-xs font-semibold" style={{color: '#3B4A66'}}>Coastal Accounting</p>
                    <p className="text-xs" style={{color: '#6B7280'}}>1 user</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{color: '#3B4A66'}}>$499.00</p>
                  <div className="flex items-center gap-1">
                    <RedDownIcon />
                    <span className="text-xs font-medium" style={{color: '#EF4444'}}>-2.1%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Firm 5 */}
            <div className="p-2  rounded-lg border border-[#E8F0FF]" >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{color: '#3B4A66'}}>5.</span>
                  <div>
                    <p className="text-xs font-semibold" style={{color: '#3B4A66'}}>Downtown Tax Pro</p>
                    <p className="text-xs" style={{color: '#6B7280'}}>22 users</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{color: '#3B4A66'}}>$2,999.00</p>
                  <div className="flex items-center gap-1">
                    <ArrowgreenIcon />
                    <span className="text-xs font-medium" style={{color: '#10B981'}}>+15.8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Breakdown - Bar Chart */}
      <div className="bg-white p-6 mb-8" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
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

