import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { superAdminBillingAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';

const API_BASE_URL = getApiBaseUrl();

const APPROVAL_TYPE_OPTIONS = [
  { value: 'automatic', label: 'Automatic - Bill immediately, no approval needed' },
  { value: 'manual', label: 'Manual - Always require approval' },
  { value: 'threshold', label: 'Threshold - Auto-approve below limit, require approval above' }
];

const BILLING_FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' }
];

export default function BillingRules() {
  const [firms, setFirms] = useState([]);
  const [selectedFirmId, setSelectedFirmId] = useState('');
  const [billingRules, setBillingRules] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fetchingRules, setFetchingRules] = useState(false);

  const [formData, setFormData] = useState({
    max_offices_auto_approve: '',
    office_approval_type: 'threshold',
    max_users_auto_approve: '',
    user_approval_type: 'threshold',
    auto_billing_enabled: true,
    billing_frequency: 'monthly',
    monthly_billing_threshold: ''
  });

  // Fetch firms list
  const fetchFirms = useCallback(async () => {
    try {
      const token = getAccessToken();
      const response = await fetchWithCors(`${API_BASE_URL}/firm/clients/list/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setFirms(Array.isArray(result.data) ? result.data : result.data.results || []);
        }
      }
    } catch (err) {
      console.error('Error fetching firms:', err);
    }
  }, []);

  // Fetch billing rules for selected firm
  const fetchBillingRules = useCallback(async () => {
    if (!selectedFirmId) {
      setBillingRules(null);
      return;
    }

    try {
      setFetchingRules(true);
      setError('');
      const response = await superAdminBillingAPI.getBillingRules(selectedFirmId);
      
      if (response.success && response.data) {
        setBillingRules(response.data);
        setFormData({
          max_offices_auto_approve: response.data.max_offices_auto_approve || '',
          office_approval_type: response.data.office_approval_type || 'threshold',
          max_users_auto_approve: response.data.max_users_auto_approve || '',
          user_approval_type: response.data.user_approval_type || 'threshold',
          auto_billing_enabled: response.data.auto_billing_enabled !== false,
          billing_frequency: response.data.billing_frequency || 'monthly',
          monthly_billing_threshold: response.data.monthly_billing_threshold || ''
        });
      } else {
        // No rules found, use defaults
        setBillingRules(null);
        setFormData({
          max_offices_auto_approve: '',
          office_approval_type: 'threshold',
          max_users_auto_approve: '',
          user_approval_type: 'threshold',
          auto_billing_enabled: true,
          billing_frequency: 'monthly',
          monthly_billing_threshold: ''
        });
      }
    } catch (err) {
      console.error('Error fetching billing rules:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load billing rules');
      setBillingRules(null);
    } finally {
      setFetchingRules(false);
    }
  }, [selectedFirmId]);

  useEffect(() => {
    fetchFirms();
  }, [fetchFirms]);

  useEffect(() => {
    fetchBillingRules();
  }, [fetchBillingRules]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFirmId) {
      toast.error('Please select a firm', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        max_offices_auto_approve: formData.max_offices_auto_approve ? parseInt(formData.max_offices_auto_approve) : null,
        office_approval_type: formData.office_approval_type,
        max_users_auto_approve: formData.max_users_auto_approve ? parseInt(formData.max_users_auto_approve) : null,
        user_approval_type: formData.user_approval_type,
        auto_billing_enabled: formData.auto_billing_enabled,
        billing_frequency: formData.billing_frequency,
        monthly_billing_threshold: formData.monthly_billing_threshold ? parseFloat(formData.monthly_billing_threshold) : null
      };

      const response = await superAdminBillingAPI.createOrUpdateBillingRules(selectedFirmId, payload);

      if (response.success) {
        toast.success(response.message || 'Billing rules saved successfully', {
          position: 'top-right',
          autoClose: 3000
        });
        fetchBillingRules();
      } else {
        throw new Error(response.message || 'Failed to save billing rules');
      }
    } catch (err) {
      console.error('Error saving billing rules:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to save billing rules', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setSaving(false);
    }
  };

  const getFirmName = (firmId) => {
    const firm = firms.find(f => f.id === firmId || f.firm_id === firmId);
    return firm?.name || firm?.firm_name || `Firm #${firmId}`;
  };

  return (
    <div className="bg-white rounded-lg border border-[#E8F0FF] p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
          Billing Rules
        </h3>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
          Configure billing rules and limits for firm growth. Included offices and users are automatically retrieved from the subscription plan.
        </p>
      </div>

      {/* Firm Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
          Select Firm <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedFirmId}
          onChange={(e) => setSelectedFirmId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
        >
          <option value="">Select a firm</option>
          {firms.map((firm) => (
            <option key={firm.id || firm.firm_id} value={firm.id || firm.firm_id}>
              {firm.name || firm.firm_name}
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {fetchingRules && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading billing rules...</p>
        </div>
      )}

      {/* Form */}
      {selectedFirmId && !fetchingRules && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subscription Info */}
          {billingRules && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2 font-[BasisGrotesquePro]">
                Subscription Plan Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-[BasisGrotesquePro]">Included Offices:</span>
                  <span className="ml-2 font-semibold text-blue-900 font-[BasisGrotesquePro]">
                    {billingRules.included_offices !== undefined ? billingRules.included_offices : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 font-[BasisGrotesquePro]">Included Users:</span>
                  <span className="ml-2 font-semibold text-blue-900 font-[BasisGrotesquePro]">
                    {billingRules.included_users !== undefined ? billingRules.included_users : 'N/A'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2 font-[BasisGrotesquePro]">
                These values are automatically retrieved from the firm's subscription plan and cannot be changed here.
              </p>
            </div>
          )}

          {/* Office Approval Settings */}
          <div className="border border-[#E8F0FF] rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">
              Office Approval Settings
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                  Office Approval Type
                </label>
                <select
                  value={formData.office_approval_type}
                  onChange={(e) => handleInputChange('office_approval_type', e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                >
                  {APPROVAL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.office_approval_type === 'threshold' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                    Max Offices Auto-Approve
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_offices_auto_approve}
                    onChange={(e) => handleInputChange('max_offices_auto_approve', e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
                    Maximum number of additional offices that can be added without approval
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* User Approval Settings */}
          <div className="border border-[#E8F0FF] rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">
              User Approval Settings
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                  User Approval Type
                </label>
                <select
                  value={formData.user_approval_type}
                  onChange={(e) => handleInputChange('user_approval_type', e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                >
                  {APPROVAL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.user_approval_type === 'threshold' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                    Max Users Auto-Approve
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_users_auto_approve}
                    onChange={(e) => handleInputChange('max_users_auto_approve', e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                    placeholder="10"
                  />
                  <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
                    Maximum number of additional users that can be added without approval
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Billing Settings */}
          <div className="border border-[#E8F0FF] rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">
              Billing Settings
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_billing_enabled}
                    onChange={(e) => handleInputChange('auto_billing_enabled', e.target.checked)}
                    className="w-4 h-4 text-[#3AD6F2] border-gray-300 rounded focus:ring-[#3AD6F2]"
                  />
                  <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Enable Automatic Billing</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                  Billing Frequency
                </label>
                <select
                  value={formData.billing_frequency}
                  onChange={(e) => handleInputChange('billing_frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                >
                  {BILLING_FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                  Monthly Billing Threshold ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-[BasisGrotesquePro]">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthly_billing_threshold}
                    onChange={(e) => handleInputChange('monthly_billing_threshold', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                    placeholder="1000.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
                  Maximum monthly charges before requiring approval
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-orange-600 transition-colors font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Billing Rules'}
            </button>
          </div>
        </form>
      )}

      {/* No Firm Selected */}
      {!selectedFirmId && !fetchingRules && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">
            Please select a firm to view and configure billing rules
          </p>
        </div>
      )}
    </div>
  );
}

