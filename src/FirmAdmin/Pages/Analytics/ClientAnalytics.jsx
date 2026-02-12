import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart, Line } from 'recharts';
import TabNavigation from '../Integrations/TabNavigation';
import { firmAdminAnalyticsAPI } from '../../../ClientOnboarding/utils/apiUtils';

export default function ClientAnalytics({ activeTab, setActiveTab, tabs, period = '6m' }) {
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const [modalStage, setModalStage] = useState(null);
  const [stageDetails, setStageDetails] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    async function loadClientAnalytics() {
      try {
        setLoading(true);
        setError(null);

        const response = await firmAdminAnalyticsAPI.getClientAnalytics(period);

        if (response?.success && response?.data) {
          setAnalyticsData(response.data);
        } else {
          throw new Error(response?.message || 'Failed to load client analytics data');
        }
      } catch (error) {
        console.error('Failed to load client analytics:', error);
        setError(error.message || 'Failed to load client analytics data.');
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    }

    loadClientAnalytics();
  }, [period]);

  const handleStageClick = async (stage) => {
    setModalStage(stage);
    setShowStageModal(true);
    setModalLoading(true);
    try {
      // Direct API call if the utility is not yet updated or as backup
      const response = await firmAdminAnalyticsAPI.getFunnelStageDetails(stage, period);
      if (response?.success && response?.data) {
        setStageDetails(response.data);
      } else {
        setStageDetails([]);
      }
    } catch (err) {
      console.error('Failed to load stage details:', err);
      setStageDetails([]);
    } finally {
      setModalLoading(false);
    }
  };

  // Extract KPIs from API data
  const kpiData = analyticsData?.kpis ? [
    {
      title: 'Leads',
      value: analyticsData.kpis.leads?.formatted || '0',
      subtitle: ''
    },
    {
      title: 'Paying Clients',
      value: analyticsData.kpis.paying_clients?.formatted || '0',
      subtitle: ''
    },
    {
      title: 'Repeat Clients',
      value: analyticsData.kpis.repeat_clients?.formatted || '0',
      subtitle: ''
    },
    {
      title: 'Conversion Rate',
      value: analyticsData.kpis.conversion_rate?.formatted || '0%',
      subtitle: 'Paying / Leads'
    },
    {
      title: 'Retention Rate',
      value: analyticsData.kpis.retention_rate?.formatted || '0%',
      subtitle: ''
    },
    {
      title: 'Avg CLV',
      value: analyticsData.kpis.avg_clv?.formatted || '$0',
      subtitle: ''
    }
  ] : [];



  // Prepare conversion funnel data - Tax Preparation Client Journey
  const conversionFunnelData = analyticsData?.conversion_funnel ? [
    { stage: 'Invited', key: 'invited', count: analyticsData.conversion_funnel.invited || 0, color: '#3B82F6' },
    { stage: 'Invites Activated', key: 'registered', count: analyticsData.conversion_funnel.registered || 0, color: '#8B5CF6' },
    { stage: 'Onboarded', key: 'onboarded', count: analyticsData.conversion_funnel.onboarded || 0, color: '#EC4899' },
    { stage: 'Docs Submitted', key: 'documents_submitted', count: analyticsData.conversion_funnel.documents_submitted || 0, color: '#F59E0B' },
    { stage: 'Invoiced', key: 'invoiced', count: analyticsData.conversion_funnel.invoiced || 0, color: '#10B981' },
    { stage: 'Paid', key: 'paid', count: analyticsData.conversion_funnel.paid || 0, color: '#059669' }
  ] : [];

  // Prepare retention & CLV trend data
  const retentionCLVData = analyticsData?.retention_clv_trend?.map(item => ({
    month: item.month,
    monthFull: item.month_full,
    avgCLV: item.avg_clv || 0,
    retention: item.retention_rate || 0
  })) || [];



  // Prepare age distribution data
  const ageDistributionData = analyticsData?.age_distribution?.map(item => ({
    age: item.age_range,
    clients: item.count || 0
  })) || [];

  // Prepare filing status data with distinct colors
  const filingStatusColors = {
    'Single': '#3B82F6',           // Blue
    'Married': '#10B981',          // Green
    'Head of Household': '#F59E0B', // Amber
    'Other': '#8B5CF6',            // Purple
    'Not Sure': '#6B7280'          // Gray
  };

  const filingStatusData = analyticsData?.filing_status?.map(item => ({
    name: item.status,
    value: item.count || 0,
    percentage: item.percentage || 0,
    color: filingStatusColors[item.status] || '#6B7280'
  })) || [];

  // Prepare income brackets data
  const incomeBracketsData = analyticsData?.income_brackets?.map(item => ({
    bracket: item.bracket,
    clients: item.count || 0
  })) || [];

  // Dynamic configuration for conversion funnel
  const chartConfig = {
    maxValue: conversionFunnelData.length > 0
      ? Math.max(...conversionFunnelData.map(item => item.count))
      : 1000,
    chartWidth: 340,
    barHeight: 20,
    barSpacing: 40,
    gridLines: [0, 250, 500, 750, 1000],
    showBackground: true,
    showTooltips: true,
    showValues: true
  };

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

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading client analytics data...</div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-6  sm:mb-8 h-fit">
        {kpiData.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg border-1 border-[#E8F0FF] p-4 sm:p-6">
            <div className="flex items-start justify-between ">
              <p className="text-sm font-thin text-gray-600">{kpi.title}</p>

            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">{kpi.value}</p>
            {kpi.subtitle && <p className="text-xs text-gray-500">{kpi.subtitle}</p>}
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

      {/* Charts Section - Top Row */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">


        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Conversion Funnel</h3>
            <button
              onClick={() => navigate('/firmadmin/clients')}
              className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors font-medium flex items-center gap-2"
            >
              Client Management
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
          <div className="h-64">
            {conversionFunnelData.length > 0 ? (
              <svg width="100%" height="100%" viewBox="0 0 480 300">
                {(() => {
                  const { maxValue, chartWidth, barHeight, barSpacing, gridLines, showBackground, showTooltips, showValues } = chartConfig;
                  const startY = 40;
                  const startX = 90;

                  return (
                    <>
                      {/* Grid lines */}
                      <defs>
                        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />

                      {/* Dynamic X-axis labels */}
                      {gridLines.map((value, index) => {
                        const x = startX + (value / maxValue) * chartWidth;
                        return (
                          <text key={value} x={x} y="280" fontSize="12" fill="#6B7280" textAnchor="middle">
                            {value}
                          </text>
                        );
                      })}

                      {/* Dynamic Y-axis labels and bars */}
                      {conversionFunnelData.map((item, index) => {
                        const y = startY + (index * barSpacing);
                        const barWidth = (item.count / maxValue) * chartWidth;
                        const isHovered = hoveredBar === index;

                        return (
                          <g key={item.stage}>
                            {/* Y-axis label */}
                            <text x="85" y={y + 5} fontSize="12" fill="#374151" textAnchor="end">
                              {item.stage}
                            </text>

                            {/* Bar background */}
                            {showBackground && (
                              <rect
                                x={startX}
                                y={y - 10}
                                width={chartWidth}
                                height={barHeight}
                                fill="#F3F4F6"
                                rx="4"
                                opacity="0.3"
                              />
                            )}

                            {/* Bar */}
                            <rect
                              x={startX}
                              y={y - 10}
                              width={barWidth}
                              height={barHeight}
                              fill={item.color}
                              rx="4"
                              className="cursor-pointer transition-all duration-300 hover:brightness-110"
                              onMouseEnter={() => setHoveredBar(index)}
                              onMouseLeave={() => setHoveredBar(null)}
                              onClick={() => handleStageClick(item.key)}
                              opacity={isHovered ? 0.9 : 1}
                            />

                            {/* Bar value text */}
                            {showValues && (
                              <text
                                x={barWidth + startX + 5}
                                y={y + 5}
                                fontSize="10"
                                fill="#6B7280"
                                fontWeight={isHovered ? "bold" : "normal"}
                              >
                                {item.count}
                              </text>
                            )}

                            {/* Tooltip */}
                            {showTooltips && isHovered && (
                              <g>
                                <rect
                                  x={barWidth + startX + 10}
                                  y={y - 25}
                                  width="80"
                                  height="30"
                                  fill="white"
                                  stroke="#E5E7EB"
                                  strokeWidth="1"
                                  rx="6"
                                />
                                <text x={barWidth + startX + 15} y={y - 10} fontSize="10" fill="#374151" fontWeight="bold">
                                  {item.stage}
                                </text>
                                <text x={barWidth + startX + 15} y={y + 2} fontSize="9" fill="#3B82F6">
                                  Count : {item.count}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                No conversion funnel data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Retention & CLV */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Retention & CLV</h3>
          <div className="h-64">
            {retentionCLVData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={retentionCLVData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
                  <XAxis dataKey="month" />
                  <YAxis
                    yAxisId="left"
                    domain={[0, 'dataMax + 200']}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2 border border-gray-200 rounded shadow-lg text-xs">
                            <p className="font-medium">{label}</p>
                            {payload.map((entry, index) => (
                              <p key={index} style={{ color: entry.color }}>
                                {entry.name}: {entry.name.includes('CLV') ? `$${entry.value?.toLocaleString()}` : `${entry.value}%`}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar yAxisId="left" dataKey="avgCLV" fill="#8B5CF6" name="Average CLV" maxBarSize={30} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="retention" stroke="#059669" strokeWidth={2} dot={{ fill: '#059669', r: 4 }} name="Retention %" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                No retention & CLV data available
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-600 rounded"></div>
              <span>Average CLV</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-700 rounded-full"></div>
              <span>Retention %</span>
            </div>
          </div>
        </div>


      </div>

      {/* Charts Section - Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Age Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
          <div className="h-64">
            {ageDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
                  <XAxis dataKey="age" />
                  <YAxis domain={[0, 'dataMax + 20']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="clients" fill="#EC4899" radius={[4, 4, 0, 0]} maxBarSize={30} name="Clients" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                No age distribution data available
              </div>
            )}
          </div>
        </div>

        {/* Filing Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filing Status</h3>
          <div className="h-64">
            {filingStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filingStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                    paddingAngle={2}
                  >
                    {filingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded shadow-lg text-xs">
                            <p className="font-medium text-gray-900">{data.name}</p>
                            <p className="text-blue-600">Count: {data.value}</p>
                            <p className="text-gray-500">{data.percentage?.toFixed(1)}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                No filing status data available
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs">
            {filingStatusData.map((segment, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: segment.color }}></div>
                <span>{segment.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Income Brackets */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Brackets</h3>
        <div className="h-64">
          {incomeBracketsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeBracketsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
                <XAxis dataKey="bracket" />
                <YAxis domain={[0, 'dataMax + 20']} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="clients" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={30} name="Clients" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-500">
              No income brackets data available
            </div>
          )}
        </div>
      </div>

      {/* Stage Detail Modal */}
      {showStageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {modalStage === 'all' ? 'All Clients' : `${modalStage?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Clients`}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Showing {stageDetails.length} records</p>
              </div>
              <button
                onClick={() => setShowStageModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-500 font-medium">Loading details...</p>
                </div>
              ) : stageDetails.length > 0 ? (
                <div className="min-w-full inline-block align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name / Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stageDetails.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                              <span className="text-xs text-gray-500">{item.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.date ? new Date(item.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.status?.toLowerCase() === 'paid' || item.status?.toLowerCase() === 'joined'
                                ? 'bg-emerald-100 text-emerald-700'
                                : item.status?.toLowerCase() === 'pending'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{item.type}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900">No records found</h4>
                  <p className="text-gray-500 mt-2">There are no clients currently in this stage of the journey.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowStageModal(false)}
                className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
