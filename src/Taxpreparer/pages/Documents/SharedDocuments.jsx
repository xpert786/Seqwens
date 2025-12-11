import React, { useState, useEffect } from 'react';
import { taxPreparerSharedDocumentsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { FiSearch, FiRefreshCw, FiFile, FiDownload, FiUser, FiCalendar, FiInfo } from 'react-icons/fi';
import { Modal } from 'react-bootstrap';
import PDFViewer from '../../../components/PDFViewer';

const SUPPORTED_PREVIEW_TYPES = new Set(["pdf", "png", "jpg", "jpeg", "gif", "webp"]);

export default function SharedDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchSharedDocuments();
  }, []);

  const fetchSharedDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      
      const response = await taxPreparerSharedDocumentsAPI.getSharedDocuments(params);
      
      if (response.success && response.data) {
        setDocuments(response.data.documents || []);
      } else {
        throw new Error(response.message || 'Failed to fetch shared documents');
      }
    } catch (err) {
      console.error('Error fetching shared documents:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
      toast.error(errorMsg || 'Failed to load shared documents', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchSharedDocuments();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePreview = (doc) => {
    setPreviewDoc(doc);
    setShowPreview(true);
  };

  const handleDownload = async (doc) => {
    try {
      const url = doc.tax_documents;
      if (!url) {
        toast.error('Download URL not available', {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = doc.tax_documents?.split('/').pop() || `document_${doc.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      toast.success('Document downloaded successfully', {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (err) {
      console.error('Error downloading document:', err);
      toast.error('Failed to download document', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const getDocumentName = (doc) => {
    const url = doc.tax_documents || '';
    const fileName = url.split('/').pop() || `Document ${doc.id}`;
    return fileName;
  };

  const getDocumentExtension = (doc) => {
    const name = getDocumentName(doc).toLowerCase();
    const segments = name.split('.');
    return segments.length > 1 ? segments.pop() : 'pdf';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="p-4" style={{ fontFamily: 'BasisGrotesquePro' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-semibold" style={{ color: '#3B4A66' }}>Shared Documents</h3>
          <small className="text-muted">Documents shared with you by your firm</small>
        </div>
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={fetchSharedDocuments}
          style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            color: '#3B4A66',
            fontFamily: 'BasisGrotesquePro'
          }}
        >
          <FiRefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-3 mb-4" style={{ border: '1px solid #E5E7EB' }}>
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
              borderColor: '#E5E7EB'
            }}
          />
        </div>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: '#6B7280' }}>Loading shared documents...</p>
        </div>
      ) : error && documents.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-danger mb-3">{error}</p>
          <button
            onClick={fetchSharedDocuments}
            className="btn"
            style={{
              backgroundColor: '#00C0C6',
              color: 'white',
              border: 'none',
              fontFamily: 'BasisGrotesquePro'
            }}
          >
            Retry
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-lg p-4" style={{ border: '1px solid #E5E7EB' }}>
          <FiFile size={48} style={{ color: '#D1D5DB', marginBottom: '16px' }} />
          <p style={{ color: '#6B7280', fontSize: '16px', marginBottom: '8px' }}>
            No shared documents found
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
            {searchQuery
              ? 'Try adjusting your search'
              : 'Documents shared with you by your firm will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4" style={{ border: '1px solid #E5E7EB' }}>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Document</th>
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Category</th>
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Folder</th>
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Shared By</th>
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Notes</th>
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Shared At</th>
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const ext = getDocumentExtension(doc);
                  const canPreview = SUPPORTED_PREVIEW_TYPES.has(ext);
                  
                  return (
                    <tr key={doc.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <FiFile size={18} style={{ color: '#00C0C6' }} />
                          <span style={{ color: '#3B4A66', fontWeight: '500', fontSize: '14px' }}>
                            {getDocumentName(doc)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: '#6B7280', fontSize: '14px' }}>
                          {doc.category?.name || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#6B7280', fontSize: '14px' }}>
                          {doc.folder?.title || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <FiUser size={14} style={{ color: '#6B7280' }} />
                          <span style={{ color: '#6B7280', fontSize: '14px' }}>
                            {doc.shared_info?.shared_by?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: '#6B7280', fontSize: '14px' }}>
                          {doc.shared_info?.notes || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <FiCalendar size={14} style={{ color: '#6B7280' }} />
                          <span style={{ color: '#6B7280', fontSize: '14px' }}>
                            {formatDate(doc.shared_info?.shared_at)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm"
                            onClick={() => handleDownload(doc)}
                            style={{
                              backgroundColor: '#F9FAFB',
                              border: '1px solid #E5E7EB',
                              color: '#3B4A66',
                              padding: '4px 8px'
                            }}
                            title="Download"
                          >
                            <FiDownload size={14} />
                          </button>
                          {canPreview && (
                            <button
                              className="btn btn-sm"
                              onClick={() => handlePreview(doc)}
                              style={{
                                backgroundColor: '#F9FAFB',
                                border: '1px solid #E5E7EB',
                                color: '#3B4A66',
                                padding: '4px 8px'
                              }}
                              title="Preview"
                            >
                              <FiFile size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {documents.length > 0 && (
        <div className="mt-4 text-center" style={{ color: '#6B7280', fontSize: '14px' }}>
          Showing {documents.length} shared document{documents.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        size="xl"
        centered
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600' }}>
            {previewDoc && getDocumentName(previewDoc)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          {previewDoc && (
            <PDFViewer
              pdfUrl={previewDoc.tax_documents}
              height="600px"
              showThumbnails={true}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

