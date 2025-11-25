// CORS Configuration and Proxy Setup
// This file helps handle CORS issues when making API requests

// Development proxy configuration for Vite
export const corsConfig = {
  // If you're using Vite, you can configure a proxy in vite.config.js
  // This helps avoid CORS issues during development
  development: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000/seqwens',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
};

// Alternative API base URL for development (using proxy)
export const getApiBaseUrl = () => {
  // In development, use the Vite proxy to avoid CORS issues
  if (import.meta.env.DEV) {
    return '/api';
  }
  // In production, use the full URL
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
