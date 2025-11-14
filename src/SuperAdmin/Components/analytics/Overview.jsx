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

export default function Overview() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await superAdminAPI.getRevenueInsights({ days: 30 });

        if (response?.success && response?.data) {
          if (isMounted) {
            setInsights(response.data);
          }
        } else {
          throw new Error(response?.message || 'Failed to fetch revenue insights');
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

    fetchInsights();

    return () => {
      isMounted = false;
    };
  }, []);

  const revenueData = useMemo(() => {
    const breakdown = insights?.monthly_breakdown;
    if (!breakdown) return [];

    if (Array.isArray(breakdown.series) && breakdown.series.length) {
      return breakdown.series.map((item) => ({
        month: item.month,
        value: item.revenue ?? 0,
        formattedRevenue: item.formatted_revenue || formatCurrency(item.revenue)
      }));
    }

    const labels = breakdown?.labels ?? [];
    const values = breakdown?.values ?? [];

    return labels.map((label, index) => {
      const value = values[index] ?? 0;
      return {
        month: label,
        value,
        formattedRevenue: formatCurrency(value)
      };
    });
  }, [insights]);

  const revenueSummary = insights?.revenue_summary;
  const filters = insights?.filters;

  const dateRangeLabel = useMemo(() => {
    if (!filters) return 'Last 30 days';
    if (filters.start_date && filters.end_date) {
      return `${filters.start_date} - ${filters.end_date}`;
    }
    if (filters.range_days) {
      return `Last ${filters.range_days} days`;
    }
    return 'Last 30 days';
  }, [filters]);

  const revenueHighlight = insights?.monthly_breakdown?.highlight;

  const topPlan = useMemo(() => {
    if (!Array.isArray(insights?.revenue_by_plan)) {
      return null;
    }
    return [...insights.revenue_by_plan]
      .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))[0] || null;
  }, [insights]);

  const topFirm = useMemo(() => {
    if (!Array.isArray(insights?.top_revenue_firms)) {
      return null;
    }
    return [...insights.top_revenue_firms]
      .sort((a, b) => {
        const rankDiff = (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER);
        if (rankDiff !== 0) {
          return rankDiff;
        }
        return (b.revenue ?? 0) - (a.revenue ?? 0);
      })[0] || null;
  }, [insights]);

  // Data for the second chart (Multi-line Chart)
  const engagementData = [
    {
      month: 'Jan',
      activeUsers: 7200,
      newUsers: 180,
      sessions: 12000
    },
    {
      month: 'Feb',
      activeUsers: 7500,
      newUsers: 220,
      sessions: 12500
    },
    {
      month: 'Mar',
      activeUsers: 7800,
      newUsers: 190,
      sessions: 13000
    },
    {
      month: 'Apr',
      activeUsers: 7600,
      newUsers: 210,
      sessions: 12800
    },
    {
      month: 'May',
      activeUsers: 7680,
      newUsers: 203,
      sessions: 13600
    },
    {
      month: 'Jun',
      activeUsers: 7900,
      newUsers: 240,
      sessions: 13200
    },
    {
      month: 'Jul',
      activeUsers: 8200,
      newUsers: 280,
      sessions: 14000
    }
  ];

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
          <p className="text-xs font-medium text-gray-500 mb-1">Top Plan</p>
          <p className="text-lg font-semibold text-gray-900">
            {topPlan?.label || topPlan?.plan || '—'}
          </p>
          <p className="text-sm text-gray-700">
            {topPlan?.formatted_revenue || formatCurrency(topPlan?.revenue ?? 0)}
          </p>
        </div>
        <div className="bg-white p-4 border border-[#E8F0FF] rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-1">Top Firm</p>
          <p className="text-lg font-semibold text-gray-900">
            {topFirm?.name || '—'}
          </p>
          <p className="text-sm text-gray-700">
            {topFirm?.formatted_revenue || formatCurrency(topFirm?.revenue ?? 0)}
          </p>
          {topFirm && (
            <p className="text-xs text-gray-500 mt-2">
              {formatNumber(topFirm.users)} users • {topFirm.invoice_count || 0} invoices
            </p>
          )}
        </div>
      </div>

      {/* First Chart - Area Chart */}
      <div className="bg-white p-6 transition-all duration-300 ease-in-out" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2" style={{ color: '#3B4A66' }}>Revenue Growth Trend</h3>
          <p className="text-sm" style={{ color: '#3B4A66' }}>Monthly recurring revenue and growth rate over time</p>
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
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-500 border border-dashed border-[#E8F0FF] rounded-lg">
              No revenue trend data available for this period.
            </div>
          )}
        </div>
      </div>

      {/* Second Chart - Multi-line Chart */}
      <div className="bg-white p-6 transition-all duration-300 ease-in-out mb-8" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2" style={{ color: '#3B4A66' }}>User Engagement Metrics</h3>
          <p className="text-sm" style={{ color: '#3B4A66' }}>Daily active users, new registrations, and session data</p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={engagementData}
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
                domain={[0, 16000]}
                ticks={[0, 4000, 8000, 12000, 16000]}
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
              />

              {/* New Users Line - Orange */}
              <Line
                type="monotone"
                dataKey="newUsers"
                stroke="#FF7043"
                strokeWidth={3}
                dot={{ fill: 'white', stroke: '#FF7043', strokeWidth: 3, r: 5 }}
                activeDot={{ r: 7, stroke: '#FF7043', strokeWidth: 2, fill: 'white' }}
              />

              {/* Sessions Line - Green */}
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: 'white', stroke: '#10B981', strokeWidth: 3, r: 5 }}
                activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2, fill: 'white' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
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
              No monthly revenue data available for this period.
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

