import React, { useState } from "react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';

const API_BASE_URL = getApiBaseUrl();

export default function AddClientModal({ isOpen, onClose, onClientCreated }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''
  });
  const [phoneCountry, setPhoneCountry] = useState('us');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    if (!formData.first_name.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.last_name.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
      };

      // Add phone_number only if provided
      if (formData.phone_number.trim()) {
        payload.phone_number = formData.phone_number.trim();
      }

      console.log('Creating client with payload:', payload);

      const token = getAccessToken();
      const response = await fetchWithCors(`${API_BASE_URL}/firm/clients/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Client created successfully:', result);

      setSuccess('Client created successfully!');

      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: ''
      });

      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
        // Trigger refresh callback if provided
        if (onClientCreated) {
          onClientCreated();
        }
        // Optionally refresh the page
        if (window.location) {
          window.location.reload();
        }
      }, 1500);

    } catch (err) {
      console.error('Error creating client:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to create client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6 relative"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h5 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">Add New Client</h5>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
              Create a new client profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center !rounded-full bg-blue-50 hover:bg-blue-100 text-gray-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#3B4A66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First and Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Enter first name"
                className="w-full !border border-gray-300 !rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 font-[BasisGrotesquePro] text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Enter last name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5  text-gray-900 placeholder-gray-400 font-[BasisGrotesquePro] text-sm"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="abc@gmail.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5  text-gray-900 placeholder-gray-400 font-[BasisGrotesquePro] text-sm"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">
              Phone
            </label>
            <PhoneInput
              country={phoneCountry}
              value={formData.phone_number || ''}
              onChange={(phone) => handleInputChange('phone_number', phone)}
              onCountryChange={(countryCode) => {
                setPhoneCountry(countryCode.toLowerCase());
              }}
              inputClass="form-control"
              containerClass="w-100 phone-input-container"
              inputStyle={{
                height: '45px',
                paddingLeft: '48px',
                paddingRight: '12px',
                paddingTop: '6px',
                paddingBottom: '6px',
                width: '100%',
                fontSize: '1rem',
                border: '1px solid #ced4da',
                borderRadius: '0.375rem',
                backgroundColor: '#fff'
              }}
              enableSearch={true}
              countryCodeEditable={false}
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition font-[BasisGrotesquePro] text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#F56D2D] text-white hover:bg-[#E55A1D] transition disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro] text-sm font-medium"
              style={{ borderRadius: '8px' }}
            >
              {loading ? 'Creating...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>

    </div >
  );
}