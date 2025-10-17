import { getApiBaseUrl, fetchWithCors } from './corsConfig';
import { getAccessToken, getRefreshToken, setTokens, isTokenExpired, clearUserData } from './userUtils';

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

    const response = await fetchWithCors(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        
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
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Public API Request Error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
    }
    
    throw error;
  }
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

    console.log('API Request URL:', `${API_BASE_URL}${endpoint}`);
    console.log('API Request Config:', config);
    console.log('API Request Data:', data);

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
          window.location.href = '/login';
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
        console.error('API Error Response:', errorData);
        
        // If there are specific field errors, show them
        if (errorData.errors) {
          console.error('Field Validation Errors:', errorData.errors);
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

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API Request Error:', error);
    
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

    const response = await fetchWithCors(`${API_BASE_URL}/user/login/`, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Login Error Response:', errorData);
        
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

// Data Intake API functions
export const dataIntakeAPI = {
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
            window.location.href = '/login';
            throw new Error('Session expired. Please login again.');
          }
          
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          
          return await retryResponse.json();
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
