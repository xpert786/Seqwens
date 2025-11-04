
import React, { useState } from "react";

export default function IntakeFormBuilderModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("individual");

  const [individualFields, setIndividualFields] = useState([
    { id: 1, label: "First Name", type: "Text", required: "Required" },
    { id: 2, label: "Email", type: "Email", required: "Required" },
    { id: 3, label: "Phone", type: "Phone", required: "Optional" },
    { id: 4, label: "Government ID", type: "File", required: "Optional", fileKind: "Government ID" },
    { id: 5, label: "W-2 Upload", type: "File", required: "Optional", fileKind: "W-2 Upload" },
    { id: 6, label: "Prior-Year Return", type: "File", required: "Optional", fileKind: "Prior-Year Return" },
    { id: 7, label: "Preferred Communication", type: "Select", required: "Optional", fileKind: "Preferred Communication" },
  ]);

  const [businessFields, setBusinessFields] = useState([
    { id: 1, label: "Company Name", type: "Text", required: "Required" },
    { id: 2, label: "Primary Contact", type: "Text", required: "Required" },
    { id: 3, label: "Email", type: "Email", required: "Required" },
    { id: 4, label: "EIN", type: "Text", required: "Optional" },
    { id: 5, label: "Owner ID", type: "File", required: "Optional", fileKind: "Government ID" },
    { id: 6, label: "Prior-Year Return", type: "File", required: "Optional", fileKind: "Prior-Year Return" },
    { id: 7, label: "Preferred Communication", type: "Select", required: "Optional", fileKind: "Preferred Communication" },
  ]);

  const fields = activeTab === "individual" ? individualFields : businessFields;
  const setFields = activeTab === "individual" ? setIndividualFields : setBusinessFields;

  if (!isOpen) return null;

  const handleRemoveField = (id) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const handleAddField = () => {
    const newField = { id: fields.length + 1, label: "", type: "Text", required: "Optional" };
    setFields([...fields, newField]);
  };

  const handleFieldChange = (id, fieldName, value) => {
    setFields(fields.map(field =>
      field.id === id ? { ...field, [fieldName]: value } : field
    ));
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-xl -lg p-6 relative overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Intake Forms Builder</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-gray-600 text-xl leading-none transition-colors -sm"
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="!border border-[#E8F0FF] rounded-lg p-3 mb-6 inline-flex gap-1">
          <button
            className={`px-4 py-1.8 !rounded-md text-sm font-medium transition-all ${activeTab === "individual"
              ? "bg-[#3AD6F2] text-white"
              : "text-gray-700 hover:bg-gray-100"
              }`}
            onClick={() => setActiveTab("individual")}
          >
            Individual
          </button>
          <button
            className={`px-4 py-1.5 !rounded-md text-sm font-medium transition-all ${activeTab === "business"
              ? "bg-[#3AD6F2] text-white"
              : "text-gray-700 hover:bg-gray-100"
              }`}
            onClick={() => setActiveTab("business")}
          >
            Business
          </button>
        </div>

        {/* Template Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Name
          </label>
          <input
            type="text"
            defaultValue={`Default ${activeTab === "individual" ? "Individual" : "Business"
              } Intake`}
            className="w-full !border border-[#E8F0FF] rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Fields */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-700 text-base">Fields</h3>
            <button
              onClick={handleAddField}
              className="text-sm px-3 py-1.5 !border border-[#E8F0FF] rounded-md text-gray-600 hover:bg-gray-100 transition"
            >
              + Add Field
            </button>
          </div>

          {/* Field List */}
          <div className="space-y-4">
            {fields.map((field) => (
              <div
                key={field.id}
                className="!border border-[#E8F0FF] rounded-lg p-4 "
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Field Name */}
                  <div className="md:col-span-4">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                      className="w-full !border border-[#E8F0FF] rounded-md px-3 py-2 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  {/* Field Type */}
                  <div className="md:col-span-3">
                    <select
                      value={field.type}
                      onChange={(e) => handleFieldChange(field.id, 'type', e.target.value)}
                      className="w-full !border border-[#E8F0FF] rounded-md px-3 py-2 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option>Text</option>
                      <option>Email</option>
                      <option>Phone</option>
                      <option>File</option>
                      <option>Select</option>
                    </select>
                  </div>

                  {/* Required/Optional */}
                  <div className="md:col-span-3">
                    <select
                      value={field.required}
                      onChange={(e) => handleFieldChange(field.id, 'required', e.target.value)}
                      className="w-full !border border-[#E8F0FF] rounded-md px-3 py-2 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option>Required</option>
                      <option>Optional</option>
                    </select>
                  </div>

                  {/* Remove Button */}
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      onClick={() => handleRemoveField(field.id)}
                      className="text-sm text-[#3B4A66] hover:text-red-500 !border border-[#E8F0FF] bg-white !rounded-[8px] px-3 py-2 -sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* File Kind (if applicable) */}
                {(field.type === "File" || field.type === "Select") && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      File Kind
                    </label>
                    <div className="relative">
                      <select
                        value={field.fileKind || field.label}
                        onChange={(e) => handleFieldChange(field.id, 'fileKind', e.target.value)}
                        className="w-full !border border-[#E8F0FF] rounded-md px-3 py-2 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                      >
                        <option>{field.label}</option>
                      </select>
                      <svg
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-8">
          <button className="px-5 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition flex items-center gap-2" style={{ borderRadius: "10px" }}>
            Save Template
            <span><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.75 6H11.25M11.25 6L6 0.75M11.25 6L6 11.25" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}