import React, { useState, useEffect } from 'react';
import { firmAdminSettingsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

export default function GeneralTab() {
  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    ein: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone_number: '',
    email: '',
    website: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch firm general information on mount
  useEffect(() => {
    const fetchGeneralInfo = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await firmAdminSettingsAPI.getGeneralInfo();
        
        if (response.success && response.data) {
          setFormData({
            name: response.data.name || '',
            legal_name: response.data.legal_name || response.data.name || '',
            ein: response.data.ein || '',
            description: response.data.description || '',
            address: response.data.address || '',
            city: response.data.city || '',
            state: response.data.state || '',
            zip_code: response.data.zip_code || '',
            phone_number: response.data.phone_number || '',
            email: response.data.email || '',
            website: response.data.website || ''
          });
        } else {
          throw new Error(response.message || 'Failed to load firm information');
        }
      } catch (err) {
        console.error('Error fetching firm general info:', err);
        const errorMsg = handleAPIError(err);
        setError(errorMsg || 'Failed to load firm information');
        toast.error(errorMsg || 'Failed to load firm information');
      } finally {
        setLoading(false);
      }
    };

    fetchGeneralInfo();
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Prepare data for API (exclude legal_name as it's read-only)
      const updateData = {
        name: formData.name,
        ein: formData.ein,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        phone_number: formData.phone_number,
        email: formData.email
        // website is not stored in database, so we don't send it
      };

      const response = await firmAdminSettingsAPI.updateGeneralInfo(updateData, 'PATCH');
      
      if (response.success && response.data) {
        // Update form data with response (including legal_name)
        setFormData(prev => ({
          ...prev,
          legal_name: response.data.legal_name || response.data.name || prev.legal_name
        }));
        toast.success('Firm information updated successfully');
      } else {
        throw new Error(response.message || 'Failed to update firm information');
      }
    } catch (err) {
      console.error('Error updating firm general info:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to update firm information');
      toast.error(errorMsg || 'Failed to update firm information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm text-gray-600">Loading firm information...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Firm Information Section */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Firm Information
          </h3>
          <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
            Basic information about your firm
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Firm Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55]  focus:outline-none  font-[BasisGrotesquePro]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Legal Name
              </label>
              <input
                type="text"
                name="legal_name"
                value={formData.legal_name}
                readOnly
                disabled
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro] bg-gray-50 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              EIN (Tax ID)
            </label>
            <input
              type="text"
              name="ein"
              value={formData.ein}
              onChange={handleInputChange}
              placeholder="12-3456789"
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Description
            </label>
            <textarea
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Professional tax preparation and accounting services for individuals and businesses."
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
            />
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Contact Information
          </h3>
          <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
            How clients can reach your firm
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Street Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="123 Main Street, Suite 100"
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="New York"
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="New York"
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleInputChange}
                placeholder="10001"
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Phone
              </label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="info@taxpracticepro.com"
                className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="www.taxpracticepro.com"
              disabled
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none  font-[BasisGrotesquePro] bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Website field is not currently stored in the database</p>
          </div>
        </div>
      </div>
      </div>
      
      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !formData.name.trim() || !formData.email.trim()}
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
    </div>
  );
}

