import React, { useEffect, useMemo, useState } from 'react';
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
  Tooltip
} from 'recharts';
import { superAdminAPI, handleAPIError } from '../../utils/superAdminAPI';

const PLAN_COLOR_MAP = {
  solo: '#F59E0B',
  team: '#10B981',
  business: '#F97316',
  professional: '#06B6D4',
  enterprise: '#1E40AF',
  premium: '#8B5CF6'
};

const FALLBACK_COLORS = ['#1E40AF', '#10B981', '#06B6D4', '#F59E0B', '#8B5CF6', '#F97316', '#EF4444'];

const RANGE_OPTIONS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 }
];

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

export default function Revenue() {
  const [selectedRange, setSelectedRange] = useState(30);
  const [reloadKey, setReloadKey] = useState(0);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRevenueInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await superAdminAPI.getRevenueInsights({ days: selectedRange });

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

    fetchRevenueInsights();

    return () => {
      isMounted = false;
    };
  }, [selectedRange, reloadKey]);

  const revenueByPlan = useMemo(() => {
    if (!Array.isArray(insights?.revenue_by_plan)) {
      return [];
    }

    return insights.revenue_by_plan
      .map((item, index) => {
        const planKey = item.plan?.toLowerCase?.();
        const color = PLAN_COLOR_MAP[planKey] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
        const revenueValue = item.revenue ?? 0;

        return {
          name: item.label || item.plan || `Plan ${index + 1}`,
          value: revenueValue,
          formattedRevenue: item.formatted_revenue || formatCurrency(revenueValue),
          percentage: typeof item.percentage === 'number' ? item.percentage : null,
          color
        };
      })
      .sort((a, b) => (b.value || 0) - (a.value || 0));
  }, [insights]);

  const monthlyRevenueData = useMemo(() => {
    const breakdown = insights?.monthly_breakdown;
    if (!breakdown) return [];

    if (Array.isArray(breakdown.series) && breakdown.series.length) {
      return breakdown.series.map((item) => ({
        month: item.month,
        value: item.revenue ?? 0,
        formattedRevenue: item.formatted_revenue || formatCurrency(item.revenue)
      }));
    }

    const labels = breakdown.labels ?? [];
    const values = breakdown.values ?? [];

    return labels.map((label, index) => {
      const value = values[index] ?? 0;
      return {
        month: label,
        value,
        formattedRevenue: formatCurrency(value)
      };
    });
  }, [insights]);

  const topRevenueFirms = useMemo(() => {
    if (!Array.isArray(insights?.top_revenue_firms)) {
      return [];
    }

    return [...insights.top_revenue_firms]
      .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))
      .slice(0, 5);
  }, [insights]);

  const totalRevenue = insights?.revenue_summary?.formatted_total_revenue
    || formatCurrency(insights?.revenue_summary?.total_revenue ?? 0);

  const dateRangeLabel = useMemo(() => {
    const filters = insights?.filters;
    if (!filters) return `Last ${selectedRange} days`;

    if (filters.start_date && filters.end_date) {
      return `${filters.start_date} - ${filters.end_date}`;
    }

    if (filters.range_days) {
      return `Last ${filters.range_days} days`;
    }

    return `Last ${selectedRange} days`;
  }, [insights, selectedRange]);

  const highlightMonth = insights?.monthly_breakdown?.highlight;

  const generatedAt = useMemo(() => {
    if (!insights?.generated_at) return null;
    const date = new Date(insights.generated_at);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
  }, [insights]);

  const maxMonthlyRevenue = useMemo(() => {
    return monthlyRevenueData.reduce((max, item) => Math.max(max, item.value || 0), 0);
  }, [monthlyRevenueData]);

  const handleRetry = () => {
    setReloadKey((count) => count + 1);
  };
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const formattedRevenue = data.payload?.formattedRevenue || formatCurrency(data.value);
      const percentage = data.payload?.percentage;
      return (
        <div className="bg-gray-900 text-white rounded-lg shadow-xl p-3 border-0" style={{ minWidth: '160px' }}>
          <div className="text-sm font-semibold mb-1">{data.name}</div>
          <div className="text-lg font-bold" style={{ color: data.payload?.color || '#1E40AF' }}>
            {formattedRevenue}
          </div>
          {typeof percentage === 'number' && (
            <div className="text-xs mt-1 text-gray-200">
              {percentage.toFixed(2)}%
            </div>
          )}
        </div>
      );
    }
    return null;
  };

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

  const pieData = useMemo(() => {
    return revenueByPlan.filter(item => item.value > 0);
  }, [revenueByPlan]);

  const renderLabel = (props) => {
    const {
      cx, cy, midAngle, outerRadius, fill, name, value, index, payload
    } = props;
    const RADIAN = Math.PI / 180;

    // Calculate radius for start, middle and end of the elbow line
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);

    // Start of the line (on the pie edge)
    const sx = cx + outerRadius * cos;
    const sy = cy + outerRadius * sin;

    // The "elbow" point (further out)
    const mx = cx + (outerRadius + 20) * cos;
    const my = cy + (outerRadius + 20) * sin;

    // The end of the line (horizontal shift)
    const textAnchor = cos > 0 ? 'start' : 'end';
    const ex = mx + (cos > 0 ? 1 : -1) * 15;
    const ey = my;

    const formattedRevenue = payload?.formattedRevenue || formatCurrency(value);
    const displayName = name.length > 15 ? name.substring(0, 15) + '...' : name;

    // To prevent near-identical angles from overlapping,
    // we add a tiny vertical offset based on index if the angle is very flat
    const verticalOffset = Math.abs(sin) < 0.2 ? (index % 2 === 0 ? -8 : 8) : 0;

    return (
      <g>
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey + verticalOffset}`}
          stroke={fill}
          fill="none"
          strokeWidth={1.5}
        />
        <circle cx={ex} cy={ey + verticalOffset} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos > 0 ? 8 : -8)}
          y={ey + verticalOffset}
          fill="#374151"
          textAnchor={textAnchor}
          dominantBaseline="central"
          fontSize="10"
          fontWeight="600"
        >
          {`${displayName}: ${formattedRevenue}`}
        </text>
      </g>
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-6 border border-[#E8F0FF] rounded-lg flex flex-col items-center justify-center h-64">
        <div className="spinner-border text-primary mb-4" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-gray-600 text-sm">Loading revenue insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 border border-red-200 rounded-lg flex flex-col items-center justify-center h-64 text-center">
        <p className="text-red-500 font-semibold mb-2">Unable to load revenue insights</p>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="transition-all duration-500 ease-in-out h-fit mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: '#3B4A66' }}>Revenue Insights</h3>
          <p className="text-sm" style={{ color: '#3B4A66' }}>Detailed revenue analysis and performance across plans</p>
          <p className="text-xs text-gray-500 mt-2">
            Range: {dateRangeLabel}
            {generatedAt ? ` • Generated at ${generatedAt}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedRange(option.value)}
              className={`px-3 py-1 text-xs font-medium transition-all duration-300 ease-in-out ${selectedRange === option.value ? 'text-white' : 'hover:bg-gray-100'
                }`}
              style={{
                backgroundColor: selectedRange === option.value ? '#3B4A66' : 'white',
                color: selectedRange === option.value ? 'white' : '#3B4A66',
                borderRadius: '7px',
                border: '1px solid #E8F0FF'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
        <div className="bg-white border border-[#E8F0FF] rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">{totalRevenue}</p>
          <p className="text-xs text-gray-500 mt-2">Across all subscription plans</p>
        </div>
        <div className="bg-white border border-[#E8F0FF] rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Highlighted Month</p>
          <p className="text-lg font-semibold text-gray-900">
            {highlightMonth?.month || '—'}
          </p>
          <p className="text-sm text-gray-700">
            {highlightMonth?.formatted_revenue || formatCurrency(highlightMonth?.revenue ?? 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {highlightMonth?.start_date && highlightMonth?.end_date
              ? `${highlightMonth.start_date} - ${highlightMonth.end_date}`
              : 'Most recent period'}
          </p>
        </div>
        <div className="bg-white border border-[#E8F0FF] rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Top Plan</p>
          <p className="text-lg font-semibold text-gray-900">
            {revenueByPlan[0]?.name || '—'}
          </p>
          <p className="text-sm text-gray-700">
            {revenueByPlan[0]?.formattedRevenue || '—'}
          </p>
          {typeof revenueByPlan[0]?.percentage === 'number' && (
            <p className="text-xs text-gray-500 mt-2">
              {revenueByPlan[0].percentage.toFixed(2)}% of total revenue
            </p>
          )}
        </div>
        <div className="bg-white border border-[#E8F0FF] rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Top Firm</p>
          <p className="text-lg font-semibold text-gray-900">
            {topRevenueFirms[0]?.name || '—'}
          </p>
          <p className="text-sm text-gray-700">
            {topRevenueFirms[0]?.formatted_revenue || formatCurrency(topRevenueFirms[0]?.revenue ?? 0)}
          </p>
          {topRevenueFirms[0] && (
            <p className="text-xs text-gray-500 mt-2">
              {formatNumber(topRevenueFirms[0].users)} users • {topRevenueFirms[0].invoice_count || 0} invoices
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 h-fit" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2" style={{ color: '#3B4A66' }}>Revenue By Plan</h3>
            <p className="text-sm" style={{ color: '#3B4A66' }}>Distribution of revenue across subscription plans.</p>
          </div>

          {revenueByPlan.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={renderLabel}
                    outerRadius={85}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {revenueByPlan.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-gray-500 border border-dashed border-[#E8F0FF] rounded-lg">
              No revenue data available for this period.
            </div>
          )}

          <div className="mt-6 space-y-3">
            {revenueByPlan.length > 0 ? (
              revenueByPlan.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm font-medium" style={{ color: '#3B4A66' }}>{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: '#3B4A66' }}>
                    {item.formattedRevenue}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center">No plan revenue breakdown to display.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2" style={{ color: '#3B4A66' }}>Top Revenue Generating Firms</h3>
            <p className="text-sm" style={{ color: '#3B4A66' }}>Highest revenue firms and their growth rates.</p>
          </div>

          <div className="space-y-4">
            {topRevenueFirms.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4">
                No firm revenue data available for this period.
              </div>
            )}
            {topRevenueFirms.map((firm) => {
              const growthValue = Number(firm.growth_percentage ?? 0);
              const isPositive = Number.isFinite(growthValue) ? growthValue >= 0 : true;
              const growthColor = isPositive ? '#10B981' : '#EF4444';
              const GrowthIcon = isPositive ? ArrowgreenIcon : RedDownIcon;
              const growthLabel = Number.isFinite(growthValue)
                ? `${growthValue >= 0 ? '+' : ''}${growthValue.toFixed(1)}%`
                : '—';
              return (
                <div key={`${firm.rank}-${firm.firm_id}-${firm.name}`} className="p-2 rounded-lg border border-[#E8F0FF]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: '#3B4A66' }}>
                        {firm.rank ?? '-'}
                      </span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#3B4A66' }}>{firm.name}</p>
                        <p className="text-xs" style={{ color: '#6B7280' }}>{formatNumber(firm.users)} users</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold" style={{ color: '#3B4A66' }}>
                        {firm.formatted_revenue || formatCurrency(firm.revenue)}
                      </p>
                      <div className="flex items-center gap-1 justify-end">
                        <GrowthIcon />
                        <span className="text-xs font-medium" style={{ color: growthColor }}>
                          {growthLabel}
                        </span>
                      </div>
                      <p className="text-[10px]" style={{ color: '#6B7280' }}>
                        {firm.invoice_count || 0} invoices
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 mb-8" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2" style={{ color: '#3B4A66' }}>Monthly Revenue Breakdown</h3>
          <p className="text-sm" style={{ color: '#3B4A66' }}>Detailed revenue analysis by subscription plan.</p>
        </div>

        {monthlyRevenueData.length > 0 ? (
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
                  domain={[0, maxMonthlyRevenue > 0 ? Math.ceil(maxMonthlyRevenue * 1.1) : (monthlyRevenueData.length > 0 ? 1 : 0)]}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar
                  dataKey="value"
                  fill="#4285F4"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-sm text-gray-500 border border-dashed border-[#E8F0FF] rounded-lg">
            No monthly revenue data available for this period.
          </div>
        )}

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

