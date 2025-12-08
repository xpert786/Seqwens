import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { firmAdminSettingsAPI } from '../../ClientOnboarding/utils/apiUtils';

const FirmSettingsContext = createContext({
  advancedReportingEnabled: false,
  updateAdvancedReporting: () => {},
  refreshIntegrations: () => {},
  loadingIntegrations: true,
});

export const FirmSettingsProvider = ({ children }) => {
  const [advancedReportingEnabled, setAdvancedReportingEnabled] = useState(false);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);

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

  useEffect(() => {
    refreshIntegrations();
  }, [refreshIntegrations]);

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
      }}
    >
      {children}
    </FirmSettingsContext.Provider>
  );
};

export const useFirmSettings = () => useContext(FirmSettingsContext);







