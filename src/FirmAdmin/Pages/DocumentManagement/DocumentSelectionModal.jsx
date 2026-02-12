import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { firmAdminDocumentsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { FiSearch, FiX, FiCheck, FiFile } from 'react-icons/fi';

export default function DocumentSelectionModal({ show, onClose, onSelectDocuments, multiple = true }) {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [folderId, setFolderId] = useState(null);
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    if (show) {
      fetchFolders();
      // Reset state when modal opens
      setSelectedDocumentIds([]);
      setSearchQuery('');
      setFolderId(null);
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      fetchDocuments();
    }
  }, [show, folderId, searchQuery]);

  const fetchFolders = async () => {
    try {
      const response = await firmAdminDocumentsAPI.listFolders();
      if (response.success && response.data) {
        setFolders(response.data.folders || response.data || []);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (folderId) params.folder_id = folderId;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await firmAdminDocumentsAPI.getDocumentsByFolders(params);

      if (response.success && response.data) {
        const docs = response.data.documents || [];
        setDocuments(docs);
        // If search is done server-side, use the results directly
        // Otherwise, apply client-side filtering
        if (searchQuery.trim()) {
          // Server already filtered, but we can do additional client-side filtering if needed
          setFilteredDocuments(docs);
        } else {
          setFilteredDocuments(docs);
        }
      } else {
        setDocuments([]);
        setFilteredDocuments([]);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to load documents', {
        position: "top-right",
        autoClose: 3000,
      });
      setDocuments([]);
      setFilteredDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDocument = (docId) => {
    if (multiple) {
      setSelectedDocumentIds(prev => {
        if (prev.includes(docId)) {
          return prev.filter(id => id !== docId);
        } else {
          return [...prev, docId];
        }
      });
    } else {
      setSelectedDocumentIds([docId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedDocumentIds.length === filteredDocuments.length) {
      setSelectedDocumentIds([]);
    } else {
      setSelectedDocumentIds(filteredDocuments.map(doc => doc.id));
    }
  };

  const handleConfirm = () => {
    if (selectedDocumentIds.length === 0) {
      toast.error('Please select at least one document', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const selectedDocs = documents.filter(doc => selectedDocumentIds.includes(doc.id));
    onSelectDocuments(selectedDocs);
    onClose();
  };

  const getDocumentName = (doc) => {
    return doc.name ||
      doc.file_name ||
      (doc.tax_documents ? doc.tax_documents.split('/').pop() : '') ||
      `Document ${doc.id}`;
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      scrollable
      dialogClassName="modal-600w"
    >
      <style>
        {`
          .modal-600w {
            max-width: 600px;
            width: 95%;
            margin: 1.75rem auto;
          }
          .modal-body-scroll::-webkit-scrollbar {
            width: 8px;
          }
          .modal-body-scroll::-webkit-scrollbar-track {
            background: #f8fafc;
          }
          .modal-body-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
            border: 2px solid #f8fafc;
          }
        `}
      </style>
      <Modal.Header closeButton style={{ borderBottom: '1px solid #E5E7EB' }}>
        <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>
          Select Documents to Share
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="modal-body-scroll" style={{
        fontFamily: 'BasisGrotesquePro',
        overflowY: 'auto',
        maxHeight: '75vh',
        fontSize: '14px',
        padding: '1.5rem'
      }}>
        {/* Folder Filter */}
        <div className="mb-2">
          <label className="form-label mb-1" style={{ fontSize: '14px', fontWeight: '500', color: '#3B4A66' }}>
            Filter by Folder (Optional)
          </label>
          <select
            className="form-select"
            value={folderId || ''}
            onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : null)}
            style={{ borderColor: '#E5E7EB', fontSize: '13px' }}
          >
            <option value="">All Folders</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>
                {folder.title || folder.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="mb-3">
          <div className="position-relative">
            <FiSearch
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6B7280'
              }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '40px',
                borderColor: '#E5E7EB',
                fontSize: '13px'
              }}
            />
          </div>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 mb-0" style={{ color: '#6B7280', fontSize: '14px' }}>
              Loading documents...
            </p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-4">
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              {searchQuery || folderId ? 'No documents found matching your criteria' : 'No documents available'}
            </p>
          </div>
        ) : (
          <>
            {multiple && (
              <div className="d-flex justify-content-between align-items-center mb-2">
                <p className="mb-0" style={{ fontSize: '12px', color: '#6B7280' }}>
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
                </p>
                <button
                  type="button"
                  className="btn "
                  onClick={handleSelectAll}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #E5E7EB',
                    color: '#3B4A66',
                    fontSize: '11px',
                    padding: '3px 10px'
                  }}
                >
                  {selectedDocumentIds.length === filteredDocuments.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            )}
            <div
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '8px'
              }}
            >
              {filteredDocuments.map((doc) => {
                const isSelected = selectedDocumentIds.includes(doc.id);

                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocument(doc.id)}
                    style={{
                      padding: '8px',
                      marginBottom: '4px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#E0F2FE' : 'transparent',
                      border: `1px solid ${isSelected ? '#0369A1' : '#E5E7EB'}`,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2 flex-grow-1">
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            border: `2px solid ${isSelected ? '#0369A1' : '#D1D5DB'}`,
                            borderRadius: '4px',
                            backgroundColor: isSelected ? '#0369A1' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {isSelected && <FiCheck size={14} color="white" />}
                        </div>
                        <FiFile size={18} style={{ color: '#00C0C6', flexShrink: 0 }} />
                        <div className="flex-grow-1">
                          <p className="mb-0" style={{ fontSize: '14px', fontWeight: '500', color: '#3B4A66' }}>
                            {getDocumentName(doc)}
                          </p>
                          <div className="d-flex gap-2 mt-1">
                            {doc.category?.name && (
                              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                                Category: {doc.category.name}
                              </span>
                            )}
                            {doc.folder?.title && (
                              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                                Folder: {doc.folder.title}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Selected Count */}
        {selectedDocumentIds.length > 0 && (
          <div className="mt-3 p-2" style={{ backgroundColor: '#E0F2FE', borderRadius: '6px' }}>
            <p className="mb-0" style={{ fontSize: '13px', color: '#0369A1', fontWeight: '500' }}>
              {selectedDocumentIds.length} document{selectedDocumentIds.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #E5E7EB', padding: '1rem 1.5rem' }}>
        <button
          className="btn"
          onClick={onClose}
          style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            color: '#3B4A66',
            fontFamily: 'BasisGrotesquePro',
            fontSize: '14px',
            padding: '6px 16px'
          }}
        >
          Cancel
        </button>
        <button
          className="btn"
          onClick={handleConfirm}
          disabled={selectedDocumentIds.length === 0}
          style={{
            backgroundColor: selectedDocumentIds.length === 0 ? '#D1D5DB' : '#00C0C6',
            border: 'none',
            color: 'white',
            fontFamily: 'BasisGrotesquePro',
            fontWeight: '600',
            fontSize: '14px',
            padding: '6px 20px'
          }}
        >
          Select {selectedDocumentIds.length > 0 ? `(${selectedDocumentIds.length})` : ''}
        </button>
      </Modal.Footer>
    </Modal>
  );
}


