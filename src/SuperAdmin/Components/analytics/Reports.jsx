import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaDownload, FaBell } from 'react-icons/fa';
import { superAdminAPI, handleAPIError } from '../../utils/superAdminAPI';

const normalizeOptions = (items = []) => items.map((item) => {
  if (typeof item === 'string') {
    return { value: item, label: item.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) };
  }
  if (item && typeof item === 'object') {
    const value = item.value ?? item.key ?? '';
    const label = item.label || (value ? value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');
    return { value, label };
  }
  return { value: '', label: 'Unknown' };
});

const formatDateTime = (isoString) => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString();
};

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

export default function Reports() {
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState(null);

  const [formState, setFormState] = useState({
    reportType: '',
    timePeriod: '',
    format: '',
    includeDetails: true
  });

  const [scheduleState, setScheduleState] = useState({
    frequency: '',
    scheduledFor: ''
  });

  const [generateLoading, setGenerateLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [generatedReport, setGeneratedReport] = useState(null);

  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchConfig = async () => {
      try {
        setConfigLoading(true);
        const response = await superAdminAPI.getCustomReportConfig();
        if (!isMounted) return;

        if (response?.success && response?.data) {
          setConfig(response.data);
        } else {
          throw new Error(response?.message || 'Failed to load report configuration');
        }
      } catch (err) {
        if (!isMounted) return;
        setConfigError(handleAPIError(err));
      } finally {
        if (isMounted) {
          setConfigLoading(false);
        }
      }
    };

    fetchConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchSchedules = useCallback(async () => {
    try {
      setSchedulesLoading(true);
      setSchedulesError(null);
      const response = await superAdminAPI.getCustomReportSchedules();
      if (response?.success && Array.isArray(response?.data?.schedules)) {
        setSchedules(response.data.schedules);
      } else if (Array.isArray(response?.data)) {
        setSchedules(response.data);
      } else {
        setSchedules([]);
      }
    } catch (err) {
      setSchedulesError(handleAPIError(err));
    } finally {
      setSchedulesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    if (!config) return;
    setFormState((prev) => {
      const defaults = config.defaults || {};
      return {
        reportType: prev.reportType || defaults.report_type || normalizeOptions(config.report_types)?.[0]?.value || '',
        timePeriod: prev.timePeriod || defaults.time_period || normalizeOptions(config.time_periods)?.[0]?.value || '',
        format: prev.format || defaults.format || normalizeOptions(config.formats)?.[0]?.value || '',
        includeDetails: typeof defaults.include_details === 'boolean' ? defaults.include_details : prev.includeDetails
      };
    });

    setScheduleState((prev) => {
      const defaults = config.defaults || {};
      return {
        frequency: prev.frequency || defaults.frequency || normalizeOptions(config.frequencies)?.[0]?.value || '',
        scheduledFor: prev.scheduledFor || ''
      };
    });
  }, [config]);

  const reportTypeOptions = useMemo(() => normalizeOptions(config?.report_types || []), [config]);
  const timePeriodOptions = useMemo(() => normalizeOptions(config?.time_periods || []), [config]);
  const formatOptions = useMemo(() => normalizeOptions(config?.formats || []), [config]);
  const frequencyOptions = useMemo(() => normalizeOptions(config?.frequencies || []), [config]);

  const handleFormChange = (field) => (event) => {
    const value = field === 'includeDetails' ? event.target.checked : event.target.value;
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScheduleChange = (field) => (event) => {
    const value = event.target.value;
    setScheduleState((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateNow = async () => {
    if (!formState.reportType || !formState.timePeriod || !formState.format) {
      setFeedback({ type: 'error', message: 'Please select report type, time period, and format.' });
      return;
    }

    const payload = {
      report_type: formState.reportType,
      time_period: formState.timePeriod,
      format: formState.format,
      include_details: formState.includeDetails
    };

    try {
      setGenerateLoading(true);
      setFeedback(null);
      const response = await superAdminAPI.generateCustomReport(payload);

      if (response?.success && response?.data?.report) {
        setGeneratedReport(response.data.report);
        setFeedback({ type: 'success', message: response.message || 'Report generated successfully.' });
      } else {
        throw new Error(response?.message || 'Failed to generate report');
      }
    } catch (err) {
      setFeedback({ type: 'error', message: handleAPIError(err) });
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleScheduleReport = async () => {
    if (!formState.reportType || !formState.timePeriod || !formState.format || !scheduleState.frequency) {
      setFeedback({ type: 'error', message: 'Please choose report options and schedule frequency.' });
      return;
    }

    if (!scheduleState.scheduledFor) {
      setFeedback({ type: 'error', message: 'Please select the first delivery date/time.' });
      return;
    }

    const scheduledDate = new Date(scheduleState.scheduledFor);
    if (Number.isNaN(scheduledDate.getTime())) {
      setFeedback({ type: 'error', message: 'Invalid schedule date/time.' });
      return;
    }

    const payload = {
      report_type: formState.reportType,
      time_period: formState.timePeriod,
      format: formState.format,
      frequency: scheduleState.frequency,
      include_details: formState.includeDetails,
      scheduled_for: scheduledDate.toISOString()
    };

    try {
      setScheduleLoading(true);
      setFeedback(null);
      const response = await superAdminAPI.scheduleCustomReport(payload);
      if (response?.success) {
        setFeedback({ type: 'success', message: response.message || 'Report scheduled successfully.' });
        setScheduleState((prev) => ({ ...prev, scheduledFor: '' }));
        fetchSchedules();
      } else {
        throw new Error(response?.message || 'Failed to schedule report');
      }
    } catch (err) {
      setFeedback({ type: 'error', message: handleAPIError(err) });
    } finally {
      setScheduleLoading(false);
    }
  };

  return (
    <div className="space-y-8 mb-8">
      <div className="bg-white p-6 transition-all duration-300 ease-in-out" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>Custom Report Generator</h3>
          <p className="text-sm" style={{color: '#3B4A66'}}>Generate or schedule detailed platform reports using live platform data.</p>
        </div>

        {configLoading ? (
          <div className="h-32 flex items-center justify-center text-sm text-gray-500">
            Loading report configuration...
          </div>
        ) : configError ? (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-sm text-red-600">
            {configError}
          </div>
        ) : (
          <>
            {feedback && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  feedback.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Report Type</label>
                  <select
                    value={formState.reportType}
                    onChange={handleFormChange('reportType')}
                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                    style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                  >
                    {reportTypeOptions.length === 0 && <option value="">No report types available</option>}
                    {reportTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Time Period</label>
                  <select
                    value={formState.timePeriod}
                    onChange={handleFormChange('timePeriod')}
                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                    style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                  >
                    {timePeriodOptions.length === 0 && <option value="">No time periods available</option>}
                    {timePeriodOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Format</label>
                  <select
                    value={formState.format}
                    onChange={handleFormChange('format')}
                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                    style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                  >
                    {formatOptions.length === 0 && <option value="">No formats available</option>}
                    {formatOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="includeDetails"
                    type="checkbox"
                    checked={formState.includeDetails}
                    onChange={handleFormChange('includeDetails')}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400"
                  />
                  <label htmlFor="includeDetails" className="text-sm" style={{color: '#3B4A66'}}>
                    Include detailed breakdowns
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Frequency</label>
                  <select
                    value={scheduleState.frequency}
                    onChange={handleScheduleChange('frequency')}
                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                    style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                  >
                    {frequencyOptions.length === 0 && <option value="">No frequencies available</option>}
                    <option value="">One-off (manual trigger)</option>
                    {frequencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>First delivery</label>
                  <input
                    type="datetime-local"
                    value={scheduleState.scheduledFor}
                    onChange={handleScheduleChange('scheduledFor')}
                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                    style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 pt-3">
                <button
                  onClick={handleGenerateNow}
                  disabled={generateLoading}
                  className="flex items-center justify-center gap-2 px-6 py-2 text-white font-medium transition-colors disabled:opacity-60"
                  style={{backgroundColor: '#F56D2D', borderRadius: '7px'}}
                >
                  <FaDownload className="text-sm" />
                  {generateLoading ? 'Generating...' : 'Generate Report'}
                </button>

                <button
                  onClick={handleScheduleReport}
                  disabled={scheduleLoading}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-white border font-medium transition-colors disabled:opacity-60"
                  style={{border: '1px solid #E8F0FF', color: '#3B4A66', borderRadius: '7px'}}
                >
                  <FaBell className="text-sm" />
                  {scheduleLoading ? 'Scheduling...' : 'Schedule Report'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {generatedReport && (
        <div className="bg-white p-6 transition-all duration-300 ease-in-out" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>Latest Generated Report</h4>
            <p className="text-sm" style={{color: '#3B4A66'}}>
              {generatedReport.report_type?.replace(/_/g, ' ')?.replace(/\b\w/g, (c) => c.toUpperCase())} • {generatedReport.format?.toUpperCase()}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Time Period</p>
              <p className="text-gray-800">
                {generatedReport.time_period?.replace(/_/g, ' ')?.replace(/\b\w/g, (c) => c.toUpperCase()) || '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {generatedReport.start_date} - {generatedReport.end_date}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Generated At</p>
              <p className="text-gray-800">{formatDateTime(generatedReport.generated_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Revenue</p>
              <p className="text-gray-800">
                {generatedReport.sections?.summary?.formatted_total_revenue ||
                 formatCurrency(generatedReport.sections?.summary?.total_revenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Sections Included</p>
              <p className="text-gray-800">
                {generatedReport.sections
                  ? Object.keys(generatedReport.sections).map((key) => key.replace(/_/g, ' ')).join(', ')
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 transition-all duration-300 ease-in-out" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>Scheduled Reports</h4>
          <p className="text-sm" style={{color: '#3B4A66'}}>Automated reports that will be delivered to stakeholders.</p>
        </div>

        {schedulesLoading ? (
          <div className="h-32 flex items-center justify-center text-sm text-gray-500">
            Loading schedules...
          </div>
        ) : schedulesError ? (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-sm text-red-600">
            {schedulesError}
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-4 border border-dashed border-[#E8F0FF] rounded-lg text-sm text-gray-500 text-center">
            No scheduled reports yet. Create one using the schedule form above.
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id || `${schedule.report_type}-${schedule.scheduled_for}`}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3 px-4"
                style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}
              >
                <div>
                  <h6 className="text-sm font-semibold mb-1" style={{color: '#3B4A66'}}>
                    {(schedule.report_type || 'Report').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </h6>
                  <p className="text-xs" style={{color: '#6B7280'}}>
                    {schedule.time_period?.replace(/_/g, ' ')?.replace(/\b\w/g, (c) => c.toUpperCase()) || 'Custom period'} • {schedule.format?.toUpperCase?.() || schedule.format}
                  </p>
                  <p className="text-xs mt-1" style={{color: '#6B7280'}}>
                    Next run: {formatDateTime(schedule.next_run || schedule.scheduled_for)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1" style={{border: '1px solid #E8F0FF', borderRadius: '50px', color: '#3B4A66'}}>
                    {schedule.frequency?.replace(/_/g, ' ')?.replace(/\b\w/g, (c) => c.toUpperCase()) || 'One-off'}
                  </span>
                  <span className="text-xs font-medium px-2 py-1" style={{border: '1px solid #E8F0FF', borderRadius: '50px', color: '#3B4A66'}}>
                    {schedule.status?.replace(/_/g, ' ')?.replace(/\b\w/g, (c) => c.toUpperCase()) || 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



