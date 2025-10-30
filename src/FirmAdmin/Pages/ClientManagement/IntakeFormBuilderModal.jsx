
import React, { useState } from "react";
 
export default function IntakeFormBuilderModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("individual");
 
  if (!isOpen) return null;
 
  const individualFields = [
    { label: "First Name", type: "Text", required: "Required" },
    { label: "Email", type: "Email", required: "Required" },
    { label: "Phone", type: "Phone", required: "Optional" },
    { label: "Government ID", type: "File", required: "Optional" },
    { label: "W-2 Upload", type: "File", required: "Optional" },
    { label: "Prior-Year Return", type: "File", required: "Optional" },
    { label: "Preferred Communication", type: "Select", required: "Optional" },
  ];
 
  const businessFields = [
    { label: "Company Name", type: "Text", required: "Required" },
    { label: "Primary Contact", type: "Text", required: "Required" },
    { label: "Email", type: "Email", required: "Required" },
    { label: "EIN", type: "Text", required: "Optional" },
    { label: "Owner ID", type: "File", required: "Optional" },
    { label: "Prior-Year Return", type: "File", required: "Optional" },
    { label: "Preferred Communication", type: "Select", required: "Optional" },
  ];
 
  const fields = activeTab === "individual" ? individualFields : businessFields;
 
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg p-6 relative overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Intake Forms Builder</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>
 
        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${
              activeTab === "individual"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab("individual")}
          >
            Individual
          </button>
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${
              activeTab === "business"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab("business")}
          >
            Business
          </button>
        </div>
 
        {/* Template Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Name
          </label>
          <input
            type="text"
            defaultValue={`Default ${
              activeTab === "individual" ? "Individual" : "Business"
            } Intake`}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
 
        {/* Fields */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-700">Fields</h3>
            <button className="text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition">
              + Add Field
            </button>
          </div>
 
          {/* Field List */}
          <div className="space-y-3">
            {fields.map((field, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
              >
                {/* Field Name */}
                <div className="md:col-span-4">
                  <input
                    type="text"
                    value={field.label}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    readOnly
                  />
                </div>
 
                {/* Field Type */}
                <div className="md:col-span-3">
                  <select
                    value={field.type}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    readOnly
                  >
                    <option>{field.type}</option>
                  </select>
                </div>
 
                {/* Required/Optional */}
                <div className="md:col-span-3">
                  <select
                    value={field.required}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    readOnly
                  >
                    <option>{field.required}</option>
                  </select>
                </div>
 
                {/* Remove Button */}
                <div className="md:col-span-2 flex justify-end">
                  <button className="text-sm text-gray-500 hover:text-red-500">
                    Remove
                  </button>
                </div>
 
                {/* File Kind (if applicable) */}
                {field.type === "File" && (
                  <div className="md:col-span-12 mt-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      File Kind
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      readOnly
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
 
        {/* Footer */}
        <div className="flex justify-end mt-8">
          <button className="px-5 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition">
            Save Template →
          </button>
        </div>
      </div>
    </div>
  );
}