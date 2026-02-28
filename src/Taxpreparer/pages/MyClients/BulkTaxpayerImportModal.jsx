import React, { useState, useEffect, useCallback } from "react";
import { IoMdClose } from "react-icons/io";
import { Browse, Folder } from "../../../FirmAdmin/Components/icons";
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, taxPreparerClientAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import sampleCsv from '../../../assets/sample_taxpayer_import.csv?url';
import samplePdf from '../../../assets/sample_taxpayer_import.pdf?url';

// ─── Pill helper ────────────────────────────────────────────────────────────
const Pill = ({ children, color = "gray" }) => {
  const colors = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    orange: "bg-orange-100 text-orange-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-600",
    purple: "bg-purple-100 text-purple-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-[BasisGrotesquePro] ${colors[color]}`}>
      {children}
    </span>
  );
};

// ─── Collapsible error list ─────────────────────────────────────────────────
const CollapsibleList = ({ items = [], color = "red", initialShow = 5, label = "issue" }) => {
  const [expanded, setExpanded] = useState(false);
  if (!items.length) return null;
  const shown = expanded ? items : items.slice(0, initialShow);
  const rest = items.length - initialShow;
  return (
    <div>
      <ul className="list-disc list-inside space-y-0.5">
        {shown.map((item, i) => (
          <li key={i} className={`text-xs text-${color}-600 font-[BasisGrotesquePro]`}>{item}</li>
        ))}
      </ul>
      {items.length > initialShow && (
        <button
          onClick={() => setExpanded(e => !e)}
          className={`mt-1 text-xs text-${color}-700 underline font-[BasisGrotesquePro] hover:no-underline`}
        >
          {expanded ? "Show less" : `+ ${rest} more ${label}${rest !== 1 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
};

// ─── Expandable row detail panel ────────────────────────────────────────────
const RowDetail = ({ row }) => {
  const d = row.data || {};
  const fields = [
    { label: "First Name", value: d.first_name },
    { label: "Middle Name", value: d.middle_name },
    { label: "Last Name", value: d.last_name },
    { label: "Suffix", value: d.suffix },
    { label: "Email", value: d.email },
    { label: "Phone", value: d.phone },
    { label: "Alt Phone", value: d.alternate_phone },
    { label: "SSN / ITIN", value: d.ssn ? `***-**-${String(d.ssn).slice(-4)}` : undefined },
    { label: "DOB", value: d.date_of_birth },
    { label: "Street", value: d.street_address },
    { label: "Apt / Unit", value: d.apartment_unit },
    { label: "City", value: d.city },
    { label: "State", value: d.state },
    { label: "ZIP", value: d.zip_code },
    { label: "Country", value: d.country },
    { label: "Filing Status", value: d.filing_status },
    { label: "Spouse First", value: d.spouse_first_name },
    { label: "Spouse Last", value: d.spouse_last_name },
    { label: "Spouse SSN", value: d.spouse_ssn ? `***-**-${String(d.spouse_ssn).slice(-4)}` : undefined },
    { label: "Prior-Year ID", value: d.prior_year_client_id },
    { label: "Internal Notes", value: d.internal_notes },
    { label: "Office", value: d.office_location },
    { label: "Client Status", value: d.client_status },
    { label: "Tags", value: Array.isArray(d.client_tags) ? d.client_tags.join(", ") : d.client_tags },
    { label: "Tax Preparer", value: d.assigned_tax_preparer },
  ].filter(f => f.value);

  return (
    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <span className="text-[10px] text-gray-500 uppercase font-[BasisGrotesquePro]">{label}</span>
            <div className="text-xs text-gray-800 font-[BasisGrotesquePro] truncate">{value}</div>
          </div>
        ))}
      </div>
      {row.blocking_errors?.length > 0 && (
        <div className="mt-2">
          <span className="text-[10px] text-red-500 uppercase font-[BasisGrotesquePro]">Blocking Errors</span>
          <ul className="list-disc list-inside">
            {row.blocking_errors.map((e, i) => <li key={i} className="text-xs text-red-600 font-[BasisGrotesquePro]">{e}</li>)}
          </ul>
        </div>
      )}
      {row.warnings?.length > 0 && (
        <div className="mt-2">
          <span className="text-[10px] text-yellow-500 uppercase font-[BasisGrotesquePro]">Warnings</span>
          <ul className="list-disc list-inside">
            {row.warnings.map((w, i) => <li key={i} className="text-xs text-yellow-600 font-[BasisGrotesquePro]">{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default function BulkTaxpayerImportModal({ isOpen, onClose, onImportSuccess }) {
  const API_BASE_URL = getApiBaseUrl();
  const [currentStep, setCurrentStep] = useState(1);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [invitationTiming, setInvitationTiming] = useState('later');
  const [invitationPreferences, setInvitationPreferences] = useState({});
  const [sendingInvitations, setSendingInvitations] = useState(false);
  const [duplicateHandling, setDuplicateHandling] = useState({});
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [rowFilter, setRowFilter] = useState('all'); // all | errors | warnings | valid
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [errorSectionExpanded, setErrorSectionExpanded] = useState(true);
  const [warnSectionExpanded, setWarnSectionExpanded] = useState(false);

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
      setExpandedRows(new Set());
      setRowFilter('all');
    }
  }, [isOpen]);

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isCSV = file.name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';
    const isPDF = file.name.endsWith('.pdf') || file.type === 'application/pdf';
    if (!isCSV && !isPDF) { setError('Please upload a CSV or PDF file'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File size must be less than 10MB'); return; }
    setCsvFile(file);
    setError('');
  };

  const handlePreview = async () => {
    if (!csvFile) { setError('Please upload a CSV file first'); return; }
    try {
      setLoading(true); setError('');
      const response = await taxPreparerClientAPI.bulkImportTaxpayersPreview(csvFile);
      if (response.success && response.data) {
        setPreviewData(response.data);
        const validRowIndices = response.data.preview_data
          .filter(row => row.is_valid && !(row.existing_taxpayer?.exists))
          .map(row => row.row_index);
        setSelectedRows(validRowIndices);
        const initialInvitationPrefs = {};
        response.data.preview_data.forEach(row => {
          if (row.is_valid && row.has_email) initialInvitationPrefs[row.row_index] = false;
        });
        setInvitationPreferences(initialInvitationPrefs);
        setCurrentStep(2);
      } else {
        throw new Error(response.message || 'Preview failed');
      }
    } catch (err) {
      setError(handleAPIError(err) || 'Failed to preview import. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || selectedRows.length === 0) {
      setError('Please select at least one row to import'); return;
    }
    try {
      setLoading(true); setError('');
      const invitationOptions = { invitation_timing: invitationTiming };
      if (invitationTiming === 'immediate') {
        const rowsToInvite = selectedRows.filter(idx => {
          const row = previewData.preview_data.find(r => r.row_index === idx);
          return row?.is_valid && row?.has_email && invitationPreferences[idx] === true;
        });
        if (rowsToInvite.length > 0) invitationOptions.rows_to_invite = rowsToInvite;
      }
      const response = await taxPreparerClientAPI.bulkImportTaxpayersConfirm(
        previewData.import_log_id, selectedRows, invitationOptions
      );
      if (response.success && response.data) {
        setImportResults(response.data);
        setCurrentStep(3);
        const hasErrors = (response.data.error_count > 0) ||
          response.data.import_results?.some(r => r.status === 'error');
        if (hasErrors) {
          toast.warning(`Import completed with ${response.data.error_count || 0} error(s).`);
        } else {
          toast.success(`Successfully imported ${response.data.imported_count || 0} taxpayers`);
          if (onImportSuccess) onImportSuccess(response.data);
        }
      } else {
        throw new Error(response.message || 'Import failed');
      }
    } catch (err) {
      setError(handleAPIError(err) || 'Failed to import taxpayers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadErrorReport = async (type = 'all') => {
    if (!previewData?.import_log_id) return;
    try {
      setDownloadingReport(true);
      const token = getAccessToken();
      const url = `${API_BASE_URL}/taxpayer/bulk-import/${previewData.import_log_id}/error-report/?type=${type}`;
      const resp = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error('Failed to download report');
      const blob = await resp.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `import_${previewData.import_log_id}_${type}_report.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('Error report downloaded');
    } catch (err) {
      toast.error('Failed to download error report');
    } finally {
      setDownloadingReport(false);
    }
  };

  const toggleRowExpand = (rowIndex) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(rowIndex) ? next.delete(rowIndex) : next.add(rowIndex);
      return next;
    });
  };

  const toggleInvitationPreference = (rowIndex) =>
    setInvitationPreferences(prev => ({ ...prev, [rowIndex]: !prev[rowIndex] }));
  const selectAllInvitations = () => {
    if (!previewData) return;
    const next = { ...invitationPreferences };
    previewData.preview_data.forEach(row => {
      if (row.is_valid && row.has_email && selectedRows.includes(row.row_index)) next[row.row_index] = true;
    });
    setInvitationPreferences(next);
  };
  const deselectAllInvitations = () => {
    const next = { ...invitationPreferences };
    Object.keys(next).forEach(k => { next[k] = false; });
    setInvitationPreferences(next);
  };
  const selectAllValid = () => {
    if (!previewData) return;
    setSelectedRows(previewData.preview_data
      .filter(row => row.is_valid && !row.existing_taxpayer?.exists)
      .map(row => row.row_index));
  };
  const deselectAll = () => setSelectedRows([]);
  const toggleRowSelection = (rowIndex) =>
    setSelectedRows(prev =>
      prev.includes(rowIndex) ? prev.filter(i => i !== rowIndex) : [...prev, rowIndex]
    );

  const handleSendInvitations = async () => {
    if (!importResults || !previewData) return;
    try {
      setSendingInvitations(true); setError('');
      const ids = importResults.import_results
        .filter(r => r.status === 'imported' && r.email && !r.invitation_sent && r.taxpayer_id)
        .map(r => r.taxpayer_id);
      if (!ids.length) { setError('No taxpayers available for invitation'); return; }
      const response = await taxPreparerClientAPI.bulkImportTaxpayersSendInvitations(
        previewData.import_log_id, { taxpayer_ids: ids }
      );
      if (response.success) {
        toast.success(`Sent ${response.data?.sent_count || 0} invitations`);
        if (onImportSuccess) onImportSuccess(response.data);
      } else throw new Error(response.message);
    } catch (err) {
      setError(handleAPIError(err) || 'Failed to send invitations.');
    } finally {
      setSendingInvitations(false);
    }
  };

  if (!isOpen) return null;

  // ─── STEP 1: Upload ────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Upload Zone */}
      <div>
        <h6 className="taxdashboardr-titler mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
          Upload File (CSV or PDF)
        </h6>
        <div
          className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center"
          style={{ borderColor: '#E8F0FF', backgroundColor: '#F3F7FF' }}
        >
          <div className="text-blue-500 text-2xl mb-2"><Folder /></div>
          <div className="text-xs mb-3" style={{ color: '#3B4A66', fontSize: '10px' }}>
            <p>Drop your file here or click to browse</p>
            <p>Supported formats: CSV, PDF (Max 10MB)</p>
          </div>
          <label
            className="px-4 py-2 text-black text-sm transition flex items-center gap-2 cursor-pointer d-flex justify-center"
            style={{ border: '1px solid #E8F0FF', borderRadius: '8px' }}
          >
            <Browse /> Browse Files
            <input type="file" accept=".csv,.pdf" onChange={handleFileUpload} className="hidden" />
          </label>
          {csvFile && (
            <div className="mt-2 text-sm text-green-600 font-[BasisGrotesquePro]">✓ {csvFile.name}</div>
          )}
        </div>
        <div className="flex gap-4 mt-3 px-2">
          <a href={sampleCsv} download="sample_taxpayer_import.csv" className="text-blue-600 hover:underline text-[12px] font-medium font-[BasisGrotesquePro] flex items-center gap-1.5" target="_blank" rel="noopener noreferrer">
            ⬇ Sample CSV
          </a>
          <a href={samplePdf} download="sample_taxpayer_import.pdf" className="text-blue-600 hover:underline text-[12px] font-medium font-[BasisGrotesquePro] flex items-center gap-1.5" target="_blank" rel="noopener noreferrer">
            ⬇ Sample PDF
          </a>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <h6 className="taxdashboardr-titler mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
          Supported Fields
        </h6>
        <div className="rounded-lg p-4 mb-3" style={{ backgroundColor: '#E8F0FF', fontSize: '11px', color: '#3B4A66' }}>
          <div className="space-y-2">
            <div>
              <div className="font-bold mb-1" style={{ fontSize: '12px' }}>🪪 Identity &amp; Contact</div>
              <div className="text-gray-600">First Name*, Last Name*, Middle Name, Suffix, Email, Phone, Alt Phone, SSN/ITIN, Date of Birth</div>
            </div>
            <div>
              <div className="font-bold mb-1" style={{ fontSize: '12px' }}>🏠 Address</div>
              <div className="text-gray-600">Street, Apt/Unit, City, State, ZIP, Country (defaults to United States)</div>
            </div>
            <div>
              <div className="font-bold mb-1" style={{ fontSize: '12px' }}>📋 Filing Context</div>
              <div className="text-gray-600">Filing Status, Spouse First/Last/SSN, Prior-Year Client ID, Internal Notes</div>
            </div>
            <div>
              <div className="font-bold mb-1" style={{ fontSize: '12px' }}>🏢 Firm &amp; Workflow</div>
              <div className="text-gray-600">Assigned Tax Preparer, Office/Location, Client Tags, Client Status</div>
            </div>
            <div className="mt-2 border-t border-blue-200 pt-2 text-[10px] text-gray-500">
              * Required — causes blocking error if missing.<br />
              Missing email, phone, SSN = non-blocking warnings only.
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <button
            onClick={handlePreview}
            disabled={!csvFile || loading}
            className="px-5 py-2 text-white text-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
            style={{ backgroundColor: '#F56D2D', borderRadius: '8px', fontWeight: '600' }}
          >
            {loading ? 'Processing…' : <><span>Continue to Preview</span><span>→</span></>}
          </button>
        </div>
      </div>
    </div>
  );

  // ─── STEP 2: Preview ───────────────────────────────────────────────────────
  const renderStep2 = () => {
    if (!previewData) return null;
    const { total_rows, valid_rows, error_rows, preview_data, error_summary } = previewData;

    const dupCount = preview_data.filter(r => r.existing_taxpayer?.exists).length;
    const dupInFirmCount = preview_data.filter(r => {
      const et = r.existing_taxpayer;
      return et?.exists && (et.match_type === 'email_and_firm' || et.match_type === 'ssn_and_firm');
    }).length;
    const validNonDup = preview_data.filter(r => r.is_valid && !r.existing_taxpayer?.exists).length;

    // Filter rows
    const filteredRows = preview_data.filter(row => {
      if (rowFilter === 'errors') return row.blocking_errors?.length > 0;
      if (rowFilter === 'warnings') return !row.is_valid ? false : row.warnings?.length > 0;
      if (rowFilter === 'valid') return row.is_valid && !row.blocking_errors?.length;
      return true;
    });

    const hasErrors = error_summary?.has_blocking_errors;
    const hasWarnings = error_summary?.has_warnings;

    return (
      <div>
        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Valid', value: valid_rows || 0, color: 'green' },
            { label: 'Errors', value: error_rows || 0, color: 'red' },
            { label: 'Duplicates', value: dupCount, sub: `${dupInFirmCount} in firm`, color: 'orange' },
            { label: 'Warnings', value: error_summary?.total_warnings || 0, color: 'yellow' },
            { label: 'Total Rows', value: total_rows || 0, color: 'blue', span: true },
          ].map(({ label, value, sub, color, span }) => (
            <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-lg p-3 ${span ? 'col-span-2 md:col-span-1' : ''}`}>
              <div className={`text-xl font-bold text-${color}-700 font-[BasisGrotesquePro]`}>{value}</div>
              <div className={`text-xs text-${color}-700 font-[BasisGrotesquePro]`}>{label}</div>
              {sub && <div className={`text-[10px] text-${color}-600 mt-0.5 font-[BasisGrotesquePro]`}>{sub}</div>}
            </div>
          ))}
        </div>

        {/* ── Error / Warning Summary Panels ── */}
        {(hasErrors || hasWarnings) && (
          <div className="mb-5 space-y-3">
            {/* Download button */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">Validation Issues</span>
              <div className="flex gap-2">
                {hasErrors && (
                  <button
                    onClick={() => handleDownloadErrorReport('errors')}
                    disabled={downloadingReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition font-[BasisGrotesquePro] disabled:opacity-50"
                  >
                    ⬇ Download Error Report
                  </button>
                )}
                {hasWarnings && (
                  <button
                    onClick={() => handleDownloadErrorReport('warnings')}
                    disabled={downloadingReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition font-[BasisGrotesquePro] disabled:opacity-50"
                  >
                    ⬇ Download Warning Report
                  </button>
                )}
                {(hasErrors || hasWarnings) && (
                  <button
                    onClick={() => handleDownloadErrorReport('all')}
                    disabled={downloadingReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition font-[BasisGrotesquePro] disabled:opacity-50"
                  >
                    ⬇ Full Report
                  </button>
                )}
              </div>
            </div>

            {/* Blocking errors */}
            {hasErrors && (
              <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left"
                  onClick={() => setErrorSectionExpanded(e => !e)}
                >
                  <span className="text-sm font-semibold text-red-700 font-[BasisGrotesquePro]">
                    🚫 Blocking Errors — {error_summary.total_blocking_errors} total
                    <span className="ml-2 text-xs font-normal text-red-500">(these rows will NOT be imported)</span>
                  </span>
                  <span className="text-red-400">{errorSectionExpanded ? '▲' : '▼'}</span>
                </button>
                {errorSectionExpanded && (
                  <div className="px-4 pb-3">
                    <CollapsibleList items={error_summary.blocking_errors} color="red" initialShow={8} label="error" />
                  </div>
                )}
              </div>
            )}

            {/* Warnings */}
            {hasWarnings && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left"
                  onClick={() => setWarnSectionExpanded(e => !e)}
                >
                  <span className="text-sm font-semibold text-yellow-700 font-[BasisGrotesquePro]">
                    ⚠️ Warnings — {error_summary.total_warnings} total
                    <span className="ml-2 text-xs font-normal text-yellow-600">(these rows can still be imported)</span>
                  </span>
                  <span className="text-yellow-400">{warnSectionExpanded ? '▲' : '▼'}</span>
                </button>
                {warnSectionExpanded && (
                  <div className="px-4 pb-3">
                    <CollapsibleList items={error_summary.warnings} color="yellow" initialShow={5} label="warning" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Duplicate Notice ── */}
        {dupCount > 0 && (
          <div className="mb-4 p-3 rounded-lg border text-xs" style={{ backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }}>
            ⚠️ <strong>{dupCount}</strong> duplicate(s) found (<strong>{dupInFirmCount}</strong> already in this firm). Duplicates are excluded from import by default.
          </div>
        )}

        {/* ── Row Filter + Selection Controls ── */}
        <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
          <div className="flex gap-1.5">
            <button onClick={selectAllValid} disabled={validNonDup === 0}
              className="px-3 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro] disabled:opacity-40">
              ✓ Select All Valid
            </button>
            <button onClick={deselectAll}
              className="px-3 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro]">
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 text-xs font-[BasisGrotesquePro]">
              {[
                { key: 'all', label: `All (${preview_data.length})` },
                { key: 'errors', label: `Errors (${error_summary?.total_blocking_errors || 0})` },
                { key: 'warnings', label: `Warnings (${error_summary?.total_warnings || 0})` },
                { key: 'valid', label: `Valid (${valid_rows || 0})` },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setRowFilter(key)}
                  className={`px-2.5 py-1 rounded-md transition ${rowFilter === key ? 'bg-white shadow text-[#3B4A66] font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
                  {label}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">
              {selectedRows.length}/{validNonDup} selected
            </span>
          </div>
        </div>

        {/* ── Preview Table ── */}
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5 w-8">
                    <input type="checkbox"
                      checked={selectedRows.length === validNonDup && validNonDup > 0}
                      onChange={e => e.target.checked ? selectAllValid() : deselectAll()}
                      className="rounded" />
                  </th>
                  {['Row', 'Status', 'Name', 'Email', 'Phone', 'SSN', 'Filing Status', 'Duplicate', 'Invite', 'Issues'].map(col => (
                    <th key={col} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-600 uppercase font-[BasisGrotesquePro] whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredRows.map(row => {
                  const isSelected = selectedRows.includes(row.row_index);
                  const isExpanded = expandedRows.has(row.row_index);
                  const et = row.existing_taxpayer;
                  const hasDup = et?.exists;
                  const isDupInFirm = hasDup && (et.match_type === 'email_and_firm' || et.match_type === 'ssn_and_firm');
                  const isDisabled = !row.is_valid || hasDup;
                  const hasEmail = row.has_email !== false && row.data?.email;
                  const canInvite = isSelected && !isDisabled && hasEmail;
                  const d = row.data || {};
                  const name = `${d.first_name || ''} ${d.last_name || ''}`.trim() || '—';
                  const hasIssues = (row.blocking_errors?.length > 0) || (row.warnings?.length > 0);

                  return (
                    <React.Fragment key={row.row_index}>
                      <tr className={`hover:bg-gray-50 transition ${isDisabled ? 'opacity-60' : ''} ${hasDup ? (isDupInFirm ? 'bg-orange-50' : 'bg-yellow-50') : ''}`}>
                        <td className="px-3 py-2.5">
                          <input type="checkbox" checked={isSelected}
                            onChange={() => !isDisabled && toggleRowSelection(row.row_index)}
                            disabled={isDisabled} className="rounded"
                            title={hasDup ? 'Duplicates skipped' : isDisabled ? 'Invalid row' : 'Select for import'} />
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-600 font-[BasisGrotesquePro]">{row.row_index + 1}</td>
                        <td className="px-3 py-2.5">
                          {row.is_valid
                            ? <Pill color="green">Valid</Pill>
                            : <Pill color="red">Error</Pill>}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-900 font-[BasisGrotesquePro] font-medium whitespace-nowrap">{name}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-700 font-[BasisGrotesquePro]">{d.email || <span className="text-gray-400">—</span>}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-700 font-[BasisGrotesquePro]">{d.phone || <span className="text-gray-400">—</span>}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-600 font-[BasisGrotesquePro]">
                          {d.ssn ? <span className="font-mono">***-**-{String(d.ssn).slice(-4)}</span> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-600 font-[BasisGrotesquePro]">
                          {d.filing_status || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          {hasDup ? (
                            isDupInFirm
                              ? <Pill color="orange">⚠ In Firm</Pill>
                              : <Pill color="yellow">ℹ Elsewhere</Pill>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          {hasEmail
                            ? <input type="checkbox"
                              checked={invitationPreferences[row.row_index] === true}
                              onChange={() => toggleInvitationPreference(row.row_index)}
                              disabled={!canInvite || invitationTiming === 'later'}
                              className="rounded"
                              title={invitationTiming === 'later' ? 'Set timing to immediate' : !canInvite ? 'Select row first' : 'Send invitation'} />
                            : <span className="text-[10px] text-gray-400 font-[BasisGrotesquePro]">No email</span>}
                        </td>
                        <td className="px-3 py-2.5 max-w-[180px]">
                          {row.blocking_errors?.length > 0
                            ? <div className="text-xs text-red-600 font-[BasisGrotesquePro] truncate" title={row.blocking_errors.join('; ')}>
                              🚫 {row.blocking_errors[0]}{row.blocking_errors.length > 1 ? ` +${row.blocking_errors.length - 1}` : ''}
                            </div>
                            : row.warnings?.length > 0
                              ? <div className="text-xs text-yellow-600 font-[BasisGrotesquePro] truncate" title={row.warnings.join('; ')}>
                                ⚠ {row.warnings[0]}{row.warnings.length > 1 ? ` +${row.warnings.length - 1}` : ''}
                              </div>
                              : <span className="text-gray-300">—</span>}
                        </td>
                        {/* Expand button */}
                        <td className="px-2 py-2.5 text-center">
                          <button
                            onClick={() => toggleRowExpand(row.row_index)}
                            className="text-gray-400 hover:text-gray-700 text-xs transition"
                            title={isExpanded ? 'Collapse' : 'Expand row details'}
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${row.row_index}-detail`}>
                          <td colSpan={12} className="p-0">
                            <RowDetail row={row} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-sm text-gray-500 font-[BasisGrotesquePro]">
                      No rows match the current filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredRows.length > 0 && (
            <div className="px-4 py-2 text-xs text-gray-400 text-center font-[BasisGrotesquePro] border-t border-gray-100">
              Showing {filteredRows.length} of {preview_data.length} rows · Click ▼ on any row for full field details
            </div>
          )}
        </div>

        {/* ── Invitation Timing ── */}
        <div className="mb-5 p-4 rounded-lg border" style={{ backgroundColor: '#F3F7FF', borderColor: '#E8F0FF' }}>
          <h6 className="text-sm font-semibold text-[#3B4A66] mb-3 font-[BasisGrotesquePro]">Invitation Settings</h6>
          <div className="flex flex-col gap-2.5">
            {[
              { value: 'later', label: 'Send invitations later (manual)' },
              { value: 'immediate', label: 'Send invitations immediately' },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="invitation-timing" value={value}
                  checked={invitationTiming === value} onChange={e => setInvitationTiming(e.target.value)}
                  className="w-4 h-4" />
                <span className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">{label}</span>
              </label>
            ))}
            {invitationTiming === 'immediate' && (
              <div className="ml-7 mt-1 space-y-2">
                <div className="flex gap-2">
                  <button onClick={selectAllInvitations}
                    className="px-3 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro]">
                    Select All
                  </button>
                  <button onClick={deselectAllInvitations}
                    className="px-3 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro]">
                    Deselect All
                  </button>
                </div>
                <p className="text-xs text-gray-600 font-[BasisGrotesquePro]">
                  {Object.values(invitationPreferences).filter(Boolean).length} invitation(s) will be sent
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Nav Buttons ── */}
        <div className="flex justify-between items-center">
          <button onClick={() => setCurrentStep(1)} disabled={loading}
            className="px-5 py-2 text-gray-700 bg-white border border-gray-300 text-sm rounded-lg hover:bg-gray-50 flex items-center gap-2 font-[BasisGrotesquePro] disabled:opacity-50">
            ← Back
          </button>
          <button onClick={handleConfirmImport}
            disabled={loading || selectedRows.length === 0}
            className="px-5 py-2 text-white text-sm transition flex items-center gap-2 bg-[#F56D2D] rounded-lg font-semibold font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Importing…' : `Import ${selectedRows.length} Selected Taxpayer${selectedRows.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    );
  };

  // ─── STEP 3: Results ───────────────────────────────────────────────────────
  const renderStep3 = () => {
    if (!importResults) return null;
    const hasErrors = (importResults.error_count > 0) ||
      importResults.import_results?.some(r => r.status === 'error');

    return (
      <div>
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            {hasErrors
              ? <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center text-2xl">⚠️</div>
              : <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32.0827 16.1602V17.5018C32.0809 20.6466 31.0626 23.7066 29.1796 26.2253C27.2967 28.7441 24.65 30.5867 21.6342 31.4784C18.6185 32.37 15.3954 32.2629 12.4455 31.1731C9.49555 30.0833 6.97697 28.0691 5.26533 25.4309C3.5537 22.7927 2.74071 19.6719 2.94763 16.534C3.15454 13.396 4.37028 10.409 6.41351 8.0184C8.45674 5.62782 11.218 3.96177 14.2855 3.26872C17.3529 2.57566 20.5622 2.89274 23.4348 4.17267M13.1244 16.0435L17.4994 20.4185L32.0827 5.83517" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>}
          </div>
          <h4 className={`text-2xl font-bold mb-1 font-[BasisGrotesquePro] ${hasErrors ? 'text-yellow-700' : '!text-[#32B582]'}`}>
            {hasErrors ? 'Import Completed with Errors' : 'Import Completed!'}
          </h4>
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
            {hasErrors ? 'Some rows failed — review errors below.' : 'All selected taxpayers were imported successfully.'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Imported', value: importResults.imported_count || 0, color: 'green' },
            { label: 'Skipped', value: importResults.skipped_count || 0, color: 'yellow' },
            { label: 'Errors', value: importResults.error_count || 0, color: 'red' },
            { label: 'Invites Sent', value: importResults.invitations_sent || 0, color: 'purple' },
            { label: 'Processed', value: importResults.import_results?.length || 0, color: 'blue', span: true },
          ].map(({ label, value, color, span }) => (
            <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-lg p-3 ${span ? 'col-span-2 md:col-span-1' : ''}`}>
              <div className={`text-xl font-bold text-${color}-700 font-[BasisGrotesquePro]`}>{value}</div>
              <div className={`text-xs text-${color}-700 font-[BasisGrotesquePro]`}>{label}</div>
            </div>
          ))}
        </div>

        {/* Results Table */}
        {importResults.import_results?.length > 0 && (
          <div className="mb-5">
            <h6 className="text-sm font-semibold text-gray-800 mb-2 font-[BasisGrotesquePro]">Import Results</h6>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {['Row', 'Name', 'Email', 'Phone', 'Status', 'Taxpayer ID', 'Invitation', 'Notes'].map(col => (
                        <th key={col} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase font-[BasisGrotesquePro] whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {importResults.import_results.map((result, idx) => {
                      const name = result.taxpayer_name ||
                        (result.first_name && result.last_name ? `${result.first_name} ${result.last_name}` : null) || '—';
                      const email = result.email || '—';
                      const phone = result.phone || '—';
                      const note = result.details || result.message || '—';
                      return (
                        <tr key={idx} className={`hover:bg-gray-50 ${result.status === 'error' ? 'bg-red-50' : ''}`}>
                          <td className="px-3 py-2 text-gray-600 font-[BasisGrotesquePro]">{result.row_index + 1}</td>
                          <td className="px-3 py-2 text-gray-900 font-[BasisGrotesquePro] font-medium">{name}</td>
                          <td className="px-3 py-2 text-gray-700 font-[BasisGrotesquePro]">{email}</td>
                          <td className="px-3 py-2 text-gray-700 font-[BasisGrotesquePro]">{phone}</td>
                          <td className="px-3 py-2">
                            <Pill color={result.status === 'imported' ? 'green' : result.status === 'skipped' ? 'yellow' : 'red'}>
                              {result.status === 'imported' ? '✓ Imported' : result.status === 'skipped' ? 'Skipped' : '✗ Error'}
                            </Pill>
                          </td>
                          <td className="px-3 py-2 text-gray-600 font-[BasisGrotesquePro] font-mono">{result.taxpayer_id || '—'}</td>
                          <td className="px-3 py-2">
                            {result.invitation_sent
                              ? <Pill color="green">✓ Sent</Pill>
                              : result.email && result.status === 'imported'
                                ? <Pill color="gray">Not Sent</Pill>
                                : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-600 font-[BasisGrotesquePro] max-w-[200px] truncate" title={note !== '—' ? note : undefined}>
                            {note !== '—' ? <span className={result.status === 'error' ? 'text-red-600' : ''}>{note}</span> : <span className="text-gray-300">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-4">
          {importResults.import_results?.some(r => r.status === 'imported' && r.email && !r.invitation_sent && r.taxpayer_id) && (
            <button onClick={handleSendInvitations} disabled={sendingInvitations}
              className="px-5 py-2 text-white text-sm flex items-center gap-2 bg-[#32B582] rounded-lg font-semibold font-[BasisGrotesquePro] disabled:opacity-50">
              {sendingInvitations ? 'Sending…' : 'Send Invitations to Remaining'}
            </button>
          )}
          {previewData?.import_log_id && (
            <button onClick={() => handleDownloadErrorReport('all')} disabled={downloadingReport}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-[BasisGrotesquePro] disabled:opacity-50">
              ⬇ Download Full Report
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose}
              className="px-5 py-2 text-white text-sm bg-[#F56D2D] rounded-lg font-semibold font-[BasisGrotesquePro]">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-10"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-4 sm:p-6 max-w-6xl w-full mx-auto"
        style={{ maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-[#3B4A66] transition z-20">
          <IoMdClose size={24} />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="flex justify-between items-start pb-3" style={{ borderBottom: '0.5px solid #E8F0FF' }}>
            <div className="pr-10">
              <h4 className="text-lg sm:text-[22px] font-bold font-[BasisGrotesquePro] leading-tight" style={{ color: '#3B4A66' }}>
                Bulk Import Taxpayers
              </h4>
              <p className="text-xs sm:text-sm mt-1 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Import multiple taxpayers from CSV or PDF with full validation &amp; error reporting
              </p>
            </div>
          </div>
          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-[BasisGrotesquePro]">
              {error}
            </div>
          )}
        </div>

        {/* Steps nav */}
        <div className="flex items-center rounded-lg px-4 py-2.5 mb-5"
          style={{ backgroundColor: '#E8F0FF', border: '1px solid #E8F0FF' }}>
          {[
            { step: 1, label: 'Upload File' },
            { step: 2, label: 'Preview & Select' },
            { step: 3, label: 'Results' },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${s.step <= currentStep ? 'bg-[#F56D2D] text-white' : 'bg-white text-gray-400'}`}>
                  {s.step < currentStep ? '✓' : s.step}
                </div>
                <span className={`text-[10px] sm:text-sm font-[BasisGrotesquePro] ${s.step <= currentStep ? 'font-bold text-[#F56D2D]' : 'text-[#3B4A66]'}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && <span className="mx-3 text-gray-300">›</span>}
            </div>
          ))}
        </div>

        {/* Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>
    </div>
  );
}
