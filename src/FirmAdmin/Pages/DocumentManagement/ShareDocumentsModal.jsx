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
        // Handle different response structures
        let staff = [];
        
        if (Array.isArray(response.data.staff)) {
          staff = response.data.staff;
        } else if (Array.isArray(response.data)) {
          staff = response.data;
        } else if (Array.isArray(response.data.tax_preparers)) {
          staff = response.data.tax_preparers;
        } else if (response.data.staff && typeof response.data.staff === 'object' && !Array.isArray(response.data.staff)) {
          // If staff is an object, try to extract an array from it
          staff = Object.values(response.data.staff);
        } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          // If data itself is an object, try to extract an array
          staff = Object.values(response.data);
        }
        
        console.log('Extracted staff array:', staff);
        
        // Ensure staff is an array
        if (!Array.isArray(staff)) {
          staff = [];
        }
        
        // Filter out any invalid entries and ensure we have valid objects
        const preparers = staff.filter(s => s && typeof s === 'object' && (s.id || s.user_id));
        
        console.log('Filtered preparers:', preparers);
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
    setSelectedTaxPreparerIds(selectedIds);
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
      const documentIds = selectedDocuments.map(doc => doc.id || doc.document_id);
      const response = await firmAdminDocumentsAPI.shareDocuments(
        documentIds,
        selectedTaxPreparerIds,
        notes.trim() || null
      );

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
        autoClose: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTaxPreparers = taxPreparers.filter(p => 
    selectedTaxPreparerIds.includes(p.id || p.user_id)
  );

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton style={{ borderBottom: '1px solid #E5E7EB' }}>
        <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>
          Share Documents with Tax Preparers
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontFamily: 'BasisGrotesquePro' }}>
        {/* Selected Documents Info */}
        {selectedDocuments && Array.isArray(selectedDocuments) && selectedDocuments.length > 0 ? (
          <div className="mb-4 p-3" style={{ backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <p className="mb-2" style={{ fontSize: '14px', fontWeight: '600', color: '#3B4A66' }}>
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
          <label className="form-label" style={{ fontWeight: '500', color: '#3B4A66' }}>
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
              size={Math.min(taxPreparers.length, 8)}
              value={selectedTaxPreparerIds.map(id => id.toString())}
              onChange={handleTaxPreparerChange}
              style={{
                borderColor: '#E5E7EB',
                fontFamily: 'BasisGrotesquePro'
              }}
            >
              {taxPreparers.map((preparer) => {
                const preparerId = preparer.id || preparer.user_id;
                const preparerName = preparer.full_name || preparer.name || 'Unknown';
                const preparerEmail = preparer.email || '';
                return (
                  <option
                    key={preparerId}
                    value={preparerId}
                    style={{
                      padding: '8px 12px'
                    }}
                  >
                    {preparerName} {preparerEmail ? `(${preparerEmail})` : ''}
                  </option>
                );
              })}
            </select>
          )}
          {taxPreparers.length > 0 && (
            <small className="text-muted d-block mt-2" style={{ fontSize: '12px' }}>
              Hold Ctrl (Windows) or Cmd (Mac) to select multiple tax preparers
            </small>
          )}
        </div>

        {/* Selected Tax Preparers Display */}
        {selectedTaxPreparerIds.length > 0 && (
          <div className="mt-3 p-3" style={{ backgroundColor: '#E0F2FE', borderRadius: '6px', border: '1px solid #BAE6FD' }}>
            <p className="mb-2" style={{ fontSize: '13px', color: '#0369A1', fontWeight: '600' }}>
              Selected Tax Preparers ({selectedTaxPreparerIds.length})
            </p>
            <div className="d-flex flex-wrap gap-2">
              {selectedTaxPreparerIds.map((id) => {
                const preparer = taxPreparers.find(p => (p.id || p.user_id) === id);
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
        <div className="mt-4">
          <label className="form-label" style={{ fontWeight: '500', color: '#3B4A66' }}>
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
              resize: 'vertical'
            }}
          />
        </div>
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #E5E7EB' }}>
        <button
          className="btn"
          onClick={onClose}
          disabled={submitting}
          style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            color: '#3B4A66',
            fontFamily: 'BasisGrotesquePro'
          }}
        >
          Cancel
        </button>
        <button
          className="btn"
          onClick={handleSubmit}
          disabled={submitting || selectedTaxPreparerIds.length === 0}
          style={{
            backgroundColor: submitting || selectedTaxPreparerIds.length === 0 ? '#D1D5DB' : '#00C0C6',
            border: 'none',
            color: 'white',
            fontFamily: 'BasisGrotesquePro',
            fontWeight: '500'
          }}
        >
          {submitting ? 'Sharing...' : `Share with ${selectedTaxPreparerIds.length} Tax Preparer${selectedTaxPreparerIds.length !== 1 ? 's' : ''}`}
        </button>
      </Modal.Footer>
    </Modal>
  );
}

