import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaDownload, FaBell } from 'react-icons/fa';
import { superAdminAPI, handleAPIError } from '../../utils/superAdminAPI';
import { toast } from 'react-toastify';
import { superToastOptions } from '../../utils/toastConfig';

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

// Helper function to extract error message from API response
const extractAPIErrorMessage = (response, defaultMessage = 'An error occurred') => {
  let errorMessage = response?.message || defaultMessage;

  // Check for field-specific errors
  if (response?.errors) {
    const errorMessages = [];

    // Handle non_field_errors
    if (response.errors.non_field_errors) {
      errorMessages.push(...response.errors.non_field_errors);
    }

    // Handle field-specific errors
    Object.entries(response.errors).forEach(([field, messages]) => {
      if (field !== 'non_field_errors' && Array.isArray(messages)) {
        errorMessages.push(`${field}: ${messages.join(', ')}`);
      }
    });

    if (errorMessages.length > 0) {
      errorMessage = errorMessages.join('; ');
    }
  }

  return errorMessage;
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

  // Platform Reports state
  const [platformReportForm, setPlatformReportForm] = useState({
    report_type: 'platform_revenue',
    time_period: 'last_30_days',
    format: 'csv', // Will be updated dynamically based on report type
    include_detailed_breakdowns: false,
    custom_start_date: '',
    custom_end_date: '',
    // Dynamic filters based on report type
    firm_filter: 'all', // all, active, inactive
    user_type_filter: 'all', // all, admin, staff, client
    include_charts: false,
    include_raw_data: false
  });
  const [platformReportLoading, setPlatformReportLoading] = useState(false);
  const [platformReportStatus, setPlatformReportStatus] = useState(null);
  const [platformReportTaskId, setPlatformReportTaskId] = useState(null);
  const [platformReportFileUrl, setPlatformReportFileUrl] = useState(null);
  const [platformReportDetails, setPlatformReportDetails] = useState(null);
  const [generatedReportsHistory, setGeneratedReportsHistory] = useState([]);
  const [generatedReportsLoading, setGeneratedReportsLoading] = useState(false);
  const [platformScheduledReports, setPlatformScheduledReports] = useState([]);
  const [platformScheduledLoading, setPlatformScheduledLoading] = useState(false);
  const [platformScheduledError, setPlatformScheduledError] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    name: '',
    report_type: 'platform_revenue',
    time_period: 'last_30_days',
    format: 'csv',
    include_detailed_breakdowns: false,
    frequency: 'monthly',
    first_delivery: '',
    is_active: true
  });

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

  // Fetch platform scheduled reports
  const fetchPlatformScheduledReports = useCallback(async () => {
    try {
      setPlatformScheduledLoading(true);
      setPlatformScheduledError(null);
      const response = await superAdminAPI.getScheduledReports();
      if (response?.success) {
        setPlatformScheduledReports(response.scheduled_reports || []);
      } else {
        setPlatformScheduledReports([]);
      }
    } catch (err) {
      setPlatformScheduledError(handleAPIError(err));
      setPlatformScheduledReports([]);
    } finally {
      setPlatformScheduledLoading(false);
    }
  }, []);

  const fetchGeneratedReportsHistory = useCallback(async () => {
    try {
      setGeneratedReportsLoading(true);
      const response = await superAdminAPI.getGeneratedReports();
      if (response?.success) {
        setGeneratedReportsHistory(response.generated_reports || []);
      } else {
        setGeneratedReportsHistory([]);
      }
    } catch (err) {
      console.error('Error fetching generated reports:', err);
      setGeneratedReportsHistory([]);
    } finally {
      setGeneratedReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchPlatformScheduledReports();
    fetchGeneratedReportsHistory();
  }, [fetchSchedules, fetchPlatformScheduledReports, fetchGeneratedReportsHistory]);

  // Update format when report type changes to ensure it's valid
  useEffect(() => {
    const config = getReportTypeConfig(platformReportForm.report_type);
    const currentFormat = platformReportForm.format;
    const availableFormats = config.availableFormats;

    // If current format is not available for this report type, switch to first available
    if (!availableFormats.includes(currentFormat)) {
      setPlatformReportForm(prev => ({
        ...prev,
        format: availableFormats[0] || 'csv'
      }));
    }
  }, [platformReportForm.report_type]);

  // Update schedule form format when report type changes
  useEffect(() => {
    const config = getReportTypeConfig(scheduleFormData.report_type);
    const currentFormat = scheduleFormData.format;
    const availableFormats = config.availableFormats;

    // If current format is not available for this report type, switch to first available
    if (!availableFormats.includes(currentFormat)) {
      setScheduleFormData(prev => ({
        ...prev,
        format: availableFormats[0] || 'csv'
      }));
    }
  }, [scheduleFormData.report_type]);

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
        throw new Error(extractAPIErrorMessage(response, 'Failed to generate report'));
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
        fetchPlatformScheduledReports();
      } else {
        throw new Error(extractAPIErrorMessage(response, 'Failed to schedule report'));
      }
    } catch (err) {
      setFeedback({ type: 'error', message: handleAPIError(err) });
    } finally {
      setScheduleLoading(false);
    }
  };

  // Handle platform report generation
  // Poll report status with enhanced progress tracking
  const pollReportStatus = async (taskId) => {
    try {
      const response = await superAdminAPI.getReportStatus(taskId);

      if (response.status === 'SUCCESS') {
        setPlatformReportStatus('SUCCESS');
        setPlatformReportFileUrl(response.file_url);
        setPlatformReportDetails({
          report_id: response.report_id,
          rows_count: response.rows_count,
          generation_time: response.generation_time
        });
        setPlatformReportLoading(false);
        setFeedback({ type: 'success', message: 'Report generated successfully! Downloading automatically...' });
        toast.success('Report generated successfully! Downloading...', superToastOptions);
        fetchGeneratedReportsHistory(); // Refresh history

        // Automatically trigger download
        if (response.file_url) {
          const link = document.createElement('a');
          link.href = response.file_url;
          link.download = `report_${response.report_id || platformReportTaskId || 'download'}.${platformReportForm.format}`;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        return true;
      } else if (response.status === 'FAILURE' || response.status === 'REVOKED') {
        setPlatformReportStatus('FAILED');
        setPlatformReportLoading(false);
        const errorMsg = response.error || 'Report generation failed';
        setFeedback({ type: 'error', message: errorMsg });
        toast.error(errorMsg, superToastOptions);
        return true;
      } else if (response.status === 'PENDING') {
        setPlatformReportStatus('PENDING');
        setFeedback({ type: 'info', message: 'Report queued for processing...' });
        return false;
      } else if (response.status === 'STARTED') {
        const progress = response.progress || 0;
        const currentStep = response.current_step || 'Initializing...';
        setPlatformReportStatus('STARTED');
        setFeedback({
          type: 'info',
          message: `Generating report... ${currentStep} (${progress}%)`
        });
        return false;
      } else if (response.status === 'PROGRESS') {
        const progress = response.progress || 0;
        const currentStep = response.current_step || 'Processing...';
        setPlatformReportStatus('PROGRESS');
        setFeedback({
          type: 'info',
          message: `Generating report... ${currentStep} (${progress}%)`
        });
        return false;
      }
      return false;
    } catch (err) {
      console.error('Error checking report status:', err);
      return false;
    }
  };

  const handleGeneratePlatformReport = async () => {
    if (!platformReportForm.report_type || !platformReportForm.time_period) {
      setFeedback({ type: 'error', message: 'Please select report type and time period.' });
      toast.error('Please select report type and time period.', superToastOptions);
      return;
    }

    // Validate custom date range if selected
    if (platformReportForm.time_period === 'custom') {
      if (!platformReportForm.custom_start_date || !platformReportForm.custom_end_date) {
        setFeedback({ type: 'error', message: 'Please provide custom date range.' });
        toast.error('Please provide custom date range.', superToastOptions);
        return;
      }
    }

    try {
      setPlatformReportLoading(true);
      setPlatformReportStatus('PENDING');
      setPlatformReportFileUrl(null);
      setPlatformReportDetails(null);
      setFeedback(null);
      
      const requestData = {
        report_type: platformReportForm.report_type,
        time_period: platformReportForm.time_period,
        format: platformReportForm.format,
        include_detailed_breakdowns: platformReportForm.include_detailed_breakdowns,
        // Include dynamic filters if they exist
        ...(platformReportForm.firm_filter && { firm_filter: platformReportForm.firm_filter }),
        ...(platformReportForm.user_type_filter && { user_type_filter: platformReportForm.user_type_filter }),
        ...(platformReportForm.include_charts !== undefined && { include_charts: platformReportForm.include_charts }),
        ...(platformReportForm.include_raw_data !== undefined && { include_raw_data: platformReportForm.include_raw_data })
      };

      // Add custom dates if time period is custom
      if (platformReportForm.time_period === 'custom') {
        requestData.custom_start_date = platformReportForm.custom_start_date;
        requestData.custom_end_date = platformReportForm.custom_end_date;
      }
      
      const response = await superAdminAPI.generateReport(requestData);
      
      if (response?.task_id) {
        setPlatformReportTaskId(response.task_id);
        setFeedback({ type: 'info', message: 'Report generation started. Please wait...' });
        toast.info('Report generation started. Checking status...', superToastOptions);
        
        // Start polling for status with exponential backoff
        let pollCount = 0;
        const pollInterval = setInterval(async () => {
          pollCount++;
          const isDone = await pollReportStatus(response.task_id);
          if (isDone) {
            clearInterval(pollInterval);
          } else if (pollCount > 100) { // Stop after ~5 minutes (100 * 3s)
            clearInterval(pollInterval);
            setPlatformReportStatus('TIMEOUT');
            setPlatformReportLoading(false);
            setFeedback({ type: 'error', message: 'Report generation timed out. Please try again.' });
            toast.error('Report generation timed out', superToastOptions);
          }
        }, 3000); // Poll every 3 seconds
      } else {
        throw new Error(response?.message || 'Failed to start report generation');
      }
    } catch (err) {
      const errorMsg = handleAPIError(err);
      setFeedback({ type: 'error', message: errorMsg });
      toast.error(errorMsg, superToastOptions);
      setPlatformReportLoading(false);
      setPlatformReportStatus(null);
    }
  };

  // Handle schedule new report submission
  const handleScheduleNewReport = async () => {
    if (!scheduleFormData.name || !scheduleFormData.report_type || !scheduleFormData.frequency) {
      toast.error('Please fill in all required fields', superToastOptions);
      return;
    }

    try {
      const payload = {
        ...scheduleFormData
      };
      
      // Convert first_delivery to ISO string if provided
      if (scheduleFormData.first_delivery) {
        payload.first_delivery = new Date(scheduleFormData.first_delivery).toISOString();
      }
      
      const response = await superAdminAPI.scheduleReport(payload);
      
      if (response?.success) {
        toast.success(response.message || 'Report scheduled successfully', superToastOptions);
        setShowScheduleModal(false);
        setScheduleFormData({
          name: '',
          report_type: 'platform_revenue',
          time_period: 'last_30_days',
          format: 'csv',
          include_detailed_breakdowns: false,
          frequency: 'monthly',
          first_delivery: '',
          is_active: true
        });
        fetchPlatformScheduledReports();
      } else {
        throw new Error(extractAPIErrorMessage(response, 'Failed to schedule report'));
      }
    } catch (err) {
      toast.error(handleAPIError(err), superToastOptions);
    }
  };

  // Edit scheduled report
  const handleEditScheduledReport = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleFormData({
      name: schedule.name || '',
      report_type: schedule.report_type || 'platform_revenue',
      time_period: schedule.time_period || 'last_30_days',
      format: schedule.format || 'csv',
      include_detailed_breakdowns: schedule.include_detailed_breakdowns || false,
      frequency: schedule.frequency || 'monthly',
      first_delivery: schedule.first_delivery ? new Date(schedule.first_delivery).toISOString().slice(0, 16) : '',
      is_active: schedule.is_active !== undefined ? schedule.is_active : true
    });
    setShowEditModal(true);
  };

  // Save edited scheduled report
  const handleSaveEditedReport = async () => {
    if (!editingSchedule?.id) return;

    try {
      const payload = {
        ...scheduleFormData
      };

      // Convert first_delivery to ISO string if provided
      if (scheduleFormData.first_delivery) {
        payload.first_delivery = new Date(scheduleFormData.first_delivery).toISOString();
      }

      const response = await superAdminAPI.updateScheduledReport(editingSchedule.id, payload);

      if (response?.success) {
        toast.success('Scheduled report updated successfully', superToastOptions);
        setShowEditModal(false);
        setEditingSchedule(null);
        setScheduleFormData({
          name: '',
          report_type: 'platform_revenue',
          time_period: 'last_30_days',
          format: 'csv',
          include_detailed_breakdowns: false,
          frequency: 'monthly',
          first_delivery: '',
          is_active: true
        });
        fetchPlatformScheduledReports();
      } else {
        throw new Error(extractAPIErrorMessage(response, 'Failed to update scheduled report'));
      }
    } catch (err) {
      toast.error(handleAPIError(err), superToastOptions);
    }
  };

  // Delete scheduled report
  const handleDeleteScheduledReport = async () => {
    if (!deletingSchedule?.id) return;

    try {
      const response = await superAdminAPI.deleteScheduledReport(deletingSchedule.id);
      if (response?.success) {
        toast.success('Scheduled report deleted successfully', superToastOptions);
        setShowDeleteModal(false);
        setDeletingSchedule(null);
        fetchPlatformScheduledReports();
      }
    } catch (err) {
      toast.error(handleAPIError(err), superToastOptions);
    }
  };

  // Toggle scheduled report active status
  const handleToggleScheduledReport = async (scheduleId, currentStatus) => {
    try {
      const response = await superAdminAPI.updateScheduledReport(scheduleId, {
        is_active: !currentStatus
      });
      if (response?.success) {
        toast.success(`Scheduled report ${!currentStatus ? 'activated' : 'paused'}`, superToastOptions);
        fetchPlatformScheduledReports();
      }
    } catch (err) {
      toast.error(handleAPIError(err), superToastOptions);
    }
  };

  const handlePlatformReportFormChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setPlatformReportForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Get dynamic configuration options based on report type
  const getReportTypeConfig = (reportType) => {
    const configs = {
      // Custom Reports
      platform_revenue: {
        description: 'Comprehensive revenue analysis including subscriptions, invoices, and payments',
        availableFormats: ['csv', 'pdf', 'excel'],
        showFirmFilter: false,
        showUserTypeFilter: false,
        showIncludeCharts: true,
        showIncludeRawData: true
      },
      user_activity: {
        description: 'User activity and engagement metrics across the platform',
        availableFormats: ['csv', 'excel', 'pdf'],
        showFirmFilter: true,
        showUserTypeFilter: true,
        showIncludeCharts: true,
        showIncludeRawData: true
      },
      subscription_analytics: {
        description: 'Subscription metrics, churn analysis, and revenue forecasting',
        availableFormats: ['csv', 'excel', 'pdf'],
        showFirmFilter: false,
        showUserTypeFilter: false,
        showIncludeCharts: true,
        showIncludeRawData: true
      },
      document_statistics: {
        description: 'Document creation, processing, and storage statistics',
        availableFormats: ['csv', 'excel'],
        showFirmFilter: true,
        showUserTypeFilter: false,
        showIncludeCharts: true,
        showIncludeRawData: true
      },

      // Platform Reports
      firm_report: {
        description: 'Detailed report for individual firms with comprehensive metrics',
        availableFormats: ['csv', 'excel', 'pdf'],
        showFirmFilter: true,
        showUserTypeFilter: false,
        showIncludeCharts: false,
        showIncludeRawData: false
      },
      staff_report: {
        description: 'Staff member activity, productivity, and performance metrics',
        availableFormats: ['csv', 'excel'],
        showFirmFilter: true,
        showUserTypeFilter: false,
        showIncludeCharts: false,
        showIncludeRawData: false
      },
      client_report: {
        description: 'Client activity, engagement, and satisfaction metrics',
        availableFormats: ['csv', 'excel'],
        showFirmFilter: true,
        showUserTypeFilter: false,
        showIncludeCharts: false,
        showIncludeRawData: false
      }
    };
    return configs[reportType] || configs.platform_revenue;
  };

  return (
    <div className="space-y-8 mb-8">
      {/* Platform Reports Section */}
      <div className="bg-white p-6 transition-all duration-300 ease-in-out" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>Platform Reports</h3>
          <p className="text-sm" style={{color: '#3B4A66'}}>Generate platform-wide reports for firms, staff, or clients.</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Report Type *</label>
              <select
                value={platformReportForm.report_type}
                onChange={handlePlatformReportFormChange('report_type')}
                className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                disabled={platformReportLoading}
              >
                {/* Custom Reports */}
                <optgroup label="Custom Reports">
                  <option value="platform_revenue">Platform Revenue</option>
                  <option value="user_activity">User Activity</option>
                  <option value="subscription_analytics">Subscription Analytics</option>
                  <option value="document_statistics">Document Statistics</option>
                </optgroup>
                {/* Platform Reports */}
                <optgroup label="Platform Reports">
                  <option value="firm_report">Firm Report</option>
                  <option value="staff_report">Staff Report</option>
                  <option value="client_report">Client Report</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Time Period *</label>
              <select
                value={platformReportForm.time_period}
                onChange={handlePlatformReportFormChange('time_period')}
                className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                disabled={platformReportLoading}
              >
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_90_days">Last 90 Days</option>
                <option value="current_month">Current Month</option>
                <option value="last_month">Last Month</option>
                <option value="current_quarter">Current Quarter</option>
                <option value="current_year">Current Year</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Format *</label>
              <select
                value={platformReportForm.format}
                onChange={handlePlatformReportFormChange('format')}
                className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                disabled={platformReportLoading}
              >
                {(() => {
                  const config = getReportTypeConfig(platformReportForm.report_type);
                  return config.availableFormats.map(format => (
                    <option key={format} value={format}>
                      {format.toUpperCase()}
                    </option>
                  ));
                })()}
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {platformReportForm.time_period === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Start Date *</label>
                <input
                  type="date"
                  value={platformReportForm.custom_start_date}
                  onChange={handlePlatformReportFormChange('custom_start_date')}
                  className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                  style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                  disabled={platformReportLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>End Date *</label>
                <input
                  type="date"
                  value={platformReportForm.custom_end_date}
                  onChange={handlePlatformReportFormChange('custom_end_date')}
                  className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                  style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                  disabled={platformReportLoading}
                />
              </div>
            </div>
          )}

          {/* Include Detailed Breakdowns */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="detailed-breakdowns"
              checked={platformReportForm.include_detailed_breakdowns}
              onChange={handlePlatformReportFormChange('include_detailed_breakdowns')}
              disabled={platformReportLoading}
              className="w-4 h-4 text-[#F56D2D] border-gray-300 rounded focus:ring-[#F56D2D]"
            />
            <label htmlFor="detailed-breakdowns" className="text-sm font-medium" style={{color: '#3B4A66'}}>
              Include detailed breakdowns
            </label>
          </div>

          {/* Dynamic Configuration Options */}
          {(() => {
            const config = getReportTypeConfig(platformReportForm.report_type);

            return (
              <div className="space-y-3">
                {/* Report Description */}
                <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  {config.description}
                </div>

                {/* Firm Filter */}
                {config.showFirmFilter && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Firm Filter</label>
                    <select
                      value={platformReportForm.firm_filter}
                      onChange={handlePlatformReportFormChange('firm_filter')}
                      disabled={platformReportLoading}
                      className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                      style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                    >
                      <option value="all">All Firms</option>
                      <option value="active">Active Firms Only</option>
                      <option value="inactive">Inactive Firms Only</option>
                    </select>
                  </div>
                )}

                {/* User Type Filter */}
                {config.showUserTypeFilter && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>User Type Filter</label>
                    <select
                      value={platformReportForm.user_type_filter}
                      onChange={handlePlatformReportFormChange('user_type_filter')}
                      disabled={platformReportLoading}
                      className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                      style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                    >
                      <option value="all">All Users</option>
                      <option value="admin">Admins Only</option>
                      <option value="staff">Staff Only</option>
                      <option value="client">Clients Only</option>
                    </select>
                  </div>
                )}

                {/* Include Charts */}
                {config.showIncludeCharts && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="include-charts"
                      checked={platformReportForm.include_charts}
                      onChange={handlePlatformReportFormChange('include_charts')}
                      disabled={platformReportLoading}
                      className="w-4 h-4 text-[#F56D2D] border-gray-300 rounded focus:ring-[#F56D2D]"
                    />
                    <label htmlFor="include-charts" className="text-sm font-medium" style={{color: '#3B4A66'}}>
                      Include charts and visualizations
                    </label>
                  </div>
                )}

                {/* Include Raw Data */}
                {config.showIncludeRawData && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="include-raw-data"
                      checked={platformReportForm.include_raw_data}
                      onChange={handlePlatformReportFormChange('include_raw_data')}
                      disabled={platformReportLoading}
                      className="w-4 h-4 text-[#F56D2D] border-gray-300 rounded focus:ring-[#F56D2D]"
                    />
                    <label htmlFor="include-raw-data" className="text-sm font-medium" style={{color: '#3B4A66'}}>
                      Include raw data export
                    </label>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Status indicator */}
          {platformReportStatus && (
            <div className={`p-3 rounded-lg border ${
              platformReportStatus === 'SUCCESS' ? 'bg-green-50 border-green-200' :
              platformReportStatus === 'FAILED' ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-2">
                {platformReportStatus === 'SUCCESS' && (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {(platformReportStatus === 'PENDING' || platformReportStatus === 'STARTED') && (
                  <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {platformReportStatus === 'FAILED' && (
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={`text-sm font-medium ${
                  platformReportStatus === 'SUCCESS' ? 'text-green-800' :
                  platformReportStatus === 'FAILED' ? 'text-red-800' :
                  platformReportStatus === 'TIMEOUT' ? 'text-red-800' :
                  platformReportStatus === 'PROGRESS' ? 'text-orange-800' :
                  'text-blue-800'
                }`}>
                  {platformReportStatus === 'SUCCESS' && 'Report Ready'}
                  {platformReportStatus === 'PENDING' && 'Report queued for processing...'}
                  {platformReportStatus === 'STARTED' && 'Initializing report generation...'}
                  {platformReportStatus === 'PROGRESS' && 'Processing data...'}
                  {platformReportStatus === 'TIMEOUT' && 'Report generation timed out'}
                  {platformReportStatus === 'FAILED' && 'Report generation failed'}
                </span>

                {/* Progress bar for progress status */}
                {platformReportStatus === 'PROGRESS' && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: '60%' }}
                    ></div>
                  </div>
                )}
              </div>
              {platformReportTaskId && (
                <p className="text-xs text-gray-600 mt-1">Task ID: {platformReportTaskId}</p>
              )}
              {platformReportDetails && platformReportStatus === 'SUCCESS' && (
                <div className="mt-2 flex gap-4 text-xs text-gray-600">
                  {platformReportDetails.rows_count && (
                    <span>📊 {platformReportDetails.rows_count.toLocaleString()} rows</span>
                  )}
                  {platformReportDetails.generation_time && (
                    <span>⏱️ Generated in {platformReportDetails.generation_time}s</span>
                  )}
                  {platformReportDetails.report_id && (
                    <span>ID: #{platformReportDetails.report_id}</span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleGeneratePlatformReport}
              disabled={platformReportLoading}
              className="flex items-center justify-center gap-2 px-6 py-2 text-white font-medium transition-colors disabled:opacity-60"
              style={{backgroundColor: '#F56D2D', borderRadius: '7px'}}
            >
              <FaDownload className="text-sm" />
              {platformReportLoading ? 'Generating...' : 'Generate Report'}
            </button>
            
            {platformReportFileUrl && (
              <a
                href={platformReportFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex items-center justify-center gap-2 px-6 py-2 text-white font-medium transition-colors hover:opacity-90"
                style={{backgroundColor: '#22C55E', borderRadius: '7px'}}
              >
                <FaDownload className="text-sm" />
                Download Report
              </a>
            )}

            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-white border font-medium transition-colors"
              style={{border: '1px solid #E8F0FF', color: '#3B4A66', borderRadius: '7px'}}
            >
              <FaBell className="text-sm" />
              Schedule Report
            </button>
          </div>
        </div>
      </div>

      {/* Generated Reports History */}
      <div className="bg-white p-6 transition-all duration-300 ease-in-out" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-4">
          <h4 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>Generated Reports History</h4>
          <p className="text-sm" style={{color: '#3B4A66'}}>Recent reports generated on the platform</p>
        </div>

        {generatedReportsLoading ? (
          <div className="text-center py-8 text-sm text-gray-500">Loading report history...</div>
        ) : generatedReportsHistory.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">No generated reports found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8F0FF]">
                  <th className="text-left py-2 px-3 font-medium" style={{color: '#3B4A66'}}>Report Type</th>
                  <th className="text-left py-2 px-3 font-medium" style={{color: '#3B4A66'}}>Period</th>
                  <th className="text-left py-2 px-3 font-medium" style={{color: '#3B4A66'}}>Format</th>
                  <th className="text-left py-2 px-3 font-medium" style={{color: '#3B4A66'}}>Status</th>
                  <th className="text-left py-2 px-3 font-medium" style={{color: '#3B4A66'}}>Created</th>
                  <th className="text-left py-2 px-3 font-medium" style={{color: '#3B4A66'}}>S3 Folder</th>
                  <th className="text-left py-2 px-3 font-medium" style={{color: '#3B4A66'}}>Details</th>
                  <th className="text-left py-2 px-3 font-medium" style={{color: '#3B4A66'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {generatedReportsHistory.slice(0, 10).map((report) => (
                  <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3" style={{color: '#3B4A66'}}>
                      {report.report_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {report.time_period?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                        {report.format?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        report.status === 'completed' ? 'bg-green-100 text-green-800' :
                        report.status === 'failed' ? 'bg-red-100 text-red-800' :
                        report.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status === 'completed' && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {report.status === 'failed' && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        {report.status === 'processing' && (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {report.status_display || report.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600 text-xs">
                      {new Date(report.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-500">
                      {report.file_path ? (
                        <div className="font-mono bg-gray-50 px-1 py-0.5 rounded text-xs">
                          {report.file_path.split('/').slice(-2).join('/')}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-500">
                      {report.rows_count && <div>{report.rows_count.toLocaleString()} rows</div>}
                      {report.generation_time_seconds && <div>{report.generation_time_seconds}s</div>}
                      {report.file_size && <div>{(report.file_size / 1024).toFixed(0)} KB</div>}
                    </td>
                    <td className="py-2 px-3">
                      {report.file_url && (
                        <a
                          href={report.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="text-[#F56D2D] hover:underline text-sm"
                        >
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scheduled Reports Section */}
      <div className="bg-white p-6 transition-all duration-300 ease-in-out" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>All Scheduled Reports</h4>
          <p className="text-sm" style={{color: '#3B4A66'}}>Automated reports that will be delivered to stakeholders.</p>
        </div>

        {platformScheduledLoading || schedulesLoading ? (
          <div className="h-32 flex items-center justify-center text-sm text-gray-500">
            Loading schedules...
          </div>
        ) : (platformScheduledError || schedulesError) ? (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-sm text-red-600">
            {platformScheduledError || schedulesError}
          </div>
        ) : (
          <>
            {/* All Scheduled Reports */}
            {platformScheduledReports && platformScheduledReports.length > 0 ? (
              <div className="mb-6">
                <h5 className="text-sm font-semibold mb-3" style={{color: '#3B4A66'}}>
                  Scheduled Reports ({platformScheduledReports.length})
                </h5>
                <div className="space-y-3">
                  {platformScheduledReports.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3 px-4"
                      style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}
                    >
                      <div className="flex-1">
                        <h6 className="text-sm font-semibold mb-1" style={{color: '#3B4A66'}}>
                          {schedule.name || schedule.report_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </h6>
                        <p className="text-xs" style={{color: '#6B7280'}}>
                          {schedule.report_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} • {schedule.time_period?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} • {schedule.format?.toUpperCase()}
                        </p>
                        <p className="text-xs mt-1" style={{color: '#6B7280'}}>
                          {schedule.last_run 
                            ? `Last run: ${new Date(schedule.last_run).toLocaleString()}` 
                            : 'Never run'}
                          {schedule.next_run && (
                            <span className="ml-2">• Next: {new Date(schedule.next_run).toLocaleString()}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-1" style={{border: '1px solid #E8F0FF', borderRadius: '50px', color: '#3B4A66'}}>
                          {schedule.frequency?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                        <button
                          onClick={() => handleToggleScheduledReport(schedule.id, schedule.is_active)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            schedule.is_active 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {schedule.is_active ? 'Active' : 'Paused'}
                        </button>
                        <button
                          onClick={() => handleEditScheduledReport(schedule)}
                          className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeletingSchedule(schedule);
                            setShowDeleteModal(true);
                          }}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 border border-dashed border-[#E8F0FF] rounded-lg text-sm text-gray-500 text-center">
                No scheduled reports yet. Click "Schedule Report" to create one.
              </div>
            )}
          </>
        )}
      </div>

      {/* Schedule Report Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{color: '#3B4A66'}}>Schedule Recurring Report</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Report Name *</label>
                <input
                  type="text"
                  value={scheduleFormData.name}
                  onChange={(e) => setScheduleFormData(prev => ({...prev, name: e.target.value}))}
                  placeholder="e.g., Monthly Revenue Report"
                  className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                  style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Report Type *</label>
                  <select
                    value={scheduleFormData.report_type}
                    onChange={(e) => setScheduleFormData(prev => ({...prev, report_type: e.target.value}))}
                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                    style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                  >
                    {/* Custom Reports */}
                    <optgroup label="Custom Reports">
                      <option value="platform_revenue">Platform Revenue</option>
                      <option value="user_activity">User Activity</option>
                      <option value="subscription_analytics">Subscription Analytics</option>
                      <option value="document_statistics">Document Statistics</option>
                    </optgroup>
                    {/* Platform Reports */}
                    <optgroup label="Platform Reports">
                      <option value="firm_report">Firm Report</option>
                      <option value="staff_report">Staff Report</option>
                      <option value="client_report">Client Report</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Time Period *</label>
                  <select
                    value={scheduleFormData.time_period}
                    onChange={(e) => setScheduleFormData(prev => ({...prev, time_period: e.target.value}))}
                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                    style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                  >
                    <option value="last_7_days">Last 7 Days</option>
                    <option value="last_30_days">Last 30 Days</option>
                    <option value="last_90_days">Last 90 Days</option>
                    <option value="current_month">Current Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="current_quarter">Current Quarter</option>
                    <option value="current_year">Current Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Format *</label>
                  <select
                    value={scheduleFormData.format}
                    onChange={(e) => setScheduleFormData(prev => ({...prev, format: e.target.value}))}
                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                    style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                  >
                    {(() => {
                      const config = getReportTypeConfig(scheduleFormData.report_type);
                      return config.availableFormats.map(format => (
                        <option key={format} value={format}>
                          {format.toUpperCase()}
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Frequency *</label>
                  <select
                    value={scheduleFormData.frequency}
                    onChange={(e) => setScheduleFormData(prev => ({...prev, frequency: e.target.value}))}
                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                    style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                  >
                    <option value="once">Run Once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>First Delivery *</label>
                <input
                  type="datetime-local"
                  value={scheduleFormData.first_delivery}
                  onChange={(e) => setScheduleFormData(prev => ({...prev, first_delivery: e.target.value}))}
                  className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                  style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="schedule-detailed"
                  checked={scheduleFormData.include_detailed_breakdowns}
                  onChange={(e) => setScheduleFormData(prev => ({
                    ...prev,
                    include_detailed_breakdowns: e.target.checked
                  }))}
                  className="w-4 h-4 text-[#F56D2D] border-gray-300 rounded focus:ring-[#F56D2D]"
                />
                <label htmlFor="schedule-detailed" className="text-sm font-medium" style={{color: '#3B4A66'}}>
                  Include detailed breakdowns
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="schedule-active"
                  checked={scheduleFormData.is_active}
                  onChange={(e) => setScheduleFormData(prev => ({
                    ...prev,
                    is_active: e.target.checked
                  }))}
                  className="w-4 h-4 text-[#F56D2D] border-gray-300 rounded focus:ring-[#F56D2D]"
                />
                <label htmlFor="schedule-active" className="text-sm font-medium" style={{color: '#3B4A66'}}>
                  Activate immediately
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-white border font-medium transition-colors"
                style={{border: '1px solid #E8F0FF', color: '#3B4A66', borderRadius: '7px'}}
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleNewReport}
                className="px-4 py-2 text-white font-medium transition-colors"
                style={{backgroundColor: '#F56D2D', borderRadius: '7px'}}
              >
                Schedule Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Scheduled Report Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{color: '#3B4A66'}}>Edit Scheduled Report</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSchedule(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Report Name *</label>
                <input
                  type="text"
                  value={scheduleFormData.name}
                  onChange={(e) => setScheduleFormData(prev => ({...prev, name: e.target.value}))}
                  placeholder="e.g., Monthly Revenue Report"
                  className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                  style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Report Type *</label>
                  <select
                    value={scheduleFormData.report_type}
                    onChange={(e) => setScheduleFormData(prev => ({...prev, report_type: e.target.value}))}
                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                    style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                  >
                    {/* Custom Reports */}
                    <optgroup label="Custom Reports">
                      <option value="platform_revenue">Platform Revenue</option>
                      <option value="user_activity">User Activity</option>
                      <option value="subscription_analytics">Subscription Analytics</option>
                      <option value="document_statistics">Document Statistics</option>
                    </optgroup>
                    {/* Platform Reports */}
                    <optgroup label="Platform Reports">
                      <option value="firm_report">Firm Report</option>
                      <option value="staff_report">Staff Report</option>
                      <option value="client_report">Client Report</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Time Period *</label>
                  <select
                    value={scheduleFormData.time_period}
                    onChange={(e) => setScheduleFormData(prev => ({...prev, time_period: e.target.value}))}
                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                    style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                  >
                    <option value="last_7_days">Last 7 Days</option>
                    <option value="last_30_days">Last 30 Days</option>
                    <option value="last_90_days">Last 90 Days</option>
                    <option value="current_month">Current Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="current_quarter">Current Quarter</option>
                    <option value="current_year">Current Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Format *</label>
                  <select
                    value={scheduleFormData.format}
                    onChange={(e) => setScheduleFormData(prev => ({...prev, format: e.target.value}))}
                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                    style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                  >
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Frequency *</label>
                  <select
                    value={scheduleFormData.frequency}
                    onChange={(e) => setScheduleFormData(prev => ({...prev, frequency: e.target.value}))}
                    className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                    style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                  >
                    <option value="once">Run Once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>First Delivery *</label>
                <input
                  type="datetime-local"
                  value={scheduleFormData.first_delivery}
                  onChange={(e) => setScheduleFormData(prev => ({...prev, first_delivery: e.target.value}))}
                  className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                  style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-detailed"
                  checked={scheduleFormData.include_detailed_breakdowns}
                  onChange={(e) => setScheduleFormData(prev => ({
                    ...prev,
                    include_detailed_breakdowns: e.target.checked
                  }))}
                  className="w-4 h-4 text-[#F56D2D] border-gray-300 rounded focus:ring-[#F56D2D]"
                />
                <label htmlFor="edit-detailed" className="text-sm font-medium" style={{color: '#3B4A66'}}>
                  Include detailed breakdowns
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={scheduleFormData.is_active}
                  onChange={(e) => setScheduleFormData(prev => ({
                    ...prev,
                    is_active: e.target.checked
                  }))}
                  className="w-4 h-4 text-[#F56D2D] border-gray-300 rounded focus:ring-[#F56D2D]"
                />
                <label htmlFor="edit-active" className="text-sm font-medium" style={{color: '#3B4A66'}}>
                  Activate immediately
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSchedule(null);
                }}
                className="px-4 py-2 bg-white border font-medium transition-colors"
                style={{border: '1px solid #E8F0FF', color: '#3B4A66', borderRadius: '7px'}}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedReport}
                className="px-4 py-2 text-white font-medium transition-colors"
                style={{backgroundColor: '#F56D2D', borderRadius: '7px'}}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{color: '#3B4A66'}}>Delete Scheduled Report</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete this scheduled report? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <h4 className="font-medium text-sm" style={{color: '#3B4A66'}}>
                {deletingSchedule.name || deletingSchedule.report_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                {deletingSchedule.report_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} • {deletingSchedule.frequency?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingSchedule(null);
                }}
                className="px-4 py-2 bg-white border font-medium transition-colors"
                style={{border: '1px solid #E8F0FF', color: '#3B4A66', borderRadius: '7px'}}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteScheduledReport}
                className="px-4 py-2 text-white font-medium transition-colors"
                style={{backgroundColor: '#DC2626', borderRadius: '7px'}}
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
