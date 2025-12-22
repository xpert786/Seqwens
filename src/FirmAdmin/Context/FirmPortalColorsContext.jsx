import React, { createContext, useContext, useState, useEffect } from 'react';
import { firmAdminSettingsAPI, handleAPIError } from '../../ClientOnboarding/utils/apiUtils';
import { getMediaUrl } from '../../ClientOnboarding/utils/urlUtils';
import { getStorage } from '../../ClientOnboarding/utils/userUtils';

const FirmPortalColorsContext = createContext({
  primaryColor: '#32B582',
  secondaryColor: '#F56D2D',
  logoUrl: null,
  faviconUrl: null,
  loading: false,
  error: null,
  refreshColors: () => {},
});

export const useFirmPortalColors = () => {
  const context = useContext(FirmPortalColorsContext);
  if (!context) {
    throw new Error('useFirmPortalColors must be used within FirmPortalColorsProvider');
  }
  return context;
};

export const FirmPortalColorsProvider = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState('#32B582');
  const [secondaryColor, setSecondaryColor] = useState('#F56D2D');
  const [logoUrl, setLogoUrl] = useState(null);
  const [faviconUrl, setFaviconUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch portal colors from API
  const fetchPortalColors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated as firm admin
      const storage = getStorage();
      const userType = storage?.getItem('userType');
      
      if (userType !== 'admin') {
        // Not a firm admin, use default colors
        setLoading(false);
        return;
      }

      const response = await firmAdminSettingsAPI.getSubdomainSettings();
      
      if (response.success && response.data) {
        const primary = response.data.primary_color || '#32B582';
        const secondary = response.data.secondary_color || '#F56D2D';
        const logo = response.data.logo_url ? getMediaUrl(response.data.logo_url) : null;
        const favicon = response.data.favicon_url ? getMediaUrl(response.data.favicon_url) : null;
        
        setPrimaryColor(primary);
        setSecondaryColor(secondary);
        setLogoUrl(logo);
        setFaviconUrl(favicon);
        
        // Apply colors to CSS variables
        applyColorsToDocument(primary, secondary);
        
        // Apply logo and favicon to document head
        applyLogoAndFavicon(logo, favicon);
      } else {
        // Use default colors if API fails
        applyColorsToDocument('#32B582', '#F56D2D');
        applyLogoAndFavicon(null, null);
      }
    } catch (err) {
      console.error('Error fetching portal colors:', err);
      setError(handleAPIError(err));
      // Use default colors on error
      applyColorsToDocument('#32B582', '#F56D2D');
      applyLogoAndFavicon(null, null);
    } finally {
      setLoading(false);
    }
  };

  // Apply colors to document root as CSS variables
  const applyColorsToDocument = (primary, secondary) => {
    const root = document.documentElement;
    root.style.setProperty('--firm-primary-color', primary);
    root.style.setProperty('--firm-secondary-color', secondary);
    
    // Also set as data attributes for easier access
    root.setAttribute('data-firm-primary-color', primary);
    root.setAttribute('data-firm-secondary-color', secondary);
  };

  // Apply logo and favicon to document head
  // Note: Logo is always Seqwens logo and should not be replaced
  const applyLogoAndFavicon = (logoUrl, faviconUrl) => {
    // Update favicon
    let faviconLink = document.querySelector("link[rel='icon']") || document.querySelector("link[rel='shortcut icon']");
    
    if (faviconUrl) {
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = faviconUrl;
      faviconLink.type = faviconUrl.includes('.ico') ? 'image/x-icon' : 'image/png';
      
      // Add crossorigin attribute for B2 images
      if (faviconUrl.includes('backblazeb2.com') || faviconUrl.includes('s3.us-')) {
        faviconLink.crossOrigin = 'anonymous';
      }
      
      // Handle favicon load errors
      faviconLink.onerror = () => {
        console.warn('Failed to load custom favicon, using default');
        faviconLink.href = '/vite.svg';
      };
    } else {
      // Remove custom favicon if none provided
      if (faviconLink && faviconLink.href !== '/vite.svg') {
        faviconLink.href = '/vite.svg';
      }
    }

    // Update logo in header if needed (we'll handle this in FirmHeader component)
    // For now, we store it in the context so components can access it
  };

  // Refresh colors, logo, and favicon (call after updating in settings)
  const refreshColors = async () => {
    await fetchPortalColors();
  };

  // Fetch colors on mount and when user type changes
  useEffect(() => {
    fetchPortalColors();
    
    // Listen for storage changes (when user logs in/out)
    const handleStorageChange = (e) => {
      if (e.key === 'userType' || e.key === 'accessToken') {
        fetchPortalColors();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case colors are updated in another tab
    const interval = setInterval(() => {
      const storage = getStorage();
      const userType = storage?.getItem('userType');
      if (userType === 'admin') {
        fetchPortalColors();
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const value = {
    primaryColor,
    secondaryColor,
    logoUrl,
    faviconUrl,
    loading,
    error,
    refreshColors,
  };

  return (
    <FirmPortalColorsContext.Provider value={value}>
      {children}
    </FirmPortalColorsContext.Provider>
  );
};

