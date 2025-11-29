import React, { useState, useEffect } from 'react';
import { firmAdminSettingsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { useFirmSettings } from '../../Context/FirmSettingsContext';

export default function IntegrationsTab() {
  const { advancedReportingEnabled, updateAdvancedReporting } = useFirmSettings();
  const [preferences, setPreferences] = useState({
    client_portal_access: true,
    email_notifications: true,
    workflow_automation: true,
    advanced_reporting: true
  });

  const [dataManagement, setDataManagement] = useState({
    data_retention_years: 7,
    backup_frequency: 'Daily'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch integrations information on mount
  useEffect(() => {
    const fetchIntegrationsInfo = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await firmAdminSettingsAPI.getIntegrationsInfo();
        
        if (response.success && response.data) {
          const advancedValue = response.data.advanced_reporting !== undefined ? response.data.advanced_reporting : true;
          setPreferences({
            client_portal_access: response.data.client_portal_access !== undefined ? response.data.client_portal_access : true,
            email_notifications: response.data.email_notifications !== undefined ? response.data.email_notifications : true,
            workflow_automation: response.data.workflow_automation !== undefined ? response.data.workflow_automation : true,
            advanced_reporting: advancedValue
          });
          updateAdvancedReporting(advancedValue);
          setDataManagement({
            data_retention_years: response.data.data_retention_years || 7,
            backup_frequency: response.data.backup_frequency || 'Daily'
          });
        } else {
          throw new Error(response.message || 'Failed to load integrations information');
        }
      } catch (err) {
        console.error('Error fetching integrations info:', err);
        const errorMsg = handleAPIError(err);
        setError(errorMsg || 'Failed to load integrations information');
        toast.error(errorMsg || 'Failed to load integrations information');
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrationsInfo();
  }, []);

  const togglePreference = (key) => {
    setPreferences(prev => {
      const updated = {
        ...prev,
        [key]: !prev[key]
      };
      if (key === 'advanced_reporting') {
        updateAdvancedReporting(updated[key]);
      }
      return updated;
    });
  };

  const handleDataManagementChange = (field, value) => {
    setDataManagement(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const integrationsData = {
        ...preferences,
        data_retention_years: parseInt(dataManagement.data_retention_years, 10),
        backup_frequency: dataManagement.backup_frequency
      };

      const response = await firmAdminSettingsAPI.updateIntegrationsInfo(integrationsData, 'POST');
      
      if (response.success) {
        toast.success('Integrations settings updated successfully');
        // Update with response data if needed
        if (response.data) {
          const advancedValue = response.data.advanced_reporting !== undefined ? response.data.advanced_reporting : true;
          setPreferences({
            client_portal_access: response.data.client_portal_access !== undefined ? response.data.client_portal_access : true,
            email_notifications: response.data.email_notifications !== undefined ? response.data.email_notifications : true,
            workflow_automation: response.data.workflow_automation !== undefined ? response.data.workflow_automation : true,
            advanced_reporting: advancedValue
          });
          updateAdvancedReporting(advancedValue);
          setDataManagement({
            data_retention_years: response.data.data_retention_years || 7,
            backup_frequency: response.data.backup_frequency || 'Daily'
          });
        }
      } else {
        throw new Error(response.message || 'Failed to update integrations settings');
      }
    } catch (err) {
      console.error('Error updating integrations info:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to update integrations settings');
      toast.error(errorMsg || 'Failed to update integrations settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm text-gray-600">Loading integrations settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* System Preferences */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-5">
          <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            System Preferences
          </h5>
          <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
            Configure system-wide settings
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">
                Client Portal Access
              </h5>
              <p className="text-sm text-[#4B5563] font-[BasisGrotesquePro]">
                Allow clients to access their portal
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center flex-shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={preferences.client_portal_access}
                onChange={() => togglePreference('client_portal_access')}
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${preferences.client_portal_access ? 'bg-[#F56D2D]' : 'bg-gray-300'
                }`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${preferences.client_portal_access ? 'translate-x-5' : 'translate-x-0'
                  }`} />
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">
                Email Notifications
              </h5>
              <p className="text-sm text-[#4B5563] font-[BasisGrotesquePro]">
                Send automated email notifications
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center flex-shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={preferences.email_notifications}
                onChange={() => togglePreference('email_notifications')}
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${preferences.email_notifications ? 'bg-[#F56D2D]' : 'bg-gray-300'
                }`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${preferences.email_notifications ? 'translate-x-5' : 'translate-x-0'
                  }`} />
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">
                Workflow Automation
              </h5>
              <p className="text-sm text-[#4B5563] font-[BasisGrotesquePro]">
                Enable automated workflows
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center flex-shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={preferences.workflow_automation}
                onChange={() => togglePreference('workflow_automation')}
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${preferences.workflow_automation ? 'bg-[#F56D2D]' : 'bg-gray-300'
                }`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${preferences.workflow_automation ? 'translate-x-5' : 'translate-x-0'
                  }`} />
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">
                Advanced Reporting
              </h5>
              <p className="text-sm text-[#4B5563] font-[BasisGrotesquePro]">
                Generate detailed reports
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center flex-shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={preferences.advanced_reporting}
                onChange={() => togglePreference('advanced_reporting')}
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${preferences.advanced_reporting ? 'bg-[#F56D2D]' : 'bg-gray-300'
                }`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${preferences.advanced_reporting ? 'translate-x-5' : 'translate-x-0'
                  }`} />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-5">
          <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Data Management
          </h5>
          <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
            Configure data retention and backup settings
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Data Retention (years)
            </label>
            <select 
              value={dataManagement.data_retention_years}
              onChange={(e) => handleDataManagementChange('data_retention_years', parseInt(e.target.value, 10))}
              className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white"
            >
              {Array.from({ length: 100 }, (_, i) => {
                const year = i + 1;
                return (
                  <option key={year} value={year}>{year} {year === 1 ? 'year' : 'years'}</option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Backup Frequency
            </label>
            <select 
              value={dataManagement.backup_frequency}
              onChange={(e) => handleDataManagementChange('backup_frequency', e.target.value)}
              className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
              <option value="Never">Never</option>
            </select>
          </div>

          {!advancedReportingEnabled && (
            <div className="space-y-3 pt-2">
              <button className="w-full px-4 py-2 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                Download Data Export
              </button>
              <button className="w-full px-4 py-2 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] flex items-center justify-center gap-2 mt-3">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12.75 6L9 2.25L5.25 6" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 2.25V11.25" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                Import Data
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

