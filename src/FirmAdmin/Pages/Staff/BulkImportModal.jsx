import React, { useState, useEffect, useCallback } from "react";
import { Browse, CrossesIcon, Folder } from "../../Components/icons";
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

export default function BulkImportModal({ isOpen, onClose, onOpenDownloadModal, onImportSuccess }) {
  const API_BASE_URL = getApiBaseUrl();
  const [currentStep, setCurrentStep] = useState(1);
  const [csvFile, setCsvFile] = useState(null);
  const [csvColumns, setCsvColumns] = useState([]);
  const [systemFields, setSystemFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationResults, setValidationResults] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [fieldMappings, setFieldMappings] = useState({});
  const [csvData, setCsvData] = useState(null);
  const [totalStaff, setTotalStaff] = useState(0);

  // Fetch system fields from API
  const fetchSystemFields = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = getAccessToken();
      // Using staff bulk import fields endpoint (assuming similar structure to clients)
      const url = `${API_BASE_URL}/firm/staff/bulk-import/fields/`;

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
      } else {
        // If API doesn't exist yet, use default staff fields
        const defaultFields = [
          { id: 1, name: "First Name*", required: true, field_key: 'first_name' },
          { id: 2, name: "Last Name*", required: true, field_key: 'last_name' },
          { id: 3, name: "Email Address*", required: true, field_key: 'email' },
          { id: 4, name: "Phone Number*", required: true, field_key: 'phone_number' },
          { id: 5, name: "Role*", required: true, field_key: 'role' },
          { id: 6, name: "Department", required: false, field_key: 'department' },
          { id: 7, name: "Employee ID", required: false, field_key: 'employee_id' },
          { id: 8, name: "Job Title", required: false, field_key: 'job_title' },
          { id: 9, name: "Status", required: false, field_key: 'status' },
          { id: 10, name: "Joining Date", required: false, field_key: 'joining_date' },
          { id: 11, name: "Location", required: false, field_key: 'location' },
          { id: 12, name: "Manager", required: false, field_key: 'manager' },
          { id: 13, name: "Tags (comma-separated)", required: false, field_key: 'tags' },
          { id: 14, name: "Skip this Column", required: false, field_key: 'skip' }
        ];
        setSystemFields(defaultFields);
      }
    } catch (err) {
      console.error('Error fetching system fields:', err);
      // Use default fields if API fails
      const defaultFields = [
        { id: 1, name: "First Name*", required: true, field_key: 'first_name' },
        { id: 2, name: "Last Name*", required: true, field_key: 'last_name' },
        { id: 3, name: "Email Address*", required: true, field_key: 'email' },
        { id: 4, name: "Phone Number*", required: true, field_key: 'phone_number' },
        { id: 5, name: "Role*", required: true, field_key: 'role' },
        { id: 6, name: "Department", required: false, field_key: 'department' },
        { id: 7, name: "Employee ID", required: false, field_key: 'employee_id' },
        { id: 8, name: "Job Title", required: false, field_key: 'job_title' },
        { id: 9, name: "Status", required: false, field_key: 'status' },
        { id: 10, name: "Joining Date", required: false, field_key: 'joining_date' },
        { id: 11, name: "Location", required: false, field_key: 'location' },
        { id: 12, name: "Manager", required: false, field_key: 'manager' },
        { id: 13, name: "Tags (comma-separated)", required: false, field_key: 'tags' },
        { id: 14, name: "Skip this Column", required: false, field_key: 'skip' }
      ];
      setSystemFields(defaultFields);
      // Don't show error if using defaults
      // const errorMsg = handleAPIError(err);
      // setError(errorMsg || 'Failed to load system fields. Using default fields.');
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
      setTotalStaff(0);
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

        // Common variations and aliases for staff
        const variations = {
          'first_name': ['first name', 'firstname', 'fname', 'first'],
          'last_name': ['last name', 'lastname', 'lname', 'last', 'surname'],
          'email': ['email', 'email address', 'e-mail', 'emailid'],
          'phone_number': ['phone', 'phone number', 'mobile', 'contact', 'telephone', 'tel'],
          'role': ['role', 'staff role', 'position'],
          'department': ['department', 'dept', 'division'],
          'employee_id': ['employee id', 'emp id', 'employee number', 'emp number'],
          'job_title': ['job title', 'title', 'position title'],
          'status': ['status', 'active status'],
          'joining_date': ['joining date', 'hire date', 'start date', 'date joined'],
          'location': ['location', 'office location', 'office'],
          'manager': ['manager', 'supervisor', 'reporting manager'],
          'tags': ['tags', 'tag', 'labels']
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
        // Calculate total staff (excluding header row)
        const totalRows = parsed.csvData.length - 1; // Subtract header
        setTotalStaff(totalRows > 0 ? totalRows : 0);
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

  // Preview import (validate data and show preview)
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

    // Check for required fields: first_name, last_name, email, phone_number, role
    const hasFirstName = mappedFieldKeys.includes('first_name');
    const hasLastName = mappedFieldKeys.includes('last_name');
    const hasEmail = mappedFieldKeys.includes('email');
    const hasPhoneNumber = mappedFieldKeys.includes('phone_number');
    const hasRole = mappedFieldKeys.includes('role');

    // Validate all required fields are mapped
    if (!hasFirstName || !hasLastName || !hasEmail || !hasPhoneNumber || !hasRole) {
      const missingFields = [];
      if (!hasFirstName) missingFields.push('First Name');
      if (!hasLastName) missingFields.push('Last Name');
      if (!hasEmail) missingFields.push('Email Address');
      if (!hasPhoneNumber) missingFields.push('Phone Number');
      if (!hasRole) missingFields.push('Role');
      setError(`Please map all required fields. Missing: ${missingFields.join(', ')}`);
      return;
    }

    // Preview data by calling the preview API
    if (!csvFile) {
      setError('Please upload a CSV file first');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = getAccessToken();

      // Build mapping configuration (CSV column name -> system field key)
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
      if (Object.keys(mappingConfig).length > 0) {
        formData.append('mapping', JSON.stringify(mappingConfig));
      }

      const url = `${API_BASE_URL}/firm/staff/bulk-import/preview/`;

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
        // Store preview results to show in Step 3
        setValidationResults(result.data);
        setCurrentStep(3);
      } else {
        throw new Error(result.message || 'Preview failed');
      }
    } catch (err) {
      console.error('Error previewing import:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to preview import. Please try again.');
      toast.error(errorMsg || 'Failed to preview import. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle final import (after preview)
  const handleBulkImport = async () => {
    if (!csvFile) {
      setError('Please upload a CSV file first');
      return;
    }

    if (!validationResults) {
      setError('No preview results available. Please preview data first.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = getAccessToken();

      // Build mapping configuration (same as preview)
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
      if (Object.keys(mappingConfig).length > 0) {
        formData.append('mapping', JSON.stringify(mappingConfig));
      }

      const url = `${API_BASE_URL}/firm/staff/bulk-import/`;

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
        // Store import results
        setImportResults(result.data);
        setCurrentStep(4);
        toast.success('Staff imported successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        // Trigger refresh callback if provided
        if (onImportSuccess) {
          onImportSuccess(result.data);
        }
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (err) {
      console.error('Error importing staff:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to import staff. Please try again.');
      toast.error(errorMsg || 'Failed to import staff. Please try again.');
    } finally {
      setLoading(false);
    }
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
              <label className="px-4 py-2 text-black text-sm transition flex items-center gap-2 cursor-pointer d-flex justify-center"
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
                  ✓ {csvFile.name} ({totalStaff} staff members)
                </div>
              )}
              {loading && (
                <div className="mt-2 text-sm text-gray-600 font-[BasisGrotesquePro]">
                  Processing file...
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

            {/* Continue to Mapping Button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => csvFile && csvColumns.length > 0 ? setCurrentStep(2) : setError('Please upload a CSV file first')}
                disabled={!csvFile || csvColumns.length === 0 || loading}
                className="px-5 py-2 text-white text-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
                style={{
                  backgroundColor: '#F56D2D',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                <span>Continue to Mapping</span>
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
              Mapping Summary
            </h6>
            <p className="text-sm mb-4 font-[BasisGrotesquePro] text-gray-600">
              Review your field mappings before proceeding
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

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setCurrentStep(1)}
              disabled={loading}
              className="px-5 py-2 text-gray-700 bg-white border border-gray-300 text-sm transition flex items-center gap-2 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <button
              onClick={handleContinueToPreview}
              disabled={loading}
              className="px-5 py-2 text-white text-sm transition flex items-center gap-2 bg-[#F56D2D] !border border-[#F56D2D] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
            >
              {loading ? 'Validating...' : (
                <>
                  <span>Continue to Preview</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      // Get preview rows from API response
      const previewRows = validationResults?.preview_rows || [];
      const summary = validationResults?.summary || {};

      return (
        <div>
          {/* Import Preview */}
          <div className="mb-6">
            <h5 className="text-base font-bold text-[#3B4A66] mb-2 font-[BasisGrotesquePro]">Import Preview</h5>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
              Review the preview results before importing. {validationResults?.message || ''}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700 font-[BasisGrotesquePro]">
                {summary.will_import_count || summary.valid_count || 0}
              </div>
              <div className="text-sm text-green-700 font-[BasisGrotesquePro]">Will Import</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700 font-[BasisGrotesquePro]">
                {summary.invalid_count || 0}
              </div>
              <div className="text-sm text-red-700 font-[BasisGrotesquePro]">Invalid</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700 font-[BasisGrotesquePro]">
                {summary.duplicate_count || 0}
              </div>
              <div className="text-sm text-yellow-700 font-[BasisGrotesquePro]">Duplicates</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700 font-[BasisGrotesquePro]">
                {summary.total_rows || 0}
              </div>
              <div className="text-sm text-blue-700 font-[BasisGrotesquePro]">Total Rows</div>
            </div>
          </div>

          {/* Preview Table */}
          {previewRows.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Row</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Issues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {previewRows.slice(0, 20).map((row, index) => {
                      const isSuccess = row.status === 'valid';
                      const isError = row.status === 'invalid';
                      const isDuplicate = row.status === 'duplicate';
                      const rowData = row.data || {};

                      const staffName = rowData.first_name && rowData.last_name
                        ? `${rowData.first_name} ${rowData.last_name}`
                        : 'N/A';
                      const staffEmail = rowData.email || 'N/A';
                      const staffPhone = rowData.phone_number || 'N/A';
                      const staffRole = rowData.role || 'N/A';

                      return (
                        <tr key={row.row || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-[BasisGrotesquePro]">
                            {row.row || index + 1}
                          </td>
                          <td className="px-4 py-3">
                            {isSuccess ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Valid
                              </span>
                            ) : isDuplicate ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Duplicate
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Invalid
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-[BasisGrotesquePro]">{staffName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-[BasisGrotesquePro]">{staffEmail}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-[BasisGrotesquePro]">{staffPhone}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-[BasisGrotesquePro]">{staffRole}</td>
                          <td className="px-4 py-3">
                            {row.errors && row.errors.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {row.errors.map((error, errIndex) => (
                                  <div key={errIndex} className="text-xs text-red-600 font-[BasisGrotesquePro]">
                                    {error}
                                  </div>
                                ))}
                              </div>
                            ) : row.warnings && row.warnings.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {row.warnings.map((warning, warnIndex) => (
                                  <div key={warnIndex} className="text-xs text-yellow-600 font-[BasisGrotesquePro]">
                                    {warning}
                                  </div>
                                ))}
                              </div>
                            ) : isDuplicate && row.existing_staff ? (
                              <div className="text-xs text-yellow-600 font-[BasisGrotesquePro]">
                                Already exists: {row.existing_staff.name}
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
              {previewRows.length > 20 && (
                <div className="px-4 py-2 text-sm text-gray-500 text-center font-[BasisGrotesquePro]">
                  Showing first 20 rows of {previewRows.length} total rows
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={loading}
              className="px-5 py-2 text-gray-700 bg-white border border-gray-300 text-sm transition flex items-center gap-2 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <button
              onClick={handleBulkImport}
              disabled={loading || !validationResults || (summary.will_import_count || summary.valid_count || 0) === 0}
              className="px-5 py-2 text-white text-sm transition flex items-center gap-2 bg-[#F56D2D] rounded-lg font-semibold font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Importing...' : (
                <span>Import {summary.will_import_count || summary.valid_count || 0} valid records</span>
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
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700 font-[BasisGrotesquePro]">
                {importResults?.success_count || importResults?.successful?.length || 0}
              </div>
              <div className="text-sm text-green-700 font-[BasisGrotesquePro]">Successful</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700 font-[BasisGrotesquePro]">
                {importResults?.failure_count || importResults?.failed?.length || 0}
              </div>
              <div className="text-sm text-red-700 font-[BasisGrotesquePro]">Failed</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700 font-[BasisGrotesquePro]">
                {importResults?.duplicate_count || importResults?.duplicates?.length || 0}
              </div>
              <div className="text-sm text-yellow-700 font-[BasisGrotesquePro]">Duplicates</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700 font-[BasisGrotesquePro]">
                {importResults?.total_rows || 0}
              </div>
              <div className="text-sm text-blue-700 font-[BasisGrotesquePro]">Total Rows</div>
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
                Import multiple staff members from CSV files with field mapping and validation
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
