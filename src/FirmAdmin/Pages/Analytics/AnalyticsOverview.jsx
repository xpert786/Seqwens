import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
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

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-blue-600">${payload[0].value?.toLocaleString() || 0}</p>
        </div>
      );
    }
    return null;
  };

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
      title: 'Total Revenue',
      value: analyticsData.kpis.total_revenue?.formatted || '$0',
      change: analyticsData.kpis.total_revenue?.growth_formatted || '0%',
      isPositive: analyticsData.kpis.total_revenue?.is_positive ?? true,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
      )
    },
    {
      title: 'Active Clients',
      value: analyticsData.kpis.active_clients?.formatted || '0',
      change: analyticsData.kpis.active_clients?.change_formatted || '+0',
      isPositive: analyticsData.kpis.active_clients?.is_positive ?? true,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21M22 21V19C21.9993 18.1137 21.7044 17.2528 21.1614 16.5523C20.6184 15.8519 19.8581 15.3516 19 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
      )
    },
    {
      title: 'Avg. Client Value',
      value: analyticsData.kpis.avg_client_value?.formatted || '$0',
      change: analyticsData.kpis.avg_client_value?.growth_formatted || '0%',
      isPositive: analyticsData.kpis.avg_client_value?.is_positive ?? true,
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
      value: analyticsData.kpis.client_retention?.formatted || '0%',
      change: analyticsData.kpis.client_retention?.growth_formatted || '0%',
      isPositive: analyticsData.kpis.client_retention?.is_positive ?? true,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22 7L14.2071 14.7929C13.8166 15.1834 13.1834 15.1834 12.7929 14.7929L9.20711 11.2071C8.81658 10.8166 8.18342 10.8166 7.79289 11.2071L2 17M22 7H16M22 7V13" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
        <div className="text-gray-500">Loading analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

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
            <div className={`flex items-center text-sm font-medium ${kpi.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.9166 3.79297L7.31242 8.39714L4.60409 5.6888L1.08325 9.20964M11.9166 3.79297H8.66658M11.9166 3.79297L11.9166 7.04297" stroke={kpi.isPositive ? "#32B582" : "#EF4444"} strokeLinecap="round" strokeLinejoin="round"/>
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
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
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
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Client Segmentation</h3>
            <p className="text-sm text-gray-600">Revenue and client distribution by segment</p>
          </div>
          {error && (
            <span className="text-xs text-red-500">{error}</span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* ----------- Donut Chart ----------- */}
          <div className="flex items-center justify-center min-h-[256px] sm:min-h-[320px]">
            <div className="w-full max-w-sm h-64 sm:h-80 relative">
              {loading && chartData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                  Loading segmentation...
                </div>
              ) : chartData.length === 0 ? (
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

          {/* ----------- Segment List ----------- */}
          <div className="space-y-4">
            {loading && clientSegmentsData.length === 0 && (
              <div className="text-sm text-gray-500">Loading segments...</div>
            )}

            {!loading &&
              clientSegmentsData.length === 0 &&
              !error && (
                <div className="text-sm text-gray-500">No segments available.</div>
              )}

            {clientSegmentsData.map((segment, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-2 py-1 border border-[#E8F0FF] rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  ></div>

                  <div>
                    <h6 className="font-medium text-gray-900">{segment.name}</h6>
                    <p className="text-sm text-gray-600">{segment.avgRevenueFormatted} avg</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold text-gray-900">{segment.revenueFormatted}</div>
                  <div className="text-xs text-gray-500">{segment.clientCount} clients</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
