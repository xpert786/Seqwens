import React, { useState } from 'react';
import { Browse, CrossesIcon, Folder, DownsIcon } from '../../Components/icons';

export default function BulkImportModal({ isOpen, onClose, onOpenDownloadModal }) {
  const [currentStep, setCurrentStep] = useState(1);

  const csvColumns = [
    { id: 1, column: "first_name", sample: "Sample John" },
    { id: 2, column: "email", sample: "sample.john@example.com" },
    { id: 3, column: "phone", sample: "+91-9876543210" },
    { id: 4, column: "role", sample: "Tax Preparer" },
    { id: 5, column: "department", sample: "Tax Department" },
    { id: 6, column: "employee_id", sample: "EMP-12345" },
    { id: 7, column: "job_title", sample: "Senior Tax Preparer" },
    { id: 8, column: "status", sample: "Active" },
    { id: 9, column: "joining_date", sample: "01-01-2024" },
    { id: 10, column: "location", sample: "New York" },
    { id: 11, column: "manager", sample: "Jane Smith" },
    { id: 12, column: "tags", sample: "CPA Certified" }
  ];

  const systemFields = [
    { id: 1, name: "First Name*", required: true },
    { id: 2, name: "Email Address*", required: true },
    { id: 3, name: "Phone Number*", required: true },
    { id: 4, name: "Role*", required: true },
    { id: 5, name: "Department*", required: true },
    { id: 6, name: "Employee ID", required: false },
    { id: 7, name: "Job Title", required: false },
    { id: 8, name: "Status", required: false },
    { id: 9, name: "Joining Date", required: false },
    { id: 10, name: "Location", required: false },
    { id: 11, name: "Manager", required: false },
    { id: 12, name: "Tags (comma-separated)", required: false },
    { id: 13, name: "Skip this Column", required: false }
  ];

  const [fieldMappings, setFieldMappings] = useState({
    1: 1, // first_name -> First Name*
    2: 2, // email -> Email Address*
    3: 3, // phone -> Phone Number*
    4: 4, // role -> Role*
    5: 5, // department -> Department*
    6: 6, // employee_id -> Employee ID
    7: 7, // job_title -> Job Title
    8: 8, // status -> Status
    9: 9, // joining_date -> Joining Date
    10: 10, // location -> Location
    11: 11, // manager -> Manager
    12: 12 // tags -> Tags
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
          {/* Upload Staff Data */}
          <div>
            <h6 className="taxdashboardr-titler mb-2 font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>Upload Staff Data</h6>
            <div
              className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center"
              style={{ borderColor: 'var(--Palette2-Dark-blue-100, #E8F0FF)', backgroundColor: '#F3F7FF' }}
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
            <div className="rounded-lg p-4 mb-4" style={{
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
              onClick={onOpenDownloadModal}
              className="w-full px-4 py-2 text-black text-sm transition flex items-center gap-2"
              style={{
                border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)',
                borderRadius: '8px'
              }}
            >
              <span className="text-lg"><Browse /></span>
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
          {/* Map CSV Columns to System Fields Text */}
          <div className="mb-6">
            <h6 className="taxdashboardr-titler mb-2 text-base text-[#3B4A66] font-[BasisGrotesquePro] text-gray-900">
              Map CSV Columns to System Fields
            </h6>
            <p className="text-sm font-[BasisGrotesquePro] text-gray-600">
              Match your CSV columns to the appropriate staff fields. Required fields must be mapped.
            </p>
          </div>

          {/* Field Mapping Rows */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2 mb-6">
            {csvColumns.map((csvCol) => (
              <div key={csvCol.id} className="flex items-center gap-3 p-3 rounded-lg !border border-[#E8F0FF]" >
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
                <div className="min-w-[80px] flex justify-start">
                  {systemFields.find(f => f.id === fieldMappings[csvCol.id] && f.required === true) && (
                    <span className="text-xs px-2 py-0.5 !rounded-lg bg-[#EF4444] text-white whitespace-nowrap font-medium">
                      Required
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Main Container Box */}
          <div className="p-6 rounded-lg border bg-[#F3F7FF] !border border-[#E8F0FF]">
            <h6 className="taxdashboardr-titler mb-2 text-base text-[#3B4A66] font-[BasisGrotesquePro] text-gray-900">
              Map CSV Columns to System Fields
            </h6>
            <p className="text-sm mb-4 font-[BasisGrotesquePro] text-gray-600">
              Match your CSV columns to the appropriate staff fields. Required fields must be mapped.
            </p>

            {/* Mapped Fields Summary */}
            <div className="grid grid-cols-2 gap-6 mt-6">
              {/* Mapped Required Fields */}
              <div>
                <h5 className="text-sm font-medium mb-3 !text-[#32B582]">Mapped Required Fields</h5>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {csvColumns.map((csvCol) => {
                    const mappedField = systemFields.find(f => f.id === fieldMappings[csvCol.id]);
                    if (mappedField && mappedField.required) {
                      return (
                        <div key={csvCol.id} className="flex items-center gap-2">
                          <div className="  flex items-center justify-center">
                            <svg width="15" height="15" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g clip-path="url(#clip0_3643_7681)">
                                <path d="M7.33317 3.69264V3.9993C7.33276 4.71811 7.1 5.41753 6.66962 5.99324C6.23923 6.56896 5.63427 6.99013 4.94496 7.19394C4.25565 7.39774 3.51892 7.37327 2.84466 7.12416C2.1704 6.87506 1.59472 6.41467 1.20349 5.81166C0.812259 5.20865 0.626434 4.49532 0.67373 3.77807C0.721025 3.06082 0.998906 2.37808 1.46593 1.83166C1.93295 1.28524 2.5641 0.904431 3.26523 0.746019C3.96637 0.587607 4.69993 0.660083 5.35651 0.952637M2.99984 3.66597L3.99984 4.66597L7.33317 1.33264" stroke="#22C55E" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" />
                              </g>
                              <defs>
                                <clipPath id="clip0_3643_7681">
                                  <rect width="8" height="8" fill="white" />
                                </clipPath>
                              </defs>
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-900">{mappedField.name.replace('*', '')}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>

              {/* Optional Fields Mapped */}
              <div>
                <h5 className="text-sm font-medium mb-3 !text-[#32B582]">Optional Fields Mapped</h5>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                  {csvColumns.map((csvCol) => {
                    const mappedField = systemFields.find(f => f.id === fieldMappings[csvCol.id]);
                    if (mappedField && !mappedField.required) {
                      return (
                        <div key={csvCol.id} className="flex items-center gap-2">
                          <div className=" flex items-center justify-center">
                            <svg width="15" height="15" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g clip-path="url(#clip0_3643_7681)">
                                <path d="M7.33317 3.69264V3.9993C7.33276 4.71811 7.1 5.41753 6.66962 5.99324C6.23923 6.56896 5.63427 6.99013 4.94496 7.19394C4.25565 7.39774 3.51892 7.37327 2.84466 7.12416C2.1704 6.87506 1.59472 6.41467 1.20349 5.81166C0.812259 5.20865 0.626434 4.49532 0.67373 3.77807C0.721025 3.06082 0.998906 2.37808 1.46593 1.83166C1.93295 1.28524 2.5641 0.904431 3.26523 0.746019C3.96637 0.587607 4.69993 0.660083 5.35651 0.952637M2.99984 3.66597L3.99984 4.66597L7.33317 1.33264" stroke="#22C55E" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" />
                              </g>
                              <defs>
                                <clipPath id="clip0_3643_7681">
                                  <rect width="8" height="8" fill="white" />
                                </clipPath>
                              </defs>
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-900">{mappedField.name}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2 text-white text-sm transition flex items-center gap-2 bg-[#F56D2D] !border border-[#F56D2D]"

            >
              <span>Continue to Validation</span>
              <span>→</span>
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div>
          {/* Data Validation Results */}
          <div className="mb-6">
            <h5 className="text-base font-bold text-[#3B4A66] mb-2">Data Validation Results</h5>
            <p className="text-sm text-gray-600">
              Review the validation results and fix any errors before importing
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">4</div>
              <div className="text-sm text-green-700">Valid Records</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700">0</div>
              <div className="text-sm text-red-700">Errors</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700">0</div>
              <div className="text-sm text-yellow-700">Duplicates</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700">1</div>
              <div className="text-sm text-blue-700">Warnings</div>
            </div>
          </div>

          {/* Validation Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Row</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">1</td>
                    <td className="px-4 py-3">
                      <svg width="15" height="15" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clip-path="url(#clip0_3643_8784)">
                          <path d="M9.16634 4.61775V5.00108C9.16583 5.89959 8.87488 6.77386 8.3369 7.49351C7.79891 8.21315 7.04271 8.73961 6.18107 8.99437C5.31944 9.24913 4.39853 9.21854 3.5557 8.90716C2.71287 8.59578 1.99328 8.02029 1.50424 7.26653C1.0152 6.51276 0.782921 5.62111 0.84204 4.72455C0.901159 3.82798 1.24851 2.97455 1.83229 2.29153C2.41607 1.60851 3.205 1.13249 4.08142 0.934477C4.95784 0.736462 5.87479 0.827057 6.69551 1.19275M3.74968 4.58442L4.99968 5.83442L9.16634 1.66775" stroke="#22C55E" stroke-linecap="round" stroke-linejoin="round" />
                        </g>
                        <defs>
                          <clipPath id="clip0_3643_8784">
                            <rect width="10" height="10" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>

                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">John Doe</td>
                    <td className="px-4 py-3 text-sm text-gray-900">john.doe@email.com</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Manager</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Finance</td>
                    <td className="px-4 py-3 text-sm text-gray-900">1234567890</td>
                    <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">2</td>
                    <td className="px-4 py-3">
                      <svg width="15" height="15" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.5" y="0.5" width="9" height="9" rx="4.5" stroke="#EF4444" />
                        <path d="M6.69441 3.74858C6.72427 3.71976 6.74809 3.68529 6.76449 3.64717C6.78088 3.60905 6.78952 3.56805 6.7899 3.52656C6.79028 3.48507 6.7824 3.44391 6.7667 3.4055C6.75101 3.36709 6.72782 3.33219 6.69849 3.30283C6.66916 3.27348 6.63428 3.25026 6.59589 3.23452C6.55749 3.21879 6.51634 3.21087 6.47485 3.21121C6.43336 3.21155 6.39235 3.22015 6.35421 3.23651C6.31608 3.25287 6.28158 3.27666 6.25274 3.30649L5.00024 4.55858L3.74816 3.30649C3.71955 3.27579 3.68505 3.25116 3.64672 3.23408C3.60838 3.217 3.567 3.20782 3.52504 3.20708C3.48308 3.20634 3.44141 3.21406 3.40249 3.22978C3.36358 3.24549 3.32823 3.26889 3.29856 3.29856C3.26889 3.32823 3.24549 3.36358 3.22978 3.40249C3.21406 3.44141 3.20634 3.48308 3.20708 3.52504C3.20782 3.567 3.217 3.60838 3.23408 3.64672C3.25116 3.68505 3.27579 3.71955 3.30649 3.74816L4.55774 5.00066L3.30566 6.25274C3.25046 6.31198 3.22041 6.39034 3.22184 6.47129C3.22327 6.55225 3.25606 6.6295 3.31332 6.68675C3.37057 6.74401 3.44782 6.7768 3.52878 6.77823C3.60973 6.77966 3.68809 6.74961 3.74733 6.69441L5.00024 5.44233L6.25233 6.69483C6.31157 6.75003 6.38992 6.78008 6.47088 6.77865C6.55184 6.77722 6.62908 6.74442 6.68634 6.68717C6.74359 6.62991 6.77639 6.55267 6.77782 6.47171C6.77924 6.39075 6.74919 6.3124 6.69399 6.25316L5.44274 5.00066L6.69441 3.74858Z" fill="#EF4444" />
                      </svg>

                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">Sarah Smith</td>
                    <td className="px-4 py-3 text-sm text-gray-900">sarah@email</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Tax Preparer</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Audit</td>
                    <td className="px-4 py-3 text-sm text-gray-900">-</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_3643_8813)">
                            <path d="M6.00021 4.49914V6.49914M6.00021 8.49914H6.00521M10.8652 8.99914L6.86521 1.99914C6.77799 1.84524 6.65151 1.71723 6.49867 1.62817C6.34583 1.53911 6.1721 1.49219 5.99521 1.49219C5.81831 1.49219 5.64459 1.53911 5.49175 1.62817C5.33891 1.71723 5.21243 1.84524 5.12521 1.99914L1.12521 8.99914C1.03705 9.15181 0.990823 9.32509 0.991213 9.50139C0.991604 9.67769 1.0386 9.85076 1.12743 10.003C1.21627 10.1553 1.34378 10.2814 1.49706 10.3685C1.65033 10.4557 1.82391 10.5007 2.00021 10.4991H10.0002C10.1757 10.499 10.348 10.4526 10.4998 10.3648C10.6517 10.2769 10.7778 10.1507 10.8655 9.99869C10.9531 9.8467 10.9992 9.67433 10.9992 9.49888C10.9991 9.32343 10.9529 9.15108 10.8652 8.99914Z" stroke="#991B1B" strokeLinecap="round" strokeLinejoin="round" />
                          </g>
                          <defs>
                            <clipPath id="clip0_3643_8813">
                              <rect width="12" height="12" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                        <span className="text-sm" style={{ color: '#991B1B' }}>Invalid email format</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">3</td>
                    <td className="px-4 py-3">
                      <svg width="15" height="15" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_3643_8885)">
                          <path d="M4.99954 1.25L9.25788 8.625H0.741211L4.99954 1.25Z" stroke="#FBBF24" strokeLinecap="square" />
                          <path d="M5 4.375V5.83333M5 7.29167H5.00167V7.29333H5V7.29167Z" stroke="#FBBF24" strokeLinecap="square" />
                        </g>
                        <defs>
                          <clipPath id="clip0_3643_8885">
                            <rect width="10" height="10" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>


                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">Raj Kumar</td>
                    <td className="px-4 py-3 text-sm text-gray-900">raj@firm.com</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Analyst</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Tax</td>
                    <td className="px-4 py-3 text-sm text-gray-900">900</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_3643_8813)">
                            <path d="M6.00021 4.49914V6.49914M6.00021 8.49914H6.00521M10.8652 8.99914L6.86521 1.99914C6.77799 1.84524 6.65151 1.71723 6.49867 1.62817C6.34583 1.53911 6.1721 1.49219 5.99521 1.49219C5.81831 1.49219 5.64459 1.53911 5.49175 1.62817C5.33891 1.71723 5.21243 1.84524 5.12521 1.99914L1.12521 8.99914C1.03705 9.15181 0.990823 9.32509 0.991213 9.50139C0.991604 9.67769 1.0386 9.85076 1.12743 10.003C1.21627 10.1553 1.34378 10.2814 1.49706 10.3685C1.65033 10.4557 1.82391 10.5007 2.00021 10.4991H10.0002C10.1757 10.499 10.348 10.4526 10.4998 10.3648C10.6517 10.2769 10.7778 10.1507 10.8655 9.99869C10.9531 9.8467 10.9992 9.67433 10.9992 9.49888C10.9991 9.32343 10.9529 9.15108 10.8652 8.99914Z" stroke="#991B1B" strokeLinecap="round" strokeLinejoin="round" />
                          </g>
                          <defs>
                            <clipPath id="clip0_3643_8813">
                              <rect width="12" height="12" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                        <span className="text-sm" style={{ color: '#991B1B' }}>Phone number format may fail</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">4</td>
                    <td className="px-4 py-3">
                      <svg width="15" height="15" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_3643_8885)">
                          <path d="M4.99954 1.25L9.25788 8.625H0.741211L4.99954 1.25Z" stroke="#FBBF24" strokeLinecap="square" />
                          <path d="M5 4.375V5.83333M5 7.29167H5.00167V7.29333H5V7.29167Z" stroke="#FBBF24" strokeLinecap="square" />
                        </g>
                        <defs>
                          <clipPath id="clip0_3643_8885">
                            <rect width="10" height="10" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">John Doe</td>
                    <td className="px-4 py-3 text-sm text-gray-900">john.doe@email.com</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Manager</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Finance</td>
                    <td className="px-4 py-3 text-sm text-gray-900">1234567890</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_3643_8813)">
                            <path d="M6.00021 4.49914V6.49914M6.00021 8.49914H6.00521M10.8652 8.99914L6.86521 1.99914C6.77799 1.84524 6.65151 1.71723 6.49867 1.62817C6.34583 1.53911 6.1721 1.49219 5.99521 1.49219C5.81831 1.49219 5.64459 1.53911 5.49175 1.62817C5.33891 1.71723 5.21243 1.84524 5.12521 1.99914L1.12521 8.99914C1.03705 9.15181 0.990823 9.32509 0.991213 9.50139C0.991604 9.67769 1.0386 9.85076 1.12743 10.003C1.21627 10.1553 1.34378 10.2814 1.49706 10.3685C1.65033 10.4557 1.82391 10.5007 2.00021 10.4991H10.0002C10.1757 10.499 10.348 10.4526 10.4998 10.3648C10.6517 10.2769 10.7778 10.1507 10.8655 9.99869C10.9531 9.8467 10.9992 9.67433 10.9992 9.49888C10.9991 9.32343 10.9529 9.15108 10.8652 8.99914Z" stroke="#991B1B" strokeLinecap="round" strokeLinejoin="round" />
                          </g>
                          <defs>
                            <clipPath id="clip0_3643_8813">
                              <rect width="12" height="12" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                        <span className="text-sm" style={{ color: '#991B1B' }}>Duplicate with Row 1</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Import Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2 text-white text-sm transition flex items-center gap-2 bg-[#F56D2D] rounded-lg font-semibold"
            >
              <span>Import 4 valid records</span>
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === 4) {
      return (
        <div>
          {/* Import Progress */}
          <div className="mb-6">
            <h5 className="text-base font-bold text-[#3B4A66] mb-2">Import Progress</h5>
            <p className="text-sm text-[#3B4A66]">Import Completed</p>
          </div>

          {/* Import Completed Content */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32.0827 16.1602V17.5018C32.0809 20.6466 31.0626 23.7066 29.1796 26.2253C27.2967 28.7441 24.65 30.5867 21.6342 31.4784C18.6185 32.37 15.3954 32.2629 12.4455 31.1731C9.49555 30.0833 6.97697 28.0691 5.26533 25.4309C3.5537 22.7927 2.74071 19.6719 2.94763 16.534C3.15454 13.396 4.37028 10.409 6.41351 8.0184C8.45674 5.62782 11.218 3.96177 14.2855 3.26872C17.3529 2.57566 20.5622 2.89274 23.4348 4.17267M13.1244 16.0435L17.4994 20.4185L32.0827 5.83517" stroke="#22C55E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              </svg>

            </div>
            <h4 className="text-2xl font-bold !text-[#32B582] mb-2">Import Completed!</h4>
            <p className="text-sm text-gray-600">The import has been completed successfully</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">4</div>
              <div className="text-sm text-green-700">Valid Records</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700">0</div>
              <div className="text-sm text-red-700">Errors</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700">0</div>
              <div className="text-sm text-yellow-700">Duplicates</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700">1</div>
              <div className="text-sm text-blue-700">Warnings</div>
            </div>
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
        className="bg-white rounded-lg shadow-lg p-6 max-w-5xl w-full mx-4"
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
              <h4 className="taxdashboardr-titler text-[22px] font-bold font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>Bulk Import Staff</h4>
              <p className="text-sm mt-1 font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>
                Upload multiple staff members at once using a CSV file
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
                className={`text-sm font-medium ${s.step <= currentStep ? "font-bold" : ""
                  }`}
                style={s.step <= currentStep ? { color: '#F56D2D' } : { color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}
              >
                {s.step}. {s.label}
              </span>
              {i < 3 && (
                <span
                  style={s.step <= currentStep ? { color: '#F56D2D' } : { color: '#9CA3AF' }}
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
