// URL Utility Functions
// Handles conditional URL logic based on server environment

/**
 * Get the base URL for the application
 * @returns {string} The base URL (server URL or localhost)
 */
export const getBaseUrl = () => {
  const isServer = import.meta.env.VITE_IS_SERVER === 'true';
  
  if (isServer) {
    // Use Vite server URL when server is true
    return 'http://168.231.121.7/seqwens-frontend';
  } else {
    // Use localhost URL when server is false
    return 'http://localhost:5173';
  }
};

/**
 * Get the login URL based on server environment
 * @returns {string} The login URL
 */
export const getLoginUrl = () => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/login`;
};

/**
 * Get a full URL for a given path
 * @param {string} path - The path to navigate to (e.g., '/login', '/dashboard')
 * @returns {string} The full URL
 */
export const getFullUrl = (path) => {
  const baseUrl = getBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Navigate to a URL using the appropriate method
 * @param {string} path - The path to navigate to
 * @param {Function} navigate - React Router navigate function (optional)
 */
export const navigateToUrl = (path, navigate = null) => {
  const fullUrl = getFullUrl(path);
  
  if (navigate && typeof navigate === 'function') {
    // Use React Router navigate for internal navigation
    navigate(path);
  } else {
    // Use window.location for external navigation
    window.location.href = fullUrl;
  }
};

/**
 * Navigate to login page using the appropriate method
 * @param {Function} navigate - React Router navigate function (optional)
 */
export const navigateToLogin = (navigate = null) => {
  navigateToUrl('/login', navigate);
};
