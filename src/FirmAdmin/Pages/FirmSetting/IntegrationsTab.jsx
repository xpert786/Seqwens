import React, { useState, useEffect } from 'react';
import { firmAdminSettingsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { useFirmSettings } from '../../Context/FirmSettingsContext';
import { FiInfo, FiX } from "react-icons/fi";

export default function IntegrationsTab() {
  const { advancedReportingEnabled, updateAdvancedReporting } = useFirmSettings();
  const [preferences, setPreferences] = useState({
    client_portal_access: true,
    email_notifications: true,
    workflow_automation: true,
    advanced_reporting: true
  });

  const [dataManagement, setDataManagement] = useState({
    data_retention_years: 12,
    backup_frequency: 'Never'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

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
            data_retention_years: response.data.data_retention_years || 12,
            backup_frequency: response.data.backup_frequency || 'Never'
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

  const handleExport = () => {
    toast.info('Data export requested. This may take a few minutes depending on your firm size.');
  };

  const handleImport = () => {
    toast.info('Please select a valid data export file to import.');
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
            data_retention_years: response.data.data_retention_years || 12,
            backup_frequency: response.data.backup_frequency || 'Never'
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
        <div className="bg-white rounded-2xl p-4 sm:p-6 !border border-[#E8F0FF]">
          <div className="mb-5 text-left">
            <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
              System Preferences
            </h5>
            <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
              Configure system-wide settings
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 py-1">
              <div className="min-w-0">
                <h5 className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro] truncate">
                  Client Portal Access
                </h5>
                <p className="text-[11px] sm:text-xs text-[#4B5563] font-[BasisGrotesquePro] leading-tight">
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
                <div className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full px-1 transition-colors ${preferences.client_portal_access ? 'bg-[#F56D2D]' : 'bg-gray-300'
                  }`}>
                  <span className={`inline-block h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-white transition-transform ${preferences.client_portal_access ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                    }`} />
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between gap-4 py-1">
              <div className="min-w-0">
                <h5 className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro] truncate">
                  Email Notifications
                </h5>
                <p className="text-[11px] sm:text-xs text-[#4B5563] font-[BasisGrotesquePro] leading-tight">
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
                <div className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full px-1 transition-colors ${preferences.email_notifications ? 'bg-[#F56D2D]' : 'bg-gray-300'
                  }`}>
                  <span className={`inline-block h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-white transition-transform ${preferences.email_notifications ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                    }`} />
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between gap-4 py-1">
              <div className="min-w-0">
                <h5 className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro] truncate">
                  Workflow Automation
                </h5>
                <p className="text-[11px] sm:text-xs text-[#4B5563] font-[BasisGrotesquePro] leading-tight">
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
                <div className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full px-1 transition-colors ${preferences.workflow_automation ? 'bg-[#F56D2D]' : 'bg-gray-300'
                  }`}>
                  <span className={`inline-block h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-white transition-transform ${preferences.workflow_automation ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                    }`} />
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between gap-4 py-1">
              <div className="min-w-0">
                <h5 className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro] truncate">
                  Advanced Reporting
                </h5>
                <p className="text-[11px] sm:text-xs text-[#4B5563] font-[BasisGrotesquePro] leading-tight">
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
                <div className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full px-1 transition-colors ${preferences.advanced_reporting ? 'bg-[#F56D2D]' : 'bg-gray-300'
                  }`}>
                  <span className={`inline-block h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-white transition-transform ${preferences.advanced_reporting ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                    }`} />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 !border border-[#E8F0FF]">
          <div className="mb-5 text-left">
            <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1 flex items-center justify-start gap-2">
              Data Management
              <button
                onClick={() => setShowInfoModal(true)}
                className="text-[#3AD6F2] hover:text-[#2bb8d1] transition-colors focus:outline-none"
                title="Learn about Data Retention"
              >
                <FiInfo size={16} />
              </button>
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
              <div className="flex flex-col xs:flex-row gap-3 pt-4 border-t border-gray-50">
                <button
                  onClick={handleExport}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-all font-[BasisGrotesquePro] flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Export Data
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-all font-[BasisGrotesquePro] flex items-center justify-center gap-2 shadow-sm"
                >
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
      <div className="flex justify-center sm:justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-8 py-3 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-all duration-200 font-bold font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
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


      {/* Data Retention Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8F0FF]">
            <div className="sticky top-0 bg-white border-b border-[#E8F0FF] p-6 flex justify-between items-center z-10">
              <h3 className="text-xl font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                Data Retention Policy
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-[#7B8AB2] hover:text-[#1F2A55] transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-[#EFF5FF] p-4 rounded-lg border border-[#3AD6F2]/30">
                <p className="text-[#0369A1] font-medium font-[BasisGrotesquePro]">
                  Data retention in this system does not mean "silent deletion."
                  Especially in tax and compliance-driven environments, we ensure data integrity and accessibility while managing lifecycle.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-[#1F2A55] mb-3 font-[BasisGrotesquePro]">
                  Data Lifecycle Stages
                </h4>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <div>
                      <h5 className="font-semibold text-[#1F2A55] mb-1">Active Data</h5>
                      <p className="text-sm text-[#4B5563]">Fully accessible, Indexed, Searchable, Editable. This is your day-to-day working data.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <div>
                      <h5 className="font-semibold text-[#1F2A55] mb-1">Archived Data</h5>
                      <p className="text-sm text-[#4B5563]">Read-only, Still retrievable, Moved to lower-cost storage, Not included in default searches to improve performance.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <div>
                      <h5 className="font-semibold text-[#1F2A55] mb-1">Permanently Deleted Data</h5>
                      <p className="text-sm text-[#4B5563]">Only after explicit confirmation, Logged and auditable. Typically irreversible.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E8F0FF] pt-4">
                <h4 className="text-lg font-semibold text-[#1F2A55] mb-2 font-[BasisGrotesquePro]">
                  Storage Impact
                </h4>
                <p className="text-sm text-[#4B5563] mb-3">
                  Data is <strong>NOT</strong> immediately deleted. Instead:
                </p>
                <ul className="list-disc pl-5 text-sm text-[#4B5563] space-y-1">
                  <li>Files may be compressed and moved to storage tiers</li>
                  <li>Detached from real-time indexing</li>
                  <li>Flagged as "archived"</li>
                </ul>
                <p className="text-sm text-[#4B5563] mt-3 italic">
                  This reduces server load, keeps compliance intact, and preserves recovery options.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-[#1F2A55] mb-2 font-[BasisGrotesquePro]">
                  Example Scenario
                </h4>
                <p className="text-sm text-[#4B5563]">
                  If you select <strong>4 years</strong>: Records older than 4 years are automatically archived, removed from active dashboards, and moved to secure storage. Metadata remains so the system knows the data exists.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-[#E8F0FF] bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-6 py-2 bg-white border border-[#E8F0FF] rounded-lg text-[#3B4A66] hover:bg-gray-50 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

