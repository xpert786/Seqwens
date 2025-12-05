import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const SUBSCRIPTION_COLOR_MAP = {
  solo: '#10B981',
  team: '#3B82F6',
  business: '#F59E0B',
  enterprise: '#06B6D4',
  professional: '#8B5CF6'
};

const FALLBACK_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#06B6D4', '#8B5CF6', '#EF4444', '#F97316'];

export default function SuperDashboardContent() {
  const navigate = useNavigate();
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
      const response = await superAdminAPI.getAdminDashboard();

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
        ip_whitelisting_enabled: securitySettings?.ip_whitelisting_enabled?.enabled ?? false,
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

  // Load data on component mount
  useEffect(() => {
    fetchDashboardData();
    fetchSecuritySettings();
  }, []);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Process data for charts
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

    const revenueData = labels.map((label, index) => ({
      month: label,
      revenue: revenueValues[index] ?? 0,
      subscribers: subscriberValues[index] ?? 0
    }));

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
  const maxRevenueValue = revenueData.reduce((max, item) => Math.max(max, item.revenue || 0), 0);
  const maxSubscriberValue = revenueData.reduce((max, item) => Math.max(max, item.subscribers || 0), 0);
  const revenueUpperBound = maxRevenueValue > 0 ? Math.ceil(maxRevenueValue * 1.2) : 1;
  const subscriberUpperBound = maxSubscriberValue > 0 ? Math.ceil(maxSubscriberValue * 1.2) : 1;

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
      name: 'IP Whitelisting',
      key: 'ip_whitelisting_enabled',
      enabled: securitySettings?.ip_whitelisting_enabled?.enabled ?? false,
      status: securitySettings?.ip_whitelisting_enabled?.status ?? 'disabled',
      description: securitySettings?.ip_whitelisting_enabled?.description ?? ''
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
      name: 'IP Whitelisting',
      key: 'ip_whitelisting_enabled',
      enabled: securityStatus?.ip_whitelisting_enabled ?? false,
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
    <div className="w-full px-3 pt-4 pb-0 bg-[#F6F7FF]">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="taxdashboardr-titler font-bold text-gray-900">Platform Overview</h1>
          <p className="text-gray-600 mt-1">Monitor and manage the entire tax practice platform</p>
          <p className="text-xs text-gray-500 mt-1">Last updated: {lastRefresh.toLocaleString()}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="taxdashboardr-titler flex items-center gap-2 px-6 py-3 text-black bg-white rounded-3xl transition-colors disabled:opacity-50"
          style={{ borderRadius: '7px' }}
        >
          <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-8">
        <div className="bg-white h-auto rounded-xl border border-[#E8F0FF] p-7 relative">
          <div className="absolute top-4 right-4">
            <TotalFirmsIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Firms</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(dashboardData?.summary?.total_firms)}
            </p>
            <p className="text-sm text-gray-500 mt-2">Firms onboarded</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E8F0FF] p-6 relative">
          <div className="absolute top-4 right-4">
            <ActiveUsersIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(dashboardData?.summary?.active_users)}
            </p>
            <p className="text-sm text-gray-500 mt-2">Across all firms</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E8F0FF] p-6 relative">
          <div className="absolute top-4 right-4">
            <MonthlyRevenueIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Monthly Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(dashboardData?.summary?.monthly_revenue)}
            </p>
            <p className="text-sm text-gray-500 mt-2">Recurring revenue</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E8F0FF] p-6 relative">
          <div className="absolute top-4 right-4">
            <SystemHealthIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">System Health</p>
            <p className="text-2xl font-bold text-gray-900">
              {`${formatNumber(dashboardData?.summary?.system_health_score)}%`}
            </p>
            <p className="text-sm text-gray-500 mt-2">Overall stability</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-8">
        {/* User Registration Trend */}
        <div className="bg-white rounded-xl border border-[#E8F0FF] p-6">
          <h3 className="taxdashboardr-titler text-base font-medium text-gray-900 mb-1">Revenue Growth Trend</h3>
          <p className="text-sm text-gray-600 mb-4">Monthly recurring revenue and user growth</p>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
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
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                  domain={[0, revenueUpperBound]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                  domain={[0, subscriberUpperBound]}
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
                />
                <Line
                  type="monotone"
                  yAxisId="right"
                  dataKey="subscribers"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: 'white', stroke: '#3B82F6', strokeWidth: 3, r: 5 }}
                  activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2, fill: 'white' }}
                />
              </AreaChart>
            </ResponsiveContainer>
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
        </div>

        {/* User Role Distribution */}
        <div className="bg-white rounded-xl border border-[#E8F0FF] p-6">
          <h3 className="text-base font-medium text-gray-900 mb-1">Subscription Distribution</h3>
          <p className="text-sm text-gray-600 mb-4">Revenue breakdown by plan typee</p>

          <div className="h-80">
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
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {subscriptionData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                <span>{item.name}: {formatNumber(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Real-Time Activity */}
          <div className="bg-white rounded-xl border border-[#E8F0FF] p-6 h-100 flex flex-col">
            <h4 className="text-base font-semibold text-gray-900 mb-1">Recent Firm Registrations</h4>
            <p className="text-sm text-gray-600 mb-4">Latest firms that joined the platform</p>

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

            <div className="mt-4 text-sm text-gray-600">
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
          <div className="bg-white rounded-xl  border border-[#E8F0FF] p-6 h-100 flex flex-col">
            <h4 className="text-base font-semibold text-gray-900 mb-1">Performance Metrics</h4>
            <p className="text-sm text-gray-600 mb-4">System performance indicators</p>
            <div className="flex-1 space-y-4">
              {performanceData.map((metric, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{metric.metric}</span>
                    <span className="text-sm text-gray-600">
                      {formatNumber(metric.current)}
                      {metric.unit}
                      {metric.target ? ` / ${formatNumber(metric.target)}${metric.unit}` : ''}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
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
          <div className="bg-white rounded-xl  border border-[#E8F0FF] p-6 h-100 flex flex-col">
            <h4 className="text-base font-semibold text-gray-900 mb-1">Security Status</h4>
            <p className="text-sm text-gray-600 mb-4">Platform security overview</p>
            <div className="flex-1 space-y-3">
              {securityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8A63]"></div>
                </div>
              ) : (
                securityItems.map((item, index) => {
                  const itemEnabled = Boolean(item.enabled);
                  const backgroundClass = itemEnabled ? 'bg-green-50' : 'bg-yellow-50';
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
                          <span className="text-sm font-medium text-gray-700 block">{item.name}</span>
                          {item.description && (
                            <span className="text-xs text-gray-500 block mt-0.5">{item.description}</span>
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
                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${
                          isUpdating ? 'opacity-50 cursor-wait' : ''
                        } ${itemEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              itemEnabled ? 'translate-x-5' : 'translate-x-0'
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
          <div className="bg-white rounded-xl border border-[#E8F0FF] p-6 self-start">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-gray-900">Recent Firm Registrations</h4>
              {totalFirms > FIRMS_PER_PAGE && (
                <button
                  onClick={handleViewAll}
                  className="text-black text-sm font-medium hover:underline cursor-pointer px-3 py-2 transition-colors"
                  style={{ border: '1px solid #E8F0FF', borderRadius: '8px' }}
                >
                  {showAllFirms ? 'Show Less' : 'View All'}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-3">Latest firms that joined the platform</p>
            <div className="space-y-2">
              {displayedFirms.map((firm, index) => (
                <div key={index} className="border border-[#E8F0FF] flex items-center justify-between p-3 rounded-lg">
                  <div className="flex-1">
                    <h6 className="font-medium text-gray-900">{firm.name}</h6>
                    <p className="text-xs text-gray-600">
                      Joined: {firm.created_at_display || firm.created_at || 'N/A'} • Users: {formatNumber(firm.active_users)} • Monthly Fee: {formatCurrency(firm.monthly_fee)}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {firm.subscription_plan ? firm.subscription_plan.charAt(0).toUpperCase() + firm.subscription_plan.slice(1) : '—'}
                  </span>
                </div>
              ))}
            </div>
            {shouldShowPagination && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E8F0FF]">
                <button
                  onClick={() => handleFirmsPageChange(firmsCurrentPage - 1)}
                  disabled={firmsCurrentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-[#E8F0FF] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ borderRadius: '8px' }}
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
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-[#E8F0FF] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ borderRadius: '8px' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-[#E8F0FF] p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-1">Quick Actions</h4>
          <p className="text-sm text-gray-500 mb-3">Common administrative tasks</p>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const actionLabel = getActionLabelText(action).trim();
              const targetRoute = resolveQuickActionRoute(action);

              const cardContent = (
                <>
                  <div className={`mb-2 w-8 h-8 flex items-center justify-center ${targetRoute ? 'text-gray-600' : 'text-gray-400'}`}>
                    {getQuickActionIcon(actionLabel)}
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                    {action.label}
                  </span>
                </>
              );

              if (targetRoute) {
                return (
                  <Link
                    key={index}
                    to={targetRoute}
                    className="flex flex-col items-center justify-center p-4 border border-[#E8F0FF] rounded-lg transition-all hover:border-[#3B4A66] hover:bg-gray-50 hover:shadow-sm cursor-pointer"
                    style={{ borderRadius: '0.5rem', minHeight: '100px' }}
                  >
                    {cardContent}
                  </Link>
                );
              }

              return (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center p-4 border border-dashed border-[#E5E7EB] rounded-lg text-gray-400 cursor-not-allowed"
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
    </div>
  );
}