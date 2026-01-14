import { getApiBaseUrl, getFallbackApiBaseUrl, fetchWithCors } from './corsConfig';
import { getAccessToken, getRefreshToken, setTokens, isTokenExpired, clearUserData } from './userUtils';
import { getPathWithPrefix } from './urlUtils';

// API Configuration
const API_BASE_URL = getApiBaseUrl();
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYwNTkxMzQ5LCJpYXQiOjE3NjA1ODc3NDksImp0aSI6IjQ4NDlmOGNmY2MyNTQ4ZmNhZGRjZmMxYmYzMGIzODVmIiwidXNlcl9pZCI6IjMifQ.i2wpfckXFolye9W0mav1PxBQhg6tmCy31jAqeXQLHFY';

// Common headers for API requests
const getHeaders = () => {
  // Get token from appropriate storage
  const token = getAccessToken() || AUTH_TOKEN;

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Token refresh function
export const refreshAccessToken = async () => {
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

const buildSearchQuery = (search) => {
  if (!search || typeof search !== 'string') return '';
  const trimmedSearch = search.trim();
  if (!trimmedSearch) return '';
  const params = new URLSearchParams({ search: trimmedSearch });
  return `?${params.toString()}`;
};

// Public API request function (no authentication required)
const publicApiRequest = async (endpoint, method = 'GET', data = null) => {
  try {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log('Public API Request:', { method, url: fullUrl, data });
    const response = await fetchWithCors(fullUrl, config);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorData = null;
      try {
        errorData = await response.json();

        // If there are specific field errors, show them
        if (errorData.errors) {
          const fieldErrors = Object.entries(errorData.errors)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage = `${errorData.message || 'Validation failed'}. ${fieldErrors}`;
        } else {
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
      }

      // Attach original errorData to error for better error handling in components
      const error = new Error(errorMessage);
      if (errorData) {
        error.responseData = errorData;
      }
      throw error;
    }

    // Check content-type before parsing JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
    const result = await response.json();
    return result;
    } else {
      // If not JSON, read as text to see what we got
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200));
      // Try to parse as JSON anyway
      try {
        return JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Server returned non-JSON response. Expected JSON but got: ${contentType || 'unknown content type'}`);
      }
    }
  } catch (error) {
    console.error('Public API Request Error:', error);

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
    }

    throw error;
  }
};

export const taxpayerPublicAPI = {
  getFAQs: async (search = '') => {
    const query = buildSearchQuery(search);
    return await publicApiRequest(`/taxpayer/faqs/${query}`, 'GET');
  },
  getTaxResources: async (search = '') => {
    const query = buildSearchQuery(search);
    return await publicApiRequest(`/taxpayer/tax-resources/${query}`, 'GET');
  },
  getVideoTutorials: async (search = '') => {
    const query = buildSearchQuery(search);
    return await publicApiRequest(`/taxpayer/video-tutorials/${query}`, 'GET');
  },
};

// Generic API request function with CORS handling
const apiRequest = async (endpoint, method = 'GET', data = null) => {
  try {
    const headers = getHeaders();
    
    const config = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
      config.body = JSON.stringify(data);
    }

    // Sanitize data for logging to prevent API keys from appearing in console
    const sanitizeForLogging = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
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

    console.log('API Request URL:', `${API_BASE_URL}${endpoint}`);
    console.log('API Request Config:', config);
    console.log('API Request Data:', sanitizeForLogging(data));

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
          window.location.href = getPathWithPrefix('/login');
          throw new Error('Session expired. Please login again.');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearUserData();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorData = null;
      const isMembershipsEndpoint = endpoint.includes('/user/memberships/');

      try {
        // Check content-type before parsing JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
        } else {
          // If not JSON, read as text to see what we got
          const text = await response.text();
          console.error('Non-JSON error response:', text.substring(0, 200));
          // Try to parse as JSON anyway, but handle gracefully
          try {
            errorData = JSON.parse(text);
          } catch {
            // If parsing fails, create a generic error
            errorData = { message: `Server returned non-JSON response (${response.status})` };
          }
        }
        // Suppress console errors for memberships endpoint (expected to fail for some users)
        if (!isMembershipsEndpoint) {
          console.error('API Error Response:', errorData);
        }

        // If there are specific field errors, show them
        if (errorData.errors) {
          // Suppress console errors for memberships endpoint
          if (!isMembershipsEndpoint) {
            console.error('Field Validation Errors:', errorData.errors);
          }

          // Handle non_field_errors specially - show them directly without labels
          if (errorData.errors.non_field_errors) {
            const nonFieldErrors = Array.isArray(errorData.errors.non_field_errors)
              ? errorData.errors.non_field_errors
              : [errorData.errors.non_field_errors];
            errorMessage = nonFieldErrors.join('. ');
          } else {
            // Handle other field errors
            const fieldErrors = Object.entries(errorData.errors)
              .map(([field, errors]) => {
                // Skip non_field_errors as it's handled above
                if (field === 'non_field_errors') return null;
                const errorMessages = Array.isArray(errors) ? errors.join(', ') : errors;
                return `${field}: ${errorMessages}`;
              })
              .filter(Boolean) // Remove null entries
              .join('; ');

            if (fieldErrors) {
              errorMessage = `${errorData.message || 'Validation failed'}. ${fieldErrors}`;
            } else {
              errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
            }
          }
        } else {
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        }

        // Handle backend Python errors (like NameError, ImportError, etc.)
        if (errorMessage && typeof errorMessage === 'string') {
          // Check for Python NameError patterns (including wrapped error messages)
          const nameErrorMatch = errorMessage.match(/name ['"]([\w]+)['"] is not defined/i);
          if (nameErrorMatch) {
            const missingName = nameErrorMatch[1];
            errorMessage = `Backend configuration error: Missing import or definition for '${missingName}'. Please contact support.`;
            console.error(`Backend error detected: ${missingName} is not defined. This is a backend configuration issue that needs to be fixed on the server.`);
          }
          // Check for other common Python errors
          else if (errorMessage.includes("is not defined") || errorMessage.includes("NameError") || errorMessage.includes("ImportError")) {
            errorMessage = `Backend configuration error detected. Please contact support if this issue persists.`;
            console.error('Backend Python error detected:', errorMessage);
          }
        }
      } catch (parseError) {
        // Suppress console errors for memberships endpoint
        if (!isMembershipsEndpoint) {
          console.error('Error parsing response:', parseError);
        }
      }

      // Create error with full error data preserved
      const error = new Error(errorMessage);
      if (errorData) {
        error.response = { data: errorData };
        error.errors = errorData.errors;
      }
      throw error;
    }

    // Check content-type before parsing JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
    const result = await response.json();
    return result;
    } else {
      // If not JSON, read as text to see what we got
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200));
      // Try to parse as JSON anyway
      try {
        return JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Server returned non-JSON response. Expected JSON but got: ${contentType || 'unknown content type'}`);
      }
    }
  } catch (error) {
    // Suppress console errors for memberships endpoint (expected to fail for some users)
    const isMembershipsEndpoint = endpoint.includes('/user/memberships/');
    if (!isMembershipsEndpoint) {
      console.error('API Request Error:', error);
    }

    // Enhanced error handling for CORS and network issues
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
    }

    throw error;
  }
};

// User registration API functions
export const userAPI = {
  // Create user with basic info (first step)
  createUser: async (userData) => {
    const payload = {
      first_name: userData.firstName,
      middle_name: userData.middleName || '',
      last_name: userData.lastName,
      email: userData.email,
      phone_number: userData.phoneNumber,
    };


    // Try the API call and catch any errors for debugging
    try {
      const result = await apiRequest('/user/create/', 'POST', payload);
      return result;
    } catch (error) {
      console.error('createUser API Error Details:', {
        error: error.message,
        payload: payload,
        url: `${API_BASE_URL}/user/create/`
      });

      // If the first attempt fails, try alternative endpoint format
      if (error.message.includes('400') || error.message.includes('404')) {
        console.log('Trying alternative endpoint format...');
        try {
          const result = await apiRequest('/user/create', 'POST', payload);
          return result;
        } catch (secondError) {
          console.error('Second attempt also failed:', secondError.message);
          throw error; // Throw the original error
        }
      }

      throw error;
    }
  },

  // Complete user registration with password (second step)
  completeRegistration: async (userId, passwordData) => {
    const payload = {
      password: passwordData.password,
      password_confirm: passwordData.passwordConfirm,
    };

    return await apiRequest(`/user/${userId}/complete-registration/`, 'POST', payload);
  },

  // Single step registration with all data (including passwords) - public endpoint, no auth required
  registerUser: async (userData) => {
    const payload = {
      first_name: userData.firstName,
      middle_name: userData.middleName || '',
      last_name: userData.lastName,
      email: userData.email,
      phone_number: userData.phoneNumber,
      password: userData.password,
      password_confirm: userData.passwordConfirm,
    };


    return await publicApiRequest('/user/create/', 'POST', payload);
  },

  // Firm signup - creates firm admin account
  signupFirm: async (firmData) => {
    const payload = {
      first_name: firmData.first_name,
      middle_name: firmData.middle_name || '',
      last_name: firmData.last_name,
      email: firmData.email.toLowerCase().trim(),
      phone_number: firmData.phone_number || '',
      password: firmData.password,
      password_confirm: firmData.password_confirm,
    };

    return await publicApiRequest('/user/create/', 'POST', payload);
  },

  // User login (no auth header needed)
  login: async (credentials) => {
    const payload = {
      email: credentials.email,
      password: credentials.password,
    };

    // For login, we don't need the Authorization header
    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    };

    console.log('Login Request URL:', `${API_BASE_URL}/user/login/`);
    console.log('Login Request Payload:', payload);
    console.log('Login Request Config:', config);
    console.log('Login Request Body:', JSON.stringify(payload));
    console.log('Expected curl equivalent:', `curl --location '${API_BASE_URL}/user/login/' --header 'Content-Type: application/json' --data-raw '${JSON.stringify(payload)}'`);

    try {
      // Try with proxy first
      const response = await fetchWithCors(`${API_BASE_URL}/user/login/`, config);

      console.log('Login Response Status:', response.status);
      console.log('Login Response Headers:', Object.fromEntries(response.headers.entries()));
      console.log('Login Response URL:', response.url);

      // If we get a 500 error, let's see what the actual error is
      if (response.status === 500) {
        console.log('Server returned 500 error. This might be a backend issue.');
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        // Try to get more details about the error
        try {
          const errorData = await response.json();
          console.error('500 Error Details:', errorData);
        } catch (parseError) {
          console.error('Could not parse 500 error response:', parseError);
        }
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          // Clone the response to read it multiple times
          const responseClone = response.clone();
          const errorData = await response.json();
          const rawResponse = await responseClone.text();
          console.error('Login Error Response:', errorData);
          console.error('Login Error Response Raw:', rawResponse);

          if (errorData.errors) {
            console.error('Login Field Validation Errors:', errorData.errors);
            const fieldErrors = Object.entries(errorData.errors)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            errorMessage = `${errorData.message || 'Login failed'}. ${fieldErrors}`;
          } else {
            errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing login response:', parseError);
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Login request failed:', error);
      throw error;
    }
  },

  // Two-Factor Authentication - Setup (Get QR code and secret)
  setup2FA: async () => {
    return await apiRequest('/user/two-factor/setup/', 'GET');
  },

  // Two-Factor Authentication - Verify Setup
  verify2FASetup: async (code, secret) => {
    const payload = {
      code: code,
      secret: secret,
    };
    return await apiRequest('/user/two-factor/verify-setup/', 'POST', payload);
  },

  // Two-Factor Authentication - Disable
  disable2FA: async (password) => {
    const payload = {
      password: password,
    };
    return await apiRequest('/user/two-factor/disable/', 'POST', payload);
  },

  // Two-Factor Authentication - Verify during login
  verify2FALogin: async (email, code) => {
    const payload = {
      email: email,
      code: code,
    };
    return await publicApiRequest('/user/two-factor/verify-login/', 'POST', payload);
  },

  // User logout
  logout: async () => {
    return await apiRequest('/user/logout/', 'POST');
  },

  // Forgot password - send OTP (public endpoint, no auth required)
  forgotPassword: async (email) => {
    const payload = {
      email: email,
    };

    return await publicApiRequest('/user/forgot-password/', 'POST', payload);
  },

  // Verify OTP and reset password (public endpoint, no auth required)
  verifyOtpAndResetPassword: async (email, otp, password, confirmPassword) => {
    const payload = {
      email: email,
      otp: otp,
      password: password,
      confirm_password: confirmPassword,
    };

    return await publicApiRequest('/user/verify-otp/', 'POST', payload);
  },

  // Send email verification OTP
  sendEmailVerificationOtp: async (email) => {
    console.log('API: Sending email verification OTP request for email:', email);
    const payload = email ? { email: email } : {};
    const response = await apiRequest('/user/verify-email/', 'POST', payload);
    console.log('API: Email verification OTP response:', response);
    return response;
  },

  // Verify email with OTP
  verifyEmailOtp: async (otp) => {
    const payload = {
      otp: otp,
    };

    return await apiRequest('/user/verify-email-otp/', 'POST', payload);
  },

  // Get user memberships (all firms user belongs to)
  // This endpoint may not be available for all users, so errors are handled silently
  getMemberships: async () => {
    try {
      return await apiRequest('/user/memberships/', 'GET');
    } catch (error) {
      // Check if this is an expected error (400, 401, 403, or user identity not found)
      const errorMessage = error?.message || '';
      const isExpectedError =
        errorMessage.includes('400') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('User identity not found') ||
        errorMessage.includes('Bad Request');

      // For expected errors, return empty result without logging
      if (isExpectedError) {
        return { success: false, data: [] };
      }

      // For unexpected errors, still return empty but re-throw to be handled by caller
      return { success: false, data: [] };
    }
  },

  // Switch firm context
  switchFirm: async (firmId) => {
    const payload = {
      firm_id: firmId,
    };
    return await apiRequest('/user/switch-firm/', 'POST', payload);
  }
};

// Role Management API functions (Linked Users System)
export const roleAPI = {
  // Add role (creates linked user or submits role request)
  addRole: async (role, firmName = null, message = null) => {
    const payload = {};

    // Check if it's a custom role (format: custom_role_{id})
    if (role && role.toString().startsWith('custom_role_')) {
      // Extract the custom role ID
      const customRoleId = role.toString().replace('custom_role_', '');
      payload.custom_role_id = parseInt(customRoleId) || customRoleId;
    } else {
      // Standard role
      payload.role = role;
    }

    if (firmName) {
      payload.firm_name = firmName;
    }
    if (message) {
      payload.message = message;
    }
    return await apiRequest('/user/roles/add/', 'POST', payload);
  },

  // Remove role (deletes linked user)
  removeRole: async (role) => {
    const payload = { role: role };
    return await apiRequest('/user/roles/remove/', 'DELETE', payload);
  },

  // Get user's current roles (primary + linked users)
  getRoles: async () => {
    return await apiRequest('/user/roles/', 'GET');
  },

  // Get all linked users
  getLinkedUsers: async () => {
    return await apiRequest('/user/linked-users/', 'GET');
  },

  // Switch active role
  switchRole: async (role) => {
    const payload = { role: role };
    return await apiRequest('/user/switch-role/', 'POST', payload);
  },

  // Get user for specific role
  getUserForRole: async (role) => {
    return await apiRequest(`/user/roles/${role}/`, 'GET');
  },

  // Check if user has role
  hasRole: async (role) => {
    return await apiRequest(`/user/has-role/?role=${role}`, 'GET');
  },

  // Get users by role (admin/super admin only)
  getUsersByRole: async (role, primaryUserId = null) => {
    let endpoint = `/user/users-by-role/?role=${role}`;
    if (primaryUserId) {
      endpoint += `&primary_user_id=${primaryUserId}`;
    }
    return await apiRequest(endpoint, 'GET');
  },

  // Get available roles that user can request (GET only - this endpoint is read-only)
  getAvailableRoles: async () => {
    return await apiRequest('/user/available-roles/', 'GET');
  },

  // Get user's role requests
  getRoleRequests: async () => {
    return await apiRequest('/user/role-requests/', 'GET');
  },

  // Get pending role requests
  getPendingRoleRequests: async () => {
    return await apiRequest('/user/role-requests/pending/', 'GET');
  },

  // Get all roles (user_roles, firm_roles, and all_roles)
  getAllRoles: async () => {
    return await apiRequest('/user/roles/all/', 'GET');
  }
};

// Form validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone) => {
  // More lenient phone validation - just check if it has at least 10 digits
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10;
};

// Firm signup phone validation - stricter format validation
export const validateFirmPhoneNumber = (phone) => {
  if (!phone || phone.trim() === '') {
    return { isValid: true, error: null }; // Optional field
  }

  const trimmedPhone = phone.trim();

  // Format 1: International format with + prefix (7-17 digits after +)
  const internationalFormat = /^\+\d{7,17}$/;
  if (internationalFormat.test(trimmedPhone)) {
    return { isValid: true, error: null };
  }

  // Format 2: National format without + (10-15 digits)
  const nationalFormat = /^\d{10,15}$/;
  if (nationalFormat.test(trimmedPhone)) {
    return { isValid: true, error: null };
  }

  return {
    isValid: false,
    error: "Phone number must be either: (1) International format starting with '+' followed by 7-17 digits (e.g., +1234567890), or (2) 10-15 digits without '+' (e.g., 987654123411)"
  };
};

export const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUpperLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid: minLength && hasNumber && hasUpperLower && hasSpecialChar,
    minLength,
    hasNumber,
    hasUpperLower,
    hasSpecialChar
  };
};

// Error handling utilities
export const handleAPIError = (error) => {
  // Handle CORS errors
  if (error.message.includes('CORS')) {
    return 'Network error: Please check your internet connection and try again.';
  }

  // Handle authentication errors
  if (error.message.includes('401')) {
    return 'Authentication failed. Please try again.';
  }

  // Handle bad request errors
  if (error.message.includes('400')) {
    return 'Invalid data provided. Please check your information and try again.';
  }

  // Handle server errors
  if (error.message.includes('500')) {
    return 'Server error. Please try again later.';
  }

  // Parse error message - handle array format
  let errorMessage = error.message || 'An unexpected error occurred. Please try again.';

  // Try to parse array format error messages (e.g., ["Error message"])
  try {
    // Check if error message is a string that looks like an array
    if (typeof errorMessage === 'string' && errorMessage.trim().startsWith('[')) {
      const parsed = JSON.parse(errorMessage);
      if (Array.isArray(parsed) && parsed.length > 0) {
        errorMessage = parsed[0];
      }
    }
  } catch (e) {
    // If parsing fails, use the original message
    console.log('Could not parse error message as JSON:', errorMessage);
  }

  // Extract clean error messages from ErrorDetail structures
  // Handle formats like: "An error occurred: {'has_spouse': ErrorDetail(string='Spouse details not found for taxpayer.', code='invalid')}"
  if (typeof errorMessage === 'string' && errorMessage.includes('ErrorDetail')) {
    try {
      // Extract string values from ErrorDetail objects
      // Match pattern: ErrorDetail(string='message', code='...')
      const errorDetailMatches = errorMessage.match(/ErrorDetail\(string=['"]([^'"]+)['"]/g);
      if (errorDetailMatches && errorDetailMatches.length > 0) {
        // Extract all error messages
        const errorMessages = errorDetailMatches.map(match => {
          const stringMatch = match.match(/string=['"]([^'"]+)['"]/);
          return stringMatch ? stringMatch[1] : null;
        }).filter(Boolean);

        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('. ');
        }
      }
    } catch (parseError) {
      // If parsing fails, try to extract a simpler version
      console.log('Could not parse ErrorDetail structure:', errorMessage);
    }
  }

  // Also handle error.response.data structure (from API responses)
  if (error.response?.data) {
    const errorData = error.response.data;

    // Check if message contains ErrorDetail structure
    if (errorData.message && typeof errorData.message === 'string' && errorData.message.includes('ErrorDetail')) {
      try {
        const errorDetailMatches = errorData.message.match(/ErrorDetail\(string=['"]([^'"]+)['"]/g);
        if (errorDetailMatches && errorDetailMatches.length > 0) {
          const errorMessages = errorDetailMatches.map(match => {
            const stringMatch = match.match(/string=['"]([^'"]+)['"]/);
            return stringMatch ? stringMatch[1] : null;
          }).filter(Boolean);

          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('. ');
          }
        }
      } catch (parseError) {
        console.log('Could not parse ErrorDetail from response data:', errorData.message);
      }
    }

    // Handle errors object with ErrorDetail structures
    if (errorData.errors && typeof errorData.errors === 'object') {
      try {
        const cleanErrors = [];
        Object.entries(errorData.errors).forEach(([field, errorValue]) => {
          if (typeof errorValue === 'string' && errorValue.includes('ErrorDetail')) {
            const stringMatch = errorValue.match(/ErrorDetail\(string=['"]([^'"]+)['"]/);
            if (stringMatch) {
              cleanErrors.push(stringMatch[1]);
            } else {
              cleanErrors.push(errorValue);
            }
          } else if (Array.isArray(errorValue)) {
            errorValue.forEach(err => {
              if (typeof err === 'string' && err.includes('ErrorDetail')) {
                const stringMatch = err.match(/ErrorDetail\(string=['"]([^'"]+)['"]/);
                if (stringMatch) {
                  cleanErrors.push(stringMatch[1]);
                } else {
                  cleanErrors.push(err);
                }
              } else if (typeof err === 'string') {
                cleanErrors.push(err);
              }
            });
          } else if (typeof errorValue === 'string') {
            cleanErrors.push(errorValue);
          }
        });

        if (cleanErrors.length > 0) {
          errorMessage = cleanErrors.join('. ');
        }
      } catch (parseError) {
        console.log('Could not parse errors object:', errorData.errors);
      }
    }
  }

  // Handle email template errors with user-friendly messages
  const lowerErrorMessage = errorMessage.toLowerCase();
  if (lowerErrorMessage.includes('no active template') ||
    lowerErrorMessage.includes('email template') && lowerErrorMessage.includes('configure') ||
    lowerErrorMessage.includes('template') && lowerErrorMessage.includes('settings')) {

    // Extract email type if possible
    const emailTypeMatch = errorMessage.match(/email type ['"]([^'"]+)['"]/i);
    const emailType = emailTypeMatch ? emailTypeMatch[1] : '';

    // Create user-friendly message based on email type
    let friendlyMessage = 'Email template not configured. ';
    if (emailType === 'staff_invite') {
      friendlyMessage += 'Please configure the Staff Invitation email template in Settings → Email Templates before sending invitations.';
    } else if (emailType) {
      const formattedEmailType = emailType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      friendlyMessage += `Please configure the ${formattedEmailType} email template in Settings → Email Templates.`;
    } else {
      friendlyMessage += 'Please configure the required email template in Settings → Email Templates before sending invitations.';
    }

    return friendlyMessage;
  }

  // Remove "Login failed. email: " prefix from error messages if present
  errorMessage = errorMessage.replace(/^Login failed\.?\s*email:\s*/i, '');

  return errorMessage || 'An unexpected error occurred. Please try again.';
};

// Firm Admin Analytics API functions
export const firmAdminAnalyticsAPI = {
  // Get revenue by client segment for the firm admin
  getRevenueSegments: async (days = 365) => {
    const params = new URLSearchParams();
    if (days) {
      params.append('days', days.toString());
    }
    const queryString = params.toString();
    const endpoint = `/user/firm-admin/reports/revenue-segments/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Get analytics & reports data (Overview Dashboard)
  getAnalyticsReports: async (period = '6m') => {
    const params = new URLSearchParams();
    if (period) {
      params.append('period', period);
    }
    const queryString = params.toString();
    const endpoint = `/user/firm-admin/analytics/reports/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Get revenue analytics data (Revenue Analysis Dashboard)
  getRevenueAnalytics: async (period = '6m', taxYear = null, officeId = 'all') => {
    const params = new URLSearchParams();
    if (period) {
      params.append('period', period);
    }
    if (taxYear) {
      params.append('tax_year', taxYear.toString());
    }
    if (officeId && officeId !== 'all') {
      params.append('office_id', officeId.toString());
    }
    const queryString = params.toString();
    const endpoint = `/user/firm-admin/analytics/revenue/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Get client analytics data (Client Analytics Dashboard)
  getClientAnalytics: async (period = '6m') => {
    const params = new URLSearchParams();
    if (period) {
      params.append('period', period);
    }
    const queryString = params.toString();
    const endpoint = `/user/firm-admin/analytics/client/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Get service performance analytics data (Service Performance Dashboard)
  getServicePerformance: async (period = '6m', taxYear = null, officeId = 'all') => {
    const params = new URLSearchParams();
    if (period) {
      params.append('period', period);
    }
    if (taxYear) {
      params.append('tax_year', taxYear.toString());
    }
    if (officeId && officeId !== 'all') {
      params.append('office_id', officeId.toString());
    }
    const queryString = params.toString();
    const endpoint = `/user/firm-admin/analytics/service-performance/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Get compliance reporting analytics data (Compliance Reporting Dashboard)
  getComplianceReporting: async (period = '6m', taxYear = null) => {
    const params = new URLSearchParams();
    if (period) {
      params.append('period', period);
    }
    if (taxYear) {
      params.append('tax_year', taxYear.toString());
    }
    const queryString = params.toString();
    const endpoint = `/user/firm-admin/analytics/compliance-reporting/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },
};

// Data Intake API functions
export const dataIntakeAPI = {
  // Get signature status for data entry form
  getSignatureStatus: async () => {
    return await apiRequest('/taxpayer/data-entry-form/signature-status/', 'GET');
  },

  // Submit signature for data entry form
  submitSignature: async (signatureData) => {
    const { signature_image, typed_text } = signatureData;
    const requestBody = {};

    if (typed_text) {
      requestBody.typed_text = typed_text;
    } else if (signature_image) {
      requestBody.signature_image = signature_image;
    } else {
      throw new Error('Either signature_image or typed_text is required');
    }

    return await apiRequest('/taxpayer/data-entry-form/submit-signature/', 'POST', requestBody);
  },

  // Submit data intake form
  submitDataIntake: async (formData) => {
    try {
      // For FormData, we need to handle it differently
      const token = getAccessToken() || AUTH_TOKEN;

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        body: formData
      };

      console.log('Data Intake API Request URL:', `${API_BASE_URL}/taxpayer/data-intake/`);
      console.log('Data Intake API Request Config:', config);

      const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/data-intake/`, config);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401) {
        console.log('Received 401, attempting to refresh token...');

        try {
          await refreshAccessToken();

          // Retry the original request with new token
          config.headers = {
            'Authorization': `Bearer ${getAccessToken() || AUTH_TOKEN}`,
          };
          const retryResponse = await fetchWithCors(`${API_BASE_URL}/taxpayer/data-intake/`, config);

          if (retryResponse.status === 401) {
            // Refresh failed, redirect to login
            console.log('Token refresh failed, clearing user data and redirecting to login');
            clearUserData();
            window.location.href = getPathWithPrefix('/login');
            throw new Error('Session expired. Please login again.');
          }

          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }

          return await retryResponse.json();
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          clearUserData();
          window.location.href = getPathWithPrefix('/login');
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Data Intake API Error Response:', errorData);

          if (errorData.errors) {
            console.error('Data Intake Field Validation Errors:', errorData.errors);
            const fieldErrors = Object.entries(errorData.errors)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            errorMessage = `${errorData.message || 'Validation failed'}. ${fieldErrors}`;
          } else {
            errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing data intake response:', parseError);
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Data Intake API Request Error:', error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      }

      throw error;
    }
  }
};

// Test function to debug API issues
export const testUserCreation = async () => {
  const testData = {
    firstName: 'John',
    middleName: 'William',
    lastName: 'Doe',
    email: 'test@example.com',
    phoneNumber: '+1234567890'
  };

  console.log('Testing user creation with data:', testData);

  try {
    const result = await userAPI.createUser(testData);
    console.log('Test successful:', result);
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
};

// Test function to debug login issues
export const testLogin = async () => {
  const testCredentials = {
    email: 'naman@itinfonity.com',
    password: 'Naman@1234'
  };

  console.log('Testing login with credentials:', testCredentials);

  try {
    const result = await userAPI.login(testCredentials);
    console.log('Login test successful:', result);
    return result;
  } catch (error) {
    console.error('Login test failed:', error);
    throw error;
  } b
};

// Test function to check if the backend is reachable
export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection...');
    const response = await fetchWithCors(`${API_BASE_URL}/user/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'wrongpassword'
      })
    });

    console.log('Backend connection test - Status:', response.status);
    console.log('Backend connection test - Headers:', Object.fromEntries(response.headers.entries()));

    if (response.status === 400 || response.status === 401) {
      console.log('✅ Backend is reachable (got expected error response)');
      return { success: true, message: 'Backend is reachable' };
    } else if (response.status === 500) {
      console.log('❌ Backend has internal server error');
      return { success: false, message: 'Backend has internal server error' };
    } else {
      console.log('✅ Backend is reachable (unexpected status but server responded)');
      return { success: true, message: 'Backend is reachable' };
    }
  } catch (error) {
    console.error('❌ Backend connection test failed:', error);
    return { success: false, message: error.message };
  }
};

