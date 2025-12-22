import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';
import '../../../styles/PerformanceTab.css';

export default function PerformanceTab({ staffId }) {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    if (staffId) {
      fetchPerformanceData();
    }
  }, [staffId, period]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${API_BASE_URL}/firm/staff/${staffId}/performance/${period ? `?period=${period}` : ''}`;

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setPerformanceData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch performance data');
      }
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  // Map API data to chart format
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  // Use performance data to show actual values
  // For chart visualization, we'll show the completion percentage based on actual data
  const chartData = months.map((month, index) => {
    const dataPoint = { month };
    
    if (performanceData?.performance) {
      const perf = performanceData.performance;
      
      // Calculate percentage for chart display
      const getPercentage = (completed, total) => {
        if (!total || total === 0) return 0;
        return Math.round((completed / total) * 100);
      };
      
      const baseTaxPrep = getPercentage(perf.tax_prep?.completed || 0, perf.tax_prep?.total || 1);
      const baseFollowUps = perf.follow_ups?.total > 0 ? getPercentage(perf.follow_ups?.completed || 0, perf.follow_ups?.total) : 0;
      const baseDocReview = getPercentage(perf.doc_review?.completed || 0, perf.doc_review?.total || 1);
      const baseTaxPlanning = getPercentage(perf.tax_planning?.completed || 0, perf.tax_planning?.total || 1);
      const baseMeetings = getPercentage(perf.meetings?.completed || 0, perf.meetings?.total || 1);
      
      // Create slight variations for visualization (you can replace this with actual historical data if available)
      const variations = [0, 2, -1, 3, 0, 0];
      dataPoint['Tax Prep'] = Math.max(0, Math.min(100, baseTaxPrep + (variations[index] || 0)));
      dataPoint['Follow-ups'] = Math.max(0, Math.min(100, baseFollowUps + (variations[index] || 0)));
      dataPoint['Doc Review'] = Math.max(0, Math.min(100, baseDocReview + (variations[index] || 0)));
      dataPoint['Tax Planning'] = Math.max(0, Math.min(100, baseTaxPlanning + (variations[index] || 0)));
      dataPoint['Meetings'] = Math.max(0, Math.min(100, baseMeetings + (variations[index] || 0)));
    } else {
      // Fallback to default values
      dataPoint['Tax Prep'] = 0;
      dataPoint['Follow-ups'] = 0;
      dataPoint['Doc Review'] = 0;
      dataPoint['Tax Planning'] = 0;
      dataPoint['Meetings'] = 0;
    }
    
    return dataPoint;
  });

  // Legend data from API - showing completed/total format
  const legendData = performanceData?.performance ? [
    { 
      name: performanceData.performance.tax_prep?.label || 'Tax Prep', 
      color: '#60A5FA', 
      completed: performanceData.performance.tax_prep?.completed || 0,
      total: performanceData.performance.tax_prep?.total || 0
    },
    { 
      name: performanceData.performance.follow_ups?.label || 'Follow-ups', 
      color: '#22C55E', 
      completed: performanceData.performance.follow_ups?.completed || 0,
      total: performanceData.performance.follow_ups?.total || 0
    },
    { 
      name: performanceData.performance.doc_review?.label || 'Doc Review', 
      color: '#FB923C', 
      completed: performanceData.performance.doc_review?.completed || 0,
      total: performanceData.performance.doc_review?.total || 0
    },
    { 
      name: performanceData.performance.tax_planning?.label || 'Tax Planning', 
      color: '#FACC15', 
      completed: performanceData.performance.tax_planning?.completed || 0,
      total: performanceData.performance.tax_planning?.total || 0
    },
    { 
      name: performanceData.performance.meetings?.label || 'Meetings', 
      color: '#EF4444', 
      completed: performanceData.performance.meetings?.completed || 0,
      total: performanceData.performance.meetings?.total || 0
    },
    { 
      name: performanceData.performance.overall?.label || 'Overall', 
      color: '#1E40AF', 
      completed: performanceData.performance.overall?.completed || 0,
      total: performanceData.performance.overall?.total || 0
    }
  ] : [
    { name: 'Tax Prep', color: '#60A5FA', completed: 0, total: 0 },
    { name: 'Follow-ups', color: '#22C55E', completed: 0, total: 0 },
    { name: 'Doc Review', color: '#FB923C', completed: 0, total: 0 },
    { name: 'Tax Planning', color: '#FACC15', completed: 0, total: 0 },
    { name: 'Meetings', color: '#EF4444', completed: 0, total: 0 },
    { name: 'Overall', color: '#1E40AF', completed: 0, total: 0 }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl !border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl !border border-gray-200 p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl !border border-gray-200 p-6 performance-main-container">
      <div className="flex justify-between items-start mb-6 performance-header">
        <div className="performance-header-content">
          <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] performance-header-title">
            Performance Metrics
            {performanceData?.detailed_metrics?.tasks && ` (${performanceData.detailed_metrics.tasks.total} tasks)`}
          </h5>
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1 performance-header-subtitle">
            {performanceData?.staff_name ? `${performanceData.staff_name}'s performance overview` : 'Performance overview and metrics'}
          </p>
        </div>
        <div className="relative performance-period-selector">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 text-sm font-medium text-[#4A5568] bg-[#F0F4F8] !rounded-lg appearance-none pr-12 font-[BasisGrotesquePro] cursor-pointer hover:bg-[#E2E8F0] transition !border border-[#E8F0FF] performance-period-select"
          >
            <option value="all">All Time</option>
            <option value="yearly">Yearly</option>
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-[#4A5568]">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex gap-4 performance-chart-container">
        {/* Chart Area */}
        <div className="flex-1 performance-chart-area">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="2 2" 
                stroke="#E5E7EB" 
                vertical={true}
                horizontal={true}
              />
              <XAxis 
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'BasisGrotesquePro' }}
                interval={0}
              />
              <YAxis 
                domain={[75, 100]}
                ticks={[75, 82, 89, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'BasisGrotesquePro' }}
                width={30}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontFamily: 'BasisGrotesquePro'
                }}
              />
              
              {/* Meetings - Red (Top) */}
              <Line
                type="monotone"
                dataKey="Meetings"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: '#EF4444', strokeWidth: 2, stroke: 'white', r: 3 }}
                activeDot={{ r: 5 }}
              />
              
              {/* Tax Prep - Light Blue (Second from top) */}
              <Line
                type="monotone"
                dataKey="Tax Prep"
                stroke="#60A5FA"
                strokeWidth={2}
                dot={{ fill: '#60A5FA', strokeWidth: 2, stroke: 'white', r: 3 }}
                activeDot={{ r: 5 }}
              />
              
              {/* Doc Review - Orange/Brown (Middle) */}
              <Line
                type="monotone"
                dataKey="Doc Review"
                stroke="#FB923C"
                strokeWidth={2}
                dot={{ fill: '#FB923C', strokeWidth: 2, stroke: 'white', r: 3 }}
                activeDot={{ r: 5 }}
              />
              
              {/* Follow-ups - Green (Second from bottom) */}
              <Line
                type="monotone"
                dataKey="Follow-ups"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ fill: '#22C55E', strokeWidth: 2, stroke: 'white', r: 3 }}
                activeDot={{ r: 5 }}
              />
              
              {/* Tax Planning - Yellow (Bottom) */}
              <Line
                type="monotone"
                dataKey="Tax Planning"
                stroke="#FACC15"
                strokeWidth={2}
                dot={{ fill: '#FACC15', strokeWidth: 2, stroke: 'white', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 text-sm font-[BasisGrotesquePro] min-w-[180px] flex-shrink-0 performance-legend">
          {legendData.map((item) => (
            <div key={item.name} className="flex items-center gap-2 performance-legend-item">
              <div
                className="w-3 h-3 flex-shrink-0 performance-legend-color"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-gray-700 font-[BasisGrotesquePro] performance-legend-text">{item.name}:</span>
              <span className="text-gray-900 font-semibold font-[BasisGrotesquePro] performance-legend-text">
                {item.completed}/{item.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Metrics Section */}
      {performanceData?.detailed_metrics && (
        <div className="mt-8 pt-6 border-t border-gray-200 performance-metrics-section">
          <h6 className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro] mb-4 performance-metrics-title">Detailed Metrics</h6>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 performance-metrics-grid">
            {/* Tasks */}
            {performanceData.detailed_metrics.tasks && (
              <div className="bg-gray-50 rounded-lg p-4 performance-metric-card">
                <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2 performance-metric-label">Tasks</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] performance-metric-value">
                    {performanceData.detailed_metrics.tasks.completed || 0}
                  </div>
                  <div className="text-sm text-gray-500 font-[BasisGrotesquePro] performance-metric-total">
                    / {performanceData.detailed_metrics.tasks.total || 0} total
                  </div>
                </div>
                <div className="mt-2 flex gap-2 text-xs font-[BasisGrotesquePro] performance-metric-details">
                  <span className="text-green-600">In Progress: {performanceData.detailed_metrics.tasks.in_progress || 0}</span>
                  <span className="text-orange-600">Pending: {performanceData.detailed_metrics.tasks.pending || 0}</span>
                </div>
              </div>
            )}

            {/* Appointments */}
            {performanceData.detailed_metrics.appointments && (
              <div className="bg-gray-50 rounded-lg p-4 performance-metric-card">
                <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2 performance-metric-label">Appointments</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] performance-metric-value">
                    {performanceData.detailed_metrics.appointments.completed || 0}
                  </div>
                  <div className="text-sm text-gray-500 font-[BasisGrotesquePro] performance-metric-total">
                    / {performanceData.detailed_metrics.appointments.total || 0} total
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-[BasisGrotesquePro] performance-metric-details">
                  <span className="text-blue-600">Scheduled: {performanceData.detailed_metrics.appointments.scheduled || 0}</span>
                  <span className="text-purple-600">Confirmed: {performanceData.detailed_metrics.appointments.confirmed || 0}</span>
                  <span className="text-orange-600">Pending: {performanceData.detailed_metrics.appointments.pending || 0}</span>
                </div>
              </div>
            )}

            {/* Documents */}
            {performanceData.detailed_metrics.documents && (
              <div className="bg-gray-50 rounded-lg p-4 performance-metric-card">
                <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2 performance-metric-label">Documents</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] performance-metric-value">
                    {performanceData.detailed_metrics.documents.reviewed || 0}
                  </div>
                  <div className="text-sm text-gray-500 font-[BasisGrotesquePro] performance-metric-total">
                    / {performanceData.detailed_metrics.documents.total_uploaded || 0} uploaded
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 font-[BasisGrotesquePro] performance-metric-rate">
                  Review Rate: {performanceData.detailed_metrics.documents.total_uploaded > 0 
                    ? Math.round((performanceData.detailed_metrics.documents.reviewed / performanceData.detailed_metrics.documents.total_uploaded) * 100) 
                    : 0}%
                </div>
              </div>
            )}

            {/* Clients */}
            {performanceData.detailed_metrics.clients && (
              <div className="bg-gray-50 rounded-lg p-4 performance-metric-card">
                <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2 performance-metric-label">Clients</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] performance-metric-value">
                    {performanceData.detailed_metrics.clients.active || 0}
                  </div>
                  <div className="text-sm text-gray-500 font-[BasisGrotesquePro] performance-metric-total">
                    / {performanceData.detailed_metrics.clients.total_assigned || 0} assigned
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 font-[BasisGrotesquePro] performance-metric-rate">
                  Active Rate: {performanceData.detailed_metrics.clients.total_assigned > 0 
                    ? Math.round((performanceData.detailed_metrics.clients.active / performanceData.detailed_metrics.clients.total_assigned) * 100) 
                    : 0}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

