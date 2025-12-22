import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { superAdminAddonsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';

export default function FirmAddonsTab({ firmId, firmName }) {
  const [firmAddons, setFirmAddons] = useState([]);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingAddon, setAddingAddon] = useState(null);
  const [removingAddon, setRemovingAddon] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [addonToRemove, setAddonToRemove] = useState(null);

  // Fetch firm addons
  const fetchFirmAddons = useCallback(async () => {
    if (!firmId) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await superAdminAddonsAPI.getFirmAddons(firmId);
      
      if (response.success && response.data) {
        setFirmAddons(response.data.addons || []);
      } else {
        throw new Error(response.message || 'Failed to load firm addons');
      }
    } catch (err) {
      console.error('Error fetching firm addons:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load firm addons');
      setFirmAddons([]);
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  // Fetch available addons
  const fetchAvailableAddons = useCallback(async () => {
    try {
      const response = await superAdminAddonsAPI.listAddons();
      
      if (response.success && response.data) {
        // Filter to only show active addons that aren't already added
        const activeAddons = (response.data.addons || []).filter(addon => addon.is_active);
        const addedAddonIds = firmAddons.map(fa => fa.addon?.id || fa.addon_id);
        setAvailableAddons(activeAddons.filter(addon => !addedAddonIds.includes(addon.id)));
      } else {
        setAvailableAddons([]);
      }
    } catch (err) {
      console.error('Error fetching available addons:', err);
      setAvailableAddons([]);
    }
  }, [firmAddons]);

  useEffect(() => {
    fetchFirmAddons();
  }, [fetchFirmAddons]);

  useEffect(() => {
    if (showAddModal) {
      fetchAvailableAddons();
    }
  }, [showAddModal, fetchAvailableAddons]);

  const handleAddAddon = async (addonId) => {
    try {
      setAddingAddon(addonId);
      // Note: This endpoint might need to be created on the backend
      // For now, we'll use the firm admin endpoint if super admin has access
      // Or we might need to create a super admin specific endpoint
      toast.info('Adding addon to firm...', {
        position: 'top-right',
        autoClose: 2000
      });
      
      // TODO: Implement super admin endpoint to add addon to firm
      // For now, show a message that this needs backend support
      toast.warning('Super admin add addon endpoint needs to be implemented', {
        position: 'top-right',
        autoClose: 3000
      });
      
      // After implementation, refresh the list
      // await fetchFirmAddons();
    } catch (err) {
      console.error('Error adding addon:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to add addon', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setAddingAddon(null);
      setShowAddModal(false);
    }
  };

  const handleRemoveAddon = (firmAddon) => {
    setAddonToRemove(firmAddon);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveAddon = async () => {
    if (!addonToRemove) return;

    try {
      setRemovingAddon(addonToRemove.id);
      // TODO: Implement super admin endpoint to remove addon from firm
      toast.warning('Super admin remove addon endpoint needs to be implemented', {
        position: 'top-right',
        autoClose: 3000
      });
      
      // After implementation:
      // const response = await superAdminAddonsAPI.removeAddonFromFirm(firmId, addonToRemove.id);
      // if (response.success) {
      //   toast.success(response.message || 'Addon removed successfully');
      //   fetchFirmAddons();
      // }
      
      setShowRemoveConfirm(false);
      setAddonToRemove(null);
    } catch (err) {
      console.error('Error removing addon:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to remove addon', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setRemovingAddon(null);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '$0.00';
    }
    return Number(value).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white/95 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-b-transparent border-[#F56D2D]" />
            Loading addons...
          </div>
        </div>
      </div>
    );
  }

  const totalAddonCost = firmAddons.reduce((sum, fa) => sum + (parseFloat(fa.monthly_cost || 0)), 0);

  return (
    <div className="rounded-xl bg-white/95 p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h5 className="text-xl font-semibold text-[#1E293B] font-[BasisGrotesquePro]">Firm Addons</h5>
          <p className="mt-1 text-sm text-[#64748B] font-[BasisGrotesquePro]">
            Manage addons for {firmName || 'this firm'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-orange-600 transition-colors font-[BasisGrotesquePro] text-sm font-medium"
        >
          + Add Addon
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-[BasisGrotesquePro]">
          {error}
        </div>
      )}

      {/* Total Cost Summary */}
      {totalAddonCost > 0 && (
        <div className="mb-6 bg-[#F6F8FE] border border-[#E8F0FF] rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">Total Addon Cost</span>
            <span className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">
              {formatCurrency(totalAddonCost)}/month
            </span>
          </div>
        </div>
      )}

      {/* Firm Addons List */}
      {firmAddons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-4">
            No addons added to this firm yet.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#3AD6F2] text-white rounded-lg hover:bg-[#2BC5E0] transition-colors font-[BasisGrotesquePro] text-sm font-medium"
          >
            Add First Addon
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {firmAddons.map((firmAddon) => {
            const addon = firmAddon.addon || {};
            return (
              <div
                key={firmAddon.id}
                className="border border-[#E8F0FF] rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h6 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">
                        {addon.name || 'Unknown Addon'}
                      </h6>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full font-[BasisGrotesquePro] ${
                        firmAddon.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {firmAddon.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {addon.description && (
                      <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-3">
                        {addon.description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 font-[BasisGrotesquePro]">Price: </span>
                        <span className="font-semibold text-gray-900 font-[BasisGrotesquePro]">
                          {addon.price_display || formatCurrency(addon.price)}
                        </span>
                      </div>
                      {firmAddon.monthly_cost > 0 && (
                        <div>
                          <span className="text-gray-600 font-[BasisGrotesquePro]">Monthly Cost: </span>
                          <span className="font-semibold text-gray-900 font-[BasisGrotesquePro]">
                            {formatCurrency(firmAddon.monthly_cost)}
                          </span>
                        </div>
                      )}
                      {firmAddon.usage_limit && (
                        <div>
                          <span className="text-gray-600 font-[BasisGrotesquePro]">Usage: </span>
                          <span className="font-semibold text-gray-900 font-[BasisGrotesquePro]">
                            {firmAddon.usage_display || `${firmAddon.usage || 0}/${firmAddon.usage_limit}`}
                          </span>
                        </div>
                      )}
                      {firmAddon.started_at && (
                        <div>
                          <span className="text-gray-600 font-[BasisGrotesquePro]">Started: </span>
                          <span className="font-semibold text-gray-900 font-[BasisGrotesquePro]">
                            {new Date(firmAddon.started_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAddon(firmAddon)}
                    disabled={removingAddon === firmAddon.id}
                    className="ml-4 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-[BasisGrotesquePro] font-medium disabled:opacity-50"
                  >
                    {removingAddon === firmAddon.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Addon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
                  Add Addon to Firm
                </h4>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                  Select an addon to add to {firmName || 'this firm'}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {availableAddons.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                  No available addons to add. All active addons are already added to this firm.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableAddons.map((addon) => (
                  <div
                    key={addon.id}
                    className="border border-[#E8F0FF] rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h6 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
                          {addon.name}
                        </h6>
                        {addon.description && (
                          <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">
                            {addon.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-semibold text-gray-900 font-[BasisGrotesquePro]">
                            {addon.price_display || formatCurrency(addon.price)}
                          </span>
                          <span className="text-gray-600 font-[BasisGrotesquePro]">
                            {addon.price_unit || 'per use'}
                          </span>
                          <span className="text-gray-600 font-[BasisGrotesquePro] capitalize">
                            {addon.billing_frequency || 'one_time'} billing
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddAddon(addon.id)}
                        disabled={addingAddon === addon.id}
                        className="ml-4 px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-orange-600 transition-colors font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50"
                      >
                        {addingAddon === addon.id ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && addonToRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ zIndex: 10000 }}>
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <h4 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro] mb-2">
              Remove Addon
            </h4>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">
              Are you sure you want to remove "{addonToRemove.addon?.name || 'this addon'}" from {firmName || 'this firm'}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRemoveConfirm(false);
                  setAddonToRemove(null);
                }}
                className="px-4 py-2 border border-[#E8F0FF] bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveAddon}
                disabled={!!removingAddon}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50"
              >
                {removingAddon ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

