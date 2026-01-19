import React, { useState, useEffect } from "react";
import { Browse, CrossesIcon, Folder } from "../../Components/icons";
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminClientsAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

export default function BulkTaxpayerImportModal({ isOpen, onClose, onImportSuccess }) {
  const API_BASE_URL = getApiBaseUrl();
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Preview, 3: Results
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [invitationTiming, setInvitationTiming] = useState('later'); // 'immediate' or 'later'
  const [invitationPreferences, setInvitationPreferences] = useState({}); // {row_index: true/false}
  const [sendingInvitations, setSendingInvitations] = useState(false);
  const [duplicateHandling, setDuplicateHandling] = useState({}); // {row_index: 'skip' | 'update' | 'import_as_new'}

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setCsvFile(null);
      setPreviewData(null);
      setSelectedRows([]);
      setImportResults(null);
      setInvitationTiming('later');
      setInvitationPreferences({});
      setDuplicateHandling({});
      setError('');
    }
  }, [isOpen]);

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (CSV or PDF)
    const isCSV = file.name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';
    const isPDF = file.name.endsWith('.pdf') || file.type === 'application/pdf';

    if (!isCSV && !isPDF) {
      setError('Please upload a CSV or PDF file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setCsvFile(file);
    setError('');
  };

  // Step 1: Upload CSV and get preview
  const handlePreview = async () => {
    if (!csvFile) {
      setError('Please upload a CSV file first');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await firmAdminClientsAPI.bulkImportTaxpayersPreview(csvFile);

      if (response.success && response.data) {
        setPreviewData(response.data);
        // Auto-select only valid rows that are NOT duplicates
        const validRowIndices = response.data.preview_data
          .filter((row, idx) => row.is_valid && !(row.existing_taxpayer && row.existing_taxpayer.exists))
          .map((row) => row.row_index);
        setSelectedRows(validRowIndices);

        // Initialize invitation preferences (default: false for all rows)
        const initialInvitationPrefs = {};
        const initialDuplicateHandling = {};
        response.data.preview_data.forEach(row => {
          if (row.is_valid && row.has_email) {
            initialInvitationPrefs[row.row_index] = false;
          }
          // Always skip duplicates
          if (row.existing_taxpayer && row.existing_taxpayer.exists) {
            initialDuplicateHandling[row.row_index] = 'skip';
          }
        });
        setInvitationPreferences(initialInvitationPrefs);
        setDuplicateHandling(initialDuplicateHandling);

        setCurrentStep(2);
      } else {
        throw new Error(response.message || 'Preview failed');
      }
    } catch (err) {
      console.error('Error previewing import:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to preview import. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle invitation preference for a row
  const toggleInvitationPreference = (rowIndex) => {
    setInvitationPreferences(prev => ({
      ...prev,
      [rowIndex]: !prev[rowIndex]
    }));
  };

  // Select all invitations for valid rows with email
  const selectAllInvitations = () => {
    if (!previewData) return;
    const newPrefs = { ...invitationPreferences };
    previewData.preview_data.forEach(row => {
      if (row.is_valid && row.has_email && selectedRows.includes(row.row_index)) {
        newPrefs[row.row_index] = true;
      }
    });
    setInvitationPreferences(newPrefs);
  };

  // Deselect all invitations
  const deselectAllInvitations = () => {
    const newPrefs = { ...invitationPreferences };
    Object.keys(newPrefs).forEach(key => {
      newPrefs[key] = false;
    });
    setInvitationPreferences(newPrefs);
  };


  // Step 2: Confirm and import selected rows
  const handleConfirmImport = async () => {
    if (!previewData || selectedRows.length === 0) {
      setError('Please select at least one row to import');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Build invitation options
      const invitationOptions = {
        invitation_timing: invitationTiming
      };

      if (invitationTiming === 'immediate') {
        // Get rows that should receive invitations
        const rowsToInvite = selectedRows.filter(rowIndex => {
          const row = previewData.preview_data.find(r => r.row_index === rowIndex);
          return row && row.is_valid && row.has_email && invitationPreferences[rowIndex] === true;
        });

        if (rowsToInvite.length > 0) {
          invitationOptions.rows_to_invite = rowsToInvite;
        }
      }

      // Build duplicate handling preferences - always skip duplicates
      const duplicateHandlingPrefs = {};
      selectedRows.forEach(rowIndex => {
        const row = previewData.preview_data.find(r => r.row_index === rowIndex);
        if (row && row.existing_taxpayer && row.existing_taxpayer.exists) {
          duplicateHandlingPrefs[rowIndex] = 'skip';
        }
      });

      if (Object.keys(duplicateHandlingPrefs).length > 0) {
        invitationOptions.duplicate_handling = duplicateHandlingPrefs;
      }

      const response = await firmAdminClientsAPI.bulkImportTaxpayersConfirm(
        previewData.import_log_id,
        selectedRows,
        invitationOptions
      );

      if (response.success && response.data) {
        setImportResults(response.data);
        setCurrentStep(3);

        // Check if there are any errors
        const hasErrors = (response.data.error_count && response.data.error_count > 0) ||
          (response.data.import_results && response.data.import_results.some(r => r.status === 'error'));

        if (hasErrors) {
          toast.warning(`Import completed with ${response.data.error_count || 0} error(s). Please review the errors before closing.`);
        } else {
          toast.success(`Successfully imported ${response.data.imported_count || 0} taxpayers`);
          // Only trigger refresh callback and close if there are no errors
          if (onImportSuccess) {
            onImportSuccess(response.data);
          }
        }
      } else {
        throw new Error(response.message || 'Import failed');
      }
    } catch (err) {
      console.error('Error importing taxpayers:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to import taxpayers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle row selection
  const toggleRowSelection = (rowIndex) => {
    setSelectedRows(prev => {
      if (prev.includes(rowIndex)) {
        return prev.filter(idx => idx !== rowIndex);
      } else {
        return [...prev, rowIndex];
      }
    });
  };

  // Select all valid rows (excluding duplicates)
  const selectAllValid = () => {
    if (!previewData) return;
    const validRowIndices = previewData.preview_data
      .filter(row => row.is_valid && !(row.existing_taxpayer && row.existing_taxpayer.exists))
      .map(row => row.row_index);
    setSelectedRows(validRowIndices);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedRows([]);
  };

  // Send invitations manually (after import)
  const handleSendInvitations = async () => {
    if (!importResults || !previewData) {
      setError('No import data available');
      return;
    }

    try {
      setSendingInvitations(true);
      setError('');

      // Get taxpayer IDs from import results that have email but no invitation sent
      const taxpayerIdsToInvite = importResults.import_results
        .filter(result =>
          result.status === 'imported' &&
          result.email &&
          !result.invitation_sent &&
          result.taxpayer_id
        )
        .map(result => result.taxpayer_id);

      if (taxpayerIdsToInvite.length === 0) {
        setError('No taxpayers available for invitation (all may have already received invitations)');
        return;
      }

      const response = await firmAdminClientsAPI.bulkImportTaxpayersSendInvitations(
        previewData.import_log_id,
        { taxpayer_ids: taxpayerIdsToInvite }
      );

      if (response.success && response.data) {
        toast.success(`Successfully sent ${response.data.sent_count || 0} invitations`);
        // Refresh import results to show updated invitation status
        // You might want to refetch the import results here
        if (onImportSuccess) {
          onImportSuccess(response.data);
        }
      } else {
        throw new Error(response.message || 'Failed to send invitations');
      }
    } catch (err) {
      console.error('Error sending invitations:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to send invitations. Please try again.');
    } finally {
      setSendingInvitations(false);
    }
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Upload CSV File */}
          <div>
            <h6 className="taxdashboardr-titler mb-2 font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>Upload File (CSV or PDF)</h6>
            <div
              className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center"
              style={{ borderColor: 'var(--Palette2-Dark-blue-100, #E8F0FF)', backgroundColor: '#F3F7FF' }}
            >
              <div className="text-blue-500 text-2xl mb-2"><Folder /></div>
              <div className="text-xs mb-3" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)', fontSize: '10px' }}>
                <p>Drop your file here or click to browse</p>
                <p>Supported formats: CSV, PDF (Max 10MB)</p>
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
                  accept=".csv,.pdf"
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

          {/* Instructions */}
          <div>
            <h6 className="taxdashboardr-titler mb-2 font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>Instructions</h6>
            <div className=" rounded-lg p-4 mb-4" style={{
              backgroundColor: 'var(--Palette2-Dark-blue-100, #E8F0FF)',
              border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)',
              color: 'var(--Palette2-Dark-blue-900, #3B4A66)',
              fontSize: '12px'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>CSV Format:</h4>
              <div className="flex flex-col space-y-1" style={{ fontSize: '12px' }}>
                <div>• Supported formats: CSV and PDF files</div>
                <div>• CSV: Include headers: First Name, Last Name, Email, Phone, SSN / ITIN (Tax ID), etc.</div>
                <div>• PDF: System will extract data using OCR</div>
                <div>• System will auto-detect column mapping</div>
                <div>• Required fields: First Name, Last Name, SSN / ITIN (Tax ID)</div>
                <div>• Optional fields: Email, Phone, Address, City, State, ZIP</div>
              </div>
            </div>

            {/* Continue to Preview Button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={handlePreview}
                disabled={!csvFile || loading}
                className="px-5 py-2 text-white text-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
                style={{
                  backgroundColor: '#F56D2D',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                {loading ? 'Processing...' : (
                  <>
                    <span>Continue to Preview</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 2 && previewData) {
      const { total_rows, valid_rows, error_rows, preview_data, error_summary } = previewData;

      // Calculate duplicate counts
      const existing_taxpayers_count = preview_data?.filter(row => row.existing_taxpayer && row.existing_taxpayer.exists).length || 0;
      const existing_in_firm_count = preview_data?.filter(row => {
        const existingTaxpayer = row.existing_taxpayer;
        return existingTaxpayer && existingTaxpayer.exists &&
          (existingTaxpayer.match_type === 'email_and_firm' || existingTaxpayer.match_type === 'ssn_and_firm');
      }).length || 0;

      // Calculate valid non-duplicate rows count
      const validNonDuplicateRowsCount = preview_data?.filter(row =>
        row.is_valid && !(row.existing_taxpayer && row.existing_taxpayer.exists)
      ).length || 0;

      return (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700 font-[BasisGrotesquePro]">
                {valid_rows || 0}
              </div>
              <div className="text-sm text-green-700 font-[BasisGrotesquePro]">Valid Rows</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700 font-[BasisGrotesquePro]">
                {error_rows || 0}
              </div>
              <div className="text-sm text-red-700 font-[BasisGrotesquePro]">Error Rows</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-700 font-[BasisGrotesquePro]">
                {existing_taxpayers_count || 0}
              </div>
              <div className="text-sm text-orange-700 font-[BasisGrotesquePro]">Duplicates Found</div>
              {existing_taxpayers_count > 0 && (
                <div className="text-xs text-orange-600 mt-1 font-[BasisGrotesquePro]">
                  {existing_in_firm_count || 0} in this firm
                </div>
              )}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700 font-[BasisGrotesquePro]">
                {error_summary?.total_warnings || 0}
              </div>
              <div className="text-sm text-yellow-700 font-[BasisGrotesquePro]">Warnings</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700 font-[BasisGrotesquePro]">
                {total_rows || 0}
              </div>
              <div className="text-sm text-blue-700 font-[BasisGrotesquePro]">Total Rows</div>
            </div>
          </div>

          {/* Error Summary */}
          {error_summary && (error_summary.blocking_errors?.length > 0 || error_summary.warnings?.length > 0) && (
            <div className="mb-6">
              {error_summary.blocking_errors?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                  <h6 className="text-sm font-semibold text-red-700 mb-2 font-[BasisGrotesquePro]">
                    Blocking Errors ({error_summary.total_blocking_errors || 0})
                  </h6>
                  <ul className="list-disc list-inside space-y-1">
                    {error_summary.blocking_errors.slice(0, 5).map((err, idx) => (
                      <li key={idx} className="text-xs text-red-600 font-[BasisGrotesquePro]">{err}</li>
                    ))}
                    {error_summary.blocking_errors.length > 5 && (
                      <li className="text-xs text-red-600 font-[BasisGrotesquePro]">
                        ... and {error_summary.blocking_errors.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {error_summary.warnings?.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h6 className="text-sm font-semibold text-yellow-700 mb-2 font-[BasisGrotesquePro]">
                    Warnings ({error_summary.total_warnings || 0})
                  </h6>
                  <ul className="list-disc list-inside space-y-1">
                    {error_summary.warnings.slice(0, 5).map((warn, idx) => (
                      <li key={idx} className="text-xs text-yellow-600 font-[BasisGrotesquePro]">{warn}</li>
                    ))}
                    {error_summary.warnings.length > 5 && (
                      <li className="text-xs text-yellow-600 font-[BasisGrotesquePro]">
                        ... and {error_summary.warnings.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Duplicate Info */}
          {existing_taxpayers_count > 0 && (
            <div className="mb-4 p-4 rounded-lg border" style={{ backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }}>
              <div className="flex items-center gap-2">
                <span className="text-orange-600">⚠️</span>
                <p className="text-xs text-orange-700 font-[BasisGrotesquePro]">
                  {existing_taxpayers_count} duplicate(s) found ({existing_in_firm_count || 0} in this firm). Duplicates will be automatically skipped and not imported.
                </p>
              </div>
            </div>
          )}

          {/* Selection Controls */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button
                onClick={selectAllValid}
                disabled={validNonDuplicateRowsCount === 0}
                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select All Valid
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro]"
              >
                Deselect All
              </button>
            </div>
            <div className="text-sm text-gray-600 font-[BasisGrotesquePro]">
              {selectedRows.length} of {validNonDuplicateRowsCount || 0} valid rows selected (duplicates excluded)
            </div>
          </div>

          {/* Message when all rows are duplicates */}
          {validNonDuplicateRowsCount === 0 && valid_rows > 0 && (
            <div className="mb-4 p-4 rounded-lg border bg-orange-50 border-orange-200">
              <div className="flex items-start gap-3">
                <div className="text-orange-600 text-xl">⚠️</div>
                <div className="flex-1">
                  <h6 className="text-sm font-semibold text-orange-800 mb-1 font-[BasisGrotesquePro]">
                    All Valid Rows Are Duplicates
                  </h6>
                  <p className="text-xs text-orange-700 font-[BasisGrotesquePro]">
                    All {valid_rows} valid row(s) in this import are duplicates that already exist in your firm.
                    No rows have been selected for import. If you want to update existing records, you can manually select individual duplicate rows below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro] w-12">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === validNonDuplicateRowsCount && validNonDuplicateRowsCount > 0}
                        onChange={(e) => e.target.checked ? selectAllValid() : deselectAll()}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Row</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">SSN / ITIN (Tax ID)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Duplicate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Invite</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {preview_data.slice(0, 50).map((row) => {
                    const isSelected = selectedRows.includes(row.row_index);
                    const existingTaxpayer = row.existing_taxpayer;
                    const hasDuplicate = existingTaxpayer && existingTaxpayer.exists;
                    const isDuplicateInFirm = hasDuplicate && (existingTaxpayer.match_type === 'email_and_firm' || existingTaxpayer.match_type === 'ssn_and_firm');
                    // Disable selection for invalid rows or duplicates
                    const isDisabled = !row.is_valid || hasDuplicate;
                    const hasEmail = row.has_email !== false && row.data?.email;
                    const canInvite = isSelected && !isDisabled && hasEmail;
                    const isInviteChecked = invitationPreferences[row.row_index] === true;
                    const rowData = row.data || {};
                    const userName = `${rowData.first_name || ''} ${rowData.last_name || ''}`.trim() || 'N/A';
                    const userEmail = rowData.email || 'N/A';
                    const userPhone = rowData.phone || 'N/A';
                    const userSSN = rowData.ssn || 'N/A';

                    return (
                      <tr
                        key={row.row_index}
                        className={`hover:bg-gray-50 ${isDisabled ? 'opacity-50' : ''} ${hasDuplicate ? (isDuplicateInFirm ? 'bg-orange-50' : 'bg-yellow-50') : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => !isDisabled && toggleRowSelection(row.row_index)}
                            disabled={isDisabled}
                            className="rounded"
                            title={hasDuplicate ? 'Duplicates cannot be selected for import' : isDisabled ? 'Invalid row cannot be selected' : 'Select row for import'}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-[BasisGrotesquePro]">
                          {row.row_index + 1}
                        </td>
                        <td className="px-4 py-3">
                          {row.is_valid ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Error
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-[BasisGrotesquePro]">{userName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-[BasisGrotesquePro]">{userEmail}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-[BasisGrotesquePro]">{userPhone}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-[BasisGrotesquePro]">{userSSN}</td>
                        <td className="px-4 py-3">
                          {hasDuplicate ? (
                            <div className="flex flex-col gap-1">
                              {isDuplicateInFirm ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800" title={existingTaxpayer.message}>
                                  ⚠️ Duplicate (Will Skip)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800" title={existingTaxpayer.message}>
                                  ℹ️ Exists Elsewhere (Will Skip)
                                </span>
                              )}
                              {existingTaxpayer.user_id && (
                                <div className="text-xs text-gray-600 font-[BasisGrotesquePro]" title={existingTaxpayer.message}>
                                  ID: {existingTaxpayer.user_id}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-[BasisGrotesquePro]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {hasEmail ? (
                            <input
                              type="checkbox"
                              checked={isInviteChecked}
                              onChange={() => toggleInvitationPreference(row.row_index)}
                              disabled={!canInvite || invitationTiming === 'later'}
                              className="rounded"
                              title={!canInvite ? 'Select row to enable invitation' : invitationTiming === 'later' ? 'Set invitation timing to immediate' : 'Send invitation'}
                            />
                          ) : (
                            <span className="text-xs text-gray-400 font-[BasisGrotesquePro]">No email</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.blocking_errors && row.blocking_errors.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {row.blocking_errors.map((err, errIndex) => (
                                <div key={errIndex} className="text-xs text-red-600 font-[BasisGrotesquePro]">
                                  {err}
                                </div>
                              ))}
                            </div>
                          ) : row.warnings && row.warnings.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {row.warnings.map((warn, warnIndex) => (
                                <div key={warnIndex} className="text-xs text-yellow-600 font-[BasisGrotesquePro]">
                                  {warn}
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
            {preview_data.length > 50 && (
              <div className="px-4 py-2 text-sm text-gray-500 text-center font-[BasisGrotesquePro]">
                Showing first 50 rows of {preview_data.length} total rows
              </div>
            )}
          </div>

          {/* Invitation Timing Selection */}
          <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: '#F3F7FF', borderColor: '#E8F0FF' }}>
            <h6 className="text-sm font-semibold text-[#3B4A66] mb-3 font-[BasisGrotesquePro]">Invitation Settings</h6>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="invite-later"
                  name="invitation-timing"
                  value="later"
                  checked={invitationTiming === 'later'}
                  onChange={(e) => setInvitationTiming(e.target.value)}
                  className="w-4 h-4"
                />
                <label htmlFor="invite-later" className="text-sm text-[#3B4A66] font-[BasisGrotesquePro] cursor-pointer">
                  Send invitations later (manual)
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="invite-immediate"
                  name="invitation-timing"
                  value="immediate"
                  checked={invitationTiming === 'immediate'}
                  onChange={(e) => setInvitationTiming(e.target.value)}
                  className="w-4 h-4"
                />
                <label htmlFor="invite-immediate" className="text-sm text-[#3B4A66] font-[BasisGrotesquePro] cursor-pointer">
                  Send invitations immediately
                </label>
              </div>
              {invitationTiming === 'immediate' && (
                <div className="ml-7 mt-2">
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={selectAllInvitations}
                      className="px-3 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro]"
                    >
                      Select All Invitations
                    </button>
                    <button
                      onClick={deselectAllInvitations}
                      className="px-3 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro]"
                    >
                      Deselect All
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 font-[BasisGrotesquePro]">
                    {Object.values(invitationPreferences).filter(v => v === true).length} invitation(s) will be sent to selected taxpayers with email addresses
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentStep(1)}
              disabled={loading}
              className="px-5 py-2 text-gray-700 bg-white border border-gray-300 text-sm transition flex items-center gap-2 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={loading || selectedRows.length === 0}
              className="px-5 py-2 text-white text-sm transition flex items-center gap-2 bg-[#F56D2D] rounded-lg font-semibold font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Importing...' : (
                <span>Import {selectedRows.length} Selected Taxpayers</span>
              )}
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === 3 && importResults) {
      // Check if there are errors in import results
      const hasErrors = (importResults.error_count && importResults.error_count > 0) ||
        (importResults.import_results && importResults.import_results.some(r => r.status === 'error'));

      return (
        <div>
          {/* Import Completed */}
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
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700 font-[BasisGrotesquePro]">
                {importResults.imported_count || 0}
              </div>
              <div className="text-sm text-green-700 font-[BasisGrotesquePro]">Imported</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700 font-[BasisGrotesquePro]">
                {importResults.skipped_count || 0}
              </div>
              <div className="text-sm text-yellow-700 font-[BasisGrotesquePro]">Skipped</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700 font-[BasisGrotesquePro]">
                {importResults.error_count || 0}
              </div>
              <div className="text-sm text-red-700 font-[BasisGrotesquePro]">Errors</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-700 font-[BasisGrotesquePro]">
                {importResults.invitations_sent || 0}
              </div>
              <div className="text-sm text-purple-700 font-[BasisGrotesquePro]">Invitations Sent</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700 font-[BasisGrotesquePro]">
                {importResults.import_results?.length || 0}
              </div>
              <div className="text-sm text-blue-700 font-[BasisGrotesquePro]">Total Processed</div>
            </div>
          </div>

          {/* Import Results Table */}
          {importResults.import_results && importResults.import_results.length > 0 && (
            <div className="mb-6">
              <h6 className="text-sm font-semibold text-gray-900 mb-2 font-[BasisGrotesquePro]">Import Results</h6>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Row</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Phone</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Taxpayer ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Invitation</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Error Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {importResults.import_results.slice(0, 20).map((result, idx) => {
                        // Use data from API response (new structure) or fallback to preview data
                        const userName = result.taxpayer_name ||
                          (result.first_name && result.last_name ? `${result.first_name} ${result.last_name}` : null) ||
                          (previewData?.preview_data?.find(r => r.row_index === result.row_index)?.data ?
                            `${previewData.preview_data.find(r => r.row_index === result.row_index).data.first_name || ''} ${previewData.preview_data.find(r => r.row_index === result.row_index).data.last_name || ''}`.trim() : null) ||
                          'N/A';
                        const userEmail = result.email ||
                          (previewData?.preview_data?.find(r => r.row_index === result.row_index)?.data?.email) ||
                          'N/A';
                        const userPhone = result.phone ||
                          (previewData?.preview_data?.find(r => r.row_index === result.row_index)?.data?.phone) ||
                          'N/A';
                        const ssnDisplay = result.ssn_display ||
                          (previewData?.preview_data?.find(r => r.row_index === result.row_index)?.data?.ssn) ||
                          '-';
                        // Use details if available, otherwise use message
                        const errorMessage = result.details || result.message || '-';

                        return (
                          <tr key={idx} className={`hover:bg-gray-50 ${result.status === 'error' ? 'bg-red-50' : ''}`}>
                            <td className="px-4 py-2 text-gray-900 font-[BasisGrotesquePro]">{result.row_index + 1}</td>
                            <td className="px-4 py-2 text-gray-900 font-[BasisGrotesquePro] font-medium">{userName}</td>
                            <td className="px-4 py-2 text-gray-900 font-[BasisGrotesquePro]">{userEmail}</td>
                            <td className="px-4 py-2 text-gray-900 font-[BasisGrotesquePro]">{userPhone}</td>
                            <td className="px-4 py-2">
                              {result.status === 'imported' ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Imported
                                </span>
                              ) : result.status === 'skipped' ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Skipped
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Error
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-gray-900 font-[BasisGrotesquePro]">{result.taxpayer_id || '-'}</td>
                            <td className="px-4 py-2">
                              {result.invitation_sent ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Sent
                                </span>
                              ) : result.email && result.status === 'imported' ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  Not Sent
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 font-[BasisGrotesquePro]">-</span>
                              )}
                              {result.invitation_error && (
                                <div className="text-xs text-red-600 mt-1 font-[BasisGrotesquePro]">
                                  {result.invitation_error}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {errorMessage && errorMessage !== '-' ? (
                                <div className="text-red-700 font-[BasisGrotesquePro] font-medium">
                                  {errorMessage}
                                </div>
                              ) : (
                                <span className="text-gray-400 font-[BasisGrotesquePro]">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {importResults.import_results.length > 20 && (
                  <div className="px-4 py-2 text-xs text-gray-500 text-center font-[BasisGrotesquePro]">
                    Showing first 20 of {importResults.import_results.length} results
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6">
            {/* Send Invitations Button (if there are imported taxpayers without invitations) */}
            {importResults.import_results && importResults.import_results.some(r =>
              r.status === 'imported' && r.email && !r.invitation_sent && r.taxpayer_id
            ) && (
                <button
                  onClick={handleSendInvitations}
                  disabled={sendingInvitations}
                  className="px-5 py-2 text-white text-sm transition flex items-center gap-2 bg-[#32B582] rounded-lg font-semibold font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingInvitations ? 'Sending...' : (
                    <>
                      <span>Send Invitations to Remaining Taxpayers</span>
                    </>
                  )}
                </button>
              )}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={onClose}
                className="px-5 py-2 text-white text-sm transition flex items-center gap-2 bg-[#F56D2D] rounded-lg font-semibold font-[BasisGrotesquePro]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Check if there are errors in import results
  const hasErrors = importResults && (
    (importResults.error_count && importResults.error_count > 0) ||
    (importResults.import_results && importResults.import_results.some(r => r.status === 'error'))
  );

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
              <h4 className="taxdashboardr-titler text-[22px] font-bold font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>Bulk Import Taxpayers</h4>
              <p className="text-sm mt-1 font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>
                Import multiple taxpayers from CSV file with validation and preview
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
          {error && (
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
            { step: 1, label: "Upload CSV" },
            { step: 2, label: "Preview & Select" },
            { step: 3, label: "Results" },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center">
              <span
                className={`text-sm font-medium ${s.step <= currentStep ? "font-bold" : ""}`}
                style={s.step <= currentStep ? { color: '#F56D2D' } : { color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}
              >
                {s.step}. {s.label}
              </span>
              {i < 2 && (
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

