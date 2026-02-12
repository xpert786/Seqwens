import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts';
import TabNavigation from '../Integrations/TabNavigation';
import { firmAdminAnalyticsAPI, firmOfficeAPI } from '../../../ClientOnboarding/utils/apiUtils';

export default function RevenueAnalysis({ activeTab, setActiveTab, tabs, period = '6m' }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taxYear, setTaxYear] = useState(null);
  const [officeId, setOfficeId] = useState('all');
  const [offices, setOffices] = useState([]);
  const [loadingOffices, setLoadingOffices] = useState(false);

  // Fetch offices for filter dropdown
  useEffect(() => {
    async function loadOffices() {
      try {
        setLoadingOffices(true);
        const response = await firmOfficeAPI.listOffices();
        if (response?.success && response?.data?.offices) {
          setOffices(response.data.offices);
        } else if (response?.offices) {
          setOffices(response.offices);
        } else if (Array.isArray(response)) {
          setOffices(response);
        }
      } catch (error) {
        console.error('Failed to load offices:', error);
      } finally {
        setLoadingOffices(false);
      }
    }
    loadOffices();
  }, []);

  // Fetch revenue analytics data
  useEffect(() => {
    async function loadRevenueAnalytics() {
      try {
        setLoading(true);
        setError(null);

        const response = await firmAdminAnalyticsAPI.getRevenueAnalytics(period, taxYear, officeId);

        if (response?.success && response?.data) {
          setAnalyticsData(response.data);
        } else {
          throw new Error(response?.message || 'Failed to load revenue analytics data');
        }
      } catch (error) {
        console.error('Failed to load revenue analytics:', error);
        setError(error.message || 'Failed to load revenue analytics data.');
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    }

    loadRevenueAnalytics();
  }, [period, taxYear, officeId]);

  // Custom tooltip for Revenue chart
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

  // Custom tooltip for Fees chart
  const FeesTooltip = ({ active, payload, label }) => {
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

  // Extract KPIs from API data
  const kpiData = analyticsData?.kpis ? [
    {
      title: 'Gross Revenue',
      value: analyticsData.kpis.gross_revenue?.formatted || '$0',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Fees Collected',
      value: analyticsData.kpis.fees_collected?.formatted || '$0',
      subtitle: analyticsData.kpis.fees_collected?.subtitle || analyticsData.kpis.fees_collected?.collection_rate_formatted || '',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21M22 21V19C21.9993 18.1137 21.7044 17.2528 21.1614 16.5523C20.6184 15.8519 19.8581 15.3516 19 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Outstanding',
      value: analyticsData.kpis.outstanding?.formatted || '$0',
      subtitle: analyticsData.kpis.outstanding?.subtitle || '',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },

    {
      title: 'Fees (Bank + Software)',
      value: analyticsData.kpis.fees?.formatted || '$0',
      subtitle: analyticsData.kpis.fees?.subtitle || '',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Net Profit',
      value: analyticsData.kpis.net_profit?.formatted || '$0',
      subtitle: analyticsData.kpis.net_profit?.subtitle || '',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 7L14.2071 14.7929C13.8166 15.1834 13.1834 15.1834 12.7929 14.7929L9.20711 11.2071C8.81658 10.8166 8.18342 10.8166 7.79289 11.2071L2 17M22 7H16M22 7V13" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
  ] : [];

  // Prepare revenue trend chart data
  const revenueTrendData = analyticsData?.revenue_profit_trend?.map(item => ({
    month: item.month,
    monthFull: item.month_full,
    paid: item.paid || 0,
    pending: item.pending || 0,
    overdue: item.overdue || 0,
    total: item.total || 0
  })) || [];

  // Prepare fees by office chart data
  const feesByOfficeData = analyticsData?.fees_by_office?.map(item => ({
    officeName: item.office_name || `Office ${item.office_id}`,
    feesCollected: item.fees_collected || 0,
    netProfit: item.net_profit || 0
  })) || [];

  // Generate tax year options (current year and past 5 years)
  // Generate tax year options from API metadata or default to current year and past 5 years
  const currentYear = new Date().getFullYear();
  let taxYearOptions = [];

  if (analyticsData?.metadata?.available_tax_years && analyticsData.metadata.available_tax_years.length > 0) {
    taxYearOptions = analyticsData.metadata.available_tax_years;
  } else {
    for (let i = 0; i < 6; i++) {
      taxYearOptions.push(currentYear - i);
    }
  }

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading revenue analytics data...</div>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 sm:mb-8">
        {kpiData.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg border-1 border-[#E8F0FF] p-4 sm:p-6 h-[140px] sm:h-[160px]">
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
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col 2xl:flex-row 2xl:justify-between 2xl:items-center space-y-4 2xl:space-y-0">
          <div className="w-full 2xl:w-auto 2xl:flex-none">
            <TabNavigation
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Tab-specific filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full 2xl:w-auto 2xl:ml-4">
            {/* Tax Year Filter */}
            <div className="relative w-full sm:w-40">
              <select
                value={taxYear || ''}
                onChange={(e) => setTaxYear(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full appearance-none text-[#3B4A66] bg-white border-1 border-[#E8F0FF] rounded-lg px-3 sm:px-4 py-2 pr-8 text-sm focus:outline-none"
              >
                <option value="">All Tax Years</option>
                {taxYearOptions.map(year => (
                  <option key={year} value={year}>Tax Year {year}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Office Filter */}
            <div className="relative w-full sm:w-48">
              <select
                value={officeId}
                onChange={(e) => setOfficeId(e.target.value)}
                className="w-full appearance-none text-[#3B4A66] bg-white border-1 border-[#E8F0FF] rounded-lg px-3 sm:px-4 py-2 pr-8 text-sm focus:outline-none"
                disabled={loadingOffices}
              >
                <option value="all">All Offices</option>
                {offices.map(office => (
                  <option key={office.id} value={office.id}>
                    {office.name || office.office_name || `Office ${office.id}`}
                  </option>
                ))}
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
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue Trend</h3>
          <p className="text-sm text-gray-600">Revenue breakdown by invoice status</p>
        </div>
        <div className="h-80 sm:h-96">
          {revenueTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={revenueTrendData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
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
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<RevenueTooltip />} />

                {/* Stacked Bars for Revenue Status */}
                <Bar dataKey="paid" stackId="a" fill="#10B981" name="Paid Revenue" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending Revenue" radius={[0, 0, 0, 0]} />
                <Bar dataKey="overdue" stackId="a" fill="#EF4444" name="Overdue Revenue" radius={[4, 4, 0, 0]} />

                {/* Total Revenue Line */}
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} name="Total Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-500">
              No revenue trend data available
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#10B981] rounded"></div>
            <span>Paid Revenue</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#F59E0B] rounded"></div>
            <span>Pending Revenue</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#EF4444] rounded"></div>
            <span>Overdue Revenue</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-[#3B82F6]"></div>
            <span>Total Revenue</span>
          </div>
        </div>
      </div>

      {/* Fees Collected Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Fees Collected</h3>
          <p className="text-sm text-gray-600">Total collected vs outstanding in the selected time range.</p>
        </div>
        <div className="h-72 sm:h-80">
          {feesByOfficeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={feesByOfficeData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
                <XAxis
                  dataKey="officeName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<FeesTooltip />} />

                {/* Bars */}
                <Bar dataKey="feesCollected" fill="#3B82F6" name="Fees Collected" radius={[4, 4, 0, 0]} />

                {/* Net Profit Line */}
                <Line type="monotone" dataKey="netProfit" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} name="Net Profit" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-500">
              No fees data available
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-[#10B981]"></div>
            <span>Net Profit</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#3B82F6] rounded"></div>
            <span>Fees Collected</span>
          </div>
        </div>
      </div>
    </>
  );
}
