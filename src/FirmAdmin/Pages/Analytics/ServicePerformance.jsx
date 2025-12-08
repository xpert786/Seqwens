import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import TabNavigation from '../Integrations/TabNavigation';
import { useFirmSettings } from '../../Context/FirmSettingsContext';
import { firmAdminAnalyticsAPI, firmOfficeAPI } from '../../../ClientOnboarding/utils/apiUtils';

export default function ServicePerformance({ activeTab, setActiveTab, tabs, period = '6m' }) {
  const { advancedReportingEnabled } = useFirmSettings();
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

  // Fetch service performance analytics data
  useEffect(() => {
    async function loadServicePerformance() {
      try {
        setLoading(true);
        setError(null);

        const response = await firmAdminAnalyticsAPI.getServicePerformance(period, taxYear, officeId);
        
        if (response?.success && response?.data) {
          setAnalyticsData(response.data);
        } else {
          throw new Error(response?.message || 'Failed to load service performance analytics data');
        }
      } catch (error) {
        console.error('Failed to load service performance analytics:', error);
        setError(error.message || 'Failed to load service performance analytics data.');
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    }

    loadServicePerformance();
  }, [period, taxYear, officeId]);

  // Extract KPIs from API data
  const kpiData = analyticsData?.kpis ? [
    {
      title: 'Total Revenue',
      value: analyticsData.kpis.total_revenue?.formatted || '$0'
    },
    {
      title: 'Avg Turnaround',
      value: analyticsData.kpis.avg_turnaround?.formatted || '0 days'
    },
    {
      title: 'Upsell Rate',
      value: analyticsData.kpis.upsell_rate?.formatted || '0%'
    },
    {
      title: 'Top Satisfaction',
      value: analyticsData.kpis.top_satisfaction?.formatted || analyticsData.kpis.top_satisfaction?.service ? `${analyticsData.kpis.top_satisfaction.service} - ${analyticsData.kpis.top_satisfaction.satisfaction}%` : 'N/A'
    }
  ] : [];

  // Prepare service adoption heatmap data - transform API response to chart format
  const serviceAdoptionHeatmap = analyticsData?.service_adoption_heatmap || [];
  
  // Get all unique months from the heatmap data (sorted chronologically)
  const getMonths = () => {
    if (serviceAdoptionHeatmap.length === 0) return [];
    const firstService = serviceAdoptionHeatmap[0];
    if (firstService?.months) {
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const months = Object.keys(firstService.months);
      // Sort months according to standard order
      return months.sort((a, b) => {
        const indexA = monthOrder.indexOf(a);
        const indexB = monthOrder.indexOf(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    return [];
  };

  const months = getMonths();

  // Transform heatmap data to row format for display
  const serviceAdoptionData = months.map(month => {
    const row = { month };
    serviceAdoptionHeatmap.forEach(serviceItem => {
      if (serviceItem.months && serviceItem.months[month] !== undefined) {
        // Use service name as key (with spaces replaced for safe property access)
        const serviceKey = serviceItem.service
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
        row[serviceKey] = serviceItem.months[month];
      }
    });
    return row;
  });

  // Prepare upsell performance data
  const upsellData = analyticsData?.upsell_performance?.map(item => ({
    service: item.service,
    rate: item.upsell_rate || 0
  })) || [];

  // Prepare turnaround time data
  const turnaroundData = analyticsData?.avg_turnaround_time?.map(item => ({
    service: item.service,
    days: item.avg_turnaround_days || 0
  })) || [];

  // Prepare conversion funnel data for scatter chart
  const conversionFunnel = analyticsData?.conversion_funnel;
  const conversionData = conversionFunnel ? [
    { 
      completion: conversionFunnel.conversion_percentage || 0, 
      satisfaction: conversionFunnel.satisfaction_percentage || 0, 
      size: 100 
    }
  ] : [];

  // Generate tax year options (current year and past 5 years)
  const currentYear = new Date().getFullYear();
  const taxYearOptions = [];
  for (let i = 0; i < 6; i++) {
    taxYearOptions.push(currentYear - i);
  }

  // Custom Tooltips
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg text-xs">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const ScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg text-xs">
          <p className="font-medium">Completion %: {data.completion}%</p>
          <p className="font-medium">Satisfaction %: {data.satisfaction}%</p>
        </div>
      );
    }
    return null;
  };

  // Helper function to get service key from display name (matches the transformation in serviceAdoptionData)
  const getServiceKey = (serviceName) => {
    return serviceName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  };

  // Get all unique service names for heatmap headers
  const serviceNames = serviceAdoptionHeatmap.map(item => item.service);

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading service performance data...</div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {kpiData.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg border-1 border-[#E8F0FF] p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <p className="text-sm font-thin text-gray-600">{kpi.title}</p>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation with Filters */}
      <div className="flex flex-col 2xl:flex-row 2xl:justify-between 2xl:items-center space-y-4 2xl:space-y-0 mb-6">
        <div className="w-full 2xl:w-fit">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Tab-specific filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full 2xl:w-auto">
          {/* Tax Year Filter */}
          <div className="relative">
            <select 
              value={taxYear || ''}
              onChange={(e) => setTaxYear(e.target.value ? parseInt(e.target.value) : null)}
              className="appearance-none text-[#3B4A66] bg-white border border-[#E8F0FF] rounded-lg px-2 py-1 pr-6 text-xs focus:outline-none min-w-[80px]"
            >
              <option value="">All Years</option>
              {taxYearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-2 h-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Office Filter */}
          <div className="relative">
            <select 
              value={officeId}
              onChange={(e) => setOfficeId(e.target.value)}
              className="appearance-none text-[#3B4A66] bg-white border border-[#E8F0FF] rounded-lg px-2 py-1 pr-6 text-xs focus:outline-none min-w-[100px]"
              disabled={loadingOffices}
            >
              <option value="all">All offices</option>
              {offices.map(office => (
                <option key={office.id} value={office.id}>
                  {office.name || office.office_name || `Office ${office.id}`}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-2 h-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Service Performance Section */}
      <div className="mb-8">
        {/* Service Adoption Heatmap */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h4 className="text-xl font-thin text-[#3B4A66] mb-2">Service Performance</h4>
        <p className="text-sm text-gray-600 mb-6">Revenue and growth by service type</p>
          <h5 className="text-lg font-thin text-[#3B4A66] mb-4">Service Adoption Heatmap</h5>
          {serviceAdoptionData.length > 0 && serviceNames.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="space-y-2 min-w-[800px]">
              {/* Header */}
                <div className={`grid gap-4 py-1 px-3 text-sm font-thin text-gray-600`} style={{ gridTemplateColumns: `150px repeat(${serviceNames.length}, 1fr)` }}>
                <div>Month</div>
                  {serviceNames.map((service) => (
                    <div key={service}>{service}</div>
                  ))}
              </div>
              
              {/* Rows */}
              {serviceAdoptionData.map((row, index) => (
                  <div key={index} className={`grid gap-4 py-2 px-3 border border-[#E8F0FF] rounded-md bg-white`} style={{ gridTemplateColumns: `150px repeat(${serviceNames.length}, 1fr)` }}>
                  <div className="font-medium text-gray-900 flex items-center">{row.month}</div>
                    {serviceNames.map((service) => {
                      const serviceKey = getServiceKey(service);
                      const value = row[serviceKey] || 0;
                      return (
                        <div key={service} className="flex items-center">
                          <div 
                            className="w-20 h-8 rounded flex items-center justify-center text-xs font-medium" 
                         style={{ 
                              backgroundColor: `rgba(59, 130, 246, ${Math.max(0.1, Math.min(1, value / 100))})`,
                              color: value > 30 ? 'white' : 'black'
                            }}
                          >
                            {value}%
                    </div>
                  </div>
                      );
                    })}
                  </div>
                ))}
                    </div>
                  </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-gray-500">
              No service adoption data available
            </div>
          )}
        </div>

        {/* Upsell Performance - Full Width */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upsell / Add-On Performance</h3>
            {!advancedReportingEnabled && (
              <button className="text-sm text-blue-600 hover:text-blue-800">Export CSV</button>
            )}
          </div>
          <div className="h-64">
            {upsellData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={upsellData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
                  <XAxis 
                    dataKey="service" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis domain={[0, 'dataMax + 10']} />
                <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rate" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                No upsell performance data available
              </div>
            )}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Turnaround Time */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Avg Turnaround Time (Days)</h3>
            <div className="h-64">
              {turnaroundData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turnaroundData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
                    <XAxis 
                      dataKey="service" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={[0, 'dataMax + 1']} />
                  <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="days" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-500">
                  No turnaround time data available
                </div>
              )}
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Conversion Funnel</h3>
              <button className="text-sm text-[#3B4A66] bg-white border border-[#E8F0FF] px-2 py-1 rounded-full" style={{borderRadius: "7px"}}>View Clients</button>
            </div>
            {conversionFunnel ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Leads</p>
                    <p className="text-2xl font-bold text-gray-900">{conversionFunnel.leads || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Consultations</p>
                    <p className="text-2xl font-bold text-gray-900">{conversionFunnel.consultations || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Paying Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{conversionFunnel.paying_clients || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{conversionFunnel.conversion_percentage?.toFixed(1) || 0}%</p>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Satisfaction Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{conversionFunnel.satisfaction_percentage?.toFixed(1) || 0}%</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-sm text-gray-500">
                No conversion funnel data available
            </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
    