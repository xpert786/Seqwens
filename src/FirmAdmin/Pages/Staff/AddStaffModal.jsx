import React, { useState } from "react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { toast } from "react-toastify";
import { CrossesIcon } from "../../Components/icons";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import ConfirmationModal from "../../../components/ConfirmationModal";

export default function AddStaffModal({ isOpen, onClose, onInviteCreated, onRefresh }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
  });
  const [deliveryMethods, setDeliveryMethods] = useState({
    email: true,
    sms: false,
    link: false,
  });
  const [phoneCountry, setPhoneCountry] = useState('us');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [existingUserInfo, setExistingUserInfo] = useState(null);
  const [sendingInvite, setSendingInvite] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error("No authentication token found");
      }

      const selectedMethods = Object.entries(deliveryMethods)
        .filter(([, checked]) => checked)
        .map(([method]) => method);

      const apiData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        role: formData.role || "tax_preparer",
      };

      if (formData.phone_number?.trim()) {
        apiData.phone_number = formData.phone_number.trim();
      }

      if (selectedMethods.length > 0) {
        apiData.delivery_methods = selectedMethods;
      }

      const config = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      };

      const apiUrl = `${API_BASE_URL}/user/firm-admin/tax-preparers/create/`;
      console.log("Creating staff member:", apiData);

      const response = await fetchWithCors(apiUrl, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.message || errorData.detail || `HTTP error! status: ${response.status}`;

        // Parse array format error messages
        if (Array.isArray(errorMessage)) {
          errorMessage = errorMessage[0] || errorMessage;
        } else if (typeof errorMessage === 'string' && errorMessage.trim().startsWith('[')) {
          try {
            const parsed = JSON.parse(errorMessage);
            if (Array.isArray(parsed) && parsed.length > 0) {
              errorMessage = parsed[0];
            }
          } catch (e) {
            // Keep original if parsing fails
          }
        }

        // Also check errorData.errors or errorData.error fields
        if (errorData.errors) {
          if (Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors[0] || errorMessage;
          } else if (typeof errorData.errors === 'string') {
            errorMessage = errorData.errors;
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("API Response:", result);

      // Check if user exists and confirmation is required
      if (result.success === false && result.user_exists === true && result.action_required === "send_invite") {
        // Store existing user info and show confirmation modal
        setExistingUserInfo(result.user_info);
        setShowConfirmModal(true);
        setLoading(false);
        return;
      }

      // If successful (new user or confirmed existing user)
      if (result.success && result.data) {
        // Reset form
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          phone_number: "",
          role: "tax_preparer",
        });
        setDeliveryMethods({
          email: true,
          sms: false,
          link: false,
        });

        if (typeof onRefresh === "function") {
          onRefresh();
        }
        onClose();

        if (typeof onInviteCreated === "function" && result.data) {
          onInviteCreated(result.data);
        }

        // Show success toast
        toast.success(result.message || "Staff member added successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          icon: false,
          className: "custom-toast-success",
          bodyClassName: "custom-toast-body",
        });
      } else {
        // Handle other error cases
        throw new Error(result.message || "Failed to create staff member");
      }
    } catch (err) {
      console.error("Error creating staff member:", err);
      const errorMessage = handleAPIError(err);
      setError(errorMessage);

      // Show error toast
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        icon: false,
        className: "custom-toast-error",
        bodyClassName: "custom-toast-body",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      role: "tax_preparer",
    });
    setDeliveryMethods({
      email: true,
      sms: false,
      link: false,
    });
    setError(null);
    setShowConfirmModal(false);
    setExistingUserInfo(null);
    onClose();
  };

  const handleConfirmSendInvite = async () => {
    if (!existingUserInfo) return;

    setSendingInvite(true);
    setError(null);

    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error("No authentication token found");
      }

      const selectedMethods = Object.entries(deliveryMethods)
        .filter(([, checked]) => checked)
        .map(([method]) => method);

      const apiData = {
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        role: "tax_preparer", // Default role for staff
      };

      if (formData.phone_number?.trim()) {
        apiData.phone_number = formData.phone_number.trim();
      }

      if (selectedMethods.length > 0) {
        apiData.delivery_methods = selectedMethods;
      }

      const config = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      };

      const apiUrl = `${API_BASE_URL}/user/firm-admin/tax-preparers/send-invite/`;
      console.log("Sending invite to existing user:", apiData);

      const response = await fetchWithCors(apiUrl, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.message || errorData.detail || `HTTP error! status: ${response.status}`;

        // Parse array format error messages
        if (Array.isArray(errorMessage)) {
          errorMessage = errorMessage[0] || errorMessage;
        } else if (typeof errorMessage === 'string' && errorMessage.trim().startsWith('[')) {
          try {
            const parsed = JSON.parse(errorMessage);
            if (Array.isArray(parsed) && parsed.length > 0) {
              errorMessage = parsed[0];
            }
          } catch (e) {
            // Keep original if parsing fails
          }
        }

        // Also check errorData.errors or errorData.error fields
        if (errorData.errors) {
          if (Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors[0] || errorMessage;
          } else if (typeof errorData.errors === 'string') {
            errorMessage = errorData.errors;
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Invite sent successfully:", result);

      // Check if there's a delivery error (e.g., no email template found)
      let hasDeliveryError = false;
      if (result.success && result.data?.delivery_summary?.error) {
        let errorMessage = result.data.delivery_summary.error;

        // Handle array format (e.g., "[\"No active template found...\"]")
        if (typeof errorMessage === 'string' && errorMessage.trim().startsWith('[')) {
          try {
            const parsed = JSON.parse(errorMessage);
            if (Array.isArray(parsed) && parsed.length > 0) {
              errorMessage = parsed[0];
            }
          } catch (e) {
            // Keep original if parsing fails
          }
        }

        // Check if error message indicates missing template
        const errorStr = typeof errorMessage === 'string' ? errorMessage.toLowerCase() : String(errorMessage).toLowerCase();
        hasDeliveryError = errorStr.includes('no active template') ||
          errorStr.includes('no template found') ||
          errorStr.includes('email template');
      }

      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        role: "tax_preparer",
      });
      setDeliveryMethods({
        email: true,
        sms: false,
        link: false,
      });
      setShowConfirmModal(false);
      setExistingUserInfo(null);

      if (typeof onRefresh === "function") {
        onRefresh();
      }
      onClose();

      if (typeof onInviteCreated === "function" && result.data) {
        onInviteCreated(result.data);
      }

      // Show appropriate toast message
      if (hasDeliveryError) {
        toast.success("Invitation added successfully but could not send an invite because no staff invite email templates were found for this firm", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          icon: false,
          className: "custom-toast-success",
          bodyClassName: "custom-toast-body",
        });
      } else {
        toast.success(result.message || "Invitation sent successfully to existing user", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          icon: false,
          className: "custom-toast-success",
          bodyClassName: "custom-toast-body",
        });
      }
    } catch (err) {
      console.error("Error sending invite:", err);
      const errorMessage = handleAPIError(err);
      setError(errorMessage);

      // Show error toast
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        icon: false,
        className: "custom-toast-error",
        bodyClassName: "custom-toast-body",
      });
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-10"
      style={{
        zIndex: 99999,
        marginTop: 0,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-white w-full max-w-[600px] rounded-xl shadow-lg p-5 sm:p-6 relative modal-body-scroll"
        style={{
          maxHeight: "75vh",
          overflowY: "auto",
          position: 'relative',
          fontFamily: 'BasisGrotesquePro'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>
          {`
            .modal-body-scroll::-webkit-scrollbar {
              width: 8px;
            }
            .modal-body-scroll::-webkit-scrollbar-track {
              background: #f8fafc;
            }
            .modal-body-scroll::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 10px;
              border: 2px solid #f8fafc;
            }
            .modal-body-scroll::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
          `}
        </style>
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-[#3B4A66] transition-all duration-200 z-[20]"
        >
          <CrossesIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
          <div className="pr-10">
            <h4 className="text-lg sm:text-xl font-bold text-[#3B4A66] font-[BasisGrotesquePro] leading-tight">
              Invite New Staff Member
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro] mt-1">
              Send an invitation to add a staff member to your firm
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 p-3 rounded-md text-sm text-red-700 bg-red-50 border border-red-200"
            style={{ fontFamily: "BasisGrotesquePro" }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-3" onSubmit={handleSubmit}>
          {/* First and Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Enter first name"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 placeholder-gray-400 font-[BasisGrotesquePro]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Enter last name"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 placeholder-gray-400 font-[BasisGrotesquePro]"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="abc@gmail.com"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 placeholder-gray-400 font-[BasisGrotesquePro]"
            />
          </div>

          {/* Phone - Optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">
              Phone
            </label>

            <PhoneInput
              country={phoneCountry}
              value={formData.phone_number || ''}
              onChange={(phone) =>
                setFormData(prev => ({ ...prev, phone_number: phone }))
              }
              onCountryChange={(countryCode) =>
                setPhoneCountry(countryCode.toLowerCase())
              }

              inputClass="phone-input"
              containerClass="phone-input-container"
              buttonClass="phone-flag-button"

              enableSearch
              countryCodeEditable={false}
            />
          </div>


          {/* Delivery Methods */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
              Delivery Methods
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "email", label: "Email" },
                { key: "sms", label: "SMS" },
                { key: "link", label: "Shareable Link" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-sm text-gray-700 font-[BasisGrotesquePro]"
                >
                  <input
                    type="checkbox"
                    checked={deliveryMethods[key]}
                    onChange={(e) =>
                      setDeliveryMethods((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
              If no delivery method is selected, we will send email and SMS (when a phone number is provided).
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-1.5 !border border-gray-300 !rounded-md text-gray-700 hover:bg-gray-100 transition font-[BasisGrotesquePro] text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-[#F56D2D] text-white !rounded-md hover:bg-orange-600 transition font-[BasisGrotesquePro] font-medium text-sm disabled:opacity-50"
            >
              {loading ? "Sending Invite..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal for Existing User */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setExistingUserInfo(null);
          setLoading(false);
        }}
        onConfirm={handleConfirmSendInvite}
        title="Invite Existing User"
        message={
          existingUserInfo ? (
            <div className="font-[BasisGrotesquePro]">
              <p className="mb-3 text-gray-700">
                Do you want to invite <strong>{existingUserInfo.name}</strong> ({existingUserInfo.email}) to your team?
              </p>
              {existingUserInfo.current_firm && (
                <p className="text-sm text-gray-600">
                  Currently at: <strong>{existingUserInfo.current_firm}</strong>
                </p>
              )}
            </div>
          ) : (
            "Do you want to invite this preparer to your team?"
          )
        }
        confirmText="Yes, Send Invite"
        cancelText="Cancel"
        confirmButtonStyle={{ backgroundColor: '#F56D2D', color: '#FFFFFF' }}
        cancelButtonStyle={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
        isLoading={sendingInvite}
      />
    </div>
  );
}