// Test function to check if the proxy is working
export const testProxyConnection = async () => {
  try {
    console.log('Testing proxy connection...');
    console.log('Current API_BASE_URL:', API_BASE_URL);

    // Try a simple GET request first
    const response = await fetchWithCors(`${API_BASE_URL}/user/login/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Proxy test - Status:', response.status);
    console.log('Proxy test - Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Proxy test - URL:', response.url);

    return { success: true, message: `Proxy responded with status ${response.status}` };
  } catch (error) {
    console.error('❌ Proxy connection test failed:', error);
    return { success: false, message: error.message };
  }
};


export const profileAPI = {
  // Get user account information
  getUserAccount: async () => {
    return await apiRequest('/user/account/', 'GET');
  },

  // Get profile picture
  getProfilePicture: async () => {
    return await apiRequest('/user/profile-picture/', 'GET');
  },

  // Update user account information
  updateUserAccount: async (userData) => {
    return await apiRequest('/user/account/', 'PATCH', userData);
  },

  // Update profile picture
  updateProfilePicture: async (profilePictureFile) => {
    const token = getAccessToken() || AUTH_TOKEN;

    const formData = new FormData();
    formData.append('profile_picture', profilePictureFile);

    // Log file details for debugging
    console.log('Uploading profile picture:', {
      name: profilePictureFile.name,
      type: profilePictureFile.type,
      size: profilePictureFile.size,
      lastModified: profilePictureFile.lastModified
    });

    // Log FormData contents for debugging
    console.log('FormData entries:');
    for (let pair of formData.entries()) {
      console.log('  Key:', pair[0], 'Value:', pair[1]);
    }

    const config = {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - let browser set it with boundary
      },
      body: formData
    };

    console.log('Profile Picture Update URL:', `${API_BASE_URL}/user/account/`);
    console.log('Request config:', { method: config.method, headers: config.headers });

    let response = await fetchWithCors(`${API_BASE_URL}/user/account/`, config);

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401) {
      console.log('Received 401, attempting to refresh token...');

      try {
        await refreshAccessToken();

        // Retry the original request with new token
        config.headers = {
          'Authorization': `Bearer ${getAccessToken() || AUTH_TOKEN}`,
        };
        response = await fetchWithCors(`${API_BASE_URL}/user/account/`, config);

        if (response.status === 401) {
          // Refresh failed, redirect to login
          console.log('Token refresh failed, clearing user data and redirecting to login');
          clearUserData();
          window.location.href = getPathWithPrefix('/login');
          throw new Error('Session expired. Please login again.');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearUserData();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Profile Picture Update Error Response:', errorData);
        console.error('Full error data:', JSON.stringify(errorData, null, 2));

        if (errorData.profile_picture) {
          // Handle Django validation errors
          const profileErrors = Array.isArray(errorData.profile_picture)
            ? errorData.profile_picture.join(', ')
            : errorData.profile_picture;
          errorMessage = `Profile picture: ${profileErrors}`;
        } else if (errorData.errors && errorData.errors.profile_picture) {
          // Handle nested errors structure
          const errors = errorData.errors.profile_picture;
          errorMessage = `Profile picture: ${Array.isArray(errors) ? errors.join(', ') : errors}`;
        } else if (errorData.errors) {
          console.error('Profile Picture Update Field Validation Errors:', errorData.errors);
          const fieldErrors = Object.entries(errorData.errors)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage = `${errorData.message || 'Validation failed'}. ${fieldErrors}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        console.error('Error parsing profile picture update response:', parseError);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  testProfile: async () => {
    return await apiRequest('/user/profile/', 'GET');
  }
};

export const testProfile = async () => {
  try {
    const result = await profileAPI.testProfile();
    console.log('Profile test successful:', result);
    return result;
  } catch (error) {
    console.error('Profile test failed:', error);
    throw error;
  }
};

// Notification Preferences API functions
export const notificationAPI = {
  // Get notification preferences
  getNotificationPreferences: async () => {
    return await apiRequest('/user/notification-preferences/', 'GET');
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences) => {
    return await apiRequest('/user/notification-preferences/', 'PATCH', preferences);
  }
};

// Client Notifications API functions
export const clientNotificationAPI = {
  // List all notifications with optional filters
  listNotifications: async (params = {}) => {
    const { is_read, type, limit = 50, offset = 0 } = params;
    const queryParams = new URLSearchParams();

    if (is_read !== undefined) {
      queryParams.append('is_read', is_read);
    }
    if (type) {
      queryParams.append('type', type);
    }
    if (limit) {
      queryParams.append('limit', limit);
    }
    if (offset) {
      queryParams.append('offset', offset);
    }

    const queryString = queryParams.toString();
    const endpoint = `/taxpayer/notifications/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Get unread count
  getUnreadCount: async () => {
    return await apiRequest('/taxpayer/notifications/unread-count/', 'GET');
  },

  // Get notification details
  getNotificationDetails: async (notificationId) => {
    return await apiRequest(`/taxpayer/notifications/${notificationId}/`, 'GET');
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    return await apiRequest(`/taxpayer/notifications/${notificationId}/mark-read/`, 'POST');
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return await apiRequest('/taxpayer/notifications/mark-all-read/', 'POST');
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    return await apiRequest(`/user/notifications/${notificationId}/delete/`, 'DELETE');
  }
};

export const securityAPI = {
  // Get security preferences
  getSecurityPreferences: async () => {
    return await apiRequest('/user/security-settings/', 'GET');
  },

  // Update security preferences
  updateSecurityPreferences: async (preferences) => {
    return await apiRequest('/user/security-settings/', 'PATCH', preferences);
  },

  // Update password
  updatePassword: async (passwordData) => {
    return await apiRequest('/user/security-settings/', 'PATCH', passwordData);
  },

  // List active admin sessions
  getAdminSessions: async () => {
    return await apiRequest('/firm/sessions/active/', 'GET');
  },

  // Terminate a specific admin session by key
  terminateAdminSession: async (sessionKey) => {
    return await apiRequest(`/firm/sessions/${sessionKey}/terminate/`, 'POST');
  },

  // Get audit log settings
  getAuditLogSettings: async () => {
    return await apiRequest('/firm/audit-logs/settings/', 'GET');
  },

  // Update audit log settings
  updateAuditLogSettings: async (settings) => {
    return await apiRequest('/firm/audit-logs/settings/', 'PUT', settings);
  },

  // Get audit logs with filters and pagination
  getAuditLogs: async (params = {}) => {
    const { action, user_id, start_date, end_date, page = 1, page_size = 50 } = params;
    const queryParams = new URLSearchParams();

    if (action) queryParams.append('action', action);
    if (user_id) queryParams.append('user_id', user_id);
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    queryParams.append('page', page.toString());
    queryParams.append('page_size', page_size.toString());

    const queryString = queryParams.toString();
    return await apiRequest(`/firm/audit-logs/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Get security alerts with filters and pagination
  getSecurityAlerts: async (params = {}) => {
    const { alert_type, alert_category, status, user_id, start_date, end_date, page = 1, page_size = 50 } = params;
    const queryParams = new URLSearchParams();

    if (alert_type) queryParams.append('alert_type', alert_type);
    if (alert_category) queryParams.append('alert_category', alert_category);
    if (status) queryParams.append('status', status);
    if (user_id) queryParams.append('user_id', user_id);
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    queryParams.append('page', page.toString());
    queryParams.append('page_size', page_size.toString());

    const queryString = queryParams.toString();
    return await apiRequest(`/firm/security-alerts/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Get security alert detail
  getSecurityAlert: async (alertId) => {
    return await apiRequest(`/firm/security-alerts/${alertId}/`, 'GET');
  },

  // Update security alert (resolve, dismiss, block)
  updateSecurityAlert: async (alertId, updateData) => {
    return await apiRequest(`/firm/security-alerts/${alertId}/`, 'PATCH', updateData);
  }
};

// Tax Preparer Account Settings API functions
export const taxPreparerProfileAPI = {
  // Get tax preparer account information
  getTaxPreparerAccount: async () => {
    return await apiRequest('/tax-preparer/account/', 'GET');
  },

  // Get tax preparer profile picture
  getTaxPreparerProfilePicture: async () => {
    return await apiRequest('/tax-preparer/profile-picture/', 'GET');
  },

  // Update tax preparer account information
  updateTaxPreparerAccount: async (userData) => {
    return await apiRequest('/tax-preparer/account/', 'PATCH', userData);
  },

  // Update tax preparer profile picture
  updateTaxPreparerProfilePicture: async (profilePictureFile) => {
    const token = getAccessToken() || AUTH_TOKEN;

    const formData = new FormData();
    formData.append('profile_picture', profilePictureFile);

    // Log file details for debugging
    console.log('Uploading tax preparer profile picture:', {
      name: profilePictureFile.name,
      type: profilePictureFile.type,
      size: profilePictureFile.size,
      lastModified: profilePictureFile.lastModified
    });

    // Log FormData contents for debugging
    console.log('FormData entries:');
    for (let pair of formData.entries()) {
      console.log('  Key:', pair[0], 'Value:', pair[1]);
    }

    const config = {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - let browser set it with boundary
      },
      body: formData
    };

    console.log('Tax Preparer Profile Picture Update URL:', `${API_BASE_URL}/tax-preparer/account/`);
    console.log('Request config:', { method: config.method, headers: config.headers });

    let response = await fetchWithCors(`${API_BASE_URL}/tax-preparer/account/`, config);

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401) {
      console.log('Received 401, attempting to refresh token...');

      try {
        await refreshAccessToken();

        // Retry the original request with new token
        config.headers = {
          'Authorization': `Bearer ${getAccessToken() || AUTH_TOKEN}`,
        };
        response = await fetchWithCors(`${API_BASE_URL}/tax-preparer/account/`, config);

        if (response.status === 401) {
          // Refresh failed, redirect to login
          console.log('Token refresh failed, clearing user data and redirecting to login');
          clearUserData();
          window.location.href = getPathWithPrefix('/login');
          throw new Error('Session expired. Please login again.');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearUserData();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Tax Preparer Profile Picture Update Error Response:', errorData);
        console.error('Full error data:', JSON.stringify(errorData, null, 2));

        if (errorData.profile_picture) {
          // Handle Django validation errors
          const profileErrors = Array.isArray(errorData.profile_picture)
            ? errorData.profile_picture.join(', ')
            : errorData.profile_picture;
          errorMessage = `Profile picture: ${profileErrors}`;
        } else if (errorData.errors && errorData.errors.profile_picture) {
          // Handle nested errors structure
          const errors = errorData.errors.profile_picture;
          errorMessage = `Profile picture: ${Array.isArray(errors) ? errors.join(', ') : errors}`;
        } else if (errorData.errors) {
          console.error('Tax Preparer Profile Picture Update Field Validation Errors:', errorData.errors);
          const fieldErrors = Object.entries(errorData.errors)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage = `${errorData.message || 'Validation failed'}. ${fieldErrors}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        console.error('Error parsing tax preparer profile picture update response:', parseError);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }
};

// Dashboard API functions
export const dashboardAPI = {
  // Get initial dashboard data
  getInitialDashboard: async () => {
    return await apiRequest('/taxpayer/initial-dashboard/', 'GET');
  },
  // Get taxpayer dashboard data
  getDashboard: async () => {
    return await apiRequest('/taxpayer/dashboard/', 'GET');
  },
  // Get tax preparer dashboard data
  getTaxPreparerDashboard: async () => {
    return await apiRequest('/taxpayer/tax-preparer/dashboard/', 'GET');
  }
};

// Support Ticket API functions
export const supportTicketAPI = {
  // Create support ticket
  createSupportTicket: async (ticketData) => {
    return await apiRequest('/taxpayer/support-tickets/', 'POST', ticketData);
  },

  // Get support tickets
  getSupportTickets: async () => {
    return await apiRequest('/taxpayer/support-tickets/', 'GET');
  },

  // Get support ticket by ID
  getSupportTicket: async (ticketId) => {
    return await apiRequest(`/taxpayer/support-tickets/${ticketId}/`, 'GET');
  },

  // Update support ticket
  updateSupportTicket: async (ticketId, ticketData) => {
    return await apiRequest(`/taxpayer/support-tickets/${ticketId}/`, 'PATCH', ticketData);
  }
};

export const billingAPI = {
  // Get billing information
  getBillingInformation: async () => {
    return await apiRequest('/taxpayer/billing-address/', 'GET');
  },

  // Add billing information
  addBillingInformation: async (billingData) => {
    return await apiRequest('/taxpayer/billing-address/', 'POST', billingData);
  },

  // Update billing information
  updateBillingInformation: async (billingData) => {
    return await apiRequest('/taxpayer/billing-address/', 'PATCH', billingData);
  },

  // Get payment methods
  getPaymentMethods: async () => {
    return await apiRequest('/taxpayer/payment-methods/', 'GET');
  },

  // Add payment method
  addPaymentMethod: async (paymentMethodData) => {
    return await apiRequest('/taxpayer/payment-methods/', 'POST', paymentMethodData);
  },
  // Update payment method
  updatePaymentMethod: async (paymentMethodId, paymentMethodData) => {
    return await apiRequest(`/taxpayer/payment-methods/${paymentMethodId}/`, 'PATCH', paymentMethodData);
  },
  // Delete payment method
  deletePaymentMethod: async (paymentMethodId) => {
    return await apiRequest(`/taxpayer/payment-methods/${paymentMethodId}/`, 'DELETE');
  }
};

// Appointments API functions
export const appointmentsAPI = {
  // Get all appointments for the authenticated user
  getAllAppointments: async () => {
    return await apiRequest('/taxpayer/appointments/', 'GET');
  },

  // Get a specific appointment by ID
  getAppointmentById: async (appointmentId) => {
    return await apiRequest(`/taxpayer/appointments/${appointmentId}/`, 'GET');
  },

  // Create a new appointment
  createAppointment: async (appointmentData) => {
    return await apiRequest('/taxpayer/appointments/create/', 'POST', appointmentData);
  },

  // Update an existing appointment
  updateAppointment: async (appointmentId, appointmentData) => {
    return await apiRequest(`/taxpayer/appointments/${appointmentId}/`, 'PATCH', appointmentData);
  },

  // Delete/Cancel an appointment
  deleteAppointment: async (appointmentId) => {
    return await apiRequest(`/taxpayer/appointments/${appointmentId}/`, 'DELETE');
  }
};

// Admin Availability API functions
export const adminAvailabilityAPI = {
  // Get admin availability for a specific month
  getAdminAvailability: async (adminId, year, month) => {
    const params = new URLSearchParams({
      admin_id: adminId,
      year: year.toString(),
      month: month.toString()
    });
    return await apiRequest(`/taxpayer/admin-availability/?${params}`, 'GET');
  }
};

// Time Slots API functions
export const timeSlotsAPI = {
  // Get available time slots for a specific date
  getTimeSlots: async (adminId, date) => {
    const params = new URLSearchParams({
      admin_id: adminId,
      date: date
    });
    return await apiRequest(`/taxpayer/time-slots/?${params}`, 'GET');
  }
};

// Staff API functions
export const staffAPI = {
  // Get available staff members for appointments
  getAvailableStaff: async () => {
    return await apiRequest('/taxpayer/appointments/staff/', 'GET');
  },
  // Get available dates for a specific staff member
  getAvailableDates: async (staffId) => {
    return await apiRequest(`/taxpayer/appointments/staff/${staffId}/dates/`, 'GET');
  },
  // Get available time slots for a specific staff member and date
  getAvailableTimeSlots: async (staffId, date) => {
    const params = new URLSearchParams({
      date: date
    });
    return await apiRequest(`/taxpayer/appointments/staff/${staffId}/slots/?${params}`, 'GET');
  },
  // Get client folder subfolders
  getClientFolderSubfolders: async (clientId, folderId = null, folderName = null) => {
    const params = new URLSearchParams({ client_id: clientId });
    if (folderId) params.append('folder_id', folderId);
    if (folderName) params.append('folder_name', folderName);
    return await apiRequest(`/firm/staff/folders/subfolders/?${params}`, 'GET');
  },
  // Browse client folders
  browseClientFolders: async (clientId, options = {}) => {
    const params = new URLSearchParams({ client_id: clientId });
    if (options.folder_id) params.append('folder_id', options.folder_id);
    if (options.path) params.append('path', options.path);
    if (options.show_archived !== undefined) params.append('show_archived', options.show_archived);
    if (options.search) params.append('search', options.search);
    if (options.category_id) params.append('category_id', options.category_id);
    if (options.sort_by) params.append('sort_by', options.sort_by);
    return await apiRequest(`/firm/staff/folders/browse/?${params}`, 'GET');
  }
};

// Threads/Chats API functions
export const threadsAPI = {
  // Get all chat threads for the current taxpayer
  getThreads: async () => {
    return await apiRequest('/taxpayer/chat-threads/', 'GET');
  },
  // Create a new chat thread (Taxpayer)
  // Supports both text-only (JSON) and with file attachment (FormData)
  createThread: async (threadData) => {
    const token = getAccessToken() || AUTH_TOKEN;
    const hasFile = threadData.document || threadData.file;

    if (hasFile) {
      // Use FormData for file uploads
      const formData = new FormData();
      formData.append('subject', threadData.subject || '');
      formData.append('message', threadData.message || '');

      if (threadData.document) {
        formData.append('document', threadData.document);
      } else if (threadData.file) {
        formData.append('document', threadData.file);
      }

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it
        },
        body: formData
      };

      let response = await fetchWithCors(`${API_BASE_URL}/taxpayer/chat-threads/create/`, config);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401) {
        try {
          await refreshAccessToken();
          config.headers = {
            'Authorization': `Bearer ${getAccessToken() || AUTH_TOKEN}`,
          };
          response = await fetchWithCors(`${API_BASE_URL}/taxpayer/chat-threads/create/`, config);

          if (response.status === 401) {
            clearUserData();
            window.location.href = getPathWithPrefix('/login');
            throw new Error('Session expired. Please login again.');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          clearUserData();
          window.location.href = getPathWithPrefix('/login');
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } else {
      // Use JSON for text-only messages
      return await apiRequest('/taxpayer/chat-threads/create/', 'POST', {
        subject: threadData.subject,
        message: threadData.message
      });
    }
  },
  // Get thread details with messages
  getThreadDetails: async (threadId) => {
    return await apiRequest(`/taxpayer/chat-threads/${threadId}/`, 'GET');
  },
  // Delete a chat thread
  deleteThread: async (threadId) => {
    return await apiRequest(`/taxpayer/chat-threads/${threadId}/`, 'DELETE');
  },
  // Send message in thread
  // Supports both text-only (JSON) and with file attachment (FormData)
  sendMessage: async (threadId, messageData) => {
    const token = getAccessToken() || AUTH_TOKEN;
    const hasAttachment = messageData.attachment || messageData.file;

    let config;
    let response;

    if (hasAttachment) {
      // Use FormData for file attachments
      const formData = new FormData();

      if (messageData.content) {
        formData.append('content', messageData.content);
      }

      if (messageData.message_type) {
        formData.append('message_type', messageData.message_type);
      }

      if (messageData.is_internal !== undefined) {
        // Convert boolean to capitalized string for Django FormData boolean fields
        // Django expects "True" or "False" (capitalized) for boolean form fields
        const isInternalValue = messageData.is_internal === true || messageData.is_internal === 'true' || messageData.is_internal === 'True';
        formData.append('is_internal', isInternalValue ? 'True' : 'False');
      }

      if (messageData.attachment) {
        formData.append('attachment', messageData.attachment);
      } else if (messageData.file) {
        formData.append('attachment', messageData.file);
      }

      config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it
        },
        body: formData
      };
    } else {
      // Use JSON for text-only messages
      config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageData.content || '',
          message_type: messageData.message_type || 'text',
          is_internal: messageData.is_internal === true || messageData.is_internal === 'true' || messageData.is_internal === 'True'
        })
      };
    }

    response = await fetchWithCors(`${API_BASE_URL}/taxpayer/chat-threads/${threadId}/send_message/`, config);

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401) {
      try {
        await refreshAccessToken();
        const newToken = getAccessToken() || AUTH_TOKEN;

        if (hasAttachment) {
          config.headers = {
            'Authorization': `Bearer ${newToken}`,
          };
        } else {
          config.headers = {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json',
          };
        }

        response = await fetchWithCors(`${API_BASE_URL}/taxpayer/chat-threads/${threadId}/send_message/`, config);

        if (response.status === 401) {
          clearUserData();
          window.location.href = getPathWithPrefix('/login');
          throw new Error('Session expired. Please login again.');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearUserData();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },
  // Download message attachment
  // GET /api/chat-threads/<thread_id>/messages/<message_id>/download/
  downloadMessageAttachment: async (threadId, messageId) => {
    const token = getAccessToken() || AUTH_TOKEN;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetchWithCors(`${API_BASE_URL}/chat-threads/${threadId}/messages/${messageId}/download/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `Failed to download attachment: ${response.status}`);
    }

    // Get the blob data
    const blob = await response.blob();

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'attachment';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  },
  // Get WebSocket configuration
  getWebSocketConfig: async () => {
    return await apiRequest('/taxpayer/threads/websocket-config/', 'GET');
  },
  // Close thread (staff only)
  // Note: This endpoint is typically used by tax preparers/staff
  closeThread: async (threadId) => {
    return await apiRequest(`/taxpayer/threads/${threadId}/close/`, 'POST');
  },
  // Mark messages as read
  // Supports both old format (message_ids array) and new format (single message_id or all)
  markAsRead: async (threadId, messageIds) => {
    // If messageIds is an array, mark all messages (or use first one if single item)
    // If messageIds is a single number, mark that specific message
    // If messageIds is null/undefined, mark all messages
    const requestBody = messageIds
      ? (Array.isArray(messageIds)
        ? (messageIds.length === 1 ? { message_id: messageIds[0] } : {})
        : { message_id: messageIds })
      : {};

    // Use new chat-threads endpoint
    return await apiRequest(`/taxpayer/chat-threads/${threadId}/mark-read/`, 'POST', requestBody);
  },
  // Archive thread
  archiveThread: async (threadId) => {
    return await apiRequest(`/taxpayer/threads/${threadId}/archive/`, 'POST');
  },
  // Unarchive thread
  unarchiveThread: async (threadId) => {
    return await apiRequest(`/taxpayer/threads/${threadId}/unarchive/`, 'POST');
  },
  // Delete message
  deleteMessage: async (threadId, messageId) => {
    return await apiRequest(`/taxpayer/threads/${threadId}/messages/${messageId}/delete/`, 'DELETE');
  },
  // Edit message
  editMessage: async (threadId, messageId, content) => {
    return await apiRequest(`/taxpayer/threads/${threadId}/messages/${messageId}/edit/`, 'PATCH', { content });
  }
};

// Tax Preparer Settings API functions
export const taxPreparerSettingsAPI = {
  // Get tax preparer settings
  getSettings: async () => {
    return await apiRequest('/taxpayer/tax-preparer/settings/', 'GET');
  },

  // Update tax preparer settings
  updateSettings: async (settingsData) => {
    return await apiRequest('/taxpayer/tax-preparer/settings/', 'PATCH', settingsData);
  },

  // Update profile picture
  updateProfilePicture: async (profilePictureFile) => {
    const token = getAccessToken() || AUTH_TOKEN;

    const formData = new FormData();
    formData.append('profile_picture', profilePictureFile);

    const config = {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - let browser set it with boundary
      },
      body: formData
    };

    const API_BASE_URL = getApiBaseUrl();
    const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/tax-preparer/settings/`, config);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.detail || 'Failed to update profile picture');
    }

    return result;
  }
};

