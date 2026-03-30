import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaDollarSign, FaUsers, FaClock, FaExclamationTriangle, FaChevronUp, FaChevronDown, FaDownload, FaEdit, FaEllipsisV, FaBell } from 'react-icons/fa';
import { BlueDollarIcon, BlueUserIcon, BlueClockIcon, BlueExclamationTriangleIcon, ActiveIcon, ArrowgreenIcon, ClockgreenIcon, RedDownIcon, Action3Icon, AddSubscriptionPlanIcon } from '../Components/icons';
import EditSubscriptionPlan from './EditSubscriptionPlan';
import AddSubscription from './AddSubscription';

import { superAdminAPI, handleAPIError } from '../utils/superAdminAPI';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../style/Subscriptions.css';

export default function Subscriptions() {
  const [activeTab, setActiveTab] = useState('Plans'); // 'Plans' or 'Invoices'
  const [showPlanDetails, setShowPlanDetails] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState(null);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [showAddPlan, setshowAddPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Starter');
  const [subscriptions, setSubscriptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [planOptions, setPlanOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [tableLoading, setTableLoading] = useState(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [tableError, setTableError] = useState(null);
  const debounceRef = useRef(null);
  // Get current month and year for default filter
  const currentDate = new Date();
  const currentMonth = (currentDate.getMonth() + 1).toString(); // getMonth() returns 0-11, so add 1
  const currentYear = currentDate.getFullYear().toString();

  const [planPerformance, setPlanPerformance] = useState(null);
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [appliedFilterMonth, setAppliedFilterMonth] = useState(currentMonth);
  const [appliedFilterYear, setAppliedFilterYear] = useState(currentYear);
  const filtersEffectInitializedRef = useRef(false);
  const searchEffectInitializedRef = useRef(false);
  const pdfRef = useRef(null);

  // API data states
  const [plansData, setPlansData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [revenueInsights, setRevenueInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination for subscriptions
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('subscriptions_page_size');
    return saved ? parseInt(saved) : 25;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total_count: 0,
    total_pages: 1,
  });
  const [showSubscribersModal, setShowSubscribersModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSubscribers, setModalSubscribers] = useState([]);

  // Detail Modal States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFirmSubscription, setSelectedFirmSubscription] = useState(null);
  const [firmDetails, setFirmDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [planUpdating, setPlanUpdating] = useState({});
  const [showManagePlansModal, setShowManagePlansModal] = useState(false);
  const [selectedFirmForPlan, setSelectedFirmForPlan] = useState(null);

  // Edit Plan Definition Modal States
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const handleEditPlan = async (planType) => {
    setEditLoading(true);
    try {
      const response = await superAdminAPI.getSubscriptionPlanDetails(planType);
      if (response.success) {
        setSelectedPlanForEdit(response.data);
        setShowEditPlanModal(true);
      } else {
        toast.error(response.message || 'Failed to fetch plan details');
      }
    } catch (err) {
      console.error('Error fetching plan details:', err);
      toast.error(handleAPIError(err));
    } finally {
      setEditLoading(false);
    }
  };

  const handlePlanToggle = async (planType, field, currentValue) => {
    const planKey = planType.toLowerCase();
    setPlanUpdating(prev => ({ ...prev, [planKey]: true }));
    try {
      await superAdminAPI.updateSubscriptionPlan(planType, { [field]: !currentValue });
      toast.success(`Plan updated successfully`);
      // Assuming fetchPlans is a function that refreshes the plan data
      // If not, you might need to pass it as a prop or define it here
      // fetchPlans(); 
    } catch (err) {
      console.error(`Error updating plan ${field}:`, err);
      toast.error(`Failed to update plan: ${handleAPIError(err)}`);
    } finally {
      setPlanUpdating(prev => ({ ...prev, [planKey]: false }));
    }
  };

  const PLAN_CONFIG = [
    { key: 'starter', label: 'Starter' },
    { key: 'growth', label: 'Growth' },
    { key: 'pro', label: 'Pro' },
    { key: 'elite', label: 'Elite' }
  ];

  const planLookup = (plansData?.plans || []).reduce((acc, plan) => {
    if (!plan) {
      return acc;
    }
    const directKey = plan.plan_type?.toLowerCase?.();
    const displayKey = plan.plan_display?.toLowerCase?.();
    if (directKey) {
      acc[directKey] = plan;
    }
    if (displayKey) {
      acc[displayKey] = plan;
    }
    return acc;
  }, {});

  // Create revenue by plan lookup
  const revenueByPlanLookup = (revenueInsights?.revenue_by_plan || []).reduce((acc, revenuePlan) => {
    if (revenuePlan?.plan) {
      acc[revenuePlan.plan.toLowerCase()] = revenuePlan;
    }
    return acc;
  }, {});

  const handleOpenAddPlan = (planLabel, planKey) => {
    setSelectedPlan(planLabel || planKey || 'Starter');
    setshowAddPlan(true);
  };

  const getPlanBadgeStyles = (planType) => {
    const normalizedType = planType?.toLowerCase?.();
    switch (normalizedType) {
      case 'starter':
        return { badgeClass: 'bg-[#FBBF24]', textClass: 'text-white' };
      case 'team':
      case 'growth':
        return { badgeClass: 'bg-green-500', textClass: 'text-white' };
      case 'pro':
        return { badgeClass: 'bg-[#1E40AF]', textClass: 'text-white' };
      case 'elite':
        return { badgeClass: 'bg-[#CEC6FF]', textClass: 'text-[#1E1B4B]' };
      default:
        return { badgeClass: 'bg-[var(--sa-bg-secondary)]0', textClass: 'text-white' };
    }
  };

  // Generate month options (1-12)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const date = new Date(2000, monthNum - 1, 1);
    return {
      value: monthNum.toString(),
      label: date.toLocaleString('default', { month: 'short' })
    };
  });

  // Generate year options (current year and 5 years back)
  const currentYearNum = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const year = currentYearNum - i;
    return { value: year.toString(), label: year.toString() };
  });

  const formatCurrency = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return '$0.00';
    }
    return numeric.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatPercentage = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return `${value}`;
    }
    return `${numeric.toFixed(1)}%`;
  };

  const formatNumber = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return value ?? '0';
    }
    return numeric.toLocaleString();
  };

  const formatDateTime = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const formatDateDisplay = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExportReport = async () => {
    if (!pdfRef.current) {
      toast.warning('No data available to export.', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (subscriptions.length === 0) {
      toast.warning('No subscriptions available to export.', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Generate PDF blob
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Open PDF in new window first
      window.open(pdfUrl, '_blank');

      // Then trigger download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `subscriptions-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 100);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const fetchSubscriptionsData = useCallback(
    async ({ search = '', status = '', plan = '', page = 1, limit = 25 } = {}) => {
      setTableLoading(true);
      setTableError(null);

      try {
        const response = await superAdminAPI.getSuperadminSubscriptions({
          search: search?.trim?.() ?? '',
          status,
          plan,
          page,
          limit
        });
        const data = response?.data || {};
        setSubscriptions(data.subscriptions || []);

        // Populate metrics from API response
        if (data.metrics) {
          setMetrics(data.metrics);
        }

        // Populate notification settings from API response
        if (data.notification_settings) {
          setEmailNotifications(Boolean(data.notification_settings.subscription_email_updates_enabled));
          setSmsAlerts(Boolean(data.notification_settings.subscription_sms_updates_enabled));
        }

        if (Array.isArray(data.filters?.status_options)) {
          setStatusOptions(data.filters.status_options);
        }
        if (Array.isArray(data.filters?.plan_options)) {
          setPlanOptions(data.filters.plan_options);
        }

        // Update pagination metadata from API
        setPagination({
          total_count: data.total_count || 0,
          total_pages: data.total_pages || 1
        });
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
        setTableError(handleAPIError(err));
        setSubscriptions([]);
      } finally {
        setTableLoading(false);
      }
    },
    []
  );

  const getStatusBadgeClasses = (status) => {
    const normalized = status?.toLowerCase?.();
    switch (normalized) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'suspended':
        return 'bg-red-100 text-red-700';
      case 'trial':
        return 'bg-blue-100 text-blue-700';
      case 'inactive':
        return 'bg-gray-200 text-[var(--sa-text-primary)]';
      default:
        return 'bg-gray-200 text-[var(--sa-text-primary)]';
    }
  };

  // Handle apply filter button click
  const handleApplyFilter = () => {
    setAppliedFilterMonth(filterMonth);
    setAppliedFilterYear(filterYear);
  };

  // Fetch plan performance data with applied filters
  const fetchPlanPerformance = useCallback(async () => {
    try {
      const params = {};
      if (appliedFilterMonth && appliedFilterYear) {
        // Apply same filter to both MRR and Churn Rate
        params.mrr_month = parseInt(appliedFilterMonth);
        params.mrr_year = parseInt(appliedFilterYear);
        params.churn_month = parseInt(appliedFilterMonth);
        params.churn_year = parseInt(appliedFilterYear);
      }
      const planPerformanceResponse = await superAdminAPI.getSuperadminPlanPerformance(params);
      setPlanPerformance(planPerformanceResponse.data || null);
    } catch (err) {
      console.error('Error fetching plan performance data:', err);
      // Don't set main error, just log it
    }
  }, [appliedFilterMonth, appliedFilterYear]);

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch plans, chart data, plan performance, and revenue insights in parallel
        const params = {};
        if (appliedFilterMonth && appliedFilterYear) {
          // Apply same filter to both MRR and Churn Rate
          params.mrr_month = parseInt(appliedFilterMonth);
          params.mrr_year = parseInt(appliedFilterYear);
          params.churn_month = parseInt(appliedFilterMonth);
          params.churn_year = parseInt(appliedFilterYear);
        }

        const [plansResponse, chartsResponse, planPerformanceResponse, revenueInsightsResponse] = await Promise.all([
          superAdminAPI.getSubscriptionPlans(),
          superAdminAPI.getSubscriptionCharts('revenue', 30),
          superAdminAPI.getSuperadminPlanPerformance(params),
          superAdminAPI.getRevenueInsights({ days: 30 })
        ]);

        setPlansData(plansResponse.data);
        if (plansResponse.data && Array.isArray(plansResponse.data.plans)) {
          const options = plansResponse.data.plans.map(p => ({
            label: p.display_name,
            value: p.subscription_type
          }));
          setPlanOptions(options);
        }
        setChartData(chartsResponse.data);
        setPlanPerformance(planPerformanceResponse.data || null);
        setRevenueInsights(revenueInsightsResponse.data || null);
        await fetchSubscriptionsData({ search: searchTerm, status: statusFilter, plan: planFilter, page: currentPage, limit: pageSize });
        setFiltersInitialized(true);
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError(handleAPIError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchSubscriptionsData, searchTerm, statusFilter, planFilter, currentPage, pageSize, appliedFilterMonth, appliedFilterYear]);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    localStorage.setItem('subscriptions_page_size', newSize.toString());
  };

  // Fetch plan performance when applied filters change
  useEffect(() => {
    if (filtersInitialized) {
      fetchPlanPerformance();
    }
  }, [appliedFilterMonth, appliedFilterYear, filtersInitialized, fetchPlanPerformance]);

  const handleNotificationUpdate = async (updates = {}) => {
    if (savingNotifications) return;

    const previous = {
      email: emailNotifications,
      sms: smsAlerts
    };

    const nextEmail = updates.subscription_email_updates_enabled ?? emailNotifications;
    const nextSms = updates.subscription_sms_updates_enabled ?? smsAlerts;

    setEmailNotifications(nextEmail);
    setSmsAlerts(nextSms);
    setSavingNotifications(true);
    setNotificationError(null);

    try {
      const response = await superAdminAPI.updateSubscriptionNotifications({
        subscription_email_updates_enabled: nextEmail,
        subscription_sms_updates_enabled: nextSms
      });

      const updatedSettings = response?.data || {};
      setEmailNotifications(Boolean(updatedSettings.subscription_email_updates_enabled ?? nextEmail));
      setSmsAlerts(Boolean(updatedSettings.subscription_sms_updates_enabled ?? nextSms));
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setNotificationError(handleAPIError(err));
      setEmailNotifications(previous.email);
      setSmsAlerts(previous.sms);
    } finally {
      setSavingNotifications(false);
    }
  };

  useEffect(() => {
    if (!filtersInitialized) return;
    if (!filtersEffectInitializedRef.current) {
      filtersEffectInitializedRef.current = true;
      return;
    }
    fetchSubscriptionsData({ search: searchTerm, status: statusFilter, plan: planFilter, page: currentPage, limit: pageSize });
  }, [statusFilter, planFilter, filtersInitialized, fetchSubscriptionsData, currentPage, pageSize, searchTerm]);

  useEffect(() => {
    if (!filtersInitialized) return;
    if (!searchEffectInitializedRef.current) {
      searchEffectInitializedRef.current = true;
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchSubscriptionsData({ search: searchTerm, status: statusFilter, plan: planFilter, page: currentPage, limit: pageSize });
    }, 400);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, filtersInitialized, fetchSubscriptionsData, currentPage, pageSize, statusFilter, planFilter]);

  // If edit plan is open, show the edit plan screen (moved after all hooks)
  if (showEditPlan) {
    return (
      <EditSubscriptionPlan
        planType={selectedPlan}
        onClose={() => setShowEditPlan(false)}
      />
    );
  }

  // If add plan is open, show the add plan screen (moved after all hooks)
  if (showAddPlan) {
    return (
      <AddSubscription
        planType={selectedPlan}
        onClose={() => setshowAddPlan(false)}
      />
    );
  }

  const mrrTrend = planPerformance?.mrr_trend || [];
  const churnTrend = planPerformance?.churn_trend || [];
  const planDistributionData = planPerformance?.plan_distribution || [];
  const mrrValues = mrrTrend.map(item => Number(item?.value ?? 0));
  const churnValues = churnTrend.map(item => Number(item?.value ?? 0));
  const mrrMax = mrrValues.length ? Math.max(...mrrValues) : 0;
  const mrrMin = mrrValues.length ? Math.min(...mrrValues) : 0;
  const churnMax = churnValues.length ? Math.max(...churnValues) : 0;
  const distributionMax = planDistributionData.reduce((max, item) => Math.max(max, item?.firms ?? 0), 0);

  const startItem = pagination.total_count ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, pagination.total_count);

  const handleActiveSubscribersClick = async () => {
    setShowSubscribersModal(true);
    setModalLoading(true);
    try {
      // Fetch active subscribers for the modal. Limit 100 for global view.
      const response = await superAdminAPI.getSuperadminSubscriptions({
        status: 'active',
        limit: 100
      });
      // We only want firms with an actual plan assigned
      const activeSubs = (response?.data?.subscriptions || []).filter(s => s.plan && s.plan !== 'No Plan');
      setModalSubscribers(activeSubs);
    } catch (err) {
      console.error('Error fetching modal subscribers:', err);
      toast.error('Failed to load active subscribers');
    } finally {
      setModalLoading(false);
    }
  };

  const fetchFirmDetails = async (firmId) => {
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const response = await superAdminAPI.getSuperadminFirmDetail(firmId);
      setFirmDetails(response.data || null);
    } catch (err) {
      console.error('Error fetching firm details:', err);
      setDetailsError(handleAPIError(err));
      toast.error('Failed to load subscription details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRowClick = (subscription) => {
    setSelectedFirmSubscription(subscription);
    setFirmDetails(null); // Clear previous details
    setShowDetailModal(true);
    fetchFirmDetails(subscription.firm_id);
  };

  const handleManagePlan = (firm) => {
    setSelectedFirmForPlan(firm);
    setShowManagePlansModal(true);
  };



  // Loading state
  if (loading) {
    return (
      <div className="w-full h-full p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-[var(--sa-text-secondary)]">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-full p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-[var(--sa-text-primary)] mb-2">Error Loading Data</h3>
          <p className="text-[var(--sa-text-secondary)] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            style={{ borderRadius: '7px' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full p-6 pb-24 subscriptions-page">
      {/* Hidden PDF Content */}
      <div ref={pdfRef} style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm', padding: '20mm', backgroundColor: 'white' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--sa-text-primary)', marginBottom: '10px' }}>
            Subscriptions Report
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--sa-text-secondary)', marginBottom: '5px' }}>
            Generated on: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--sa-text-secondary)' }}>
            Total Subscriptions: {subscriptions.length}
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '2px solid #E5E7EB' }}>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: 'var(--sa-text-primary)', border: '1px solid #E5E7EB' }}>Firm</th>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: 'var(--sa-text-primary)', border: '1px solid #E5E7EB' }}>Plan</th>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: 'var(--sa-text-primary)', border: '1px solid #E5E7EB' }}>Amount</th>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: 'var(--sa-text-primary)', border: '1px solid #E5E7EB' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: 'var(--sa-text-primary)', border: '1px solid #E5E7EB' }}>Next Billing</th>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: 'var(--sa-text-primary)', border: '1px solid #E5E7EB' }}>Total Paid</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription, index) => (
              <tr key={`${subscription.firm_id}-${subscription.plan}-${index}`} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '10px', fontSize: '11px', color: 'var(--sa-text-primary)', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontWeight: '600' }}>{subscription.firm_name || '—'}</div>
                  <div style={{ fontSize: '10px', color: 'var(--sa-text-secondary)' }}>{subscription.firm_owner || '—'}</div>
                </td>
                <td style={{ padding: '10px', fontSize: '11px', color: 'var(--sa-text-primary)', border: '1px solid #E5E7EB' }}>
                  {subscription.plan_label || subscription.plan || '—'}
                </td>
                <td style={{ padding: '10px', fontSize: '11px', color: 'var(--sa-text-primary)', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontWeight: '600' }}>{subscription.amount_formatted || formatCurrency(subscription.amount)}</div>
                  <div style={{ fontSize: '10px', color: 'var(--sa-text-secondary)' }}>{subscription.billing_frequency || '—'}</div>
                </td>
                <td style={{ padding: '10px', fontSize: '11px', color: 'var(--sa-text-primary)', border: '1px solid #E5E7EB' }}>
                  {subscription.status_label || subscription.status || '—'}
                </td>
                <td style={{ padding: '10px', fontSize: '11px', color: 'var(--sa-text-primary)', border: '1px solid #E5E7EB' }}>
                  {formatDateDisplay(subscription.next_billing_date)}
                </td>
                <td style={{ padding: '10px', fontSize: '11px', fontWeight: '600', color: 'var(--sa-text-primary)', border: '1px solid #E5E7EB' }}>
                  {subscription.total_paid_formatted || formatCurrency(subscription.total_paid)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8 subscriptions-header">
        <div>
          <h3 className="taxdashboardr-titler font-bold mb-2" style={{ color: 'var(--sa-text-primary)' }}>Subscription & Billing Management</h3>
          <p style={{ color: 'var(--sa-text-primary)' }}>Monitor and manage all platform subscriptions</p>
        </div>
        <div className="flex gap-3 subscriptions-actions">
          <button
            onClick={handleExportReport}
            className="px-2 py-1 text-[10px] bg-[var(--sa-bg-card)] border border-[var(--sa-border-color)] text-[var(--sa-text-primary)] rounded-lg transition-colors flex items-center gap-1"
            style={{ borderRadius: '7px' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export Report
          </button>
          <button
            onClick={() => {
              setSelectedPlan('Starter');
              setShowEditPlan(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-[10px] text-white transition-colors"
            style={{ backgroundColor: '#F56D2D', borderRadius: '7px' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e55a2b'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#F56D2D'}
          >
            <FaEdit className="text-sm" />
            Edit Plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="bg-[var(--sa-bg-card)] rounded-lg border border-[var(--sa-border-color)] p-1.5 w-fit">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('Plans')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${activeTab === 'Plans'
                ? 'bg-[#3AD6F2] text-white'
                : 'bg-transparent text-[var(--sa-text-primary)] hover:bg-[var(--sa-bg-secondary)]'
                }`}
              style={{ borderRadius: '7px' }}
            >
              Subscription Plans
            </button>

            <button
              onClick={() => setActiveTab('Invoices')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${activeTab === 'Invoices'
                ? 'bg-[#3AD6F2] text-white'
                : 'bg-transparent text-[var(--sa-text-primary)] hover:bg-[var(--sa-bg-secondary)]'
                }`}
              style={{ borderRadius: '7px' }}
            >
              Subscription Invoices
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'Invoices' ? (
        <SubscriptionInvoicesTab plansData={plansData} />
      ) : (
        <>
          {/* Metric Cards and main subscriptions content */}
          <div className="grid grid-cols-4 gap-6 mb-8 subscriptions-metrics">
            {/* Total Revenue */}
            <div className="bg-[var(--sa-bg-card)] p-4" style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold mb-1 uppercase tracking-tight" style={{ color: 'var(--sa-text-primary)' }}>Total Revenue</p>
                  <p className="text-lg font-bold mb-0" style={{ color: 'var(--sa-text-primary)' }}>
                    {metrics?.total_revenue?.formatted || '$0.00'}
                  </p>
                  {/* {metrics?.total_revenue && (
                <div className="flex items-center gap-1">
                  {metrics.total_revenue.trend === 'up' && (
                    <>
                      <ArrowgreenIcon className="text-xs" style={{ color: '#10B981' }} />
                      <span className="text-xs font-medium" style={{ color: '#10B981' }}>
                        +{metrics.total_revenue.percentage_increase?.toFixed(1) || '0'}%
                      </span>
                    </>
                  )}
                  {metrics.total_revenue.trend === 'down' && (
                    <>
                      <RedDownIcon className="text-xs" style={{ color: '#EF4444' }} />
                      <span className="text-xs font-medium" style={{ color: '#EF4444' }}>
                        {metrics.total_revenue.percentage_increase?.toFixed(1) || '0'}%
                      </span>
                    </>
                  )}
                  {metrics.total_revenue.trend === 'neutral' && (
                    <>
                      <span className="text-xs font-medium" style={{ color: 'var(--sa-text-secondary)' }}>
                        {metrics.total_revenue.percentage_increase?.toFixed(1) || '0'}%
                      </span>
                    </>
                  )}
                </div>
              )} */}
                </div>
                <BlueDollarIcon className="text-lg" />
              </div>
            </div>

            {/* Active Subscribers */}
            <div
              className="bg-[var(--sa-bg-card)] p-4 cursor-pointer hover:shadow-md transition-shadow group relative"
              style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}
              onClick={handleActiveSubscribersClick}
              title="Click to view all active subscribers"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold mb-1 group-hover:text-blue-500 transition-colors uppercase tracking-tight" style={{ color: 'var(--sa-text-primary)' }}>Active Subscribers</p>
                  <p className="text-lg font-bold mb-0" style={{ color: 'var(--sa-text-primary)' }}>
                    {metrics?.active_subscribers?.formatted || '0'}
                  </p>

                </div>
                <BlueUserIcon className="text-lg group-hover:scale-110 transition-transform" />
              </div>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-blue-500 font-medium">View All →</span>
              </div>
            </div>

            {/* Most Popular Plan */}
            <div className="bg-[var(--sa-bg-card)] p-4" style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold mb-1 uppercase tracking-tight" style={{ color: 'var(--sa-text-primary)' }}>Most Popular Plan</p>
                  <p className="text-lg font-bold mb-0" style={{ color: 'var(--sa-text-primary)' }}>
                    {metrics?.most_popular_plan?.plan_label || 'N/A'}
                  </p>
                  {metrics?.most_popular_plan && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        {/* {metrics.most_popular_plan.trend === 'up' && (
                      <>
                        <ArrowgreenIcon className="text-xs" style={{ color: '#10B981' }} />
                        <span className="text-xs font-medium" style={{ color: '#10B981' }}>
                          +{metrics.most_popular_plan.percentage_increase?.toFixed(1) || '0'}%
                        </span>
                      </>
                    )}
                    {metrics.most_popular_plan.trend === 'down' && (
                      <>
                        <RedDownIcon className="text-xs" style={{ color: '#EF4444' }} />
                        <span className="text-xs font-medium" style={{ color: '#EF4444' }}>
                          {metrics.most_popular_plan.percentage_increase?.toFixed(1) || '0'}%
                        </span>
                      </>
                    )}
                    {metrics.most_popular_plan.trend === 'neutral' && (
                      <>
                        <span className="text-xs font-medium" style={{ color: 'var(--sa-text-secondary)' }}>
                          {metrics.most_popular_plan.percentage_increase?.toFixed(1) || '0'}%
                        </span>
                      </>
                    )} */}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--sa-text-secondary)' }}>
                        {metrics.most_popular_plan.count || 0} subscribers
                      </span>
                    </div>
                  )}
                </div>
                <BlueClockIcon className="text-lg" />
              </div>
            </div>

            {/* Average Growth */}
            <div className="bg-[var(--sa-bg-card)] p-4" style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold mb-1 uppercase tracking-tight" style={{ color: 'var(--sa-text-primary)' }}>Average Growth</p>
                  <p className="text-lg font-bold mb-0" style={{ color: 'var(--sa-text-primary)' }}>
                    {metrics?.average_growth?.formatted || '+0.00%'}
                  </p>
                  {metrics?.average_growth && (
                    <div className="flex items-center gap-1">
                      {metrics.average_growth.trend === 'up' && (
                        <>
                          <ArrowgreenIcon className="text-xs" style={{ color: '#10B981' }} />
                          <span className="text-xs font-medium" style={{ color: '#10B981' }}>
                            Monthly
                          </span>
                        </>
                      )}
                      {metrics.average_growth.trend === 'down' && (
                        <>
                          <RedDownIcon className="text-xs" style={{ color: '#EF4444' }} />
                          <span className="text-xs font-medium" style={{ color: '#EF4444' }}>
                            Monthly
                          </span>
                        </>
                      )}
                      {metrics.average_growth.trend === 'neutral' && (
                        <>
                          <span className="text-xs font-medium" style={{ color: 'var(--sa-text-secondary)' }}>
                            Monthly
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <BlueExclamationTriangleIcon className="text-lg" />
              </div>
              {(notificationError || savingNotifications) && (
                <div className="mt-2 px-1">
                  {notificationError ? (
                    <p className="text-xs text-red-500">{notificationError}</p>
                  ) : (
                    <p className="text-xs text-[var(--sa-text-secondary)]">Saving notification settings...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Plan and Alerts Section */}
          <div className="grid gap-8 mb-8 subscriptions-plan-grid" style={{ gridTemplateColumns: '70% 25%' }}>
            {/* Plan Section */}
            <div className='bg-[var(--sa-bg-card)] p-3' style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}>
              <div className="flex justify-between items-center mb-3 ">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--sa-text-primary)' }}>Plan</h3>
                  <p className="text-sm" style={{ color: 'var(--sa-text-primary)' }}>Revenue and growth metrics by subscription plan</p>
                </div>
              </div>

              <div className="space-y-2">
                {PLAN_CONFIG.map(({ key, label }) => {
                  const normalizedKey = key.toLowerCase();
                  const plan = planLookup[normalizedKey] || planLookup[label.toLowerCase()];
                  const revenuePlan = revenueByPlanLookup[normalizedKey];

                  if (plan) {
                    const { badgeClass, textClass } = getPlanBadgeStyles(plan.plan_type || label);
                    return (
                      <div
                        key={normalizedKey}
                        className="bg-[var(--sa-bg-card)] p-2 cursor-pointer hover:bg-[var(--sa-bg-secondary)] transition-colors"
                        style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}
                        onClick={() => {
                          setSelectedPlan(plan.plan_display || label);
                          setShowEditPlan(true);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <span className={`${badgeClass} ${textClass} px-3 py-1 rounded-full text-xs font-medium`}>
                              {(() => {
                                const name = plan.plan_display || label || '';
                                return name.charAt(0).toUpperCase() + name.slice(1);
                              })()}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPlan(plan.plan_type || label);
                              }}
                              className="p-1 text-[var(--sa-text-secondary)] hover:text-blue-500 transition-colors"
                              title="Edit Plan Definition"
                            >
                              <FaEdit size={14} />
                            </button>
                            <div>
                              <p className="text-xs mb-1" style={{ color: 'var(--sa-text-primary)', fontWeight: '800' }}>
                                {plan.total_subscribers} subscribers
                              </p>
                              <div className='flex flex-col gap-1'>
                                {revenuePlan && (
                                  <>
                                    <div className='flex flex-row gap-2'>
                                      <p className="text-xs" style={{ color: 'var(--sa-text-primary)' }}>
                                        {revenuePlan.formatted_revenue || '$0.00'} revenue
                                      </p>
                                      <p className="text-xs" style={{ color: 'var(--sa-text-secondary)' }}>
                                        ({revenuePlan.percentage?.toFixed(1) || '0'}%)
                                      </p>
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--sa-text-secondary)' }}>
                                      {revenuePlan.invoice_count || 0} invoice{revenuePlan.invoice_count !== 1 ? 's' : ''}
                                    </p>
                                  </>
                                )}
                                {!revenuePlan && (
                                  <div className='flex flex-row gap-2'>
                                    <p className="text-xs" style={{ color: 'var(--sa-text-primary)' }}>
                                      {plan.formatted_revenue || '$0.00'} revenue.
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--sa-text-primary)' }}>
                                      {plan.formatted_growth || '0%'} growth
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[var(--sa-text-secondary)] font-bold uppercase tracking-tight">Active</span>
                              <button
                                type="button"
                                onClick={() => handlePlanToggle(plan.plan_type || label, 'is_active', plan.is_active)}
                                disabled={planUpdating[normalizedKey]}
                                className="relative inline-flex h-5 w-9 items-center transition-colors disabled:opacity-60"
                                style={{
                                  borderRadius: '20px',
                                  backgroundColor: plan.is_active ? '#F56D2D' : '#D1D5DB'
                                }}
                              >
                                <span
                                  className={`inline-block h-3 w-3 transform rounded-full bg-[var(--sa-bg-card)] transition-transform ${plan.is_active ? 'translate-x-5' : 'translate-x-1'}`}
                                />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[var(--sa-text-secondary)] font-bold uppercase tracking-tight">Show on Website</span>
                              <button
                                type="button"
                                onClick={() => handlePlanToggle(plan.plan_type || label, 'show_on_website', plan.show_on_website)}
                                disabled={planUpdating[normalizedKey]}
                                className="relative inline-flex h-5 w-9 items-center transition-colors disabled:opacity-60"
                                style={{
                                  borderRadius: '20px',
                                  backgroundColor: plan.show_on_website ? '#F56D2D' : '#D1D5DB'
                                }}
                              >
                                <span
                                  className={`inline-block h-3 w-3 transform rounded-full bg-[var(--sa-bg-card)] transition-transform ${plan.show_on_website ? 'translate-x-5' : 'translate-x-1'}`}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const { badgeClass, textClass } = getPlanBadgeStyles(label);
                  return (
                    <div
                      key={normalizedKey}
                      className="bg-[var(--sa-bg-card)] p-4 border border-dashed border-[var(--sa-border-color)] rounded-[7px] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`${badgeClass} ${textClass} px-3 py-1 rounded-full text-sm font-medium`}>
                          {label}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium" style={{ color: 'var(--sa-text-primary)' }}>
                            No {label} plan configured
                          </span>
                          <span className="text-xs text-[var(--sa-text-secondary)]">
                            Click the plus icon to create this plan
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenAddPlan(label, normalizedKey)}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F56D2D] text-white"
                        style={{ borderRadius: '50%' }}
                        title={`Create ${label} plan`}
                      >
                        <AddSubscriptionPlanIcon className="w-4 h-4" stroke="white" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alerts & Notifications */}
            <div className='bg-[var(--sa-bg-card)] p-3' style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px', height: 'fit-content' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--sa-text-primary)' }}>Alerts & Notifications</h3>

              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="bg-[var(--sa-bg-card)] p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--sa-text-primary)' }}>Email Notifications</p>
                      <p className="text-xs" style={{ color: 'var(--sa-text-primary)' }}>Send email when  <br /> subscription events occur</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationUpdate({ subscription_email_updates_enabled: !emailNotifications })}
                      disabled={savingNotifications}
                      className="relative inline-flex h-6 w-11 items-center transition-colors disabled:opacity-60"
                      style={{
                        borderRadius: '20px',
                        backgroundColor: emailNotifications ? '#F56D2D' : '#D1D5DB'
                      }}
                      aria-pressed={emailNotifications}
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-[var(--sa-bg-card)] transition-transform"
                        style={{
                          transform: emailNotifications ? 'translateX(24px)' : 'translateX(4px)'
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* SMS Alerts */}
                <div className="bg-[var(--sa-bg-card)] p-4" >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--sa-text-primary)' }}>SMS Alerts</p>
                      <p className="text-xs" style={{ color: 'var(--sa-text-primary)' }}>Optional SMS notifications</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationUpdate({ subscription_sms_updates_enabled: !smsAlerts })}
                      disabled={savingNotifications}
                      className="relative inline-flex h-6 w-11 items-center transition-colors disabled:opacity-60"
                      style={{
                        borderRadius: '20px',
                        backgroundColor: smsAlerts ? '#F56D2D' : '#D1D5DB'
                      }}
                      aria-pressed={smsAlerts}
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-[var(--sa-bg-card)] transition-transform"
                        style={{
                          transform: smsAlerts ? 'translateX(24px)' : 'translateX(4px)'
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Engagement Metrics Section */}


          {/* Plan Performance Section */}
          <div className="mb-8 bg-[var(--sa-bg-card)] p-4" style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}>
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between subscriptions-plan-performance-header">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--sa-text-primary)' }}>Plan Performance</h3>
                  <p className="text-xs" style={{ color: 'var(--sa-text-primary)' }}>MRR, churn, and plan distribution</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {/* Filter Dropdowns - Upper Right */}
                  <div className="flex gap-2 items-end subscriptions-plan-filter-row">
                    <select
                      value={filterMonth}
                      onChange={(e) => {
                        setFilterMonth(e.target.value);
                        if (!e.target.value) setFilterYear('');
                      }}
                      className="px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 subscriptions-plan-filter-control"
                      style={{ border: '1px solid var(--sa-border-color)', color: 'var(--sa-text-primary)' }}
                    >
                      <option value="">All Months</option>
                      {monthOptions.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                    <select
                      value={filterYear}
                      onChange={(e) => {
                        setFilterYear(e.target.value);
                        if (!e.target.value) setFilterMonth('');
                      }}
                      className="px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 subscriptions-plan-filter-control"
                      style={{ border: '1px solid var(--sa-border-color)', color: 'var(--sa-text-primary)' }}
                      disabled={!filterMonth}
                    >
                      <option value="">Year</option>
                      {yearOptions.map(year => (
                        <option key={year.value} value={year.value}>{year.label}</option>
                      ))}
                    </select>
                    <button
                      className="px-4 py-1.5 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed subscriptions-apply-btn"
                      onClick={handleApplyFilter}
                      disabled={!filterMonth || !filterYear}
                      style={{ backgroundColor: '#3B82F6', borderRadius: '7px' }}
                    >
                      Apply
                    </button>
                    {(filterMonth && filterYear) && (
                      <button
                        onClick={() => {
                          setFilterMonth('');
                          setFilterYear('');
                          setAppliedFilterMonth('');
                          setAppliedFilterYear('');
                        }}
                        className="px-2 py-1.5 text-xs text-[var(--sa-text-secondary)] hover:text-[var(--sa-text-primary)] subscriptions-clear-btn"
                        title="Clear filter"
                        style={{ borderRadius: '7px' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {planPerformance?.timestamp && (
                    <span className="text-xs text-[var(--sa-text-secondary)]">
                      Last updated: {formatDateTime(planPerformance.timestamp)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {planPerformance ? (
              <div className="grid gap-6 lg:grid-cols-2 subscriptions-plan-performance-grid">
                <div className="border border-[var(--sa-border-color)] rounded-[10px] p-3 subscriptions-plan-card">
                  <h4 className="text-xs font-bold text-[var(--sa-text-primary)] mb-2 uppercase tracking-tight">Monthly Recurring Revenue</h4>
                  {mrrTrend.length > 0 ? (() => {
                    const svgWidth = 400;
                    const svgHeight = 180;
                    const paddingX = 40;
                    const paddingY = 24;
                    const innerWidth = svgWidth - paddingX * 2;
                    const innerHeight = svgHeight - paddingY * 2;
                    const stepWidth = mrrTrend.length ? innerWidth / mrrTrend.length : innerWidth;
                    const barWidth = stepWidth * 0.5;
                    const range = mrrMax - mrrMin || Math.max(mrrMax, 1);

                    return (
                      <div className="relative h-48 mt-2">
                        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full subscriptions-mrr-chart">
                          {[0, 1, 2, 3, 4].map((step) => {
                            const y = paddingY + (innerHeight / 4) * step;
                            const labelValue = mrrMax - (range / 4) * step;
                            return (
                              <g key={`mrr-grid-${step}`}>
                                <line
                                  x1={paddingX}
                                  y1={y}
                                  x2={svgWidth - paddingX}
                                  y2={y}
                                  stroke="#E5E7EB"
                                  strokeWidth="1"
                                  opacity="0.6"
                                />
                                <text
                                  x={paddingX - 8}
                                  y={y + 4}
                                  textAnchor="end"
                                  fontSize="10"
                                  fill="var(--sa-text-secondary)"
                                >
                                  {formatCurrency(labelValue)}
                                </text>
                              </g>
                            );
                          })}
                          {mrrTrend.map((item, index) => {
                            const value = Number(item?.value ?? 0);
                            const height = range > 0 ? ((value - mrrMin) / range) * innerHeight : (value > 0 ? innerHeight * 0.3 : 0);
                            const x = paddingX + stepWidth * index + (stepWidth - barWidth) / 2;
                            const y = paddingY + innerHeight - height;
                            return (
                              <g key={`mrr-bar-${item.month}-${index}`}>
                                <rect
                                  x={x}
                                  y={y}
                                  width={barWidth}
                                  height={height}
                                  fill="var(--sa-text-primary)"
                                  rx="6"
                                />
                                <text
                                  x={x + barWidth / 2}
                                  y={y - 6}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fill="var(--sa-text-primary)"
                                  fontWeight="600"
                                >
                                  {formatCurrency(value)}
                                </text>
                                <text
                                  x={x + barWidth / 2}
                                  y={svgHeight - 8}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fill="var(--sa-text-secondary)"
                                >
                                  {item.month || `M${index + 1}`}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })() : (
                    <p className="text-xs text-[var(--sa-text-secondary)] mt-4">No revenue trend data available.</p>
                  )}
                </div>

                <div className="border border-[var(--sa-border-color)] rounded-[10px] p-3 subscriptions-plan-card">
                  <h4 className="text-xs font-bold text-[var(--sa-text-primary)] mb-2 uppercase tracking-tight">Churn Rate</h4>
                  {churnTrend.length > 0 ? (() => {
                    const svgWidth = 400;
                    const svgHeight = 180;
                    const paddingX = 40;
                    const paddingY = 24;
                    const innerWidth = svgWidth - paddingX * 2;
                    const innerHeight = svgHeight - paddingY * 2;
                    const stepWidth = churnTrend.length ? innerWidth / churnTrend.length : innerWidth;
                    const barWidth = stepWidth * 0.5;
                    return (
                      <div className="relative h-48 mt-2">
                        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full subscriptions-churn-chart">
                          {[0, 1, 2, 3, 4].map((step) => {
                            const y = paddingY + (innerHeight / 4) * step;
                            const labelValue = churnMax - ((churnMax / 4) * step);
                            return (
                              <g key={`churn-grid-${step}`}>
                                <line
                                  x1={paddingX}
                                  y1={y}
                                  x2={svgWidth - paddingX}
                                  y2={y}
                                  stroke="#E5E7EB"
                                  strokeWidth="1"
                                  opacity="0.6"
                                />
                                <text
                                  x={paddingX - 8}
                                  y={y + 4}
                                  textAnchor="end"
                                  fontSize="12"
                                  fill="var(--sa-text-secondary)"
                                >
                                  {formatPercentage(labelValue)}
                                </text>
                              </g>
                            );
                          })}
                          {churnTrend.map((item, index) => {
                            const value = Number(item?.value ?? 0);
                            const height = churnMax ? (value / churnMax) * innerHeight : 0;
                            const x = paddingX + stepWidth * index + (stepWidth - barWidth) / 2;
                            const y = paddingY + innerHeight - height;
                            return (
                              <g key={`churn-bar-${item.month}-${index}`}>
                                <rect
                                  x={x}
                                  y={y}
                                  width={barWidth}
                                  height={height}
                                  fill="#6366F1"
                                  rx="6"
                                />
                                <text
                                  x={x + barWidth / 2}
                                  y={y - 6}
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="#4C1D95"
                                  fontWeight="600"
                                >
                                  {formatPercentage(value)}
                                </text>
                                <text
                                  x={x + barWidth / 2}
                                  y={svgHeight - 8}
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="var(--sa-text-secondary)"
                                >
                                  {item.month || `M${index + 1}`}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })() : (
                    <p className="text-xs text-[var(--sa-text-secondary)] mt-4">No churn trend data available.</p>
                  )}
                </div>

                <div className="border border-[var(--sa-border-color)] rounded-[10px] p-3 lg:col-span-2 subscriptions-plan-card-full">
                  <h4 className="text-xs font-bold text-[var(--sa-text-primary)] mb-4 uppercase tracking-tight">Plan Distribution</h4>
                  <div className="space-y-3">
                    {planDistributionData.length > 0 ? planDistributionData.map((item) => {
                      const width = distributionMax ? Math.max((item.firms / distributionMax) * 100, 6) : 0;
                      return (
                        <div key={item.plan} className="flex items-center gap-3">
                          <span className="w-24 text-sm font-medium text-[var(--sa-text-primary)]">
                            {item.label}
                          </span>
                          <div className="flex-1 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${width}%`, backgroundColor: '#3B82F6' }}
                            ></div>
                          </div>
                          <span className="w-16 text-right text-xs font-semibold text-[var(--sa-text-primary)]">
                            {formatNumber(item.firms)} firms
                          </span>
                        </div>
                      );
                    }) : (
                      <p className="text-xs text-[var(--sa-text-secondary)]">No plan distribution data available.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--sa-text-secondary)]">Plan performance data is not available at the moment.</p>
            )}
          </div>

          {/* Subscriptions Table */}
          <div className="pb-10">
            {/* Filter Bar */}
            <div className='mb-4'>
              <div className="flex gap-3 subscriptions-filter">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search subscriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}
                    className="w-[400px] pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--sa-bg-card)]"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 text-[var(--sa-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <select
                  className="px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--sa-bg-card)]"
                  style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  {statusOptions.map((option) => (
                    <option key={option.value || option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--sa-bg-card)]"
                  style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                >
                  <option value="">All Plans</option>
                  {planOptions.map((option) => (
                    <option key={option.value || option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-[var(--sa-bg-card)] p-4 mb-10 subscriptions-table-card" style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}>
              <div className="flex justify-between items-center mb-6 subscriptions-table-card-header">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--sa-text-primary)' }}>Subscriptions</h3>
                  <p className="text-sm text-[var(--sa-text-secondary)] mt-1">Showing {startItem}-{endItem} of {pagination.total_count} subscriptions</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[var(--sa-text-secondary)]">Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                    className="text-xs border border-[var(--sa-border-color)] bg-[var(--sa-bg-card)] text-[var(--sa-text-primary)] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#F56D2D]"
                  >
                    {[25, 50, 100, 250].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {tableError && (
                <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md px-4 py-2">
                  {tableError}
                </div>
              )}

              {/* Table Body */}
              <div className="space-y-1.5 subscriptions-table-list">
                {tableLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="flex items-center gap-2 text-sm text-[var(--sa-text-secondary)]">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      Loading subscriptions...
                    </div>
                  </div>
                ) : subscriptions.length > 0 ? (
                  <>
                    {/* Header for list view */}
                    <div className="px-6 py-2 mb-1 subscriptions-table-header">
                      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr_1fr] gap-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sa-text-primary)' }}>
                        <div>Firm</div>
                        <div>Plan</div>
                        <div>Amount</div>
                        <div>Status</div>
                        <div>Next Billing</div>
                        <div>Total Paid</div>
                      </div>
                    </div>

                    {subscriptions.map((subscription) => {
                      const planStyles = getPlanBadgeStyles(subscription.plan);
                      const statusClasses = getStatusBadgeClasses(subscription.status);
                      return (
                        <div 
                          key={`${subscription.firm_id}-${subscription.plan}`} 
                          className="bg-[var(--sa-bg-card)] px-6 py-1.5 subscriptions-table-row hover:bg-[var(--sa-bg-secondary)] transition-colors cursor-pointer" 
                          style={{ border: '1px solid var(--sa-border-color)', borderRadius: '6px' }}
                          onClick={() => handleRowClick(subscription)}
                        >
                          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr_1fr] gap-4 items-center subscriptions-table-row-grid">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: 'var(--sa-text-primary)' }}>
                                {subscription.firm_name || '—'}
                              </p>
                              <p className="text-xs truncate" style={{ color: '#6C757D' }}>
                                {subscription.firm_owner || '—'}
                              </p>
                            </div>
                            <div className="whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${planStyles.badgeClass} ${planStyles.textClass}`}
                                style={{ borderRadius: '12px' }}
                              >
                                {subscription.plan_label || subscription.plan || '—'}
                              </span>
                            </div>
                            <div className="whitespace-nowrap">
                              <p className="text-sm font-semibold" style={{ color: 'var(--sa-text-primary)' }}>
                                {subscription.amount_formatted || formatCurrency(subscription.amount)}
                              </p>
                              <p className="text-[10px]" style={{ color: '#6C757D', fontWeight: 600 }}>
                                {subscription.billing_frequency || '—'}
                              </p>
                            </div>
                            <div className="whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${statusClasses}`}
                                style={{ borderRadius: '12px' }}
                              >
                                {subscription.status_label || subscription.status || '—'}
                              </span>
                            </div>
                            <div className="whitespace-nowrap">
                              <p className="text-sm" style={{ color: 'var(--sa-text-primary)' }}>
                                {formatDateDisplay(subscription.next_billing_date)}
                              </p>
                            </div>
                            <div className="whitespace-nowrap">
                              <p className="text-sm font-semibold" style={{ color: 'var(--sa-text-primary)' }}>
                                {subscription.total_paid_formatted || formatCurrency(subscription.total_paid)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Pagination Footer */}
                    <div className="flex items-center justify-between px-2 py-4 border-t border-[var(--sa-border-color)] mt-4">
                      <span className="text-xs font-medium text-[var(--sa-text-secondary)]">
                        Page {currentPage} of {pagination.total_pages}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1 || tableLoading}
                          className="px-4 py-2 text-xs font-bold text-white bg-[#3AD6F2] hover:bg-[#32c0db] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg shadow-sm"
                          style={{ borderRadius: '7px' }}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.total_pages))}
                          disabled={currentPage === pagination.total_pages || tableLoading}
                          className="px-4 py-2 text-xs font-bold text-white bg-[#3AD6F2] hover:bg-[#32c0db] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg shadow-sm"
                          style={{ borderRadius: '7px' }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-[var(--sa-bg-secondary)] rounded-lg border border-dashed border-[var(--sa-border-color)]">
                    <p className="text-sm text-[var(--sa-text-secondary)]">No subscriptions found for the selected filters.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Subscription Detail Modal */}
      <SubscriptionDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        loading={detailsLoading}
        error={detailsError}
        details={firmDetails}
        subscription={selectedFirmSubscription}
      />

      {/* Subscribers List Modal */}
      <SubscribersListModal
        isOpen={showSubscribersModal}
        onClose={() => setShowSubscribersModal(false)}
        loading={modalLoading}
        subscribers={modalSubscribers}
      />

      {/* Subscription Detail Modal */}
      <SubscriptionDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        loading={detailsLoading}
        error={detailsError}
        details={firmDetails}
        subscription={selectedFirmSubscription}
      />

      {/* Manage Plans Modal */}
      <ManagePlansModal
        isOpen={showManagePlansModal}
        onClose={() => setShowManagePlansModal(false)}
        firm={selectedFirmForPlan}
        onUpdate={() => {
          fetchSubscriptions();
          if (selectedFirmSubscription && selectedFirmSubscription.firm_id === selectedFirmForPlan?.id) {
            fetchFirmDetails(selectedFirmForPlan.id);
          }
        }}
      />

      {/* Edit Plan Definition Modal */}
      <EditPlanModal
        isOpen={showEditPlanModal}
        onClose={() => setShowEditPlanModal(false)}
        plan={selectedPlanForEdit}
        onUpdate={() => {
          // Refresh plan data
          if (typeof fetchPlansData === 'function') {
            fetchPlansData();
          } else {
            window.location.reload(); // Fallback if refresh function not easily accessible
          }
        }}
      />
    </div>
  );
};

// --- Modal Component ---
const SubscribersListModal = ({ isOpen, onClose, loading, subscribers }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-[var(--sa-bg-card)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-[var(--sa-border-color)]">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-[var(--sa-border-color)]">
          <div>
            <h3 className="text-xl font-bold text-[var(--sa-text-primary)]">Active Subscribers</h3>
            <p className="text-sm text-[var(--sa-text-secondary)] mt-1">Total {subscribers.length} firms with active subscriptions</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="var(--sa-text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3AD6F2] mb-4"></div>
              <p className="text-[var(--sa-text-secondary)]">Loading subscriber list...</p>
            </div>
          ) : subscribers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-4 px-4 py-2 text-xs font-bold text-[var(--sa-text-primary)] uppercase tracking-wider bg-[var(--sa-bg-secondary)] rounded-lg">
                <div>Firm Name</div>
                <div>Plan</div>
                <div>Status</div>
                <div>Total Paid</div>
              </div>
              {subscribers.map((sub, idx) => (
                <div key={`${sub.firm_id}-${idx}`} className="grid grid-cols-4 items-center px-4 py-3 border border-[var(--sa-border-color)] rounded-xl hover:bg-[var(--sa-bg-secondary)] transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-[var(--sa-text-primary)]">{sub.firm_name || '—'}</p>
                    <p className="text-xs text-[var(--sa-text-secondary)]">{sub.firm_owner || '—'}</p>
                  </div>
                  <div>
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--sa-border-color)] text-[var(--sa-text-primary)]">
                      {sub.plan_label || sub.plan || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                      {sub.status_label || sub.status || 'Active'}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[var(--sa-text-primary)]">
                    {sub.total_paid_formatted || `$${Number(sub.total_paid || 0).toFixed(2)}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[var(--sa-text-secondary)]">No active subscribers found.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-[var(--sa-border-color)] bg-[var(--sa-bg-secondary)] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#3AD6F2] text-white font-bold rounded-lg transition-colors"
            style={{ borderRadius: '7px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Subscription Invoices Tab Component
const SubscriptionInvoicesTab = ({ plansData }) => {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: 'all',
        search: searchTerm,
        status: statusFilter,
        invoice_type: typeFilter,
      });

      const response = await superAdminAPI.get(`/user/admin/subscription-invoices/?${params}`);
      if (response.success) {
        setInvoices(response.data.invoices);
        setTotalPages(response.data.pagination.total_pages);
        setTotalCount(response.data.pagination.total_count);
      }
    } catch (error) {
      console.error('Error fetching subscription invoices:', error);
      toast.error('Failed to load subscription invoices');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, typeFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await superAdminAPI.get('/user/admin/subscription-invoices/stats/');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    if (Object.keys(stats).length === 0) {
      fetchStats();
    }
  }, [fetchInvoices, fetchStats, stats]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleTypeFilter = (type) => {
    setTypeFilter(type);
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'paid': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-[var(--sa-bg-secondary)] text-[var(--sa-text-primary)]',
    };
    return statusColors[status] || 'bg-[var(--sa-bg-secondary)] text-[var(--sa-text-primary)]';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSendReminder = async (invoiceId) => {
    try {
      const response = await superAdminAPI.sendSubscriptionInvoiceReminder(invoiceId);
      if (response.success) {
        toast.success('Payment reminder sent successfully');
      } else {
        toast.error(response.message || 'Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error(handleAPIError(error));
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8 subscriptions-metrics">
        <div className="bg-[var(--sa-bg-card)] p-4" style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold mb-1 uppercase tracking-tight" style={{ color: 'var(--sa-text-primary)' }}>Total Revenue</p>
              <p className="text-lg font-bold mb-0" style={{ color: 'var(--sa-text-primary)' }}>
                {formatCurrency(stats.total_revenue || 0)}
              </p>
            </div>
            <BlueDollarIcon className="text-lg" />
          </div>
        </div>

        <div className="bg-[var(--sa-bg-card)] p-4" style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold mb-1 uppercase tracking-tight" style={{ color: 'var(--sa-text-primary)' }}>Monthly Revenue</p>
              <p className="text-lg font-bold mb-0" style={{ color: 'var(--sa-text-primary)' }}>
                {formatCurrency(stats.monthly_revenue || 0)}
              </p>
            </div>
            <BlueClockIcon className="text-lg" />
          </div>
        </div>

        <div className="bg-[var(--sa-bg-card)] p-4" style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold mb-1 uppercase tracking-tight" style={{ color: 'var(--sa-text-primary)' }}>Paid Invoices</p>
              <p className="text-lg font-bold mb-0" style={{ color: 'var(--sa-text-primary)' }}>
                {stats.status_counts?.find(s => s.status === 'paid')?.count || 0}
              </p>
            </div>
            <BlueUserIcon className="text-lg" />
          </div>
        </div>

        <div className="bg-[var(--sa-bg-card)] p-4" style={{ border: '1px solid var(--sa-border-color)', borderRadius: '7px' }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold mb-1 uppercase tracking-tight" style={{ color: 'var(--sa-text-primary)' }}>Pending Invoices</p>
              <p className="text-lg font-bold mb-0" style={{ color: 'var(--sa-text-primary)' }}>
                {stats.status_counts?.find(s => s.status === 'pending')?.count || 0}
              </p>
            </div>
            <BlueExclamationTriangleIcon className="text-lg" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--sa-bg-card)] p-6 rounded-lg border border-[var(--sa-border-color)]">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by invoice number or firm name..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-3 py-2 border border-[var(--sa-border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[var(--sa-border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => handleTypeFilter(e.target.value)}
            className="px-3 py-2 border border-[var(--sa-border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Plans</option>
            {(plansData?.plans || []).map(plan => (
              <option key={plan.id} value={plan.subscription_type}>
                {plan.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-[var(--sa-bg-card)] rounded-lg border border-[var(--sa-border-color)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[var(--sa-bg-secondary)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sa-text-secondary)] uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sa-text-secondary)] uppercase tracking-wider">
                  Firm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sa-text-secondary)] uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sa-text-secondary)] uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sa-text-secondary)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--sa-text-secondary)] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--sa-text-secondary)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-[var(--sa-bg-card)] divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-[var(--sa-text-secondary)]">
                    No subscription invoices found
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-[var(--sa-bg-secondary)]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[var(--sa-text-primary)]">
                        {invoice.invoice_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[var(--sa-text-primary)]">
                        {invoice.firm.name}
                      </div>
                      <div className="text-sm text-[var(--sa-text-secondary)]">
                        {invoice.firm.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-[var(--sa-text-primary)] capitalize">
                        {invoice.invoice_type.replace('subscription_', '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-[var(--sa-text-primary)]">
                        {formatCurrency(invoice.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--sa-text-primary)]">
                      {formatDate(invoice.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                        <button
                          onClick={() => handleSendReminder(invoice.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1 ml-auto"
                          title="Send payment reminder"
                        >
                          <FaBell className="h-4 w-4" />
                          <span className="hidden sm:inline">Remind</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-[var(--sa-bg-card)] px-4 py-3 flex items-center justify-between border-t border-[var(--sa-border-color)] sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-[var(--sa-text-primary)] bg-[var(--sa-bg-card)] border border-[var(--sa-border-color)] rounded-md hover:bg-[var(--sa-bg-secondary)] disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium text-[var(--sa-text-primary)] bg-[var(--sa-bg-card)] border border-[var(--sa-border-color)] rounded-md hover:bg-[var(--sa-bg-secondary)] disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[var(--sa-text-primary)]">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span> ({totalCount} total invoices)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-[var(--sa-border-color)] bg-[var(--sa-bg-card)] text-sm font-medium text-[var(--sa-text-secondary)] hover:bg-[var(--sa-bg-secondary)] disabled:opacity-50"
                  >
                    <FaChevronUp className="h-5 w-5 rotate-90" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-[var(--sa-border-color)] bg-[var(--sa-bg-card)] text-sm font-medium text-[var(--sa-text-secondary)] hover:bg-[var(--sa-bg-secondary)] disabled:opacity-50"
                  >
                    <FaChevronDown className="h-5 w-5 rotate-90" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SubscriptionDetailModal = ({ isOpen, onClose, loading, error, details, subscription }) => {
  const [activeTab, setActiveTab] = React.useState('Overview');

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const normalized = status?.toLowerCase();
    switch (normalized) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'past_due': return 'bg-yellow-100 text-yellow-700';
      case 'canceled': return 'bg-red-100 text-red-700';
      case 'trialing': return 'bg-blue-100 text-blue-700';
      default: return 'bg-[var(--sa-bg-secondary)] text-[var(--sa-text-primary)]';
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-[var(--sa-bg-card)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-[var(--sa-border-color)]">
        {/* Modal Header */}
        <div className="p-6 border-b border-[var(--sa-border-color)] flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-[var(--sa-text-primary)]">{subscription?.firm_name || 'Subscription Details'}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(subscription?.status)}`}>
                {subscription?.status_label || subscription?.status || 'Active'}
              </span>
              <span className="text-sm text-[var(--sa-text-secondary)]">• Firm ID: {subscription?.firm_id}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="var(--sa-text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-[var(--sa-border-color)] px-6">
          {['Overview', 'Billing History', 'Subscription History', 'Audit Logs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? 'border-[#3AD6F2] text-[#3AD6F2]' : 'border-transparent text-[var(--sa-text-secondary)] hover:text-[var(--sa-text-primary)]'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[var(--sa-bg-secondary)]/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3AD6F2] mb-4"></div>
              <p className="text-[var(--sa-text-secondary)]">Loading firm details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">{error}</div>
          ) : !details ? (
            <div className="text-center py-20 text-[var(--sa-text-secondary)]">No data available.</div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[var(--sa-bg-card)] p-4 rounded-xl border border-[var(--sa-border-color)] shadow-sm">
                    <h4 className="text-xs font-bold text-[var(--sa-text-secondary)] uppercase tracking-widest mb-4">Current Subscription</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between"><span className="text-sm text-[var(--sa-text-secondary)]">Plan</span><span className="text-sm font-bold text-[var(--sa-text-primary)]">{details.subscription_plan_name || details.subscription_plan || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-[var(--sa-text-secondary)]">Amount</span><span className="text-sm font-bold text-[var(--sa-text-primary)]">{formatCurrency(details.monthly_fee)} / month</span></div>
                      <div className="flex justify-between"><span className="text-sm text-[var(--sa-text-secondary)]">Start Date</span><span className="text-sm font-bold text-[var(--sa-text-primary)]">{formatDate(details.subscription_start_date)}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-[var(--sa-text-secondary)]">Next Billing</span><span className="text-sm font-bold text-[var(--sa-text-primary)]">{formatDate(details.subscription_end_date)}</span></div>
                      {details.trial_end_date && (
                         <div className="flex justify-between"><span className="text-sm text-[var(--sa-text-secondary)]">Trial Ends</span><span className="text-sm font-bold text-orange-500">{formatDate(details.trial_end_date)}</span></div>
                      )}
                    </div>
                  </div>
                  <div className="bg-[var(--sa-bg-card)] p-4 rounded-xl border border-[var(--sa-border-color)] shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-xs font-bold text-[var(--sa-text-secondary)] uppercase tracking-widest">Account Information</h4>
                      <button 
                        onClick={() => handleManagePlan(details)}
                        className="px-3 py-1 text-[10px] font-bold text-white bg-[#F56D2D] rounded-lg hover:bg-[#e05d20] transition-colors uppercase tracking-wider"
                        style={{ borderRadius: '6px' }}
                      >
                        Manage Plan
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between"><span className="text-sm text-[var(--sa-text-secondary)]">Firm Name</span><span className="text-sm font-bold text-[var(--sa-text-primary)]">{details.name || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-[var(--sa-text-secondary)]">Owner</span><span className="text-sm font-bold text-[var(--sa-text-primary)]">{details.admin_user_name || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-[var(--sa-text-secondary)]">Email</span><span className="text-sm font-bold text-[var(--sa-text-primary)]">{details.admin_user_email || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-[var(--sa-text-secondary)]">Phone</span><span className="text-sm font-bold text-[var(--sa-text-primary)]">{details.phone_number || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-[var(--sa-text-secondary)]">Status</span><span className="text-sm font-bold text-[var(--sa-text-primary)] capitalize">{details.status || '—'}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Billing History' && (
                <div className="bg-[var(--sa-bg-card)] rounded-xl border border-[var(--sa-border-color)] shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[var(--sa-bg-secondary)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase">Period Start</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(details.billing_records || []).map((bill, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 text-sm text-[var(--sa-text-primary)]">{formatDate(bill.billing_period_start)}</td>
                          <td className="px-4 py-3 text-sm font-bold text-[var(--sa-text-primary)]">{formatCurrency(bill.total_amount)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${bill.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                              {bill.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--sa-text-secondary)]">{bill.invoice_number || '—'}</td>
                        </tr>
                      ))}
                      {(!details.billing_records || details.billing_records.length === 0) && (
                        <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-[var(--sa-text-secondary)]">No billing records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'Subscription History' && (
                <div className="bg-[var(--sa-bg-card)] rounded-xl border border-[var(--sa-border-color)] shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[var(--sa-bg-secondary)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase">Period</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase">Plan</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(details.subscription_history || []).map((hist, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 text-sm text-[var(--sa-text-primary)]">{formatDate(hist.period_start)} - {formatDate(hist.period_end)}</td>
                          <td className="px-4 py-3 text-sm font-bold text-[var(--sa-text-primary)]">{hist.subscription_plan__display_name || '—'}</td>
                          <td className="px-4 py-3 text-sm font-bold text-[var(--sa-text-primary)]">{formatCurrency(hist.amount)}</td>
                          <td className="px-4 py-3 text-sm text-[var(--sa-text-primary)] capitalize">{hist.payment_status}</td>
                        </tr>
                      ))}
                      {(!details.subscription_history || details.subscription_history.length === 0) && (
                        <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-[var(--sa-text-secondary)]">No subscription history found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'Audit Logs' && (
                <div className="bg-[var(--sa-bg-card)] rounded-xl border border-[var(--sa-border-color)] shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[var(--sa-bg-secondary)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase">Timestamp</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase">Action</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase">Admin</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(details.plan_change_history || []).map((log, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 text-sm text-[var(--sa-text-primary)] ">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm font-bold text-[var(--sa-text-primary)]">{log.action_title || 'Update'}</td>
                          <td className="px-4 py-3 text-sm text-[var(--sa-text-primary)]">{log.admin_user__email || 'System'}</td>
                          <td className="px-4 py-3 text-sm text-[var(--sa-text-secondary)]">{log.action_description}</td>
                        </tr>
                      ))}
                      {(!details.plan_change_history || details.plan_change_history.length === 0) && (
                        <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-[var(--sa-text-secondary)]">No audit logs found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-[var(--sa-border-color)] bg-[var(--sa-bg-secondary)] flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-[#3AD6F2] text-white font-bold rounded-lg transition-colors shadow-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const ManagePlansModal = ({ isOpen, onClose, firm, onUpdate }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(firm?.subscription_plan || '');

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      setSelectedPlan(firm?.subscription_plan || '');
    }
  }, [isOpen, firm]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await superAdminAPI.getSubscriptionPlans();
      // Filter only active plans or plans already assigned to the firm
      const availablePlans = (response.data || []).filter(p => p.is_active || p.subscription_type === firm?.subscription_plan);
      setPlans(availablePlans);
    } catch (err) {
      console.error('Error fetching plans:', err);
      toast.error('Failed to load available plans');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPlan) return;
    setUpdating(true);
    try {
      await superAdminAPI.updateFirm(firm.id, { subscription_plan: selectedPlan });
      toast.success('Firm plan updated successfully');
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating firm plan:', err);
      toast.error(`Failed to update plan: ${handleAPIError(err)}`);
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--sa-bg-card)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-[var(--sa-border-color)] flex justify-between items-center bg-[var(--sa-bg-card)]">
          <h3 className="text-xl font-bold text-[var(--sa-text-primary)]">Manage Firm Plan</h3>
          <button onClick={onClose} className="p-2 rounded-full transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="var(--sa-text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--sa-text-secondary)] uppercase tracking-widest mb-2">Firm Name</label>
            <p className="text-sm font-bold text-[var(--sa-text-primary)]">{firm?.name}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--sa-text-secondary)] uppercase tracking-widest mb-2">Select New Plan</label>
            {loading ? (
              <div className="py-4 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3AD6F2]"></div></div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {plans.map((plan) => (
                  <label 
                    key={plan.id} 
                    className={`flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer ${selectedPlan === plan.subscription_type ? 'border-[#3AD6F2] bg-[#F0FDFF]' : 'border-[var(--sa-border-color)] hover:border-[#3AD6F2]/30 bg-[var(--sa-bg-card)]'}`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      className="hidden"
                      value={plan.subscription_type}
                      checked={selectedPlan === plan.subscription_type}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[var(--sa-text-primary)]">{plan.display_name}</p>
                      <p className="text-[10px] text-[var(--sa-text-secondary)] uppercase tracking-wider">{plan.subscription_type}</p>
                    </div>
                    {selectedPlan === plan.subscription_type && (
                      <div className="w-5 h-5 bg-[#3AD6F2] rounded-full flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-[var(--sa-border-color)] bg-[var(--sa-bg-secondary)] flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-[var(--sa-border-color)] text-[var(--sa-text-secondary)] font-bold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpdate}
            disabled={updating || !selectedPlan || selectedPlan === firm?.subscription_plan}
            className="flex-1 px-4 py-2 bg-[#F56D2D] text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditPlanModal = ({ isOpen, onClose, plan, onUpdate }) => {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData({
        display_name: plan.display_name || '',
        description: plan.description || '',
        monthly_price: plan.monthly_price || 0,
        yearly_price: plan.yearly_price || 0,
        max_users: plan.max_users || 0,
        max_firms: plan.max_firms || 0,
        storage_limit_gb: plan.storage_limit_gb || 0,
        badge_text: plan.badge_text || '',
        badge_color: plan.badge_color || '',
        is_fully_configurable: plan.is_fully_configurable || false,
        public_features: Array.isArray(plan.public_features) ? plan.public_features.join(', ') : (plan.public_features || ''),
        hidden_features: Array.isArray(plan.hidden_features) ? plan.hidden_features.join(', ') : (plan.hidden_features || ''),
      });
    }
  }, [plan]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Convert comma-separated strings back to arrays
      const payload = {
        ...formData,
        public_features: typeof formData.public_features === 'string' ? formData.public_features.split(',').map(s => s.trim()).filter(Boolean) : formData.public_features,
        hidden_features: typeof formData.hidden_features === 'string' ? formData.hidden_features.split(',').map(s => s.trim()).filter(Boolean) : formData.hidden_features,
      };

      const response = await superAdminAPI.updateSubscriptionPlan(plan.subscription_type, payload);
      if (response.success) {
        toast.success('Plan updated successfully');
        if (onUpdate) onUpdate();
        onClose();
      } else {
        toast.error(response.message || 'Failed to update plan');
      }
    } catch (err) {
      console.error('Error updating plan:', err);
      toast.error(`Error: ${handleAPIError(err)}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--sa-bg-card)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-[var(--sa-border-color)] flex justify-between items-center bg-[var(--sa-bg-card)]">
          <div>
            <h3 className="text-xl font-bold text-[var(--sa-text-primary)]">Edit Plan: {plan.display_name}</h3>
            <p className="text-xs text-[var(--sa-text-secondary)] mt-1 uppercase tracking-widest">{plan.subscription_type}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--sa-text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[var(--sa-text-primary)] border-b pb-2">Basic Information</h4>
              <div>
                <label className="block text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase tracking-widest mb-1">Display Name</label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[var(--sa-border-color)] rounded-lg focus:ring-2 focus:ring-[#3AD6F2] outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase tracking-widest mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-[var(--sa-border-color)] rounded-lg focus:ring-2 focus:ring-[#3AD6F2] outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase tracking-widest mb-1">Monthly Price</label>
                  <input
                    type="number"
                    name="monthly_price"
                    value={formData.monthly_price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[var(--sa-border-color)] rounded-lg focus:ring-2 focus:ring-[#3AD6F2] outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase tracking-widest mb-1">Yearly Price</label>
                  <input
                    type="number"
                    name="yearly_price"
                    value={formData.yearly_price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[var(--sa-border-color)] rounded-lg focus:ring-2 focus:ring-[#3AD6F2] outline-none text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Limits & Config */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[var(--sa-text-primary)] border-b pb-2">Limits & Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase tracking-widest mb-1">Max Users</label>
                  <input
                    type="number"
                    name="max_users"
                    value={formData.max_users}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[var(--sa-border-color)] rounded-lg focus:ring-2 focus:ring-[#3AD6F2] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase tracking-widest mb-1">Storage (GB)</label>
                  <input
                    type="number"
                    name="storage_limit_gb"
                    value={formData.storage_limit_gb}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[var(--sa-border-color)] rounded-lg focus:ring-2 focus:ring-[#3AD6F2] outline-none text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase tracking-widest mb-1">Badge Text</label>
                  <input
                    type="text"
                    name="badge_text"
                    value={formData.badge_text}
                    onChange={handleChange}
                    placeholder="e.g. Popular"
                    className="w-full px-3 py-2 border border-[var(--sa-border-color)] rounded-lg focus:ring-2 focus:ring-[#3AD6F2] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase tracking-widest mb-1">Badge Color</label>
                  <input
                    type="text"
                    name="badge_color"
                    value={formData.badge_color}
                    onChange={handleChange}
                    placeholder="e.g. #F56D2D"
                    className="w-full px-3 py-2 border border-[var(--sa-border-color)] rounded-lg focus:ring-2 focus:ring-[#3AD6F2] outline-none text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="is_fully_configurable"
                  name="is_fully_configurable"
                  checked={formData.is_fully_configurable}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#3AD6F2] rounded focus:ring-[#3AD6F2]"
                />
                <label htmlFor="is_fully_configurable" className="text-sm font-medium text-[var(--sa-text-primary)]">Fully Configurable</label>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h4 className="text-sm font-bold text-[var(--sa-text-primary)] border-b pb-2">Features</h4>
            <div>
              <label className="block text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase tracking-widest mb-1">Public Features (Comma separated)</label>
              <textarea
                name="public_features"
                value={formData.public_features}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-[var(--sa-border-color)] rounded-lg focus:ring-2 focus:ring-[#3AD6F2] outline-none text-sm font-mono"
                placeholder="Feature 1, Feature 2, Feature 3..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--sa-text-secondary)] uppercase tracking-widest mb-1">Hidden Features (Comma separated)</label>
              <textarea
                name="hidden_features"
                value={formData.hidden_features}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-[var(--sa-border-color)] rounded-lg focus:ring-2 focus:ring-[#3AD6F2] outline-none text-sm font-mono"
                placeholder="Hidden Feature 1, Hidden Feature 2..."
              />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-[var(--sa-border-color)] bg-[var(--sa-bg-secondary)] flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-2 border border-[var(--sa-border-color)] text-[var(--sa-text-secondary)] font-bold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-6 py-2 bg-[#F56D2D] text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? 'Saving Changes...' : 'Save Plan Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
