import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

import {
  RefreshIcon,
  UserManage,
  SubscriptionIcon,
  MesIcon,
  SystemSettingsIcon,
  HelpsIcon,
  TotalFirmsIcon,
  ActiveUsersIcon,
  MonthlyRevenueIcon,
  SystemHealthIcon,
  SecurityGreenIcon,
  SecurityYellowIcon
} from '../Components/icons';
import { toast } from 'react-toastify';
import { superAdminAPI, handleAPIError } from '../utils/superAdminAPI';
import { getStorage } from '../../ClientOnboarding/utils/userUtils';
import { useTheme } from '../Context/ThemeContext';

const SUBSCRIPTION_COLOR_MAP = {
  starter: '#10B981',
  solo: '#10B981',
  growth: '#3B82F6',
  team: '#3B82F6',
  pro: '#8B5CF6',
  professional: '#8B5CF6',
  elite: '#06B6D4',
  enterprise: '#06B6D4',
  business: '#F59E0B',
};

const FALLBACK_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#06B6D4', '#8B5CF6', '#EF4444', '#F97316'];

export default function SuperDashboardContent() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [firmsCurrentPage, setFirmsCurrentPage] = useState(1);
  const [showAllFirms, setShowAllFirms] = useState(false);
  const FIRMS_PER_PAGE = 3;

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [updatingSecuritySetting, setUpdatingSecuritySetting] = useState(null);

  // All firms modal state
  const [showAllFirmsModal, setShowAllFirmsModal] = useState(false);
  const [allFirms, setAllFirms] = useState([]);
  const [allFirmsLoading, setAllFirmsLoading] = useState(false);
  const [allFirmsError, setAllFirmsError] = useState(null);

  // Active users modal state
  const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);
  const [activeUsersData, setActiveUsersData] = useState(null);
  const [activeUsersLoading, setActiveUsersLoading] = useState(false);
  const [activeUsersError, setActiveUsersError] = useState(null);
  const [activeUsersTab, setActiveUsersTab] = useState('Firm');

  // Generate current month value for default
  const getCurrentMonthValue = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Month filter states - default to current month
  const [selectedRevenueMonth, setSelectedRevenueMonth] = useState(getCurrentMonthValue());
  const [selectedSubscriptionMonth, setSelectedSubscriptionMonth] = useState('all');

  // Redirect based on user role
  useEffect(() => {
    const storage = getStorage();
    const userType = storage?.getItem("userType");

    // Redirect support_admin to support center
    if (userType === 'support_admin') {
      navigate("/superadmin/support", { replace: true });
      return;
    }

    // Redirect billing_admin to subscriptions
    if (userType === 'billing_admin') {
      navigate("/superadmin/subscriptions", { replace: true });
      return;
    }

    // Only super_admin should see the dashboard
    // If not super_admin, the route protection will handle it
  }, [navigate]);

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

  const formatNumber = (value) => {
    if (value === null || value === undefined) return '0';
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return String(value);
    return numericValue.toLocaleString();
  };

  // Generate last 6 months for dropdown
  const getLast6Months = () => {
    const months = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      const monthName = monthNames[monthIndex];
      const monthValue = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

      months.push({
        value: monthValue,
        label: `${monthName} ${year}`,
        shortLabel: monthName
      });
    }

    return months;
  };

  const last6Months = getLast6Months();

  const getQuickActionIcon = (labelOrIcon = '') => {
    const normalized = (labelOrIcon || '').toLowerCase();
    if (normalized.includes('user') || normalized === 'user') return <UserManage />;
    if (normalized.includes('subscription') || normalized === 'subscription') return <SubscriptionIcon />;
    if (normalized.includes('analytic') || normalized === 'analytic' || normalized === 'analytics') return <MesIcon />;
    if (normalized.includes('system') || normalized === 'system' || normalized.includes('setting')) return <SystemSettingsIcon />;
    if (normalized.includes('support') || normalized === 'support') return <HelpsIcon />;
    return <UserManage />;
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare API parameters based on selected months
      const apiParams = {};

      // Parse revenue month filter
      if (selectedRevenueMonth !== 'all') {
        const [revenueYear, revenueMonth] = selectedRevenueMonth.split('-');
        apiParams.revenue_month = parseInt(revenueMonth);
        apiParams.revenue_year = parseInt(revenueYear);
      }

      // Parse subscription distribution month filter
      if (selectedSubscriptionMonth !== 'all') {
        const [distributionYear, distributionMonth] = selectedSubscriptionMonth.split('-');
        apiParams.distribution_month = parseInt(distributionMonth);
        apiParams.distribution_year = parseInt(distributionYear);
      }

      const response = await superAdminAPI.getAdminDashboard(apiParams);

      if (response.success && response.data) {
        setDashboardData(response.data);
        setLastRefresh(new Date());
        setFirmsCurrentPage(1);
        setShowAllFirms(false);
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  // Fetch security settings
  const fetchSecuritySettings = async () => {
    try {
      setSecurityLoading(true);
      const response = await superAdminAPI.getSecuritySettings();

      if (response.success && response.data) {
        setSecuritySettings(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch security settings');
      }
    } catch (err) {
      console.error('Error fetching security settings:', err);
    } finally {
      setSecurityLoading(false);
    }
  };

  // Update individual security setting
  const handleSecuritySettingToggle = async (settingKey, currentValue) => {
    try {
      setUpdatingSecuritySetting(settingKey);
      const newValue = !currentValue;

      const updateData = {
        admin_2fa_required: securitySettings?.admin_2fa_required?.enabled ?? false,
        password_complexity_enabled: securitySettings?.password_complexity_enabled?.enabled ?? false,
        audit_logging_enabled: securitySettings?.audit_logging_enabled?.enabled ?? false,
        [settingKey]: newValue
      };

      const response = await superAdminAPI.updateSecuritySettings(updateData);

      if (response.success && response.data) {
        setSecuritySettings(response.data);
      } else {
        throw new Error(response.message || 'Failed to update security setting');
      }
    } catch (err) {
      console.error('Error updating security setting:', err);
      toast.error(handleAPIError(err), {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setUpdatingSecuritySetting(null);
    }
  };

  // Load security settings on component mount only
  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  // Load dashboard data on component mount and when filters change
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRevenueMonth, selectedSubscriptionMonth]);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Format month label for x-axis display
  const formatMonthLabel = (label) => {
    if (!label) return '';

    const labelStr = String(label).trim();

    // Try to parse various formats
    // Format: "Sep 2024" or "September 2024"
    const monthYearMatch = labelStr.match(/(\w+)\s+(\d{4})/i);
    if (monthYearMatch) {
      const monthName = monthYearMatch[1];
      const year = monthYearMatch[2];
      // Get short month name (first 3 letters)
      const shortMonth = monthName.substring(0, 3);
      return shortMonth;
    }

    // Format: "2024-09" or "2024-9"
    const dateMatch = labelStr.match(/(\d{4})-(\d{1,2})/);
    if (dateMatch) {
      const monthIndex = parseInt(dateMatch[2]) - 1;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames[monthIndex] || labelStr;
    }

    // Format: "09/2024" or "9/2024"
    const slashMatch = labelStr.match(/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      const monthIndex = parseInt(slashMatch[1]) - 1;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames[monthIndex] || labelStr;
    }

    // If it's already a short month name, return as is
    const monthAbbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthAbbrs.some(abbr => labelStr.toLowerCase().startsWith(abbr.toLowerCase()))) {
      return labelStr.substring(0, 3);
    }

    // Return first 3 characters if it looks like a month name
    if (labelStr.length > 3) {
      return labelStr.substring(0, 3);
    }

    return labelStr;
  };

  // Process data for charts
  // Note: Filtering is now handled by the API, so we just process the returned data
  const processChartData = () => {
    if (!dashboardData) {
      return {
        revenueData: [],
        subscriptionData: [],
        activityData: []
      };
    }

    const labels = dashboardData.revenue_growth?.labels || [];
    const revenueValues = dashboardData.revenue_growth?.revenue || [];
    const subscriberValues = dashboardData.revenue_growth?.subscribers || [];
    const revenueGrowthValues = dashboardData.revenue_growth?.revenue_growth || [];
    const subscriberGrowthValues = dashboardData.revenue_growth?.subscriber_growth || [];

    const revenueData = labels.map((label, index) => {
      const revenue = revenueValues[index] ?? 0;
      const subscribers = subscriberValues[index] ?? 0;
      const revenueGrowth = revenueGrowthValues[index] ?? 0;
      const subscriberGrowth = subscriberGrowthValues[index] ?? 0;

      // Debug: Log to ensure data is being processed
      if (index === 0) {
        console.log('Revenue Growth Chart Data:', {
          label,
          revenue,
          subscribers,
          revenueGrowth,
          subscriberGrowth
        });
      }

      return {
        month: label,
        monthDisplay: formatMonthLabel(label),
        revenue: revenue,
        subscribers: subscribers,
        revenueGrowth: revenueGrowth,
        subscriberGrowth: subscriberGrowth
      };
    });

    const subscriptionData = (dashboardData.subscription_distribution || []).map((item, index) => {
      const planKey = item.plan?.toLowerCase?.() || `plan-${index}`;
      return {
        name: item.label || item.plan || `Plan ${index + 1}`,
        value: item.count ?? 0,
        color: SUBSCRIPTION_COLOR_MAP[planKey] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
      };
    });

    const activityData = (dashboardData.activity?.timeline || []).map(item => ({
      hour: item.hour,
      count: item.count
    }));

    return { revenueData, subscriptionData, activityData };
  };

  // Process performance data
  const processPerformanceData = () => {
    if (!dashboardData) return [];

    const thresholds = {
      api_response_ms: 500,
      db_query_ms: 500,
      page_load_seconds: 5,
      error_rate_percent: 5
    };

    return [
      {
        metric: 'API Response',
        current: dashboardData.performance?.api_response_ms ?? 0,
        target: thresholds.api_response_ms,
        unit: 'ms'
      },
      {
        metric: 'Database Query',
        current: dashboardData.performance?.db_query_ms ?? 0,
        target: thresholds.db_query_ms,
        unit: 'ms'
      },
      {
        metric: 'Page Load',
        current: dashboardData.performance?.page_load_seconds ?? 0,
        target: thresholds.page_load_seconds,
        unit: 's'
      },
      {
        metric: 'Error Rate',
        current: dashboardData.performance?.error_rate_percent ?? 0,
        target: thresholds.error_rate_percent,
        unit: '%'
      }
    ];
  };

  const { revenueData, subscriptionData, activityData } = processChartData();
  const performanceData = processPerformanceData();
  const recentFirms = dashboardData?.recent_firms || [];
  const securityStatus = dashboardData?.security || {};

  // Default Quick Actions - Common administrative tasks
  const getActionLabelText = (action = {}) => {
    return (
      action.label ||
      action.name ||
      action.title ||
      action.text ||
      action.icon ||
      ''
    );
  };

  const defaultQuickActions = [
    {
      label: 'User Management',
      route: '/superadmin/users',
      icon: 'user'
    },
    {
      label: 'Subscriptions',
      route: '/superadmin/subscriptions',
      icon: 'subscription'
    },
    {
      label: 'Analytics',
      route: '/superadmin/analytics',
      icon: 'analytic'
    },
    {
      label: 'Support Center',
      route: '/superadmin/support',
      icon: 'support'
    },
    {
      label: 'System Settings',
      route: '/superadmin/settings',
      icon: 'system'
    }
  ];

  const normalizeRoute = (route = '') => {
    if (!route || typeof route !== 'string') return null;
    let cleaned = route.trim();

    // Handle absolute URLs
    if (/^https?:\/\//i.test(cleaned)) {
      try {
        const url = new URL(cleaned);
        cleaned = `${url.pathname}${url.search}${url.hash}`;
      } catch (error) {
        // fallback: strip protocol manually
        cleaned = cleaned.replace(/^https?:\/\//i, '');
        const slashIndex = cleaned.indexOf('/');
        cleaned = slashIndex >= 0 ? cleaned.slice(slashIndex) : `/${cleaned}`;
      }
    }

    // Separate query/hash if present
    let suffix = '';
    const queryIndex = cleaned.indexOf('?');
    const hashIndex = cleaned.indexOf('#');
    const splitIndex =
      queryIndex >= 0 && hashIndex >= 0
        ? Math.min(queryIndex, hashIndex)
        : queryIndex >= 0
          ? queryIndex
          : hashIndex >= 0
            ? hashIndex
            : -1;
    if (splitIndex >= 0) {
      suffix = cleaned.slice(splitIndex);
      cleaned = cleaned.slice(0, splitIndex);
    }

    if (!cleaned.startsWith('/')) {
      cleaned = `/${cleaned}`;
    }

    if (cleaned.startsWith('/admin/')) {
      cleaned = cleaned.replace('/admin/', '/superadmin/');
    } else if (cleaned === '/admin') {
      cleaned = '/superadmin';
    }

    if (!cleaned.startsWith('/superadmin')) {
      cleaned = cleaned === '/' ? '/superadmin' : `/superadmin${cleaned}`;
    }

    return `${cleaned}${suffix}`;
  };

  const QUICK_ACTION_KEYWORDS = [
    {
      route: '/superadmin/users',
      keywords: ['user management', 'user', 'users']
    },
    {
      route: '/superadmin/subscriptions',
      keywords: ['subscription', 'subscriptions', 'billing', 'plans']
    },
    {
      route: '/superadmin/analytics',
      keywords: ['analytic', 'analytics', 'reports', 'reporting']
    },
    {
      route: '/superadmin/system-settings',
      keywords: ['system settings', 'settings', 'setting', 'system', 'configuration', 'platform control', 'platform controls', 'platform']
    },
    {
      route: '/superadmin/support',
      keywords: ['support', 'support center', 'help', 'helpdesk']
    }
  ];

  const resolveQuickActionRoute = (action = {}) => {
    if (action.route && typeof action.route === 'string' && action.route.trim().length > 0) {
      return normalizeRoute(action.route);
    }

    const baseLabel = getActionLabelText(action).toLowerCase().replace(/[_-]+/g, ' ').trim();
    if (!baseLabel) return null;

    for (const mapping of QUICK_ACTION_KEYWORDS) {
      const match = mapping.keywords.some(keyword => baseLabel.includes(keyword));
      if (match) return normalizeRoute(mapping.route);
    }

    return null;
  };

  // Use API quick actions if available, otherwise use defaults
  const quickActions = (dashboardData?.quick_actions && dashboardData.quick_actions.length > 0)
    ? dashboardData.quick_actions
    : defaultQuickActions;

  const showRecentFirmsSection = (recentFirms || []).length > 0;
  const maxRevenueValue = revenueData.length > 0 ? revenueData.reduce((max, item) => Math.max(max, item.revenue || 0), 0) : 0;
  const maxSubscriberValue = revenueData.length > 0 ? revenueData.reduce((max, item) => Math.max(max, item.subscribers || 0), 0) : 0;
  const minSubscriberValue = revenueData.length > 0 ? revenueData.reduce((min, item) => Math.min(min, item.subscribers !== undefined ? item.subscribers : Infinity, Infinity), Infinity) : 0;
  const revenueUpperBound = maxRevenueValue > 0 ? Math.ceil(maxRevenueValue * 1.2) : 1;
  // Ensure subscriber axis has proper range - add padding and ensure minimum visibility
  const subscriberUpperBound = maxSubscriberValue > 0
    ? Math.max(Math.ceil(maxSubscriberValue * 1.2), maxSubscriberValue + Math.max(2, Math.ceil(maxSubscriberValue * 0.2)))
    : 10;
  const subscriberLowerBound = (minSubscriberValue !== Infinity && minSubscriberValue > 0)
    ? Math.max(0, Math.floor(minSubscriberValue * 0.9))
    : 0;

  // Pagination logic for Recent Firms
  const totalFirms = recentFirms.length;
  const totalPages = Math.ceil(totalFirms / FIRMS_PER_PAGE);
  const shouldShowPagination = totalFirms > FIRMS_PER_PAGE && !showAllFirms;
  const displayedFirms = showAllFirms
    ? recentFirms
    : recentFirms.slice((firmsCurrentPage - 1) * FIRMS_PER_PAGE, firmsCurrentPage * FIRMS_PER_PAGE);

  const handleViewAll = (e) => {
    e.preventDefault();
    setShowAllFirms(!showAllFirms);
    if (showAllFirms) {
      setFirmsCurrentPage(1);
    }
  };

  const handleFirmsPageChange = (newPage) => {
    setFirmsCurrentPage(newPage);
  };

  const maxActivityValue = activityData.reduce((max, item) => Math.max(max, item.count || 0), 0);
  const activityUpperBound = maxActivityValue > 0 ? Math.ceil(maxActivityValue * 1.2) : 1;

  // Use securitySettings from API if available, fallback to dashboardData
  const securityItems = securitySettings ? [
    {
      name: 'Admin 2FA',
      key: 'admin_2fa_required',
      enabled: securitySettings?.admin_2fa_required?.enabled ?? false,
      status: securitySettings?.admin_2fa_required?.status ?? 'disabled',
      description: securitySettings?.admin_2fa_required?.description ?? ''
    },
    {
      name: 'Password Complexity',
      key: 'password_complexity_enabled',
      enabled: securitySettings?.password_complexity_enabled?.enabled ?? false,
      status: securitySettings?.password_complexity_enabled?.status ?? 'disabled',
      description: securitySettings?.password_complexity_enabled?.description ?? ''
    },
    {
      name: 'Audit Logging',
      key: 'audit_logging_enabled',
      enabled: securitySettings?.audit_logging_enabled?.enabled ?? false,
      status: securitySettings?.audit_logging_enabled?.status ?? 'disabled',
      description: securitySettings?.audit_logging_enabled?.description ?? ''
    }
  ] : [
    {
      name: 'Admin 2FA',
      key: 'admin_2fa_required',
      enabled: securityStatus?.admin_2fa_required ?? false,
      status: 'loading'
    },
    {
      name: 'Password Complexity',
      key: 'password_complexity_enabled',
      enabled: securityStatus?.password_complexity_enabled ?? false,
      status: 'loading'
    },
    {
      name: 'Audit Logging',
      key: 'audit_logging_enabled',
      enabled: securityStatus?.audit_logging_enabled ?? false,
      status: 'loading'
    }
  ];

  // Custom tooltip for area chart
  const RevenueTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const revenueEntry = payload.find(item => item.dataKey === 'revenue');
      const subscribersEntry = payload.find(item => item.dataKey === 'subscribers');
      return (
        <div className="bg-white rounded-lg p-3 border" style={{ minWidth: '140px' }}>
          <div className="text-sm font-semibold mb-1" style={{ color: '#374151' }}>{label}</div>
          {revenueEntry && (
            <div className="text-sm" style={{ color: '#10B981' }}>
              Revenue: {formatCurrency(revenueEntry.value || 0)}
            </div>
          )}
          {subscribersEntry && (
            <div className="text-sm mt-1" style={{ color: '#374151' }}>
              Subscribers: {formatNumber(subscribersEntry.value || 0)}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const SubscriptionTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white rounded-lg shadow-xl p-3 border" style={{ minWidth: '140px' }}>
          <div className="text-sm font-semibold mb-1" style={{ color: data.payload.color }}>{data.name}</div>
          <div className="text-lg font-bold" style={{ color: data.payload.color }}>
            {data.value}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for activity chart
  const ActivityTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-xl p-3 border" style={{ minWidth: '140px' }}>
          <div className="text-sm font-semibold mb-1" style={{ color: '#374151' }}>{label}</div>
          <div className="text-sm" style={{ color: '#374151' }}>
            Activity: <span style={{ color: '#10B981' }}>{formatNumber(payload[0].value)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="w-full px-3 py-4 bg-[#F6F7FF] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-4" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full px-3 py-4 bg-[#F6F7FF] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-3 pt-4 pb-0 bg-[#F6F7FF] dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h4 className=" font-bold text-gray-900 dark:text-white">Platform Overview</h4>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and manage the entire tax practice platform</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Last updated: {lastRefresh.toLocaleString()}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="taxdashboardr-titler flex items-center gap-2 px-6 py-3 text-black dark:text-white bg-white dark:bg-gray-800 rounded-3xl transition-colors disabled:opacity-50 border border-transparent dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          style={{ borderRadius: '7px' }}
        >
          <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-8">
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-[#E8F0FF] dark:border-gray-700 p-7 relative cursor-pointer hover:shadow-md transition-all"
          onClick={async () => {
            setShowAllFirmsModal(true);
            setAllFirmsLoading(true);
            setAllFirmsError(null);
            try {
              // Fetch all firms with a large limit
              const response = await superAdminAPI.getFirms(1, 1000, '', '', '');
              if (response.success && response.data) {
                setAllFirms(response.data.firms || []);
              } else {
                throw new Error(response.message || 'Failed to fetch firms');
              }
            } catch (err) {
              console.error('Error fetching all firms:', err);
              setAllFirmsError(handleAPIError(err));
              setAllFirms([]);
            } finally {
              setAllFirmsLoading(false);
            }
          }}
        >
          <div className="absolute top-4 right-4 text-gray-400 dark:text-gray-500">
            <TotalFirmsIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Firms</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(dashboardData?.summary?.total_firms)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Firms onboarded</p>
          </div>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-[#E8F0FF] dark:border-gray-700 p-6 relative cursor-pointer hover:shadow-md transition-all"
          onClick={async () => {
            setShowActiveUsersModal(true);
            setActiveUsersLoading(true);
            setActiveUsersError(null);
            setActiveUsersTab('Firm');
            try {
              // Fetch overview data from the new unified API
              const overviewResponse = await superAdminAPI.getAdminOverview();

              if (overviewResponse.success && overviewResponse.data) {
                const { active_firms, active_taxpayers, active_tax_preparers, active_super_admins } = overviewResponse.data;

                // Map the API response to the expected modal data structure
                setActiveUsersData({
                  firm_users: active_firms || [],
                  taxpayer_users: active_taxpayers || [],
                  taxpreparer_users: active_tax_preparers || [],
                  super_admin_users: active_super_admins || [],
                  billing_users: active_super_admins?.filter(user => user.role?.toLowerCase().includes('billing')) || [],
                  support_users: active_super_admins?.filter(user => user.role?.toLowerCase().includes('support')) || [],
                  general_admins: active_super_admins?.filter(user =>
                    !user.role?.toLowerCase().includes('billing') &&
                    !user.role?.toLowerCase().includes('support')
                  ) || []
                });
              } else {
                throw new Error(overviewResponse.message || 'Failed to fetch overview data');
              }
            } catch (err) {
              console.error('Error fetching active users data:', err);
              setActiveUsersError(handleAPIError(err));
              setActiveUsersData(null);
            } finally {
              setActiveUsersLoading(false);
            }
          }}
        >
          <div className="absolute top-4 right-4 text-gray-400 dark:text-gray-500">
            <ActiveUsersIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active Users</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(dashboardData?.summary?.active_users)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Across all firms</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E8F0FF] dark:border-gray-700 p-6 relative">
          <div className="absolute top-4 right-4 text-gray-400 dark:text-gray-500">
            <MonthlyRevenueIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Monthly Revenue</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(dashboardData?.summary?.monthly_revenue)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Recurring revenue</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E8F0FF] dark:border-gray-700 p-6 relative">
          <div className="absolute top-4 right-4 text-gray-400 dark:text-gray-500">
            <SystemHealthIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">System Health</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(dashboardData?.summary?.system_health_score)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Health Score</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-8">
        {/* User Registration Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E8F0FF] dark:border-gray-700 p-6 transition-all">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="taxdashboardr-titler text-base font-medium text-gray-900 dark:text-white mb-1">Revenue Growth Trend</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly recurring revenue and user growth</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="revenue-month-select" className="text-sm text-gray-600 dark:text-gray-400">Filter by month:</label>
              <select
                id="revenue-month-select"
                value={selectedRevenueMonth}
                onChange={(e) => setSelectedRevenueMonth(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Months</option>
                {last6Months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-80">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                  style={{ filter: 'drop-shadow(0 0 0 transparent)' }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontWeight: 500 }}
                    tickFormatter={(value) => formatMonthLabel(value)}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontWeight: 500 }}
                    domain={[0, revenueUpperBound]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontWeight: 500 }}
                    domain={[subscriberLowerBound, subscriberUpperBound]}
                    allowDecimals={false}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area
                    type="monotone"
                    yAxisId="left"
                    dataKey="revenue"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    dot={{ fill: 'white', stroke: '#10B981', strokeWidth: 3, r: 5 }}
                    activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2, fill: 'white' }}
                    connectNulls={true}
                    isAnimationActive={true}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Line
                    type="monotone"
                    yAxisId="right"
                    dataKey="subscribers"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{
                      fill: '#3B82F6',
                      stroke: 'white',
                      strokeWidth: 3,
                      r: 6,
                      cursor: 'pointer'
                    }}
                    activeDot={{
                      r: 8,
                      stroke: '#3B82F6',
                      strokeWidth: 3,
                      fill: 'white',
                      cursor: 'pointer'
                    }}
                    connectNulls={true}
                    isAnimationActive={true}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500 border border-dashed border-[#E8F0FF] rounded-lg">
                No data available
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Subscribers</span>
            </div>
          </div>

          {/* Growth Metrics Display - Show when a specific month is selected */}
          {selectedRevenueMonth !== 'all' && revenueData.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Growth Metrics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {revenueData.map((item, index) => {
                  const revenueGrowth = item.revenueGrowth ?? 0;
                  const subscriberGrowth = item.subscriberGrowth ?? 0;
                  const isRevenuePositive = revenueGrowth > 0;
                  const isRevenueNegative = revenueGrowth < 0;
                  const isSubscriberPositive = subscriberGrowth > 0;
                  const isSubscriberNegative = subscriberGrowth < 0;

                  return (
                    <React.Fragment key={index}>
                      {/* Revenue Growth Card */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700">Revenue Growth</span>
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${isRevenuePositive ? 'bg-green-200 text-green-800' :
                            isRevenueNegative ? 'bg-red-200 text-red-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                            {isRevenuePositive ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            ) : isRevenueNegative ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17l5-5m0 0l-5-5m5 5H6" />
                              </svg>
                            ) : null}
                            <span className="text-sm font-bold">
                              {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Compared to previous month</p>
                      </div>

                      {/* Subscriber Growth Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700">Subscriber Growth</span>
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${isSubscriberPositive ? 'bg-green-200 text-green-800' :
                            isSubscriberNegative ? 'bg-red-200 text-red-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                            {isSubscriberPositive ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            ) : isSubscriberNegative ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17l5-5m0 0l-5-5m5 5H6" />
                              </svg>
                            ) : null}
                            <span className="text-sm font-bold">
                              {subscriberGrowth > 0 ? '+' : ''}{subscriberGrowth.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Compared to previous month</p>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Role Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E8F0FF] dark:border-gray-700 p-6 transition-all">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">Subscription Distribution</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue breakdown by plan type</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="subscription-month-select" className="text-sm text-gray-600 dark:text-gray-400">Filter by month:</label>
              <select
                id="subscription-month-select"
                value={selectedSubscriptionMonth}
                onChange={(e) => setSelectedSubscriptionMonth(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Months</option>
                {last6Months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-80">
            {subscriptionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<SubscriptionTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500 border border-dashed border-[#E8F0FF] rounded-lg">
                No data available
              </div>
            )}
          </div>

          {/* Legend */}
          {subscriptionData.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
              {subscriptionData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                  <span>{item.name}: {formatNumber(item.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Real-Time Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E8F0FF] dark:border-gray-700 p-6 h-100 flex flex-col transition-all">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Recent Firm Registrations</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Latest firms that joined the platform</p>

            <div className="flex-1 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activityData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" opacity={0.3} />
                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                    domain={[0, activityUpperBound]}
                  />
                  <Tooltip content={<ActivityTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: 'white', stroke: '#10B981', strokeWidth: 3, r: 5 }}
                    activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2, fill: 'white' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Activity count</span>
              </div>
            </div>
          </div>

        </div>

        {/* Middle Column */}
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E8F0FF] dark:border-gray-700 p-6 h-100 flex flex-col transition-all">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Performance Metrics</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">System performance indicators</p>
            <div className="flex-1 space-y-4">
              {performanceData.map((metric, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{metric.metric}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatNumber(metric.current)}
                      {metric.unit}
                      {metric.target ? ` / ${formatNumber(metric.target)}${metric.unit}` : ''}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${metric.target ? Math.min((metric.current / metric.target) * 100, 100) : 0}%`,
                        backgroundColor: '#3B4A66'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          {/* Security Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E8F0FF] dark:border-gray-700 p-6 h-100 flex flex-col transition-all">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Security Status</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Platform security overview</p>
            <div className="flex-1 space-y-3">
              {securityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8A63]"></div>
                </div>
              ) : (
                securityItems.map((item, index) => {
                  const itemEnabled = Boolean(item.enabled);
                  const backgroundClass = itemEnabled ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20';
                  const StatusIcon = itemEnabled ? SecurityGreenIcon : SecurityYellowIcon;
                  const isUpdating = updatingSecuritySetting === item.key;

                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg ${backgroundClass} transition-all`}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <StatusIcon className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 block">{item.name}</span>
                          {item.description && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">{item.description}</span>
                          )}
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <label className="relative inline-flex cursor-pointer items-center ml-3">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={itemEnabled}
                          onChange={() => handleSecuritySettingToggle(item.key, itemEnabled)}
                          disabled={isUpdating || securityLoading}
                        />
                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${isUpdating ? 'opacity-50 cursor-wait' : ''
                          } ${itemEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${itemEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                          />
                        </div>
                      </label>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Recent Firms and Quick Actions */}
      <div className={`grid grid-cols-1 ${showRecentFirmsSection ? 'lg:grid-cols-2' : ''} gap-2 mt-4 pb-0`}>
        {showRecentFirmsSection && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E8F0FF] dark:border-gray-700 p-6 self-start transition-all">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Firm Registrations</h4>
              {totalFirms > FIRMS_PER_PAGE && (
                <button
                  onClick={handleViewAll}
                  className="text-black dark:text-white text-sm font-medium hover:underline cursor-pointer px-3 py-2 transition-colors border border-[#E8F0FF] dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {showAllFirms ? 'Show Less' : 'View All'}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Latest firms that joined the platform</p>
            <div className="space-y-2">
              {displayedFirms.map((firm, index) => (
                <div key={index} className="border border-[#E8F0FF] dark:border-gray-700 flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex-1">
                    <h6 className="font-medium text-gray-900 dark:text-white">{firm.name}</h6>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Joined: {firm.created_at_display || firm.created_at || 'N/A'} • Users: {formatNumber(firm.active_users)} • Monthly Fee: {formatCurrency(firm.monthly_fee)}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {firm.subscription_plan ? firm.subscription_plan.charAt(0).toUpperCase() + firm.subscription_plan.slice(1) : 'None'}
                  </span>
                </div>
              ))}
            </div>
            {shouldShowPagination && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E8F0FF]">
                <button
                  onClick={() => handleFirmsPageChange(firmsCurrentPage - 1)}
                  disabled={firmsCurrentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Page {firmsCurrentPage} of {totalPages}
                  </span>
                </div>
                <button
                  onClick={() => handleFirmsPageChange(firmsCurrentPage + 1)}
                  disabled={firmsCurrentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E8F0FF] dark:border-gray-700 p-6 transition-all">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Quick Actions</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Common administrative tasks</p>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const actionLabel = getActionLabelText(action).trim();
              const targetRoute = resolveQuickActionRoute(action);

              const cardContent = (
                <>
                  <div className={`mb-2 w-8 h-8 flex items-center justify-center ${targetRoute ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>
                    {getQuickActionIcon(actionLabel)}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                    {action.label}
                  </span>
                </>
              );

              if (targetRoute) {
                return (
                  <Link
                    key={index}
                    to={targetRoute}
                    className="flex flex-col items-center justify-center p-4 border border-[#E8F0FF] dark:border-gray-700 rounded-lg transition-all hover:border-[#3B4A66] dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-sm cursor-pointer"
                    style={{ borderRadius: '0.5rem', minHeight: '100px' }}
                  >
                    {cardContent}
                  </Link>
                );
              }

              return (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center p-4 border border-dashed border-[#E5E7EB] dark:border-gray-700 rounded-lg text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  style={{ borderRadius: '0.5rem', minHeight: '100px' }}
                  title="This action is not available."
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Users Modal */}
      <Modal
        show={showActiveUsersModal}
        onHide={() => {
          setShowActiveUsersModal(false);
          setActiveUsersData(null);
          setActiveUsersError(null);
          setActiveUsersTab('Firm');
        }}
        size="xl"
        centered
        style={{ fontFamily: 'BasisGrotesquePro' }}
      >
        <Modal.Header closeButton className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Modal.Title className="text-gray-900 dark:text-white" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600' }}>
            Active Users Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '0' }}>
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex gap-0">
              <button
                onClick={() => setActiveUsersTab('Firm')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors font-[BasisGrotesquePro] flex-1 ${activeUsersTab === 'Firm'
                  ? 'border-[#3AD6F2] text-[#3AD6F2]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                Firm ({activeUsersData?.firm_users?.length || 0})
              </button>
              <button
                onClick={() => setActiveUsersTab('Taxpayer')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors font-[BasisGrotesquePro] flex-1 ${activeUsersTab === 'Taxpayer'
                  ? 'border-[#3AD6F2] text-[#3AD6F2]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                Taxpayer ({activeUsersData?.taxpayer_users?.length || 0})
              </button>
              <button
                onClick={() => setActiveUsersTab('Taxpreparer')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors font-[BasisGrotesquePro] flex-1 ${activeUsersTab === 'Taxpreparer'
                  ? 'border-[#3AD6F2] text-[#3AD6F2]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                Tax Preparer ({activeUsersData?.taxpreparer_users?.length || 0})
              </button>
              <button
                onClick={() => setActiveUsersTab('Superadmin')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors font-[BasisGrotesquePro] flex-1 ${activeUsersTab === 'Superadmin'
                  ? 'border-[#3AD6F2] text-[#3AD6F2]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                Super Admin ({activeUsersData?.super_admin_users?.length || 0})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '24px' }}>
            {activeUsersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8A63] mx-auto mb-4"></div>
                <p className="text-gray-500">Loading active users...</p>
              </div>
            ) : activeUsersError ? (
              <div className="text-center py-8">
                <p className="text-red-500">{activeUsersError}</p>
              </div>
            ) : activeUsersData ? (
              <div>
                {activeUsersTab === 'Firm' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Active Firms</h4>
                    {activeUsersData.firm_users && activeUsersData.firm_users.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeUsersData.firm_users.map((firm, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-400 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {firm.name?.charAt(0)?.toUpperCase() || 'F'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{firm.name || 'Unknown Firm'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{firm.email || 'No email'}</p>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <p><span className="font-medium">Phone:</span> {firm.phone || 'N/A'}</p>
                              <p><span className="font-medium">Total Users:</span> {firm.total_users || 0}</p>
                              <p><span className="font-medium">Subscription:</span>
                                <span className={`ml-1 px-2 py-1 rounded text-xs ${firm.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                  }`}>
                                  {firm.subscription_status || 'Unknown'}
                                </span>
                              </p>
                              <p><span className="font-medium">Status:</span>
                                <span className={`ml-1 px-2 py-1 rounded text-xs ${firm.status === 'active' ? 'bg-green-100 text-green-800' :
                                  firm.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                  {firm.status || 'Unknown'}
                                </span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No active firms found</p>
                    )}
                  </div>
                )}

                {activeUsersTab === 'Taxpayer' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Active Taxpayers</h4>
                    {activeUsersData.taxpayer_users && activeUsersData.taxpayer_users.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeUsersData.taxpayer_users.map((taxpayer, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-400 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {(taxpayer.first_name || taxpayer.last_name) ? `${taxpayer.first_name?.charAt(0) || ''}${taxpayer.last_name?.charAt(0) || ''}`.toUpperCase() : 'U'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{`${taxpayer.first_name || ''} ${taxpayer.last_name || ''}`.trim() || 'Unknown User'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{taxpayer.email || 'No email'}</p>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <p><span className="font-medium">Phone:</span> {taxpayer.phone || 'N/A'}</p>
                              <p><span className="font-medium">Firm:</span> {taxpayer.firm_name || 'N/A'}</p>
                              <p><span className="font-medium">Email Verified:</span>
                                <span className={`ml-1 px-2 py-1 rounded text-xs ${taxpayer.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                  {taxpayer.email_verified ? 'Yes' : 'No'}
                                </span>
                              </p>
                              <p><span className="font-medium">Status:</span>
                                <span className={`ml-1 px-2 py-1 rounded text-xs ${taxpayer.status === 'active' ? 'bg-green-100 text-green-800' :
                                  taxpayer.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                  {taxpayer.status || 'Unknown'}
                                </span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No active taxpayers found</p>
                    )}
                  </div>
                )}

                {activeUsersTab === 'Taxpreparer' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Active Tax Preparers</h4>
                    {activeUsersData.taxpreparer_users && activeUsersData.taxpreparer_users.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeUsersData.taxpreparer_users.map((preparer, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-400 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {(preparer.first_name || preparer.last_name) ? `${preparer.first_name?.charAt(0) || ''}${preparer.last_name?.charAt(0) || ''}`.toUpperCase() : 'U'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{`${preparer.first_name || ''} ${preparer.last_name || ''}`.trim() || 'Unknown User'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{preparer.email || 'No email'}</p>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <p><span className="font-medium">Phone:</span> {preparer.phone || 'N/A'}</p>
                              <p><span className="font-medium">Role:</span> {preparer.role || 'Tax Preparer'}</p>
                              <p><span className="font-medium">Firm:</span> {preparer.firm_name || 'N/A'}</p>
                              <p><span className="font-medium">Email Verified:</span>
                                <span className={`ml-1 px-2 py-1 rounded text-xs ${preparer.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                  {preparer.email_verified ? 'Yes' : 'No'}
                                </span>
                              </p>
                              <p><span className="font-medium">Status:</span>
                                <span className={`ml-1 px-2 py-1 rounded text-xs ${preparer.status === 'active' ? 'bg-green-100 text-green-800' :
                                  preparer.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                  {preparer.status || 'Unknown'}
                                </span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No active tax preparers found</p>
                    )}
                  </div>
                )}

                {activeUsersTab === 'Superadmin' && (
                  <div className="space-y-6">
                    {/* General Super Admins */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">System Super Admins ({activeUsersData.general_admins?.length || 0})</h4>
                      {activeUsersData.general_admins && activeUsersData.general_admins.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {activeUsersData.general_admins.map((admin, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-gray-400 transition-all">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-black dark:bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {(admin.first_name || admin.last_name) ? `${admin.first_name?.charAt(0) || ''}${admin.last_name?.charAt(0) || ''}`.toUpperCase() : 'S'}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{`${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'System Admin'}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{admin.email || 'No email'}</p>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                <p><span className="font-medium">Phone:</span> {admin.phone || 'N/A'}</p>
                                <p><span className="font-medium">Role:</span> {admin.role || 'Super Admin'}</p>
                                <p><span className="font-medium">Email Verified:</span>
                                  <span className={`ml-1 px-2 py-1 rounded text-xs ${admin.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {admin.email_verified ? 'Yes' : 'No'}
                                  </span>
                                </p>
                                <p><span className="font-medium">Super User:</span>
                                  <span className={`ml-1 px-2 py-1 rounded text-xs ${admin.is_superuser ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {admin.is_superuser ? 'Yes' : 'No'}
                                  </span>
                                </p>
                                <p><span className="font-medium">Status:</span>
                                  <span className={`ml-1 px-2 py-1 rounded text-xs ${admin.status === 'active' ? 'bg-green-100 text-green-800' :
                                    admin.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                    {admin.status || 'Unknown'}
                                  </span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No system super admins found</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Billing Admins ({activeUsersData.billing_users?.length || 0})</h4>
                      {activeUsersData.billing_users && activeUsersData.billing_users.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {activeUsersData.billing_users.map((admin, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-400 transition-all">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {(admin.first_name || admin.last_name) ? `${admin.first_name?.charAt(0) || ''}${admin.last_name?.charAt(0) || ''}`.toUpperCase() : 'S'}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{`${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'System Admin'}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{admin.email || 'No email'}</p>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                <p><span className="font-medium">Phone:</span> {admin.phone || 'N/A'}</p>
                                <p><span className="font-medium">Role:</span> {admin.role || 'Billing Admin'}</p>
                                <p><span className="font-medium">Email Verified:</span>
                                  <span className={`ml-1 px-2 py-1 rounded text-xs ${admin.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {admin.email_verified ? 'Yes' : 'No'}
                                  </span>
                                </p>
                                <p><span className="font-medium">Super User:</span>
                                  <span className={`ml-1 px-2 py-1 rounded text-xs ${admin.is_superuser ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {admin.is_superuser ? 'Yes' : 'No'}
                                  </span>
                                </p>
                                <p><span className="font-medium">Status:</span>
                                  <span className={`ml-1 px-2 py-1 rounded text-xs ${admin.status === 'active' ? 'bg-green-100 text-green-800' :
                                    admin.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                    {admin.status || 'Unknown'}
                                  </span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No billing admins found</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Support Admins ({activeUsersData.support_users?.length || 0})</h4>
                      {activeUsersData.support_users && activeUsersData.support_users.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {activeUsersData.support_users.map((admin, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-400 transition-all">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {(admin.first_name || admin.last_name) ? `${admin.first_name?.charAt(0) || ''}${admin.last_name?.charAt(0) || ''}`.toUpperCase() : 'S'}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{`${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'System Admin'}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{admin.email || 'No email'}</p>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                <p><span className="font-medium">Phone:</span> {admin.phone || 'N/A'}</p>
                                <p><span className="font-medium">Role:</span> {admin.role || 'Support Admin'}</p>
                                <p><span className="font-medium">Email Verified:</span>
                                  <span className={`ml-1 px-2 py-1 rounded text-xs ${admin.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {admin.email_verified ? 'Yes' : 'No'}
                                  </span>
                                </p>
                                <p><span className="font-medium">Super User:</span>
                                  <span className={`ml-1 px-2 py-1 rounded text-xs ${admin.is_superuser ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {admin.is_superuser ? 'Yes' : 'No'}
                                  </span>
                                </p>
                                <p><span className="font-medium">Status:</span>
                                  <span className={`ml-1 px-2 py-1 rounded text-xs ${admin.status === 'active' ? 'bg-green-100 text-green-800' :
                                    admin.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                    {admin.status || 'Unknown'}
                                  </span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No support admins found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            className="btn dark:text-white dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
            onClick={() => {
              setShowActiveUsersModal(false);
              setActiveUsersData(null);
              setActiveUsersError(null);
              setActiveUsersTab('Firm');
            }}
            style={{
              fontFamily: 'BasisGrotesquePro',
              backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
              color: isDarkMode ? '#F9FAFB' : '#3B4A66',
              border: isDarkMode ? '1px solid #4B5563' : '1px solid #E5E7EB',
              fontWeight: '500',
              padding: '8px 16px',
              borderRadius: '6px'
            }}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>

      {/* All Firms Modal */}
      <Modal
        show={showAllFirmsModal}
        onHide={() => {
          setShowAllFirmsModal(false);
          setAllFirms([]);
          setAllFirmsError(null);
        }}
        size="xl"
        centered
        style={{ fontFamily: 'BasisGrotesquePro' }}
      >
        <Modal.Header closeButton className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Modal.Title className="text-gray-900 dark:text-white" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600' }}>
            All Firms ({allFirms.length})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '0' }}>
          <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '24px' }}>
            {allFirmsLoading ? (
              <div className="text-center py-5">
                <p className="text-gray-500">Loading firms...</p>
              </div>
            ) : allFirmsError ? (
              <div className="text-center py-5">
                <p className="text-red-500">{allFirmsError}</p>
              </div>
            ) : allFirms.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-gray-500">No firms found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allFirms.map((firm) => (
                  <div
                    key={firm.id}
                    className="border border-[#E8F0FF] dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {firm.name || firm.firm_name || 'Unnamed Firm'}
                        </h5>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                          {firm.owner_name && (
                            <div>
                              <span className="font-medium">Owner:</span> {firm.owner_name}
                            </div>
                          )}
                          {firm.email && (
                            <div>
                              <span className="font-medium">Email:</span> {firm.email}
                            </div>
                          )}
                          {firm.subscription_plan && (
                            <div>
                              <span className="font-medium">Plan:</span> {firm.subscription_plan}
                            </div>
                          )}
                          {firm.status && (
                            <div>
                              <span className="font-medium">Status:</span>{' '}
                              <span
                                className={`px-2 py-1 rounded text-xs ${firm.status.toLowerCase() === 'active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : firm.status.toLowerCase() === 'suspended'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                  }`}
                              >
                                {firm.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 sm:mt-0">
                        <button
                          onClick={() => {
                            setShowAllFirmsModal(false);
                            navigate(`/superadmin/firms/${firm.id}`);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                        >
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2.04883 10C3.11049 6.61917 6.26716 4.16667 10.0005 4.16667C13.7338 4.16667 16.8905 6.61917 17.9522 10C16.8905 13.3808 13.7338 15.8333 10.0005 15.8333C6.26716 15.8333 3.11049 13.3808 2.04883 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          View
                        </button>
                        <button
                          onClick={() => {
                            setShowAllFirmsModal(false);
                            navigate(`/superadmin/firms/${firm.id}?action=login`);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1.5"
                        >
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.8333 9.16667V5.83333C15.8333 5.39131 15.6577 4.96738 15.345 4.65482C15.0325 4.34226 14.6085 4.16667 14.1667 4.16667H5.83333C5.39131 4.16667 4.96738 4.34226 4.65482 4.65482C4.34226 4.96738 4.16667 5.39131 4.16667 5.83333V14.1667C4.16667 14.6087 4.34226 15.0326 4.65482 15.3452C4.96738 15.6577 5.39131 15.8333 5.83333 15.8333H14.1667C14.6085 15.8333 15.0325 15.6577 15.345 15.3452C15.6577 15.0326 15.8333 15.0326 15.8333 14.1667V10.8333M12.5 10H18.3333M18.3333 10L16.25 7.91667M18.3333 10L16.25 12.0833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Login
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            className="btn"
            onClick={() => {
              setShowAllFirmsModal(false);
              setAllFirms([]);
              setAllFirmsError(null);
            }}
            style={{
              fontFamily: 'BasisGrotesquePro',
              backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
              color: isDarkMode ? '#F9FAFB' : '#3B4A66',
              border: isDarkMode ? '1px solid #4B5563' : '1px solid #E5E7EB',
              fontWeight: '500',
              padding: '8px 16px',
              borderRadius: '6px'
            }}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}