// Tax Preparer Notification Preferences API functions
export const taxPreparerNotificationAPI = {
  // Get notification preferences
  getNotificationPreferences: async () => {
    return await apiRequest('/user/notification-preferences/', 'GET');
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences) => {
    return await apiRequest('/user/notification-preferences/', 'PATCH', preferences);
  },

  // List all notifications with optional filters
  listNotifications: async (params = {}) => {
    const { is_read, type, limit = 50, offset = 0 } = params;
    const queryParams = new URLSearchParams();

    if (is_read !== undefined) {
      queryParams.append('is_read', is_read);
    }
    if (type) {
      queryParams.append('type', type);
    }
    if (limit) {
      queryParams.append('limit', limit);
    }
    if (offset) {
      queryParams.append('offset', offset);
    }

    const queryString = queryParams.toString();
    const endpoint = `/taxpayer/notifications/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Get unread count
  getUnreadCount: async () => {
    return await apiRequest('/taxpayer/notifications/unread-count/', 'GET');
  },

  // Get notification details
  getNotificationDetails: async (notificationId) => {
    return await apiRequest(`/taxpayer/notifications/${notificationId}/`, 'GET');
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    return await apiRequest(`/taxpayer/notifications/${notificationId}/mark-read/`, 'POST');
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return await apiRequest('/taxpayer/notifications/mark-all-read/', 'POST');
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    return await apiRequest(`/user/notifications/${notificationId}/delete/`, 'DELETE');
  }
};

// Firm Admin Dashboard API functions
export const firmAdminDashboardAPI = {
  // Get firm dashboard data
  // Returns dashboard data including system alerts, key metrics, revenue analytics, 
  // client engagement, staff performance, compliance, subscription, and clients overview
  getDashboard: async (params = {}) => {
    const { date_range = '30d', period = 'monthly', recent_clients_limit = 10 } = params;
    const queryParams = new URLSearchParams();

    if (date_range) queryParams.append('date_range', date_range);
    if (period) queryParams.append('period', period);
    if (recent_clients_limit) queryParams.append('recent_clients_limit', recent_clients_limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/user/firm-admin/dashboard/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Get client engagement data
  // GET /taxpayer/firm-admin/clients/engagement/
  getEngagementData: async () => {
    return await apiRequest('/taxpayer/firm-admin/clients/engagement/', 'GET');
  },

  // Get compliance risk data
  // GET /api/firm/compliance-risk/
  getComplianceRiskData: async () => {
    return await apiRequest('/firm/compliance-risk/', 'GET');
  },

  // Get account settings
  // GET /seqwens/api/firm/account-settings/
  getAccountSettings: async () => {
    const endpoint = `/firm/account-settings/`;
    return await apiRequest(endpoint, 'GET');
  },

  // Update account settings
  // PUT /seqwens/api/firm/account-settings/
  // Accepts: { first_name, last_name, email, phone_number, profile_picture (file) }
  updateAccountSettings: async (data) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();

    // Add text fields
    if (data.first_name !== undefined) {
      formData.append('first_name', data.first_name);
    }
    if (data.last_name !== undefined) {
      formData.append('last_name', data.last_name);
    }
    if (data.email !== undefined) {
      formData.append('email', data.email);
    }
    if (data.phone_number !== undefined) {
      formData.append('phone_number', data.phone_number);
    }

    // Add profile picture file if provided
    if (data.profile_picture && data.profile_picture instanceof File) {
      formData.append('profile_picture', data.profile_picture);
    }

    const config = {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData
    };

    return await fetchWithCors(`${API_BASE_URL}/firm/account-settings/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle validation errors
          if (response.status === 400 && errorData.errors) {
            const errorMessages = Object.entries(errorData.errors)
              .map(([field, errors]) => {
                const fieldErrors = Array.isArray(errors) ? errors.join(', ') : errors;
                return `${field}: ${fieldErrors}`;
              })
              .join('; ');
            const error = new Error(errorMessages || errorData.message || 'Validation failed');
            error.fieldErrors = errorData.errors;
            error.status = response.status;
            throw error;
          }

          const error = new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
          error.status = response.status;
          throw error;
        }
        return response.json();
      });
  }
};

