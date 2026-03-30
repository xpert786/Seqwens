import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { superAdminAddonsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';

const ADDON_CATEGORIES = [
  { value: 'esign', label: 'E-Signatures' },
  { value: 'storage', label: 'Storage' },
  { value: 'office', label: 'Offices' },
  { value: 'staff', label: 'Staff' },
  { value: 'workflow', label: 'Workflows' },
  { value: 'clients', label: 'Clients' }
];

const SCOPE_TYPES = [
  { value: 'firm', label: 'Firm-wide' },
  { value: 'office', label: 'Per Office' }
];

const LIMIT_TYPES = [
  { value: 'enabled', label: 'Enabled' },
  { value: 'limited', label: 'Limited (with limits)' },
  { value: 'unlimited', label: 'Unlimited' }
];

export default function AddonsManagement() {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);
  const [togglingAddonId, setTogglingAddonId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    addon_type: '',
    category: 'staff',
    description: '',
    features: [''],
    price: '',
    price_unit: 'per month',
    billing_frequency: 'monthly',
    is_active: true,
    limit_type: 'enabled',
    limit_value: '',
    unit_type: 'unit',
    unit_quantity: 1,
    scope: 'firm'
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
      category: 'staff',
      description: '',
      features: [''],
      price: '',
      price_unit: 'per month',
      billing_frequency: 'monthly',
      is_active: true,
      limit_type: 'enabled',
      limit_value: '',
      unit_type: 'unit',
      unit_quantity: 1,
      scope: 'firm'
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (addon) => {
    setEditingAddon(addon);
    setFormData({
      name: addon.name || '',
      addon_type: addon.addon_type || '',
      category: addon.category || 'staff',
      description: addon.description || '',
      features: Array.isArray(addon.features) && addon.features.length > 0 ? addon.features : [''],
      price: addon.price || '',
      price_unit: addon.price_unit || 'per month',
      billing_frequency: addon.billing_frequency || 'monthly',
      is_active: addon.is_active !== false,
      limit_type: addon.limit_type || 'enabled',
      limit_value: addon.limit_value || '',
      unit_type: addon.unit_type || 'unit',
      unit_quantity: addon.unit_quantity || 1,
      scope: addon.scope || 'firm'
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

    if (formData.limit_type === 'limited' && !formData.limit_value) {
      toast.error('Please specify a limit value', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      const payload = {
        name: formData.name,
        addon_type: formData.addon_type,
        category: formData.category,
        description: formData.description || '',
        features: formData.features.filter(f => f.trim() !== ''),
        price: parseFloat(formData.price).toFixed(2),
        price_unit: formData.price_unit || 'per month',
        billing_frequency: formData.billing_frequency || 'monthly',
        is_active: formData.is_active !== false,
        limit_type: formData.limit_type,
        limit_value: formData.limit_type === 'limited' ? parseInt(formData.limit_value) : null,
        unit_type: formData.unit_type,
        unit_quantity: parseInt(formData.unit_quantity),
        scope: formData.scope
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

  const getLimitDisplay = (addon) => {
    if (addon.limit_type === 'unlimited') return 'Unlimited';
    if (addon.limit_type === 'limited') return `${addon.limit_value} (Limited)`;
    return 'Enabled';
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
            className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg transition-colors font-[BasisGrotesquePro] text-sm font-medium"
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
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse" style={{ minWidth: '1200px' }}>
            <thead>
              <tr className="border-b border-[#E8F0FF] bg-gray-50/50">
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[300px]">
                  Addon Details
                </th>
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[180px]">
                  Technical Identity
                </th>
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[120px]">
                  Scope
                </th>
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[150px]">
                  Usage Mode
                </th>
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[120px]">
                  Pricing
                </th>
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[120px]">
                  Cycle
                </th>
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[100px]">
                  Status
                </th>
                <th className="text-right py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[150px]">
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
                    <td className="py-4 px-4 font-[BasisGrotesquePro]">
                      <div className="flex flex-col max-w-[280px]">
                        <div className="font-bold text-gray-900 group-hover:text-[#F56D2D] transition-colors">{addon.name}</div>
                        {addon.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-3 leading-relaxed" title={addon.description}>
                            {addon.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-[BasisGrotesquePro]">
                      <div className="flex flex-col gap-1.5 items-start">
                        <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                          {addon.addon_type}
                        </code>
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter transition-all">
                          {addon.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-[BasisGrotesquePro]">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${addon.scope === 'office' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                        {addon.scope === 'office' ? 'Per Office' : 'Firm-wide'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-[BasisGrotesquePro]">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${addon.limit_type === 'unlimited' ? 'bg-purple-100 text-purple-700' :
                        addon.limit_type === 'limited' ? 'bg-blue-100 text-blue-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                        {getLimitDisplay(addon)}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-[BasisGrotesquePro]">
                      <div className="font-bold text-gray-900">{addon.price_display || `$${parseFloat(addon.price || 0).toFixed(2)}`}</div>
                      <div className="text-[10px] text-gray-400 font-medium uppercase">{addon.price_unit || 'per month'}</div>
                    </td>
                    <td className="py-4 px-4 font-[BasisGrotesquePro]">
                      <span className="text-xs font-semibold text-gray-600 capitalize">
                        {addon.billing_frequency === 'monthly' ? 'Monthly' :
                          addon.billing_frequency === 'yearly' ? 'Annually' :
                            addon.billing_frequency === 'one_time' ? 'One-time' :
                              (addon.billing_frequency || 'Monthly')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${addon.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                        } font-[BasisGrotesquePro]`}>
                        {addon.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => handleOpenEditModal(addon)}
                          className="text-[#3AD6F2] hover:text-[#2BC5E0] font-[BasisGrotesquePro] text-xs font-bold uppercase transition-transform active:scale-95"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(addon.id)}
                          disabled={togglingAddonId === addon.id}
                          className="text-[#F56D2D] hover:text-orange-600 font-[BasisGrotesquePro] text-xs font-bold uppercase disabled:opacity-50 transition-transform active:scale-95"
                        >
                          {togglingAddonId === addon.id ? 'Wait...' : (addon.is_active ? 'Hide' : 'Show')}
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
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4" 
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-2xl rounded-2xl shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto border border-[#E8F0FF]/20">
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
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 font-[BasisGrotesquePro]">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-[#E8F0FF] dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm dark:bg-gray-800 dark:text-white transition-all shadow-sm"
                    placeholder="e.g. Additional User Pack"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 font-[BasisGrotesquePro]">
                    Technical Identifier <span className="text-red-500">*</span>
                  </label>
                  {editingAddon ? (
                    <div className="flex flex-col gap-1">
                      <div className="px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-[#E8F0FF] dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 font-mono text-xs break-all">
                        {formData.addon_type}
                      </div>
                      <p className="text-[10px] text-orange-500 font-medium">Technical ID cannot be changed after creation</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        value={formData.addon_type}
                        onChange={(e) => handleInputChange('addon_type', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                        required
                        className="w-full px-3 py-2 border border-[#E8F0FF] dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm dark:bg-gray-800 dark:text-white"
                        placeholder="e.g. additional_users_5"
                      />
                      <p className="text-[10px] text-gray-400">Use underscores instead of spaces (e.g. storage_upgrade_10gb)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 font-[BasisGrotesquePro]">
                    Display Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-[#E8F0FF] dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm dark:bg-gray-800 dark:text-white transition-all shadow-sm"
                  >
                    {ADDON_CATEGORIES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 font-[BasisGrotesquePro]">
                    Scope <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-6 mt-3">
                    {SCOPE_TYPES.map((scope) => (
                      <label key={scope.value} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="radio"
                          name="scope"
                          value={scope.value}
                          checked={formData.scope === scope.value}
                          onChange={(e) => handleInputChange('scope', e.target.value)}
                          className="w-4 h-4 text-[#3AD6F2] border-gray-300 focus:ring-[#3AD6F2] dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium font-[BasisGrotesquePro] group-hover:text-[#3AD6F2] transition-colors">{scope.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 font-[BasisGrotesquePro]">
                    Unit Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.unit_type}
                    onChange={(e) => handleInputChange('unit_type', e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-[#E8F0FF] dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm dark:bg-gray-800 dark:text-white transition-all shadow-sm"
                    placeholder="e.g. User, GB, Office"
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5 font-medium">What is being sold (e.g. '100 requests', '500GB', 'location')</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 font-[BasisGrotesquePro]">
                    Base Unit Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.unit_quantity}
                    onChange={(e) => handleInputChange('unit_quantity', e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-[#E8F0FF] dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm dark:bg-gray-800 dark:text-white transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Limit Config Section */}
              <div className="bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-[#E8F0FF] dark:border-gray-700 shadow-inner">
                <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 font-[BasisGrotesquePro] uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3AD6F2]"></div>
                  Usage Limits
                </h5>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-tighter">
                      Access Mode
                    </label>
                    <div className="flex flex-wrap gap-5">
                      {LIMIT_TYPES.map((type) => (
                        <label key={type.value} className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="radio"
                            name="limit_type"
                            value={type.value}
                            checked={formData.limit_type === type.value}
                            onChange={(e) => handleInputChange('limit_type', e.target.value)}
                            className="w-4 h-4 text-[#3AD6F2] border-gray-300 focus:ring-[#3AD6F2] dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium font-[BasisGrotesquePro] group-hover:text-[#3AD6F2] transition-colors">{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {formData.limit_type === 'limited' && (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 font-[BasisGrotesquePro]">
                        Limit Amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.limit_value}
                        onChange={(e) => handleInputChange('limit_value', e.target.value)}
                        className="w-full px-3 py-2.5 border border-[#E8F0FF] dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm dark:bg-gray-900 dark:text-white shadow-sm"
                        placeholder="e.g. 10, 50, 100"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 font-[BasisGrotesquePro]">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2.5 border border-[#E8F0FF] dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm dark:bg-gray-800 dark:text-white transition-all shadow-sm"
                  placeholder="Describe the value of this addon..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 font-[BasisGrotesquePro]">
                  List of Features
                </label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-[#E8F0FF] dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm dark:bg-gray-800 dark:text-white"
                      placeholder="e.g. Priority Support"
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
                  className="mt-2 px-3 py-1 text-sm text-[#3AD6F2] font-[BasisGrotesquePro]"
                >
                  + Add Feature
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 font-[BasisGrotesquePro]">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-[BasisGrotesquePro]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      required
                      className="w-full pl-8 pr-3 py-2.5 border border-[#E8F0FF] dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm dark:bg-gray-800 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 font-[BasisGrotesquePro]">
                    Unit Price Label
                  </label>
                  <input
                    type="text"
                    value={formData.price_unit}
                    onChange={(e) => handleInputChange('price_unit', e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E8F0FF] dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm dark:bg-gray-800 dark:text-white"
                    placeholder="per month"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 font-[BasisGrotesquePro]">
                    Billing Cycle
                  </label>
                  <select
                    value={formData.billing_frequency}
                    onChange={(e) => handleInputChange('billing_frequency', e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E8F0FF] dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm dark:bg-gray-800 dark:text-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Annually</option>
                    <option value="one_time">One-time Fee</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="w-5 h-5 text-[#3AD6F2] border-[#E8F0FF] dark:border-gray-600 rounded-lg focus:ring-[#3AD6F2] dark:bg-gray-800"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium font-[BasisGrotesquePro] group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Active & Available to all firms</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-[#E8F0FF] dark:border-gray-700/50 mt-8">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 border border-[#E8F0FF] dark:border-gray-700 bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 rounded-xl dark:transition-all font-[BasisGrotesquePro] text-sm font-bold shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-[#F56D2D] text-white rounded-xl transition-all font-[BasisGrotesquePro] text-sm font-bold shadow-md shadow-orange-500/20 active:scale-[0.98]"
                >
                  {editingAddon ? 'Update Addon' : 'Create Addon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

