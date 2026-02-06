import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { FaArrowLeft, FaEdit, FaSave, FaTimes, FaEnvelope, FaPhone, FaLink, FaCopy, FaSms, FaTrash } from 'react-icons/fa';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminClientsAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { getToastOptions } from '../../../utils/toastConfig';
import { CrossesIcon } from '../../Components/icons';

const API_BASE_URL = getApiBaseUrl();

export default function PendingInviteDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState('us');
  const [showInviteActionsModal, setShowInviteActionsModal] = useState(false);
  const [inviteActionLoading, setInviteActionLoading] = useState(false);
  const [inviteLinkRefreshing, setInviteLinkRefreshing] = useState(false);
  const [deletingInvite, setDeletingInvite] = useState(false);
  const [showDeleteInviteConfirmModal, setShowDeleteInviteConfirmModal] = useState(false);
  const [smsPhoneOverride, setSmsPhoneOverride] = useState("");
  const [smsPhoneCountry, setSmsPhoneCountry] = useState('us');
  const [smsPhoneDialCode, setSmsPhoneDialCode] = useState('1'); // Track dial code
  const [editedInviteEmail, setEditedInviteEmail] = useState('');

  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''
  });
  const [originalFormData, setOriginalFormData] = useState(null);

  // Fetch invite details
  const fetchInviteDetails = useCallback(async () => {
    if (!id) {
      setError('Invite ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Use the new API endpoint to get invite details
      const response = await firmAdminClientsAPI.getPendingInviteDetails(id);

      if (response.success && response.data) {
        // If we have a client_id (placeholder user created), redirect to the main Client Details page
        // This ensures pending clients have the exact same interface as active clients
        if (response.data.client_id) {
          navigate(`/firmadmin/clients/${response.data.client_id}`);
          return;
        }

        const inviteData = response.data;
        setInvite(inviteData);
        setCanEdit(response.can_edit !== false && !response.is_expired);

        const initialFormData = {
          first_name: inviteData.first_name || '',
          last_name: inviteData.last_name || '',
          email: inviteData.email || '',
          phone_number: inviteData.phone_number || ''
        };
        setEditFormData(initialFormData);
        setOriginalFormData(initialFormData);
        setEditedInviteEmail(inviteData.email || '');
        setSmsPhoneOverride(inviteData.phone_number || '');

        // If invite link is missing, try to fetch it
        if (!inviteData.invite_link && inviteData.id) {
          try {
            const linkResponse = await firmAdminClientsAPI.getInviteLink(inviteData.id);
            if (linkResponse.success) {
              const link = linkResponse.data?.invite_link || linkResponse.invite_link;
              if (link) {
                setInvite(prev => ({
                  ...prev,
                  invite_link: link
                }));
              }
            }
          } catch (error) {
            console.error("Error fetching invite link:", error);
          }
        }
      } else {
        throw new Error(response.message || 'Failed to load invite details');
      }
    } catch (err) {
      console.error('Error fetching invite details:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load invite details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInviteDetails();
  }, [fetchInviteDetails]);

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - restore original data
      setEditFormData(originalFormData);
      setIsEditMode(false);
    } else {
      setIsEditMode(true);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!invite || !canEdit) {
      toast.error('This invitation has expired. You cannot update expired invitations.', getToastOptions());
      return;
    }

    try {
      setSaving(true);

      const inviteId = invite.id;

      const updatePayload = {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        email: editFormData.email,
        phone_number: editFormData.phone_number || null
      };

      // Use the new API endpoint to update pending invite
      const response = await firmAdminClientsAPI.updatePendingInvite(inviteId, updatePayload);

      if (response.success) {
        toast.success('Invite details updated successfully!', getToastOptions());
        await fetchInviteDetails(); // Refresh data
        setIsEditMode(false);
      } else {
        throw new Error(response.message || 'Failed to update invite details');
      }
    } catch (err) {
      console.error('Error updating invite details:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to update invite details', getToastOptions());
    } finally {
      setSaving(false);
    }
  };

  // Handle copy invite link
  const handleCopyInviteLink = async () => {
    if (!invite?.invite_link) return;
    
    // Fallback for non-secure contexts where navigator.clipboard is unavailable
    if (!navigator.clipboard) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = invite.invite_link;
        
        // Ensure element is part of document but not visible
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          toast.success("Invite link copied to clipboard!", getToastOptions({ autoClose: 2000 }));
        } else {
           throw new Error("Copy command failed");
        }
      } catch (err) {
        console.error("Fallback copy failed:", err);
        toast.error("Could not auto-copy. Please manually copy the link.", getToastOptions());
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(invite.invite_link);
      toast.success("Invite link copied to clipboard!", getToastOptions({ autoClose: 2000 }));
    } catch (error) {
      console.error("Error copying invite link:", error);
      toast.error("Failed to copy invite link. Please try again.", getToastOptions());
    }
  };

  // Handle refresh invite link
  const handleRefreshInviteLink = async () => {
    if (!invite) return;
    try {
      setInviteLinkRefreshing(true);
      const inviteId = invite.invite_id || invite.id;
      const clientId = invite.id || invite.client_id;

      const payload = {};
      if (inviteId) {
        payload.invite_id = inviteId;
      } else if (clientId) {
        payload.client_id = clientId;
      } else {
        throw new Error("No invite ID or client ID available");
      }
      payload.regenerate = true;

      const response = await firmAdminClientsAPI.generateInviteLink(payload);
      if (response.success) {
        const newLink = response.data?.invite_link || response.invite_link;
        if (newLink) {
          setInvite(prev => ({
            ...prev,
            invite_link: newLink,
            expires_at: response.data?.expires_at || prev.expires_at
          }));
          toast.success("Invite link regenerated successfully.", getToastOptions());
        }
      }
    } catch (error) {
      console.error("Error regenerating invite link:", error);
      toast.error(handleAPIError(error), getToastOptions());
    } finally {
      setInviteLinkRefreshing(false);
    }
  };

  // Handle send email invite
  const handleSendEmailInviteNow = async () => {
    const inviteId = invite?.invite_id || invite?.id;
    if (!inviteId || !editedInviteEmail) return;

    try {
      setInviteActionLoading(true);
      setInviteActionMethod("email");
      const payload = {
        methods: ['email'],
        email: editedInviteEmail
      };

      const response = await firmAdminClientsAPI.sendInvite(inviteId, payload);
      if (response.success && response.data) {
        setInvite(prev => ({
          ...prev,
          ...response.data
        }));
        toast.success(response.message || "Email invite sent successfully.", getToastOptions());
      } else {
        throw new Error(response.message || "Failed to send email invite");
      }
    } catch (error) {
      console.error("Error sending email invite:", error);
      toast.error(handleAPIError(error), getToastOptions());
    } finally {
      setInviteActionLoading(false);
      setInviteActionMethod(null);
    }
  };

  // Handle send SMS invite
  const handleSendSmsInviteNow = async () => {
    const inviteId = invite?.invite_id || invite?.id;
    if (!inviteId || !smsPhoneOverride) return;

    try {
      setInviteActionLoading(true);
      setInviteActionMethod("sms");

      const payload = {
        methods: ['sms']
      };

      // react-phone-input-2 returns the full number string (digits only) in smsPhoneOverride
      // We also track the dial code in smsPhoneDialCode state
      // Send digits only to let the backend handle the country code logic correctly
      const digitsOnly = smsPhoneOverride.replace(/\D/g, '');
      payload.phone_number = digitsOnly;

      if (smsPhoneDialCode) {
        payload.country_code = smsPhoneDialCode;
      }

      console.log('Sending SMS invite with payload:', payload);

      const response = await firmAdminClientsAPI.sendInvite(inviteId, payload);
      if (response.success && response.data) {
        setInvite(prev => ({
          ...prev,
          ...response.data
        }));
        toast.success(response.message || "SMS invite sent successfully.", getToastOptions());
      } else {
        throw new Error(response.message || "Failed to send SMS invite");
      }
    } catch (error) {
      console.error("Error sending SMS invite:", error);
      toast.error(handleAPIError(error), getToastOptions());
    } finally {
      setInviteActionLoading(false);
      setInviteActionMethod(null);
    }
  };

  const [inviteActionMethod, setInviteActionMethod] = useState(null);
  const [canEdit, setCanEdit] = useState(true);

  // Handle delete invite
  const handleDeleteInvite = async () => {
    if (!invite) return;

    try {
      setDeletingInvite(true);
      const inviteId = invite.invite_id || invite.id;
      const response = await firmAdminClientsAPI.deleteInvite(inviteId);

      if (response.success) {
        toast.success("Invite deleted successfully.", getToastOptions());
        navigate('/firmadmin/clients?tab=pending-invites');
      } else {
        throw new Error(response.message || "Failed to delete invitation");
      }
    } catch (error) {
      console.error("Error deleting invite:", error);
      toast.error(handleAPIError(error) || "Failed to delete invitation. Please try again.", getToastOptions());
    } finally {
      setDeletingInvite(false);
      setShowDeleteInviteConfirmModal(false);
    }
  };

  const inviteExpiresOn = invite?.expires_at
    ? new Date(invite.expires_at).toLocaleDateString()
    : null;

  const initials = invite
    ? `${invite.first_name?.[0]?.toUpperCase() || ''}${invite.last_name?.[0]?.toUpperCase() || ''}`
    : '';

  if (loading) {
    return (
      <div className="w-full px-4 py-4 bg-[#F6F7FF] min-h-screen">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading invite details...</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="w-full px-4 py-4 bg-[#F6F7FF] min-h-screen">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/firmadmin/clients?tab=pending-invites')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
              style={{ borderRadius: '7px' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <h4 className="text-[16px] font-bold text-gray-900 font-[BasisGrotesquePro]">Pending Invite Details</h4>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error || 'Invite not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-[#F6F7FF] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
            <button
              onClick={() => navigate('/firmadmin/clients?tab=pending-invites')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] self-start"
              style={{ borderRadius: '7px' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <div className="flex-1">
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">Pending Invite Details</h4>
              <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">Manage taxpayer invitation details</p>
            </div>
          </div>
        </div>

        {/* Expired Warning */}
        {invite.is_expired && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 sm:mb-6 font-[BasisGrotesquePro]">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold">This invitation has expired</p>
                <p className="text-sm mt-1">You cannot update expired invitations. Please create a new invitation if needed.</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 !border border-[#E8F0FF]">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Left Side - Avatar */}
            <div className="w-16 h-16 rounded-full bg-[#00C0C6] flex items-center justify-center text-white font-semibold text-xl flex-shrink-0">
              {initials || '?'}
            </div>

            {/* Center - Taxpayer Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro] break-words">
                  {invite.first_name} {invite.last_name}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium font-[BasisGrotesquePro] whitespace-nowrap ${invite.is_expired
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
                  }`}>
                  {invite.is_expired ? 'Expired' : 'Pending'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-gray-600 font-[BasisGrotesquePro]">
                {invite.email && (
                  <div className="flex items-center gap-2">
                    <FaEnvelope size={14} className="flex-shrink-0" />
                    <span className="break-all">{invite.email}</span>
                  </div>
                )}
                {invite.phone_number && (
                  <div className="flex items-center gap-2">
                    <FaPhone size={14} className="flex-shrink-0" />
                    <span>{invite.phone_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {!isEditMode ? (
                <>
                  {/* <button
                    onClick={() => setShowInviteActionsModal(true)}
                    className="px-4 py-2 bg-[#00C0C6] text-white rounded-lg hover:bg-[#00A8AE] transition-colors flex items-center justify-center gap-2 font-[BasisGrotesquePro]"
                    style={{ borderRadius: '7px' }}
                  >
                    <FaLink size={14} />
                    Share Invite1111
                  </button> */}
                  <button
                    onClick={handleEditToggle}
                    disabled={!canEdit}
                    className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center justify-center gap-2 font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderRadius: '7px' }}
                    title={!canEdit ? 'Cannot edit expired invitations' : ''}
                  >
                    <FaEdit size={14} />
                    Edit
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEditToggle}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 font-[BasisGrotesquePro]"
                    style={{ borderRadius: '7px' }}
                  >
                    <FaTimes size={14} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !canEdit}
                    className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center justify-center gap-2 font-[BasisGrotesquePro] disabled:opacity-50"
                    style={{ borderRadius: '7px' }}
                  >
                    <FaSave size={14} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 !border border-[#E8F0FF]">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Taxpayer Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                First Name
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  value={editFormData.first_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C0C6] font-[BasisGrotesquePro]"
                  style={{ borderRadius: '7px' }}
                />
              ) : (
                <p className="text-gray-900 font-[BasisGrotesquePro]">{invite.first_name || 'N/A'}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Last Name
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  value={editFormData.last_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C0C6] font-[BasisGrotesquePro]"
                  style={{ borderRadius: '7px' }}
                />
              ) : (
                <p className="text-gray-900 font-[BasisGrotesquePro]">{invite.last_name || 'N/A'}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Email
              </label>
              {isEditMode ? (
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C0C6] font-[BasisGrotesquePro]"
                  style={{ borderRadius: '7px' }}
                />
              ) : (
                <p className="text-gray-900 font-[BasisGrotesquePro]">{invite.email || 'N/A'}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Phone Number
              </label>
              {isEditMode ? (
                <PhoneInput
                  country={phoneCountry}
                  value={editFormData.phone_number}
                  onChange={(phone) => setEditFormData(prev => ({ ...prev, phone_number: phone }))}
                  onCountryChange={(countryCode) => setPhoneCountry(countryCode.toLowerCase())}
                  disableDropdown={true}
                  countryCodeEditable={false}
                  inputClass="form-control"
                  containerClass="phone-input-container"
                  inputStyle={{ width: '100%', borderRadius: '7px', border: '1px solid #E8F0FF' }}
                  dropdownStyle={{ zIndex: 1000 }}
                />
              ) : (
                <p className="text-gray-900 font-[BasisGrotesquePro]">{invite.phone_number || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Invite Information */}
        <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 !border border-[#E8F0FF]">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Invite Information</h3>

          <div className="space-y-4">
            {/* Invite Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Shareable Link
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={invite.invite_link || ''}
                  readOnly
                  className="flex-1 px-3 py-2 border border-[#E8F0FF] rounded-lg bg-gray-50 font-[BasisGrotesquePro] text-sm"
                  style={{ borderRadius: '7px' }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyInviteLink}
                    disabled={!invite.invite_link}
                    className="px-3 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-[BasisGrotesquePro] disabled:opacity-50 whitespace-nowrap"
                    style={{ borderRadius: '7px' }}
                  >
                    <FaCopy size={14} />
                    <span className="hidden sm:inline">Copy</span>
                  </button>
                  <button
                    onClick={handleRefreshInviteLink}
                    disabled={inviteLinkRefreshing}
                    className="px-3 sm:px-4 py-2 bg-[#00C0C6] text-white rounded-lg hover:bg-[#00A8AE] transition-colors font-[BasisGrotesquePro] disabled:opacity-50 whitespace-nowrap"
                    style={{ borderRadius: '7px' }}
                  >
                    {inviteLinkRefreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
            </div>

            {/* Invite Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                  Status
                </label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-[BasisGrotesquePro] ${invite.is_expired
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
                  }`}>
                  {invite.is_expired ? 'Expired' : 'Pending'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                  Invited At
                </label>
                <p className="text-gray-900 font-[BasisGrotesquePro]">
                  {invite.invited_at_formatted || (invite.invited_at ? new Date(invite.invited_at).toLocaleString() : 'N/A')}
                </p>
              </div>

              {inviteExpiresOn && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                    Expires At
                  </label>
                  <p className="text-gray-900 font-[BasisGrotesquePro]">
                    {invite.expires_at_formatted || inviteExpiresOn}
                    {invite.days_until_expiry !== undefined && (
                      <span className="ml-2 text-gray-500">
                        ({invite.days_until_expiry} days left)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {invite.invited_by?.name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                    Invited By
                  </label>
                  <p className="text-gray-900 font-[BasisGrotesquePro]">{invite.invited_by.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl p-4 sm:p-6 !border border-[#E8F0FF]">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Send Invite</h3>

          <div className="space-y-4 sm:space-y-6">
            {/* Email Invite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro] flex items-center gap-2" style={{ color: '#3B4A66' }}>
                <FaEnvelope /> Send Email Invite
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={editedInviteEmail}
                  onChange={(e) => setEditedInviteEmail(e.target.value)}
                  placeholder={invite.email || 'Enter email'}
                  className="flex-1 px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C0C6] font-[BasisGrotesquePro]"
                  style={{ borderRadius: '7px' }}
                />
                <button
                  onClick={handleSendEmailInviteNow}
                  disabled={inviteActionLoading || !editedInviteEmail}
                  className="px-4 py-2 bg-[#00C0C6] text-white rounded-lg hover:bg-[#00A8AE] transition-colors font-[BasisGrotesquePro] disabled:opacity-50 whitespace-nowrap"
                  style={{ borderRadius: '7px' }}
                >
                  {inviteActionLoading && inviteActionMethod === "email" ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>

            {/* SMS Invite */}
            <div className="pb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3 font-[BasisGrotesquePro] flex items-center gap-2" style={{ color: '#3B4A66' }}>
                <FaSms className="text-[#00C0C6]" /> Send SMS Invite
              </label>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                <div className="md:col-span-9 relative">
                  <PhoneInput
                    country={smsPhoneCountry}
                    value={smsPhoneOverride}
                    onChange={(phone, data) => {
                      setSmsPhoneOverride(phone);
                      if (data && data.dialCode) {
                        setSmsPhoneDialCode(data.dialCode);
                      }
                    }}
                    onCountryChange={(countryCode) => setSmsPhoneCountry(countryCode.toLowerCase())}
                    enableSearch={true}
                    disableDropdown={false}
                    inputClass="!w-full !h-[44px] !text-base !font-[BasisGrotesquePro] !border-[#E8F0FF] !rounded-lg focus:!ring-2 focus:!ring-[#00C0C6] focus:!border-transparent"
                    containerClass="!w-full"
                    buttonClass="!border-[#E8F0FF] !bg-white !rounded-l-lg hover:!bg-gray-50"
                    dropdownClass="!font-[BasisGrotesquePro] !text-sm"
                    inputStyle={{ width: '100%' }}
                    dropdownStyle={{ zIndex: 9999, width: 'max-content', minWidth: '300px' }}
                  />
                </div>
                <div className="md:col-span-3">
                  <button
                    onClick={handleSendSmsInviteNow}
                    disabled={inviteActionLoading || !smsPhoneOverride}
                    className="w-full h-[44px] px-6 bg-[#00C0C6] text-white rounded-lg hover:bg-[#00A8AE] transition-all flex items-center justify-center gap-2 font-[BasisGrotesquePro] font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
                    style={{ borderRadius: '7px' }}
                  >
                    {inviteActionLoading && inviteActionMethod === "sms" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <>
                        <FaSms />
                        <span>Send SMS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Delete Button */}
            <div className="pt-8 mt-6 border-t border-[#E8F0FF]">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">
                  Need to cancel this invitation? This will invalidate the existing link.
                </p>
                <button
                  onClick={() => setShowDeleteInviteConfirmModal(true)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-white border-2 border-red-100 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-2 font-[BasisGrotesquePro] font-bold shadow-sm active:scale-95"
                  style={{ borderRadius: '7px' }}
                >
                  <FaTrash size={14} />
                  Delete Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteInviteConfirmModal && (
        <div className="fixed inset-0 z-[1070] flex items-center justify-center bg-black bg-opacity-50 p-6">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md !border border-[#E8F0FF]">
            <div className="p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-3 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Delete Invite</h4>
              <p className="text-sm text-gray-600 mb-6 font-[BasisGrotesquePro]">
                Are you sure you want to delete this invitation? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteInviteConfirmModal(false)}
                  disabled={deletingInvite}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] disabled:opacity-50"
                  style={{ borderRadius: '7px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteInvite}
                  disabled={deletingInvite}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-[BasisGrotesquePro] disabled:opacity-50 flex items-center gap-2"
                  style={{ borderRadius: '7px' }}
                >
                  {deletingInvite ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

