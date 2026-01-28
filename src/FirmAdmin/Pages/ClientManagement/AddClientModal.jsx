import React, { useState, useEffect } from "react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { FaEnvelope, FaSms, FaLink, FaCopy, FaTrash } from "react-icons/fa";
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminClientsAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { getToastOptions } from '../../../utils/toastConfig';
import '../../styles/ClientManage.css';

const API_BASE_URL = getApiBaseUrl();

export default function AddClientModal({ isOpen, onClose, onClientCreated }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''
  });
  const [phoneCountry, setPhoneCountry] = useState('us');
  const [smsPhoneCountry, setSmsPhoneCountry] = useState('us');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Invite modal state
  const [showInviteActionsModal, setShowInviteActionsModal] = useState(false);
  const [activeInviteDetails, setActiveInviteDetails] = useState(null);
  const [editedInviteEmail, setEditedInviteEmail] = useState('');
  const [smsPhoneOverride, setSmsPhoneOverride] = useState("");
  const [inviteActionLoading, setInviteActionLoading] = useState(false);
  const [inviteActionMethod, setInviteActionMethod] = useState(null);
  const [inviteLinkRefreshing, setInviteLinkRefreshing] = useState(false);
  const [deletingInvite, setDeletingInvite] = useState(false);
  const [showDeleteInviteConfirmModal, setShowDeleteInviteConfirmModal] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset all form fields
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: ''
      });
      setPhoneCountry('us');
      setSmsPhoneCountry('us');
      setLoading(false);
      setError('');
      setSuccess('');

      // Reset invite modal state
      setShowInviteActionsModal(false);
      setActiveInviteDetails(null);
      setEditedInviteEmail('');
      setSmsPhoneOverride('');
      setInviteActionLoading(false);
      setInviteActionMethod(null);
      setInviteLinkRefreshing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeInviteDetails?.phone_number) {
      setSmsPhoneOverride(activeInviteDetails.phone_number);
    } else if (!showInviteActionsModal) {
      setSmsPhoneOverride("");
    }
  }, [activeInviteDetails, showInviteActionsModal]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const openInviteActionsModal = async (inviteData) => {
    setActiveInviteDetails(inviteData);
    setShowInviteActionsModal(true);
    // Pre-fill editable email with the invite's current email
    if (inviteData?.email) {
      setEditedInviteEmail(inviteData.email);
    } else {
      setEditedInviteEmail('');
    }

    // If invite link is missing, try to fetch it (same as tax preparer)
    if (!inviteData.invite_link && (inviteData.id || inviteData.invite_id || inviteData.client_id)) {
      try {
        const params = {};
        if (inviteData.id || inviteData.invite_id) {
          params.invite_id = inviteData.id || inviteData.invite_id;
        } else if (inviteData.client_id) {
          params.client_id = inviteData.client_id;
        }

        const linkResponse = await firmAdminClientsAPI.getInviteLink(params);
        if (linkResponse.success) {
          const inviteLink = linkResponse.invite_link || linkResponse.data?.invite_link;
          if (inviteLink) {
            setActiveInviteDetails((prev) => ({
              ...prev,
              invite_link: inviteLink,
              expires_at: linkResponse.data?.expires_at || prev.expires_at
            }));
          }
        }
      } catch (linkError) {
        console.error("Error fetching invite link:", linkError);
      }
    }
  };

  const closeInviteActionsModal = () => {
    setShowInviteActionsModal(false);
    setActiveInviteDetails(null);
    setEditedInviteEmail('');
    setSmsPhoneOverride('');
  };

  // Helper function to parse phone number and extract country code and main number
  const parsePhoneNumber = (phoneValue, countryCode = 'us') => {
    if (!phoneValue || !phoneValue.trim()) {
      return { country_code: null, phone_number: null };
    }

    // Remove all non-digit characters
    const digitsOnly = phoneValue.replace(/\D/g, '');

    // Country code (ISO) to dial code mapping
    const countryToDialCode = {
      'us': '1', 'ca': '1', 'do': '1', 'pr': '1', 'vi': '1', 'gu': '1', 'as': '1',
      'gb': '44', 'im': '44', 'je': '44', 'gg': '44', 'ax': '358',
      'au': '61', 'cx': '61', 'cc': '61', 'nz': '64', 'pn': '64',
      'in': '91', 'jp': '81', 'kr': '82', 'cn': '86', 'tw': '886', 'hk': '852', 'mo': '853',
      'de': '49', 'at': '43', 'ch': '41', 'li': '423',
      'fr': '33', 'mc': '377', 're': '262', 'bl': '590', 'mf': '590', 'gp': '590', 'pm': '508',
      'it': '39', 'va': '39', 'sm': '378',
      'es': '34', 'ad': '376', 'gi': '350', 'pt': '351',
      'nl': '31', 'be': '32', 'lu': '352',
      'se': '46', 'no': '47', 'dk': '45', 'fi': '358', 'is': '354', 'fo': '298',
      'pl': '48', 'cz': '420', 'sk': '421', 'hu': '36', 'ro': '40', 'bg': '359',
      'gr': '30', 'cy': '357', 'mt': '356',
      'ie': '353',
      'br': '55', 'mx': '52', 'ar': '54', 'cl': '56', 'co': '57', 'pe': '51', 've': '58',
      'za': '27', 'ng': '234', 'ke': '254', 'eg': '20', 'et': '251', 'gh': '233',
      'ma': '212', 'dz': '213', 'tn': '216', 'ly': '218', 'sd': '249', 'sn': '221',
      'ae': '971', 'sa': '966', 'il': '972', 'tr': '90', 'iq': '964', 'ir': '98',
      'ru': '7', 'kz': '7',
      'th': '66', 'sg': '65', 'my': '60', 'ph': '63', 'id': '62', 'vn': '84',
      'bd': '880', 'pk': '92', 'lk': '94', 'np': '977', 'mm': '95'
    };

    const dialCode = countryToDialCode[countryCode.toLowerCase()] || '1';

    // List of common country dial codes to check for if the number doesn't start with the selected dialCode
    const commonDialCodes = ['91', '44', '61', '1', '81', '82', '86', '33', '49', '39', '34', '7'];

    // First, check if it starts with the currently selected dial code
    if (digitsOnly.startsWith(dialCode)) {
      const phoneNumber = digitsOnly.substring(dialCode.length);
      return {
        country_code: `+${dialCode}`,
        phone_number: phoneNumber
      };
    }

    // If not, check if it starts with any other common dial code
    for (const code of commonDialCodes) {
      if (digitsOnly.startsWith(code) && digitsOnly.length > code.length + 5) {
        return {
          country_code: `+${code}`,
          phone_number: digitsOnly.substring(code.length)
        };
      }
    }

    // Fallback: return the full number as phone_number and dial code as country_code
    return {
      country_code: `+${dialCode}`,
      phone_number: digitsOnly
    };
  };

  // Helper function to ensure invite exists, create it if needed
  const ensureInviteExists = async () => {
    // If invite already exists, return the invite_id
    if (activeInviteDetails?.id || activeInviteDetails?.invite_id) {
      return activeInviteDetails.id || activeInviteDetails.invite_id;
    }

    // If we have client_id but no invite, create one
    if (activeInviteDetails?.client_id) {
      try {
        const invitePayload = {
          client_id: activeInviteDetails.client_id
        };

        // Add phone_number if available
        if (activeInviteDetails.phone_number && activeInviteDetails.phone_number.trim()) {
          invitePayload.phone_number = activeInviteDetails.phone_number.trim();
        }

        const inviteResponse = await firmAdminClientsAPI.inviteClient(invitePayload);

        if (inviteResponse.success && inviteResponse.data) {
          const inviteId = inviteResponse.data.invite_id || inviteResponse.data.id;
          const inviteLink = inviteResponse.data.invite_link || inviteResponse.invite_link;

          // Update activeInviteDetails with the new invite data
          setActiveInviteDetails((prev) => ({
            ...prev,
            id: inviteId,
            invite_id: inviteId,
            invite_link: inviteLink || prev.invite_link,
            expires_at: inviteResponse.data.expires_at || prev.expires_at,
            status: inviteResponse.data.status || 'pending'
          }));

          // If link is missing, try to fetch it
          if (!inviteLink && inviteId) {
            try {
              const linkResponse = await firmAdminClientsAPI.getInviteLink(inviteId);
              if (linkResponse.success) {
                const link = linkResponse.data?.invite_link || linkResponse.invite_link;
                if (link) {
                  setActiveInviteDetails((prev) => ({
                    ...prev,
                    invite_link: link
                  }));
                }
              }
            } catch (linkError) {
              console.error("Error fetching invite link:", linkError);
            }
          }

          return inviteId;
        } else {
          throw new Error(inviteResponse.message || "Failed to create invite");
        }
      } catch (error) {
        console.error("Error creating invite:", error);
        throw error;
      }
    }

    throw new Error("No client ID available to create invite");
  };

  const handleSendInviteNotifications = async (methods, options = {}) => {
    if (!methods?.length) return;

    try {
      setInviteActionLoading(true);
      setInviteActionMethod(methods.join(","));

      // Ensure invite exists first
      const inviteId = await ensureInviteExists();

      const payload = { methods };
      if (options.email) {
        payload.email = options.email;
      }
      if (options.phone_number) {
        const phoneData = parsePhoneNumber(options.phone_number, smsPhoneCountry);
        if (phoneData.country_code && phoneData.phone_number) {
          // Remove '+' prefix from country_code as API expects just digits
          payload.country_code = phoneData.country_code.replace(/^\+/, '');
          payload.phone_number = phoneData.phone_number;
        } else {
          // Fallback: send as is if parsing fails
          payload.phone_number = options.phone_number;
        }
      }
      const response = await firmAdminClientsAPI.sendInvite(inviteId, payload);
      if (response.success && response.data) {
        setActiveInviteDetails((prev) => ({
          ...prev,
          ...response.data
        }));

        const deliverySummary = response.data?.delivery_summary;

        if (deliverySummary?.sms_error) {
          toast.error(deliverySummary.sms_error, getToastOptions({ autoClose: 5000 }));
        }

        const emailSent = deliverySummary?.email_sent === true;
        const smsSent = deliverySummary?.sms_sent === true;
        const hasError = deliverySummary?.sms_error || (deliverySummary?.email_sent === false && methods.includes('email'));

        if ((emailSent || smsSent) && !hasError) {
          toast.success(response.message || "Invite notifications processed.", getToastOptions());
          closeInviteActionsModal();
        } else if (emailSent && deliverySummary?.sms_error) {
          toast.success("Email sent successfully.", getToastOptions());
          closeInviteActionsModal();
        } else if (deliverySummary?.sms_error && !emailSent) {
          // Only SMS was attempted and failed - don't close modal so user can try again
        }
      } else {
        throw new Error(response.message || "Failed to send invite notifications");
      }
    } catch (error) {
      console.error("Error sending invite notifications:", error);
      toast.error(handleAPIError(error), getToastOptions());
    } finally {
      setInviteActionLoading(false);
      setInviteActionMethod(null);
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      // Ensure invite exists and has a link
      let inviteLink = activeInviteDetails?.invite_link;

      if (!inviteLink) {
        // Create invite if it doesn't exist
        const inviteId = await ensureInviteExists();

        // Get the invite link
        if (activeInviteDetails?.invite_link) {
          inviteLink = activeInviteDetails.invite_link;
        } else if (inviteId) {
          try {
            const linkResponse = await firmAdminClientsAPI.getInviteLink(inviteId);
            if (linkResponse.success) {
              inviteLink = linkResponse.data?.invite_link || linkResponse.invite_link;
              if (inviteLink) {
                setActiveInviteDetails((prev) => ({
                  ...prev,
                  invite_link: inviteLink
                }));
              }
            }
          } catch (linkError) {
            console.error("Error fetching invite link:", linkError);
            throw new Error("Failed to get invite link");
          }
        }
      }

      if (!inviteLink) {
        throw new Error("No invite link available");
      }

      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied to clipboard!", getToastOptions({ autoClose: 2000 }));
      closeInviteActionsModal();
    } catch (error) {
      console.error("Error copying invite link:", error);
      toast.error(handleAPIError(error) || "Failed to copy invite link. Please try again.", getToastOptions());
    }
  };

  const handleRefreshInviteLink = async () => {
    if (!activeInviteDetails) return;

    try {
      setInviteLinkRefreshing(true);

      // Regenerate invite link using POST method
      const payload = {};
      if (activeInviteDetails.id || activeInviteDetails.invite_id) {
        payload.invite_id = activeInviteDetails.id || activeInviteDetails.invite_id;
      } else if (activeInviteDetails.client_id) {
        payload.client_id = activeInviteDetails.client_id;
      } else {
        throw new Error("No invite ID or client ID available");
      }
      payload.regenerate = true;

      const response = await firmAdminClientsAPI.generateInviteLink(payload);

      if (response.success) {
        const newLink = response.data?.invite_link || response.invite_link;
        if (newLink) {
          setActiveInviteDetails((prev) => ({
            ...prev,
            invite_link: newLink,
            expires_at: response.data?.expires_at || prev.expires_at
          }));

          toast.success("Invite link regenerated successfully.", getToastOptions());
        } else {
          throw new Error("No invite link in response");
        }
      } else {
        throw new Error(response.message || "Failed to regenerate invite link");
      }
    } catch (error) {
      console.error("Error regenerating invite link:", error);
      toast.error(handleAPIError(error), getToastOptions());
    } finally {
      setInviteLinkRefreshing(false);
    }
  };

  const handleSendEmailInviteNow = () => {
    const trimmed = (editedInviteEmail || '').trim();
    if (!trimmed || !trimmed.includes('@')) {
      toast.error("Please enter a valid email address.", getToastOptions());
      return;
    }
    handleSendInviteNotifications(["email"], { email: trimmed });
  };

  const handleSendSmsInviteNow = () => {
    const trimmedPhone = smsPhoneOverride?.trim();
    if (!trimmedPhone) {
      toast.error("Please enter a phone number to send the SMS invite.", getToastOptions());
      return;
    }
    handleSendInviteNotifications(["sms"], { phone_number: trimmedPhone });
  };

  const handleDeleteInvite = () => {
    const inviteId = activeInviteDetails?.id || activeInviteDetails?.invite_id;

    if (!inviteId) {
      toast.error("No invite found to delete.", getToastOptions());
      return;
    }

    // Show confirmation modal
    setShowDeleteInviteConfirmModal(true);
  };

  const confirmDeleteInvite = async () => {
    const inviteId = activeInviteDetails?.id || activeInviteDetails?.invite_id;

    if (!inviteId) {
      toast.error("No invite found to delete.", getToastOptions());
      setShowDeleteInviteConfirmModal(false);
      return;
    }

    try {
      setDeletingInvite(true);
      setShowDeleteInviteConfirmModal(false);

      const response = await firmAdminClientsAPI.deleteInvite(inviteId);

      if (response.success) {
        toast.success(response.message || "Invitation deleted successfully.", getToastOptions());
        closeInviteActionsModal();

        // Trigger refresh callback if provided
        if (onClientCreated) {
          onClientCreated();
        }
      } else {
        throw new Error(response.message || "Failed to delete invitation");
      }
    } catch (error) {
      console.error("Error deleting invite:", error);
      toast.error(handleAPIError(error) || "Failed to delete invitation. Please try again.", getToastOptions());
    } finally {
      setDeletingInvite(false);
    }
  };

  const inviteExpiresOn = activeInviteDetails?.expires_at
    ? new Date(activeInviteDetails.expires_at).toLocaleDateString()
    : null;

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

      if (result.success && result.data) {
        const clientId = result.data.id || result.data.client_id;

        // Reset loading state
        setLoading(false);

        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone_number: ''
        });

        // Close add client modal first
        onClose();

        // Show success toast
        toast.success("Client created successfully!", getToastOptions());

        // Generate invite link using the firm admin API (same flow as tax preparer)
        try {
          const inviteResponse = await firmAdminClientsAPI.generateInviteLink({
            client_id: clientId
          });

          if (inviteResponse.success) {
            // Format the response to match the expected structure for openInviteActionsModal
            const inviteData = {
              id: inviteResponse.data?.invite_id,
              invite_id: inviteResponse.data?.invite_id,
              client_id: clientId,
              first_name: result.data.first_name || formData.first_name.trim(),
              last_name: result.data.last_name || formData.last_name.trim(),
              email: result.data.email || formData.email.trim(),
              phone_number: result.data.phone_number || formData.phone_number || '',
              invite_link: inviteResponse.invite_link || inviteResponse.data?.invite_link,
              expires_at: inviteResponse.data?.expires_at,
              status: inviteResponse.data?.status || 'pending',
              firm_name: result.data.firm?.name || null
            };

            // Small delay to ensure Add Client modal is closed first
            setTimeout(() => {
              openInviteActionsModal(inviteData);
            }, 100);

            toast.info("Invite link created. Share or send it below.", getToastOptions());
          } else {
            throw new Error(inviteResponse.message || "Failed to create invite");
          }
        } catch (inviteError) {
          console.error("Error creating invite for client:", inviteError);
          toast.error(handleAPIError(inviteError) || "Failed to create invite. You can send it later from the client's invite options.", getToastOptions());
        }
      } else {
        // Don't close modal on error - show error message
        const errorMsg = result.message || 'Failed to create client';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

    } catch (err) {
      console.error('Error creating client:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to create client. Please try again.');
      // Don't close modal on error - keep it open so user can fix and retry
      setLoading(false);
    }
  };

  return (
    <>
      {/* Add Client Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1070] p-4"
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
        </div>
      )}

      {/* Share Taxpayer Invite Modal */}
      {showInviteActionsModal && activeInviteDetails && (
        <div className="modal invite-actions-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ overflow: 'visible' }}>
            <div className="modal-content" style={{ borderRadius: '16px', maxWidth: '520px', overflow: 'visible' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #E8F0FF' }}>
                <h5 className="modal-title fw-semibold" style={{ color: '#3B4A66' }}>Share Taxpayer Invite</h5>
                <button type="button" className="btn-close" onClick={closeInviteActionsModal} aria-label="Close"></button>
              </div>
              <div className="modal-body" style={{ padding: '24px', overflow: 'visible' }}>
                <div className="p-3 mb-4" style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E8F0FF' }}>
                  <p className="mb-1 fw-semibold" style={{ color: '#3B4A66' }}>
                    {activeInviteDetails.first_name} {activeInviteDetails.last_name}
                  </p>
                  <p className="mb-1 text-muted" style={{ fontSize: '14px' }}>{activeInviteDetails.email}</p>
                  {activeInviteDetails.phone_number && (
                    <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>{activeInviteDetails.phone_number}</p>
                  )}
                  {inviteExpiresOn && (
                    <small className="text-muted">Expires {inviteExpiresOn}</small>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold d-flex align-items-center gap-2" style={{ color: '#3B4A66' }}>
                    <FaLink size={14} /> Shareable Link
                  </label>
                  <div className="d-flex gap-2">
                    <input
                      type="text"
                      className="form-control"
                      value={activeInviteDetails.invite_link || ""}
                      readOnly
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleCopyInviteLink}
                      disabled={!activeInviteDetails.invite_link}
                      style={{ borderRadius: '8px', whiteSpace: 'nowrap' }}
                    >
                      <FaCopy size={12} className="me-1" />
                      Copy
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={handleRefreshInviteLink}
                      disabled={inviteLinkRefreshing}
                      style={{ borderRadius: '8px', whiteSpace: 'nowrap' }}
                    >
                      {inviteLinkRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                  <small className="text-muted d-block mt-1">
                    Share this link with the taxpayer. They can use it anytime before it expires.
                  </small>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold d-flex align-items-center gap-2" style={{ color: '#3B4A66' }}>
                    <FaEnvelope size={14} /> Send Email Invite
                  </label>
                  <p className="text-muted mb-2" style={{ fontSize: '14px' }}>
                    We'll email a secure link to the address below.
                  </p>
                  <div className="d-flex gap-2">
                    <input
                      type="email"
                      className="form-control"
                      value={editedInviteEmail}
                      onChange={(e) => setEditedInviteEmail(e.target.value)}
                      placeholder={activeInviteDetails.email || 'Enter email'}
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSendEmailInviteNow}
                      disabled={inviteActionLoading}
                      style={{ borderRadius: '8px', backgroundColor: '#00C0C6', borderColor: '#00C0C6', whiteSpace: 'nowrap' }}
                    >
                      {inviteActionLoading && inviteActionMethod === "email" ? "Sending..." : "Send Email"}
                    </button>
                  </div>
                  {activeInviteDetails.delivery_summary && (
                    <div className="mt-2 text-muted small">
                      Email sent: {activeInviteDetails.delivery_summary.email_sent ? "Yes" : "No"}
                    </div>
                  )}
                </div>

                <div className="mb-1">
                  <label className="form-label fw-semibold d-flex align-items-center gap-2" style={{ color: '#3B4A66' }}>
                    <FaSms size={14} /> Send SMS Invite
                  </label>
                  <p className="text-muted mb-2" style={{ fontSize: '14px' }}>
                    We'll text the invite link to the phone number you provide.
                  </p>
                  <div className="d-flex gap-2 mb-2">
                    <PhoneInput
                      country={smsPhoneCountry}
                      value={smsPhoneOverride || ''}
                      onChange={(phone) => setSmsPhoneOverride(phone)}
                      onCountryChange={(countryCode) => {
                        setSmsPhoneCountry(countryCode.toLowerCase());
                      }}
                      inputClass="form-control"
                      containerClass="w-100 phone-input-container flex-1 invite-actions-phone-container"
                      inputStyle={{ width: '100%', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      dropdownStyle={{ zIndex: 2002, maxHeight: 240, overflowY: 'auto', width: '100%', minWidth: '100%', boxSizing: 'border-box' }}
                      enableSearch={true}
                      countryCodeEditable={false}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSendSmsInviteNow}
                      disabled={inviteActionLoading}
                      style={{ borderRadius: '8px', backgroundColor: '#00C0C6', borderColor: '#00C0C6', whiteSpace: 'nowrap' }}
                    >
                      {inviteActionLoading && inviteActionMethod === "sms" ? "Sending..." : "Send SMS"}
                    </button>
                  </div>
                  {activeInviteDetails.delivery_summary && (
                    <div className="text-muted small">
                      SMS sent: {activeInviteDetails.delivery_summary.sms_sent ? "Yes" : "No"}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer d-flex justify-content-end align-items-center gap-2" style={{ borderTop: '1px solid #E8F0FF', padding: '16px 24px' }}>
                {(activeInviteDetails?.id || activeInviteDetails?.invite_id) && (
                  <button
                    className="btn btn-outline-danger d-flex align-items-center"
                    style={{ borderRadius: '8px' }}
                    onClick={handleDeleteInvite}
                    disabled={deletingInvite}
                  >
                    <FaTrash size={12} className="me-1" />
                    {deletingInvite ? 'Deleting...' : 'Delete Invite'}
                  </button>
                )}
                <button className="btn btn-light" style={{ borderRadius: '8px' }} onClick={closeInviteActionsModal}>
                  Invite Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Invite Confirmation Modal */}
      {showDeleteInviteConfirmModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 10000 }}
          onClick={() => {
            if (!deletingInvite) {
              setShowDeleteInviteConfirmModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
            style={{
              borderRadius: '12px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900" style={{ color: '#3B4A66' }}>Delete Invitation</h2>
              <button
                onClick={() => {
                  if (!deletingInvite) {
                    setShowDeleteInviteConfirmModal(false);
                  }
                }}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                disabled={deletingInvite}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#3B4A66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                Are you sure you want to delete this invitation? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteInviteConfirmModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-[BasisGrotesquePro]"
                disabled={deletingInvite}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteInvite}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity font-[BasisGrotesquePro]"
                style={{ background: 'var(--color-red-500, #EF4444)' }}
                disabled={deletingInvite}
              >
                {deletingInvite ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}