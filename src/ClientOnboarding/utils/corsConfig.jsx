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
  // Use proxy in development, direct URL in production
  if (import.meta.env.DEV) {
    return '/api'; // This will use the Vite proxy
  }
  return 'http://168.231.121.7/seqwens/api';
};

// Fallback API base URL for when proxy fails
export const getFallbackApiBaseUrl = () => {
  return 'http://168.231.121.7/seqwens/api';
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
    credentials: 'include', // Include credentials for authenticated requests
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    }
  };

  const finalOptions = { ...defaultOptions, ...options };
  
  console.log('fetchWithCors - URL:', url);
  console.log('fetchWithCors - Options:', finalOptions);
  console.log('fetchWithCors - Body:', finalOptions.body);

  try {
    const response = await fetch(url, finalOptions);
    console.log('fetchWithCors - Response Status:', response.status);
    console.log('fetchWithCors - Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('fetchWithCors - Response URL:', response.url);
    return response;
  } catch (error) {
    console.error('fetchWithCors - Error:', error);
    const corsError = handleCorsError(error);
    if (corsError.isCorsError) {
      console.error('CORS Error:', corsError.message);
      console.error('Suggestion:', corsError.suggestion);
    }
    throw error;
  }
};
