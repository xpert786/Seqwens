import React, { useEffect, useMemo, useState } from 'react';
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
import { superAdminAPI, handleAPIError } from '../../utils/superAdminAPI';
import DateRangePicker from '../../../components/DateRangePicker';

const formatCurrency = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(numericValue);
};

const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return String(value);
  return numericValue.toLocaleString();
};

// Format month label for x-axis display
const formatMonthLabel = (label) => {
  if (!label) return '';
  
  const labelStr = String(label).trim();
  
  // Try to parse various formats
  // Format: "Sep 2024" or "September 2024"
  const monthYearMatch = labelStr.match(/(\w+)\s+(\d{4})/i);
  if (monthYearMatch) {
    const monthName = monthYearMatch[1];
    // Get short month name (first 3 letters)
    const shortMonth = monthName.substring(0, 3);
    return shortMonth;
  }
  
  // Format: "2024-09" or "2024-9"
  const dateMatch = labelStr.match(/(\d{4})-(\d{1,2})/);
  if (dateMatch) {
    const monthIndex = parseInt(dateMatch[2]) - 1;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[monthIndex] || labelStr;
  }
  
  // Format: "09/2024" or "9/2024"
  const slashMatch = labelStr.match(/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const monthIndex = parseInt(slashMatch[1]) - 1;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[monthIndex] || labelStr;
  }
  
  // If it's already a short month name, return as is
  const monthAbbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (monthAbbrs.some(abbr => labelStr.toLowerCase().startsWith(abbr.toLowerCase()))) {
    return labelStr.substring(0, 3);
  }
  
  // Return first 3 characters if it looks like a month name
  if (labelStr.length > 3) {
    return labelStr.substring(0, 3);
  }
  
  return labelStr;
};

// Generate last 6 months for dropdown
const getLast6Months = () => {
  const months = [];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
  const currentDate = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    const monthName = monthNames[monthIndex];
    const monthValue = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    
    months.push({
      value: monthValue,
      label: `${monthName} ${year}`,
      shortLabel: monthName
    });
  }
  
  return months;
};

