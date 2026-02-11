import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, Line } from 'recharts';
import TabNavigation from '../Integrations/TabNavigation';
import { firmAdminAnalyticsAPI } from '../../../ClientOnboarding/utils/apiUtils';

const ComplianceReporting = ({ activeTab, setActiveTab, tabs, period = '6m' }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch compliance reporting analytics data
  useEffect(() => {
    async function loadComplianceReporting() {
      try {
        setLoading(true);
        setError(null);

        const response = await firmAdminAnalyticsAPI.getComplianceReporting(period);

        if (response?.success && response?.data) {
          setAnalyticsData(response.data);
        } else {
          throw new Error(response?.message || 'Failed to load compliance reporting analytics data');
        }
      } catch (error) {
        console.error('Failed to load compliance reporting analytics:', error);
        setError(error.message || 'Failed to load compliance reporting analytics data.');
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    }

    loadComplianceReporting();
  }, [period]);

  // Extract KPIs from API data
  const kpiData = analyticsData?.kpis ? [
    {
      title: 'Total Revenue',
      value: analyticsData.kpis.total_revenue?.formatted || '$0',
      change: analyticsData.kpis.total_revenue?.growth_formatted || '+0%',
      isPositive: analyticsData.kpis.total_revenue?.is_positive !== false,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Active Clients',
      value: analyticsData.kpis.active_clients?.formatted || '0',
      change: analyticsData.kpis.active_clients?.change_formatted || '+0',
      isPositive: analyticsData.kpis.active_clients?.is_positive !== false,
      icon: (
        <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.75 18.75V16.75C14.75 15.6891 14.3286 14.6717 13.5784 13.9216C12.8283 13.1714 11.8109 12.75 10.75 12.75H4.75C3.68913 12.75 2.67172 13.1714 1.92157 13.9216C1.17143 14.6717 0.75 15.6891 0.75 16.75V18.75M20.75 18.75V16.75C20.7493 15.8637 20.4544 15.0028 19.9114 14.3023C19.3684 13.6019 18.6081 13.1016 17.75 12.88M14.75 0.88C15.6104 1.1003 16.373 1.6007 16.9176 2.30231C17.4622 3.00392 17.7578 3.86683 17.7578 4.755C17.7578 5.64317 17.4622 6.50608 16.9176 7.20769C16.373 7.9093 15.6104 8.4097 14.75 8.63M11.75 4.75C11.75 6.95914 9.95914 8.75 7.75 8.75C5.54086 8.75 3.75 6.95914 3.75 4.75C3.75 2.54086 5.54086 0.75 7.75 0.75C9.95914 0.75 11.75 2.54086 11.75 4.75Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Avg. Client Value',
      value: analyticsData.kpis.avg_client_value?.formatted || '$0',
      change: analyticsData.kpis.avg_client_value?.growth_formatted || '+0%',
      isPositive: analyticsData.kpis.avg_client_value?.is_positive !== false,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Client Retention',
      value: analyticsData.kpis.client_retention?.formatted || '0%',
      change: analyticsData.kpis.client_retention?.growth_formatted || '+0%',
      isPositive: analyticsData.kpis.client_retention?.is_positive !== false,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 7L14.2071 14.7929C13.8166 15.1834 13.1834 15.1834 12.7929 14.7929L9.20711 11.2071C8.81658 10.8166 8.18342 10.8166 7.79289 11.2071L2 17M22 7H16M22 7V13" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
  ] : [];

  // Prepare Due Diligence Scorecard data
  const dueDiligenceScorecard = analyticsData?.due_diligence_scorecard;
  const dueDiligenceData = dueDiligenceScorecard ? [
    { name: 'Completed', value: dueDiligenceScorecard.completed?.percentage || 0, color: '#10B981' },
    { name: 'Incompleted', value: dueDiligenceScorecard.incompleted?.percentage || 0, color: '#F59E0B' }
  ] : [];

  // Prepare IRS Compliance Checks data
  const irsComplianceChecks = analyticsData?.irs_compliance_checks;
  const irsComplianceData = irsComplianceChecks ? [
    { name: 'Missing SSN', count: irsComplianceChecks.missing_ssn || 0 },
    { name: 'Incomplete Onboarding', count: irsComplianceChecks.incomplete_onboarding || 0 },
    { name: 'Unsigned Forms', count: irsComplianceChecks.unsigned_forms || 0 },
    { name: 'Missing Documents', count: irsComplianceChecks.missing_documents || 0 }
  ] : [];

  // Prepare Revenue & Profit Trend data (eSigned vs wetSigned)
  const revenueProfitTrend = analyticsData?.revenue_profit_trend || [];
  const revenueTrendData = revenueProfitTrend.map(item => ({
    year: item.year?.toString() || '',
    eSigned: item.esigned || 0,
    wetSigned: item.wetsigned || 0
  }));

  // Custom Tooltip for Due Diligence
  const DueDiligenceTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{data.value}%</p>
          {dueDiligenceScorecard && data.name === 'Completed' && (
            <p className="text-xs text-gray-500 mt-1">Count: {dueDiligenceScorecard.completed?.count || 0}</p>
          )}
          {dueDiligenceScorecard && data.name === 'Incompleted' && (
            <p className="text-xs text-gray-500 mt-1">Count: {dueDiligenceScorecard.incompleted?.count || 0}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for IRS Compliance
  const IRSComplianceTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">Count: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Revenue Trend
  const RevenueTrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const eSigned = payload.find(p => p.dataKey === 'eSigned')?.value || 0;
      const wetSigned = payload.find(p => p.dataKey === 'wetSigned')?.value || 0;
      const total = eSigned + wetSigned;

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">Year: {label}</p>
          <p className="text-sm text-blue-600">eSigned: ${eSigned.toLocaleString()}</p>
          <p className="text-sm text-red-600">wetSigned: ${wetSigned.toLocaleString()}</p>
          <p className="text-sm font-medium text-gray-700">Total: ${total.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading compliance reporting data...</div>
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

  // Calculate max value for revenue trend Y-axis
  const maxRevenueValue = revenueTrendData.length > 0
    ? Math.max(...revenueTrendData.map(d => (d.eSigned || 0) + (d.wetSigned || 0))) * 1.1
    : 160000;

  // Calculate max value for IRS compliance Y-axis
  const maxIRSValue = irsComplianceData.length > 0
    ? Math.max(...irsComplianceData.map(d => d.count || 0), 10)
    : 12;

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
                <path d="M11.9166 3.79297L7.31242 8.39714L4.60409 5.6888L1.08325 9.20964M11.9166 3.79297H8.66658M11.9166 3.79297L11.9166 7.04297" stroke={kpi.isPositive ? "#32B582" : "#EF4444"} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="ml-1">{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 sm:mb-8 w-fit">
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Due Diligence Scorecard and IRS Compliance Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Due Diligence Scorecard */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Due Diligence Scorecard</h3>
          {dueDiligenceData.length > 0 ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dueDiligenceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {dueDiligenceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DueDiligenceTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-6 mt-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">
                    Completed ({dueDiligenceScorecard?.completed?.count || 0})
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">
                    Incompleted ({dueDiligenceScorecard?.incompleted?.count || 0})
                  </span>
                </div>
              </div>
              {dueDiligenceScorecard?.total && (
                <div className="text-center mt-2">
                  <span className="text-sm text-gray-500">Total: {dueDiligenceScorecard.total}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-sm text-gray-500">
              No due diligence data available
            </div>
          )}
        </div>

        {/* IRS Compliance Checks */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">IRS Compliance Checks</h3>
          {irsComplianceData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={irsComplianceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, maxIRSValue]} />
                  <Tooltip content={<IRSComplianceTooltip />} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-sm text-gray-500">
              No IRS compliance data available
            </div>
          )}
        </div>
      </div>

      {/* Revenue & Profit Trend */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Profit Trend</h3>
        {revenueTrendData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.5} />
                <XAxis dataKey="year" />
                <YAxis domain={[0, maxRevenueValue]} />
                <Tooltip content={<RevenueTrendTooltip />} />
                <Legend />
                <Bar dataKey="eSigned" fill="#3B82F6" name="eSigned" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="wetSigned" fill="#EF4444" name="wetSigned" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-80 text-sm text-gray-500">
            No revenue trend data available
          </div>
        )}
      </div>
    </>
  );
};

export default ComplianceReporting;
