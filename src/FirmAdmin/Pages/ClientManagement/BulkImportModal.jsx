import React, { useState } from "react";
import { Browse, CrossesIcon, Folder } from "../../Components/icons";
 
export default function BulkImportModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  
  const csvColumns = [
    { id: 1, column: "first_name", sample: "Sample John" },
    { id: 2, column: "last_name", sample: "Sample Doe" },
    { id: 3, column: "email", sample: "sample.john.doe@example.com" },
    { id: 4, column: "phone", sample: "+91-9876543210" },
    { id: 5, column: "company_name", sample: "Sample Lorem Consulting" },
    { id: 6, column: "client_type", sample: "Individual" },
    { id: 7, column: "return_type", sample: "1040" },
    { id: 8, column: "filing_year", sample: "2024" },
    { id: 9, column: "office_location", sample: "Downtown Office" },
    { id: 10, column: "tags", sample: "High Priority, VIP" },
    { id: 11, column: "address", sample: "123 Main Street, Suite 100" },
    { id: 12, column: "city", sample: "Springfield" },
    { id: 13, column: "state", sample: "NY" },
    { id: 14, column: "zip_code", sample: "10001" },
    { id: 15, column: "tax_id", sample: "00-000-0000" },
  ];

  const systemFields = [
    { id: 1, name: "First Name*", required: true },
    { id: 2, name: "Last Name*", required: true },
    { id: 3, name: "Email Address*", required: true },
    { id: 4, name: "Phone Number*", required: true },
    { id: 5, name: "Full Name*", required: true },
    { id: 6, name: "Client Type*", required: true },
    { id: 7, name: "Company Name", required: false },
    { id: 8, name: "Return Type", required: false },
    { id: 9, name: "Filing Year", required: false },
    { id: 10, name: "Office Location", required: false },
    { id: 11, name: "Tags (comma-separated)", required: false },
    { id: 12, name: "Address", required: false },
    { id: 13, name: "City", required: false },
    { id: 14, name: "State", required: false },
    { id: 15, name: "ZIP Code", required: false },
    { id: 16, name: "Tax ID (SSN/EIN)", required: false },
    { id: 17, name: "Skip this Column", required: false },
  ];

  const [fieldMappings, setFieldMappings] = useState({
    1: 1, // first_name -> First Name*
    2: 2, // last_name -> Last Name*
    3: 3, // email -> Email Address*
    4: 4, // phone -> Phone Number*
    5: 7, // company_name -> Company Name
    6: 6, // client_type -> Client Type*
    7: 8, // return_type -> Return Type
    8: 9, // filing_year -> Filing Year
    9: 10, // office_location -> Office Location
    10: 11, // tags -> Tags
    11: 12, // address -> Address
    12: 13, // city -> City
    13: 14, // state -> State
    14: 15, // zip_code -> ZIP Code
    15: 16, // tax_id -> Tax ID
  });

  const handleMappingChange = (csvColumnId, systemFieldId) => {
    setFieldMappings({
      ...fieldMappings,
      [csvColumnId]: systemFieldId
    });
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Upload Client Data */}
          <div>
            <h6 className="taxdashboardr-titler mb-2 font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>Upload Client Data</h6>
            <div 
              className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center"
              style={{ borderColor: 'var(--Palette2-Dark-blue-100, #E8F0FF)' }}
            >
              <div className="text-blue-500 text-2xl mb-2"><Folder /></div>
              <div className="text-xs mb-3" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)', fontSize: '10px' }}>
                <p>Drop your file here or click to browse</p>
                <p>Supported formats: CSV, XLS, XLSX (Max 10MB)</p>
              </div>
              <button 
                className="px-4 py-2 text-black text-sm transition flex items-center gap-2"
                style={{ 
                  border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)',
                  borderRadius: '8px'
                }}
              >
               <Browse /> Browse Files
              </button>
            </div>
          </div>

          {/* Download Template */}
          <div>
          <h6 className="taxdashboardr-titler mb-2 font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>Download Template</h6>
            <p className="text-sm mt-1 font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>
              Use our template to ensure your data is formatted correctly
            </p>
             <div className=" rounded-lg p-4 mb-4"  style={{ 
             backgroundColor: 'var(--Palette2-Dark-blue-100, #E8F0FF)',
             border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)',
             color: 'var(--Palette2-Dark-blue-900, #3B4A66)',
             fontSize: '12px'
           }}>
                 <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Template includes:</h4>
                <div className="flex flex-col space-y-1" style={{ fontSize: '12px' }}>
                  <div>• All required and optional fields</div>
                  <div>• Sample data for reference</div>
                  <div>• Proper formatting examples</div>
                  <div>• Field validation rules</div>
                </div>
              </div>
            <button 
                className="w-full px-4 py-2 text-black text-sm transition flex items-center gap-2"
                style={{ 
                  border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)',
                  borderRadius: '8px'
                }}
              > <span className="text-lg"><Browse />  </span>
              <span>Download CSV Template</span>
            </button>

            {/* Continue to Validation Button */}
            <div className="flex justify-end mt-4">
              <button 
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2 text-white text-sm transition flex items-center gap-2"
                style={{ 
                  backgroundColor: '#F97316',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                <span>Continue to Validation</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div>
          <h4 className="taxdashboardr-titler mb-2 text-base font-bold font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>
            Map CSV Columns to System Fields
          </h4>
          <p className="text-sm mb-4 font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>
            Match your CSV columns to the appropriate client fields. Required fields must be mapped.
          </p>

          {/* Field Mapping Rows */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {csvColumns.map((csvCol) => (
              <div key={csvCol.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: '#F8F9FA', borderColor: '#E5E7EB' }}>
                {/* CSV Column */}
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1" style={{ color: '#1F2937' }}>
                    {csvCol.column}
                  </div>
                  <div className="text-xs" style={{ color: '#6B7280' }}>
                    Sample: {csvCol.sample}
                  </div>
                </div>

                {/* Arrow */}
                <span className="text-gray-600 text-lg">→</span>

                {/* System Field Dropdown */}
                <div className="flex-1 relative">
                  <select
                    value={fieldMappings[csvCol.id] || ''}
                    onChange={(e) => handleMappingChange(csvCol.id, e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                  >
                    <option value="">Select field...</option>
                    {systemFields.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.name}
                      </option>
                    ))}
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

                {/* Required Badge */}
                {systemFields.find(f => f.id === fieldMappings[csvCol.id] && f.required === true) && (
                  <span className="text-xs px-2 py-0.5 !rounded-lg bg-[#EF4444] text-white whitespace-nowrap font-medium">
                    Required
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Continue Button */}
          <div className="flex justify-end mt-6">
            <button 
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2 text-white text-sm transition flex items-center gap-2"
              style={{ 
                backgroundColor: '#F97316',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              <span>Continue to Validation</span>
              <span>→</span>
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full mx-4"
        style={{ 
          borderRadius: '12px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex justify-between items-center pb-2" style={{ borderBottom: '0.5px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
            <div>
              <h4 className="taxdashboardr-titler text-[22px] font-bold font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>Bulk Import Clients</h4>
              <p className="text-sm mt-1 font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>
                Import multiple clients from CSV or Excel files with field mapping and validation
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-gray-600 text-xl leading-none transition-colors shadow-sm"
            >
              <CrossesIcon className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        </div>

        {/* Steps Navigation */}
        <div 
          className="flex items-center justify-between rounded-lg px-4 py-3 mb-4"
          style={{ 
            backgroundColor: 'var(--Palette2-Dark-blue-100, #E8F0FF)',
            border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)'
          }}
        >
          {[
            { step: 1, label: "Upload File" },
            { step: 2, label: "Map Fields" },
            { step: 3, label: "Validate Data" },
            { step: 4, label: "Import" },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center">
              <span
                className={`text-sm font-medium ${
                  s.step === currentStep ? "text-blue-600 font-bold" : ""
                }`}
                style={s.step !== currentStep ? { color: 'var(--Palette2-Dark-blue-900, #3B4A66)' } : {}}
              >
                {s.step}. {s.label}
              </span>
              {i < 3 && (
                <span 
                  className={`mx-2 ${
                    s.step <= currentStep ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  &raquo;
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Dynamic Step Content */}
        {renderStepContent()}
      </div>
    </div>
  );
}
