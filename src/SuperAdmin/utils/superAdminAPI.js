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
    const config = {
      method,
      headers: getHeaders(),
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
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
    return await apiRequest('/user/admin/dashboard/', 'GET');
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

  // Get analytics data
  getAnalytics: async (period = '30d') => {
    const params = new URLSearchParams({
      period: period,
    });
    
    return await apiRequest(`/seqwens/api/user/admin/analytics/?${params}`, 'GET');
  },

  // Get system health data
  getSystemHealth: async () => {
    return await apiRequest('/seqwens/api/user/admin/system-health/', 'GET');
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
  }
};

export default superAdminAPI;
