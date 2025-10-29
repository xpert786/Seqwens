import { getApiBaseUrl, getFallbackApiBaseUrl, fetchWithCors } from './corsConfig';
import { getAccessToken, getRefreshToken, setTokens, isTokenExpired, clearUserData } from './userUtils';
import { getLoginUrl } from './urlUtils';

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
            window.location.href = getLoginUrl();
            throw new Error('Session expired. Please login again.');
          }
          
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          
          return await retryResponse.json();
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
  }b
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
  }
};

// Dashboard API functions
export const dashboardAPI = {
  // Get initial dashboard data
  getInitialDashboard: async () => {
    return await apiRequest('/taxpayer/initial-dashboard/', 'GET');
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
    return await apiRequest('/taxpayer/appointments/', 'POST', appointmentData);
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
    return await apiRequest('/seqwens/api/taxpayer/appointments/staff/', 'GET');
  }
};
