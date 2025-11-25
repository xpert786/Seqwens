import React, { useState, useEffect } from 'react';
import { firmAdminSettingsAPI, handleAPIError, clearUserData } from '../../../ClientOnboarding/utils/apiUtils';
import { getLoginUrl } from '../../../ClientOnboarding/utils/urlUtils';
import { toast } from 'react-toastify';

export default function AdvancedTab() {
  const [documentTemplates, setDocumentTemplates] = useState({
    invoice_template: 'Standard Template',
    letter_template: 'Professional',
    report_template: 'Detailed'
  });

  const [accessControl, setAccessControl] = useState({
    staff_access_level: 'Standard',
    client_data_access: 'Assigned',
    financial_data_access: 'Managers'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [firmName, setFirmName] = useState('');

  // Fetch advanced information and firm name on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch advanced info
        const advancedResponse = await firmAdminSettingsAPI.getAdvancedInfo();
        
        if (advancedResponse.success && advancedResponse.data) {
          setDocumentTemplates({
            invoice_template: advancedResponse.data.invoice_template || 'Standard Template',
            letter_template: advancedResponse.data.letter_template || 'Professional',
            report_template: advancedResponse.data.report_template || 'Detailed'
          });
          setAccessControl({
            staff_access_level: advancedResponse.data.staff_access_level || 'Standard',
            client_data_access: advancedResponse.data.client_data_access || 'Assigned',
            financial_data_access: advancedResponse.data.financial_data_access || 'Managers'
          });
        } else {
          throw new Error(advancedResponse.message || 'Failed to load advanced information');
        }

        // Fetch firm name for delete confirmation
        try {
          const generalResponse = await firmAdminSettingsAPI.getGeneralInfo();
          if (generalResponse.success && generalResponse.data) {
            setFirmName(generalResponse.data.firm_name || '');
          }
        } catch (err) {
          console.error('Error fetching firm name:', err);
          // Don't fail the whole component if firm name fetch fails
        }
      } catch (err) {
        console.error('Error fetching advanced info:', err);
        const errorMsg = handleAPIError(err);
        setError(errorMsg || 'Failed to load advanced information');
        toast.error(errorMsg || 'Failed to load advanced information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTemplateChange = (field, value) => {
    setDocumentTemplates(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAccessControlChange = (field, value) => {
    setAccessControl(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const advancedData = {
        ...documentTemplates,
        ...accessControl
      };

      const response = await firmAdminSettingsAPI.updateAdvancedInfo(advancedData, 'POST');
      
      if (response.success) {
        toast.success('Advanced settings updated successfully');
        // Update with response data if needed
        if (response.data) {
          setDocumentTemplates({
            invoice_template: response.data.invoice_template || 'Standard Template',
            letter_template: response.data.letter_template || 'Professional',
            report_template: response.data.report_template || 'Detailed'
          });
          setAccessControl({
            staff_access_level: response.data.staff_access_level || 'Standard',
            client_data_access: response.data.client_data_access || 'Assigned',
            financial_data_access: response.data.financial_data_access || 'Managers'
          });
        }
      } else {
        throw new Error(response.message || 'Failed to update advanced settings');
      }
    } catch (err) {
      console.error('Error updating advanced info:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to update advanced settings');
      toast.error(errorMsg || 'Failed to update advanced settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password to confirm deletion', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Validate confirmation text if provided
    if (deleteConfirmation && deleteConfirmation !== 'DELETE' && deleteConfirmation !== firmName) {
      toast.error('Confirmation text must be "DELETE" or your firm name', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setDeleting(true);
      setError('');

      const response = await firmAdminSettingsAPI.deleteAccount(
        deletePassword,
        deleteConfirmation || null
      );

      if (response.success) {
        toast.success(response.message || 'Firm account deleted successfully', {
          position: "top-right",
          autoClose: 3000,
        });

        // Clear all user data
        clearUserData();
        localStorage.clear();
        sessionStorage.clear();

        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = getLoginUrl();
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to delete account');
      toast.error(errorMsg || 'Failed to delete account', {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm text-gray-600">Loading advanced settings...</p>
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
        {/* Document Templates */}
        <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
          <div className="mb-5">
            <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
              Document Templates
            </h5>
            <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
              Manage document templates and formats
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h6 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                Invoice Template
              </h6>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select 
                    value={documentTemplates.invoice_template}
                    onChange={(e) => handleTemplateChange('invoice_template', e.target.value)}
                    className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 pr-8 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white appearance-none"
                  >
                    <option value="Standard Template">Standard Template</option>
                    <option value="Professional">Professional</option>
                    <option value="Minimal">Minimal</option>
                    <option value="Detailed">Detailed</option>
                    <option value="Custom">Custom</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 5L6 8L9 5" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <button className="p-2 text-[#1F2A55] hover:bg-gray-50 !rounded-lg !border border-[#E8F0FF] transition bg-white flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <h6 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                Letter Template
              </h6>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select 
                    value={documentTemplates.letter_template}
                    onChange={(e) => handleTemplateChange('letter_template', e.target.value)}
                    className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 pr-8 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white appearance-none"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Standard">Standard</option>
                    <option value="Formal">Formal</option>
                    <option value="Casual">Casual</option>
                    <option value="Custom">Custom</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 5L6 8L9 5" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <button className="p-2 text-[#1F2A55] hover:bg-gray-50 !rounded-lg !border border-[#E8F0FF] transition bg-white flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <h6 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                Report Template
              </h6>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select 
                    value={documentTemplates.report_template}
                    onChange={(e) => handleTemplateChange('report_template', e.target.value)}
                    className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 pr-8 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white appearance-none"
                  >
                    <option value="Detailed">Detailed</option>
                    <option value="Summary">Summary</option>
                    <option value="Standard">Standard</option>
                    <option value="Minimal">Minimal</option>
                    <option value="Custom">Custom</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 5L6 8L9 5" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <button className="p-2 text-[#1F2A55] hover:bg-gray-50 !rounded-lg !border border-[#E8F0FF] transition bg-white flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
          <div className="mb-5">
            <h6 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
              Data Management
            </h6>
            <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
              Configure data retention and backup settings
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label className="block text-[16px] font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-1">
                  Staff Access Level
                </label>
                <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                  Default permissions for new staff
                </p>
              </div>
              <div className="relative flex-shrink-0 min-w-[150px]">
                <select 
                  value={accessControl.staff_access_level}
                  onChange={(e) => handleAccessControlChange('staff_access_level', e.target.value)}
                  className="!rounded-lg !border border-[#E8F0FF] px-3 py-2 pr-8 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white appearance-none w-full"
                >
                  <option value="Standard">Standard</option>
                  <option value="Limited">Limited</option>
                  <option value="Full">Full</option>
                  <option value="Restricted">Restricted</option>
                  <option value="Custom">Custom</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5L6 8L9 5" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label className="block text-[16px] font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-1">
                  Client Data Access
                </label>
                <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                  Who can view client information
                </p>
              </div>
              <div className="relative flex-shrink-0 min-w-[150px]">
                <select 
                  value={accessControl.client_data_access}
                  onChange={(e) => handleAccessControlChange('client_data_access', e.target.value)}
                  className="!rounded-lg !border border-[#E8F0FF] px-3 py-2 pr-8 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white appearance-none w-full"
                >
                  <option value="Assigned">Assigned</option>
                  <option value="All Staff">All Staff</option>
                  <option value="Managers Only">Managers Only</option>
                  <option value="Admins Only">Admins Only</option>
                  <option value="Custom">Custom</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5L6 8L9 5" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label className="block text-[16px] font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-1">
                  Financial Data Access
                </label>
                <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                  Who can view financial information
                </p>
              </div>
              <div className="relative flex-shrink-0 min-w-[150px]">
                <select 
                  value={accessControl.financial_data_access}
                  onChange={(e) => handleAccessControlChange('financial_data_access', e.target.value)}
                  className="!rounded-lg !border border-[#E8F0FF] px-3 py-2 pr-8 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white appearance-none w-full"
                >
                  <option value="Managers">Managers</option>
                  <option value="Admins Only">Admins Only</option>
                  <option value="All Staff">All Staff</option>
                  <option value="Restricted">Restricted</option>
                  <option value="Custom">Custom</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5L6 8L9 5" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-5">
          <h5 className="text-lg font-semibold !text-[#EF4444] font-[BasisGrotesquePro] mb-1">
            Danger Zone
          </h5>
          <p className="text-[15px] text-[#4B5563] font-regular font-[BasisGrotesquePro]">
            Irreversible and destructive actions
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 bg-[#EF444417] !rounded-lg !border border-[#EF4444]">
            <div className="flex-1">
              <h6 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                Delete Firm Account
              </h6>
              <p className="text-xs text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                Permanently delete your firm account and all data
              </p>
            </div>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#EF4444] !rounded-lg hover:bg-red-700 transition font-[BasisGrotesquePro] flex-shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 !border border-[#E8F0FF]">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-[#EF4444] font-[BasisGrotesquePro] mb-2">
                Delete Firm Account
              </h3>
              <p className="text-sm text-[#4B5563] font-[BasisGrotesquePro]">
                This action cannot be undone. This will permanently delete your firm account and all associated data. All users will lose access immediately.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                  Enter Your Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4444] font-[BasisGrotesquePro]"
                  disabled={deleting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                  Type "DELETE" or Firm Name (Optional)
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder={firmName ? `Type "DELETE" or "${firmName}"` : 'Type "DELETE"'}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4444] font-[BasisGrotesquePro]"
                  disabled={deleting}
                />
                <p className="text-xs text-[#6B7280] font-[BasisGrotesquePro] mt-1">
                  For additional security, type "DELETE" or your firm name
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteConfirmation('');
                  setError('');
                }}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-[#3B4A66] bg-gray-100 !rounded-lg hover:bg-gray-200 transition font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="px-4 py-2 text-sm font-medium text-white bg-[#EF4444] !rounded-lg hover:bg-red-700 transition font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Account</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

