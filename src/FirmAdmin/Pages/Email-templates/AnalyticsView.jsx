import React, { useState, useEffect } from 'react';
import { firmAdminEmailTemplatesAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const IconComponents = {
  TotalTemplates: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0.4375L22 3.9375V11.9975C22 16.1245 19.467 19.0095 17.104 20.8005C15.6786 21.872 14.1143 22.7449 12.454 23.3955L12.367 23.4285L12.342 23.4375L12.335 23.4395L12.332 23.4405C12.331 23.4405 12.33 23.4405 12 22.4975L11.669 23.4415L11.665 23.4395L11.658 23.4375L11.633 23.4275L11.546 23.3955C11.0744 23.2131 10.6106 23.0109 10.156 22.7895C9.00838 22.232 7.91674 21.566 6.896 20.8005C4.534 19.0095 2 16.1245 2 11.9975V3.9375L12 0.4375ZM12 22.4975L11.669 23.4415L12 23.5575L12.331 23.4415L12 22.4975ZM12 21.4255L12.009 21.4215C13.3927 20.8496 14.6986 20.1054 15.896 19.2065C18.034 17.5875 20 15.2205 20 11.9975V5.3575L12 2.5575L4 5.3575V11.9975C4 15.2205 5.966 17.5855 8.104 19.2075C9.304 20.1081 10.613 20.8533 12 21.4255ZM18.072 8.3405L11.001 15.4115L6.758 11.1695L8.173 9.7545L11 12.5835L16.657 6.9265L18.072 8.3405Z" fill="#3AD6F2"/>
    </svg>
  ),
  EmailsSent: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.6109 5.38281L5.38867 9.66059L10.4442 11.9939L15.8887 8.10503L11.9998 13.5495L14.3331 18.605L18.6109 5.38281Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  OpenRate: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ClickRate: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 11C13 9.93913 12.5786 8.92172 11.8284 8.17157C11.0783 7.42143 10.0609 7 9 7C7.93913 7 6.92172 7.42143 6.17157 8.17157C5.42143 8.92172 5 9.93913 5 11C5 12.0609 5.42143 13.0783 6.17157 13.8284C6.92172 14.5786 7.93913 15 9 15C10.0609 15 11.0783 14.5786 11.8284 13.8284C12.5786 13.0783 13 12.0609 13 11Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.039 7.55685C10.9128 6.65932 11.0952 5.74555 11.5563 4.96522C12.0173 4.1849 12.7297 3.58429 13.5768 3.26179C14.4238 2.93928 15.3553 2.91401 16.2185 3.1901C17.0818 3.4662 17.8257 4.02729 18.3284 4.78147C18.8311 5.53564 19.0628 6.43818 18.9855 7.34123C18.9081 8.24428 18.5264 9.0943 17.9028 9.75205C17.2793 10.4098 16.4508 10.8363 15.5531 10.9616C14.6555 11.0869 13.7419 10.9037 12.962 10.4419M15 20.9989C15 19.4076 14.3679 17.8814 13.2426 16.7562C12.1174 15.631 10.5913 14.9989 9 14.9989C7.4087 14.9989 5.88258 15.631 4.75736 16.7562C3.63214 17.8814 3 19.4076 3 20.9989" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 17C21 15.4087 20.3679 13.8826 19.2426 12.7574C18.1174 11.6321 16.5913 11 15 11" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
};

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
      Icon: IconComponents.TotalTemplates
    },
    {
      label: 'Emails Sent',
      value: kpis?.emails_sent?.value?.toString() || '0',
      change: kpis?.emails_sent?.period || '',
      Icon: IconComponents.EmailsSent
    },
    {
      label: 'Avg. Open Rate',
      value: kpis?.avg_open_rate?.value ? `${kpis.avg_open_rate.value}%` : '0%',
      change: kpis?.avg_open_rate?.change_label || '',
      Icon: IconComponents.OpenRate
    },
    {
      label: 'Avg. Click Rate',
      value: kpis?.avg_click_rate?.value ? `${kpis.avg_click_rate.value}%` : '0%',
      change: kpis?.avg_click_rate?.change_label || '',
      Icon: IconComponents.ClickRate
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

