/**
 * Payment Methods Service
 * 
 * Handles all API calls for managing saved payment methods (cards) for firms.
 * This service communicates with the backend to:
 * - List saved payment methods
 * - Add new payment methods using Stripe Payment Method IDs
 * - Set default payment method
 * - Delete saved payment methods
 * - Get Stripe setup intent for adding new cards
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Get the authorization token from localStorage or sessionStorage
 * Uses the same logic as getAccessToken() in userUtils.jsx
 */
const getAuthToken = () => {
  // Check the appropriate storage based on rememberMe setting
  const sessionRememberMe = sessionStorage.getItem("rememberMe");
  let storage;

  if (sessionRememberMe !== null) {
    storage = sessionRememberMe === "true" ? localStorage : sessionStorage;
  } else {
    // Fallback to localStorage if no session preference
    const localRememberMe = localStorage.getItem("rememberMe");
    storage = localRememberMe === "true" ? localStorage : sessionStorage;
  }

  return storage.getItem("accessToken");
};

/**
 * Configure axios headers with authentication
 */
const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`,
  };
};

/**
 * List all saved payment methods for the firm
 * 
 * Returns:
 * {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     payment_methods: [
 *       {
 *         id: number,
 *         brand: "visa" | "mastercard" | etc,
 *         last4: "4242",
 *         exp_month: 12,
 *         exp_year: 2025,
 *         is_primary: boolean,
 *         is_default: boolean,
 *         created_at: ISO timestamp,
 *         updated_at: ISO timestamp
 *       }
 *     ]
 *   }
 * }
 */
export const getSavedCards = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/accounts/firm-admin/saved-cards/`,
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching saved cards:', error);
    throw error.response?.data || { 
      success: false, 
      message: error.message 
    };
  }
};

/**
 * Add a new payment method using Stripe Payment Method ID
 * 
 * This is called after the frontend has created a payment method using Stripe Elements.
 * The Stripe payment method ID (pm_...) should already exist at this point.
 * 
 * @param {string} paymentMethodId - Stripe Payment Method ID (pm_...)
 * @param {boolean} setAsDefault - Whether to set as default (default: true)
 * 
 * Returns:
 * {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     id: number,
 *     stripe_payment_method_id: "pm_...",
 *     brand: "visa",
 *     last4: "4242",
 *     exp_month: 12,
 *     exp_year: 2025,
 *     is_primary: boolean,
 *     is_default: boolean,
 *     created_at: ISO timestamp,
 *     updated_at: ISO timestamp
 *   }
 * }
 */
export const addPaymentMethod = async (paymentMethodId, setAsDefault = true) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/accounts/firm-admin/saved-cards/`,
      {
        payment_method_id: paymentMethodId,
        set_as_default: setAsDefault,
      },
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error.response?.data || { 
      success: false, 
      message: error.message 
    };
  }
};

/**
 * Get a specific saved payment method
 * 
 * @param {number} cardId - Database ID of the payment method
 */
export const getCardDetail = async (cardId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/accounts/firm-admin/saved-cards/${cardId}/`,
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching card ${cardId}:`, error);
    throw error.response?.data || { 
      success: false, 
      message: error.message 
    };
  }
};

/**
 * Delete a saved payment method
 * 
 * @param {number} cardId - Database ID of the payment method to delete
 * 
 * Returns:
 * {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     was_default: boolean,
 *     remaining_payment_methods: number
 *   }
 * }
 */
export const deleteCard = async (cardId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/accounts/firm-admin/saved-cards/${cardId}/`,
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error(`Error deleting card ${cardId}:`, error);
    throw error.response?.data || { 
      success: false, 
      message: error.message 
    };
  }
};

/**
 * Set a payment method as the default
 * 
 * @param {number} paymentMethodId - Database ID of the payment method to set as default
 * 
 * Returns:
 * {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     id: number,
 *     stripe_payment_method_id: "pm_...",
 *     brand: "visa",
 *     last4: "4242",
 *     exp_month: 12,
 *     exp_year: 2025,
 *     is_primary: boolean,
 *     is_default: boolean,
 *     created_at: ISO timestamp,
 *     updated_at: ISO timestamp
 *   }
 * }
 */
export const setDefaultCard = async (paymentMethodId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/accounts/firm-admin/saved-cards/set-default/`,
      { payment_method_id: paymentMethodId },
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error(`Error setting default card ${paymentMethodId}:`, error);
    throw error.response?.data || { 
      success: false, 
      message: error.message 
    };
  }
};

/**
 * Get a Stripe Setup Intent for adding a new payment method
 * 
 * This creates a setup intent that can be used with Stripe Elements
 * to securely collect card information without the backend ever seeing it.
 * 
 * Returns:
 * {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     client_secret: "seti_...",
 *     stripe_customer_id: "cus_...",
 *     setup_intent_id: "seti_..."
 *   }
 * }
 */
export const getStripeSetupIntent = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/accounts/stripe/setup-intent/`,
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting Stripe setup intent:', error);
    throw error.response?.data || { 
      success: false, 
      message: error.message 
    };
  }
};

export default {
  getSavedCards,
  addPaymentMethod,
  getCardDetail,
  deleteCard,
  setDefaultCard,
  getStripeSetupIntent,
};
