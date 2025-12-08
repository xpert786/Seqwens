import React, { useState, useEffect } from 'react';
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
import { superAdminAPI, handleAPIError } from '../../utils/superAdminAPI';
import { toast } from 'react-toastify';
import { superToastOptions } from '../../utils/toastConfig';

export default function FirmPerformance() {
  // Get current month and year for default filter
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, so add 1
  const currentYear = currentDate.getFullYear();

  const [filterMonth, setFilterMonth] = useState(currentMonth.toString());
  const [filterYear, setFilterYear] = useState(currentYear.toString());
  const [appliedFilterMonth, setAppliedFilterMonth] = useState(currentMonth.toString());
  const [appliedFilterYear, setAppliedFilterYear] = useState(currentYear.toString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // API data state
  const [apiCallsPerFirm, setApiCallsPerFirm] = useState([]);
  const [apiUsageChart, setApiUsageChart] = useState(null);
  const [irsEfileStats, setIrsEfileStats] = useState(null);
  const [clientAdoptionRates, setClientAdoptionRates] = useState(null);

  // Generate month options (1-12)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const date = new Date(2000, monthNum - 1, 1);
    return {
      value: monthNum.toString(),
      label: date.toLocaleString('default', { month: 'short' })
    };
  });

  // Generate year options (current year and 5 years back)
  const currentYearNum = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const year = currentYearNum - i;
    return { value: year.toString(), label: year.toString() };
  });

  // Handle apply filter button click
  const handleApplyFilter = () => {
    setAppliedFilterMonth(filterMonth);
    setAppliedFilterYear(filterYear);
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (appliedFilterMonth && appliedFilterYear) {
        params.month = parseInt(appliedFilterMonth);
        params.year = parseInt(appliedFilterYear);
      }
      const response = await superAdminAPI.getPlatformAnalytics(params);
      
      if (response.success && response.data) {
        // Set API Calls Per Firm table data
        if (response.data.api_calls_per_firm) {
          setApiCallsPerFirm(response.data.api_calls_per_firm.table_data || []);
        }
        
        // Set API Usage Chart data
        if (response.data.api_usage_chart) {
          const chartData = response.data.api_usage_chart.labels.map((label, index) => ({
            month: label,
            calls: response.data.api_usage_chart.data[index] || 0
          }));
          setApiUsageChart({
            data: chartData,
            total: response.data.api_usage_chart.total_this_month,
            totalFormatted: response.data.api_usage_chart.total_this_month_formatted
          });
        }
        
        // Set IRS E-File Stats
        if (response.data.irs_efile_stats) {
          const stats = response.data.irs_efile_stats;
          setIrsEfileStats({
            total: stats.total_submissions,
            accepted: {
              name: stats.accepted?.label || 'Accepted',
              value: stats.accepted?.percentage || 0,
              count: stats.accepted?.count || 0,
              color: '#10B981'
            },
            rejected: {
              name: stats.rejected?.label || 'Rejected',
              value: stats.rejected?.percentage || 0,
              count: stats.rejected?.count || 0,
              color: '#F59E0B'
            }
          });
        }
        
        // Set Client Adoption Rates
        if (response.data.client_adoption_rates) {
          const adoption = response.data.client_adoption_rates;
          const adoptionData = adoption.labels.map((label, index) => ({
            month: label,
            portalLogins: adoption.total_signups[index] || 0,
            documentUploads: adoption.active_clients[index] || 0
          }));
          setClientAdoptionRates(adoptionData);
        }
      }
    } catch (err) {
      console.error('Error fetching platform analytics:', err);
      setError(handleAPIError(err));
      toast.error(handleAPIError(err), superToastOptions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [appliedFilterMonth, appliedFilterYear]);

  // Format number for display
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

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
                {entry.dataKey === 'portalLogins' ? 'Total Signups' : 'Active Clients'}: {entry.value}
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

  // Prepare pie chart data
  const eFileData = irsEfileStats ? [
    { 
      name: irsEfileStats.accepted.name, 
      value: irsEfileStats.accepted.value, 
      color: irsEfileStats.accepted.color 
    },
    { 
      name: irsEfileStats.rejected.name, 
      value: irsEfileStats.rejected.value, 
      color: irsEfileStats.rejected.color 
    }
  ] : [];

  // Get max value for Y-axis
  const getMaxYAxis = (data) => {
    if (!data || data.length === 0) return 300000;
    const max = Math.max(...data.map(d => d.calls || 0));
    return Math.ceil(max * 1.2);
  };

  return (
    <div className="transition-all duration-500 ease-in-out h-fit mb-8">
      {/* Month/Year Filter Selector - Top Right */}
      <div className="mb-6 flex justify-end items-center gap-2">
        <select
          value={filterMonth}
          onChange={(e) => {
            setFilterMonth(e.target.value);
            if (!e.target.value) setFilterYear('');
          }}
          className="px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
        >
          <option value="">All Months</option>
          {monthOptions.map(month => (
            <option key={month.value} value={month.value}>{month.label}</option>
          ))}
        </select>
        <select
          value={filterYear}
          onChange={(e) => {
            setFilterYear(e.target.value);
            if (!e.target.value) setFilterMonth('');
          }}
          className="px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
          disabled={!filterMonth}
        >
          <option value="">Year</option>
          {yearOptions.map(year => (
            <option key={year.value} value={year.value}>{year.label}</option>
          ))}
        </select>
        <button
          onClick={handleApplyFilter}
          disabled={!filterMonth || !filterYear}
          className="px-4 py-1.5 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#3B82F6' }}
        >
          Apply
        </button>
        {(filterMonth && filterYear) && (
          <button
            onClick={() => {
              setFilterMonth('');
              setFilterYear('');
              setAppliedFilterMonth('');
              setAppliedFilterYear('');
            }}
            className="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800"
            title="Clear filter"
          >
            ✕
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-[BasisGrotesquePro]">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline font-[BasisGrotesquePro]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading analytics data...</p>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* API Calls Per Firm Table */}
          {apiCallsPerFirm.length > 0 && (
            <div className="bg-white p-6 mb-8" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>API Calls Per Firm</h3>
                <p className="text-sm" style={{color: '#6B7280'}}>
                  {appliedFilterMonth && appliedFilterYear ? (
                    <>Showing data for {monthOptions.find(m => m.value === appliedFilterMonth)?.label} {appliedFilterYear}</>
                  ) : (
                    <>Showing data for current month</>
                  )}
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full" style={{borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{borderBottom: '1px solid #E8F0FF'}}>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{color: '#3B4A66'}}>Firm Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{color: '#3B4A66'}}>Total Calls</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{color: '#3B4A66'}}>Successful</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{color: '#3B4A66'}}>Failed</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{color: '#3B4A66'}}>Top API Used</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{color: '#3B4A66'}}>Last Call</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiCallsPerFirm.map((firm, index) => (
                      <tr 
                        key={firm.firm_id || index} 
                        style={{
                          borderBottom: index < apiCallsPerFirm.length - 1 ? '1px solid #F3F4F6' : 'none'
                        }}
                        className="hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-sm font-medium" style={{color: '#3B4A66'}}>
                          {firm.firm_name || `Firm ${firm.firm_id}`}
                        </td>
                        <td className="py-3 px-4 text-sm" style={{color: '#6B7280'}}>
                          {firm.total_calls?.toLocaleString() || '0'}
                        </td>
                        <td className="py-3 px-4 text-sm" style={{color: '#10B981'}}>
                          {firm.successful_calls?.toLocaleString() || '0'}
                        </td>
                        <td className="py-3 px-4 text-sm" style={{color: '#EF4444'}}>
                          {firm.failed_calls?.toLocaleString() || '0'}
                        </td>
                        <td className="py-3 px-4 text-sm" style={{color: '#6B7280'}}>
                          {firm.top_api_used || 'N/A'}
                          {firm.top_api_count && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({firm.top_api_count.toLocaleString()})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm" style={{color: '#6B7280'}}>
                          {firm.last_call_time_formatted || firm.last_call_time || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Two Charts Dashboard */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Left Chart - API Usage (Area Chart) */}
            <div className="bg-white p-6 transition-all duration-300 ease-in-out" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>API Usage</h3>
                <p className="text-sm" style={{color: '#3B4A66'}}>
                  {apiUsageChart?.totalFormatted ? (
                    <span className="text-lg font-bold">{apiUsageChart.totalFormatted}</span>
                  ) : (
                    <span className="text-lg font-bold">Loading...</span>
                  )}
                </p>
              </div>
              
              <div className="h-64">
                {apiUsageChart?.data && apiUsageChart.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={apiUsageChart.data}
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
                        domain={[0, getMaxYAxis(apiUsageChart.data)]}
                        tickFormatter={(value) => formatNumber(value)}
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
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 font-[BasisGrotesquePro]">
                    No data available
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Chart - IRS E-File Stats (Pie Chart) */}
            <div className="bg-white p-6 transition-all duration-300 ease-in-out" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>IRS E-File Stats</h3>
                <p className="text-sm" style={{color: '#3B4A66'}}>
                  {irsEfileStats ? (
                    <>Total: {irsEfileStats.total.toLocaleString()} submissions</>
                  ) : (
                    <>Accepted vs. Rejected</>
                  )}
                </p>
              </div>
              
              <div className="h-64">
                {eFileData.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 font-[BasisGrotesquePro]">
                    No data available
                  </div>
                )}
              </div>
              
              {/* Legend */}
              {irsEfileStats && (
                <div className="space-y-3 mt-6">
                  {eFileData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{backgroundColor: item.color}}></div>
                        <span className="text-sm font-medium" style={{color: '#3B4A66'}}>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{color: '#3B4A66'}}>
                          {item.value}%
                        </span>
                        {index === 0 && irsEfileStats.accepted.count && (
                          <span className="text-xs text-gray-500">
                            ({irsEfileStats.accepted.count.toLocaleString()})
                          </span>
                        )}
                        {index === 1 && irsEfileStats.rejected.count && (
                          <span className="text-xs text-gray-500">
                            ({irsEfileStats.rejected.count.toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Client Adoption Rates Double Bar Chart */}
          <div className="bg-white p-6 mb-8" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>Client Adoption Rates</h3>
            </div>
            
            <div className="h-80">
              {clientAdoptionRates && clientAdoptionRates.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={clientAdoptionRates}
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
                    />
                    <Tooltip content={<AdoptionTooltip />} />
                    
                    {/* Total Signups Bar - Blue */}
                    <Bar
                      dataKey="portalLogins"
                      fill="#1E40AF"
                      radius={[4, 4, 0, 0]}
                      name="Total Signups"
                      maxBarSize={30}
                    />
                    
                    {/* Active Clients Bar - Red */}
                    <Bar
                      dataKey="documentUploads"
                      fill="#EF4444"
                      radius={[4, 4, 0, 0]}
                      name="Active Clients"
                      maxBarSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 font-[BasisGrotesquePro]">
                  No data available
                </div>
              )}
            </div>
            
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{backgroundColor: '#1E40AF'}}></div>
                <span className="text-sm" style={{color: '#3B4A66'}}>Total Signups</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{backgroundColor: '#EF4444'}}></div>
                <span className="text-sm" style={{color: '#3B4A66'}}>Active Clients</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