// Firm Admin Tasks API functions
export const firmAdminTasksAPI = {
  // Create task - Firm Admin API
  createTask: async (taskData, files = []) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();

    // Required fields
    formData.append('task_type', taskData.task_type);
    formData.append('task_title', taskData.task_title);
    formData.append('tax_preparer_id', taskData.tax_preparer_id);
    formData.append('folder_id', taskData.folder_id);
    formData.append('due_date', taskData.due_date);

    // Add client_ids as JSON array string (e.g., "[6]" or "[6,7,8]")
    if (Array.isArray(taskData.client_ids) && taskData.client_ids.length > 0) {
      formData.append('client_ids', JSON.stringify(taskData.client_ids));
    } else {
      throw new Error('At least one client is required');
    }

    // Optional fields
    if (taskData.priority) {
      formData.append('priority', taskData.priority);
    }
    if (taskData.estimated_hours !== undefined && taskData.estimated_hours !== null && taskData.estimated_hours !== '') {
      formData.append('estimated_hours', taskData.estimated_hours);
    }
    if (taskData.description) {
      formData.append('description', taskData.description);
    }

    // Add files (optional for all task types)
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }

    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData
    };

    return await fetchWithCors(`${API_BASE_URL}/taxpayer/firm-admin/tasks/create/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle validation errors
          if (response.status === 400 && errorData.errors) {
            const errorMessages = Object.entries(errorData.errors)
              .map(([field, errors]) => {
                const fieldErrors = Array.isArray(errors) ? errors.join(', ') : errors;
                return `${field}: ${fieldErrors}`;
              })
              .join('; ');
            const error = new Error(errorMessages || errorData.message || 'Validation failed');
            // Attach original errors object to error for field-specific display
            error.fieldErrors = errorData.errors;
            error.status = response.status;
            throw error;
          }

          const error = new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
          error.status = response.status;
          throw error;
        }
        return response.json();
      });
  },

  // List tasks - GET /firm/tasks/
  // Supports: page, page_size, priority, status, task_type, client_id, assigned_to, search, sort_by
  listTasks: async (params = {}) => {
    const {
      page = 1,
      page_size = 20,
      priority,
      status,
      task_type,
      client_id,
      assigned_to,
      search,
      sort_by
    } = params;
    
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (page_size) queryParams.append('page_size', page_size.toString());
    if (priority) queryParams.append('priority', priority);
    if (status) queryParams.append('status', status);
    if (task_type) queryParams.append('task_type', task_type);
    if (client_id) queryParams.append('client_id', client_id.toString());
    if (assigned_to) queryParams.append('assigned_to', assigned_to.toString());
    if (search) queryParams.append('search', search);
    if (sort_by) queryParams.append('sort_by', sort_by);
    
    const queryString = queryParams.toString();
    const endpoint = `/firm/tasks/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Get task details (if needed in future)
  getTaskDetails: async (taskId) => {
    return await apiRequest(`/taxpayer/firm-admin/tasks/${taskId}/`, 'GET');
  },

  // Delete task
  deleteTask: async (taskId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(`${API_BASE_URL}/taxpayer/firm-admin/tasks/${taskId}/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  }
};

// Task Detail APIs (for viewing and managing individual tasks)
export const taskDetailAPI = {
  // Get task details
  getTaskDetails: async (taskId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(`${API_BASE_URL}/taxpayer/tasks/${taskId}/detail/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Update task status - PATCH /firm/tasks/<task_id>/status/
  // Simple endpoint specifically for status updates (for tax preparers)
  updateTaskStatus: async (taskId, status) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    };

    return await fetchWithCors(`${API_BASE_URL}/firm/tasks/${taskId}/status/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },
  
  // Update task (full update) - PUT /taxpayer/tax-preparer/tasks/<task_id>/
  // Allows updating multiple fields: status, priority, due_date, description, estimated_hours
  updateTask: async (taskId, taskData) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    };

    return await fetchWithCors(`${API_BASE_URL}/taxpayer/tax-preparer/tasks/${taskId}/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },
  
  // Get task audit log - GET /taxpayer/tasks/<task_id>/audit-log/
  getTaskAuditLog: async (taskId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(`${API_BASE_URL}/taxpayer/tasks/${taskId}/audit-log/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Start time tracking
  startTimeTracking: async (taskId, notes = '') => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes })
    };

    return await fetchWithCors(`${API_BASE_URL}/taxpayer/tasks/${taskId}/time-tracking/start/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Pause/Stop time tracking
  pauseTimeTracking: async (taskId, notes = '') => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes })
    };

    return await fetchWithCors(`${API_BASE_URL}/taxpayer/tasks/${taskId}/time-tracking/pause/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Stop time tracking (alias for pause)
  stopTimeTracking: async (taskId, notes = '') => {
    return taskDetailAPI.pauseTimeTracking(taskId, notes);
  },

  // Reset time tracking
  resetTimeTracking: async (taskId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(`${API_BASE_URL}/taxpayer/tasks/${taskId}/time-tracking/reset/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Get time tracking status
  getTimeTrackingStatus: async (taskId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(`${API_BASE_URL}/taxpayer/tasks/${taskId}/time-tracking/status/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Get related items
  getRelatedItems: async (taskId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(`${API_BASE_URL}/taxpayer/tasks/${taskId}/related-items/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  }
};

// Firm Admin Notifications API functions
export const firmAdminNotificationAPI = {
  // List all notifications with optional filters
  listNotifications: async (params = {}) => {
    const { is_read, type, limit = 50, offset = 0 } = params;
    const queryParams = new URLSearchParams();

    if (is_read !== undefined) {
      queryParams.append('is_read', is_read);
    }
    if (type) {
      queryParams.append('type', type);
    }
    if (limit) {
      queryParams.append('limit', limit);
    }
    if (offset) {
      queryParams.append('offset', offset);
    }

    const queryString = queryParams.toString();
    const endpoint = `/taxpayer/notifications/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Get unread count
  getUnreadCount: async () => {
    return await apiRequest('/taxpayer/notifications/unread-count/', 'GET');
  },

  // Get notification details
  getNotificationDetails: async (notificationId) => {
    return await apiRequest(`/taxpayer/notifications/${notificationId}/`, 'GET');
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    return await apiRequest(`/taxpayer/notifications/${notificationId}/mark-read/`, 'POST');
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return await apiRequest('/taxpayer/notifications/mark-all-read/', 'POST');
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    return await apiRequest(`/user/notifications/${notificationId}/delete/`, 'DELETE');
  }
};

// Firm Admin Documents API functions
export const firmAdminDocumentsAPI = {
  // ========== Document Folders Management ==========

  // List all folders (Firm's File Manager)
  // GET /firm/document-folders/
  listFolders: async (params = {}) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const { search, is_template } = params;
    const queryParams = new URLSearchParams();

    if (search) {
      queryParams.append('search', search);
    }
    if (is_template !== undefined) {
      queryParams.append('is_template', is_template.toString());
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/firm/document-folders/${queryString ? `?${queryString}` : ''}`;

    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // List all folders (without sync)
  // GET /api/firm/folders/list/
  listAllFolders: async () => {
    return await apiRequest('/firm/folders/list/', 'GET');
  },

  // List folders with B2 sync
  // GET /api/firm/folders/list/?sync=true
  listFoldersWithSync: async () => {
    return await apiRequest('/firm/folders/list/?sync=true', 'GET');
  },

  // Manual B2 sync
  // POST /api/firm/folders/sync-b2/
  syncFoldersWithB2: async () => {
    return await apiRequest('/firm/folders/sync-b2/', 'POST');
  },

  // List folders with auto-sync
  // GET /api/firm/folders/b2-list/
  listB2Folders: async () => {
    return await apiRequest('/firm/folders/b2-list/', 'GET');
  },

  // Create new folder
  // POST /firm/document-folders/
  createFolder: async (folderData) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_BASE_URL}/firm/document-folders/`;

    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(folderData)
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Get folder details
  // GET /firm/document-folders/{folder_id}/
  getFolderDetails: async (folderId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_BASE_URL}/firm/document-folders/${folderId}/`;

    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Update folder (Full Update)
  // PUT /firm/document-folders/{folder_id}/
  updateFolder: async (folderId, folderData) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_BASE_URL}/firm/document-folders/${folderId}/`;

    const config = {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(folderData)
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Update folder (Partial Update)
  // PATCH /firm/document-folders/{folder_id}/
  patchFolder: async (folderId, folderData) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_BASE_URL}/firm/document-folders/${folderId}/`;

    const config = {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(folderData)
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Delete folder
  // DELETE /firm/document-folders/{folder_id}/
  deleteFolder: async (folderId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_BASE_URL}/firm/document-folders/${folderId}/`;

    const config = {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // ========== Document Categories Management ==========

  // List all categories
  // GET /firm/document-categories/
  listCategories: async (params = {}) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const { search } = params;
    const queryParams = new URLSearchParams();

    if (search) {
      queryParams.append('search', search);
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/firm/document-categories/${queryString ? `?${queryString}` : ''}`;

    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Create new category
  // POST /firm/document-categories/
  createCategory: async (categoryData) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_BASE_URL}/firm/document-categories/`;

    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(categoryData)
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // ========== Bulk Document Upload ==========

  // Upload multiple documents
  // POST /firm/documents/upload/
  // Note: This endpoint requires multipart/form-data
  uploadDocuments: async (files, documentsMetadata) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_BASE_URL}/firm/documents/upload/`;

    // Create FormData
    const formData = new FormData();

    // Add files
    if (Array.isArray(files)) {
      files.forEach(file => {
        formData.append('files', file);
      });
    } else {
      formData.append('files', files);
    }

    // Add metadata as JSON string
    formData.append('documents_metadata', JSON.stringify(documentsMetadata));

    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type header - browser will set it with boundary for FormData
      },
      body: formData
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // ========== Browse Documents (Across All Clients) ==========

  // Browse documents (root level or within a folder)
  // GET /firm/documents/browse/
  browseDocuments: async (params = {}) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const { folder_id, show_archived, search, category_id, client_id, sort_by } = params;
    const queryParams = new URLSearchParams();

    if (folder_id !== undefined && folder_id !== null) {
      queryParams.append('folder_id', folder_id);
    }
    if (show_archived !== undefined) {
      queryParams.append('show_archived', show_archived);
    }
    if (search) {
      queryParams.append('search', search);
    }
    if (category_id !== undefined && category_id !== null) {
      queryParams.append('category_id', category_id);
    }
    if (client_id !== undefined && client_id !== null) {
      queryParams.append('client_id', client_id);
    }
    if (sort_by) {
      queryParams.append('sort_by', sort_by);
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/firm/documents/browse${queryString ? `?${queryString}` : ''}`;

    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Get documents by folders (for document sharing)
  // GET /firm/documents/by-folders/
  // Supports: folder_id (optional), search (optional)
  getDocumentsByFolders: async (params = {}) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const { folder_id, search } = params;
    const queryParams = new URLSearchParams();

    if (folder_id !== undefined && folder_id !== null) {
      queryParams.append('folder_id', folder_id);
    }
    if (search) {
      queryParams.append('search', search);
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/firm/documents/by-folders/${queryString ? `?${queryString}` : ''}`;

    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // ========== Browse Client Documents ==========

  // Browse specific client's documents
  // GET /taxpayer/firm-admin/clients/{client_id}/documents/browse/
  browseClientDocuments: async (clientId, params = {}) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const { folder_id, show_archived, search, category_id, sort_by } = params;
    const queryParams = new URLSearchParams();

    if (folder_id !== undefined && folder_id !== null) {
      queryParams.append('folder_id', folder_id);
    }
    if (show_archived !== undefined) {
      queryParams.append('show_archived', show_archived);
    }
    if (search) {
      queryParams.append('search', search);
    }
    if (category_id !== undefined && category_id !== null) {
      queryParams.append('category_id', category_id);
    }
    if (sort_by) {
      queryParams.append('sort_by', sort_by);
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/taxpayer/firm-admin/clients/${clientId}/documents/browse/${queryString ? `?${queryString}` : ''}`;

    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // ========== Browse Own Documents (Firm Admin's Personal Documents) ==========

  // Browse firm admin's own documents
  // GET /taxpayer/firm-admin/documents/browse/
  browseOwnDocuments: async (params = {}) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const { folder_id, show_archived, search, category_id, sort_by } = params;
    const queryParams = new URLSearchParams();

    if (folder_id !== undefined && folder_id !== null) {
      queryParams.append('folder_id', folder_id);
    }
    if (show_archived !== undefined) {
      queryParams.append('show_archived', show_archived);
    }
    if (search) {
      queryParams.append('search', search);
    }
    if (category_id !== undefined && category_id !== null) {
      queryParams.append('category_id', category_id);
    }
    if (sort_by) {
      queryParams.append('sort_by', sort_by);
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/taxpayer/firm-admin/documents/browse/${queryString ? `?${queryString}` : ''}`;

    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // List documents in a specific folder
  listFolderDocuments: async (params = {}) => {
    const { folder_id, folder_name, is_archived, category_id, search } = params;
    const queryParams = new URLSearchParams();

    if (folder_id !== undefined && folder_id !== null) {
      queryParams.append('folder_id', folder_id);
    }
    if (folder_name) {
      queryParams.append('folder_name', folder_name);
    }
    if (is_archived !== undefined) {
      queryParams.append('is_archived', is_archived);
    }
    if (category_id !== undefined && category_id !== null) {
      queryParams.append('category_id', category_id);
    }
    if (search) {
      queryParams.append('search', search);
    }

    const queryString = queryParams.toString();
    const endpoint = `/taxpayer/firm-admin/documents/folder/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Create a comment/note on a document
  createComment: async (documentId, commentData) => {
    const { comment_type, content, page_number, position_x, position_y } = commentData;
    const payload = {
      comment_type: comment_type || 'comment',
      content,
    };

    if (page_number !== undefined && page_number !== null) {
      payload.page_number = page_number;
    }
    if (position_x !== undefined && position_x !== null) {
      payload.position_x = position_x;
    }
    if (position_y !== undefined && position_y !== null) {
      payload.position_y = position_y;
    }

    const endpoint = `/taxpayer/firm-admin/documents/${documentId}/comments/`;
    return await apiRequest(endpoint, 'POST', payload);
  },

  // Get all comments for a document
  getComments: async (documentId, params = {}) => {
    const { is_resolved, comment_type, page_number } = params;
    const queryParams = new URLSearchParams();

    if (is_resolved !== undefined && is_resolved !== null) {
      queryParams.append('is_resolved', is_resolved);
    }
    if (comment_type) {
      queryParams.append('comment_type', comment_type);
    }
    if (page_number !== undefined && page_number !== null) {
      queryParams.append('page_number', page_number);
    }

    const queryString = queryParams.toString();
    const endpoint = `/taxpayer/firm-admin/documents/${documentId}/comments/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Update a comment
  updateComment: async (commentId, commentData) => {
    const endpoint = `/taxpayer/firm-admin/documents/comments/${commentId}/`;
    return await apiRequest(endpoint, 'PATCH', commentData);
  },

  // Delete a comment
  deleteComment: async (commentId) => {
    const endpoint = `/taxpayer/firm-admin/documents/comments/${commentId}/`;
    return await apiRequest(endpoint, 'DELETE');
  },

  // ========== Document Sharing Management ==========

  // Share documents with tax preparers
  shareDocuments: async (files, taxPreparerIds, notes = null) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Create FormData for file upload
    const formData = new FormData();

    // Append files - files should be an array of File objects
    if (Array.isArray(files)) {
      files.forEach((file, index) => {
        if (file instanceof File) {
          formData.append('files', file);
        } else if (file && typeof file === 'object') {
          // If it's a file-like object, try to append it
          formData.append('files', file);
        }
      });
    } else if (files instanceof File) {
      formData.append('files', files);
    }

    // Append tax preparer IDs
    if (Array.isArray(taxPreparerIds)) {
      taxPreparerIds.forEach((id) => {
        formData.append('tax_preparer_ids', id.toString());
      });
    } else {
      formData.append('tax_preparer_ids', taxPreparerIds.toString());
    }

    // Append notes if provided
    if (notes) {
      formData.append('notes', notes);
    }

    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData
    };

    return await fetchWithCors(`${API_BASE_URL}/firm/share-documents/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Unshare documents from tax preparers
  unshareDocuments: async (documentIds, taxPreparerIds) => {
    const payload = {
      document_ids: documentIds,
      tax_preparer_ids: taxPreparerIds
    };
    return await apiRequest('/firm/unshare-documents/', 'POST', payload);
  },

  // List all document shares (Firm Admin)
  listSharedDocuments: async (params = {}) => {
    const { document_id, tax_preparer_id } = params;
    const queryParams = new URLSearchParams();

    if (document_id) queryParams.append('document_id', document_id);
    if (tax_preparer_id) queryParams.append('tax_preparer_id', tax_preparer_id);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/firm/shared-documents/?${queryString}`
      : '/firm/shared-documents/';
    return await apiRequest(endpoint, 'GET');
  }
};

// Firm Admin Calendar API functions
export const firmAdminCalendarAPI = {
  // Get calendar data for a specific view and date
  getCalendar: async (params = {}) => {
    const { view = 'month', date } = params;
    const queryParams = new URLSearchParams();

    if (view) {
      queryParams.append('view', view);
    }
    if (date) {
      // Ensure date is in YYYY-MM-DD format
      const dateStr = date instanceof Date
        ? date.toISOString().split('T')[0]
        : date;
      queryParams.append('date', dateStr);
    }

    const queryString = queryParams.toString();
    const endpoint = `/firm/calendar/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },
  // Set staff availability
  setAvailability: async (availabilityData) => {
    return await apiRequest('/taxpayer/firm-admin/availability/set/', 'POST', availabilityData);
  }
};

// Firm Admin Clients API functions
export const firmAdminClientsAPI = {
  // List all clients for firm admin
  // Returns: { success: true, data: { overview: {...}, clients: [...], pagination: {...} }, message: "..." }
  listClients: async (params = {}) => {
    const { page = 1, page_size = 20, search, status, priority } = params;
    const queryParams = new URLSearchParams();

    if (page) {
      queryParams.append('page', page.toString());
    }
    if (page_size) {
      queryParams.append('page_size', page_size.toString());
    }
    if (search) {
      queryParams.append('search', search);
    }
    if (status) {
      queryParams.append('status', status);
    }
    if (priority) {
      queryParams.append('priority', priority);
    }

    const queryString = queryParams.toString();
    const endpoint = `/firm/clients/list/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Get unlinked taxpayers (clients not assigned to any tax preparer)
  // GET /api/user/unlinked-taxpayers/
  getUnlinkedTaxpayers: async (params = {}) => {
    const { search, page, page_size, is_active } = params;
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (page) queryParams.append('page', page.toString());
    if (page_size) queryParams.append('page_size', page_size.toString());
    if (is_active !== undefined) queryParams.append('is_active', is_active.toString());
    const queryString = queryParams.toString();
    return await apiRequest(`/user/unlinked-taxpayers/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Invite existing taxpayer
  inviteClient: async (inviteData) => {
    return await apiRequest('/user/firm-admin/clients/invite/', 'POST', inviteData);
  },

  // Get client details
  // Get client data entry form PDF (view or download)
  getClientDataEntryFormPDF: async (clientId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Endpoint: GET /api/firm/clients/<client_id>/data-entry-form-pdf/
    const url = `${API_BASE_URL}/firm/clients/${clientId}/data-entry-form-pdf/`;
    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf'
      }
    };

    const response = await fetchWithCors(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    // Return blob for PDF download/viewing
    const blob = await response.blob();
    return blob;
  },

  getClientDetails: async (clientId) => {
    return await apiRequest(`/user/firm-admin/clients/${clientId}/`, 'GET');
  },

  // Update client details
  updateClient: async (clientId, payload) => {
    try {
      const endpoint = `${API_BASE_URL}/user/firm-admin/clients/${clientId}/`;
      let headers = getHeaders();

      const makeRequest = async () => {
        return await fetchWithCors(endpoint, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload || {}),
        });
      };

      let response = await makeRequest();

      if (response.status === 401) {
        await refreshAccessToken();
        headers = getHeaders();
        response = await makeRequest();
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || 'Failed to update client profile');
        error.data = data;
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating client profile:', error);
      throw error;
    }
  },

  // Get shareable invite link
  // Supports both URL path parameter and query parameters
  getInviteLink: async (inviteIdOrParams) => {
    // If it's a number or string (invite_id), use URL path
    if (typeof inviteIdOrParams === 'number' || (typeof inviteIdOrParams === 'string' && !inviteIdOrParams.includes('='))) {
      return await apiRequest(`/user/firm-admin/clients/invite/${inviteIdOrParams}/link/`, 'GET');
    }
    // If it's an object with query params
    const { invite_id, client_id } = inviteIdOrParams || {};
    const queryParams = new URLSearchParams();
    if (invite_id) queryParams.append('invite_id', invite_id.toString());
    if (client_id) queryParams.append('client_id', client_id.toString());
    const queryString = queryParams.toString();
    return await apiRequest(`/user/firm-admin/clients/invite/link/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Generate or regenerate invite link (POST method)
  generateInviteLink: async (data) => {
    const { invite_id, client_id, regenerate = false } = data;
    const payload = {};
    if (invite_id) payload.invite_id = invite_id;
    if (client_id) payload.client_id = client_id;
    if (regenerate) payload.regenerate = true;
    return await apiRequest('/user/firm-admin/clients/invite/link/', 'POST', payload);
  },

  // Send invite notifications
  sendInvite: async (inviteId, payload) => {
    return await apiRequest(`/user/firm-admin/clients/invite/${inviteId}/send/`, 'POST', payload);
  },

  deleteInvite: async (inviteId) => {
    return await apiRequest(`/user/firm-admin/clients/invite/${inviteId}/delete/`, 'DELETE');
  },

  // Get pending invite details by invite_id
  getPendingInviteDetails: async (inviteId) => {
    return await apiRequest(`/user/firm-admin/clients/invites/pending/${inviteId}/`, 'GET');
  },

  // Update pending invite details
  updatePendingInvite: async (inviteId, payload) => {
    return await apiRequest(`/user/firm-admin/clients/invites/pending/${inviteId}/`, 'PATCH', payload);
  },

  // Get pending client invites
  getPendingInvites: async (params = {}) => {
    const { page = 1, page_size = 20, search, sort_by, sort_order } = params;
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (page_size) queryParams.append('page_size', page_size.toString());
    if (search) queryParams.append('search', search);
    if (sort_by) queryParams.append('sort_by', sort_by);
    if (sort_order) queryParams.append('sort_order', sort_order);
    const queryString = queryParams.toString();
    return await apiRequest(`/user/firm-admin/pending-taxpayers/${queryString ? `?${queryString}` : ''}`, 'GET');
  },
  // Bulk taxpayer import - Step 1: Preview
  bulkImportTaxpayersPreview: async (csvFile) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('csv_file', csvFile);

    const url = `${API_BASE_URL}/taxpayer/firm-admin/taxpayers/import/preview/`;
    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    };

    const response = await fetchWithCors(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },
  // Bulk taxpayer import - Step 2: Confirm
  bulkImportTaxpayersConfirm: async (importLogId, rowsToImport, invitationOptions = {}) => {
    const payload = {
      import_log_id: importLogId,
      rows_to_import: rowsToImport
    };

    // Add invitation options if provided
    if (invitationOptions.invitation_timing) {
      payload.invitation_timing = invitationOptions.invitation_timing;
    }
    if (invitationOptions.rows_to_invite && Array.isArray(invitationOptions.rows_to_invite)) {
      payload.rows_to_invite = invitationOptions.rows_to_invite;
    }
    if (invitationOptions.invitation_preferences && typeof invitationOptions.invitation_preferences === 'object') {
      payload.invitation_preferences = invitationOptions.invitation_preferences;
    }
    // Add duplicate handling preferences if provided
    if (invitationOptions.duplicate_handling && typeof invitationOptions.duplicate_handling === 'object') {
      payload.duplicate_handling = invitationOptions.duplicate_handling;
    }

    return await apiRequest('/taxpayer/firm-admin/taxpayers/import/confirm/', 'POST', payload);
  },
  // Bulk taxpayer import - Send invitations manually
  bulkImportTaxpayersSendInvitations: async (importLogId, options = {}) => {
    const payload = {
      import_log_id: importLogId
    };

    if (options.taxpayer_ids && Array.isArray(options.taxpayer_ids)) {
      payload.taxpayer_ids = options.taxpayer_ids;
    }
    if (options.row_indices && Array.isArray(options.row_indices)) {
      payload.row_indices = options.row_indices;
    }

    return await apiRequest('/taxpayer/firm-admin/taxpayers/import/send-invitations/', 'POST', payload);
  },

  // ========== Client Document Management ==========
  
  // Upload documents for a client/taxpayer
  // POST /api/firm/clients/<client_id>/documents/upload/
  uploadClientDocuments: async (clientId, uploadData) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const { files, category_id, folder_id, tags } = uploadData;
    
    // Create FormData for file upload
    const formData = new FormData();

    // Append files - files should be an array of File objects
    if (Array.isArray(files)) {
      files.forEach((file) => {
        if (file instanceof File) {
          formData.append('files', file);
        }
      });
    } else if (files instanceof File) {
      formData.append('files', files);
    }

    // Append optional fields
    if (category_id !== undefined && category_id !== null) {
      formData.append('category_id', category_id.toString());
    }
    if (folder_id !== undefined && folder_id !== null) {
      formData.append('folder_id', folder_id.toString());
    }
    if (tags !== undefined && tags !== null) {
      // Handle tags as array or JSON string
      if (Array.isArray(tags)) {
        formData.append('tags', JSON.stringify(tags));
      } else if (typeof tags === 'string') {
        formData.append('tags', tags);
      }
    }

    const url = `${API_BASE_URL}/firm/clients/${clientId}/documents/upload/`;
    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Get document details
  // GET /api/firm/clients/<client_id>/documents/<document_id>/
  getClientDocumentDetails: async (clientId, documentId) => {
    const endpoint = `/firm/clients/${clientId}/documents/${documentId}/`;
    return await apiRequest(endpoint, 'GET');
  },

  // Update document details
  // PATCH /api/firm/clients/<client_id>/documents/<document_id>/
  updateClientDocument: async (clientId, documentId, updateData) => {
    const { status, category_id, folder_id, tags } = updateData;
    const payload = {};

    if (status !== undefined && status !== null) {
      payload.status = status;
    }
    if (category_id !== undefined) {
      payload.category_id = category_id; // Can be null to remove category
    }
    if (folder_id !== undefined) {
      payload.folder_id = folder_id; // Can be null to remove folder
    }
    if (tags !== undefined && tags !== null) {
      payload.tags = Array.isArray(tags) ? tags : (typeof tags === 'string' ? JSON.parse(tags) : tags);
    }

    const endpoint = `/firm/clients/${clientId}/documents/${documentId}/`;
    return await apiRequest(endpoint, 'PATCH', payload);
  }
};

// Firm Admin Email Templates API functions
const EMAIL_TEMPLATE_BASE = '/user/firm-admin/email-templates';
const ensureEmailTemplateSuccess = (response, defaultMessage) => {
  if (response && typeof response === 'object' && Object.prototype.hasOwnProperty.call(response, 'success')) {
    if (!response.success) {
      const error = new Error(response.message || defaultMessage);
      error.data = response.data;
      throw error;
    }
    return response.data ?? {};
  }
  return response;
};

export const firmAdminEmailTemplatesAPI = {
  // List email templates
  listTemplates: async (params = {}) => {
    const { category, status, search } = params;
    const queryParams = new URLSearchParams();

    if (category) {
      queryParams.append('category', category);
    }
    if (status) {
      queryParams.append('status', status);
    }
    if (search) {
      queryParams.append('search', search);
    }

    const queryString = queryParams.toString();
    const response = await apiRequest(
      `${EMAIL_TEMPLATE_BASE}/${queryString ? `?${queryString}` : ''}`,
      'GET'
    );
    return ensureEmailTemplateSuccess(response, 'Failed to fetch email templates');
  },

  // Get template details
  getTemplate: async (templateId) => {
    const response = await apiRequest(`${EMAIL_TEMPLATE_BASE}/${templateId}/`, 'GET');
    return ensureEmailTemplateSuccess(response, 'Failed to fetch email template');
  },

  // Create email template (direct HTML or WYSIWYG payload supported)
  createTemplate: async (templateData) => {
    const response = await apiRequest(`${EMAIL_TEMPLATE_BASE}/`, 'POST', templateData);
    return ensureEmailTemplateSuccess(response, 'Failed to create email template');
  },

  // Update template
  updateTemplate: async (templateId, templateData) => {
    const response = await apiRequest(`${EMAIL_TEMPLATE_BASE}/${templateId}/`, 'PATCH', templateData);
    return ensureEmailTemplateSuccess(response, 'Failed to update email template');
  },

  // Delete template
  deleteTemplate: async (templateId) => {
    const response = await apiRequest(`${EMAIL_TEMPLATE_BASE}/${templateId}/`, 'DELETE');
    ensureEmailTemplateSuccess(response, 'Failed to delete email template');
    return true;
  },

  // Duplicate template
  duplicateTemplate: async (templateId, name) => {
    const response = await apiRequest(`${EMAIL_TEMPLATE_BASE}/${templateId}/`, 'POST', {
      action: 'duplicate',
      name,
    });
    return ensureEmailTemplateSuccess(response, 'Failed to duplicate email template');
  },

  // Send email using template
  sendTemplate: async (templateId, payload) => {
    const response = await apiRequest(`${EMAIL_TEMPLATE_BASE}/${templateId}/`, 'POST', {
      action: 'send',
      ...payload,
    });
    return ensureEmailTemplateSuccess(response, 'Failed to send email');
  },

  // Preview template (WYSIWYG-friendly)
  previewTemplate: async (payload) => {
    const response = await apiRequest(`${EMAIL_TEMPLATE_BASE}/preview/`, 'POST', payload);
    return ensureEmailTemplateSuccess(response, 'Failed to generate preview');
  },

  // Get available variables for an email type
  getVariables: async (emailType) => {
    if (!emailType) {
      throw new Error('Email type is required to fetch variables');
    }
    const response = await apiRequest(
      `${EMAIL_TEMPLATE_BASE}/variables/?email_type=${encodeURIComponent(emailType)}`,
      'GET'
    );
    return ensureEmailTemplateSuccess(response, 'Failed to fetch template variables');
  },

  // Get email template analytics
  getAnalytics: async () => {
    const response = await apiRequest(`${EMAIL_TEMPLATE_BASE}/analytics/`, 'GET');
    return ensureEmailTemplateSuccess(response, 'Failed to fetch email template analytics');
  },

  // List email templates organized by email type
  listTemplatesByType: async () => {
    const response = await apiRequest(`${EMAIL_TEMPLATE_BASE}/by-type/`, 'GET');
    return ensureEmailTemplateSuccess(response, 'Failed to fetch templates by type');
  },

  // Assign email template to email type
  assignTemplate: async (templateId, emailType) => {
    const response = await apiRequest(`${EMAIL_TEMPLATE_BASE}/assign/`, 'POST', {
      template_id: templateId,
      email_type: emailType,
    });
    return ensureEmailTemplateSuccess(response, 'Failed to assign template');
  },
};

// Firm Admin Email Settings API functions
export const firmAdminEmailSettingsAPI = {
  // Get email settings
  getEmailSettings: async () => {
    return await apiRequest('/user/firm-admin/email-settings/', 'GET');
  },

  // Update email settings (PATCH)
  updateEmailSettings: async (settingsData) => {
    return await apiRequest('/user/firm-admin/email-settings/', 'PATCH', settingsData);
  },
};

// Firm Admin Staff API functions
export const firmAdminStaffAPI = {
  // List all staff members (tax preparers) for firm admin
  listStaff: async (params = {}) => {
    const { status = 'all', search = '', role = 'all', performance = 'all' } = params;
    const queryParams = new URLSearchParams();

    if (status) {
      queryParams.append('status', status);
    }
    if (search) {
      queryParams.append('search', search);
    }
    if (role) {
      queryParams.append('role', role);
    }
    if (performance) {
      queryParams.append('performance', performance);
    }

    const queryString = queryParams.toString();
    const endpoint = `/user/firm-admin/staff/tax-preparers/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },
  // Lightweight staff directory for assigning managers or participants
  listBasicStaff: async () => {
    return await apiRequest('/taxpayer/firm-admin/staff/', 'GET');
  },
  // Get firm with tax preparers (for assign staff dropdown)
  getFirmWithTaxPreparers: async () => {
    return await apiRequest('/firm/with-tax-preparers/', 'GET');
  },

  // List tax preparers (new API)
  // listTaxPreparers: async () => {
  //   return await apiRequest('/firm/tax-preparers/list/', 'GET');
  // },
  // Get activity logs for a staff member
  getStaffActivityLogs: async (staffId, params = {}) => {
    const {
      activity_type,
      status,
      start_date,
      end_date,
      page = 1,
      page_size = 50
    } = params;

    const queryParams = new URLSearchParams();

    if (activity_type) {
      queryParams.append('activity_type', activity_type);
    }
    if (status) {
      queryParams.append('status', status);
    }
    if (start_date) {
      queryParams.append('start_date', start_date);
    }
    if (end_date) {
      queryParams.append('end_date', end_date);
    }
    if (page) {
      queryParams.append('page', page.toString());
    }
    if (page_size) {
      queryParams.append('page_size', page_size.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/firm/staff/${staffId}/activity-logs/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },
  // Set tax preparer as inactive
  setInactive: async (staffId) => {
    return await apiRequest(`/user/firm-admin/staff/tax-preparers/${staffId}/set-inactive/`, 'PATCH');
  },
  // Reactivate tax preparer (set as active)
  reactivateStaff: async (staffId) => {
    return await apiRequest(`/user/firm-admin/staff/tax-preparers/${staffId}/set-active/`, 'PATCH');
  },

  // List all tax preparers with permission status
  listTaxPreparers: async (params = {}) => {
    const { page, page_size, search } = params;
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (page_size) queryParams.append('page_size', page_size.toString());
    if (search) queryParams.append('search', search);
    const queryString = queryParams.toString();
    return await apiRequest(`/user/firm-admin/tax-preparers/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Get tax preparer permissions
  getTaxPreparerPermissions: async (userId) => {
    return await apiRequest(`/user/firm-admin/tax-preparers/${userId}/permissions/`, 'GET');
  },

  // Get office scope for a staff member
  getOfficeScope: async (userId) => {
    return await apiRequest(`/firm/staff/${userId}/office-scope/`, 'GET');
  },

  // Set office scope for a staff member
  setOfficeScope: async (userId, officeIds) => {
    const payload = {
      office_ids: Array.isArray(officeIds) ? officeIds : [officeIds]
    };
    return await apiRequest(`/firm/staff/${userId}/office-scope/`, 'POST', payload);
  },

  // Update tax preparer permissions
  updateTaxPreparerPermissions: async (userId, permissions) => {
    return await apiRequest(`/user/firm-admin/tax-preparers/${userId}/permissions/`, 'PUT', {
      permissions
    });
  },
  // Bulk tax preparer import - Step 1: Preview
  bulkImportTaxPreparersPreview: async (csvFile) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('file', csvFile);

    const url = `${API_BASE_URL}/taxpayer/firm-admin/tax-preparers/import/preview/`;
    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    };

    const response = await fetchWithCors(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },
  // Bulk tax preparer import - Step 2: Confirm
  bulkImportTaxPreparersConfirm: async (importLogId, rowsToImport) => {
    const payload = {
      import_log_id: importLogId,
      rows_to_import: rowsToImport
    };

    return await apiRequest('/taxpayer/firm-admin/tax-preparers/import/confirm/', 'POST', payload);
  },
};

// Firm Admin Custom Roles API functions
export const firmAdminCustomRolesAPI = {
  // List all custom roles
  getCustomRoles: async (includeInactive = false) => {
    const queryParams = new URLSearchParams();
    if (includeInactive) {
      queryParams.append('include_inactive', 'true');
    }
    const queryString = queryParams.toString();
    return await apiRequest(`/user/firm-admin/custom-roles/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Create custom role
  createCustomRole: async (name, description, permissions) => {
    return await apiRequest('/user/firm-admin/custom-roles/', 'POST', {
      name,
      description,
      permissions
    });
  },

  // Get role details
  getRoleDetails: async (roleId) => {
    return await apiRequest(`/user/firm-admin/custom-roles/${roleId}/`, 'GET');
  },

  // Update custom role
  updateCustomRole: async (roleId, data) => {
    return await apiRequest(`/user/firm-admin/custom-roles/${roleId}/`, 'PUT', data);
  },

  // Delete custom role
  deleteCustomRole: async (roleId) => {
    return await apiRequest(`/user/firm-admin/custom-roles/${roleId}/`, 'DELETE');
  },

  // Get role privileges
  getRolePrivileges: async (roleId) => {
    return await apiRequest(`/user/firm-admin/custom-roles/${roleId}/privileges/`, 'GET');
  },

  // Add privilege to role (single or bulk)
  addPrivilege: async (roleId, category, action, resource, description) => {
    return await apiRequest(`/user/firm-admin/custom-roles/${roleId}/privileges/`, 'POST', {
      category,
      action,
      resource,
      description
    });
  },

  // Add multiple privileges to role at once (bulk)
  addPrivileges: async (roleId, privileges) => {
    return await apiRequest(`/user/firm-admin/custom-roles/${roleId}/privileges/`, 'POST', {
      privileges: privileges
    });
  },

  // Delete privilege from role
  deletePrivilege: async (roleId, privilegeId) => {
    return await apiRequest(`/user/firm-admin/custom-roles/${roleId}/privileges/${privilegeId}/`, 'DELETE');
  },

  // Assign custom role to staff
  assignCustomRoleToStaff: async (userId, customRoleId) => {
    return await apiRequest(`/user/firm-admin/staff/${userId}/assign-custom-role/`, 'POST', {
      custom_role_id: customRoleId
    });
  },
};

// Firm Admin Office Locations API functions
export const firmOfficeAPI = {
  listOffices: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) {
      queryParams.append('search', params.search);
    }
    if (params.status) {
      queryParams.append('status', params.status);
    }
    const queryString = queryParams.toString();
    return await apiRequest(`/firm/office-locations/${queryString ? `?${queryString}` : ''}`, 'GET');
  },
  createOffice: async (officeData, files = {}) => {
    // Check if there are file uploads (logo, signature)
    const hasFiles = files.logo || files.signature;

    if (hasFiles) {
      // Use FormData for multipart/form-data when files are present
      const formData = new FormData();
      const token = getAccessToken() || AUTH_TOKEN;

      // Add all form fields to FormData
      Object.keys(officeData).forEach(key => {
        const value = officeData[key];
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'object' && !(value instanceof File)) {
            // Handle JSON objects (operation_hours, custom_service_rates)
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === 'boolean') {
            // Handle boolean values
            formData.append(key, value ? 'true' : 'false');
          } else {
            formData.append(key, value);
          }
        }
      });

      // Add files
      if (files.logo) {
        formData.append('logo', files.logo);
      }
      if (files.signature) {
        formData.append('signature', files.signature);
      }

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData
      };

      const response = await fetchWithCors(`${API_BASE_URL}/firm/office-locations/`, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.errors) {
            const fieldErrors = Object.entries(errorData.errors)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            errorMessage = `${errorData.message || 'Validation failed'}. ${fieldErrors}`;
          } else {
            errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } else {
      // Use JSON for regular requests without files
      return await apiRequest('/firm/office-locations/', 'POST', officeData);
    }
  },
  getOffice: async (officeId) => {
    return await apiRequest(`/firm/office-locations/${officeId}/`, 'GET');
  },
  getOfficeStaff: async (officeId) => {
    return await apiRequest(`/firm/office-locations/${officeId}/staff/`, 'GET');
  },
  getOfficeClients: async (officeId) => {
    return await apiRequest(`/firm/office-locations/${officeId}/clients/`, 'GET');
  },
  getOfficePerformance: async (officeId) => {
    return await apiRequest(`/firm/office-locations/${officeId}/performance/`, 'GET');
  },
  updateOffice: async (officeId, officeData) => {
    return await apiRequest(`/firm/office-locations/${officeId}/`, 'PATCH', officeData);
  },
  deleteOffice: async (officeId) => {
    return await apiRequest(`/firm/office-locations/${officeId}/`, 'DELETE');
  },
  // Taxpayer management
  listTaxpayers: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.office_id) queryParams.append('office_id', params.office_id);
    if (params.assigned_only) queryParams.append('assigned_only', params.assigned_only);
    const queryString = queryParams.toString();
    return await apiRequest(`/firm/taxpayers/${queryString ? `?${queryString}` : ''}`, 'GET');
  },
  assignTaxpayerToOffice: async (officeId, taxpayerId = null, taxpayerIds = null) => {
    const payload = {};
    if (taxpayerId) {
      payload.taxpayer_id = taxpayerId;
    } else if (taxpayerIds && Array.isArray(taxpayerIds)) {
      payload.taxpayer_ids = taxpayerIds;
    } else {
      throw new Error('Either taxpayer_id or taxpayer_ids must be provided');
    }
    return await apiRequest(`/firm/office-locations/${officeId}/assign-taxpayer/`, 'POST', payload);
  },
  removeTaxpayerFromOffice: async (officeId, taxpayerId = null, taxpayerIds = null) => {
    const payload = {};
    if (taxpayerId) {
      payload.taxpayer_id = taxpayerId;
    } else if (taxpayerIds && Array.isArray(taxpayerIds)) {
      payload.taxpayer_ids = taxpayerIds;
    } else {
      throw new Error('Either taxpayer_id or taxpayer_ids must be provided');
    }
    return await apiRequest(`/firm/office-locations/${officeId}/assign-taxpayer/`, 'DELETE', payload);
  },
  setPrimaryOffice: async (officeId) => {
    return await apiRequest(`/firm/office-locations/${officeId}/set-primary/`, 'POST');
  },
  removeManager: async (officeId) => {
    return await apiRequest(`/firm/office-locations/${officeId}/manager/`, 'DELETE');
  },
  updateBasicDetails: async (officeId, officeData) => {
    return await apiRequest(`/firm/office-locations/${officeId}/basic-details/`, 'PATCH', officeData);
  },
  // Bulk taxpayer import - Step 1: Preview
  bulkImportTaxpayersPreview: async (csvFile) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('csv_file', csvFile);

    const url = `${API_BASE_URL}/taxpayer/firm-admin/taxpayers/import/preview/`;
    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    };

    const response = await fetchWithCors(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },
  // Bulk taxpayer import - Step 2: Confirm
  bulkImportTaxpayersConfirm: async (importLogId, rowsToImport, invitationOptions = {}) => {
    const payload = {
      import_log_id: importLogId,
      rows_to_import: rowsToImport
    };

    // Add invitation options if provided
    if (invitationOptions.invitation_timing) {
      payload.invitation_timing = invitationOptions.invitation_timing;
    }
    if (invitationOptions.rows_to_invite && Array.isArray(invitationOptions.rows_to_invite)) {
      payload.rows_to_invite = invitationOptions.rows_to_invite;
    }
    if (invitationOptions.invitation_preferences && typeof invitationOptions.invitation_preferences === 'object') {
      payload.invitation_preferences = invitationOptions.invitation_preferences;
    }
    // Add duplicate handling preferences if provided
    if (invitationOptions.duplicate_handling && typeof invitationOptions.duplicate_handling === 'object') {
      payload.duplicate_handling = invitationOptions.duplicate_handling;
    }

    return await apiRequest('/taxpayer/firm-admin/taxpayers/import/confirm/', 'POST', payload);
  },
  // Bulk taxpayer import - Send invitations manually
  bulkImportTaxpayersSendInvitations: async (importLogId, options = {}) => {
    const payload = {
      import_log_id: importLogId
    };

    if (options.taxpayer_ids && Array.isArray(options.taxpayer_ids)) {
      payload.taxpayer_ids = options.taxpayer_ids;
    }
    if (options.row_indices && Array.isArray(options.row_indices)) {
      payload.row_indices = options.row_indices;
    }

    return await apiRequest('/taxpayer/firm-admin/taxpayers/import/send-invitations/', 'POST', payload);
  },
};

// Firm Admin Meetings API functions
export const firmAdminMeetingsAPI = {
  // Create meeting/appointment (checks for overlaps)
  createMeeting: async (meetingData) => {
    const endpoint = `/firm/meetings/create/`;

    // Make the API request and return the response with status code
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const API_BASE_URL = getApiBaseUrl();
      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData)
      };

      const response = await fetchWithCors(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      // Return response with status for handling overlaps
      return {
        status: response.status,
        ...data
      };
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  },

  // Confirm overwrite (cancel overlapping meetings and create new one)
  confirmOverwrite: async (overwriteData) => {
    const endpoint = `/firm/meetings/confirm-overwrite/`;
    return await apiRequest(endpoint, 'POST', overwriteData);
  }
};

// Firm Admin Signature/Document Requests API functions
export const firmSignatureDocumentRequestsAPI = {
  // Create signature or document request
  createRequest: async (requestData) => {
    try {
      const token = getAccessToken() || AUTH_TOKEN;
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const formData = new FormData();

      // Required fields
      formData.append('type', requestData.type); // "signature_request" or "document_request"
      formData.append('task_title', requestData.task_title);
      formData.append('client_id', requestData.client_id.toString());

      // spouse_sign field - always send, default to false if not provided
      formData.append('spouse_sign', requestData.spouse_sign === true ? 'true' : 'false');

      // Add files (multiple files)
      if (requestData.files && Array.isArray(requestData.files)) {
        requestData.files.forEach((file) => {
          formData.append('files', file);
        });
      }

      // Add documents_metadata or documents (JSON string array)
      // IMPORTANT: documents_metadata MUST be provided and match the number of files
      if (requestData.documents_metadata && Array.isArray(requestData.documents_metadata)) {
        formData.append('documents_metadata', JSON.stringify(requestData.documents_metadata));
      } else if (requestData.documents && Array.isArray(requestData.documents)) {
        formData.append('documents_metadata', JSON.stringify(requestData.documents));
      } else if (requestData.files && Array.isArray(requestData.files) && requestData.files.length > 0) {
        // If documents_metadata is not provided, create an array of empty objects matching the number of files
        // This ensures the API receives the correct number of document configurations
        const defaultMetadata = requestData.files.map(() => ({}));
        formData.append('documents_metadata', JSON.stringify(defaultMetadata));
      }

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        body: formData
      };

      console.log('Signature/Document Request API Request URL:', `${API_BASE_URL}/firm/signature-document-requests/create/`);
      console.log('Signature/Document Request API Request Config:', config);
      console.log('Request Data:', {
        type: requestData.type,
        task_title: requestData.task_title,
        client_id: requestData.client_id,
        spouse_sign: requestData.spouse_sign,
        files_count: requestData.files?.length || 0,
        documents_metadata: requestData.documents_metadata || requestData.documents
      });

      let response = await fetchWithCors(`${API_BASE_URL}/firm/signature-document-requests/create/`, config);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401) {
        console.log('Received 401, attempting to refresh token...');

        try {
          await refreshAccessToken();

          // Retry the original request with new token
          config.headers = {
            'Authorization': `Bearer ${getAccessToken() || AUTH_TOKEN}`,
          };
          response = await fetchWithCors(`${API_BASE_URL}/firm/signature-document-requests/create/`, config);

          if (response.status === 401) {
            // Refresh failed, redirect to login
            console.log('Token refresh failed, clearing user data and redirecting to login');
            clearUserData();
            window.location.href = getPathWithPrefix('/login');
            throw new Error('Session expired. Please login again.');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          clearUserData();
          window.location.href = getPathWithPrefix('/login');
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Signature/Document Request API Error Response:', errorData);

          if (errorData.errors) {
            console.error('Validation Errors:', errorData.errors);
            
            // Check if errors is an array (file validation errors)
            if (Array.isArray(errorData.errors)) {
              const errorMessages = errorData.errors.map((err) => {
                if (typeof err === 'object' && err.error) {
                  // Format: "filename: error message"
                  return err.filename 
                    ? `${err.filename}: ${err.error}`
                    : err.error;
                }
                return typeof err === 'string' ? err : JSON.stringify(err);
              });
              errorMessage = errorMessages.length > 0 
                ? `${errorData.message || 'Validation failed'}. ${errorMessages.join('. ')}`
                : errorData.message || 'Validation failed';
            } 
            // Check if errors is an object (field validation errors)
            else if (typeof errorData.errors === 'object') {
              const fieldErrors = Object.entries(errorData.errors)
                .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                .join('; ');
              errorMessage = `${errorData.message || 'Validation failed'}. ${fieldErrors}`;
            }
            else {
              errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
            }
          } else {
            errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing signature/document request response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Signature/Document Request API Success Response:', result);
      return result;
    } catch (error) {
      console.error('Signature/Document Request API Request Error:', error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      }

      throw error;
    }
  }
};

// Super Admin Notifications API functions
// Note: Super Admin uses the same endpoints as other users but with different notification types
export const superAdminNotificationAPI = {
  // List all notifications with optional filters
  listNotifications: async (params = {}) => {
    const { is_read, type, limit = 50, offset = 0 } = params;
    const queryParams = new URLSearchParams();

    if (is_read !== undefined) {
      queryParams.append('is_read', is_read);
    }
    if (type) {
      queryParams.append('type', type);
    }
    if (limit) {
      queryParams.append('limit', limit);
    }
    if (offset) {
      queryParams.append('offset', offset);
    }

    const queryString = queryParams.toString();
    const endpoint = `/taxpayer/notifications/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Get unread count
  getUnreadCount: async () => {
    return await apiRequest('/taxpayer/notifications/unread-count/', 'GET');
  },

  // Get notification details
  getNotificationDetails: async (notificationId) => {
    return await apiRequest(`/taxpayer/notifications/${notificationId}/`, 'GET');
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    return await apiRequest(`/taxpayer/notifications/${notificationId}/mark-read/`, 'POST');
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return await apiRequest('/taxpayer/notifications/mark-all-read/', 'POST');
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    return await apiRequest(`/user/notifications/${notificationId}/delete/`, 'DELETE');
  }
};

// Tax Preparer Security API functions
export const taxPreparerSecurityAPI = {
  // Get security preferences
  getSecurityPreferences: async () => {
    return await apiRequest('/user/security-settings/', 'GET');
  },

  // Update security preferences
  updateSecurityPreferences: async (preferences) => {
    return await apiRequest('/user/security-settings/', 'PATCH', preferences);
  },

  // Update password
  updatePassword: async (passwordData) => {
    return await apiRequest('/user/security-settings/', 'PATCH', passwordData);
  }
};

// Super Admin Billing Management API functions
export const superAdminBillingAPI = {
  // Office Pricing
  listOfficePricing: async (params = {}) => {
    const { firm_id } = params;
    const queryParams = new URLSearchParams();
    if (firm_id) {
      queryParams.append('firm_id', firm_id);
    }
    const queryString = queryParams.toString();
    const endpoint = `/user/superadmin/billing/office-pricing/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  createOrUpdateOfficePricing: async (pricingData) => {
    return await apiRequest('/user/superadmin/billing/office-pricing/', 'POST', pricingData);
  },

  // User Pricing
  listUserPricing: async (params = {}) => {
    const { firm_id } = params;
    const queryParams = new URLSearchParams();
    if (firm_id) {
      queryParams.append('firm_id', firm_id);
    }
    const queryString = queryParams.toString();
    const endpoint = `/user/superadmin/billing/user-pricing/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  createOrUpdateUserPricing: async (pricingData) => {
    return await apiRequest('/user/superadmin/billing/user-pricing/', 'POST', pricingData);
  },

  // Billing Rules
  getBillingRules: async (firmId) => {
    return await apiRequest(`/user/superadmin/billing/firms/${firmId}/rules/`, 'GET');
  },

  createOrUpdateBillingRules: async (firmId, rulesData) => {
    return await apiRequest(`/user/superadmin/billing/firms/${firmId}/rules/`, 'POST', rulesData);
  },

  // Billing Charges
  listBillingCharges: async (params = {}) => {
    const { firm_id, status } = params;
    const queryParams = new URLSearchParams();
    if (firm_id) {
      queryParams.append('firm_id', firm_id);
    }
    if (status) {
      queryParams.append('status', status);
    }
    const queryString = queryParams.toString();
    const endpoint = `/user/superadmin/billing/charges/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  approveBillingCharge: async (chargeId) => {
    return await apiRequest(`/user/superadmin/billing/charges/${chargeId}/approve/`, 'POST');
  }
};

// Super Admin Addons API functions
export const superAdminAddonsAPI = {
  // List all addons
  listAddons: async () => {
    return await apiRequest('/user/superadmin/add-ons/', 'GET');
  },

  // Create addon
  createAddon: async (addonData) => {
    return await apiRequest('/user/superadmin/add-ons/create/', 'POST', addonData);
  },

  // Update addon (full)
  updateAddonFull: async (addonId, addonData) => {
    return await apiRequest(`/user/superadmin/add-ons/${addonId}/`, 'PUT', addonData);
  },

  // Update addon (partial)
  updateAddonPartial: async (addonId, addonData) => {
    return await apiRequest(`/user/superadmin/add-ons/${addonId}/`, 'PATCH', addonData);
  },

  // Toggle addon status
  toggleAddonStatus: async (addonId) => {
    return await apiRequest(`/user/superadmin/add-ons/${addonId}/toggle-status/`, 'POST');
  },

  // Delete addon
  deleteAddon: async (addonId) => {
    return await apiRequest(`/user/superadmin/add-ons/${addonId}/delete/`, 'DELETE');
  },

  // Get firm addons
  getFirmAddons: async (firmId) => {
    return await apiRequest(`/user/superadmin/firms/${firmId}/add-ons/`, 'GET');
  },

  // Get simple addons list (for creating new addons)
  getSimpleAddons: async () => {
    return await apiRequest('/user/superadmin/add-ons/simple/', 'GET');
  }
};

// Firm Admin Addons API functions
export const firmAdminAddonsAPI = {
  // Get firm's active addons
  getFirmAddons: async () => {
    return await apiRequest('/user/firm-admin/add-ons/', 'GET');
  },

  // List all available addon types (marketplace)
  listMarketplaceAddons: async () => {
    return await apiRequest('/user/firm-admin/add-ons/types/', 'GET');
  },

  // Add addon to firm subscription
  addAddonToFirm: async (addonData) => {
    return await apiRequest('/user/firm-admin/add-ons/', 'POST', addonData);
  },

  // Remove addon from firm subscription (uses AddOn type ID, not FirmAddOn ID)
  removeAddonFromFirm: async (addonTypeId) => {
    return await apiRequest(`/user/firm-admin/add-ons/${addonTypeId}/`, 'DELETE');
  }
};

// Tax Preparer Shared Documents API functions (documents shared by Firm Admin)
export const taxPreparerSharedDocumentsAPI = {
  // View documents shared with tax preparer
  getSharedDocuments: async (params = {}) => {
    const { document_id, search } = params;
    const queryParams = new URLSearchParams();

    if (document_id) queryParams.append('document_id', document_id);
    if (search) queryParams.append('search', search);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/firm/tax-preparer/shared-documents/?${queryString}`
      : '/firm/tax-preparer/shared-documents/';
    return await apiRequest(endpoint, 'GET');
  },
};

// Tax Preparer Firm-Shared Documents API functions
export const taxPreparerFirmSharedAPI = {
  // List firm-shared documents
  getFirmSharedDocuments: async (params = {}) => {
    const { folder_id, category_id, search, is_archived } = params;
    const queryParams = new URLSearchParams();

    if (folder_id) queryParams.append('folder_id', folder_id);
    if (category_id) queryParams.append('category_id', category_id);
    if (search) queryParams.append('search', search);
    if (is_archived !== undefined) queryParams.append('is_archived', is_archived);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/firm/tax-preparer/firm-shared-documents/?${queryString}`
      : '/firm/tax-preparer/firm-shared-documents/';
    return await apiRequest(endpoint, 'GET');
  },

  // Upload file to firm-shared area
  uploadFirmSharedDocument: async (file, folderId = null, categoryId = null, comment = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) formData.append('folder_id', folderId);
      if (categoryId) formData.append('category_id', categoryId);
      if (comment) formData.append('comment', comment);

      const token = getAccessToken() || AUTH_TOKEN;

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        body: formData
      };

      console.log('Upload Firm Shared Document API Request URL:', `${API_BASE_URL}/firm/tax-preparer/firm-shared-documents/`);
      console.log('Upload Firm Shared Document API Request Config:', config);

      const response = await fetchWithCors(`${API_BASE_URL}/firm/tax-preparer/firm-shared-documents/`, config);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401) {
        console.log('Received 401, attempting to refresh token...');

        try {
          await refreshAccessToken();

          // Retry the original request with new token
          config.headers = {
            'Authorization': `Bearer ${getAccessToken() || AUTH_TOKEN}`,
          };
          const retryResponse = await fetchWithCors(`${API_BASE_URL}/firm/tax-preparer/firm-shared-documents/`, config);

          if (retryResponse.status === 401) {
            // Refresh failed, redirect to login
            console.log('Token refresh failed, clearing user data and redirecting to login');
            clearUserData();
            window.location.href = getPathWithPrefix('/login');
            throw new Error('Session expired. Please login again.');
          }

          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }

          return await retryResponse.json();
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          clearUserData();
          window.location.href = getPathWithPrefix('/login');
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Upload Firm Shared Document API Error Response:', errorData);

          if (errorData.errors) {
            console.error('Upload Firm Shared Document Field Validation Errors:', errorData.errors);
            const fieldErrors = Object.entries(errorData.errors)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            errorMessage = `${errorData.message || 'Validation failed'}. ${fieldErrors}`;
          } else {
            errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing upload firm shared document response:', parseError);
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Upload Firm Shared Document API Request Error:', error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      }

      throw error;
    }
  },

  // Get document details
  getFirmSharedDocument: async (documentId) => {
    return await apiRequest(`/firm/tax-preparer/firm-shared-documents/${documentId}/`, 'GET');
  },

  // Delete document
  deleteFirmSharedDocument: async (documentId) => {
    return await apiRequest(`/firm/tax-preparer/firm-shared-documents/${documentId}/`, 'DELETE');
  },

  // Download document
  downloadFirmSharedDocument: async (documentId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/firm/tax-preparer/firm-shared-documents/${documentId}/download/`;

    const response = await fetchWithCors(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to download document');
    }

    const blob = await response.blob();
    return blob;
  },

  // List firm-shared folders
  getFirmSharedFolders: async (params = {}) => {
    const { parent_id, search } = params;
    const queryParams = new URLSearchParams();

    if (parent_id !== undefined && parent_id !== null) queryParams.append('parent_id', parent_id);
    if (search) queryParams.append('search', search);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/firm/tax-preparer/firm-shared-folders/?${queryString}`
      : '/firm/tax-preparer/firm-shared-folders/';
    return await apiRequest(endpoint, 'GET');
  },

  // List firm-shared categories
  getFirmSharedCategories: async () => {
    return await apiRequest('/firm/tax-preparer/firm-shared-categories/', 'GET');
  },
};

export const taxPreparerClientAPI = {
  // Get all invoices for a client (with filtering)
  getClientInvoices: async (clientId, params = {}) => {
    const { status, search, start_date, end_date, sort_by, page, page_size } = params;
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (search) queryParams.append('search', search);
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    if (sort_by) queryParams.append('sort_by', sort_by);
    if (page) queryParams.append('page', page.toString());
    if (page_size) queryParams.append('page_size', page_size.toString());
    const queryString = queryParams.toString();
    return await apiRequest(`/taxpayer/tax-preparer/clients/${clientId}/invoices/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Get individual invoice details
  getClientInvoiceDetail: async (clientId, invoiceId) => {
    return await apiRequest(`/taxpayer/tax-preparer/clients/${clientId}/invoices/${invoiceId}/`, 'GET');
  },

  // Get paid invoices only (backward compatibility)
  getPaidInvoices: async (clientId, params = {}) => {
    const { search, start_date, end_date, sort_by, page, page_size } = params;
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    if (sort_by) queryParams.append('sort_by', sort_by);
    if (page) queryParams.append('page', page.toString());
    if (page_size) queryParams.append('page_size', page_size.toString());
    const queryString = queryParams.toString();
    return await apiRequest(`/taxpayer/tax-preparer/clients/${clientId}/invoices/paid/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Check if client has a spouse
  checkClientSpouse: async (clientId) => {
    return await apiRequest(`/taxpayer/tax-preparer/clients/${clientId}/spouse/check/`, 'GET');
  },

  // Create a new taxpayer/client
  createTaxpayer: async (taxpayerData) => {
    return await apiRequest('/taxpayer/tax-preparer/clients/create/', 'POST', taxpayerData);
  },

  // Update taxpayer/client information
  updateTaxpayer: async (clientId, taxpayerData) => {
    return await apiRequest(`/taxpayer/tax-preparer/clients/${clientId}/`, 'PATCH', taxpayerData);
  },

  // Invite taxpayer via link (simple version - takes clientId only)
  generateInviteLinkForClient: async (clientId) => {
    return await apiRequest(`/taxpayer/tax-preparer/clients/${clientId}/invite/link/`, 'POST');
  },

  // Invite taxpayer via email
  inviteTaxpayerEmail: async (clientId, emailData) => {
    return await apiRequest(`/taxpayer/tax-preparer/clients/${clientId}/invite/email/`, 'POST', emailData);
  },

  // Invite taxpayer via SMS
  inviteTaxpayerSMS: async (clientId, smsData) => {
    return await apiRequest(`/taxpayer/tax-preparer/clients/${clientId}/invite/sms/`, 'POST', smsData);
  },

  // Get invite link for existing client (by invite_id or client_id)
  // GET /accounts/tax-preparer/clients/invite/link/?invite_id=X or ?client_id=X
  getInviteLink: async (params = {}) => {
    const { invite_id, client_id } = params;
    const queryParams = new URLSearchParams();

    if (invite_id) {
      queryParams.append('invite_id', invite_id);
    }
    if (client_id) {
      queryParams.append('client_id', client_id);
    }

    const queryString = queryParams.toString();
    const endpoint = `/user/tax-preparer/clients/invite/link/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint, 'GET');
  },

  // Generate or regenerate invite link
  // POST /accounts/tax-preparer/clients/invite/link/
  // Body: { client_id: X } or { invite_id: X, regenerate: true } or { client_id: X, regenerate: true }
  generateInviteLink: async (data) => {
    const { client_id, invite_id, regenerate = false } = data;

    const payload = {};
    if (client_id) {
      payload.client_id = client_id;
    }
    if (invite_id) {
      payload.invite_id = invite_id;
    }
    if (regenerate) {
      payload.regenerate = true;
    }

    return await apiRequest('/user/tax-preparer/clients/invite/link/', 'POST', payload);
  },

  // Send invite to client (new API)
  sendInvite: async (payload) => {
    return await apiRequest('/user/tax-preparer/clients/invite/send/', 'POST', payload);
  },

  // Get eSign activity logs for a client
  // GET /taxpayer/tax-preparer/clients/{client_id}/esign-logs/
  getESignLogs: async (clientId, params = {}) => {
    const { status, limit } = params;
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (limit) queryParams.append('limit', limit.toString());
    const queryString = queryParams.toString();
    return await apiRequest(`/taxpayer/tax-preparer/clients/${clientId}/esign-logs/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Get list of clients for tax preparer
  // GET /taxpayer/tax-preparer/clients/ or /firm/staff/clients/list/
  getClients: async (params = {}) => {
    const { search, status, priority } = params;
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (status) queryParams.append('status', status);
    if (priority) queryParams.append('priority', priority);
    const queryString = queryParams.toString();
    return await apiRequest(`/taxpayer/tax-preparer/clients/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Check if tax preparer has permission to view unlinked taxpayers
  // GET /api/user/tax-preparer/permissions/check-unlinked-taxpayers/
  checkUnlinkedTaxpayersPermission: async () => {
    return await apiRequest('/user/tax-preparer/permissions/check-unlinked-taxpayers/', 'GET');
  },

  // Get unlinked taxpayers (clients not assigned to any tax preparer)
  // GET /api/user/unlinked-taxpayers/
  getUnlinkedTaxpayers: async (params = {}) => {
    const { search, page, page_size, is_active } = params;
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (page) queryParams.append('page', page.toString());
    if (page_size) queryParams.append('page_size', page_size.toString());
    if (is_active !== undefined) queryParams.append('is_active', is_active.toString());
    const queryString = queryParams.toString();
    return await apiRequest(`/user/unlinked-taxpayers/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Create e-signature request
  // POST /api/taxpayer/esign/create/
  createESignRequest: async (data) => {
    const { taxpayer_id, has_spouse, preparer_must_sign, file, folder_id, deadline } = data;

    if (!taxpayer_id) {
      throw new Error('taxpayer_id is required');
    }
    if (!file) {
      throw new Error('PDF file is required');
    }

    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('taxpayer_id', taxpayer_id.toString());
    formData.append('has_spouse', has_spouse ? 'true' : 'false');
    formData.append('preparer_must_sign', preparer_must_sign !== undefined ? (preparer_must_sign ? 'true' : 'false') : 'true');
    formData.append('file', file);

    if (folder_id !== undefined && folder_id !== null && folder_id !== '') {
      formData.append('folder_id', folder_id.toString());
    }

    // Always include deadline field (backend can decide how to handle empty value)
    // Convert to MM/DD/YYYY format as required by backend
    const rawDeadline = (deadline ?? '').toString();
    let deadlineFormatted = '';
    if (rawDeadline) {
      // Handle possible ISO datetime or date-only formats
      const datePart = rawDeadline.split('T')[0]; // e.g. "2026-01-31"
      const parts = datePart.split('-');          // [YYYY, MM, DD]
      if (parts.length === 3) {
        const [year, month, day] = parts;
        deadlineFormatted = `${month}/${day}/${year}`; // MM/DD/YYYY
      } else {
        // Fallback: if not in expected format, send raw value
        deadlineFormatted = rawDeadline;
      }
    }
    formData.append('deadline', deadlineFormatted);

    const API_BASE_URL = getApiBaseUrl();
    const requestUrl = `${API_BASE_URL}/taxpayer/esign/create/`;
    
    // Console log request data (excluding file content)
    console.log('ESign Create API Request:', {
      url: requestUrl,
      method: 'POST',
      data: {
        taxpayer_id,
        has_spouse,
        preparer_must_sign,
        folder_id,
        deadline,
        file: file ? { name: file.name, size: file.size, type: file.type } : null
      }
    });
    
    const response = await fetchWithCors(requestUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      // Check content-type before parsing JSON
      const contentType = response.headers.get('content-type');
      let errorData = {};
      
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json().catch(() => ({}));
      } else {
        const text = await response.text().catch(() => '');
        console.error('Non-JSON error response:', text.substring(0, 500));
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = { message: `Server returned non-JSON response (${response.status})` };
        }
      }
      
      // Console log the received JSON for debugging
      console.error('ESign Create API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData,
        fullError: JSON.stringify(errorData, null, 2)
      });

      // Extract clean error message from ErrorDetail structures
      let errorMessage = errorData.message || errorData.detail || `HTTP error! status: ${response.status}`;

      // Handle ErrorDetail structures in message
      if (typeof errorMessage === 'string' && errorMessage.includes('ErrorDetail')) {
        try {
          const errorDetailMatches = errorMessage.match(/ErrorDetail\(string=['"]([^'"]+)['"]/g);
          if (errorDetailMatches && errorDetailMatches.length > 0) {
            const errorMessages = errorDetailMatches.map(match => {
              const stringMatch = match.match(/string=['"]([^'"]+)['"]/);
              return stringMatch ? stringMatch[1] : null;
            }).filter(Boolean);

            if (errorMessages.length > 0) {
              errorMessage = errorMessages.join('. ');
            }
          }
        } catch (parseError) {
          console.log('Could not parse ErrorDetail structure:', errorMessage);
        }
      }

      // Handle errors object with ErrorDetail structures
      if (errorData.errors && typeof errorData.errors === 'object') {
        try {
          const cleanErrors = [];
          Object.entries(errorData.errors).forEach(([field, errorValue]) => {
            if (typeof errorValue === 'string' && errorValue.includes('ErrorDetail')) {
              const stringMatch = errorValue.match(/ErrorDetail\(string=['"]([^'"]+)['"]/);
              if (stringMatch) {
                cleanErrors.push(stringMatch[1]);
              }
            } else if (Array.isArray(errorValue)) {
              errorValue.forEach(err => {
                if (typeof err === 'string' && err.includes('ErrorDetail')) {
                  const stringMatch = err.match(/ErrorDetail\(string=['"]([^'"]+)['"]/);
                  if (stringMatch) {
                    cleanErrors.push(stringMatch[1]);
                  } else if (typeof err === 'string') {
                    cleanErrors.push(err);
                  }
                } else if (typeof err === 'string') {
                  cleanErrors.push(err);
                }
              });
            } else if (typeof errorValue === 'string') {
              cleanErrors.push(errorValue);
            }
          });

          if (cleanErrors.length > 0) {
            errorMessage = cleanErrors.join('. ');
          }
        } catch (parseError) {
          console.log('Could not parse errors object:', errorData.errors);
        }
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Get pending client invites
  // GET /user/tax-preparer/clients/invites/pending/
  getPendingInvites: async (params = {}) => {
    const { page, page_size } = params;
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (page_size) queryParams.append('page_size', page_size);
    const queryString = queryParams.toString();
    return await apiRequest(`/user/tax-preparer/clients/invites/pending/${queryString ? `?${queryString}` : ''}`, 'GET');
  },
  // Bulk taxpayer import - Step 1: Preview
  bulkImportTaxpayersPreview: async (csvFile) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('csv_file', csvFile);

    const url = `${API_BASE_URL}/taxpayer/firm-admin/taxpayers/import/preview/`;
    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    };

    const response = await fetchWithCors(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },
  // Bulk taxpayer import - Step 2: Confirm
  bulkImportTaxpayersConfirm: async (importLogId, rowsToImport, invitationOptions = {}) => {
    const payload = {
      import_log_id: importLogId,
      rows_to_import: rowsToImport
    };

    // Add invitation options if provided
    if (invitationOptions.invitation_timing) {
      payload.invitation_timing = invitationOptions.invitation_timing;
    }
    if (invitationOptions.rows_to_invite && Array.isArray(invitationOptions.rows_to_invite)) {
      payload.rows_to_invite = invitationOptions.rows_to_invite;
    }
    if (invitationOptions.invitation_preferences && typeof invitationOptions.invitation_preferences === 'object') {
      payload.invitation_preferences = invitationOptions.invitation_preferences;
    }
    // Add duplicate handling preferences if provided
    if (invitationOptions.duplicate_handling && typeof invitationOptions.duplicate_handling === 'object') {
      payload.duplicate_handling = invitationOptions.duplicate_handling;
    }

    return await apiRequest('/taxpayer/firm-admin/taxpayers/import/confirm/', 'POST', payload);
  },
  // Bulk taxpayer import - Send invitations manually
  bulkImportTaxpayersSendInvitations: async (importLogId, options = {}) => {
    const payload = {
      import_log_id: importLogId
    };

    if (options.taxpayer_ids && Array.isArray(options.taxpayer_ids)) {
      payload.taxpayer_ids = options.taxpayer_ids;
    }
    if (options.row_indices && Array.isArray(options.row_indices)) {
      payload.row_indices = options.row_indices;
    }

    return await apiRequest('/taxpayer/firm-admin/taxpayers/import/send-invitations/', 'POST', payload);
  }
};

// E-Sign Assign Document API functions
export const esignAssignAPI = {
  // Assign existing document to taxpayer for e-signing
  // POST /taxpayer/esign/custom/create/
  assignDocumentForESign: async (assignmentData) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_BASE_URL}/taxpayer/esign/custom/create/`;

    // Format deadline to MM/DD/YYYY if it's provided
    let deadlineFormatted = '';
    if (assignmentData.deadline) {
      const deadline = assignmentData.deadline;
      if (typeof deadline === 'string') {
        // Check if it's already in MM/DD/YYYY format
        if (deadline.includes('/')) {
          deadlineFormatted = deadline;
        } else {
          // Assume it's in YYYY-MM-DD format
          const datePart = deadline.split('T')[0];
          const parts = datePart.split('-');
          if (parts.length === 3) {
            const [year, month, day] = parts;
            deadlineFormatted = `${month}/${day}/${year}`;
          } else {
            deadlineFormatted = deadline;
          }
        }
      } else {
        deadlineFormatted = deadline.toString();
      }
    }

    // Prepare payload for custom/create endpoint
    const payload = {
      document_id: assignmentData.document_id,
      taxpayer_id: assignmentData.taxpayer_id,
      deadline: deadlineFormatted || assignmentData.deadline,
      fields: assignmentData.fields || [], // Default to empty array if not provided
    };

    // Add optional fields
    if (assignmentData.has_spouse !== undefined) {
      payload.has_spouse = assignmentData.has_spouse;
    }
    if (assignmentData.preparer_must_sign !== undefined) {
      payload.preparer_must_sign = assignmentData.preparer_must_sign;
    }
    if (assignmentData.message) {
      payload.message = assignmentData.message;
    }
    if (assignmentData.send_reminders !== undefined) {
      payload.send_reminders = assignmentData.send_reminders;
    }

    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || data.detail || `HTTP error! status: ${response.status}`);
        }
        return data;
      });
  },

  // Poll for e-sign document processing status
  // GET /taxpayer/esign/poll-status/{id}/
  pollESignStatus: async (esignDocumentId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_BASE_URL}/taxpayer/esign/poll-status/${esignDocumentId}/`;

    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || data.detail || `HTTP error! status: ${response.status}`);
        }
        return data;
      });
  }
};

// Tax Preparer Staff Invites API functions
export const taxPreparerStaffInvitesAPI = {
  // List pending staff invites
  getPendingInvites: async (params = {}) => {
    const { page, page_size, search, status } = params;
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (page_size) queryParams.append('page_size', page_size);
    if (search) queryParams.append('search', search);
    if (status) queryParams.append('status', status);
    const queryString = queryParams.toString();
    return await apiRequest(`/user/tax-preparer/staff-invites/pending/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Get invite details
  getInviteDetails: async (inviteId) => {
    return await apiRequest(`/user/tax-preparer/staff-invites/${inviteId}/`, 'GET');
  },

  // Accept invite
  acceptInvite: async (inviteId, data = {}) => {
    return await apiRequest(`/user/tax-preparer/staff-invites/${inviteId}/accept/`, 'POST', data);
  },

  // Decline invite
  declineInvite: async (inviteId, reason = null) => {
    const payload = reason ? { reason } : {};
    return await apiRequest(`/user/tax-preparer/staff-invites/${inviteId}/decline/`, 'POST', payload);
  },

  // List all invites (history)
  getAllInvites: async (params = {}) => {
    const { page, page_size, status, search, sort_by, sort_order } = params;
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (page_size) queryParams.append('page_size', page_size);
    if (status) queryParams.append('status', status);
    if (search) queryParams.append('search', search);
    if (sort_by) queryParams.append('sort_by', sort_by);
    if (sort_order) queryParams.append('sort_order', sort_order);
    const queryString = queryParams.toString();
    return await apiRequest(`/user/tax-preparer/staff-invites/${queryString ? `?${queryString}` : ''}`, 'GET');
  }
};

// Tax Preparer Document Manager API functions
export const taxPreparerDocumentsAPI = {
  // Browse shared documents (documents shared by Firm Admin)
  // GET /firm/staff/documents/browse/
  browseSharedDocuments: async (params = {}) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const { folder_id, show_archived, search, category_id, sort_by } = params;
    const queryParams = new URLSearchParams();

    if (folder_id !== undefined && folder_id !== null) {
      queryParams.append('folder_id', folder_id);
    }
    if (show_archived !== undefined) {
      queryParams.append('show_archived', show_archived);
    }
    if (search) {
      queryParams.append('search', search);
    }
    if (category_id !== undefined && category_id !== null) {
      queryParams.append('category_id', category_id);
    }
    if (sort_by) {
      queryParams.append('sort_by', sort_by);
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/firm/staff/documents/browse/${queryString ? `?${queryString}` : ''}`;

    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Create folder in shared documents
  // POST /firm/staff/documents/folders/create/
  createFolder: async (folderData) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(folderData)
    };

    return await fetchWithCors(`${API_BASE_URL}/firm/staff/documents/folders/create/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Get staff statistics for documents page
  // GET /taxpayer/staff/statistics/
  getStatistics: async () => {
    return await apiRequest('/taxpayer/staff/statistics/', 'GET');
  },

  // Upload documents to shared folder
  // POST /taxpayer/tax-preparer/documents/upload/
  uploadDocument: async (formData) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData
    };

    return await fetchWithCors(`${API_BASE_URL}/taxpayer/tax-preparer/documents/upload/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  }
};

export const taxPreparerThreadsAPI = {
  // List clients assigned to the authenticated staff member
  listAssignedClients: async () => {
    return await apiRequest('/firm/staff/clients/list/', 'GET');
  },
  // Get all chat threads for the current tax preparer
  // Uses tax-preparer specific endpoint
  getThreads: async (options = {}) => {
    const { status = null, search = null, client_id = null, unread_only = false } = options;
    const params = new URLSearchParams();

    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (client_id) params.append('client_id', client_id);
    if (unread_only) params.append('unread_only', 'true');

    const queryString = params.toString();
    // Use the Tax Preparer Chat Threads API endpoint
    const endpoint = queryString
      ? `/taxpayer/tax-preparer/chat-threads/?${queryString}`
      : `/taxpayer/tax-preparer/chat-threads/`;
    return await apiRequest(endpoint, 'GET');
  },
  // Create a new chat thread (Tax Preparer to client)
  // Uses JSON format with client_id, subject, assigned_staff_ids, and message
  createThread: async (threadData) => {
    const payload = {
      client_id: threadData.client_id,
      subject: threadData.subject,
      assigned_staff_ids: threadData.assigned_staff_ids || [],
      message: threadData.message || ''
    };

    const documentFile = threadData.document || threadData.attachment || null;

    if (documentFile) {
      const token = getAccessToken() || AUTH_TOKEN;
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('client_id', payload.client_id);
      formData.append('subject', payload.subject);
      if (payload.message) {
        formData.append('message', payload.message);
      }
      (payload.assigned_staff_ids || []).forEach((id) => {
        if (id !== undefined && id !== null) {
          formData.append('assigned_staff_ids[]', id);
        }
      });
      formData.append('document', documentFile);

      const response = await fetchWithCors(`${API_BASE_URL}/firm/staff/chats/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create chat thread');
      }
      return data;
    }

    return await apiRequest('/firm/staff/chats/create/', 'POST', payload);
  },
  // Get thread details with messages


  getThreadDetails: async (threadId) => {
    // Use the Chat Threads API endpoint
    return await apiRequest(`/taxpayer/chat-threads/${threadId}/`, 'GET');
  },
  // Send message in thread
  // Supports both text-only (JSON) and with file attachment (FormData)
  sendMessage: async (threadId, messageData) => {
    const token = getAccessToken() || AUTH_TOKEN;
    const hasAttachment = messageData.attachment || messageData.file;

    let config;
    let response;

    if (hasAttachment) {
      // Use FormData for file attachments
      const formData = new FormData();

      if (messageData.content) {
        formData.append('content', messageData.content);
      }

      if (messageData.message_type) {
        formData.append('message_type', messageData.message_type);
      }

      if (messageData.is_internal !== undefined) {
        // Convert boolean to capitalized string for Django FormData boolean fields
        // Django expects "True" or "False" (capitalized) for boolean form fields
        const isInternalValue = messageData.is_internal === true || messageData.is_internal === 'true' || messageData.is_internal === 'True';
        formData.append('is_internal', isInternalValue ? 'True' : 'False');
      }

      if (messageData.attachment) {
        formData.append('attachment', messageData.attachment);
      } else if (messageData.file) {
        formData.append('attachment', messageData.file);
      }

      config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it
        },
        body: formData
      };
    } else {
      // Use JSON for text-only messages
      config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageData.content || '',
          message_type: messageData.message_type || 'text',
          is_internal: messageData.is_internal === true || messageData.is_internal === 'true' || messageData.is_internal === 'True'
        })
      };
    }

    // Use the same endpoint as taxpayer (as per documentation)
    response = await fetchWithCors(`${API_BASE_URL}/taxpayer/chat-threads/${threadId}/send_message/`, config);

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401) {
      try {
        await refreshAccessToken();
        const newToken = getAccessToken() || AUTH_TOKEN;

        if (hasAttachment) {
          config.headers = {
            'Authorization': `Bearer ${newToken}`,
          };
        } else {
          config.headers = {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json',
          };
        }

        response = await fetchWithCors(`${API_BASE_URL}/taxpayer/chat-threads/${threadId}/send_message/`, config);

        if (response.status === 401) {
          clearUserData();
          window.location.href = getPathWithPrefix('/login');
          throw new Error('Session expired. Please login again.');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearUserData();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },
  // Get WebSocket configuration
  getWebSocketConfig: async () => {
    return await apiRequest('/taxpayer/tax-preparer/threads/websocket-config/', 'GET');
  },
  // Close thread (staff only)
  // Uses the same endpoint as taxpayer (as per documentation)
  closeThread: async (threadId) => {
    return await apiRequest(`/taxpayer/threads/${threadId}/close/`, 'POST');
  },
  // Reopen thread
  reopenThread: async (threadId) => {
    return await apiRequest(`/taxpayer/tax-preparer/threads/${threadId}/reopen/`, 'POST');
  },
  // Mark messages as read
  // Supports both old format (message_ids array) and new format (single message_id or all)
  markAsRead: async (threadId, messageIds) => {
    // If messageIds is an array, mark all messages (or use first one if single item)
    // If messageIds is a single number, mark that specific message
    // If messageIds is null/undefined, mark all messages
    const requestBody = messageIds
      ? (Array.isArray(messageIds)
        ? (messageIds.length === 1 ? { message_id: messageIds[0] } : {})
        : { message_id: messageIds })
      : {};

    // Use new chat-threads endpoint
    return await apiRequest(`/taxpayer/chat-threads/${threadId}/mark-read/`, 'POST', requestBody);
  },
  // Mark all messages as read in thread
  markAllAsRead: async (threadId) => {
    return await apiRequest(`/taxpayer/tax-preparer/threads/${threadId}/mark_all_read/`, 'POST');
  },
  // Archive thread
  archiveThread: async (threadId) => {
    return await apiRequest(`/taxpayer/tax-preparer/threads/${threadId}/archive/`, 'POST');
  },
  // Unarchive thread
  unarchiveThread: async (threadId) => {
    return await apiRequest(`/taxpayer/tax-preparer/threads/${threadId}/unarchive/`, 'POST');
  },
  // Delete message
  deleteMessage: async (threadId, messageId) => {
    return await apiRequest(`/taxpayer/tax-preparer/threads/${threadId}/messages/${messageId}/delete/`, 'DELETE');
  },
  // Edit message
  editMessage: async (threadId, messageId, content) => {
    return await apiRequest(`/taxpayer/tax-preparer/threads/${threadId}/messages/${messageId}/edit/`, 'PATCH', { content });
  },
  // Download message attachment
  // GET /api/chat-threads/<thread_id>/messages/<message_id>/download/
  downloadMessageAttachment: async (threadId, messageId) => {
    const token = getAccessToken() || AUTH_TOKEN;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetchWithCors(`${API_BASE_URL}/chat-threads/${threadId}/messages/${messageId}/download/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `Failed to download attachment: ${response.status}`);
    }

    // Get the blob data
    const blob = await response.blob();

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'attachment';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  },
  // Assign thread to staff member
  assignThread: async (threadId, staffIds) => {
    return await apiRequest(`/taxpayer/tax-preparer/threads/${threadId}/assign/`, 'POST', { staff_ids: staffIds });
  },
  // Get thread statistics
  getThreadStats: async () => {
    return await apiRequest('/taxpayer/tax-preparer/threads/stats/', 'GET');
  }
};

// Invoices API functions
// Taxpayer Firm Logo API
export const taxpayerFirmAPI = {
  // Get firm logo
  getFirmLogo: async () => {
    return await apiRequest('/taxpayer/firm/logo/', 'GET');
  },
  // Get office support information
  getOfficeSupport: async () => {
    return await apiRequest('/taxpayer/office/support/', 'GET');
  },
  // Set availability (for taxpayer/tax preparer)
  setAvailability: async (availabilityData) => {
    // For taxpayer, use the same endpoint but without staff_id
    return await apiRequest('/taxpayer/firm-admin/availability/set/', 'POST', availabilityData);
  },
};

export const invoicesAPI = {
  // Get all invoices for the current taxpayer
  getInvoices: async () => {
    return await apiRequest('/taxpayer/invoices/', 'GET');
  },
  // Create payment session for an invoice
  payInvoice: async (invoiceId, successUrl = null, cancelUrl = null) => {
    const payload = {};
    if (successUrl) {
      payload.success_url = successUrl;
    }
    if (cancelUrl) {
      payload.cancel_url = cancelUrl;
    }
    return await apiRequest(`/taxpayer/invoices/${invoiceId}/pay/`, 'POST', Object.keys(payload).length > 0 ? payload : null);
  }
};

// Payments API functions
export const paymentsAPI = {
  // Get completed payments only
  getCompletedPayments: async (params = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('status', 'completed');

    // Add optional query parameters
    if (params.page) {
      queryParams.append('page', params.page);
    }
    if (params.page_size) {
      queryParams.append('page_size', params.page_size);
    }
    if (params.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    if (params.search) {
      queryParams.append('search', params.search);
    }

    const queryString = queryParams.toString();
    return await apiRequest(`/taxpayer/payments/?${queryString}`, 'GET');
  },

  // Get all payments (with optional status filter)
  getPayments: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.status) {
      queryParams.append('status', params.status);
    }
    if (params.page) {
      queryParams.append('page', params.page);
    }
    if (params.page_size) {
      queryParams.append('page_size', params.page_size);
    }
    if (params.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    if (params.search) {
      queryParams.append('search', params.search);
    }

    const queryString = queryParams.toString();
    return await apiRequest(`/taxpayer/payments/${queryString ? `?${queryString}` : ''}`, 'GET');
  }
};

// Signature Requests API functions
export const signatureRequestsAPI = {
  // Get all signature requests for the current taxpayer
  getSignatureRequests: async (options = {}) => {
    const { filter = null, status = null, activeOnly = false, expiredOnly = false } = options;
    const params = new URLSearchParams();

    // Use new filter parameter if provided, otherwise fall back to old parameters for backward compatibility
    if (filter) {
      params.append('filter', filter);
    } else {
      // Legacy support for old parameters
      if (status) {
        params.append('status', status);
      }
      if (activeOnly) {
        params.append('active_only', 'true');
      }
      if (expiredOnly) {
        params.append('expired_only', 'true');
      }
    }

    const queryString = params.toString();
    const endpoint = queryString
      ? `/taxpayer/signatures/requests/?${queryString}`
      : '/taxpayer/signatures/requests/';
    return await apiRequest(endpoint, 'GET');
  },

  // Get pending signature requests
  getPendingSignatureRequests: async () => {
    return await apiRequest('/taxpayer/signatures/requests/?status=pending', 'GET');
  },

  // Get sent signature requests
  getSentSignatureRequests: async () => {
    return await apiRequest('/taxpayer/signatures/requests/?status=sent', 'GET');
  },

  // Get active signature requests (pending, sent, viewed)
  getActiveSignatureRequests: async () => {
    return await apiRequest('/taxpayer/signatures/requests/?active_only=true', 'GET');
  },

  // Get expired signature requests
  getExpiredSignatureRequests: async () => {
    return await apiRequest('/taxpayer/signatures/requests/?expired_only=true', 'GET');
  },

  // Poll e-signature document status
  // GET /api/taxpayer/esign/poll-status/<id>/
  pollESignStatus: async (esignDocumentId) => {
    if (!esignDocumentId) {
      throw new Error('esign_document_id is required');
    }
    return await apiRequest(`/taxpayer/esign/poll-status/${esignDocumentId}/`, 'GET');
  },

  // Check and regenerate signature fields
  checkSignatureFields: async (esignDocumentId, forceRegenerate = false) => {
    if (!esignDocumentId) {
      throw new Error('esign_document_id is required');
    }
    return await apiRequest(`/taxpayer/esign/check-fields/${esignDocumentId}/`, 'POST', {
      force_regenerate: forceRegenerate
    });
  },

  // Submit signature request
  submitSignatureRequest: async (signatureData) => {
    const {
      signature_request_id,
      signature_image,
      typed_text,
      spouse_signature_image,
      spouse_typed_text
    } = signatureData;

    const requestBody = {
      signature_request_id: signature_request_id
    };

    // Add primary signature - typed_text takes precedence over signature_image
    if (typed_text) {
      requestBody.typed_text = typed_text;
    } else if (signature_image) {
      requestBody.signature_image = signature_image;
    }

    // Add spouse signature - typed_text takes precedence over signature_image
    if (spouse_typed_text) {
      requestBody.spouse_typed_text = spouse_typed_text;
    } else if (spouse_signature_image) {
      requestBody.spouse_signature_image = spouse_signature_image;
    }

    return await apiRequest('/taxpayer/signatures/requests/submit/', 'POST', requestBody);
  },
};

// Custom E-Sign API functions
export const customESignAPI = {
  // Upload PDF document
  // POST /api/taxpayer/esign/custom/upload/
  uploadPDF: async (data) => {
    const { file, taxpayer_id, taxpayer_email, folder_id } = data;

    if (!file) {
      throw new Error('PDF file is required');
    }
    if (!taxpayer_id && !taxpayer_email) {
      throw new Error('Either taxpayer_id or taxpayer_email is required');
    }

    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('file', file);
    if (taxpayer_id) {
      formData.append('taxpayer_id', taxpayer_id.toString());
    }
    if (taxpayer_email) {
      formData.append('taxpayer_email', taxpayer_email);
    }
    if (folder_id !== undefined && folder_id !== null && folder_id !== '') {
      formData.append('folder_id', folder_id.toString());
    }

    const API_BASE_URL = getApiBaseUrl();
    const requestUrl = `${API_BASE_URL}/taxpayer/esign/custom/upload/`;

    const response = await fetchWithCors(requestUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorData = {};
      
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json().catch(() => ({}));
      } else {
        const text = await response.text().catch(() => '');
        errorData = { message: text || 'Upload failed' };
      }

      throw new Error(errorData.message || errorData.detail || `Upload failed: ${response.status}`);
    }

    return await response.json();
  },

  // Create e-sign request with custom fields
  // POST /api/taxpayer/esign/custom/create/
  createESignRequest: async (data) => {
    const {
      esign_draft_id,
      document_id,
      taxpayer_id,
      taxpayer_email,
      taxpayer_name,
      has_spouse,
      spouse_email,
      spouse_name,
      preparer_must_sign,
      deadline,
      message,
      send_reminders,
      fields,
      folder_id
    } = data;

    if (!esign_draft_id && !document_id) {
      throw new Error('Either esign_draft_id or document_id is required');
    }
    if (!taxpayer_id && !taxpayer_email) {
      throw new Error('Either taxpayer_id or taxpayer_email is required');
    }
    if (!deadline) {
      throw new Error('deadline is required');
    }
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      throw new Error('At least one field is required');
    }

    // Format deadline to MM/DD/YYYY
    let deadlineFormatted = '';
    if (deadline) {
      const datePart = deadline.toString().split('T')[0];
      const parts = datePart.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        deadlineFormatted = `${month}/${day}/${year}`;
      } else {
        deadlineFormatted = deadline.toString();
      }
    }

    const requestBody = {
      deadline: deadlineFormatted,
      fields: fields
    };

    if (esign_draft_id) requestBody.esign_draft_id = esign_draft_id;
    if (document_id) requestBody.document_id = document_id;
    if (taxpayer_id) requestBody.taxpayer_id = taxpayer_id;
    if (taxpayer_email) requestBody.taxpayer_email = taxpayer_email;
    if (taxpayer_name) requestBody.taxpayer_name = taxpayer_name;
    if (has_spouse !== undefined) requestBody.has_spouse = has_spouse;
    if (spouse_email) requestBody.spouse_email = spouse_email;
    if (spouse_name) requestBody.spouse_name = spouse_name;
    if (preparer_must_sign !== undefined) requestBody.preparer_must_sign = preparer_must_sign;
    if (message) requestBody.message = message;
    if (send_reminders !== undefined) requestBody.send_reminders = send_reminders;
    if (folder_id !== undefined && folder_id !== null && folder_id !== '') {
      requestBody.folder_id = folder_id.toString();
    }

    return await apiRequest('/taxpayer/esign/custom/create/', 'POST', requestBody);
  },

  // List e-sign documents
  // GET /api/taxpayer/esign/custom/list/
  listESignDocuments: async (options = {}) => {
    const { status, page, page_size } = options;
    const params = new URLSearchParams();
    
    if (status) params.append('status', status);
    if (page) params.append('page', page.toString());
    if (page_size) params.append('page_size', page_size.toString());

    const queryString = params.toString();
    const endpoint = queryString
      ? `/taxpayer/esign/custom/list/?${queryString}`
      : '/taxpayer/esign/custom/list/';
    
    return await apiRequest(endpoint, 'GET');
  },

  // Get e-sign document details
  // GET /api/taxpayer/esign/custom/<esign_id>/
  getESignDocument: async (esignId) => {
    if (!esignId) {
      throw new Error('esign_id is required');
    }
    return await apiRequest(`/taxpayer/esign/custom/${esignId}/`, 'GET');
  },

  // Refresh status from SignWell
  // POST /api/taxpayer/esign/custom/<esign_id>/refresh/
  refreshStatus: async (esignId) => {
    if (!esignId) {
      throw new Error('esign_id is required');
    }
    return await apiRequest(`/taxpayer/esign/custom/${esignId}/refresh/`, 'POST');
  },

  // Cancel/Delete e-sign document
  // DELETE /api/taxpayer/esign/custom/<esign_id>/
  deleteESignDocument: async (esignId) => {
    if (!esignId) {
      throw new Error('esign_id is required');
    }
    return await apiRequest(`/taxpayer/esign/custom/${esignId}/`, 'DELETE');
  },

  // List signature requests
  // GET /api/taxpayer/signatures/requests/
  listSignatureRequests: async () => {
    return await apiRequest('/taxpayer/signatures/requests/', 'GET');
  },

  // Submit signature with coordinates
  // POST /api/taxpayer/signatures/<request_id>/sign/
  submitSignature: async (requestId, signatureData) => {
    if (!requestId) {
      throw new Error('request_id is required');
    }
    return await apiRequest(`/taxpayer/signatures/${requestId}/sign/`, 'POST', signatureData);
  },
};

// SignWell API functions
export const signWellAPI = {
  // Extract signature fields from PDF
  extractFields: async (data) => {
    const { document_id, pdf_path, esign_id } = data;

    if (!document_id && !pdf_path && !esign_id) {
      throw new Error('Either document_id, pdf_path, or esign_id is required');
    }

    const requestBody = {};
    // Priority: pdf_path > esign_id > document_id
    if (pdf_path) {
      requestBody.pdf_path = pdf_path;
    } else if (esign_id) {
      requestBody.esign_id = esign_id;
    } else if (document_id) {
      requestBody.document_id = document_id;
    }

    return await apiRequest('/taxpayer/signwell/extract-fields/', 'POST', requestBody);
  },

  // Apply signature via SignWell

  // Check document status
  checkDocumentStatus: async (signwellDocumentId) => {
    if (!signwellDocumentId) {
      throw new Error('signwell_document_id is required');
    }

    return await apiRequest(`/taxpayer/signwell/document-status/${signwellDocumentId}/`, 'GET');
  },
};

// Documents API functions
export const documentsAPI = {
  // Get document categories for taxpayer
  // GET /taxpayer/document-categories/
  getDocumentCategories: async () => {
    return await apiRequest('/taxpayer/document-categories/', 'GET');
  },

  // Create new document category for taxpayer
  // POST /taxpayer/document-categories/
  createDocumentCategory: async (categoryData) => {
    return await apiRequest('/taxpayer/document-categories/', 'POST', categoryData);
  },

  // Get all document requests for the current taxpayer
  getDocumentRequests: async (options = {}) => {
    const {
      status = null,
      search = null,
      priority = null,
      page = null,
      page_size = null,
      sort_by = null
    } = options;

    const params = new URLSearchParams();

    if (status) {
      params.append('status', status);
    }
    if (search) {
      params.append('search', search);
    }
    if (priority) {
      params.append('priority', priority);
    }
    if (page) {
      params.append('page', page.toString());
    }
    if (page_size) {
      params.append('page_size', page_size.toString());
    }
    if (sort_by) {
      params.append('sort_by', sort_by);
    }

    const queryString = params.toString();
    const endpoint = queryString
      ? `/taxpayer/document-requests/?${queryString}`
      : '/taxpayer/document-requests/';
    return await apiRequest(endpoint, 'GET');
  },

  // Get all documents for the current taxpayer
  getDocuments: async () => {
    return await apiRequest('/taxpayer/documents/', 'GET');
  },

  // Submit documents for a document request
  submitDocumentRequest: async (requestId, formData) => {
    const token = getAccessToken() || AUTH_TOKEN;
    const API_BASE_URL = getApiBaseUrl();

    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - let browser set it with boundary
      },
      body: formData
    };

    let response = await fetchWithCors(`${API_BASE_URL}/taxpayer/document-requests/${requestId}/submit/`, config);

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401) {
      try {
        await refreshAccessToken();
        config.headers = {
          'Authorization': `Bearer ${getAccessToken() || AUTH_TOKEN}`,
        };
        response = await fetchWithCors(`${API_BASE_URL}/taxpayer/document-requests/${requestId}/submit/`, config);

        if (response.status === 401) {
          clearUserData();
          window.location.href = getPathWithPrefix('/login');
          throw new Error('Session expired. Please login again.');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearUserData();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Upload a document
  uploadDocument: async (formData) => {
    const token = getAccessToken() || AUTH_TOKEN;
    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - let browser set it with boundary
      },
      body: formData
    };

    let response = await fetchWithCors(`${API_BASE_URL}/taxpayer/documents/upload/`, config);

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401) {
      try {
        await refreshAccessToken();
        config.headers = {
          'Authorization': `Bearer ${getAccessToken() || AUTH_TOKEN}`,
        };
        response = await fetchWithCors(`${API_BASE_URL}/taxpayer/documents/upload/`, config);

        if (response.status === 401) {
          clearUserData();
          window.location.href = getPathWithPrefix('/login');
          throw new Error('Session expired. Please login again.');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearUserData();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }
};

// Folder Trash API functions
export const folderTrashAPI = {
  // Trash a folder (moves folder and all contents to trash)
  trashFolder: async (folderId) => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/folders/${folderId}/trash/`, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error trashing folder:', error);
      throw error;
    }
  },

  // Recover a folder from trash
  recoverFolder: async (folderId) => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/folders/${folderId}/recover/`, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error recovering folder:', error);
      throw error;
    }
  },

  // Get all trashed folders
  getTrashedFolders: async (search = '', sortBy = '-trashed_at', page = 1, pageSize = 20) => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (sortBy) params.append('sort_by', sortBy);
      if (page) params.append('page', page.toString());
      if (pageSize) params.append('page_size', pageSize.toString());

      const queryString = params.toString();
      const url = `${API_BASE_URL}/taxpayer/folders/trashed/${queryString ? `?${queryString}` : ''}`;

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching trashed folders:', error);
      throw error;
    }
  }
};

// Staff Invite API functions
export const invitationAPI = {
  // Validate invitation token (public endpoint, no auth required)
  validateInvitation: async (token) => {
    const params = new URLSearchParams({ token });
    const endpoint = `/user/staff-invite/validate/?${params}`;
    console.log('Validate invitation endpoint:', endpoint);
    console.log('Full URL will be:', `${API_BASE_URL}${endpoint}`);
    return await publicApiRequest(endpoint, 'GET');
  },

  // Accept invitation with password and phone number (public endpoint, no auth required)
  acceptInvitation: async (token, password, passwordConfirm, phoneNumber = null) => {
    const payload = {
      token,
      password,
      password_confirm: passwordConfirm,
    };

    if (phoneNumber) {
      payload.phone_number = phoneNumber;
    }

    return await publicApiRequest('/user/staff-invite/accept/', 'POST', payload);
  },

  // Decline invitation with token and optional invite type
  declineInvitation: async (token, inviteType = 'client') => {
    const payload = {
      token,
      invite_type: inviteType || 'client'
    };
    return await publicApiRequest('/user/staff-invite/decline/', 'POST', payload);
  }
};

// Client Invite API functions
export const clientInviteAPI = {
  // Validate client invitation token (public endpoint, no auth required)
  // Returns: { success: true, is_valid: true, data: {...}, existing_grant: {...} }
  validateClientInvite: async (token) => {
    const params = new URLSearchParams({ token });
    const endpoint = `/user/client-invite/validate/?${params}`;
    return await publicApiRequest(endpoint, 'GET');
  },

  // Accept client invitation with password, phone number, and optional data sharing scope
  // Returns: { success: true, message: "...", data: {...} } or warning response
  acceptClientInvite: async (token, password, passwordConfirm, phoneNumber = null, dataSharingScope = null, selectedCategories = null) => {
    const payload = {
      token,
      password,
      password_confirm: passwordConfirm,
    };

    if (phoneNumber) {
      payload.phone_number = phoneNumber;
    }

    if (dataSharingScope) {
      payload.data_sharing_scope = dataSharingScope;
    }

    if (selectedCategories && Array.isArray(selectedCategories) && selectedCategories.length > 0) {
      payload.selected_categories = selectedCategories;
    }

    return await publicApiRequest('/user/client-invite/accept/', 'POST', payload);
  }
};

// Firm Admin Messaging API functions
export const firmAdminMessagingAPI = {
  // List all conversations
  listConversations: async (params = {}) => {
    const { status, search, type } = params;
    const queryParams = new URLSearchParams();

    if (status) queryParams.append('status', status);
    if (search) queryParams.append('search', search);
    if (type) queryParams.append('type', type);

    const queryString = queryParams.toString();
    return await apiRequest(`/taxpayer/firm-admin/messages/conversations/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Get thread details
  // GET /taxpayer/chat-threads/{id}/
  getThreadDetails: async (threadId) => {
    return await apiRequest(`/taxpayer/chat-threads/${threadId}/`, 'GET');
  },

  // Get messages in a thread
  // GET /taxpayer/chat-threads/{id}/messages/?page=1&page_size=50
  getMessages: async (threadId, params = {}) => {
    const { page = 1, page_size = 50 } = params;
    const queryParams = new URLSearchParams();

    if (page) queryParams.append('page', page.toString());
    if (page_size) queryParams.append('page_size', page_size.toString());

    const queryString = queryParams.toString();
    return await apiRequest(`/taxpayer/chat-threads/${threadId}/messages/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Compose/Create a Chat Thread
  // POST /taxpayer/firm-admin/messages/compose/
  // Accepts: { target_user_id }
  composeMessage: async (messageData) => {
    const token = getAccessToken() || AUTH_TOKEN;

    // Prepare JSON payload - only target_user_id is required
    const payload = {
      target_user_id: messageData.target_user_id
    };

    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload)
    };

    console.log('Compose Message API Request URL:', `${API_BASE_URL}/taxpayer/firm-admin/messages/compose/`);
    console.log('Compose Message API Request Payload:', payload);

    const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/firm-admin/messages/compose/`, config);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Compose Message Error Response:', errorData);

        if (errorData.errors) {
          const fieldErrors = Object.entries(errorData.errors)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage = `${errorData.message || 'Validation failed'}. ${fieldErrors}`;
        } else {
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        }
      } catch (parseError) {
        console.error('Error parsing compose message response:', parseError);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Search recipients
  searchRecipients: async (params = {}) => {
    const { q, type } = params;
    const queryParams = new URLSearchParams();

    if (q) queryParams.append('q', q);
    if (type) queryParams.append('type', type);

    const queryString = queryParams.toString();
    return await apiRequest(`/firm-admin/messages/recipients/search/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Get Active Users
  // GET /seqwens/api/firm/users/active/
  // Query params: search (string), role (string: 'client', 'staff', 'admin')
  getActiveUsers: async (params = {}) => {
    const { search, role } = params;
    const queryParams = new URLSearchParams();

    if (search) queryParams.append('search', search);
    if (role) queryParams.append('role', role);

    const queryString = queryParams.toString();
    const url = `/firm/users/active/${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(url, 'GET');
  },

  // Get Active Service Pricing
  // GET /seqwens/api/firm/services/pricing/
  // Query params: search (string)
  getActiveServicePricing: async (params = {}) => {
    const { search } = params;
    const queryParams = new URLSearchParams();

    if (search) queryParams.append('search', search);

    const queryString = queryParams.toString();
    const url = `/firm/services/pricing/`;
    return await apiRequest(url, 'GET');
  },

  // Check Feedback Status
  // GET /accounts/feedback/status/
  getFeedbackStatus: async () => {
    const url = `/accounts/feedback/status/`;
    return await apiRequest(url, 'GET');
  },

  // Submit Feedback
  // POST /seqwens/api/user/feedback/
  // Body: { stars: string (1-5), comment: string, role: string }
  submitFeedback: async (feedbackData) => {
    const url = `/user/feedback/`;
    return await apiRequest(url, 'POST', feedbackData);
  },

  // Send a Message to a Thread
  // POST /taxpayer/chat-threads/{id}/send_message/
  // Accepts: { content, is_internal }
  sendMessage: async (threadId, messageData, attachment = null) => {
    const token = getAccessToken() || AUTH_TOKEN;

    if (attachment) {
      // Use FormData for multipart/form-data when attachment is present
      const formData = new FormData();
      formData.append('content', messageData.content || messageData.message || '');
      // Convert boolean to capitalized string for Django FormData boolean fields
      // Django expects "True" or "False" (capitalized) for boolean form fields
      const isInternalValue = messageData.is_internal !== undefined
        ? (messageData.is_internal === true || messageData.is_internal === 'true' || messageData.is_internal === 'True')
        : false;
      formData.append('is_internal', isInternalValue ? 'True' : 'False');
      formData.append('attachment', attachment);

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      };

      const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/chat-threads/${threadId}/send_message/`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } else {
      // Use JSON for regular requests without attachments
      // Map message to content if needed for backward compatibility
      const payload = {
        content: messageData.content || messageData.message || '',
        is_internal: messageData.is_internal === true || messageData.is_internal === 'true' || messageData.is_internal === 'True'
      };

      return await apiRequest(`/taxpayer/chat-threads/${threadId}/send_message/`, 'POST', payload);
    }
  },
  // Download message attachment
  // GET /api/chat-threads/<thread_id>/messages/<message_id>/download/
  downloadMessageAttachment: async (threadId, messageId) => {
    const token = getAccessToken() || AUTH_TOKEN;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetchWithCors(`${API_BASE_URL}/chat-threads/${threadId}/messages/${messageId}/download/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `Failed to download attachment: ${response.status}`);
    }

    // Get the blob data
    const blob = await response.blob();

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'attachment';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  }
};

// Firm Admin Settings API functions
export const firmAdminSettingsAPI = {
  // Get firm general information
  getGeneralInfo: async () => {
    return await apiRequest('/user/firm-admin/settings/general/', 'GET');
  },

  // Update firm general information
  updateGeneralInfo: async (settingsData, method = 'PATCH') => {
    return await apiRequest('/user/firm-admin/settings/general/', method, settingsData);
  },

  // Get firm branding information
  getBrandingInfo: async () => {
    return await apiRequest('/user/firm-admin/settings/branding/', 'GET');
  },

  // Update firm branding information
  updateBrandingInfo: async (brandingData, files = {}) => {
    const token = getAccessToken() || AUTH_TOKEN;
    const hasFiles = files.logo || files.favicon;

    if (hasFiles) {
      // Use FormData for multipart/form-data when files are present
      const formData = new FormData();

      // Add all form fields to FormData
      Object.keys(brandingData).forEach(key => {
        const value = brandingData[key];
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'boolean') {
            formData.append(key, value ? 'true' : 'false');
          } else {
            formData.append(key, value);
          }
        }
      });

      // Add files
      if (files.logo) {
        formData.append('logo', files.logo);
      }
      if (files.favicon) {
        formData.append('favicon', files.favicon);
      }

      const config = {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData
      };

      const response = await fetchWithCors(`${API_BASE_URL}/user/firm-admin/settings/branding/`, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.errors) {
            const fieldErrors = Object.entries(errorData.errors)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            errorMessage = `${errorData.message || 'Validation failed'}. ${fieldErrors}`;
          } else {
            errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } else {
      // Use JSON for regular requests without files
      return await apiRequest('/user/firm-admin/settings/branding/', 'PATCH', brandingData);
    }
  },

  // Get firm business information (business hours and regional settings)
  getBusinessInfo: async () => {
    return await apiRequest('/firm/business-hours-regional-settings/', 'GET');
  },

  // Update firm business information (business hours and regional settings)
  updateBusinessInfo: async (businessData, method = 'PATCH') => {
    return await apiRequest('/firm/business-hours-regional-settings/', method, businessData);
  },

  // Get firm services information
  getServicesInfo: async () => {
    return await apiRequest('/firm/services/', 'GET');
  },

  // Update firm services information
  updateServicesInfo: async (servicesData, method = 'PATCH') => {
    return await apiRequest('/firm/services/', method, servicesData);
  },

  // Get firm integrations information
  getIntegrationsInfo: async () => {
    return await apiRequest('/user/firm-admin/settings/integrations/', 'GET');
  },

  // Update firm integrations information
  updateIntegrationsInfo: async (integrationsData, method = 'POST') => {
    return await apiRequest('/user/firm-admin/settings/integrations/', method, integrationsData);
  },

  // Get firm advanced information
  getAdvancedInfo: async () => {
    return await apiRequest('/user/firm-admin/settings/advanced/', 'GET');
  },

  // Update firm advanced information
  updateAdvancedInfo: async (advancedData, method = 'POST') => {
    return await apiRequest('/user/firm-admin/settings/advanced/', method, advancedData);
  },

  // Get subdomain settings
  getSubdomainSettings: async () => {
    return await apiRequest('/firm/subdomain/settings/', 'GET');
  },

  // Check subdomain availability
  checkSubdomainAvailability: async (subdomain) => {
    return await apiRequest(`/firm/subdomain/check/?subdomain=${encodeURIComponent(subdomain)}`, 'GET');
  },

  // Get support email configuration
  getSupportEmail: async () => {
    return await apiRequest('/user/firm-admin/settings/support-email/', 'GET');
  },

  // Update support email configuration
  updateSupportEmail: async (supportEmailData, method = 'PUT') => {
    return await apiRequest('/user/firm-admin/settings/support-email/', method, supportEmailData);
  },

  // Update subdomain settings
  updateSubdomainSettings: async (subdomainData, files = {}) => {
    const token = getAccessToken() || AUTH_TOKEN;
    const hasFiles = files.logo || files.favicon;

    if (hasFiles) {
      // Use FormData for multipart/form-data when files are present
      const formData = new FormData();

      // Add all form fields to FormData
      Object.keys(subdomainData).forEach(key => {
        const value = subdomainData[key];
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'boolean') {
            // Django expects capitalized boolean strings in FormData: "True" or "False"
            formData.append(key, value ? 'True' : 'False');
          } else {
            formData.append(key, value);
          }
        }
      });

      // Add files
      if (files.logo) {
        formData.append('logo', files.logo);
      }
      if (files.favicon) {
        formData.append('favicon', files.favicon);
      }

      const config = {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData
      };

      const response = await fetchWithCors(`${API_BASE_URL}/firm/subdomain/settings/`, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.errors) {
            const fieldErrors = Object.entries(errorData.errors)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            errorMessage = `${errorData.message || 'Validation failed'}. ${fieldErrors}`;
          } else {
            errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } else {
      // Use JSON for regular requests without files
      return await apiRequest('/firm/subdomain/settings/', 'PATCH', subdomainData);
    }
  },

  // Delete firm account
  // DELETE /firm/account/delete/
  // Accepts: { password, confirmation_text (optional) }
  deleteAccount: async (password, confirmationText = null) => {
    const token = getAccessToken() || AUTH_TOKEN;

    const payload = {
      password: password
    };

    // Add confirmation_text if provided
    if (confirmationText) {
      payload.confirmation_text = confirmationText;
    }

    const config = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload)
    };

    console.log('Delete Account API Request URL:', `${API_BASE_URL}/firm/account/delete/`);
    console.log('Delete Account API Request Payload:', { password: '***', confirmation_text: confirmationText });

    const response = await fetchWithCors(`${API_BASE_URL}/firm/account/delete/`, config);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Delete Account Error Response:', errorData);

        if (errorData.errors) {
          const fieldErrors = Object.entries(errorData.errors)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage = `${errorData.message || 'Validation failed'}. ${fieldErrors}`;
        } else {
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        }
      } catch (parseError) {
        console.error('Error parsing delete account response:', parseError);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Get watermark settings
  getWatermarkSettings: async () => {
    return await apiRequest('/user/firm-admin/settings/watermark/', 'GET');
  },

  // Update watermark settings
  updateWatermarkSettings: async (watermarkData) => {
    return await apiRequest('/user/firm-admin/settings/watermark/', 'PATCH', watermarkData);
  },
};

