import React, { useState, useEffect } from "react";
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken, getUserData } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';

const API_BASE_URL = getApiBaseUrl();

export default function AddClientModal({ isOpen, onClose, onClientCreated }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    assigned_to_staff: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Staff members state
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState('');

  // Fetch staff members when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchStaffMembers = async () => {
        try {
          setStaffLoading(true);
          setStaffError('');

          const token = getAccessToken();
          const response = await fetchWithCors(`${API_BASE_URL}/firm/staff/list/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const result = await response.json();

          if (result.success && result.data && result.data.staff_members) {
            let staffList = result.data.staff_members;

            // Get current user (Firm Admin) data
            const currentUser = getUserData();
            console.log('Current Firm Admin User:', currentUser);
            if (currentUser && currentUser.id) {
              // Check if current user is already in the staff list
              const isCurrentUserInList = staffList.some(staff =>
                staff.id === currentUser.id ||
                staff.user_id === currentUser.id ||
                staff.staff_member?.id === currentUser.id
              );

              console.log('Is current user in staff list?', isCurrentUserInList);

              // If current user is not in the list, add them
              if (!isCurrentUserInList) {
                const currentUserAsStaff = {
                  id: currentUser.id,
                  user_id: currentUser.id,
                  name: currentUser.name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email || 'Firm Admin',
                  email: currentUser.email || '',
                  role_display: 'Firm Admin',
                  role: { primary: 'admin', role_type: 'admin' },
                  status: { value: 'active', is_active: true },
                  is_active: true
                };

                console.log('Adding current user to staff list:', currentUserAsStaff);

                // Add current user at the beginning of the list
                staffList = [currentUserAsStaff, ...staffList];
              }
            }

            console.log('Final staff list:', staffList);

            setStaffMembers(staffList);
          } else {
            // Even if API fails, try to add current user
            const currentUser = getUserData();
            if (currentUser && currentUser.id) {
              const currentUserAsStaff = {
                id: currentUser.id,
                user_id: currentUser.id,
                name: currentUser.name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email || 'Firm Admin',
                email: currentUser.email || '',
                role_display: 'Firm Admin',
                role: { primary: 'admin', role_type: 'admin' },
                status: { value: 'active', is_active: true },
                is_active: true
              };
              setStaffMembers([currentUserAsStaff]);
            } else {
              setStaffMembers([]);
            }
          }
        } catch (err) {
          console.error('Error fetching staff members:', err);
          setStaffError('Failed to load staff members. Please try again.');
          setStaffMembers([]);
        } finally {
          setStaffLoading(false);
        }
      };

      fetchStaffMembers();
    }
  }, [isOpen]);

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
    if (!formData.assigned_to_staff) {
      setError('Please assign the client to a staff member');
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
        assigned_to_staff: parseInt(formData.assigned_to_staff),
      };

      // Add phone_number only if provided
      if (formData.phone_number.trim()) {
        payload.phone_number = formData.phone_number.trim();
      }

      // Add notes only if provided
      if (formData.notes.trim()) {
        payload.notes = formData.notes.trim();
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
        phone_number: '',
        assigned_to_staff: '',
        notes: ''
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
              Create a new client profile and assign to staff member
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
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 font-[BasisGrotesquePro] text-sm"
            />
          </div>

          {/* Assign to Staff */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">
              Assign to Staff <span className="text-red-500">*</span>
            </label>
            {staffLoading ? (
              <div className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-500 text-sm font-[BasisGrotesquePro]">
                Loading staff members...
              </div>
            ) : staffError ? (
              <div className="w-full border border-red-200 rounded-lg px-3 py-2.5 bg-red-50 text-red-600 text-sm font-[BasisGrotesquePro]">
                {staffError}
              </div>
            ) : (
              <div className="relative">
                <select
                  value={formData.assigned_to_staff}
                  onChange={(e) => handleInputChange('assigned_to_staff', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white font-[BasisGrotesquePro] text-sm appearance-none"
                  required
                >
                  <option value="">Select staff member</option>
                  {staffMembers.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} {staff.email ? `(${staff.email})` : ''} - {staff.role_display}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
            {staffMembers.length === 0 && !staffLoading && !staffError && (
              <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">No staff members available</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about the client.."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 font-[BasisGrotesquePro] text-sm resize-none"
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
              className="px-6 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro] text-sm font-medium"
            >
              {loading ? 'Creating...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>

    </div >
  );
}