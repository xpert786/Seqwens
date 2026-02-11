import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { taxPreparerFirmSharedAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { FiUpload, FiDownload, FiTrash2, FiSearch, FiFilter, FiFolder, FiFile, FiRefreshCw, FiChevronRight } from 'react-icons/fi';
import { Modal } from 'react-bootstrap';

const SUPPORTED_PREVIEW_TYPES = new Set(["pdf", "png", "jpg", "jpeg", "gif", "webp"]);

export default function FirmSharedDocuments() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadComment, setUploadComment] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (selectedFolderId) params.folder_id = selectedFolderId;
      if (selectedCategoryId) params.category_id = selectedCategoryId;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (showArchived) params.is_archived = true;

      const response = await taxPreparerFirmSharedAPI.getFirmSharedDocuments(params);

      if (response.success && response.data) {
        setDocuments(response.data.documents || []);
      } else {
        throw new Error(response.message || 'Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error fetching firm-shared documents:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
      toast.error(errorMsg || 'Failed to load firm-shared documents', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch folders
  const fetchFolders = async () => {
    try {
      const params = {};
      if (currentFolder) {
        params.parent_id = currentFolder.id;
      } else {
        params.parent_id = null;
      }

      const response = await taxPreparerFirmSharedAPI.getFirmSharedFolders(params);

      if (response.success && response.data) {
        setFolders(response.data.folders || []);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await taxPreparerFirmSharedAPI.getFirmSharedCategories();

      if (response.success && response.data) {
        setCategories(response.data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedFolderId, selectedCategoryId, searchQuery, showArchived]);

  useEffect(() => {
    fetchFolders();
  }, [currentFolder]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle folder navigation
  const handleFolderClick = (folder) => {
    setCurrentFolder(folder);
    setSelectedFolderId(folder.id);
    setBreadcrumbs(prev => [...prev, folder]);
  };

  // Handle breadcrumb click
  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      // Root
      setCurrentFolder(null);
      setSelectedFolderId(null);
      setBreadcrumbs([]);
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      const targetFolder = newBreadcrumbs[newBreadcrumbs.length - 1];
      setBreadcrumbs(newBreadcrumbs);
      setCurrentFolder(targetFolder);
      setSelectedFolderId(targetFolder.id);
    }
  };

  // Handle document preview
  const handlePreview = (doc) => {
    setPreviewDoc(doc);
    setShowPreview(true);
  };

  // Handle download
  const handleDownload = async (doc) => {
    try {
      const blob = await taxPreparerFirmSharedAPI.downloadFirmSharedDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.tax_documents?.split('/').pop() || `document_${doc.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Document downloaded successfully', {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (err) {
      console.error('Error downloading document:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to download document', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Handle delete
  const handleDeleteClick = (doc) => {
    setDocToDelete(doc);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;

    try {
      setDeletingDocId(docToDelete.id);
      const response = await taxPreparerFirmSharedAPI.deleteFirmSharedDocument(docToDelete.id);

      if (response.success) {
        toast.success('Document deleted successfully', {
          position: "top-right",
          autoClose: 2000,
        });
        fetchDocuments();
      } else {
        throw new Error(response.message || 'Failed to delete document');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to delete document', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setDeletingDocId(null);
      setShowDeleteConfirm(false);
      setDocToDelete(null);
    }
  };

  // Handle upload
  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed', {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setUploading(true);
      // Upload file with optional comment
      const response = await taxPreparerFirmSharedAPI.uploadFirmSharedDocument(
        uploadFile,
        null, // folderId
        null, // categoryId
        uploadComment || null // comment
      );

      if (response.success) {
        toast.success('File uploaded successfully', {
          position: "top-right",
          autoClose: 2000,
        });
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadComment('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchDocuments();
      } else {
        throw new Error(response.message || 'Failed to upload file');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to upload file', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setUploading(false);
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

  const getStatusBadgeClass = (status) => {
    const normalized = status?.toString().toLowerCase();
    if (!normalized) return 'bg-secondary';
    if (normalized.includes('archived') || normalized.includes('inactive')) return 'bg-secondary';
    if (normalized.includes('pending') || normalized.includes('review')) return 'bg-warning text-dark';
    if (normalized.includes('error') || normalized.includes('fail') || normalized.includes('reject')) return 'bg-danger';
    return 'bg-success';
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

  return (
    <div className="p-4" style={{ fontFamily: 'BasisGrotesquePro' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-semibold" style={{ color: '#3B4A66' }}>Firm Shared Documents</h3>
          <small className="text-muted">Access and manage documents shared by your firm</small>
        </div>
        <div className="d-flex gap-2">

          <button
            className="btn d-flex align-items-center gap-2"
            onClick={fetchDocuments}
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
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-3 mb-4" style={{ border: '1px solid #E5E7EB' }}>
        <div className="row g-3">
          <div className="col-md-4">
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
                  fontFamily: 'BasisGrotesquePro',
                  borderColor: '#E5E7EB'
                }}
              />
            </div>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={selectedFolderId || ''}
              onChange={(e) => setSelectedFolderId(e.target.value || null)}
              style={{
                fontFamily: 'BasisGrotesquePro',
                borderColor: '#E5E7EB'
              }}
            >
              <option value="">All Folders</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.title}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={selectedCategoryId || ''}
              onChange={(e) => setSelectedCategoryId(e.target.value || null)}
              style={{
                fontFamily: 'BasisGrotesquePro',
                borderColor: '#E5E7EB'
              }}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="showArchived"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label className="form-check-label" htmlFor="showArchived" style={{ cursor: 'pointer' }}>
                Show Archived
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="mb-3">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              className="btn  text-primary p-0 border-0 bg-transparent"
              onClick={() => handleBreadcrumbClick(-1)}
              style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
            >
              <FiFolder size={14} className="me-1" />
              Root
            </button>
            {breadcrumbs.map((breadcrumb, idx) => (
              <React.Fragment key={idx}>
                <FiChevronRight size={14} style={{ color: '#6B7280' }} />
                <button
                  className="btn  text-primary p-0 border-0 bg-transparent"
                  onClick={() => handleBreadcrumbClick(idx)}
                  style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
                >
                  {breadcrumb.title}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: '#6B7280' }}>Loading documents...</p>
        </div>
      ) : error && documents.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-danger mb-3">{error}</p>
          <button
            onClick={fetchDocuments}
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
        <div className="d-flex flex-column align-items-center justify-content-center py-5 bg-white rounded-lg p-4" style={{ border: '1px solid #E5E7EB' }}>
          <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
            <FiFile size={24} style={{ color: '#D1D5DB' }} />
            <p style={{ color: '#6B7280', fontSize: '16px', margin: 0 }}>
              No documents found
            </p>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
            {searchQuery || selectedFolderId || selectedCategoryId
              ? 'Try adjusting your filters'
              : 'Upload documents to get started'}
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
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Status</th>
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Pages</th>
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Created</th>
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
                          <span
                            style={{
                              color: canPreview ? '#00C0C6' : '#3B4A66',
                              cursor: canPreview ? 'pointer' : 'default',
                              textDecoration: canPreview ? 'underline' : 'none'
                            }}
                            onClick={() => canPreview && handlePreview(doc)}
                          >
                            {getDocumentName(doc)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: '#6B7280' }}>
                          {doc.category?.name || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#6B7280' }}>
                          {doc.folder?.title || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(doc.status)}`}>
                          {doc.status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#6B7280' }}>
                          {doc.total_pages || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#6B7280' }}>
                          {formatDate(doc.created_at)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn "
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
                              className="btn "
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
                          <button
                            className="btn "
                            onClick={() => handleDeleteClick(doc)}
                            disabled={deletingDocId === doc.id}
                            style={{
                              backgroundColor: '#F9FAFB',
                              border: '1px solid #E5E7EB',
                              color: '#EF4444',
                              padding: '4px 8px'
                            }}
                            title="Delete"
                          >
                            {deletingDocId === doc.id ? (
                              <div className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            ) : (
                              <FiTrash2 size={14} />
                            )}
                          </button>
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

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600' }}>
            Upload Firm Shared Document
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontFamily: 'BasisGrotesquePro' }}>
          <div className="mb-3">
            <label className="form-label">File (PDF only) <span className="text-danger">*</span></label>
            <input
              ref={fileInputRef}
              type="file"
              className="form-control"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
            />
            {uploadFile && (
              <small className="text-muted mt-1 d-block">
                Selected: {uploadFile.name}
              </small>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Comment (Optional)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Add a comment about this document..."
              value={uploadComment}
              onChange={(e) => setUploadComment(e.target.value)}
              style={{
                resize: 'vertical',
                fontFamily: 'BasisGrotesquePro'
              }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => setShowUploadModal(false)}
            disabled={uploading}
            style={{ fontFamily: 'BasisGrotesquePro' }}
          >
            Cancel
          </button>
          <button
            className="btn"
            onClick={handleUpload}
            disabled={uploading || !uploadFile}
            style={{
              backgroundColor: '#00C0C6',
              color: 'white',
              border: 'none',
              fontFamily: 'BasisGrotesquePro'
            }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </Modal.Footer>
      </Modal>

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
        <Modal.Body style={{ padding: 0, minHeight: '70vh' }}>
          {previewDoc && previewDoc.tax_documents ? (
            <iframe
              src={getProxyUrl(previewDoc.tax_documents)}
              style={{
                width: '100%',
                height: '70vh',
                border: 'none',
                minHeight: '600px'
              }}
              title={getDocumentName(previewDoc)}
            />
          ) : (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
              <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro' }}>
                No document available for preview.
              </p>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600' }}>
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontFamily: 'BasisGrotesquePro' }}>
          <p>Are you sure you want to delete this document?</p>
          <p className="text-muted small">
            {docToDelete && getDocumentName(docToDelete)}
          </p>
          <p className="text-danger small">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => setShowDeleteConfirm(false)}
            style={{ fontFamily: 'BasisGrotesquePro' }}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={confirmDelete}
            disabled={deletingDocId !== null}
            style={{ fontFamily: 'BasisGrotesquePro' }}
          >
            {deletingDocId !== null ? 'Deleting...' : 'Delete'}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