// Firm Admin Invoice Management API functions
export const firmAdminInvoiceAPI = {
  // Get invoice details
  getInvoiceDetails: async (invoiceId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(`${API_BASE_URL}/firm/invoices/${invoiceId}/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Update invoice
  updateInvoice: async (invoiceId, updateData) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    };

    return await fetchWithCors(`${API_BASE_URL}/firm/invoices/${invoiceId}/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle validation errors
          if (response.status === 400 && errorData.errors) {
            const error = new Error(errorData.message || 'Validation failed');
            error.fieldErrors = errorData.errors;
            error.status = response.status;
            throw error;
          }

          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  },

  // Send invoice to client via email
  sendInvoice: async (invoiceId, message = '') => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    };

    return await fetchWithCors(`${API_BASE_URL}/firm/invoices/${invoiceId}/send/`, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  }
};

// Firm Admin Billing History API functions
export const firmAdminBillingHistoryAPI = {
  // Get billing history with optional filters
  // Returns all invoices for tax preparer's assigned tax payers within the firm
  getBillingHistory: async (params = {}) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const {
      tax_preparer_id,
      client_id,
      status,
      start_date,
      end_date,
      search,
      page = 1,
      page_size = 20,
      sort_by = '-issue_date',
      include_payments = false
    } = params;

    const queryParams = new URLSearchParams();

    if (tax_preparer_id) queryParams.append('tax_preparer_id', tax_preparer_id.toString());
    if (client_id) queryParams.append('client_id', client_id.toString());
    if (status) queryParams.append('status', status);
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    if (search) queryParams.append('search', search);
    if (page) queryParams.append('page', page.toString());
    if (page_size) queryParams.append('page_size', page_size.toString());
    if (sort_by) queryParams.append('sort_by', sort_by);
    if (include_payments) queryParams.append('include_payments', 'true');

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/user/firm-admin/billing-history/${queryString ? `?${queryString}` : ''}`;

    const config = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    return await fetchWithCors(url, config)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
      });
  }
};

// Firm Admin Payment Methods API functions
export const firmAdminPaymentMethodsAPI = {
  // Get payment methods
  getPaymentMethods: async () => {
    return await apiRequest('/user/firm-admin/payment-methods/', 'GET');
  },
  // Add payment method
  addPaymentMethod: async (paymentMethodData) => {
    return await apiRequest('/user/firm-admin/payment-methods/', 'POST', paymentMethodData);
  },
  // Delete payment method
  deletePaymentMethod: async (paymentMethodId) => {
    return await apiRequest(`/firm-admin/payment-methods/${paymentMethodId}/`, 'DELETE');
  },
};

// Firm Admin Subscription API functions
export const firmAdminSubscriptionAPI = {
  // Cancel subscription
  cancelSubscription: async (subscriptionType) => {
    return await apiRequest('/user/firm-admin/subscription/cancel/', 'POST', {
      subscription_type: subscriptionType
    });
  },
  // Change subscription plan
  changeSubscription: async (subscriptionPlanId, billingCycle, paymentMethod = 'stripe', changeImmediately = true, successUrl = null, cancelUrl = null, paymentMethodId = null, isDjangoId = false) => {
    const payload = {
      subscription_plan_id: subscriptionPlanId,
      billing_cycle: billingCycle,
      payment_method: paymentMethod,
      change_immediately: changeImmediately
    };

    if (successUrl) {
      payload.success_url = successUrl;
    }

    if (cancelUrl) {
      payload.cancel_url = cancelUrl;
    }

    // If payment method ID is provided
    if (paymentMethodId) {
      if (isDjangoId) {
        // If it's a Django payment method ID (database ID), use saved_payment_method_id
        // The backend will look up the Stripe payment method ID from its database
        payload.saved_payment_method_id = paymentMethodId;
      } else {
        // If it's a Stripe payment method ID (pm_xxxxx), use payment_method_id
        payload.payment_method_id = paymentMethodId;
      }
    }

    return await apiRequest('/user/firm-admin/subscription/change/', 'POST', payload);
  },
  // Get Stripe publishable key
  getStripePublishableKey: async () => {
    return await apiRequest('/user/firm-admin/subscription/stripe-publishable-key/', 'GET');
  },
  // Get auto-renewal settings
  getAutoRenewalSettings: async () => {
    return await apiRequest('/user/firm-admin/settings/auto-renewal/', 'GET');
  },
  // Update auto-renewal settings
  updateAutoRenewalSettings: async (settings) => {
    return await apiRequest('/user/firm-admin/settings/auto-renewal/', 'PATCH', settings);
  },
};

// Firm Admin Blocked Accounts & Invites API functions
export const firmAdminBlockedAccountsAPI = {
  // Get blocked accounts
  // GET /accounts/firm-admin/blocked-accounts/?page=1&page_size=20&search=john
  getBlockedAccounts: async ({ search = '', page = 1, page_size = 20 } = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: page_size.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    return await apiRequest(`/user/firm-admin/blocked-accounts/?${params}`, 'GET');
  },

  // Block a user
  // POST /accounts/firm-admin/blocked-accounts/{user_id}/block/
  blockAccount: async (userId, { block_duration_hours, reason }) => {
    return await apiRequest(`/user/firm-admin/blocked-accounts/${userId}/block/`, 'POST', {
      block_duration_hours,
      reason
    });
  },

  // Unblock a user
  // POST /accounts/firm-admin/blocked-accounts/{user_id}/unblock/
  unblockAccount: async (userId) => {
    return await apiRequest(`/user/firm-admin/blocked-accounts/${userId}/unblock/`, 'POST');
  },

  // Approve invite
  // POST /accounts/firm-admin/invites/{invite_id}/approve/
  approveInvite: async (inviteId) => {
    return await apiRequest(`/user/firm-admin/invites/${inviteId}/approve/`, 'POST');
  },

  // Decline invite
  // POST /accounts/firm-admin/invites/{invite_id}/decline/
  declineInvite: async (inviteId, { reason }) => {
    return await apiRequest(`/user/firm-admin/invites/${inviteId}/decline/`, 'POST', {
      reason
    });
  },
};

// Firm Admin Geo Restrictions API functions
export const firmAdminGeoRestrictionsAPI = {
  // List available geo locations
  // GET /accounts/firm-admin/geo-locations/
  getGeoLocations: async () => {
    return await apiRequest('/user/firm-admin/geo-locations/', 'GET');
  },

  // List all geo restrictions
  // GET /accounts/firm-admin/geo-restrictions/?include_inactive=true
  getGeoRestrictions: async ({ include_inactive = false } = {}) => {
    const params = new URLSearchParams();
    if (include_inactive) {
      params.append('include_inactive', 'true');
    }
    const queryString = params.toString();
    return await apiRequest(`/user/firm-admin/geo-restrictions/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Create or update geo restriction (upsert)
  // POST /accounts/firm-admin/geo-restrictions/create/
  createOrUpdateGeoRestriction: async (data) => {
    const { region, session_timeout_minutes, description, country_codes, is_active = true } = data;
    const payload = {
      region,
      session_timeout_minutes,
      is_active
    };
    if (description) payload.description = description;
    if (country_codes && Array.isArray(country_codes)) payload.country_codes = country_codes;
    return await apiRequest('/user/firm-admin/geo-restrictions/create/', 'POST', payload);
  },

  // Get geo restriction details
  // GET /accounts/firm-admin/geo-restrictions/{restriction_id}/
  getGeoRestriction: async (restrictionId) => {
    return await apiRequest(`/user/firm-admin/geo-restrictions/${restrictionId}/`, 'GET');
  },

  // Update geo restriction
  // PUT /accounts/firm-admin/geo-restrictions/{restriction_id}/
  updateGeoRestriction: async (restrictionId, data) => {
    return await apiRequest(`/user/firm-admin/geo-restrictions/${restrictionId}/`, 'PUT', data);
  },

  // Delete geo restriction
  // DELETE /accounts/firm-admin/geo-restrictions/{restriction_id}/
  deleteGeoRestriction: async (restrictionId) => {
    return await apiRequest(`/user/firm-admin/geo-restrictions/${restrictionId}/`, 'DELETE');
  },
};

