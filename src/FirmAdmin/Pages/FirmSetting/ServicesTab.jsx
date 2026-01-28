import React, { useState, useEffect } from 'react';
import { firmAdminSettingsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { FiX } from "react-icons/fi";
import './ServicesTab.css';

export default function ServicesTab() {
  const [services, setServices] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState({
    default_late_fee: 0.00,
    interest_rate: 1.5,
    payment_terms: 'Due on Receipt'
  });
  const [showAddService, setShowAddService] = useState(false);
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    base_price: '',
    category: 'Tax',
    enabled: true
  });
  const [newDiscount, setNewDiscount] = useState({
    name: '',
    type: 'percentage',
    value: '',
    auto_apply: false,
    enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Tax');
  const [editName, setEditName] = useState('');

  // Fetch services information on mount
  useEffect(() => {
    const fetchServicesInfo = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await firmAdminSettingsAPI.getServicesInfo();

        if (response.success && response.data) {
          setServices(response.data.services || []);
          setDiscounts(response.data.discounts || []);
          setPaymentSettings({
            default_late_fee: response.data.default_late_fee || 0.00,
            interest_rate: response.data.interest_rate || 1.5,
            payment_terms: response.data.payment_terms || 'Due on Receipt'
          });
        } else {
          throw new Error(response.message || 'Failed to load services information');
        }
      } catch (err) {
        console.error('Error fetching services info:', err);
        const errorMsg = handleAPIError(err);
        setError(errorMsg || 'Failed to load services information');
        toast.error(errorMsg || 'Failed to load services information');
      } finally {
        setLoading(false);
      }
    };

    fetchServicesInfo();
  }, []);

  const toggleService = async (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const newEnabled = !service.enabled;

    try {
      const isDefault = !serviceId || serviceId === 'null' || (typeof serviceId === 'string' && serviceId.startsWith('default_'));
      let response;

      if (isDefault) {
        const serviceData = {
          name: service.name,
          description: service.description || '',
          base_price: service.base_price || 0,
          category: service.category || 'Tax',
          enabled: newEnabled,
          display_order: service.display_order
        };
        response = await firmAdminSettingsAPI.addService(serviceData);
      } else {
        response = await firmAdminSettingsAPI.updateService(serviceId, { enabled: newEnabled });
      }

      if (response.success && response.data) {
        // Update with fresh data from backend (especially for the newly created ID)
        setServices(prev => prev.map(s =>
          s.id === serviceId ? response.data : s
        ));
      } else {
        throw new Error(response.message || 'Failed to update service status');
      }
    } catch (err) {
      console.error('Error toggling service:', err);
      // Revert local state on error
      setServices(prev => prev.map(s =>
        s.id === serviceId ? { ...s, enabled: !newEnabled } : s
      ));
      toast.error(handleAPIError(err) || 'Failed to update service status');
    }
  };

  const toggleDiscount = (discountId) => {
    setDiscounts(prev => prev.map(discount =>
      discount.id === discountId
        ? { ...discount, enabled: !discount.enabled }
        : discount
    ));
  };

  const handleEditService = (service) => {
    setSelectedService(service);
    setEditName(service.name || '');
    setEditPrice(service.base_price?.toString() || '0');
    setEditDescription(service.description || '');
    setEditCategory(service.category || 'Tax');
    setShowEditModal(true);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setSelectedService(null);
    setEditName('');
    setEditPrice('');
    setEditDescription('');
    setEditCategory('Tax');
  };

  const handleSaveEdit = async () => {
    if (!selectedService) return;
    const serviceId = selectedService.id;
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setSaving(true);
      const isDefault = !serviceId || serviceId === 'null' || (typeof serviceId === 'string' && serviceId.startsWith('default_'));
      let response;

      if (isDefault) {
        // Find the service name since we need it for creation
        const serviceData = {
          name: editName,
          description: editDescription,
          base_price: price,
          category: editCategory,
          enabled: selectedService.enabled,
          display_order: selectedService.display_order
        };
        response = await firmAdminSettingsAPI.addService(serviceData);
      } else {
        const updateData = {
          name: editName,
          base_price: price,
          description: editDescription,
          category: editCategory
        };
        response = await firmAdminSettingsAPI.updateService(serviceId, updateData);
      }

      if (response.success && response.data) {
        setServices(prev => prev.map(service =>
          service.id === serviceId ? response.data : service
        ));
        handleCancelEdit();
        toast.success(isDefault ? 'Service created successfully' : 'Service updated successfully');
      } else {
        throw new Error(response.message || 'Failed to save service');
      }
    } catch (err) {
      console.error('Error saving service:', err);
      toast.error(handleAPIError(err) || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        const isDefault = !serviceId || serviceId === 'null' || (typeof serviceId === 'string' && serviceId.startsWith('default_'));
        let response;

        if (isDefault) {
          // Find the service name since we need it to create a "deleted" record
          const service = services.find(s => s.id === serviceId);
          const serviceData = {
            name: service.name,
            description: service.description || '',
            base_price: service.base_price || 0,
            category: service.category || 'Tax',
            enabled: false,
            display_order: service.display_order,
            is_deleted: true
          };
          response = await firmAdminSettingsAPI.addService(serviceData);
        } else {
          response = await firmAdminSettingsAPI.deleteService(serviceId);
        }

        if (response.success) {
          setServices(prev => prev.filter(service => service.id !== serviceId));
          toast.success('Service deleted successfully');
        } else {
          throw new Error(response.message || 'Failed to delete service');
        }
      } catch (err) {
        console.error('Error deleting service:', err);
        toast.error(handleAPIError(err) || 'Failed to delete service');
      }
    }
  };

  const handleDeleteDiscount = (discountId) => {
    if (window.confirm('Are you sure you want to delete this discount?')) {
      setDiscounts(prev => prev.filter(discount => discount.id !== discountId));
      toast.success('Discount deleted successfully');
    }
  };

  const handleAddService = async () => {
    if (!newService.name.trim()) {
      toast.error('Please enter a service name');
      return;
    }
    const price = parseFloat(newService.base_price);
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setSaving(true);
      const serviceData = {
        name: newService.name.trim(),
        description: newService.description.trim(),
        base_price: price,
        category: newService.category,
        enabled: newService.enabled,
        display_order: services.length
      };

      const response = await firmAdminSettingsAPI.addService(serviceData);

      if (response.success && response.data) {
        setServices(prev => [...prev, response.data]);
        setNewService({
          name: '',
          description: '',
          base_price: '',
          category: 'Tax',
          enabled: true
        });
        setShowAddService(false);
        toast.success('Service added successfully');
      } else {
        throw new Error(response.message || 'Failed to add service');
      }
    } catch (err) {
      console.error('Error adding service:', err);
      toast.error(handleAPIError(err) || 'Failed to add service');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDiscount = () => {
    if (!newDiscount.name.trim()) {
      toast.error('Please enter a discount name');
      return;
    }
    const value = parseFloat(newDiscount.value);
    if (isNaN(value) || value < 0) {
      toast.error('Please enter a valid discount value');
      return;
    }
    if (newDiscount.type === 'percentage' && value > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    const discount = {
      id: `new_${Date.now()}`,
      name: newDiscount.name.trim(),
      type: newDiscount.type,
      value: value,
      auto_apply: newDiscount.auto_apply,
      enabled: newDiscount.enabled
    };

    setDiscounts(prev => [...prev, discount]);
    setNewDiscount({
      name: '',
      type: 'percentage',
      value: '',
      auto_apply: false,
      enabled: true
    });
    setShowAddDiscount(false);
    toast.success('Discount added successfully');
  };

  const handlePaymentSettingsChange = (field, value) => {
    setPaymentSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const settingsData = {
        discounts: discounts.map(discount => ({
          id: typeof discount.id === 'string' && discount.id.startsWith('new_') ? undefined : discount.id,
          name: discount.name,
          type: discount.type,
          value: discount.value,
          auto_apply: discount.auto_apply,
          enabled: discount.enabled
        })),
        default_late_fee: parseFloat(paymentSettings.default_late_fee) || 0,
        interest_rate: parseFloat(paymentSettings.interest_rate) || 0,
        payment_terms: paymentSettings.payment_terms
      };

      const response = await firmAdminSettingsAPI.updateServicesInfo(settingsData, 'PATCH');

      if (response.success) {
        toast.success('Services settings updated successfully');
        // Update with response data if needed
        if (response.data) {
          if (response.data.services) {
            setServices(response.data.services);
          }
          if (response.data.discounts) {
            setDiscounts(response.data.discounts);
          }
          if (response.data.default_late_fee !== undefined) {
            setPaymentSettings(prev => ({
              ...prev,
              default_late_fee: response.data.default_late_fee,
              interest_rate: response.data.interest_rate,
              payment_terms: response.data.payment_terms
            }));
          }
        }
      } else {
        throw new Error(response.message || 'Failed to update services settings');
      }
    } catch (err) {
      console.error('Error updating services info:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to update services settings');
      toast.error(errorMsg || 'Failed to update services settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm text-gray-600">Loading services settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 services-tab-container">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Helper Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 font-[BasisGrotesquePro]">
          <strong>Note:</strong> These settings define your default services, pricing, and billing rules. You can override prices, discounts, and terms on individual invoices.
        </p>
      </div>

      {/* Service Pricing Section */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF] service-card">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
              Services & Base Pricing
            </h5>
            <p className="text-sm text-[#7B8AB2] font-[BasisGrotesquePro]">
              Manage your firm's services, pricing, and categories
            </p>
          </div>
          <button
            onClick={() => setShowAddService(true)}
            className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Custom Service
          </button>
        </div>

        {/* Add Service Form */}
        {showAddService && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h6 className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-3">Add New Service</h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Amended Returns"
                  className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                  Base Price ($) *
                </label>
                <input
                  type="number"
                  value={newService.base_price}
                  onChange={(e) => setNewService(prev => ({ ...prev, base_price: e.target.value }))}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                  Category
                </label>
                <select
                  value={newService.category}
                  onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro] cursor-pointer"
                >
                  <option value="Tax">Tax</option>
                  <option value="Advisory">Advisory</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                  Description (Internal & Client-Facing)
                </label>
                <textarea
                  value={newService.description}
                  onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this service..."
                  rows="2"
                  className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAddService(false)}
                className="px-4 py-2 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddService}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] !rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro] disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Service'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id || service.name}
              className="flex items-start justify-between p-4 !border border-[#E8F0FF] rounded-lg service-item"
            >
              <div className="flex items-start gap-4 flex-1 service-item-inner">
                <label className="relative inline-flex cursor-pointer items-center flex-shrink-0 service-item-toggle mt-1">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={service.enabled}
                    onChange={() => toggleService(service.id)}
                  />
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${service.enabled ? 'bg-[#F56D2D]' : 'bg-gray-300'
                    }`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${service.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                  </div>
                </label>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h6 className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                      {service.name}
                    </h6>
                    {service.category && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {service.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#4B5563] font-[BasisGrotesquePro] mt-1">
                    {service.description || (service.enabled ? 'Active service' : 'Inactive service')}
                  </p>
                </div>
                <div className="flex items-center gap-3 service-item-actions">
                  <div className="text-right">
                    <div className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">
                      ${typeof service.base_price === 'number' ? service.base_price.toFixed(2) : parseFloat(service.base_price || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-[#7B8AB2] font-[BasisGrotesquePro]">Base price</div>
                  </div>
                  <button
                    onClick={() => handleEditService(service)}
                    className="px-3 py-1.5 text-xs font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white !border border-red-200 !rounded-lg hover:bg-red-50 transition font-[BasisGrotesquePro]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discounts & Adjustments Section */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
              Discounts & Adjustments
            </h5>
            <p className="text-sm text-[#7B8AB2] font-[BasisGrotesquePro]">
              Configure standard discounts for invoices
            </p>
          </div>
          <button
            onClick={() => setShowAddDiscount(true)}
            className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Discount
          </button>
        </div>

        {/* Add Discount Form */}
        {showAddDiscount && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h6 className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-3">Add New Discount</h6>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                  Discount Name *
                </label>
                <input
                  type="text"
                  value={newDiscount.name}
                  onChange={(e) => setNewDiscount(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Senior Discount"
                  className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                  Type
                </label>
                <select
                  value={newDiscount.type}
                  onChange={(e) => setNewDiscount(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro] cursor-pointer"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                  Value *
                </label>
                <input
                  type="number"
                  value={newDiscount.value}
                  onChange={(e) => setNewDiscount(prev => ({ ...prev, value: e.target.value }))}
                  placeholder={newDiscount.type === 'percentage' ? '10' : '25.00'}
                  step="0.01"
                  min="0"
                  max={newDiscount.type === 'percentage' ? '100' : undefined}
                  className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro]"
                />
              </div>
              <div className="md:col-span-3">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={newDiscount.auto_apply}
                    onChange={(e) => setNewDiscount(prev => ({ ...prev, auto_apply: e.target.checked }))}
                  />
                  <div className="relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors peer-checked:bg-[#F56D2D] bg-gray-300">
                    <span className="inline-block h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                  </div>
                  <span className="ml-3 text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                    Auto-apply to invoices
                  </span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAddDiscount(false)}
                className="px-4 py-2 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDiscount}
                className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] !rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro]"
              >
                Add Discount
              </button>
            </div>
          </div>
        )}

        {discounts.length > 0 ? (
          <div className="space-y-3">
            {discounts.map((discount) => (
              <div
                key={discount.id}
                className="flex items-center justify-between p-4 !border border-[#E8F0FF] rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  <label className="relative inline-flex cursor-pointer items-center flex-shrink-0">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={discount.enabled}
                      onChange={() => toggleDiscount(discount.id)}
                    />
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${discount.enabled ? 'bg-[#F56D2D]' : 'bg-gray-300'
                      }`}>
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${discount.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                    </div>
                  </label>
                  <div className="flex-1">
                    <h6 className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                      {discount.name}
                    </h6>
                    <p className="text-xs text-[#4B5563] font-[BasisGrotesquePro]">
                      {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value.toFixed(2)}`} discount
                      {discount.auto_apply && ' • Auto-apply'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteDiscount(discount.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white !border border-red-200 !rounded-lg hover:bg-red-50 transition font-[BasisGrotesquePro]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-[#7B8AB2] font-[BasisGrotesquePro]">
            No discounts configured. Click "Add Discount" to create one.
          </div>
        )}
      </div>

      {/* Payment Terms Section */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-5">
          <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Payment Terms
          </h5>
          <p className="text-sm text-[#7B8AB2] font-[BasisGrotesquePro]">
            Configure default payment expectations for invoices
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Payment Terms
            </label>
            <select
              value={paymentSettings.payment_terms}
              onChange={(e) => handlePaymentSettingsChange('payment_terms', e.target.value)}
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro] cursor-pointer"
            >
              <option value="Due on Receipt">Due on Receipt</option>
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 45">Net 45</option>
              <option value="Net 60">Net 60</option>
            </select>
            <p className="text-xs text-[#7B8AB2] font-[BasisGrotesquePro] mt-1">
              When payment is expected after invoice date
            </p>
          </div>
        </div>
      </div>

      {/* Late Fees & Interest Section */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-5">
          <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Late Fees & Interest
          </h5>
          <p className="text-sm text-[#7B8AB2] font-[BasisGrotesquePro]">
            Configure penalties for overdue invoices
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Default Late Fee ($)
            </label>
            <input
              type="number"
              value={paymentSettings.default_late_fee}
              onChange={(e) => handlePaymentSettingsChange('default_late_fee', parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro]"
            />
            <p className="text-xs text-[#7B8AB2] font-[BasisGrotesquePro] mt-1">
              Leave blank or set to $0 to disable late fees
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Interest Rate (%)
            </label>
            <input
              type="number"
              value={paymentSettings.interest_rate}
              onChange={(e) => handlePaymentSettingsChange('interest_rate', parseFloat(e.target.value) || 0)}
              step="0.1"
              min="0"
              max="100"
              placeholder="0.0"
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro]"
            />
            <p className="text-xs text-[#7B8AB2] font-[BasisGrotesquePro] mt-1">
              Interest is applied monthly to overdue balances
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end services-save-container">
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

      {/* Edit Service Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#E8F0FF] overflow-hidden">
            <div className="p-6 border-b border-[#E8F0FF] flex justify-between items-center bg-[#F8FAFF]">
              <h3 className="text-lg font-bold text-[#1F2A55] font-[BasisGrotesquePro]">
                Edit Service
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-[#7B8AB2] hover:text-[#1F2A55] transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-1.5">
                  Service Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-[#E8F0FF] px-4 py-2.5 text-sm text-[#1F2A55] focus:outline-none focus:border-[#F56D2D] transition-colors font-[BasisGrotesquePro]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-1.5">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full rounded-xl border border-[#E8F0FF] px-4 py-2.5 text-sm text-[#1F2A55] focus:outline-none focus:border-[#F56D2D] transition-colors font-[BasisGrotesquePro] bg-white cursor-pointer"
                >
                  <option value="Tax">Tax</option>
                  <option value="Advisory">Advisory</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-1.5">
                  Base Price ($)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-[BasisGrotesquePro]">$</span>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full rounded-xl border border-[#E8F0FF] pl-8 pr-4 py-2.5 text-sm text-[#1F2A55] focus:outline-none focus:border-[#F56D2D] transition-colors font-[BasisGrotesquePro]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-1.5">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows="3"
                  className="w-full rounded-xl border border-[#E8F0FF] px-4 py-2.5 text-sm text-[#1F2A55] focus:outline-none focus:border-[#F56D2D] transition-colors font-[BasisGrotesquePro] resize-none"
                  placeholder="Service description..."
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={handleCancelEdit}
                className="px-5 py-2 text-sm font-medium text-[#1F2A55] bg-white border border-[#E8F0FF] rounded-xl hover:bg-gray-50 transition font-[BasisGrotesquePro]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-5 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-xl hover:bg-[#E55A1D] transition font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
