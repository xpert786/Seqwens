import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { firmAdminDocumentsAPI, firmAdminStaffAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

export default function ShareDocumentsModal({ show, onClose, selectedDocuments = [], onSuccess }) {
  const [taxPreparers, setTaxPreparers] = useState([]);
  const [selectedTaxPreparerIds, setSelectedTaxPreparerIds] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTaxPreparers, setLoadingTaxPreparers] = useState(true);

  useEffect(() => {
    if (show) {
      fetchTaxPreparers();
      // Reset state when modal opens (but keep selectedDocuments)
      setSelectedTaxPreparerIds([]);
      setNotes('');
      // Debug: Log selected documents
      console.log('ShareDocumentsModal opened - Selected Documents:', selectedDocuments);
      console.log('ShareDocumentsModal opened - selectedDocuments length:', selectedDocuments?.length);
    }
  }, [show]);

  // Separate effect to log when selectedDocuments changes
  useEffect(() => {
    console.log('ShareDocumentsModal - selectedDocuments changed:', selectedDocuments);
  }, [selectedDocuments]);

  const fetchTaxPreparers = async () => {
    try {
      setLoadingTaxPreparers(true);
      // Use the API endpoint with all parameters as specified
      const response = await firmAdminStaffAPI.listStaff({
        status: 'all',
        search: '',
        role: 'all',
        performance: 'all'
      });

      console.log('Tax Preparers API Response:', response);

      if (response.success && response.data) {
        // The API returns data.staff_members array
        let staffMembers = [];

        if (Array.isArray(response.data.staff_members)) {
          staffMembers = response.data.staff_members;
        } else if (Array.isArray(response.data.staff)) {
          staffMembers = response.data.staff;
        } else if (Array.isArray(response.data)) {
          staffMembers = response.data;
        } else if (Array.isArray(response.data.tax_preparers)) {
          staffMembers = response.data.tax_preparers;
        }

        console.log('Extracted staff_members array:', staffMembers);

        // Ensure staffMembers is an array
        if (!Array.isArray(staffMembers)) {
          staffMembers = [];
        }

        // Map the response structure to a simpler format for the dropdown
        // Response structure: { id, staff_member: { name, profile_picture }, contact: { email, phone }, ... }
        const preparers = staffMembers
          .filter(s => s && typeof s === 'object' && s.id)
          .map(s => ({
            id: s.id,
            name: s.staff_member?.name || s.name || 'Unknown',
            full_name: s.staff_member?.name || s.name || 'Unknown',
            email: s.contact?.email || s.email || '',
            phone: s.contact?.phone || s.phone || '',
            role: s.role?.primary || s.role || '',
            status: s.status?.display || s.status || '',
            profile_picture: s.staff_member?.profile_picture || s.profile_picture || null
          }));

        console.log('Mapped preparers:', preparers);
        setTaxPreparers(preparers);
      } else {
        console.warn('API response structure unexpected:', response);
        setTaxPreparers([]);
      }
    } catch (err) {
      console.error('Error fetching tax preparers:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to load tax preparers', {
        position: "top-right",
        autoClose: 3000,
      });
      setTaxPreparers([]);
    } finally {
      setLoadingTaxPreparers(false);
    }
  };

  const handleTaxPreparerChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const selectedIds = selectedOptions.map(option => parseInt(option.value));

    // Limit to maximum 2 tax preparers
    if (selectedIds.length > 2) {
      toast.warning('You can select a maximum of 2 tax preparers', {
        position: "top-right",
        autoClose: 3000,
      });
      // Keep only the first 2 selected
      const limitedIds = selectedIds.slice(0, 2);
      setSelectedTaxPreparerIds(limitedIds);

      // Update the select element to reflect the limit
      const selectElement = e.target;
      Array.from(selectElement.options).forEach(option => {
        option.selected = limitedIds.includes(parseInt(option.value));
      });
    } else {
      setSelectedTaxPreparerIds(selectedIds);
    }
  };

  // Helper function to convert backend URL to proxy URL if needed (to avoid CORS issues)
  const getProxyUrl = (url) => {
    if (!url) return url;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === '168.231.121.7' && urlObj.pathname.includes('/seqwens/media')) {
        const proxyPath = urlObj.pathname;
        return `${window.location.origin}${proxyPath}${urlObj.search}`;
      }
    } catch (e) {
      console.warn('Failed to parse URL:', url, e);
    }
    return url;
  };

  const handleSubmit = async () => {
    if (selectedTaxPreparerIds.length === 0) {
      toast.error('Please select at least one tax preparer', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (selectedDocuments.length === 0) {
      toast.error('No documents selected', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setSubmitting(true);

      // Show loading toast
      const loadingToast = toast.loading('Preparing files for sharing...', {
        position: "top-right",
      });

      // Fetch files from document URLs and convert to File objects
      const files = await Promise.all(
        selectedDocuments.map(async (doc, index) => {
          const fileUrl = doc.tax_documents || doc.file_url || doc.document_url;
          if (!fileUrl) {
            throw new Error(`No file URL found for document: ${doc.name || doc.id}`);
          }

          try {
            // Use proxy URL if needed to avoid CORS issues
            const proxiedUrl = getProxyUrl(fileUrl);

            // Fetch the file
            const response = await fetch(proxiedUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch file: ${response.statusText}`);
            }

            // Get the blob
            const blob = await response.blob();

            // Get filename from URL or use document name
            const urlParts = fileUrl.split('/');
            const urlFilename = urlParts[urlParts.length - 1];
            // Remove query parameters from filename if any
            const cleanFilename = urlFilename.split('?')[0];
            const filename = doc.name || doc.file_name || cleanFilename || `document_${doc.id || doc.document_id}.pdf`;

            // Convert blob to File object
            const file = new File([blob], filename, { type: blob.type || 'application/pdf' });
            return file;
          } catch (error) {
            console.error(`Error fetching file for document ${doc.id}:`, error);
            throw new Error(`Failed to fetch file for ${doc.name || doc.id}: ${error.message}`);
          }
        })
      );

      // Update loading toast
      toast.update(loadingToast, {
        render: 'Sharing documents...',
        type: 'info',
        isLoading: true
      });

      // Send files to API
      const response = await firmAdminDocumentsAPI.shareDocuments(
        files,
        selectedTaxPreparerIds,
        notes.trim() || null
      );

      toast.dismiss(loadingToast);

      if (response.success) {
        toast.success(response.message || 'Documents shared successfully', {
          position: "top-right",
          autoClose: 3000,
        });
        onSuccess?.();
        onClose();
      } else {
        throw new Error(response.message || 'Failed to share documents');
      }
    } catch (err) {
      console.error('Error sharing documents:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to share documents', {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTaxPreparers = taxPreparers.filter(p =>
    selectedTaxPreparerIds.includes(p.id)
  );

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      // Removing 'scrollable' prop to use manual maxHeight on body for better control
      dialogClassName="modal-650w"
    >
      <style>
        {`
          .modal-650w {
            max-width: 650px;
            width: 95%;
            margin: 1.75rem auto;
          }
          .modal-650w .modal-content {
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border-radius: 12px;
          }
          .modal-body-scroll {
            overflow-y: auto !important;
            flex: 1 1 auto;
          }
          /* Scrollbar Styling */
          .modal-body-scroll::-webkit-scrollbar {
            width: 8px;
            display: block !important;
          }
          .modal-body-scroll::-webkit-scrollbar-track {
            background: #f8fafc;
            border-radius: 0 0 12px 0;
          }
          .modal-body-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
            border: 2px solid #f8fafc;
          }
          .modal-body-scroll::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}
      </style>
      <Modal.Header closeButton style={{ borderBottom: '1px solid #E5E7EB' }}>
        <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>
          Share Documents with Tax Preparers
        </Modal.Title>
      </Modal.Header>
      <Modal.Body
        className="modal-body-scroll"
        style={{
          fontFamily: 'BasisGrotesquePro',
          fontSize: '14px',
          padding: '1.5rem',
          backgroundColor: '#fff'
        }}
      >
        {/* Selected Documents Info */}
        {selectedDocuments && Array.isArray(selectedDocuments) && selectedDocuments.length > 0 ? (
          <div className="mb-3 p-2" style={{ backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <p className="mb-2" style={{ fontSize: '13px', fontWeight: '600', color: '#3B4A66' }}>
              Selected Documents ({selectedDocuments.length})
            </p>
            <div className="d-flex flex-wrap gap-2">
              {selectedDocuments.map((doc, index) => {
                const docName = doc.name ||
                  doc.file_name ||
                  (doc.tax_documents ? doc.tax_documents.split('/').pop() : null) ||
                  `Document ${doc.id || doc.document_id || index + 1}`;
                return (
                  <span
                    key={doc.id || doc.document_id || index}
                    className="badge"
                    style={{
                      backgroundColor: '#E0F2FE',
                      color: '#0369A1',
                      fontSize: '12px',
                      padding: '4px 8px'
                    }}
                  >
                    {docName}
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3" style={{ backgroundColor: '#FEF3C7', borderRadius: '8px', border: '1px solid #FCD34D' }}>
            <p className="mb-0" style={{ fontSize: '14px', fontWeight: '500', color: '#92400E' }}>
              ⚠️ No documents selected. Please select documents first.
            </p>
            <p className="mb-0 mt-2" style={{ fontSize: '12px', color: '#92400E', fontStyle: 'italic' }}>
              Debug: selectedDocuments = {JSON.stringify(selectedDocuments)}
            </p>
          </div>
        )}

        {/* Select Tax Preparers Dropdown */}
        <div className="mb-3">
          <label className="form-label mb-1" style={{ fontSize: '14px', fontWeight: '500', color: '#3B4A66' }}>
            Select Tax Preparers <span className="text-danger">*</span>
          </label>
          {loadingTaxPreparers ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 mb-0" style={{ color: '#6B7280', fontSize: '14px' }}>
                Loading tax preparers...
              </p>
            </div>
          ) : taxPreparers.length === 0 ? (
            <div className="text-center py-3">
              <p style={{ color: '#6B7280', fontSize: '14px' }}>
                No tax preparers available
              </p>
            </div>
          ) : (
            <select
              className="form-select"
              multiple
              size={5}
              value={selectedTaxPreparerIds.map(id => id.toString())}
              onChange={handleTaxPreparerChange}
              style={{
                borderColor: '#E5E7EB',
                fontFamily: 'BasisGrotesquePro',
                fontSize: '13px',
                minHeight: '150px'
              }}
            >
              {taxPreparers.map((preparer) => {
                const preparerId = preparer.id;
                const preparerName = preparer.full_name || preparer.name || 'Unknown';
                const preparerEmail = preparer.email || '';
                const preparerRole = preparer.role || '';
                return (
                  <option
                    key={preparerId}
                    value={preparerId}
                    style={{
                      padding: '6px 10px'
                    }}
                  >
                    {preparerName} {preparerEmail ? `(${preparerEmail})` : ''} {preparerRole ? `- ${preparerRole}` : ''}
                  </option>
                );
              })}
            </select>
          )}
          {taxPreparers.length > 0 && (
            <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
              Hold Ctrl (Windows) or Cmd (Mac) to select multiple tax preparers. Maximum 2 selections allowed.
            </small>
          )}
        </div>

        {selectedTaxPreparerIds.length > 0 && (
          <div className="mt-2 p-2" style={{ backgroundColor: '#E0F2FE', borderRadius: '6px', border: '1px solid #BAE6FD' }}>
            <p className="mb-2" style={{ fontSize: '13px', color: '#0369A1', fontWeight: '600' }}>
              Selected Tax Preparers ({selectedTaxPreparerIds.length})
            </p>
            <div className="d-flex flex-wrap gap-2">
              {selectedTaxPreparerIds.map((id) => {
                const preparer = taxPreparers.find(p => p.id === id);
                if (!preparer) return null;
                const preparerName = preparer.full_name || preparer.name || 'Unknown';
                return (
                  <span
                    key={id}
                    className="badge"
                    style={{
                      backgroundColor: '#0369A1',
                      color: 'white',
                      fontSize: '12px',
                      padding: '4px 8px'
                    }}
                  >
                    {preparerName}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mt-3">
          <label className="form-label mb-1" style={{ fontSize: '14px', fontWeight: '500', color: '#3B4A66' }}>
            Notes (Optional)
          </label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Add any notes about these shared documents..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              borderColor: '#E5E7EB',
              resize: 'vertical',
              fontSize: '14px'
            }}
          />
        </div>
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #E5E7EB', padding: '0.75rem 1.25rem' }}>
        <button
          className="btn"
          onClick={onClose}
          disabled={submitting}
          style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            color: '#3B4A66',
            fontFamily: 'BasisGrotesquePro',
            borderRadius: '6px',
            fontSize: '14px',
            padding: '6px 16px'
          }}
        >
          Cancel
        </button>
        <button
          className="btn"
          onClick={handleSubmit}
          disabled={submitting || selectedTaxPreparerIds.length === 0}
          style={{
            backgroundColor: submitting || selectedTaxPreparerIds.length === 0 ? '#D1D5DB' : 'var(--firm-primary-color)',
            border: 'none',
            color: 'white',
            fontFamily: 'BasisGrotesquePro',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '14px',
            padding: '6px 20px'
          }}
        >
          {submitting ? 'Sharing...' : `Share`}
        </button>
      </Modal.Footer>
    </Modal>
  );
}

