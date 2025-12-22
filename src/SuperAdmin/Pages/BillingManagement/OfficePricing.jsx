import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { superAdminBillingAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';

const API_BASE_URL = getApiBaseUrl();

export default function OfficePricing() {
  const [pricingList, setPricingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState(null);
  const [firms, setFirms] = useState([]);
  const [firmFilter, setFirmFilter] = useState('');

  const [formData, setFormData] = useState({
    firm_id: '',
    price_per_office: '',
    is_active: true
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

  // Fetch office pricing
  const fetchOfficePricing = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (firmFilter) {
        params.firm_id = firmFilter;
      }
      const response = await superAdminBillingAPI.listOfficePricing(params);
      
      if (response.success) {
        setPricingList(Array.isArray(response.data) ? response.data : []);
      } else {
        throw new Error(response.message || 'Failed to load office pricing');
      }
    } catch (err) {
      console.error('Error fetching office pricing:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load office pricing');
      setPricingList([]);
    } finally {
      setLoading(false);
    }
  }, [firmFilter]);

  useEffect(() => {
    fetchFirms();
  }, [fetchFirms]);

  useEffect(() => {
    fetchOfficePricing();
  }, [fetchOfficePricing]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOpenModal = (pricing = null) => {
    if (pricing) {
      setEditingPricing(pricing);
      setFormData({
        firm_id: pricing.firm?.toString() || pricing.firm_id?.toString() || '',
        price_per_office: pricing.price_per_office || '',
        is_active: pricing.is_active !== false
      });
    } else {
      setEditingPricing(null);
      setFormData({
        firm_id: '',
        price_per_office: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPricing(null);
    setFormData({
      firm_id: '',
      price_per_office: '',
      is_active: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.firm_id || !formData.price_per_office) {
      toast.error('Please fill in all required fields', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      const payload = {
        firm_id: parseInt(formData.firm_id),
        price_per_office: parseFloat(formData.price_per_office),
        is_active: formData.is_active
      };

      const response = await superAdminBillingAPI.createOrUpdateOfficePricing(payload);

      if (response.success) {
        toast.success(response.message || 'Office pricing saved successfully', {
          position: 'top-right',
          autoClose: 3000
        });
        handleCloseModal();
        fetchOfficePricing();
      } else {
        throw new Error(response.message || 'Failed to save office pricing');
      }
    } catch (err) {
      console.error('Error saving office pricing:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to save office pricing', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const getFirmName = (firmId) => {
    const firm = firms.find(f => f.id === firmId || f.firm_id === firmId);
    return firm?.name || firm?.firm_name || `Firm #${firmId}`;
  };

  if (loading && pricingList.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#E8F0FF] p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading office pricing...</p>
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
              Office Pricing
            </h3>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
              Configure per-office pricing for additional office locations
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-orange-600 transition-colors font-[BasisGrotesquePro] text-sm font-medium"
          >
            + Add Office Pricing
          </button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
              Filter by Firm
            </label>
            <select
              value={firmFilter}
              onChange={(e) => setFirmFilter(e.target.value)}
              className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
            >
              <option value="">All Firms</option>
              {firms.map((firm) => (
                <option key={firm.id || firm.firm_id} value={firm.id || firm.firm_id}>
                  {firm.name || firm.firm_name}
                </option>
              ))}
            </select>
          </div>
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
                  Firm
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Price per Office
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pricingList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500 font-[BasisGrotesquePro]">
                    No office pricing configured
                  </td>
                </tr>
              ) : (
                pricingList.map((pricing) => (
                  <tr key={pricing.id} className="border-b border-[#E8F0FF] hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900 font-[BasisGrotesquePro]">
                      {pricing.firm_name || getFirmName(pricing.firm)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-[BasisGrotesquePro]">
                      ${parseFloat(pricing.price_per_office || 0).toFixed(2)}/month
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        pricing.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      } font-[BasisGrotesquePro]`}>
                        {pricing.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleOpenModal(pricing)}
                        className="text-[#3AD6F2] hover:text-[#2BC5E0] font-[BasisGrotesquePro] text-sm font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
                  {editingPricing ? 'Edit Office Pricing' : 'Add Office Pricing'}
                </h4>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                  Configure pricing for additional office locations
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                  Firm <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.firm_id}
                  onChange={(e) => handleInputChange('firm_id', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                  disabled={!!editingPricing}
                >
                  <option value="">Select Firm</option>
                  {firms.map((firm) => (
                    <option key={firm.id || firm.firm_id} value={firm.id || firm.firm_id}>
                      {firm.name || firm.firm_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                  Price per Office (Monthly) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-[BasisGrotesquePro]">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_per_office}
                    onChange={(e) => handleInputChange('price_per_office', e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                    placeholder="50.00"
                  />
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
                  <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Active</span>
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
                  {editingPricing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

