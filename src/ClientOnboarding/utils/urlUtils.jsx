// URL Utility Functions
// Handles conditional URL logic based on server environment

/**
 * Get the base URL for the application
 * @returns {string} The base URL (server URL or localhost)
 */
export const getBaseUrl = () => {
  const isServer = import.meta.env.VITE_IS_SERVER === 'false';
  console.log('isServer', isServer);
  if (isServer) {
    return 'http://168.231.121.7/seqwens-frontend';
  } else {
    return 'http://localhost:5173';
  }
};

/**
 * Get the login URL based on server environmentWWWWWW
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

/**
 * Transform media URLs to use the server base URL
 * Ensures all media files are loaded from the correct server location
 * @param {string} mediaUrl - The media URL (can be relative, localhost, or full URL)
 * @returns {string} The transformed URL pointing to the server
 */
export const getMediaUrl = (mediaUrl) => {
  if (!mediaUrl) {
    return null;
  }

  // If URL already starts with http, check if it needs to be converted
  if (mediaUrl.startsWith('http')) {
    // Replace localhost URLs with server URL
    if (mediaUrl.includes('localhost:5173')) {
      return mediaUrl.replace('http://localhost:5173', 'http://168.231.121.7/seqwens');
    }
    // Already has full server URL
    return mediaUrl;
  }

  // Handle relative paths
  // If it's a relative path like /seqwens/media/firm_logos/testlogo.jpg
  if (mediaUrl.startsWith('/seqwens/')) {
    return `http://168.231.121.7${mediaUrl}`;
  }

  // If it's a path like /media/firm_logos/testlogo.jpg
  if (mediaUrl.startsWith('/media/')) {
    return `http://168.231.121.7/seqwens${mediaUrl}`;
  }

  // Default: prepend the server base URL
  const cleanPath = mediaUrl.startsWith('/') ? mediaUrl : `/${mediaUrl}`;
  return `http://168.231.121.7/seqwens${cleanPath}`;
};
