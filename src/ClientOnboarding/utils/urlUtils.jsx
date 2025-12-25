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
 * Get the base path prefix for navigation
 * @returns {string} The base path prefix (e.g., '/seqwens-frontend')
 */
export const getBasePath = () => {
  return '/seqwens-frontend';
};

/**
 * Add base path prefix to a path if it doesn't already have it
 * @param {string} path - The path to normalize
 * @returns {string} The path with base prefix
 */
export const addBasePath = (path) => {
  const basePath = getBasePath();
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Check if path already includes base path
  if (cleanPath.startsWith(basePath)) {
    return cleanPath;
  }
  // Add base path prefix
  return `${basePath}${cleanPath}`;
};

/**
 * Navigate to a URL using the appropriate method
 * @param {string} path - The path to navigate to
 * @param {Function} navigate - React Router navigate function (optional)
 */
export const navigateToUrl = (path, navigate = null) => {
  if (navigate && typeof navigate === 'function') {
    // Use React Router navigate for internal navigation (respects basename)
    // Remove base path from navigate calls since basename handles it
    const cleanPath = path.startsWith('/seqwens-frontend') 
      ? path.replace('/seqwens-frontend', '') 
      : path;
    navigate(cleanPath);
  } else {
    // For window.location.href, include the base path prefix
    const normalizedPath = addBasePath(path);
    window.location.href = normalizedPath;
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
 * Get a path with base prefix for window.location.href
 * @param {string} path - The path (e.g., '/login', '/dashboard')
 * @returns {string} The path with base prefix (e.g., '/seqwens-frontend/login')
 */
export const getPathWithPrefix = (path) => {
  return addBasePath(path);
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
