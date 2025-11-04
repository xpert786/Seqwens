import React from "react";
import { CrossesIcon } from "../../Components/icons";

export default function AddStaffModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 mt-10">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-4 relative">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-base font-semibold text-gray-800 font-[BasisGrotesquePro]">Add New Staff Member</h4>
            <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-0.5">
              Create a new staff profile and set their role
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <CrossesIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form className="space-y-3">
          {/* First and Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">
                First Name
              </label>
              <input
                type="text"
                placeholder="Enter first name"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 placeholder-gray-400 font-[BasisGrotesquePro]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Enter last name"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 placeholder-gray-400 font-[BasisGrotesquePro]"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">
              Email
            </label>
            <input
              type="email"
              placeholder="abc@gmail.com"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 placeholder-gray-400 font-[BasisGrotesquePro]"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">
              Phone
            </label>
            <input
              type="tel"
              placeholder="(555) 123-4567"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 placeholder-gray-400 font-[BasisGrotesquePro]"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">
              Role
            </label>
            <div className="relative">
              <select
                className="w-full !border border-gray-300 rounded-md px-3 py-1.5  text-gray-700 bg-white font-[BasisGrotesquePro] appearance-none"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Hire Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-[BasisGrotesquePro]">
              Hire Date
            </label>
            <div className="relative">
              <input
                type="date"
                placeholder="mm/dd/yyyy"
                className="w-full !border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 placeholder-gray-400 font-[BasisGrotesquePro]"
              />
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.33333 1.33203V3.9987M10.6667 1.33203V3.9987M2 6.66536H14M3.33333 2.66536H12.6667C13.403 2.66536 14 3.26232 14 3.9987V13.332C14 14.0684 13.403 14.6654 12.6667 14.6654H3.33333C2.59695 14.6654 2 14.0684 2 13.332V3.9987C2 3.26232 2.59695 2.66536 3.33333 2.66536Z"
                  stroke="#4B5563"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 !border border-gray-300 !rounded-md text-gray-700 hover:bg-gray-100 transition font-[BasisGrotesquePro] text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#F56D2D] text-white !rounded-md hover:bg-orange-600 transition font-[BasisGrotesquePro] font-medium text-sm"
            >
              Add Staff Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

