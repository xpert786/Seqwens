import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { firmAdminSettingsAPI } from '../../ClientOnboarding/utils/apiUtils';

const FirmSettingsContext = createContext({
  advancedReportingEnabled: false,
  updateAdvancedReporting: () => { },
  refreshIntegrations: () => { },
  loadingIntegrations: true,
});

export const FirmSettingsProvider = ({ children }) => {
  const [advancedReportingEnabled, setAdvancedReportingEnabled] = useState(false);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [branding, setBranding] = useState(null);

  const refreshIntegrations = useCallback(async () => {
    try {
      setLoadingIntegrations(true);
      const response = await firmAdminSettingsAPI.getIntegrationsInfo();
      if (response?.success && response?.data) {
        setAdvancedReportingEnabled(
          response.data.advanced_reporting !== undefined
            ? !!response.data.advanced_reporting
            : false
        );
      }
    } catch (error) {
      console.error('Failed to load firm integrations info:', error);
    } finally {
      setLoadingIntegrations(false);
    }
  }, []);

  const refreshBranding = useCallback(async (data = null) => {
    try {
      let brandingData = data;
      if (!brandingData) {
        const response = await firmAdminSettingsAPI.getBrandingInfo();
        if (response?.success && response?.data) {
          brandingData = response.data;
        }
      }

      if (brandingData) {
        setBranding(brandingData);
        localStorage.setItem('firm_branding', JSON.stringify(brandingData));

        // Apply CSS variables to the firm admin root element only
        const root = document.getElementById('firm-admin-root');
        if (root) {
          if (brandingData.primary_color) {
            root.style.setProperty('--firm-primary-color', brandingData.primary_color);
          }
          if (brandingData.secondary_color) {
            root.style.setProperty('--firm-secondary-color', brandingData.secondary_color);
          }
          if (brandingData.accent_color) {
            root.style.setProperty('--firm-accent-color', brandingData.accent_color);
          }
          if (brandingData.font_family) {
            root.style.setProperty('--firm-font-family', brandingData.font_family);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load firm branding info:', error);
    }
  }, []);

  // Apply colors from localStorage immediately on mount to prevent flicker
  useEffect(() => {
    const savedBranding = localStorage.getItem('firm_branding');
    if (savedBranding) {
      try {
        const data = JSON.parse(savedBranding);
        setBranding(data);
        // We need to wait for the element to exist, or use a MutationObserver, but usually on mount it might be rendered or soon to be.
        // Since this provider wraps the routes, the div inside routes might not be ready yet if it's a child.
        // However, we can try to find it.
        setTimeout(() => {
          const root = document.getElementById('firm-admin-root');
          if (root) {
            if (data.primary_color) root.style.setProperty('--firm-primary-color', data.primary_color);
            if (data.secondary_color) root.style.setProperty('--firm-secondary-color', data.secondary_color);
            if (data.accent_color) root.style.setProperty('--firm-accent-color', data.accent_color);
            if (data.font_family) root.style.setProperty('--firm-font-family', data.font_family);
          }
        }, 0);
      } catch (e) {
        console.error('Failed to parse saved branding:', e);
      }
    }
  }, []);

  useEffect(() => {
    refreshIntegrations();
    refreshBranding();
  }, [refreshIntegrations, refreshBranding]);

  const updateAdvancedReporting = (value) => {
    setAdvancedReportingEnabled(!!value);
  };

  return (
    <FirmSettingsContext.Provider
      value={{
        advancedReportingEnabled,
        updateAdvancedReporting,
        refreshIntegrations,
        loadingIntegrations,
        branding,
        refreshBranding
      }}
    >
      {children}
    </FirmSettingsContext.Provider>
  );
};

export const useFirmSettings = () => useContext(FirmSettingsContext);










