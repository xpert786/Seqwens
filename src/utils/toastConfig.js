/**
 * Centralized Toast Configuration
 * All toast notifications should use these standardized options
 */

export const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  newestOnTop: false,
  closeOnClick: true,
  rtl: false,
  pauseOnFocusLoss: true,
  draggable: true,
  pauseOnHover: false,
  theme: "light",
  toastClassName: "custom-toast",
};

/**
 * Standard toast options for different types
 * Use these when calling toast.success(), toast.error(), etc.
 */
export const toastOptions = {
  success: {
    ...toastConfig,
  },
  error: {
    ...toastConfig,
  },
  info: {
    ...toastConfig,
  },
  warning: {
    ...toastConfig,
  },
};

/**
 * Helper function to get standardized toast options
 * @param {Object} overrides - Optional overrides for specific cases (e.g., autoClose: 5000)
 * @returns {Object} Standardized toast options
 */
export const getToastOptions = (overrides = {}) => {
  return {
    ...toastConfig,
    ...overrides,
  };
};

