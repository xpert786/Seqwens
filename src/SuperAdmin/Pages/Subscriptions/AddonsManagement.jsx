import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { superAdminAddonsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';

export default function AddonsManagement() {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);
  const [togglingAddonId, setTogglingAddonId] = useState(null);
  const [simpleAddons, setSimpleAddons] = useState([]);
  const [loadingSimpleAddons, setLoadingSimpleAddons] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    addon_type: '',
    description: '',
    features: [''],
    price: '',
    price_unit: 'per month',
    billing_frequency: 'monthly',
    is_active: true
  });

  // Fetch addons
  const fetchAddons = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await superAdminAddonsAPI.listAddons();

      if (response.success && response.data) {
        setAddons(Array.isArray(response.data.addons) ? response.data.addons : []);
      } else {
        throw new Error(response.message || 'Failed to load addons');
      }
    } catch (err) {
      console.error('Error fetching addons:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load addons');
      setAddons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  // Fetch addon types list for dropdown
  const fetchSimpleAddons = useCallback(async () => {
    try {
      setLoadingSimpleAddons(true);
      const response = await superAdminAddonsAPI.listAddons();

      if (response.success && response.data && response.data.addons) {
        // Extract addon types from the full list
        const addonTypes = response.data.addons.map(addon => ({
          addon_type: addon.addon_type,
          name: addon.name,
          features: addon.features || []
        }));
        setSimpleAddons(addonTypes);
      } else {
        setSimpleAddons([]);
      }
    } catch (err) {
      console.error('Error fetching addon types:', err);
      setSimpleAddons([]);
    } finally {
      setLoadingSimpleAddons(false);
    }
  }, []);

  useEffect(() => {
    if (showAddModal && !editingAddon) {
      fetchSimpleAddons();
    }
  }, [showAddModal, editingAddon, fetchSimpleAddons]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({
      ...prev,
      features: newFeatures
    }));
  };

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const handleRemoveFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      features: newFeatures.length > 0 ? newFeatures : ['']
    }));
  };

  const handleOpenAddModal = () => {
    setEditingAddon(null);
    setFormData({
      name: '',
      addon_type: '',
      description: '',
      features: [''],
      price: '',
      price_unit: 'per month',
      billing_frequency: 'monthly',
      is_active: true
    });
    setShowAddModal(true);
  };

  const handleAddonTypeSelect = (selectedAddonType) => {
    const selectedAddon = simpleAddons.find(addon => addon.addon_type === selectedAddonType);
    if (selectedAddon) {
      setFormData(prev => ({
        ...prev,
        addon_type: selectedAddon.addon_type,
        name: selectedAddon.name || selectedAddon.addon_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        features: selectedAddon.features && selectedAddon.features.length > 0 ? selectedAddon.features : ['']
      }));
    }
  };

  const handleOpenEditModal = (addon) => {
    setEditingAddon(addon);
    setFormData({
      name: addon.name || '',
      addon_type: addon.addon_type || '',
      description: addon.description || '',
      features: Array.isArray(addon.features) && addon.features.length > 0 ? addon.features : [''],
      price: addon.price || '',
      price_unit: addon.price_unit || 'per month',
      billing_frequency: addon.billing_frequency || 'monthly',
      is_active: addon.is_active !== false
    });
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingAddon(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.addon_type || !formData.price) {
      toast.error('Please fill in all required fields', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      const payload = {
        name: formData.name,
        addon_type: formData.addon_type,
        description: formData.description || '',
        features: formData.features.filter(f => f.trim() !== ''),
        price: parseFloat(formData.price).toFixed(2),
        price_unit: formData.price_unit || 'per month',
        billing_frequency: formData.billing_frequency || 'monthly',
        is_active: formData.is_active !== false
      };

      let response;
      if (editingAddon) {
        response = await superAdminAddonsAPI.updateAddonPartial(editingAddon.id, payload);
      } else {
        response = await superAdminAddonsAPI.createAddon(payload);
      }

      if (response.success) {
        toast.success(response.message || 'Addon saved successfully', {
          position: 'top-right',
          autoClose: 3000
        });
        handleCloseModal();
        fetchAddons();
      } else {
        throw new Error(response.message || 'Failed to save addon');
      }
    } catch (err) {
      console.error('Error saving addon:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to save addon', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const handleToggleStatus = async (addonId) => {
    try {
      setTogglingAddonId(addonId);
      const response = await superAdminAddonsAPI.toggleAddonStatus(addonId);

      if (response.success) {
        toast.success(response.message || 'Addon status updated successfully', {
          position: 'top-right',
          autoClose: 3000
        });
        fetchAddons();
      } else {
        throw new Error(response.message || 'Failed to toggle addon status');
      }
    } catch (err) {
      console.error('Error toggling addon status:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to toggle addon status', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setTogglingAddonId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-[#E8F0FF] p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading addons...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-[#E8F0FF] p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
              Addons Management
            </h3>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
              Manage addons for additional offices, users, and storage
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-orange-600 transition-colors font-[BasisGrotesquePro] text-sm font-medium"
            style={{ borderRadius: '7px' }}
          >
            + Add Addon
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8F0FF]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Addon Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Price
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Billing
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Statistics
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {addons.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500 font-[BasisGrotesquePro]">
                    No addons configured
                  </td>
                </tr>
              ) : (
                addons.map((addon) => (
                  <tr key={addon.id} className="border-b border-[#E8F0FF] hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900 font-[BasisGrotesquePro]">
                      <div className="font-semibold">{addon.name}</div>
                      {addon.description && (
                        <div className="text-xs text-gray-500 mt-1">{addon.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-[BasisGrotesquePro]">
                      <code className="px-2 py-1 bg-gray-100 rounded text-xs">{addon.addon_type}</code>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-[BasisGrotesquePro]">
                      <div className="font-semibold">{addon.price_display || `$${parseFloat(addon.price || 0).toFixed(2)}`}</div>
                      <div className="text-xs text-gray-500">{addon.price_unit || 'per month'}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-[BasisGrotesquePro]">
                      <span className="capitalize">{addon.billing_frequency || 'one_time'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${addon.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                        } font-[BasisGrotesquePro]`}>
                        {addon.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-[BasisGrotesquePro]">
                      {addon.statistics ? (
                        <div className="text-xs">
                          <div>Total: {addon.statistics.total_firms || 0}</div>
                          <div>Active: {addon.statistics.active_firms || 0}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEditModal(addon)}
                          className="text-[#3AD6F2] hover:text-[#2BC5E0] font-[BasisGrotesquePro] text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(addon.id)}
                          disabled={togglingAddonId === addon.id}
                          className="text-[#F56D2D] hover:text-orange-600 font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50"
                        >
                          {togglingAddonId === addon.id ? 'Toggling...' : (addon.is_active ? 'Deactivate' : 'Activate')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1070] p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
                  {editingAddon ? 'Edit Addon' : 'Add New Addon'}
                </h4>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                  Configure addon details for firms to purchase
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                    placeholder="Additional Office"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                    Addon Type <span className="text-red-500">*</span>
                  </label>
                  {editingAddon ? (
                    <input
                      type="text"
                      value={formData.addon_type}
                      disabled
                      className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm disabled:bg-gray-100"
                      placeholder="additional_office_address"
                    />
                  ) : (
                    <>
                      <select
                        value={formData.addon_type}
                        onChange={(e) => handleAddonTypeSelect(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                      >
                        <option value="">Select an addon type...</option>
                        {loadingSimpleAddons ? (
                          <option value="" disabled>Loading addon types...</option>
                        ) : (
                          simpleAddons.map((addon) => (
                            <option key={addon.addon_type} value={addon.addon_type}>
                              {addon.name || addon.addon_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </option>
                          ))
                        )}
                      </select>
                      {!editingAddon && (
                        <p className="mt-1 text-xs text-gray-500 font-[BasisGrotesquePro]">
                          Selecting an addon type will auto-populate name and features
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                  placeholder="Add additional office locations to your subscription plan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                  Features
                </label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                      placeholder="Feature description"
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-[BasisGrotesquePro] text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="mt-2 px-3 py-1 text-sm text-[#3AD6F2] hover:text-[#2BC5E0] font-[BasisGrotesquePro]"
                >
                  + Add Feature
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-[BasisGrotesquePro]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      required
                      className="w-full pl-8 pr-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                      placeholder="50.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                    Price Unit
                  </label>
                  <input
                    type="text"
                    value={formData.price_unit}
                    onChange={(e) => handleInputChange('price_unit', e.target.value)}
                    className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                    placeholder="per month"
                  />
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
                    <option value="monthly">Monthly</option>
                    <option value="one_time">One Time</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="w-4 h-4 text-[#3AD6F2] border-gray-300 rounded focus:ring-[#3AD6F2]"
                  />
                  <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Active (Available to firms)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-[#E8F0FF] bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-orange-600 transition-colors font-[BasisGrotesquePro] text-sm font-medium"
                >
                  {editingAddon ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

