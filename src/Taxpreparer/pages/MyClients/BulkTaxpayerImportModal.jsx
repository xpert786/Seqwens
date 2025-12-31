import React, { useState, useEffect } from "react";
import { Browse, CrossesIcon, Folder } from "../../../FirmAdmin/Components/icons";
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, taxPreparerClientAPI } from '../../../ClientOnboarding/utils/apiUtils';
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

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setCsvFile(null);
      setPreviewData(null);
      setSelectedRows([]);
      setImportResults(null);
      setError('');
    }
  }, [isOpen]);

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a CSV file');
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

      const response = await taxPreparerClientAPI.bulkImportTaxpayersPreview(csvFile);

      if (response.success && response.data) {
        setPreviewData(response.data);
        // Auto-select all valid rows
        const validRowIndices = response.data.preview_data
          .filter((row, idx) => row.is_valid)
          .map((row) => row.row_index);
        setSelectedRows(validRowIndices);
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

  // Step 2: Confirm and import selected rows
  const handleConfirmImport = async () => {
    if (!previewData || selectedRows.length === 0) {
      setError('Please select at least one row to import');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await taxPreparerClientAPI.bulkImportTaxpayersConfirm(
        previewData.import_log_id,
        selectedRows
      );

      if (response.success && response.data) {
        setImportResults(response.data);
        setCurrentStep(3);
        toast.success(`Successfully imported ${response.data.imported_count || 0} taxpayers`);
        
        // Trigger refresh callback if provided
        if (onImportSuccess) {
          onImportSuccess(response.data);
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

  // Select all valid rows
  const selectAllValid = () => {
    if (!previewData) return;
    const validRowIndices = previewData.preview_data
      .filter(row => row.is_valid)
      .map(row => row.row_index);
    setSelectedRows(validRowIndices);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedRows([]);
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Upload CSV File */}
          <div>
            <h6 className="taxdashboardr-titler mb-2 font-[BasisGrotesquePro]" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}>Upload CSV File</h6>
            <div
              className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center"
              style={{ borderColor: 'var(--Palette2-Dark-blue-100, #E8F0FF)', backgroundColor: '#F3F7FF' }}
            >
              <div className="text-blue-500 text-2xl mb-2"><Folder /></div>
              <div className="text-xs mb-3" style={{ color: 'var(--Palette2-Dark-blue-900, #3B4A66)', fontSize: '10px' }}>
                <p>Drop your CSV file here or click to browse</p>
                <p>Supported format: CSV (Max 10MB)</p>
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
                  accept=".csv"
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
                <div>• Include headers: First Name, Last Name, Email, Phone, SSN, etc.</div>
                <div>• System will auto-detect column mapping</div>
                <div>• Required fields: First Name, Last Name, SSN/ITIN</div>
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

      return (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
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

          {/* Selection Controls */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button
                onClick={selectAllValid}
                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro]"
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
              {selectedRows.length} of {valid_rows || 0} valid rows selected
            </div>
          </div>

          {/* Preview Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro] w-12">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === valid_rows && valid_rows > 0}
                        onChange={(e) => e.target.checked ? selectAllValid() : deselectAll()}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Row</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">SSN</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {preview_data.slice(0, 50).map((row) => {
                    const isSelected = selectedRows.includes(row.row_index);
                    const isDisabled = !row.is_valid;
                    const rowData = row.data || {};
                    const userName = `${rowData.first_name || ''} ${rowData.last_name || ''}`.trim() || 'N/A';
                    const userEmail = rowData.email || 'N/A';
                    const userPhone = rowData.phone || 'N/A';
                    const userSSN = rowData.ssn || 'N/A';

                    return (
                      <tr 
                        key={row.row_index} 
                        className={`hover:bg-gray-50 ${isDisabled ? 'opacity-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => !isDisabled && toggleRowSelection(row.row_index)}
                            disabled={isDisabled}
                            className="rounded"
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
          <div className="grid grid-cols-4 gap-4 mb-6">
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Taxpayer ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase font-[BasisGrotesquePro]">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {importResults.import_results.slice(0, 20).map((result, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-900 font-[BasisGrotesquePro]">{result.row_index + 1}</td>
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
                          <td className="px-4 py-2 text-gray-900 font-[BasisGrotesquePro]">{result.email || 'N/A'}</td>
                          <td className="px-4 py-2 text-gray-900 font-[BasisGrotesquePro]">{result.taxpayer_id || '-'}</td>
                          <td className="px-4 py-2 text-gray-900 font-[BasisGrotesquePro]">{result.message || '-'}</td>
                        </tr>
                      ))}
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

