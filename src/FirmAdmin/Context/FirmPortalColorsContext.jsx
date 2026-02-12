import React, { createContext, useContext, useState, useEffect } from 'react';
import { firmAdminSettingsAPI, handleAPIError } from '../../ClientOnboarding/utils/apiUtils';
import { getMediaUrl } from '../../ClientOnboarding/utils/urlUtils';
import { getStorage } from '../../ClientOnboarding/utils/userUtils';

const FirmPortalColorsContext = createContext({
  primaryColor: '#178109',
  secondaryColor: '#ffffff',
  logoUrl: null,
  faviconUrl: null,
  loading: false,
  error: null,
  refreshColors: () => { },
});

export const useFirmPortalColors = () => {
  const context = useContext(FirmPortalColorsContext);
  if (!context) {
    throw new Error('useFirmPortalColors must be used within FirmPortalColorsProvider');
  }
  return context;
};

export const FirmPortalColorsProvider = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState('#178109');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [logoUrl, setLogoUrl] = useState(null);
  const [faviconUrl, setFaviconUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch portal colors from API
  const fetchPortalColors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const storage = getStorage();
      const userType = storage?.getItem('userType');
      const isLoggedIn = storage?.getItem('isLoggedIn') === 'true';

      if (!isLoggedIn) {
        // Not logged in, use default colors
        setLoading(false);
        return;
      }

      // Don't fetch for Super Admin or Admin as they don't have subdomain settings
      // and this avoids 403 Forbidden errors in those panels
      const adminTypes = ['super_admin', 'support_admin', 'billing_admin'];
      if (adminTypes.includes(userType)) {
        console.log('Skipping portal colors fetch for admin type:', userType);
        setLoading(false);
        return;
      }

      const response = await firmAdminSettingsAPI.getSubdomainSettings();

      if (response.success && response.data) {
        const primary = response.data.primary_color || '#178109';
        const secondary = response.data.secondary_color || '#ffffff';
        const logo = response.data.logo_url ? getMediaUrl(response.data.logo_url) : null;
        const favicon = response.data.favicon_url ? getMediaUrl(response.data.favicon_url) : null;

        setPrimaryColor(primary);
        setSecondaryColor(secondary);
        setLogoUrl(logo);
        setFaviconUrl(favicon);

        // Save to localStorage to prevent flicker on refresh
        localStorage.setItem('firm_portal_colors', JSON.stringify({
          primaryColor: primary,
          secondaryColor: secondary,
          logoUrl: logo,
          faviconUrl: favicon
        }));

        // Apply colors to CSS variables
        applyColorsToDocument(primary, secondary);

        // Apply logo and favicon to document head
        applyLogoAndFavicon(logo, favicon);
      } else {
        // Use default colors if API fails
        applyColorsToDocument('#178109', '#ffffff');
        applyLogoAndFavicon(null, null);
      }
    } catch (err) {
      console.error('Error fetching portal colors:', err);
      setError(handleAPIError(err));
      // Use default colors on error
      applyColorsToDocument('#178109', '#ffffff');
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

      // Add crossorigin attribute for S3 and B2 images to prevent CORS issues
      if (faviconUrl.includes('backblazeb2.com') || faviconUrl.includes('s3.amazonaws.com') || faviconUrl.includes('s3-') || faviconUrl.includes('.s3.')) {
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
    // Apply colors from localStorage immediately on mount to prevent flicker
    const savedColors = localStorage.getItem('firm_portal_colors');
    if (savedColors) {
      try {
        const data = JSON.parse(savedColors);
        setPrimaryColor(data.primaryColor);
        setSecondaryColor(data.secondaryColor);
        setLogoUrl(data.logoUrl);
        setFaviconUrl(data.faviconUrl);
        applyColorsToDocument(data.primaryColor, data.secondaryColor);
        applyLogoAndFavicon(data.logoUrl, data.faviconUrl);
      } catch (e) {
        console.error('Failed to parse saved portal colors:', e);
      }
    }

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
      const isLoggedIn = storage?.getItem('isLoggedIn') === 'true';
      if (isLoggedIn) {
        fetchPortalColors();
      }
    }, 60000); // Check every 60 seconds

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

