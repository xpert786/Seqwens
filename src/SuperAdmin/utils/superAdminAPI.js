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

    console.log('SuperAdmin API Request URL:', `${API_BASE_URL}${endpoint}`);
    console.log('SuperAdmin API Request Config:', config);
    console.log('SuperAdmin API Request Data:', data);

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
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage = `${errorData.message || 'Validation failed'}. ${fieldErrors}`;
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
  getAdminDashboard: async () => {
    return await apiRequest('/user/admin/platform-overview/', 'GET');
  },

  // Get user management data
  getUsers: async (page = 1, limit = 10, search = '', role = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append('search', search);
    if (role) params.append('role', role);

    return await apiRequest(`/seqwens/api/user/admin/users/?${params}`, 'GET');
  },

  // Get user details by ID
  getUserById: async (userId) => {
    return await apiRequest(`/seqwens/api/user/admin/users/${userId}/`, 'GET');
  },

  // Update user
  updateUser: async (userId, userData) => {
    return await apiRequest(`/seqwens/api/user/admin/users/${userId}/`, 'PATCH', userData);
  },

  // Delete user
  deleteUser: async (userId) => {
    return await apiRequest(`/seqwens/api/user/admin/users/${userId}/`, 'DELETE');
  },

  // Get subscription data
  getSubscriptions: async (page = 1, limit = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return await apiRequest(`/seqwens/api/user/admin/subscriptions/?${params}`, 'GET');
  },

  // Get superadmin subscription management data
  getSuperadminSubscriptions: async ({ search = '', status = '', plan = '' } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (plan) params.append('plan', plan);
    const query = params.toString();
    return await apiRequest(`/user/superadmin/subscriptions/${query ? `?${query}` : ''}`, 'GET');
  },

  // Update subscription notification settings
  updateSubscriptionNotifications: async (payload) => {
    return await apiRequest('/user/superadmin/subscriptions/', 'PATCH', payload);
  },

  // Get superadmin plan performance metrics
  getSuperadminPlanPerformance: async () => {
    return await apiRequest('/user/superadmin/subscriptions/plan-performance/', 'GET');
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
  getPlatformUsers: async ({ status = '', role = '', search = '', page = 1, pageSize = 10 } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

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
    return await apiRequest(`/seqwens/api/user/admin/analytics/?${params}`, 'GET');
  },

  // Get system health data
  getSystemHealth: async () => {
    return await apiRequest('/user/admin/system/health/', 'GET');
  },

  // Get activity logs
  getActivityLogs: async (page = 1, limit = 20, activityType = '', userId = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (activityType) params.append('activity_type', activityType);
    if (userId) params.append('user_id', userId);

    return await apiRequest(`/seqwens/api/user/admin/activity-logs/?${params}`, 'GET');
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
      action: 'suspend'
    };
    return await apiRequest(`/user/superadmin/firms/${firmId}/suspend/`, 'POST', suspendData);
  },

  // Reactivate firm
  reactivateFirm: async (firmId, reason) => {
    const reactivateData = {
      reason: reason,
      action: 'unsuspend'
    };
    return await apiRequest(`/user/superadmin/firms/${firmId}/suspend/`, 'POST', reactivateData);
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
  }
};

export default superAdminAPI;
