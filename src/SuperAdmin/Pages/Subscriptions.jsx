import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaDollarSign, FaUsers, FaClock, FaExclamationTriangle, FaChevronUp, FaChevronDown, FaDownload, FaEdit, FaEllipsisV } from 'react-icons/fa';
import { BlueDollarIcon, BlueUserIcon, BlueClockIcon, BlueExclamationTriangleIcon, ActiveIcon, ArrowgreenIcon, ClockgreenIcon, RedDownIcon, Action3Icon, AddSubscriptionPlanIcon } from '../Components/icons';
import EditSubscriptionPlan from './EditSubscriptionPlan';
import AddSubscription from './AddSubscription';
import AddonsManagement from './Subscriptions/AddonsManagement';
import { superAdminAPI, handleAPIError } from '../utils/superAdminAPI';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../style/Subscriptions.css';

export default function Subscriptions() {
  const [activeTab, setActiveTab] = useState('Plans'); // 'Plans', 'Addons', or 'Invoices'
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
        return { badgeClass: 'bg-gray-500', textClass: 'text-white' };
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
        return 'bg-gray-200 text-gray-700';
      default:
        return 'bg-gray-200 text-gray-700';
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

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-full p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription data...</p>
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
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
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
    <div className="w-full h-full p-6 subscriptions-page">
      {/* Hidden PDF Content */}
      <div ref={pdfRef} style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm', padding: '20mm', backgroundColor: 'white' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#3B4A66', marginBottom: '10px' }}>
            Subscriptions Report
          </h1>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>
            Generated on: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p style={{ fontSize: '12px', color: '#6B7280' }}>
            Total Subscriptions: {subscriptions.length}
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '2px solid #E5E7EB' }}>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#3B4A66', border: '1px solid #E5E7EB' }}>Firm</th>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#3B4A66', border: '1px solid #E5E7EB' }}>Plan</th>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#3B4A66', border: '1px solid #E5E7EB' }}>Amount</th>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#3B4A66', border: '1px solid #E5E7EB' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#3B4A66', border: '1px solid #E5E7EB' }}>Next Billing</th>
              <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#3B4A66', border: '1px solid #E5E7EB' }}>Total Paid</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription, index) => (
              <tr key={`${subscription.firm_id}-${subscription.plan}-${index}`} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '10px', fontSize: '11px', color: '#3B4A66', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontWeight: '600' }}>{subscription.firm_name || '—'}</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>{subscription.firm_owner || '—'}</div>
                </td>
                <td style={{ padding: '10px', fontSize: '11px', color: '#3B4A66', border: '1px solid #E5E7EB' }}>
                  {subscription.plan_label || subscription.plan || '—'}
                </td>
                <td style={{ padding: '10px', fontSize: '11px', color: '#3B4A66', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontWeight: '600' }}>{subscription.amount_formatted || formatCurrency(subscription.amount)}</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>{subscription.billing_frequency || '—'}</div>
                </td>
                <td style={{ padding: '10px', fontSize: '11px', color: '#3B4A66', border: '1px solid #E5E7EB' }}>
                  {subscription.status_label || subscription.status || '—'}
                </td>
                <td style={{ padding: '10px', fontSize: '11px', color: '#3B4A66', border: '1px solid #E5E7EB' }}>
                  {formatDateDisplay(subscription.next_billing_date)}
                </td>
                <td style={{ padding: '10px', fontSize: '11px', fontWeight: '600', color: '#3B4A66', border: '1px solid #E5E7EB' }}>
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
          <h3 className="taxdashboardr-titler font-bold mb-2" style={{ color: '#3B4A66' }}>Subscription & Billing Management</h3>
          <p style={{ color: '#3B4A66' }}>Monitor and manage all platform subscriptions</p>
        </div>
        <div className="flex gap-3 subscriptions-actions">
          <button
            onClick={handleExportReport}
            className="px-2 py-1 text-[10px] bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
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
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-1.5 w-fit">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('Plans')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${activeTab === 'Plans'
                ? 'bg-[#3AD6F2] text-white'
                : 'bg-transparent text-gray-700 hover:bg-gray-50'
                }`}
              style={{ borderRadius: '7px' }}
            >
              Subscription Plans
            </button>
            <button
              onClick={() => setActiveTab('Addons')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${activeTab === 'Addons'
                ? 'bg-[#3AD6F2] text-white'
                : 'bg-transparent text-gray-700 hover:bg-gray-50'
                }`}
              style={{ borderRadius: '7px' }}
            >
              Addons
            </button>
            <button
              onClick={() => setActiveTab('Invoices')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${activeTab === 'Invoices'
                ? 'bg-[#3AD6F2] text-white'
                : 'bg-transparent text-gray-700 hover:bg-gray-50'
                }`}
              style={{ borderRadius: '7px' }}
            >
              Subscription Invoices
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'Addons' ? (
        <AddonsManagement />
      ) : activeTab === 'Invoices' ? (
        <SubscriptionInvoicesTab />
      ) : (
        <>
          {/* Metric Cards and main subscriptions content */}
          <div className="grid grid-cols-4 gap-6 mb-8 subscriptions-metrics">
            {/* Total Revenue */}
            <div className="bg-white p-4" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: '#3B4A66' }}>Total Revenue</p>
                  <p className="text-xl font-bold mb-1" style={{ color: '#3B4A66' }}>
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
                      <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
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
            <div className="bg-white p-4" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: '#3B4A66' }}>Active Subscribers</p>
                  <p className="text-xl font-bold mb-1" style={{ color: '#3B4A66' }}>
                    {metrics?.active_subscribers?.formatted || '0'}
                  </p>

                </div>
                <BlueUserIcon className="text-lg" />
              </div>
            </div>

            {/* Most Popular Plan */}
            <div className="bg-white p-4" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: '#3B4A66' }}>Most Popular Plan</p>
                  <p className="text-xl font-bold mb-1" style={{ color: '#3B4A66' }}>
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
                        <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
                          {metrics.most_popular_plan.percentage_increase?.toFixed(1) || '0'}%
                        </span>
                      </>
                    )} */}
                      </div>
                      <span className="text-xs" style={{ color: '#6B7280' }}>
                        {metrics.most_popular_plan.count || 0} subscribers
                      </span>
                    </div>
                  )}
                </div>
                <BlueClockIcon className="text-lg" />
              </div>
            </div>

            {/* Average Growth */}
            <div className="bg-white p-4" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: '#3B4A66' }}>Average Growth</p>
                  <p className="text-xl font-bold mb-1" style={{ color: '#3B4A66' }}>
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
                          <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
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
                    <p className="text-xs text-gray-500">Saving notification settings...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Plan and Alerts Section */}
          <div className="grid gap-8 mb-8 subscriptions-plan-grid" style={{ gridTemplateColumns: '60% 35%' }}>
            {/* Plan Section */}
            <div className='bg-white p-3' style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
              <div className="flex justify-between items-center mb-3 ">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: '#3B4A66' }}>Plan</h3>
                  <p className="text-sm" style={{ color: '#3B4A66' }}>Revenue and growth metrics by subscription plan</p>
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
                        className="bg-white p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                        style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}
                        onClick={() => {
                          setSelectedPlan(plan.plan_display || label);
                          setShowEditPlan(true);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <span className={`${badgeClass} ${textClass} px-3 py-1 rounded-full text-sm font-medium`}>
                              {plan.plan_display || label}
                            </span>
                            <div>
                              <p className="text-xs mb-1" style={{ color: '#3B4A66', fontWeight: '800' }}>
                                {plan.total_subscribers} subscribers
                              </p>
                              <div className='flex flex-col gap-1'>
                                {revenuePlan && (
                                  <>
                                    <div className='flex flex-row gap-2'>
                                      <p className="text-xs" style={{ color: '#3B4A66' }}>
                                        {revenuePlan.formatted_revenue || '$0.00'} revenue
                                      </p>
                                      <p className="text-xs" style={{ color: '#6B7280' }}>
                                        ({revenuePlan.percentage?.toFixed(1) || '0'}%)
                                      </p>
                                    </div>
                                    <p className="text-xs" style={{ color: '#6B7280' }}>
                                      {revenuePlan.invoice_count || 0} invoice{revenuePlan.invoice_count !== 1 ? 's' : ''}
                                    </p>
                                  </>
                                )}
                                {!revenuePlan && (
                                  <div className='flex flex-row gap-2'>
                                    <p className="text-xs" style={{ color: '#3B4A66' }}>
                                      {plan.formatted_revenue || '$0.00'} revenue.
                                    </p>
                                    <p className="text-xs" style={{ color: '#3B4A66' }}>
                                      {plan.formatted_growth || '0%'} growth
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold mb-1" style={{ color: '#3B4A66' }}>
                              {plan.formatted_price}/month
                            </p>
                            <p className="text-xs" style={{ color: '#3B4A66' }}>
                              {plan.is_active ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const { badgeClass, textClass } = getPlanBadgeStyles(label);
                  return (
                    <div
                      key={normalizedKey}
                      className="bg-white p-4 border border-dashed border-[#E8F0FF] rounded-[7px] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`${badgeClass} ${textClass} px-3 py-1 rounded-full text-sm font-medium`}>
                          {label}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium" style={{ color: '#3B4A66' }}>
                            No {label} plan configured
                          </span>
                          <span className="text-xs text-gray-500">
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
            <div className='bg-white p-3' style={{ border: '1px solid #E8F0FF', borderRadius: '7px', height: 'fit-content' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: '#3B4A66' }}>Alerts & Notifications</h3>

              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="bg-white p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3B4A66' }}>Email Notifications</p>
                      <p className="text-xs" style={{ color: '#3B4A66' }}>Send email when  <br /> subscription events occur</p>
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
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                        style={{
                          transform: emailNotifications ? 'translateX(24px)' : 'translateX(4px)'
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* SMS Alerts */}
                <div className="bg-white p-4" >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#3B4A66' }}>SMS Alerts</p>
                      <p className="text-xs" style={{ color: '#3B4A66' }}>Optional SMS notifications</p>
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
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
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
          <div className="mb-8 bg-white p-4" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between subscriptions-plan-performance-header">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: '#3B4A66' }}>Plan Performance</h3>
                  <p className="text-xs" style={{ color: '#3B4A66' }}>MRR, churn, and plan distribution</p>
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
                      style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
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
                      style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
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
                        className="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 subscriptions-clear-btn"
                        title="Clear filter"
                        style={{ borderRadius: '7px' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {planPerformance?.timestamp && (
                    <span className="text-xs text-gray-500">
                      Last updated: {formatDateTime(planPerformance.timestamp)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {planPerformance ? (
              <div className="grid gap-6 lg:grid-cols-2 subscriptions-plan-performance-grid">
                <div className="border border-[#E8F0FF] rounded-[10px] p-4 subscriptions-plan-card">
                  <h4 className="text-sm sm:text-base font-semibold text-[#3B4A66] mb-2">Monthly Recurring Revenue</h4>
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
                                  fontSize="12"
                                  fill="#6B7280"
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
                                  fill="#3B4A66"
                                  rx="6"
                                />
                                <text
                                  x={x + barWidth / 2}
                                  y={y - 6}
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="#3B4A66"
                                  fontWeight="600"
                                >
                                  {formatCurrency(value)}
                                </text>
                                <text
                                  x={x + barWidth / 2}
                                  y={svgHeight - 8}
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="#6B7280"
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
                    <p className="text-xs text-gray-500 mt-4">No revenue trend data available.</p>
                  )}
                </div>

                <div className="border border-[#E8F0FF] rounded-[10px] p-4 subscriptions-plan-card">
                  <h4 className="text-sm font-semibold text-[#3B4A66] mb-2">Churn Rate</h4>
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
                                  fill="#6B7280"
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
                                  fill="#6B7280"
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
                    <p className="text-xs text-gray-500 mt-4">No churn trend data available.</p>
                  )}
                </div>

                <div className="border border-[#E8F0FF] rounded-[10px] p-4 lg:col-span-2 subscriptions-plan-card-full">
                  <h4 className="text-sm font-semibold text-[#3B4A66] mb-4">Plan Distribution</h4>
                  <div className="space-y-3">
                    {planDistributionData.length > 0 ? planDistributionData.map((item) => {
                      const width = distributionMax ? Math.max((item.firms / distributionMax) * 100, 6) : 0;
                      return (
                        <div key={item.plan} className="flex items-center gap-3">
                          <span className="w-24 text-sm font-medium text-[#3B4A66]">
                            {item.label}
                          </span>
                          <div className="flex-1 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${width}%`, backgroundColor: '#3B82F6' }}
                            ></div>
                          </div>
                          <span className="w-16 text-right text-xs font-semibold text-[#3B4A66]">
                            {formatNumber(item.firms)} firms
                          </span>
                        </div>
                      );
                    }) : (
                      <p className="text-xs text-gray-500">No plan distribution data available.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Plan performance data is not available at the moment.</p>
            )}
          </div>

          {/* Subscriptions Table */}
          <div>
            {/* Filter Bar */}
            <div className='mb-4'>
              <div className="flex gap-3 subscriptions-filter">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search subscriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}
                    className="w-[400px] pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <select
                  className="px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}
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
                  className="px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}
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
            <div className="bg-white p-4 subscriptions-table-card" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
              <div className="flex justify-between items-center mb-6 subscriptions-table-card-header">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: '#3B4A66' }}>Subscriptions</h3>
                  <p className="text-sm text-gray-500 mt-1">Showing {startItem}-{endItem} of {pagination.total_count} subscriptions</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-500">Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                    className="text-xs border border-[#E8F0FF] bg-white text-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#F56D2D]"
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
              <div className="space-y-4 subscriptions-table-list">
                {tableLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      Loading subscriptions...
                    </div>
                  </div>
                ) : subscriptions.length > 0 ? (
                  <>
                    {/* Header for list view */}
                    <div className="px-6 py-3 mb-2 subscriptions-table-header">
                      <div className="grid grid-cols-6 gap-4 text-xs font-bold uppercase tracking-wider" style={{ color: '#3B4A66' }}>
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
                        <div key={`${subscription.firm_id}-${subscription.plan}`} className="bg-white p-4 subscriptions-table-row hover:bg-gray-50 transition-colors" style={{ border: '1px solid #E8F0FF', borderRadius: '8px' }}>
                          <div className="grid grid-cols-6 gap-4 items-center subscriptions-table-row-grid">
                            <div>
                              <p className="text-sm font-semibold" style={{ color: '#3B4A66' }}>
                                {subscription.firm_name || '—'}
                              </p>
                              <p className="text-xs" style={{ color: '#6C757D' }}>
                                {subscription.firm_owner || '—'}
                              </p>
                            </div>
                            <div>
                              <span
                                className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${planStyles.badgeClass} ${planStyles.textClass}`}
                                style={{ borderRadius: '12px' }}
                              >
                                {subscription.plan_label || subscription.plan || '—'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: '#3B4A66' }}>
                                {subscription.amount_formatted || formatCurrency(subscription.amount)}
                              </p>
                              <p className="text-xs" style={{ color: '#6C757D', fontWeight: 600 }}>
                                {subscription.billing_frequency || '—'}
                              </p>
                            </div>
                            <div>
                              <span
                                className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${statusClasses}`}
                                style={{ borderRadius: '12px' }}
                              >
                                {subscription.status_label || subscription.status || '—'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm" style={{ color: '#3B4A66' }}>
                                {formatDateDisplay(subscription.next_billing_date)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: '#3B4A66' }}>
                                {subscription.total_paid_formatted || formatCurrency(subscription.total_paid)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Pagination Footer */}
                    <div className="flex items-center justify-between px-2 py-4 border-t border-[#E8F0FF] mt-4">
                      <span className="text-xs font-medium text-gray-500">
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
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-sm text-gray-500">No subscriptions found for the selected filters.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Subscription Invoices Tab Component
const SubscriptionInvoicesTab = () => {
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
        page: currentPage,
        limit: 20,
        search: searchTerm,
        status: statusFilter,
        invoice_type: typeFilter,
      });

      const response = await superAdminAPI.get(`/user/admin/subscription-invoices/?${params}`);
      if (response.data.success) {
        setInvoices(response.data.data.invoices);
        setTotalPages(response.data.data.pagination.total_pages);
        setTotalCount(response.data.data.pagination.total_count);
      }
    } catch (error) {
      console.error('Error fetching subscription invoices:', error);
      toast.error('Failed to load subscription invoices');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, typeFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await superAdminAPI.get('/user/admin/subscription-invoices/stats/');
      if (response.data.success) {
        setStats(response.data.data);
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
      'cancelled': 'bg-gray-100 text-gray-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-[#E8F0FF]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.total_revenue || 0)}
              </p>
            </div>
            <FaDollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#E8F0FF]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.monthly_revenue || 0)}
              </p>
            </div>
            <FaClock className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#E8F0FF]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.status_counts?.find(s => s.status === 'paid')?.count || 0}
              </p>
            </div>
            <FaUsers className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#E8F0FF]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.status_counts?.find(s => s.status === 'pending')?.count || 0}
              </p>
            </div>
            <FaExclamationTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-[#E8F0FF]">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by invoice number or firm name..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="subscription_purchase">Purchase</option>
            <option value="subscription_renewal">Renewal</option>
            <option value="subscription_upgrade">Upgrade</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-[#E8F0FF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Firm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No subscription invoices found
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.firm.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.firm.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {invoice.invoice_type.replace('subscription_', '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invoice.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span> ({totalCount} total invoices)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <FaChevronUp className="h-5 w-5 rotate-90" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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
