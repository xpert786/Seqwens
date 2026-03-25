import React, { useState, useEffect } from 'react';
import { firmAdminEmailTemplatesAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import {
    ShieldCheckIcon,
    PaperPlaneIcon,
    StatsEyeIcon,
    StatsClickIcon
} from './Icons';

export default function AnalyticsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await firmAdminEmailTemplatesAPI.getAnalytics();
      setAnalyticsData(data);
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch analytics data';
      setError(errorMsg);
      handleAPIError(err);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="!rounded-xl bg-white px-4 py-3 !border border-[#E8F0FF] animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#E8F0FF]">
          <p className="text-center text-[#7B8AB2] py-8">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#E8F0FF]">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-[#3AD6F2] text-white rounded-lg hover:bg-[#2BC4E0] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#E8F0FF]">
        <p className="text-center text-[#7B8AB2] py-8">No analytics data available</p>
      </div>
    );
  }

  const { kpis, template_performance = [] } = analyticsData;

  const stats = [
    {
      label: 'Total Templates',
      value: kpis?.total_templates?.value?.toString() || '0',
      change: kpis?.total_templates?.change_label || '',
      Icon: ShieldCheckIcon
    },
    {
      label: 'Emails Sent',
      value: kpis?.emails_sent?.value?.toString() || '0',
      change: kpis?.emails_sent?.period || '',
      Icon: PaperPlaneIcon
    },
    {
      label: 'Avg. Open Rate',
      value: kpis?.avg_open_rate?.value ? `${kpis.avg_open_rate.value}%` : '0%',
      change: kpis?.avg_open_rate?.change_label || '',
      Icon: StatsEyeIcon
    },
    {
      label: 'Avg. Click Rate',
      value: kpis?.avg_click_rate?.value ? `${kpis.avg_click_rate.value}%` : '0%',
      change: kpis?.avg_click_rate?.change_label || '',
      Icon: StatsClickIcon
    }
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, change, Icon }) => (
          <div
            key={label}
            className="!rounded-xl bg-white px-4 py-3  !border border-[#E8F0FF]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-regular text-[#7B8AB2]">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-[#1F2A55]">{value}</p>
              </div>
              <span className="inline-flex text-[#27CBF2]">
                <Icon />
              </span>
            </div>
            <p className="mt-3 text-sm font-regular text-[#7B8AB2]">{change}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#E8F0FF]">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#1F2A55]">Template Performance</h3>
          <p className="text-sm text-[#7B8AB2]">Email engagement metrics by template</p>
        </div>

        {template_performance.length === 0 ? (
          <p className="text-center text-[#7B8AB2] py-8">No template performance data available</p>
        ) : (
          <>
            <div className="hidden xl:grid grid-cols-[2.4fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 pb-2 text-sm font-medium tracking-wide text-[#4B5563]">
              <span>Template</span>
              <span>Sent</span>
              <span>Open</span>
              <span>Clicked</span>
              <span>Open Rate</span>
              <span>Click Rate</span>
            </div>

            <div className="hidden xl:flex xl:flex-col xl:gap-3">
              {template_performance.map((row) => (
                <div
                  key={row.template_id}
                  className="grid grid-cols-[2.4fr_1fr_1fr_1fr_1fr_1fr] items-center gap-4 rounded-2xl border border-[#E7EEFF] bg-white px-6 py-4 text-sm text-[#1F2A55]"
                >
                  <span className="font-semibold text-[#1F2A55]">{row.template_name}</span>
                  <span className="text-[#3D4C70]">{row.sent || 0}</span>
                  <span className="text-[#3D4C70]">{row.open || 0}</span>
                  <span className="text-[#3D4C70]">{row.clicked || 0}</span>
                  <span>
                    <span className="inline-flex items-center !rounded-full !border border-[#34C759] bg-white px-4 py-1 text-sm font-medium text-[#1F8750]">
                      {row.open_rate ? `${row.open_rate}%` : '0%'}
                    </span>
                  </span>
                  <span>
                    <span className="inline-flex items-center !rounded-full !border border-[#3AD6F2] bg-white px-4 py-1 text-sm font-medium text-[#0996B8]">
                      {row.click_rate ? `${row.click_rate}%` : '0%'}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3 xl:hidden">
              {template_performance.map((row) => (
                <div key={row.template_id} className="space-y-3 rounded-2xl border border-[#E7EEFF] bg-white p-4 text-sm text-[#1F2A55]">
                  <div className="font-semibold text-[#1F2A55]">{row.template_name}</div>
                  <div className="grid grid-cols-2 gap-3 text-xs uppercase tracking-wide text-[#7B8AB2]">
                    <span>Sent</span>
                    <span className="text-right text-[#3D4C70]">{row.sent || 0}</span>
                    <span>Open</span>
                    <span className="text-right text-[#3D4C70]">{row.open || 0}</span>
                    <span>Clicked</span>
                    <span className="text-right text-[#3D4C70]">{row.clicked || 0}</span>
                    <span>Open Rate</span>
                    <span className="text-right">
                      <span className="inline-flex items-center rounded-full border border-[#34C759] bg-white px-3 py-1 text-xs font-medium text-[#1F8750]">
                        {row.open_rate ? `${row.open_rate}%` : '0%'}
                      </span>
                    </span>
                    <span>Click Rate</span>
                    <span className="text-right">
                      <span className="inline-flex items-center rounded-full border border-[#3AD6F2] bg-white px-3 py-1 text-xs font-medium text-[#0996B8]">
                        {row.click_rate ? `${row.click_rate}%` : '0%'}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

