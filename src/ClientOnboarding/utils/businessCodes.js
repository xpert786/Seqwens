import { getApiBaseUrl, fetchWithCors } from '../utils/corsConfig';
import { getAccessToken } from '../utils/userUtils';

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

// Business Codes API functions
const businessCodesAPI = {
  // Search business codes with intelligent matching
  searchCodes: async (query, limit = 10) => {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      params.append('limit', limit.toString());

      const response = await fetchWithCors(
        `${API_BASE_URL}/user/business-codes/search/?${params}`,
        {
          method: 'GET',
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error searching business codes:', error);
      throw error;
    }
  },

  // Get all available business categories
  getCategories: async () => {
    try {
      const response = await fetchWithCors(
        `${API_BASE_URL}/user/business-codes/categories/`,
        {
          method: 'GET',
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching business categories:', error);
      throw error;
    }
  },

  // Validate user input against business codes
  validateInput: async (userInput) => {
    try {
      const response = await fetchWithCors(
        `${API_BASE_URL}/user/business-codes/validate/`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ user_input: userInput }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error validating business code input:', error);
      throw error;
    }
  },
};

// Function to get business suggestions based on search term
export const getBusinessSuggestions = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.length < 2) return [];

    const response = await businessCodesAPI.searchCodes(searchTerm);

    if (response.success && response.data) {
      // Transform API response to match component expectations
      return response.data.map(item => ({
        id: item.id,
        code: item.naics_code,
        naics_code: item.naics_code,
        title: item.title,
        description: item.description,
        category: item.category,
        scheduleC: item.category, // Map category to scheduleC for backward compatibility
        displayText: item.title,
        relevance_score: item.relevance_score || 0,
        matchType: 'api'
      }));
    }

    return [];
  } catch (error) {
    console.error('Error getting business suggestions:', error);
    // Fallback to empty array if API fails
    return [];
  }
};

// Function to validate user input
export const validateBusinessInput = async (userInput) => {
  try {
    const response = await businessCodesAPI.validateInput(userInput);
    return response;
  } catch (error) {
    console.error('Error validating business input:', error);
    // Return a default response if API fails
    return {
      success: false,
      data: {
        is_valid: false,
        matched_code: null,
        confidence: 0,
        suggestions: []
      }
    };
  }
};

// Function to get all business categories
export const getBusinessCategories = async () => {
  try {
    const response = await businessCodesAPI.getCategories();

    if (response.success && response.data) {
      return response.data;
    }

    return [];
  } catch (error) {
    console.error('Error getting business categories:', error);
    return [];
  }
};

// Legacy functions for backward compatibility (return empty/undefined)
export const getBusinessByCode = (code) => {
  // This function is now handled by the backend API
  console.warn('getBusinessByCode is deprecated. Use backend API search instead.');
  return null;
};

export const getScheduleCCategories = () => {
  // This function is now handled by the backend API
  console.warn('getScheduleCCategories is deprecated. Use getBusinessCategories() instead.');
  return [];
};

// Keep BUSINESS_TYPES for any fallback scenarios, but mark as deprecated
export const BUSINESS_TYPES = [];