// Workflow Management API functions
export const workflowAPI = {
  // Get available tax form types
  getFormTypes: async () => {
    return await apiRequest('/taxpayer/firm/workflows/form-types/', 'GET');
  },

  // Workflow Templates
  // List all workflow templates
  listTemplates: async (params = {}) => {
    const { search, tax_form_type, is_active } = params;
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (tax_form_type) queryParams.append('tax_form_type', tax_form_type);
    if (is_active !== undefined) queryParams.append('is_active', is_active);
    const queryString = queryParams.toString();
    return await apiRequest(`/taxpayer/firm/workflows/templates/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Get workflow template details
  getTemplate: async (templateId) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/`, 'GET');
  },

  // Create workflow template
  createTemplate: async (templateData) => {
    return await apiRequest('/taxpayer/firm/workflows/templates/', 'POST', templateData);
  },

  // Update workflow template
  updateTemplate: async (templateId, templateData) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/`, 'PATCH', templateData);
  },

  // Delete workflow template
  deleteTemplate: async (templateId) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/`, 'DELETE');
  },

  // Clone workflow template
  cloneTemplate: async (templateId, name) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/clone/`, 'POST', { name });
  },

  // Add stage to template
  addStage: async (templateId, stageData) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/stages/`, 'POST', stageData);
  },

  // Update stage
  updateStage: async (templateId, stageId, stageData) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/stages/${stageId}/`, 'PATCH', stageData);
  },

  // Delete stage
  deleteStage: async (templateId, stageId) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/stages/${stageId}/`, 'DELETE');
  },

  // Reorder stages
  reorderStages: async (templateId, stageOrders) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/reorder-stages/`, 'POST', { stage_orders: stageOrders });
  },

  // Add action to stage
  addAction: async (templateId, stageId, actionData) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/stages/${stageId}/actions/`, 'POST', actionData);
  },

  // Update action
  updateAction: async (templateId, stageId, actionId, actionData) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/stages/${stageId}/actions/${actionId}/`, 'PATCH', actionData);
  },

  // Delete action
  deleteAction: async (templateId, stageId, actionId) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/stages/${stageId}/actions/${actionId}/`, 'DELETE');
  },

  // Add trigger to stage
  addTrigger: async (templateId, stageId, triggerData) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/stages/${stageId}/triggers/`, 'POST', triggerData);
  },

  // Update trigger
  updateTrigger: async (templateId, stageId, triggerId, triggerData) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/stages/${stageId}/triggers/${triggerId}/`, 'PATCH', triggerData);
  },

  // Delete trigger
  deleteTrigger: async (templateId, stageId, triggerId) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/stages/${stageId}/triggers/${triggerId}/`, 'DELETE');
  },

  // Add reminder to stage
  addReminder: async (templateId, stageId, reminderData) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/stages/${stageId}/reminders/`, 'POST', reminderData);
  },

  // Update reminder
  updateReminder: async (templateId, stageId, reminderId, reminderData) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/stages/${stageId}/reminders/${reminderId}/`, 'PATCH', reminderData);
  },

  // Delete reminder
  deleteReminder: async (templateId, stageId, reminderId) => {
    return await apiRequest(`/taxpayer/firm/workflows/templates/${templateId}/stages/${stageId}/reminders/${reminderId}/`, 'DELETE');
  },

  // Workflow Instances
  // List workflow instances
  listInstances: async (params = {}) => {
    const { status, search, tax_case_id, assigned_preparer_id } = params;
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (search) queryParams.append('search', search);
    if (tax_case_id) queryParams.append('tax_case_id', tax_case_id);
    if (assigned_preparer_id) queryParams.append('assigned_preparer_id', assigned_preparer_id);
    const queryString = queryParams.toString();
    return await apiRequest(`/taxpayer/firm/workflows/instances/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Get workflow instance details
  getInstance: async (instanceId) => {
    return await apiRequest(`/taxpayer/firm/workflows/instances/${instanceId}/`, 'GET');
  },

  // Get workflow instance with description and logs
  getInstanceDescriptionLogs: async (instanceId) => {
    return await apiRequest(`/taxpayer/firm/workflows/instances/${instanceId}/description-logs/`, 'GET');
  },

  // Get workflow statistics
  getWorkflowStatistics: async () => {
    return await apiRequest('/taxpayer/firm/workflows/statistics/', 'GET');
  },

  // Start workflow for tax case
  startWorkflow: async (workflowData) => {
    return await apiRequest('/taxpayer/firm/workflows/instances/', 'POST', workflowData);
  },

  // Advance workflow to next stage
  advanceWorkflow: async (instanceId, targetStageId) => {
    return await apiRequest(`/taxpayer/firm/workflows/instances/${instanceId}/advance/`, 'POST', { target_stage_id: targetStageId });
  },

  // Pause workflow
  pauseWorkflow: async (instanceId) => {
    return await apiRequest(`/taxpayer/firm/workflows/instances/${instanceId}/pause/`, 'POST');
  },

  // Resume workflow
  resumeWorkflow: async (instanceId) => {
    return await apiRequest(`/taxpayer/firm/workflows/instances/${instanceId}/resume/`, 'POST');
  },

  // Complete workflow
  completeWorkflow: async (instanceId) => {
    return await apiRequest(`/taxpayer/firm/workflows/instances/${instanceId}/complete/`, 'POST');
  },

  // Delete workflow instance


  // Taxpayer Workflow APIs
  // Get taxpayer workflow
  getTaxpayerWorkflow: async () => {
    return await apiRequest('/taxpayer/workflow/', 'GET');
  },

  // Get workflow instance with documents
  getWorkflowInstanceWithDocuments: async (instanceId) => {
    return await apiRequest(`/taxpayer/workflows/instances/${instanceId}/documents/`, 'GET');
  },

  // Document Request APIs
  // Create document request
  createDocumentRequest: async (requestData) => {
    return await apiRequest('/taxpayer/workflows/document-requests/create/', 'POST', requestData);
  },

  // Upload document for request
  uploadDocumentForRequest: async (requestId, file, onProgress) => {
    const token = getAccessToken() || AUTH_TOKEN;
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            resolve({ success: true, data: xhr.responseText });
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || error.detail || `HTTP error! status: ${xhr.status}`));
          } catch (e) {
            reject(new Error(`HTTP error! status: ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      xhr.open('POST', `${API_BASE_URL}/taxpayer/workflows/document-requests/${requestId}/upload/`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      // Don't set Content-Type for FormData - let browser set it with boundary
      xhr.send(formData);
    });
  },

  // Verify documents
  verifyDocuments: async (requestId, verified, notes) => {
    return await apiRequest('/taxpayer/workflows/document-requests/verify/', 'POST', {
      document_request_id: requestId,
      verified: verified,
      notes: notes || ''
    });
  },

  // Get document request details
  getDocumentRequest: async (requestId) => {
    return await apiRequest(`/taxpayer/workflows/document-requests/${requestId}/`, 'GET');
  },

  // List document requests
  listDocumentRequests: async (params = {}) => {
    const { workflow_instance_id, status } = params;
    const queryParams = new URLSearchParams();
    if (workflow_instance_id) queryParams.append('workflow_instance_id', workflow_instance_id);
    if (status) queryParams.append('status', status);
    const queryString = queryParams.toString();
    return await apiRequest(`/taxpayer/workflows/document-requests/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Get storage usage
  getStorageUsage: async () => {
    return await apiRequest('/accounts/storage/usage/', 'GET');
  },

  // Delete workflow instance
  deleteWorkflowInstance: async (instanceId) => {
    return await apiRequest(`/taxpayer/firm/workflows/instances/${instanceId}/`, 'DELETE');
  },

  // Tax Preparer Workflows
  // List workflows for tax preparer
  listTaxPreparerWorkflows: async (params = {}) => {
    const { status, search } = params;
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (search) queryParams.append('search', search);
    const queryString = queryParams.toString();
    return await apiRequest(`/taxpayer/tax-preparer/workflows/${queryString ? `?${queryString}` : ''}`, 'GET');
  }
};

// Maintenance Mode API functions
export const maintenanceModeAPI = {
  // Get maintenance mode status
  getMaintenanceStatus: async () => {
    return await apiRequest('/user/maintenance-mode/status/', 'GET');
  },
  // Session timeout logout
  sessionTimeoutLogout: async () => {
    return await apiRequest('/user/session-timeout/logout/', 'POST');
  },

};

// Re-export utility functions for convenience
export { clearUserData } from './userUtils';
export { getLoginUrl } from './urlUtils';