export default function Overview() {
  // Get current month and year for default filter
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, so add 1
  const currentYear = currentDate.getFullYear();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMonth, setFilterMonth] = useState(currentMonth.toString());
  const [filterYear, setFilterYear] = useState(currentYear.toString());
  const [appliedFilterMonth, setAppliedFilterMonth] = useState(currentMonth.toString());
  const [appliedFilterYear, setAppliedFilterYear] = useState(currentYear.toString());
  // Add date range state
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [appliedDateRange, setAppliedDateRange] = useState({ startDate: '', endDate: '' });

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
    // If we have a date range, use that; otherwise, use month/year filters
    if (dateRange.startDate && dateRange.endDate) {
      setAppliedDateRange({ ...dateRange });
      // Clear month/year filters
      setAppliedFilterMonth('');
      setAppliedFilterYear('');
    } else {
      setAppliedFilterMonth(filterMonth);
      setAppliedFilterYear(filterYear);
      // Clear date range
      setAppliedDateRange({ startDate: '', endDate: '' });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = {};
              
        // If we have a date range, use that; otherwise, use month/year filters
        if (appliedDateRange.startDate && appliedDateRange.endDate) {
          params.start_date = appliedDateRange.startDate;
          params.end_date = appliedDateRange.endDate;
        } else if (appliedFilterMonth && appliedFilterYear) {
          params.month = parseInt(appliedFilterMonth);
          params.year = parseInt(appliedFilterYear);
        }
        const response = await superAdminAPI.getPlatformAnalytics(params);

        if (response?.success && response?.data) {
          if (isMounted) {
            setAnalytics(response.data);
          }
        } else {
          throw new Error(response?.message || 'Failed to fetch platform analytics');
        }
      } catch (err) {
        if (isMounted) {
          setError(handleAPIError(err));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [appliedFilterMonth, appliedFilterYear, appliedDateRange]);

  // Process revenue trend data from API
  const revenueData = useMemo(() => {
    if (!analytics?.revenue_trend || !Array.isArray(analytics.revenue_trend)) return [];
    
    return analytics.revenue_trend.map((item) => ({
      month: item.month || '',
      value: item.revenue ?? 0,
      formattedRevenue: formatCurrency(item.revenue ?? 0)
    }));
  }, [analytics]);

  // Get filter info
  const filters = analytics?.filters;
  const dateRangeLabel = useMemo(() => {
    // If we have a custom date range applied, show that
    if (appliedDateRange.startDate && appliedDateRange.endDate) {
      return `${appliedDateRange.startDate} to ${appliedDateRange.endDate}`;
    }
    
    if (!filters) return 'Current Month';
    if (filters.month_label) {
      return filters.month_label;
    }
    return 'Current Month';
  }, [filters, appliedDateRange]);

  // Get KPIs
  const kpis = analytics?.kpis;
  
  // Calculate total revenue from revenue_trend (sum all months if multiple, or use first entry)
  const totalRevenue = useMemo(() => {
    if (!analytics?.revenue_trend || !Array.isArray(analytics.revenue_trend)) {
      return kpis?.monthly_recurring_revenue ?? 0;
    }
    // Sum all revenue values in the trend, or use the first one if only one month
    return analytics.revenue_trend.reduce((sum, item) => sum + (item.revenue ?? 0), 0);
  }, [analytics, kpis]);

  const revenueSummary = {
    total_revenue: totalRevenue,
    formatted_total_revenue: formatCurrency(totalRevenue)
  };

  const revenueHighlight = analytics?.revenue_trend?.[0] ? {
    month: analytics.revenue_trend[0].month || '',
    revenue: analytics.revenue_trend[0].revenue ?? 0,
    formatted_revenue: formatCurrency(analytics.revenue_trend[0].revenue ?? 0)
  } : null;

  // Data for the engagement chart (Multi-line Chart)
  const engagementData = useMemo(() => {
    const engagement = analytics?.engagement;
    if (!engagement) return [];

    const labels = engagement.labels || [];
    const activeUsers = engagement.active_users || [];
    const newUsers = engagement.new_users || [];
    const sessions = engagement.sessions || [];

    // Transform API data into chart format
    return labels.map((label, index) => ({
      month: label,
      activeUsers: activeUsers[index] ?? 0,
      newUsers: newUsers[index] ?? 0,
      sessions: sessions[index] ?? 0
    }));
  }, [analytics]);

  const monthlyRevenueData = revenueData;

  const maxRevenueValue = useMemo(() => {
    return revenueData.reduce((max, item) => Math.max(max, item.value || 0), 0);
  }, [revenueData]);

  // Custom tooltip component for single line charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const formattedRevenue = payload[0].payload?.formattedRevenue || formatCurrency(payload[0].value);
      return (
        <div className="bg-gray-900 text-white rounded-lg shadow-xl p-3 border-0" style={{ minWidth: '140px' }}>
          <div className="text-sm font-semibold mb-1">{label}</div>
          <div className="text-lg font-bold" style={{ color: '#3B82F6' }}>
            {formattedRevenue}
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
        <div className="bg-gray-900 text-white rounded-lg shadow-xl p-3 border-0" style={{ minWidth: '160px' }}>
          <div className="text-sm font-semibold mb-2">{label}</div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm" style={{ color: entry.color }}>
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
      const formattedRevenue =
        payload[0].payload?.formattedRevenue || formatCurrency(payload[0].value);
      return (
        <div className="bg-white rounded-lg shadow-xl p-3 border" style={{ minWidth: '160px' }}>
          <div className="text-sm font-semibold mb-1" style={{ color: '#374151' }}>{label}</div>
          <div className="text-sm" style={{ color: '#374151' }}>
            Total Revenue: {formattedRevenue}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 border border-[#E8F0FF] rounded-lg flex flex-col items-center justify-center h-64">
        <div className="spinner-border text-primary mb-4" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-gray-600 text-sm">Loading analytics overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 border border-red-200 rounded-lg flex flex-col items-center justify-center h-64 text-center">
        <p className="text-red-500 font-semibold mb-2">Unable to load analytics overview</p>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 mb-8">
      {/* Filter Section - Top Right */}
      <div className="flex justify-end items-center gap-2 mb-4">
        <DateRangePicker
          onDateRangeChange={(newDateRange) => setDateRange(newDateRange)}
          initialStartDate={dateRange.startDate}
          initialEndDate={dateRange.endDate}
        />
        <button
          onClick={handleApplyFilter}
          disabled={!(dateRange.startDate && dateRange.endDate)}
          className="px-4 py-1.5 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#3B82F6' }}
        >
          Apply
        </button>
        {(dateRange.startDate && dateRange.endDate) && (
          <button
            onClick={() => {
              setDateRange({ startDate: '', endDate: '' });
              setAppliedDateRange({ startDate: '', endDate: '' });
            }}
            className="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800"
            title="Clear filter"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 border border-[#E8F0FF] rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-1">Total Revenue ({dateRangeLabel})</p>
          <p className="text-2xl font-bold text-gray-900">
            {revenueSummary?.formatted_total_revenue || formatCurrency(revenueSummary?.total_revenue ?? 0)}
          </p>
        </div>
        <div className="bg-white p-4 border border-[#E8F0FF] rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-1">Highlighted Month</p>
          <p className="text-lg font-semibold text-gray-900">
            {revenueHighlight?.month || '—'}
          </p>
          <p className="text-sm text-gray-700">
            {revenueHighlight?.formatted_revenue || formatCurrency(revenueHighlight?.revenue ?? 0)}
          </p>
        </div>
        <div className="bg-white p-4 border border-[#E8F0FF] rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-1">Active Firms</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatNumber(kpis?.active_firms ?? 0)}
          </p>
        </div>
        <div className="bg-white p-4 border border-[#E8F0FF] rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-1">Total Users</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatNumber(kpis?.total_users ?? 0)}
          </p>
          <p className="text-sm text-gray-700">
            Churn Rate: {kpis?.churn_rate?.toFixed(1) ?? '0.0'}%
          </p>
        </div>
      </div>

      {/* First Chart - Area Chart */}
      <div className="bg-white p-6 transition-all duration-300 ease-in-out" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
        <div className="mb-6">
          <div>
            <h3 className="text-md font-semibold mb-2" style={{ color: '#3B4A66' }}>Revenue Growth Trend</h3>
            <p className="text-sm" style={{ color: '#3B4A66' }}>Monthly recurring revenue and growth rate over time</p>
          </div>
        </div>

        <div className="h-80">
          {revenueData.length > 0 ? (
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
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.3} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                  tickFormatter={(value) => formatMonthLabel(value)}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                  domain={[0, maxRevenueValue > 0 ? Math.ceil(maxRevenueValue * 1.1) : 1]}
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
                  connectNulls={false}
                  isAnimationActive={true}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-500 border border-dashed border-[#E8F0FF] rounded-lg">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Second Chart - Multi-line Chart */}
      <div className="bg-white p-6 transition-all duration-300 ease-in-out mb-8" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2" style={{ color: '#3B4A66' }}>User Engagement Metrics</h3>
          <p className="text-sm" style={{ color: '#3B4A66' }}>Active users, new registrations, and session data by month</p>
        </div>

        <div className="h-80">
          {engagementData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={engagementData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
                style={{ filter: 'drop-shadow(0 0 0 transparent)' }}
              >
              <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.3} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                tickFormatter={(value) => formatMonthLabel(value)}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                domain={[0, 'auto']}
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
                connectNulls={false}
                isAnimationActive={true}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* New Users Line - Orange */}
              <Line
                type="monotone"
                dataKey="newUsers"
                stroke="#FF7043"
                strokeWidth={3}
                dot={{ fill: 'white', stroke: '#FF7043', strokeWidth: 3, r: 5 }}
                activeDot={{ r: 7, stroke: '#FF7043', strokeWidth: 2, fill: 'white' }}
                connectNulls={false}
                isAnimationActive={true}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Sessions Line - Green */}
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: 'white', stroke: '#10B981', strokeWidth: 3, r: 5 }}
                activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2, fill: 'white' }}
                connectNulls={false}
                isAnimationActive={true}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </LineChart>
          </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-500 border border-dashed border-[#E8F0FF] rounded-lg">
              No data available
            </div>
          )}
        </div>

        {/* Legend */}
        {engagementData.length > 0 && (
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
              <span className="text-sm" style={{ color: '#3B4A66' }}>Active Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF7043' }}></div>
              <span className="text-sm" style={{ color: '#3B4A66' }}>New Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
              <span className="text-sm" style={{ color: '#3B4A66' }}>Sessions</span>
            </div>
          </div>
        )}
      </div>

      {/* Third Chart - Bar Chart */}
      <div className="bg-white p-6 transition-all duration-300 ease-in-out mb-8" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2" style={{ color: '#3B4A66' }}>Monthly Revenue Breakdown</h3>
          <p className="text-sm" style={{ color: '#3B4A66' }}>Detailed revenue analysis by subscription plan.</p>
        </div>

        <div className="h-80">
          {monthlyRevenueData.length > 0 ? (
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
                  tickFormatter={(value) => formatMonthLabel(value)}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                  domain={[0, maxRevenueValue > 0 ? Math.ceil(maxRevenueValue * 1.1) : 1]}
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
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-500 border border-dashed border-[#E8F0FF] rounded-lg">
              No data available
            </div>
          )}
        </div>

        {monthlyRevenueData.length > 0 && (
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#4285F4' }}></div>
              <span className="text-sm" style={{ color: '#3B4A66' }}>Total Revenue</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

