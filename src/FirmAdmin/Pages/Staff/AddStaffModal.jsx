import React, { useState } from "react";
import { toast } from "react-toastify";
import { CrossesIcon } from "../../Components/icons";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";

export default function AddStaffModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "",
    hire_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

      // Prepare data for API - only send fields that are in the API
      const apiData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        hire_date: formData.hire_date,
      };

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
        throw new Error(
          errorData.message ||
          errorData.detail ||
          `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Staff member created successfully:", result);

      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "",
        hire_date: "",
      });

      // Close modal and refresh list
      if (onSuccess) {
        onSuccess();
      }
      onClose();

      // Show success toast
      toast.success("Staff member added successfully!", {
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
      phone: "",
      role: "",
      hire_date: "",
    });
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{
        zIndex: 9999,
        marginTop: 0,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-white w-full rounded-xl shadow-lg p-6 relative"
        style={{
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-base font-semibold text-gray-800 font-[BasisGrotesquePro]">
              Add New Staff Member
            </h4>
            <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-0.5">
              Create a new staff profile and set their role
            </p>
          </div>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
          >
            <CrossesIcon className="w-5 h-5" />
          </button>
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
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(555) 123-4567"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 placeholder-gray-400 font-[BasisGrotesquePro]"
            />
          </div>

          {/* Role - Optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">
              Role
            </label>
            <div className="relative">
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full !border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 bg-white font-[BasisGrotesquePro] appearance-none"
              >
                <option value="">Select role...</option>
                <option value="tax-preparer">Tax Preparer</option>
                <option value="tax-manager">Tax Manager</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Hire Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">
              Hire Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="hire_date"
                value={formData.hire_date}
                onChange={handleChange}
                placeholder="mm/dd/yyyy"
                required
                className="w-full !border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 placeholder-gray-400 font-[BasisGrotesquePro]"
              />
            </div>
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
              {loading ? "Adding..." : "Add Staff Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

