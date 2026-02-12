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

  const refreshBranding = useCallback(async () => {
    try {
      const response = await firmAdminSettingsAPI.getBrandingInfo();
      if (response?.success && response?.data) {
        setBranding(response.data);
        localStorage.setItem('firm_branding', JSON.stringify(response.data));

        // Apply CSS variables
        const root = document.documentElement;
        if (response.data.primary_color) {
          root.style.setProperty('--firm-primary-color', response.data.primary_color);
        }
        if (response.data.secondary_color) {
          root.style.setProperty('--firm-secondary-color', response.data.secondary_color);
        }
        if (response.data.accent_color) {
          root.style.setProperty('--firm-accent-color', response.data.accent_color);
        }
        if (response.data.font_family) {
          root.style.setProperty('--firm-font-family', response.data.font_family);
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
        const root = document.documentElement;
        if (data.primary_color) root.style.setProperty('--firm-primary-color', data.primary_color);
        if (data.secondary_color) root.style.setProperty('--firm-secondary-color', data.secondary_color);
        if (data.accent_color) root.style.setProperty('--firm-accent-color', data.accent_color);
        if (data.font_family) root.style.setProperty('--firm-font-family', data.font_family);
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










