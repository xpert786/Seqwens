import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import TabNavigation from '../Integrations/TabNavigation';
import { firmAdminAnalyticsAPI } from '../../../ClientOnboarding/utils/apiUtils';

export default function AnalyticsOverview({ activeTab, setActiveTab, tabs, period = '6m' }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAnalyticsData() {
      try {
        setLoading(true);
        setError(null);

        const response = await firmAdminAnalyticsAPI.getAnalyticsReports(period);

        if (response?.success && response?.data) {
          setAnalyticsData(response.data);
        } else {
          throw new Error(response?.message || 'Failed to load analytics data');
        }
      } catch (error) {
        console.error('Failed to load analytics data:', error);
        setError(error.message || 'Failed to load analytics data.');
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    }

    loadAnalyticsData();
  }, [period]);

  const RevenueTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-xs shadow-lg">
          <div className="font-semibold text-gray-900 mb-2">{label}</div>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} style={{ color: entry.color }}>
                {entry.name}: <span className="font-medium">${entry.value?.toLocaleString() || 0}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const ClientGrowthTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-xs shadow-lg">
          <div className="font-semibold text-gray-900 mb-2">{label}</div>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} style={{ color: entry.color }}>
                {entry.name}: <span className="font-medium">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Extract KPIs from API data
  const kpiData = analyticsData?.kpis ? [
    {
      title: 'Gross Revenue',
      value: analyticsData.kpis.gross_revenue?.formatted || '$0.00',
      subtext: analyticsData.kpis.gross_revenue?.subtext || 'Billed amount',
      growth: analyticsData.kpis.gross_revenue?.growth,
      isPositive: analyticsData.kpis.gross_revenue?.is_positive,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 1V23" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Fees Collected',
      value: analyticsData.kpis.fees_collected?.formatted || '$0.00',
      subtext: analyticsData.kpis.fees_collected?.subtext || 'Collection Rate 0%',
      growth: analyticsData.kpis.fees_collected?.growth,
      isPositive: analyticsData.kpis.fees_collected?.is_positive,
      icon: (
        <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 17V15C17 13.9391 16.5786 12.9217 15.8284 12.1716C15.0783 11.4214 13.0609 11 12 11H4C2.93913 11 1.92172 11.4214 1.17157 12.1716C0.42143 12.9217 0 13.9391 0 15V17" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 7C10.2091 7 12 5.20914 12 3C12 0.790861 10.2091 -1 8 -1C5.79086 -1 4 0.790861 4 3C4 5.20914 5.79086 7 8 7Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M23 17V15C22.9993 14.1137 22.7044 13.2528 22.1614 12.5523C21.6184 11.8519 20.8581 11.3516 20 11.13" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 -0.87C16.8604 -0.649704 17.623 -0.149298 18.1676 0.552309C18.7122 1.25392 19.0078 2.11683 19.0078 3.005C19.0078 3.89317 18.7122 4.75608 18.1676 5.45769C17.623 6.1593 16.8604 6.6597 16 6.88" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Outstanding',
      value: analyticsData.kpis.outstanding?.formatted || '$0.00',
      subtext: analyticsData.kpis.outstanding?.subtext || 'Unpaid / pending',
      isPositive: analyticsData.kpis.outstanding?.is_positive,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#3AD6F2" strokeWidth="2" />
          <circle cx="12" cy="12" r="6" stroke="#3AD6F2" strokeWidth="2" />
          <circle cx="12" cy="12" r="2" fill="#3AD6F2" />
        </svg>
      )
    },
    {
      title: 'Refund Transfers',
      value: analyticsData.kpis.refund_transfers?.formatted || '$0.00',
      subtext: analyticsData.kpis.refund_transfers?.subtext || 'Bank Adoption 0%',
      growth: 0,
      isPositive: true,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 6H23V12" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Fees (Bank + Software)',
      value: analyticsData.kpis.fees_bank_software?.formatted || '$0.00',
      subtext: analyticsData.kpis.fees_bank_software?.subtext || 'Bank 2% / Software 2.9%',
      isPositive: false,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 1V23" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Net Profit',
      value: analyticsData.kpis.net_profit?.formatted || '$0.00',
      subtext: analyticsData.kpis.net_profit?.subtext || 'After bank & software fees',
      growth: 0,
      isPositive: true,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 6H23V12" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
  ] : [];

  // Prepare revenue trend chart data
  const revenueTrendData = analyticsData?.revenue_trend?.map(item => ({
    month: item.month,
    monthFull: item.month_full,
    revenue: item.revenue || 0,
    expenses: item.expenses || 0,
    profit: item.profit || 0
  })) || [];

  // Prepare client growth chart data
  const clientGrowthData = analyticsData?.client_growth?.map(item => ({
    month: item.month,
    monthFull: item.month_full,
    newClients: item.new_clients || 0,
    lostClients: item.lost_clients || 0,
    retentionRate: item.retention_rate || 0
  })) || [];

  // Prepare client segmentation data
  const clientSegmentsData = analyticsData?.client_segmentation?.segments?.map(seg => ({
    name: seg.name,
    revenue: seg.revenue || 0,
    revenueFormatted: seg.revenue_formatted || '$0',
    clientCount: seg.client_count || 0,
    avgRevenue: seg.avg_revenue || 0,
    avgRevenueFormatted: seg.avg_revenue_formatted || '$0',
    percentage: seg.percentage || 0,
    color: seg.color || '#3b82f6'
  })) || [];

  // Calculate total revenue for percentage calculation if not provided
  const totalRevenue = clientSegmentsData.reduce((sum, seg) => sum + (seg.revenue || 0), 0) ||
    analyticsData?.client_segmentation?.total_revenue || 0;

  const chartData = clientSegmentsData.map(seg => {
    const percentage = seg.percentage || (totalRevenue > 0 ? (seg.revenue / totalRevenue * 100) : 0);
    return {
      name: seg.name,
      value: seg.revenue,
      percentage: percentage,
      color: seg.color
    };
  }).filter(seg => seg.value > 0); // Filter out segments with zero revenue

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 font-medium">Loading analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 bg-red-50 px-4 py-2 rounded-lg border border-red-100">Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      {/* KPI Cards Section - Updated Grid for 6 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 sm:mb-8">
        {kpiData.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg border-1 border-[#E8F0FF] p-4 flex flex-col justify-between h-full min-h-[140px] shadow-sm hover:shadow-md transition-shadow">
            {/* Card Header */}
            <div className="flex justify-between items-start w-full mb-3">
              <div className="text-[13px] text-gray-500 font-semibold tracking-tight leading-tight max-w-[75%]">
                {kpi.title}
              </div>
              <div className="text-[#3AD6F2] flex-shrink-0">
                {kpi.icon}
              </div>
            </div>

            {/* Metric Value & Trend Indicator */}
            <div className="flex items-baseline gap-1.5 mb-1.5 overflow-hidden">
              <span className="text-xl font-bold text-gray-900 truncate">{kpi.value}</span>
              {kpi.growth !== undefined && kpi.growth !== null && (
                <div className={`flex items-center text-[10px] font-bold whitespace-nowrap ${kpi.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.isPositive ? '▲' : '▼'} {Math.abs(kpi.growth).toFixed(1)}%
                </div>
              )}
            </div>

            {/* Subtext Context */}
            <div className="text-[11px] text-gray-400 font-medium line-clamp-1">
              {kpi.subtext}
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
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <p className="text-sm text-gray-600">Monthly revenue, expenses, and profit</p>
          </div>
          <div className="h-56 sm:h-64">
            {revenueTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="1"
                    stroke="#DC5A6E"
                    fill="#DC5A6E"
                    fillOpacity={0.8}
                    name="Expenses"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stackId="1"
                    stroke="#64AAF0"
                    fill="#64AAF0"
                    fillOpacity={0.8}
                    name="Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                No revenue trend data available
              </div>
            )}
          </div>
        </div>

        {/* Client Growth Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Client Growth</h3>
            <p className="text-sm text-gray-600">New vs lost clients and retention rate</p>
          </div>
          <div className="h-56 sm:h-64">
            {clientGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={clientGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <Tooltip content={<ClientGrowthTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="newClients"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 3 }}
                    name="New Clients"
                  />
                  <Line
                    type="monotone"
                    dataKey="lostClients"
                    stroke="#DC5A6E"
                    strokeWidth={2}
                    dot={{ fill: '#DC5A6E', r: 3 }}
                    name="Lost Clients"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                No client growth data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Segmentation Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Client Segmentation</h3>
            <p className="text-sm text-gray-600">Revenue and client distribution by segment</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Donut Chart */}
          <div className="flex items-center justify-center min-h-[256px]">
            <div className="w-full max-w-sm h-64 sm:h-80 relative">
              {chartData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                  No segmentation data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                              <p className="font-medium text-gray-900">{data.name}</p>
                              <p className="text-blue-600 font-semibold">${data.value?.toLocaleString() || 0}</p>
                              <p className="text-gray-500 text-sm">{data.percentage?.toFixed(1) || 0}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Segment List */}
          <div className="space-y-3">
            {clientSegmentsData.length === 0 && (
              <div className="text-sm text-gray-500">No segments available.</div>
            )}

            {clientSegmentsData.map((segment, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-3 py-2 border border-[#E8F0FF] rounded-lg bg-gray-50/50"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  ></div>

                  <div>
                    <h6 className="font-semibold text-sm text-gray-900">{segment.name}</h6>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{segment.avgRevenueFormatted} AVG</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-sm text-gray-900">{segment.revenueFormatted}</div>
                  <div className="text-[10px] text-gray-500">{segment.clientCount} CLIENTS</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
