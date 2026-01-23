// CORS Configuration and Proxy Setup
// This file helps handle CORS issues when making API requests

// Development proxy configuration for Vite
export const corsConfig = {
  // If you're using Vite, you can configure a proxy in vite.config.js
  // This helps avoid CORS issues during development
  development: {
    proxy: {
      '/api': {
        target: 'http://168.231.121.7/seqwens',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
};

// Alternative API base URL for development (using proxy)
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // If we're developing locally, use the hardcoded server IP
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://168.231.121.7/seqwens/api';
    }
    // In production/deployment, use the current host dynamically
    return `${protocol}//${hostname}/seqwens/api`;
  }
  return 'http://168.231.121.7/seqwens/api';
};

// Fallback API base URL for when proxy fails
export const getFallbackApiBaseUrl = () => {
  const isServer = import.meta.env.VITE_IS_SERVER === 'true';

  if (import.meta.env.DEV) {
    // In development, use proxy
    return '/api';
  }

  if (isServer) {
    return 'http://168.231.121.7/seqwens/api';
  } else {
    return 'http://168.231.121.7/seqwens/api';
  }
};

// CORS error handling
export const handleCorsError = (error) => {
  if (error.message.includes('CORS') ||
    error.message.includes('Access-Control-Allow-Origin') ||
    error.message.includes('Cross-Origin Request Blocked')) {
    return {
      isCorsError: true,
      message: 'CORS Error: Please ensure the server allows cross-origin requests or use a proxy.',
      suggestion: 'Try using the development proxy or contact the backend team to enable CORS.'
    };
  }
  return { isCorsError: false, message: error.message };
};

// Fetch with CORS handling
export const fetchWithCors = async (url, options = {}) => {
  const defaultOptions = {
    mode: 'cors',
    credentials: 'omit', // Don't send credentials to avoid CORS issues
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    return response;
  } catch (error) {
    const corsError = handleCorsError(error);
    if (corsError.isCorsError) {
      console.error('CORS Error:', corsError.message);
      console.error('Suggestion:', corsError.suggestion);
    }
    throw error;
  }
};
