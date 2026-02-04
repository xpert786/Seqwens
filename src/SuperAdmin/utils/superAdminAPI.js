import { getApiBaseUrl, fetchWithCors } from '../../ClientOnboarding/utils/corsConfig';
import { getAccessToken, getRefreshToken, setTokens, clearUserData } from '../../ClientOnboarding/utils/userUtils';
import { getLoginUrl } from '../../ClientOnboarding/utils/urlUtils';

// API Configuration
const API_BASE_URL = getApiBaseUrl();

// Common headers for API requests
const getHeaders = () => {
  const token = getAccessToken();

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Token refresh function
const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetchWithCors(`${API_BASE_URL}/user/refresh-token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();

  // Update tokens in storage - preserve current rememberMe setting
  const sessionRememberMe = sessionStorage.getItem("rememberMe");
  const localRememberMe = localStorage.getItem("rememberMe");
  const rememberMe = sessionRememberMe !== null ?
    sessionRememberMe === "true" :
    localRememberMe === "true";
  setTokens(data.access, data.refresh, rememberMe);

  return data.access;
};

// Generic API request function with CORS handling
const apiRequest = async (endpoint, method = 'GET', data = null) => {
  try {
    const headers = getHeaders();
    const config = {
      method,
      headers: { ...headers },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      if (data instanceof FormData) {
        const formHeaders = { ...headers };
        delete formHeaders['Content-Type'];
        config.headers = formHeaders;
        config.body = data;
      } else {
        config.body = JSON.stringify(data);
      }
    }

    // Sanitize data for logging to prevent API keys from appearing in console
    const sanitizeForLogging = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      if (obj instanceof FormData) return '[FormData]'; // Don't log FormData
      const sanitized = { ...obj };
      // Mask sensitive fields
      if (sanitized.key) sanitized.key = '***MASKED***';
      if (sanitized.api_key) sanitized.api_key = '***MASKED***';
      if (sanitized.apiKey) sanitized.apiKey = '***MASKED***';
      if (sanitized.password) sanitized.password = '***MASKED***';
      if (sanitized.token) sanitized.token = '***MASKED***';
      if (sanitized.access_token) sanitized.access_token = '***MASKED***';
      if (sanitized.refresh_token) sanitized.refresh_token = '***MASKED***';
      return sanitized;
    };

    console.log('SuperAdmin API Request URL:', `${API_BASE_URL}${endpoint}`);
    console.log('SuperAdmin API Request Config:', config);
    console.log('SuperAdmin API Request Data:', sanitizeForLogging(data));

    let response = await fetchWithCors(`${API_BASE_URL}${endpoint}`, config);

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && endpoint !== '/user/refresh-token/') {
      console.log('Received 401, attempting to refresh token...');

      try {
        await refreshAccessToken();

        // Retry the original request with new token
        config.headers = getHeaders();
        response = await fetchWithCors(`${API_BASE_URL}${endpoint}`, config);

        if (response.status === 401) {
          // Refresh failed, redirect to login
          console.log('Token refresh failed, clearing user data and redirecting to login');
          clearUserData();
          window.location.href = getLoginUrl();
          throw new Error('Session expired. Please login again.');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearUserData();
        window.location.href = getLoginUrl();
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('SuperAdmin API Error Response:', errorData);

        // If there are specific field errors, show them
        if (errorData.errors) {
          console.error('SuperAdmin Field Validation Errors:', errorData.errors);
          const fieldErrors = Object.entries(errorData.errors)
            .map(([field, errors]) => {
              const errorMessages = Array.isArray(errors) ? errors.join(', ') : errors;

              // Don't prefix generic errors with "Non Field Errors"
              if (field === 'non_field_errors' || field === 'detail') {
                return errorMessages;
              }

              // Format field name: replace underscores with spaces and capitalize
              const friendlyField = field
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              return `${friendlyField}: ${errorMessages}`;
            })
            .join('; ');

          const msg = errorData.message || 'Validation failed';
          errorMessage = msg === 'Validation failed' ? fieldErrors : `${msg}. ${fieldErrors}`;
        } else {
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        }
      } catch (parseError) {
        console.error('Error parsing SuperAdmin response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('SuperAdmin API Request Error:', error);

    // Enhanced error handling for CORS and network issues
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
    }

    throw error;
  }
};

// Error handling utilities
export const handleAPIError = (error) => {
  if (error.message.includes('CORS')) {
    return 'Network error: Please check your internet connection and try again.';
  }

  if (error.message.includes('401')) {
    return 'Authentication failed. Please try again.';
  }

  if (error.message.includes('400')) {
    return 'Invalid data provided. Please check your information and try again.';
  }

  if (error.message.includes('500')) {
    return 'Server error. Please try again later.';
  }

  return error.message || 'An unexpected error occurred. Please try again.';
};

// SuperAdmin Dashboard API functions
export const superAdminAPI = {
  // Get admin dashboard data
  // Optional params: revenue_month, revenue_year, distribution_month, distribution_year
  getAdminDashboard: async (params = {}) => {
    const { revenue_month, revenue_year, distribution_month, distribution_year } = params;
    const queryParams = new URLSearchParams();

    if (revenue_month !== undefined && revenue_year !== undefined) {
      queryParams.append('revenue_month', revenue_month.toString());
      queryParams.append('revenue_year', revenue_year.toString());
    }

    if (distribution_month !== undefined && distribution_year !== undefined) {
      queryParams.append('distribution_month', distribution_month.toString());
      queryParams.append('distribution_year', distribution_year.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/user/admin/platform-overview/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Get admin overview data (active users overview)
  getAdminOverview: async () => {
    return await apiRequest('/user/admin/overview/', 'GET');
  },

  // Get user management data
  getUsers: async (page = 1, limit = 10, search = '', role = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append('search', search);
    if (role) params.append('role', role);

    return await apiRequest(`/accounts/user/admin/users/?${params}`, 'GET');
  },

  // Get user details by ID
  getUserById: async (userId) => {
    return await apiRequest(`/accounts/user/admin/users/${userId}/`, 'GET');
  },

  // Update user
  updateUser: async (userId, userData) => {
    return await apiRequest(`/accounts/user/admin/users/${userId}/`, 'PATCH', userData);
  },

  // Delete user
  deleteUser: async (userId) => {
    return await apiRequest(`/accounts/user/admin/users/${userId}/`, 'DELETE');
  },

  // Get subscription data
  getSubscriptions: async (page = 1, limit = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return await apiRequest(`/user/admin/subscriptions/?${params}`, 'GET');
  },

  // Get superadmin subscription management data
  getSuperadminSubscriptions: async ({ search = '', status = '', plan = '', page = 1, limit = 25 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (plan) params.append('plan', plan);
    params.append('page', page);
    params.append('limit', limit);
    const query = params.toString();
    return await apiRequest(`/user/superadmin/subscriptions/${query ? `?${query}` : ''}`, 'GET');
  },

  // Update subscription notification settings
  updateSubscriptionNotifications: async (payload) => {
    return await apiRequest('/user/superadmin/subscriptions/', 'PATCH', payload);
  },

  // Get superadmin plan performance metrics
  // Optional params: mrr_month, mrr_year, churn_month, churn_year
  getSuperadminPlanPerformance: async (params = {}) => {
    const { mrr_month, mrr_year, churn_month, churn_year } = params;
    const queryParams = new URLSearchParams();

    if (mrr_month !== undefined && mrr_year !== undefined) {
      queryParams.append('mrr_month', mrr_month.toString());
      queryParams.append('mrr_year', mrr_year.toString());
    }

    if (churn_month !== undefined && churn_year !== undefined) {
      queryParams.append('churn_month', churn_month.toString());
      queryParams.append('churn_year', churn_year.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/user/superadmin/subscriptions/plan-performance/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Get subscription plans analytics 
  getSubscriptionPlans: async () => {
    return await apiRequest('/user/subscriptions/plans/', 'GET');
  },

  // Get subscription charts data
  getSubscriptionCharts: async (type = 'revenue', period = 30) => {
    const params = new URLSearchParams({
      type: type,
      period: period.toString(),
    });

    return await apiRequest(`/user/subscriptions/charts/?${params}`, 'GET');
  },

  // Get firm settings
  getFirmSettings: async (firmId) => {
    return await apiRequest(`/user/superadmin/firms/${firmId}/settings/`, 'GET');
  },

  // Update firm settings
  updateFirmSettings: async (firmId, payload) => {
    return await apiRequest(`/user/superadmin/firms/${firmId}/settings/`, 'PATCH', payload);
  },

  // Get firm billing overview
  getFirmBillingOverview: async (firmId) => {
    return await apiRequest(`/user/superadmin/firms/${firmId}/billing/overview/`, 'GET');
  },

  // Check subscription plan existence
  checkSubscriptionPlanExistence: async (activeOnly = true) => {
    const params = new URLSearchParams();
    if (activeOnly !== undefined) {
      params.append('active_only', activeOnly ? 'true' : 'false');
    }
    const query = params.toString();
    const endpoint = `/user/subscription-plans/existence/${query ? `?${query}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Get detailed overview for a specific firm
  getFirmOverview: async (firmId) => {
    return await apiRequest(`/user/superadmin/firms/${firmId}/overview/`, 'GET');
  },

  // Create a new super admin level user
  createSuperAdminUser: async (userData) => {
    return await apiRequest('/user/superadmin/superadmins/create/', 'POST', userData);
  },

  // Get platform users (internal staff)
  getPlatformUsers: async ({ status = '', role = '', search = '', page = 1, limit = 25, lookup = false } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    if (lookup) params.append('lookup', 'true');
    params.append('page', page);
    params.append('limit', limit);

    const query = params.toString();
    return await apiRequest(`/user/superadmin/platform-users/${query ? `?${query}` : ''}`, 'GET');
  },

  // Get system configuration settings
  getSystemSettings: async () => {
    return await apiRequest('/user/admin/system-settings/', 'GET');
  },

  // Update system configuration settings
  updateSystemSettings: async (payload) => {
    return await apiRequest('/user/admin/system-settings/', 'PATCH', payload);
  },

  // Get detailed admin user by ID
  getAdminUserById: async (userId) => {
    return await apiRequest(`/user/superadmin/users/${userId}/`, 'GET');
  },

  // Update admin user suspension status
  updateAdminUserSuspension: async (userId, payload) => {
    return await apiRequest(`/user/superadmin/users/${userId}/suspend/`, 'POST', payload);
  },

  // Update any user status (active/suspended) via SuperAdminUserDetailView
  // Uses PUT because the view is defined with 'put' method, but acts as partial update
  updateGlobalUserStatus: async (userId, statusData) => {
    return await apiRequest(`/user/superadmin/users/${userId}/`, 'PUT', statusData);
  },

  // Reset user password (auto-generated or manual)
  resetUserPassword: async (userId, payload = {}) => {
    return await apiRequest(`/user/superadmin/users/${userId}/reset-password/`, 'POST', payload);
  },

  // Get revenue insights analytics
  getRevenueInsights: async ({ days = 30, startDate = '', endDate = '' } = {}) => {
    const params = new URLSearchParams();

    if ((days || days === 0) && !startDate && !endDate) {
      params.append('days', days.toString());
    }

    if (startDate) {
      params.append('start_date', startDate);
    }

    if (endDate) {
      params.append('end_date', endDate);
    }

    const query = params.toString();
    return await apiRequest(`/user/admin/revenue-insights/${query ? `?${query}` : ''}`, 'GET');
  },

  // Custom reports
  getCustomReportConfig: async () => {
    return await apiRequest('/user/admin/reports/custom/config/', 'GET');
  },

  generateCustomReport: async (payload) => {
    return await apiRequest('/user/admin/reports/custom/generate/', 'POST', payload);
  },

  scheduleCustomReport: async (payload) => {
    return await apiRequest('/user/admin/reports/custom/schedule/', 'POST', payload);
  },

  getCustomReportSchedules: async () => {
    return await apiRequest('/user/admin/reports/custom/schedule/', 'GET');
  },

  getAnalytics: async (period = '30d') => {
    const params = new URLSearchParams({
      period: period,
    });
    return await apiRequest(`/user/admin/analytics/?${params}`, 'GET');
  },

  // Get system health data
  getSystemHealth: async () => {
    return await apiRequest('/user/admin/system/health/', 'GET');
  },

  // Get system performance metrics
  getPerformanceMetrics: async () => {
    return await apiRequest('/user/admin/system/performance-metrics/', 'GET');
  },

  // Get activity logs
  getActivityLogs: async (page = 1, limit = 20, activityType = '', userId = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (activityType) params.append('activity_type', activityType);
    if (userId) params.append('user_id', userId);

    return await apiRequest(`/user/admin/activity-logs/?${params}`, 'GET');
  },

  // Get firms data
  getFirms: async (page = 1, limit = 20, search = '', status = '', plan = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (plan) params.append('subscription_plan', plan);

    return await apiRequest(`/user/superadmin/firms/?${params}`, 'GET');
  },

  // Get firm details by ID
  getFirmById: async (firmId) => {
    return await apiRequest(`/user/superadmin/firms/${firmId}/`, 'GET');
  },

  // Update firm
  updateFirm: async (firmId, firmData) => {
    return await apiRequest(`/user/superadmin/firms/${firmId}/`, 'PATCH', firmData);
  },

  // Delete firm
  deleteFirm: async (firmId) => {
    return await apiRequest(`/user/superadmin/firms/${firmId}/`, 'DELETE');
  },

  // Generate login credentials for firm admin
  generateFirmLogin: async (firmId) => {
    return await apiRequest(`/user/superadmin/firms/${firmId}/login/`, 'POST');
  },

  // Create new firm
  createFirm: async (firmData) => {
    return await apiRequest('/user/superadmin/firms/create/', 'POST', firmData);
  },

  // Get unassigned taxpayers list
  getUnassignedTaxpayers: async (page = 1, pageSize = 20, search = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    return await apiRequest(`/user/superadmin/taxpayers/unassigned/?${params.toString()}`, 'GET');
  },

  // Assign taxpayer to firm
  assignTaxpayerToFirm: async ({ taxpayerId, firmId, taxPreparerId = null }) => {
    const payload = {
      taxpayer_id: taxpayerId,
      firm_id: firmId,
    };

    if (taxPreparerId) {
      payload.assigned_tax_preparer_id = taxPreparerId;
    }

    return await apiRequest('/user/superadmin/taxpayers/assign/', 'POST', payload);
  },

  // Suspend firm
  suspendFirm: async (firmId, reason) => {
    const suspendData = {
      reason: reason,
      status: 'suspend'
    };
    return await apiRequest(`/user/superadmin/firms/${firmId}/suspend/`, 'POST', suspendData);
  },

  // Reactivate firm
  reactivateFirm: async (firmId, reason) => {
    const reactivateData = {
      reason: reason,
      status: 'unsuspend'
    };
    return await apiRequest(`/user/superadmin/firms/${firmId}/suspend/`, 'POST', reactivateData);
  },

  // Get Reach Out Messages
  getReachOutMessages: async () => {
    return await apiRequest('/admin/reach-out-messages/', 'GET');
  },

  // FAQs API functions
  // Get FAQs with pagination and search
  getFAQs: async (page = 1, pageSize = 30, search = '', isActive = true) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      is_active: isActive.toString(),
    });

    if (search) params.append('search', search);

    return await apiRequest(`/user/admin/faqs/?${params}`, 'GET');
  },

  // Create new FAQ
  createFAQ: async (faqData) => {
    return await apiRequest('/user/admin/faqs/', 'POST', faqData);
  },

  // Update FAQ
  updateFAQ: async (faqId, faqData) => {
    return await apiRequest(`/user/admin/faqs/${faqId}/`, 'PATCH', faqData);
  },

  // Delete FAQ
  deleteFAQ: async (faqId) => {
    return await apiRequest(`/user/admin/faqs/${faqId}/`, 'DELETE');
  },

  // Reorder FAQs
  reorderFAQs: async (faqOrders) => {
    return await apiRequest('/user/admin/faqs/reorder/', 'POST', { faqs: faqOrders });
  },

  // Support Tickets API functions
  // Get all support tickets for admin (with filters)
  getSupportTickets: async (page = 1, pageSize = 30, search = '', status = '', priority = '', category = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (search) params.append('search', search);
    if (status && status !== 'All Status') params.append('status', status);
    if (priority && priority !== 'All Priority') params.append('priority', priority);
    if (category && category !== 'all') {
      const normalizedCategory = category
        .toString()
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toLowerCase() + part.slice(1))
        .join(' ');
      params.append('category', normalizedCategory);
    }

    return await apiRequest(`/user/admin/support/tickets/?${params}`, 'GET');
  },

  // Get support ticket by ID
  getSupportTicket: async (ticketId) => {
    return await apiRequest(`/user/admin/support/tickets/${ticketId}/`, 'GET');
  },

  // Get assignable support administrators
  getSupportAdmins: async () => {
    const response = await apiRequest('/user/admin/internal-admins/', 'GET');

    if (response && response.success && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map((admin) => ({
          id: admin.id,
          name: admin.name || admin.full_name || admin.email || `Admin ${admin.id}`,
          role: admin.role,
        })),
      };
    }

    return response;
  },

  // Assign support ticket
  assignSupportTicket: async (ticketId, assigneeId) => {
    return await apiRequest(`/user/admin/support/tickets/${ticketId}/assign/`, 'POST', {
      assignee_id: assigneeId,
    });
  },

  // Update support ticket (reply / status update)
  updateSupportTicket: async (ticketId, ticketData = {}) => {
    if (ticketData instanceof FormData) {
      return await apiRequest(`/user/admin/support/tickets/${ticketId}/`, 'POST', ticketData);
    }

    const formData = new FormData();

    if (ticketData.message) {
      formData.append('message', ticketData.message);
    }
    if (ticketData.status) {
      formData.append('status', ticketData.status);
    }
    if (ticketData.priority) {
      formData.append('priority', ticketData.priority);
    }
    if (ticketData.attachment) {
      formData.append('attachment', ticketData.attachment);
    }

    return await apiRequest(`/user/admin/support/tickets/${ticketId}/`, 'POST', formData);
  },

  // Close support ticket
  closeSupportTicket: async (ticketId) => {
    return await apiRequest(`/user/admin/support/tickets/${ticketId}/close/`, 'POST');
  },

  // Get support center overview/analytics
  getSupportOverview: async () => {
    return await apiRequest('/user/admin/support/overview/', 'GET');
  },

  // Resources API functions
  // Get resources with pagination and filters
  getResources: async (page = 1, pageSize = 30, type = '', search = '', isActive = true) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      is_active: isActive.toString(),
    });

    if (type) params.append('type', type);
    if (search) params.append('search', search);

    return await apiRequest(`/user/admin/resources/?${params}`, 'GET');
  },

  // Create new resource (supports both FormData for file uploads and JSON for video_url)
  createResource: async (resourceData) => {
    try {
      const token = getAccessToken();

      // If resourceData is FormData, handle file upload differently
      if (resourceData instanceof FormData) {
        const config = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type for FormData - let browser set it with boundary
          },
          body: resourceData
        };

        console.log('Create Resource API Request URL:', `${API_BASE_URL}/user/admin/resources/`);
        console.log('Create Resource API Request Config:', config);

        let response = await fetchWithCors(`${API_BASE_URL}/user/admin/resources/`, config);

        // Handle 401 Unauthorized - try to refresh token
        if (response.status === 401) {
          console.log('Received 401, attempting to refresh token...');

          try {
            await refreshAccessToken();

            // Retry the original request with new token
            config.headers = {
              'Authorization': `Bearer ${getAccessToken()}`,
            };
            response = await fetchWithCors(`${API_BASE_URL}/user/admin/resources/`, config);

            if (response.status === 401) {
              // Refresh failed, redirect to login
              console.log('Token refresh failed, clearing user data and redirecting to login');
              clearUserData();
              window.location.href = getLoginUrl();
              throw new Error('Session expired. Please login again.');
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            clearUserData();
            window.location.href = getLoginUrl();
            throw new Error('Session expired. Please login again.');
          }
        }

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            console.error('Create Resource API Error Response:', errorData);

            if (errorData.errors) {
              console.error('Create Resource Field Validation Errors:', errorData.errors);
              const fieldErrors = Object.entries(errorData.errors)
                .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                .join('; ');
              errorMessage = `${errorData.message || 'Validation failed'}. ${fieldErrors}`;
            } else {
              errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
            }
          } catch (parseError) {
            console.error('Error parsing Create Resource response:', parseError);
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        return result;
      } else {
        // Regular JSON request (for video_url)
        return await apiRequest('/user/admin/resources/', 'POST', resourceData);
      }
    } catch (error) {
      console.error('Create Resource API Request Error:', error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      }

      throw error;
    }
  },

  // Update resource
  updateResource: async (resourceId, resourceData) => {
    return await apiRequest(`/user/admin/resources/${resourceId}/`, 'PATCH', resourceData);
  },

  // Delete resource
  deleteResource: async (resourceId) => {
    return await apiRequest(`/user/admin/resources/${resourceId}/`, 'DELETE');
  },

  // Role Management API functions
  // Get all roles
  getRoles: async (page = 1, pageSize = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    return await apiRequest(`/user/superadmin/roles/?${params}`, 'GET');
  },

  // Create new role
  createRole: async (roleData) => {
    return await apiRequest('/user/superadmin/roles/', 'POST', roleData);
  },

  // Update role
  updateRole: async (roleId, roleData) => {
    return await apiRequest(`/user/superadmin/roles/${roleId}/`, 'PATCH', roleData);
  },

  // Delete role
  deleteRole: async (roleId) => {
    return await apiRequest(`/user/superadmin/roles/${roleId}/`, 'DELETE');
  },

  // Assign role to user
  assignRoleToUser: async (userId, roleId) => {
    return await apiRequest(`/user/superadmin/users/${userId}/assign-role/`, 'POST', { role_id: roleId });
  },

  // Blocked Accounts API functions
  // Get blocked accounts
  getBlockedAccounts: async ({ search = '', page = 1, pageSize = 20 } = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    return await apiRequest(`/user/superadmin/blocked-accounts/?${params}`, 'GET');
  },

  // Unblock account
  unblockAccount: async (userId) => {
    return await apiRequest(`/user/superadmin/blocked-accounts/${userId}/unblock/`, 'POST');
  },

  // Audit Logs API functions
  // Get audit logs
  getAuditLogs: async ({ page = 1, pageSize = 20, level = '', service = '', userId = '', startDate = '', endDate = '' } = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (level && level !== 'All Levels') params.append('level', level.toLowerCase());
    if (service) params.append('service', service);
    if (userId) params.append('user_id', userId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return await apiRequest(`/user/superadmin/audit-logs/?${params}`, 'GET');
  },

  // Export audit logs
  exportAuditLogs: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const query = params.toString();
    return await apiRequest(`/user/superadmin/audit-logs/export/${query ? `?${query}` : ''}`, 'GET');
  },

  // API Keys Management API functions
  // Get all API keys with optional filters
  getAPIKeys: async ({ service = '', status = '', search = '', currentOnly = false } = {}) => {
    const params = new URLSearchParams();
    if (service) params.append('service', service);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (currentOnly) params.append('current_only', 'true');

    const query = params.toString();
    return await apiRequest(`/user/admin/system/api-keys/${query ? `?${query}` : ''}`, 'GET');
  },

  // Get API key by ID
  getAPIKeyById: async (keyId) => {
    return await apiRequest(`/user/admin/system/api-keys/${keyId}/`, 'GET');
  },

  // Reveal full API key (unmasked)
  revealAPIKey: async (keyId) => {
    return await apiRequest(`/user/admin/system/api-keys/${keyId}/reveal/`, 'GET');
  },

  // Create new API key
  createAPIKey: async (apiKeyData) => {
    return await apiRequest('/user/admin/system/api-keys/', 'POST', apiKeyData);
  },

  // Update API key (PATCH - partial update)
  updateAPIKey: async (keyId, apiKeyData) => {
    return await apiRequest(`/user/admin/system/api-keys/${keyId}/`, 'PATCH', apiKeyData);
  },

  // Update API key (PUT - full update)
  updateAPIKeyFull: async (keyId, apiKeyData) => {
    return await apiRequest(`/user/admin/system/api-keys/${keyId}/`, 'PUT', apiKeyData);
  },

  // Delete API key
  deleteAPIKey: async (keyId) => {
    return await apiRequest(`/user/admin/system/api-keys/${keyId}/`, 'DELETE');
  },

  // IP Restrictions API functions
  // Get all IP restrictions with optional filters
  getIPRestrictions: async ({ restrictionType = '', firmId = '', isActive = '' } = {}) => {
    const params = new URLSearchParams();
    if (restrictionType) params.append('restriction_type', restrictionType);
    if (firmId) params.append('firm_id', firmId);
    if (isActive !== '') params.append('is_active', isActive.toString());

    const query = params.toString();
    return await apiRequest(`/user/admin/ip-restrictions/${query ? `?${query}` : ''}`, 'GET');
  },

  // Get IP restriction by ID
  getIPRestrictionById: async (restrictionId) => {
    return await apiRequest(`/user/admin/ip-restrictions/${restrictionId}/`, 'GET');
  },

  // Create IP restriction
  createIPRestriction: async (restrictionData) => {
    return await apiRequest('/user/admin/ip-restrictions/', 'POST', restrictionData);
  },

  // Update IP restriction
  updateIPRestriction: async (restrictionId, restrictionData) => {
    return await apiRequest(`/user/admin/ip-restrictions/${restrictionId}/`, 'PUT', restrictionData);
  },

  // Delete IP restriction
  deleteIPRestriction: async (restrictionId) => {
    return await apiRequest(`/user/admin/ip-restrictions/${restrictionId}/`, 'DELETE');
  },

  // Retention Rules API functions
  // Get retention rule (tenant-level or firm-level)
  getRetentionRule: async (firmId = null) => {
    const params = new URLSearchParams();
    if (firmId) params.append('firm_id', firmId);

    const query = params.toString();
    return await apiRequest(`/user/admin/retention-rules/${query ? `?${query}` : ''}`, 'GET');
  },

  // Create or update retention rule
  createOrUpdateRetentionRule: async (retentionData) => {
    return await apiRequest('/user/admin/retention-rules/', 'POST', retentionData);
  },

  // Update retention rule (PUT method)
  updateRetentionRule: async (retentionData) => {
    return await apiRequest('/user/admin/retention-rules/', 'PUT', retentionData);
  },

  // Platform Analytics & Reporting API functions
  // Get platform analytics and reporting data
  // Optional params: month, year
  getPlatformAnalytics: async (params = {}) => {
    const { month, year } = params;
    const queryParams = new URLSearchParams();

    if (month !== undefined && year !== undefined) {
      queryParams.append('month', month.toString());
      queryParams.append('year', year.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/user/admin/platform-analytics/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Platform Reporting API functions
  // Generate report async (returns task_id)
  generateReport: async (reportData) => {
    return await apiRequest('/user/admin/reports/generate/', 'POST', reportData);
  },

  // Check report generation status
  getReportStatus: async (taskId) => {
    return await apiRequest(`/user/admin/reports/status/${taskId}/`, 'GET');
  },

  // Get report configuration options
  getReportOptions: async () => {
    return await apiRequest('/user/admin/reports/options/', 'GET');
  },

  // Schedule recurring report
  scheduleReport: async (scheduleData) => {
    return await apiRequest('/user/admin/reports/schedule/', 'POST', scheduleData);
  },

  // List all scheduled reports
  getScheduledReports: async () => {
    return await apiRequest('/user/admin/reports/scheduled/', 'GET');
  },

  // Get scheduled report details by ID
  getScheduledReportById: async (scheduleId) => {
    return await apiRequest(`/user/admin/reports/scheduled/${scheduleId}/`, 'GET');
  },

  // Update scheduled report
  updateScheduledReport: async (scheduleId, updateData) => {
    return await apiRequest(`/user/admin/reports/scheduled/${scheduleId}/`, 'PUT', updateData);
  },

  // Delete scheduled report
  deleteScheduledReport: async (scheduleId) => {
    return await apiRequest(`/user/admin/reports/scheduled/${scheduleId}/`, 'DELETE');
  },

  // List generated reports history
  getGeneratedReports: async () => {
    return await apiRequest('/user/admin/reports/generated/', 'GET');
  },

  // Generate platform report (returns file download)
  generatePlatformReport: async (reportData) => {
    try {
      const token = getAccessToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const config = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(reportData)
      };

      // Sanitize reportData for logging
      const sanitizeReportData = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        const sanitized = { ...obj };
        // Mask sensitive fields
        if (sanitized.key) sanitized.key = '***MASKED***';
        if (sanitized.api_key) sanitized.api_key = '***MASKED***';
        if (sanitized.apiKey) sanitized.apiKey = '***MASKED***';
        if (sanitized.password) sanitized.password = '***MASKED***';
        if (sanitized.token) sanitized.token = '***MASKED***';
        return sanitized;
      };

      console.log('Generate Platform Report API Request URL:', `${API_BASE_URL}/admin/user/reports/platform/generate/`);
      console.log('Generate Platform Report API Request Config:', config);
      console.log('Generate Platform Report API Request Data:', sanitizeReportData(reportData));

      let response = await fetchWithCors(`${API_BASE_URL}/admin/user/reports/platform/generate/`, config);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401) {
        console.log('Received 401, attempting to refresh token...');

        try {
          await refreshAccessToken();

          // Retry the original request with new token
          config.headers = {
            'Authorization': `Bearer ${getAccessToken()}`,
            'Content-Type': 'application/json',
          };
          response = await fetchWithCors(`${API_BASE_URL}/admin/user/reports/platform/generate/`, config);

          if (response.status === 401) {
            // Refresh failed, redirect to login
            console.log('Token refresh failed, clearing user data and redirecting to login');
            clearUserData();
            window.location.href = getLoginUrl();
            throw new Error('Session expired. Please login again.');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          clearUserData();
          window.location.href = getLoginUrl();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Generate Platform Report API Error Response:', errorData);
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing Generate Platform Report response:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'platform_report.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Get file blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Report generated and downloaded successfully',
        filename: filename
      };
    } catch (error) {
      console.error('Generate Platform Report API Request Error:', error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      }

      throw error;
    }
  },

  // Get all role requests (with optional status filter)
  getRoleRequests: async (status = null) => {
    try {
      let endpoint = '/user/superadmin/firm-role-requests/';
      if (status) {
        endpoint += `?status=${status}`;
      }
      return await apiRequest(endpoint, 'GET');
    } catch (error) {
      console.error('Get Role Requests API Request Error:', error);
      throw error;
    }
  },

  // Approve a role request
  approveRoleRequest: async (requestId, reviewNotes = null) => {
    try {
      const data = {};
      if (reviewNotes) {
        data.review_notes = reviewNotes;
      }
      return await apiRequest(`/user/superadmin/firm-role-requests/${requestId}/approve/`, 'POST', data);
    } catch (error) {
      console.error('Approve Role Request API Request Error:', error);
      throw error;
    }
  },

  // Reject a role request
  rejectRoleRequest: async (requestId, reviewNotes = null) => {
    try {
      const data = {};
      if (reviewNotes) {
        data.review_notes = reviewNotes;
      }
      return await apiRequest(`/user/superadmin/firm-role-requests/${requestId}/reject/`, 'POST', data);
    } catch (error) {
      console.error('Reject Role Request API Request Error:', error);
      throw error;
    }
  },

  // Security Settings API functions
  // Get security settings
  getSecuritySettings: async () => {
    return await apiRequest('/user/superadmin/security-settings/', 'GET');
  },

  // Update security settings
  updateSecuritySettings: async (settingsData) => {
    return await apiRequest('/user/superadmin/security-settings/', 'PATCH', settingsData);
  },

  // Archive Monitoring API functions
  // Get archive monitoring data
  getArchiveMonitoring: async () => {
    return await apiRequest('/user/superadmin/archive-monitoring/', 'GET');
  }
};

export default superAdminAPI;
