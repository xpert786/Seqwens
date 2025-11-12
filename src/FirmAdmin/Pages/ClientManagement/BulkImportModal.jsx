import React, { useState, useEffect, useCallback } from "react";
import { Browse, CrossesIcon, Folder } from "../../Components/icons";
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';

export default function BulkImportModal({ isOpen, onClose, onOpenDownloadModal }) {
  const API_BASE_URL = getApiBaseUrl();
  const [currentStep, setCurrentStep] = useState(1);
  const [csvFile, setCsvFile] = useState(null);
  const [csvColumns, setCsvColumns] = useState([]);
  const [systemFields, setSystemFields] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationResults, setValidationResults] = useState(null);
  const [importResults, setImportResults] = useState(null);

  // Fetch system fields from API
  const fetchSystemFields = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = getAccessToken();
      const url = `${API_BASE_URL}/taxpayer/firm-admin/clients/import/fields/`;

      const response = await fetchWithCors(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Map API fields to component format
        const fields = result.data.system_fields || [];
        const mappedFields = fields.map((field, index) => ({
          id: index + 1,
          name: field.field_name + (field.required ? '*' : ''),
          required: field.required || false,
          field_key: field.field_key || field.field_name.toLowerCase().replace(/\s+/g, '_')
        }));

        // Add "Skip this Column" option
        mappedFields.push({
          id: mappedFields.length + 1,
          name: "Skip this Column",
          required: false,
          field_key: 'skip'
        });

        setSystemFields(mappedFields);
        setAvailableStaff(result.data.available_staff || []);
      }
    } catch (err) {
      console.error('Error fetching system fields:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load system fields. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Fetch system fields when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSystemFields();
    } else {
      // Reset state when modal closes
      setCurrentStep(1);
      setCsvFile(null);
      setCsvColumns([]);
      setFieldMappings({});
      setCsvData(null);
      setValidationResults(null);
      setImportResults(null);
      setError('');
      setTotalUsers(0);
    }
  }, [isOpen, fetchSystemFields]);

  // Auto-map fields when CSV columns and system fields are both available
  useEffect(() => {
    if (csvColumns.length > 0 && systemFields.length > 0 && Object.keys(fieldMappings).length === 0) {
      autoMapFields(csvColumns);
    }
  }, [csvColumns, systemFields]);

  // Parse CSV file to extract columns
  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length === 0) {
            reject(new Error('CSV file is empty'));
            return;
          }

          // Parse header row
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

          // Get sample data from second row if available
          const samples = lines.length > 1
            ? lines[1].split(',').map(s => s.trim().replace(/^"|"$/g, ''))
            : headers.map(() => '');

          const columns = headers.map((header, index) => ({
            id: index + 1,
            column: header,
            sample: samples[index] || ''
          }));

          resolve({ columns, csvData: lines });
        } catch (err) {
          reject(new Error('Failed to parse CSV file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const [fieldMappings, setFieldMappings] = useState({});
  const [csvData, setCsvData] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);

  // Auto-map CSV columns to system fields based on column names
  const autoMapFields = (csvColumns) => {
    if (!systemFields || systemFields.length === 0) {
      return; // System fields not loaded yet
    }

    const mappings = {};

    csvColumns.forEach(csvCol => {
      const columnName = csvCol.column.toLowerCase().trim();

      // Try to find matching system field
      const matchedField = systemFields.find(field => {
        const fieldName = field.name.toLowerCase().replace(/\*/g, '').trim();
        const fieldKey = field.field_key?.toLowerCase() || '';

        // Exact matches
        if (columnName === fieldKey || columnName === fieldName) {
          return true;
        }

        // Common variations and aliases
        const variations = {
          'first_name': ['first name', 'firstname', 'fname', 'first'],
          'last_name': ['last name', 'lastname', 'lname', 'last', 'surname'],
          'full_name': ['full name', 'fullname', 'name', 'client name'],
          'email': ['email', 'email address', 'e-mail', 'emailid'],
          'phone_number': ['phone', 'phone number', 'mobile', 'contact', 'telephone', 'tel'],
          'company_name': ['company', 'company name', 'business name', 'organization'],
          'client_type': ['client type', 'type', 'customer type'],
          'return_type': ['return type', 'tax return type'],
          'filing_year': ['filing year', 'year', 'tax year'],
          'office_location': ['office location', 'office', 'location'],
          'tags': ['tags', 'tag', 'labels'],
          'address': ['address', 'street address', 'street'],
          'city': ['city'],
          'state': ['state', 'province'],
          'zip_code': ['zip', 'zip code', 'postal code', 'postcode'],
          'tax_id': ['tax id', 'ssn', 'ein', 'tax identification', 'taxid'],
          'assigned_to_staff': ['assigned staff', 'assigned to', 'staff', 'assigned']
        };

        // Check variations
        for (const [key, aliases] of Object.entries(variations)) {
          if (fieldKey === key && aliases.some(alias => columnName.includes(alias) || alias.includes(columnName))) {
            return true;
          }
        }

        // Partial matches (contains)
        if (fieldKey && columnName.includes(fieldKey)) {
          return true;
        }
        if (fieldName && columnName.includes(fieldName)) {
          return true;
        }

        return false;
      });

      if (matchedField && matchedField.field_key !== 'skip') {
        mappings[csvCol.id] = matchedField.id;
      }
    });

    setFieldMappings(mappings);
  };

  const handleMappingChange = (csvColumnId, systemFieldId) => {
    // Convert to number if it's a valid string number, otherwise keep as is
    const id = systemFieldId && systemFieldId !== '' ? (typeof systemFieldId === 'string' ? parseInt(systemFieldId, 10) : systemFieldId) : null;

    if (id) {
      setFieldMappings({
        ...fieldMappings,
        [csvColumnId]: id
      });
    } else {
      // Remove mapping if empty value selected
      const newMappings = { ...fieldMappings };
      delete newMappings[csvColumnId];
      setFieldMappings(newMappings);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xls') && !file.name.endsWith('.xlsx')) {
      setError('Please upload a CSV or Excel file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setCsvFile(file);

      if (file.name.endsWith('.csv')) {
        const parsed = await parseCSV(file);
        setCsvColumns(parsed.columns);
        setCsvData(parsed.csvData);
        // Calculate total users (excluding header row)
        const totalRows = parsed.csvData.length - 1; // Subtract header
        setTotalUsers(totalRows > 0 ? totalRows : 0);
      } else {
        setError('Excel files (.xls, .xlsx) are not yet supported. Please convert to CSV first.');
        setCsvFile(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to parse file');
      setCsvFile(null);
    } finally {
      setLoading(false);
    }
  };

  // Validate data and show validation results
  const handleContinueToPreview = async () => {
    // Check if required fields are mapped
    const mappedFieldKeys = Object.values(fieldMappings)
      .filter(mappedId => mappedId !== null && mappedId !== undefined && mappedId !== '')
      .map(mappedId => {
        const id = typeof mappedId === 'string' ? parseInt(mappedId, 10) : mappedId;
        if (isNaN(id)) return null;
        const mappedField = systemFields.find(sf => sf.id === id);
        return mappedField ? mappedField.field_key : null;
      })
      .filter(key => key && key !== 'skip');

    // Check for email
    const hasEmail = mappedFieldKeys.includes('email');
    // Check for phone_number
    const hasPhoneNumber = mappedFieldKeys.includes('phone_number');
    // Check for name fields: either (first_name AND last_name) OR full_name
    const hasFirstName = mappedFieldKeys.includes('first_name');
    const hasLastName = mappedFieldKeys.includes('last_name');
    const hasFullName = mappedFieldKeys.includes('full_name');
    const hasNameFields = (hasFirstName && hasLastName) || hasFullName;

    // Validate all required fields are mapped
    if (!hasEmail || !hasPhoneNumber || !hasNameFields) {
      const missingFields = [];
      if (!hasEmail) missingFields.push('Email Address');
      if (!hasPhoneNumber) missingFields.push('Phone Number');
      if (!hasNameFields) {
        if (!hasFullName && (!hasFirstName || !hasLastName)) {
          missingFields.push('Full Name (or both First Name and Last Name)');
        }
      }
      setError(`Please map all required fields. Missing: ${missingFields.join(', ')}`);
      return;
    }

    // Validate data by calling the import API (it will return validation results)
    if (!csvFile) {
      setError('Please upload a CSV file first');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = getAccessToken();

      // Build mapping configuration
      const mappingConfig = {};
      Object.keys(fieldMappings).forEach(csvIndex => {
        const systemFieldId = fieldMappings[csvIndex];
        const systemField = systemFields.find(sf => sf.id === systemFieldId);
        if (systemField && systemField.field_key !== 'skip') {
          mappingConfig[csvColumns[parseInt(csvIndex) - 1]?.column] = systemField.field_key;
        }
      });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('csv_file', csvFile);
      formData.append('mapping', JSON.stringify(mappingConfig));

      const url = `${API_BASE_URL}/taxpayer/firm-admin/clients/import/`;

      const response = await fetchWithCors(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Store validation results to show in Step 3
        setValidationResults(result.data);
        setCurrentStep(3);
      } else {
        throw new Error('Validation failed');
      }
    } catch (err) {
      console.error('Error validating data:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to validate data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle final import (after validation)
  const handleBulkImport = async () => {
    // The import is already done in validation step, just move to results
    if (validationResults) {
      setImportResults(validationResults);
      setCurrentStep(4);
    } else {
      setError('No validation results available. Please validate data first.');
    }
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
              style={{ borderColor: 'var(--Palette2-Dark-blue-100, #E8F0FF)', backgroundColor: '#F3F7FF' }}
            >
              <div className="text-blue-500 text-2xl mb-2"><Folder /></div>
              <div className="text-xs mb-3" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)', fontSize: '10px' }}>
                <p>Drop your file here or click to browse</p>
                <p>Supported formats: CSV, XLS, XLSX (Max 10MB)</p>
              </div>
              <label className="px-4 py-2 text-black text-sm transition flex items-center gap-2 cursor-pointer"
                style={{
                  border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)',
                  borderRadius: '8px'
                }}
              >
                <Browse /> Browse Files
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {csvFile && (
                <div className="mt-2 text-sm text-green-600 font-[BasisGrotesquePro]">
                  ✓ {csvFile.name}
                </div>
              )}
            </div>
          </div>

          {/* Download Template */}
          <div>
            <h6 className="taxdashboardr-titler mb-2 font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>Download Template</h6>
            <p className="text-sm mt-1 font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>
              Use our template to ensure your data is formatted correctly
            </p>
            <div className=" rounded-lg p-4 mb-4" style={{
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
                onClick={() => csvFile && csvColumns.length > 0 ? setCurrentStep(2) : setError('Please upload a CSV file first')}
                disabled={!csvFile || csvColumns.length === 0 || loading}
                className="px-5 py-2 text-white text-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#F56D2D',
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
              Match your CSV columns to the appropriate client fields. Required fields must be mapped.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mb-4 text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading...</p>
            </div>
          )}

          {/* Field Mapping Rows */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2 mb-6">
            {csvColumns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No CSV columns found. Please upload a CSV file.
              </div>
            ) : (
              csvColumns.map((csvCol) => (
                <div key={csvCol.id} className="flex items-center gap-3 p-3 rounded-lg !border border-[#E8F0FF]">
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
              ))
            )}
          </div>

          {/* Main Container Box */}
          <div className="p-6 rounded-lg border bg-[#F3F7FF] !border border-[#E8F0FF]">
            <h6 className="taxdashboardr-titler mb-2 text-base text-[#3B4A66] font-[BasisGrotesquePro] text-gray-900">
              Map CSV Columns to System Fields
            </h6>
            <p className="text-sm mb-4 font-[BasisGrotesquePro] text-gray-600">
              Match your CSV columns to the appropriate client fields. Required fields must be mapped.
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
                          <div className="flex items-center justify-center">
                            <svg width="15" height="15" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g clipPath="url(#clip0_3643_7681)">
                                <path d="M7.33317 3.69264V3.9993C7.33276 4.71811 7.1 5.41753 6.66962 5.99324C6.23923 6.56896 5.63427 6.99013 4.94496 7.19394C4.25565 7.39774 3.51892 7.37327 2.84466 7.12416C2.1704 6.87506 1.59472 6.41467 1.20349 5.81166C0.812259 5.20865 0.626434 4.49532 0.67373 3.77807C0.721025 3.06082 0.998906 2.37808 1.46593 1.83166C1.93295 1.28524 2.5641 0.904431 3.26523 0.746019C3.96637 0.587607 4.69993 0.660083 5.35651 0.952637M2.99984 3.66597L3.99984 4.66597L7.33317 1.33264" stroke="#22C55E" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
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
                          <div className="flex items-center justify-center">
                            <svg width="15" height="15" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g clipPath="url(#clip0_3643_7681)">
                                <path d="M7.33317 3.69264V3.9993C7.33276 4.71811 7.1 5.41753 6.66962 5.99324C6.23923 6.56896 5.63427 6.99013 4.94496 7.19394C4.25565 7.39774 3.51892 7.37327 2.84466 7.12416C2.1704 6.87506 1.59472 6.41467 1.20349 5.81166C0.812259 5.20865 0.626434 4.49532 0.67373 3.77807C0.721025 3.06082 0.998906 2.37808 1.46593 1.83166C1.93295 1.28524 2.5641 0.904431 3.26523 0.746019C3.96637 0.587607 4.69993 0.660083 5.35651 0.952637M2.99984 3.66597L3.99984 4.66597L7.33317 1.33264" stroke="#22C55E" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
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
              onClick={handleContinueToPreview}
              disabled={loading}
              className="px-5 py-2 text-white text-sm transition flex items-center gap-2 bg-[#F56D2D] !border border-[#F56D2D] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Validating...' : (
                <>
                  <span>Continue to Validation</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      // Get all validation results
      const allResults = validationResults?.validation_results ||
        validationResults?.results ||
        validationResults?.rows ||
        [];

      return (
        <div>
          {/* Data Validation Results */}
          <div className="mb-6">
            <h5 className="text-base font-bold text-[#3B4A66] mb-2 font-[BasisGrotesquePro]">Data Validation Results</h5>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
              Review the validation results and fix any errors before importing
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700 font-[BasisGrotesquePro]">
                {validationResults?.valid_count || validationResults?.successful_imports?.length || (allResults.filter(r => r.status === 'valid' || r.status === 'success' || (!r.errors && !r.status)).length) || 0}
              </div>
              <div className="text-sm text-green-700 font-[BasisGrotesquePro]">Valid Records</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700 font-[BasisGrotesquePro]">
                {validationResults?.error_count || validationResults?.failed_imports?.length || (allResults.filter(r => r.status === 'error' || r.errors?.length > 0).length) || 0}
              </div>
              <div className="text-sm text-red-700 font-[BasisGrotesquePro]">Errors</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700 font-[BasisGrotesquePro]">
                {validationResults?.duplicate_count || 0}
              </div>
              <div className="text-sm text-yellow-700 font-[BasisGrotesquePro]">Duplicates</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700 font-[BasisGrotesquePro]">
                {validationResults?.warning_count || validationResults?.warnings?.length || (allResults.filter(r => r.warnings?.length > 0).length) || 0}
              </div>
              <div className="text-sm text-blue-700 font-[BasisGrotesquePro]">Warnings</div>
            </div>
          </div>

          {/* Validation Table */}
          {allResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Row</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Office</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Issues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {allResults.map((result, index) => {
                      const isSuccess = result.status === 'valid' || result.status === 'success' || (!result.errors && !result.status);
                      const isError = result.status === 'error' || result.errors?.length > 0;
                      const isWarning = result.status === 'warning' || result.warnings?.length > 0;

                      // Get user data from different possible response structures
                      const userData = result.data || result.client || result || {};
                      const userName = userData.first_name && userData.last_name
                        ? `${userData.first_name} ${userData.last_name}`
                        : userData.full_name || userData.name || 'N/A';
                      const userEmail = userData.email || 'N/A';
                      const userType = userData.client_type || userData.type || userData.company_name || 'N/A';
                      const userOffice = userData.office_location || userData.office || userData.filing_year || 'N/A';

                      return (
                        <tr key={result.id || result.row_number || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-[BasisGrotesquePro]">
                            {result.row_number || index + 1}
                          </td>
                          <td className="px-4 py-3">
                            {isSuccess ? (
                              <svg width="15" height="15" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clipPath="url(#clip0_3643_8784)">
                                  <path d="M9.16634 4.61775V5.00108C9.16583 5.89959 8.87488 6.77386 8.3369 7.49351C7.79891 8.21315 7.04271 8.73961 6.18107 8.99437C5.31944 9.24913 4.39853 9.21854 3.5557 8.90716C2.71287 8.59578 1.99328 8.02029 1.50424 7.26653C1.0152 6.51276 0.782921 5.62111 0.84204 4.72455C0.901159 3.82798 1.24851 2.97455 1.83229 2.29153C2.41607 1.60851 3.205 1.13249 4.08142 0.934477C4.95784 0.736462 5.87479 0.827057 6.69551 1.19275M3.74968 4.58442L4.99968 5.83442L9.16634 1.66775" stroke="#22C55E" strokeLinecap="round" strokeLinejoin="round" />
                                </g>
                                <defs>
                                  <clipPath id="clip0_3643_8784">
                                    <rect width="10" height="10" fill="white" />
                                  </clipPath>
                                </defs>
                              </svg>
                            ) : isError ? (
                              <svg width="15" height="15" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="0.5" y="0.5" width="9" height="9" rx="4.5" stroke="#EF4444" />
                                <path d="M6.69441 3.74858C6.72427 3.71976 6.74809 3.68529 6.76449 3.64717C6.78088 3.60905 6.78952 3.56805 6.7899 3.52656C6.79028 3.48507 6.7824 3.44391 6.7667 3.4055C6.75101 3.36709 6.72782 3.33219 6.69849 3.30283C6.66916 3.27348 6.63428 3.25026 6.59589 3.23452C6.55749 3.21879 6.51634 3.21087 6.47485 3.21121C6.43336 3.21155 6.39235 3.22015 6.35421 3.23651C6.31608 3.25287 6.28158 3.27666 6.25274 3.30649L5.00024 4.55858L3.74816 3.30649C3.71955 3.27579 3.68505 3.25116 3.64672 3.23408C3.60838 3.217 3.567 3.20782 3.52504 3.20708C3.48308 3.20634 3.44141 3.21406 3.40249 3.22978C3.36358 3.24549 3.32823 3.26889 3.29856 3.29856C3.26889 3.32823 3.24549 3.36358 3.22978 3.40249C3.21406 3.44141 3.20634 3.48308 3.20708 3.52504C3.20782 3.567 3.217 3.60838 3.23408 3.64672C3.25116 3.68505 3.27579 3.71955 3.30649 3.74816L4.55774 5.00066L3.30566 6.25274C3.25046 6.31198 3.22041 6.39034 3.22184 6.47129C3.22327 6.55225 3.25606 6.6295 3.31332 6.68675C3.37057 6.74401 3.44782 6.7768 3.52878 6.77823C3.60973 6.77966 3.68809 6.74961 3.74733 6.69441L5.00024 5.44233L6.25233 6.69483C6.31157 6.75003 6.38992 6.78008 6.47088 6.77865C6.55184 6.77722 6.62908 6.74442 6.68634 6.68717C6.74359 6.62991 6.77639 6.55267 6.77782 6.47171C6.77924 6.39075 6.74919 6.3124 6.69399 6.25316L5.44274 5.00066L6.69441 3.74858Z" fill="#EF4444" />
                              </svg>
                            ) : (
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
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-[BasisGrotesquePro]">{userName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-[BasisGrotesquePro]">{userEmail}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-[BasisGrotesquePro]">{userType}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-[BasisGrotesquePro]">{userOffice}</td>
                          <td className="px-4 py-3">
                            {result.errors && result.errors.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {result.errors.map((error, errIndex) => (
                                  <div key={errIndex} className="flex items-center gap-2">
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
                                    <span className="text-xs font-[BasisGrotesquePro]" style={{ color: '#991B1B' }}>{error}</span>
                                  </div>
                                ))}
                              </div>
                            ) : result.warnings && result.warnings.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {result.warnings.map((warning, warnIndex) => (
                                  <div key={warnIndex} className="flex items-center gap-2">
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
                                    <span className="text-xs font-[BasisGrotesquePro]" style={{ color: '#991B1B' }}>{warning}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 font-[BasisGrotesquePro]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Button */}
          <div className="flex justify-end">
            <button
              onClick={handleBulkImport}
              disabled={loading || !validationResults || (validationResults.valid_count || 0) === 0}
              className="px-5 py-2 text-white text-sm transition flex items-center gap-2 bg-[#F56D2D] rounded-lg font-semibold font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Importing...' : (
                <span>Import {validationResults?.valid_count || validationResults?.successful_imports?.length || (allResults.filter(r => r.status === 'valid' || r.status === 'success' || (!r.errors && !r.status)).length) || 0} valid records</span>
              )}
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
            <h5 className="text-base font-bold text-[#3B4A66] mb-2 font-[BasisGrotesquePro]">Import Progress</h5>
            <p className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">Import Completed</p>
          </div>

          {/* Import Completed Content */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32.0827 16.1602V17.5018C32.0809 20.6466 31.0626 23.7066 29.1796 26.2253C27.2967 28.7441 24.65 30.5867 21.6342 31.4784C18.6185 32.37 15.3954 32.2629 12.4455 31.1731C9.49555 30.0833 6.97697 28.0691 5.26533 25.4309C3.5537 22.7927 2.74071 19.6719 2.94763 16.534C3.15454 13.396 4.37028 10.409 6.41351 8.0184C8.45674 5.62782 11.218 3.96177 14.2855 3.26872C17.3529 2.57566 20.5622 2.89274 23.4348 4.17267M13.1244 16.0435L17.4994 20.4185L32.0827 5.83517" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h4 className="text-2xl font-bold !text-[#32B582] mb-2 font-[BasisGrotesquePro]">Import Completed!</h4>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">The import has been completed successfully</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700 font-[BasisGrotesquePro]">
                {importResults?.valid_count || importResults?.successful_imports?.length || 0}
              </div>
              <div className="text-sm text-green-700 font-[BasisGrotesquePro]">Valid Records</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700 font-[BasisGrotesquePro]">
                {importResults?.error_count || importResults?.failed_imports?.length || 0}
              </div>
              <div className="text-sm text-red-700 font-[BasisGrotesquePro]">Errors</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700 font-[BasisGrotesquePro]">
                {importResults?.duplicate_count || 0}
              </div>
              <div className="text-sm text-yellow-700 font-[BasisGrotesquePro]">Duplicates</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700 font-[BasisGrotesquePro]">
                {importResults?.warning_count || importResults?.warnings?.length || 0}
              </div>
              <div className="text-sm text-blue-700 font-[BasisGrotesquePro]">Warnings</div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-5 py-2 text-white text-sm transition flex items-center gap-2 bg-[#F56D2D] rounded-lg font-semibold font-[BasisGrotesquePro]"
            >
              Close
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

          {/* Global Error Message */}
          {error && currentStep !== 3 && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
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
            { step: 3, label: "Preview" },
            { step: 4, label: "Import Results" },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center">
              <span
                className={`text-sm font-medium ${s.step <= currentStep ? "font-bold" : ""}`}
                style={s.step <= currentStep ? { color: '#F56D2D' } : { color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}
              >
                {s.step}. {s.label}
              </span>
              {i < 3 && (
                <span
                  style={s.step <= currentStep ? { color: '#F56D2D' } : { color: '#9CA3AF' }}
                  className="mx-2"
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
