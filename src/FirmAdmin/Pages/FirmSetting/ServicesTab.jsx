import React, { useState, useEffect } from 'react';
import { firmAdminSettingsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import './ServicesTab.css';

export default function ServicesTab() {
  const [services, setServices] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState({
    default_late_fee: 25.00,
    interest_rate: 15.00,
    payment_terms: 'Net 30'
  });
  const [editingService, setEditingService] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch services information on mount
  useEffect(() => {
    const fetchServicesInfo = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await firmAdminSettingsAPI.getServicesInfo();
        
        if (response.success && response.data) {
          setServices(response.data.services || []);
          setPaymentSettings({
            default_late_fee: response.data.default_late_fee || 25.00,
            interest_rate: response.data.interest_rate || 15.00,
            payment_terms: response.data.payment_terms || 'Net 30'
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

  const toggleService = (serviceName) => {
    setServices(prev => prev.map(service => 
      service.name === serviceName 
        ? { ...service, enabled: !service.enabled }
        : service
    ));
  };

  const handleEditService = (service) => {
    setEditingService(service.name);
    setEditPrice(service.base_price?.toString() || '');
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setEditPrice('');
  };

  const handleSaveEdit = (serviceName) => {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setServices(prev => prev.map(service => 
      service.name === serviceName 
        ? { ...service, base_price: price }
        : service
    ));
    setEditingService(null);
    setEditPrice('');
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

      const servicesData = {
        services: services.map(service => ({
          name: service.name,
          enabled: service.enabled,
          base_price: service.base_price ?? null
        })),
        default_late_fee: parseFloat(paymentSettings.default_late_fee),
        interest_rate: parseFloat(paymentSettings.interest_rate),
        payment_terms: paymentSettings.payment_terms
      };

      const response = await firmAdminSettingsAPI.updateServicesInfo(servicesData, 'PATCH');
      
      if (response.success) {
        toast.success('Services settings updated successfully');
        // Update with response data if needed
        if (response.data) {
          if (response.data.services) {
            setServices(response.data.services);
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
      {/* Service Pricing Section */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF] service-card">
        <div className="mb-5">
          <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Service Pricing
          </h5>
          <p className="text-sm text-[#7B8AB2] font-[BasisGrotesquePro]">
            Manage your firm's services and pricing
          </p>
        </div>

        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between p-4 !border border-[#E8F0FF] rounded-lg service-item"
            >
              <div className="flex items-center gap-4 flex-1 service-item-inner">
                <label className="relative inline-flex cursor-pointer items-center flex-shrink-0 service-item-toggle">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={service.enabled}
                    onChange={() => toggleService(service.name)}
                  />
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${
                    service.enabled ? 'bg-[#F56D2D]' : 'bg-gray-300'
                  }`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      service.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </label>
                <div className="flex-1">
                  <h6 className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                    {service.name}
                  </h6>
                  <p className="text-[16px] text-[#4B5563] font-[BasisGrotesquePro]">
                    {service.enabled ? 'Active service' : 'Inactive service'}
                  </p>
                </div>
                {editingService === service.name ? (
                  <div className="flex items-center gap-2 service-item-actions">
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="w-24 rounded-lg !border border-[#E8F0FF] px-2 py-1 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro]"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(service.name)}
                      className="px-3 py-1 text-xs font-medium text-white bg-[#F56D2D] !rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro]"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-xs font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 service-item-actions">
                    <div className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">
                      ${service.base_price?.toFixed(2) || '0.00'}<br />Base price
                    </div>
                    <button 
                      onClick={() => handleEditService(service)}
                      className="px-4 py-2 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Default Late Fee ($)
            </label>
            <select 
              value={paymentSettings.default_late_fee}
              onChange={(e) => handlePaymentSettingsChange('default_late_fee', parseFloat(e.target.value))}
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro] cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
              <option value={100}>100</option>
            </select>
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
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Payment Terms
            </label>
            <select 
              value={paymentSettings.payment_terms}
              onChange={(e) => handlePaymentSettingsChange('payment_terms', e.target.value)}
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro] cursor-pointer"
            >
              <option value="Net 30">Net 30</option>
              <option value="Net 15">Net 15</option>
              <option value="Net 45">Net 45</option>
              <option value="Net 60">Net 60</option>
              <option value="Due on Receipt">Due on Receipt</option>
            </select>
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
    </div>  
  );
}

