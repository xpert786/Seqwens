import React, { useState, useEffect } from 'react';
import { FileIcon, BlackDateIcon, UpIcon } from "../icons";
import "../../styles/MyDocuments.css";
import { documentsAPI, handleAPIError } from "../../utils/apiUtils";
import { getApiBaseUrl, fetchWithCors } from "../../utils/corsConfig";
import { getAccessToken } from "../../utils/userUtils";
import { toast } from "react-toastify";
import { FaTimes, FaCheckCircle } from "react-icons/fa";
import Pagination from "../Pagination";

export default function DocumentRequests() {
  const [activeCard, setActiveCard] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null); // null = all, 'pending', 'in_progress', etc.
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  });

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    const fetchDocumentRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        const options = {
          status: filterStatus,
          sort_by: '-created_at' // Sort by most recent first
        };

        const response = await documentsAPI.getDocumentRequests(options);

        // Handle new API response structure
        let documentRequests = [];
        let counts = {
          pending: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0
        };

        if (response.success && response.data) {
          // New API structure: response.data.tasks
          if (response.data.tasks && Array.isArray(response.data.tasks)) {
            documentRequests = response.data.tasks;
          }

          // Update status counts from API if available
          if (response.data.status_counts) {
            counts = {
              pending: response.data.pending_count || response.data.status_counts.pending || 0,
              in_progress: response.data.in_progress_count || response.data.status_counts.in_progress || 0,
              completed: response.data.completed_count || response.data.status_counts.completed || 0,
              cancelled: response.data.cancelled_count || response.data.status_counts.cancelled || 0
            };
          }
        } else if (Array.isArray(response)) {
          // Fallback: direct array
          documentRequests = response;
        } else if (response.data && Array.isArray(response.data)) {
          documentRequests = response.data;
        } else if (response.results && Array.isArray(response.results)) {
          documentRequests = response.results;
        } else if (response.document_requests && Array.isArray(response.document_requests)) {
          documentRequests = response.document_requests;
        }

        setDocuments(documentRequests);
        setStatusCounts(counts);
      } catch (err) {
        console.error('Error fetching document requests:', err);
        // If API endpoint doesn't exist yet, return empty array (new taxpayer - clean slate)
        if (err.message.includes('404') || err.message.includes('Not Found')) {
          setDocuments([]);
        } else {
          setError(handleAPIError(err));
          setDocuments([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentRequests();
  }, [filterStatus]);


  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Add all files
    if (selectedFiles.length > 0) {
      setUploadFiles(prev => [...prev, ...selectedFiles]);
    }

    // Reset file input so same file can be selected again if needed
    e.target.value = '';
  };

  // Remove file
  const removeFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle upload
  const handleSubmitDocuments = async () => {
    if (uploadFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    if (!selectedRequest) {
      toast.error('No document request selected');
      return;
    }

    try {
      setUploading(true);
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();

      // Get client_id from the document request
      // API response structure: clients_info: [{ id, name, email }] or clients: [id]
      const clientId = selectedRequest.clients_info?.[0]?.id ||
        selectedRequest.clients?.[0] ||
        selectedRequest.client_id ||
        selectedRequest.taxpayer_id ||
        selectedRequest.taxpayer?.id ||
        selectedRequest.client?.id;

      if (!clientId) {
        throw new Error('Client ID is missing from document request');
      }

      formData.append('client_id', clientId.toString());

      // Add all files
      uploadFiles.forEach(file => {
        formData.append('files', file);
      });

      // Create documents_metadata array - one entry per file
      // Use folder_id from request if available, otherwise null
      const folderId = selectedRequest.folder_id ||
        selectedRequest.folder?.id ||
        null;

      const documentsMetadata = uploadFiles.map(() => ({
        category_id: null, // Can be set if category selection is added
        folder_id: folderId
      }));

      formData.append('documents_metadata', JSON.stringify(documentsMetadata));

      const result = await documentsAPI.uploadDocument(formData);

      if (result.success) {
        toast.success(result.message || 'Documents uploaded successfully!', { position: "top-right", autoClose: 3000 });

        // Refresh document requests list
        const refreshResponse = await documentsAPI.getDocumentRequests({ status: filterStatus, sort_by: '-due_date' });
        if (refreshResponse.success && refreshResponse.data && refreshResponse.data.tasks) {
          setDocuments(refreshResponse.data.tasks);
        }

        // Close modal and reset
        setShowUploadModal(false);
        setSelectedRequest(null);
        setUploadFiles([]);
      } else {
        throw new Error(result.message || 'Failed to upload documents');
      }
    } catch (error) {
      console.error('Error submitting documents:', error);
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg || 'Failed to upload documents', { position: "top-right", autoClose: 5000 });
    } finally {
      setUploading(false);
    }
  };

  // Open upload modal
  const handleUploadClick = (e, request) => {
    e.stopPropagation();
    setSelectedRequest(request);
    setShowUploadModal(true);
    setUploadFiles([]);
  };

  // Close upload modal
  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setSelectedRequest(null);
    setUploadFiles([]);
  };

  // Open submit modal (with upload)
  const handleSubmitRequestClick = (e, request) => {
    e.stopPropagation();
    setSelectedRequest(request);
    setShowUploadModal(true);
    setUploadFiles([]);
  };

  // Submit/Complete document request after uploading
  const handleSubmitDocumentRequest = async () => {
    if (uploadFiles.length === 0) {
      toast.error('Please select at least one file to upload', { position: "top-right", autoClose: 3000 });
      return;
    }

    if (!selectedRequest || !selectedRequest.id) {
      toast.error('No document request selected', { position: "top-right", autoClose: 3000 });
      return;
    }

    try {
      setUploading(true);
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();

      // Add task_id (document request task ID)
      formData.append('task_id', selectedRequest.id.toString());

      // Add all files
      uploadFiles.forEach(file => {
        formData.append('files', file);
      });

      const uploadResult = await documentsAPI.submitDocumentRequest(selectedRequest.id, formData);

      if (uploadResult.success) {
        // API automatically submits the document request, so we just show success
        toast.success(uploadResult.message || 'Documents uploaded and request submitted successfully!', { position: "top-right", autoClose: 3000 });

        // Refresh document requests list
        const refreshResponse = await documentsAPI.getDocumentRequests({ status: filterStatus, sort_by: '-due_date' });
        if (refreshResponse.success && refreshResponse.data && refreshResponse.data.tasks) {
          setDocuments(refreshResponse.data.tasks);
        }

        // Close modal and reset
        setShowUploadModal(false);
        setSelectedRequest(null);
        setUploadFiles([]);
      } else {
        throw new Error(uploadResult.message || 'Failed to upload documents');
      }
    } catch (error) {
      console.error('Error submitting document request:', error);
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg || 'Failed to submit document request', { position: "top-right", autoClose: 5000 });
    } finally {
      setUploading(false);
      setSubmittingRequest(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Calculate overdue days
  const calculateOverdueDays = (dueDate) => {
    if (!dueDate) return 0;
    try {
      const due = new Date(dueDate);
      const today = new Date();
      const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="mydocs-container">
        <div className="mydocs-header">
          <h5 className="mydocs-title">Pending Document Requests</h5>
          <p className="mydocs-subtitle">
            Documents requested by your tax professional
          </p>
        </div>
        <div className="mt-3 text-center py-5">
          <p>Loading document requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mydocs-container">
        <div className="mydocs-header">
          <h5 className="mydocs-title">Pending Document Requests</h5>
          <p className="mydocs-subtitle">
            Documents requested by your tax professional
          </p>
        </div>
        <div className="mt-3 text-center py-5">
          <p className="text-danger">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Pending Requests */}
      <div className="mydocs-container container-fluid px-2 px-md-3">
        {/* Header Section */}
        <div className="mydocs-header pt-3">
          {/* Update: align-items-md-end and justify-content-between handles the split */}
          <div className="d-flex flex-column flex-md-row justify-content-md-between align-items-start align-items-md-center mb-3 gap-3">

      {/* Update: justify-content-md-end keeps buttons on extreme right on desktop */}
      <div className="d-flex gap-2 w-100 w-md-auto overflow-auto pb-1 justify-content-md-end">
        {['All', 'Pending', 'Submitted', 'Completed'].map((label) => {
          const value = label === 'All' ? null : label.toLowerCase();
          return (
            <button
              key={label}
              onClick={() => setFilterStatus(value)}
              className="btn flex-grow-1 flex-md-grow-0"
              style={{
                backgroundColor: filterStatus === value ? "#00C0C6" : "#fff",
                color: filterStatus === value ? "#fff" : "#3B4A66",
                border: "1px solid #E8F0FF",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                padding: "8px 20px", // Increased horizontal padding for better "right-aligned" look
                whiteSpace: "nowrap"
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  </div>

  {/* Document List */}
  {documents.length === 0 ? (
    <div className="mt-3 text-center py-5 bg-white rounded-3 border">
      <h6 className="mb-2" style={{ color: '#3B4A66' }}>No Document Requests</h6>
      <p className="text-muted px-3" style={{ fontSize: '14px' }}>
        Your tax professional will send requests here when needed.
      </p>
    </div>
  ) : (
    <div className="mt-3 d-flex flex-column gap-3">
      {documents
        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        .map((doc, idx) => {
        const overdueDays = calculateOverdueDays(doc.due_date || doc.dueDate);
        const requestedDocs = doc.requested_documents || doc.requestedDocs || doc.requested_docs || [];
        const isActionable = doc.status === 'pending' || !doc.status || doc.status === 'in_progress';

        return (
          <div
            key={doc.id || `doc-${idx}`}
            className={`mydocs-card p-3 shadow-sm bg-white rounded-3 ${activeCard === doc.id ? 'border border-info' : 'border'}`}
            style={{ transition: 'all 0.2s' }}
            onClick={() => setActiveCard(doc.id)}
          >
            {/* Top Row: Title, Status, and Upload Button */}
            <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
              <div className="d-flex align-items-center gap-3 flex-wrap flex-1">
                <span className="mydocs-icon-wrapper flex-shrink-0">
                  <FileIcon />
                </span>
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                    <strong className="mydocs-doc-title" style={{ fontSize: '1rem', color: '#3B4A66' }}>
                      {doc.task_title || doc.title || `${doc.tax_year || ''} Document Request`.trim()}
                    </strong>
                    <div className="d-flex gap-1">
                      {doc.priority && (
                        <span className={`badge-priority-${doc.priority.toLowerCase()}`}>
                          {doc.priority}
                        </span>
                      )}
                      <span className="badge-status">
                        {doc.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                  {overdueDays > 0 && (
                    <span className="badge bg-danger text-white" style={{ fontSize: '10px' }}>
                      Overdue by {overdueDays} day{overdueDays !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {isActionable && (
                <button
                  className="btn btn-upload flex-shrink-0"
                  onClick={(e) => handleSubmitRequestClick(e, doc)}
                >
                  <UpIcon size={18} />
                  <span>Upload</span>
                </button>
              )}
            </div>

            {/* Description */}
            <p className="text-muted mb-3" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              {doc.description || doc.instructions || 'Please upload the requested documents'}
            </p>

            {/* Requested Items Chips */}
            {requestedDocs.length > 0 && (
              <div className="mb-3">
                <small className="fw-bold text-muted d-block mb-2" style={{ fontSize: '12px' }}>Required Documents:</small>
                <div className="d-flex flex-wrap gap-2">
                  {requestedDocs.map((item, idx) => (
                    <span key={idx} className="badge bg-light border text-dark" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '400' }}>
                      {typeof item === 'string' ? item : (item.name || item.document_type || item)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom: Due Date Info */}
            <div className="d-flex align-items-center gap-2 text-muted pt-2 border-top" style={{ fontSize: '13px' }}>
              <BlackDateIcon />
              <span>Due: <strong>{formatDate(doc.due_date || doc.dueDate)}</strong></span>
              <span className="mx-1">|</span>
              <span>Requested by: {doc.created_by_name || doc.requested_by_name || 'System'}</span>
            </div>
          </div>
        );
      })}
      
      {/* Pagination */}
      {documents.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(documents.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          totalItems={documents.length}
          itemsPerPage={itemsPerPage}
          startIndex={(currentPage - 1) * itemsPerPage}
          endIndex={Math.min(currentPage * itemsPerPage, documents.length)}
        />
      )}
    </div>
  )}
</div>

      {/* Upload Modal */}
      {showUploadModal && selectedRequest && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly darker for better focus
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000, // High z-index to stay above headers/footers
            padding: '16px' // Prevents modal from touching screen edges
          }}
          onClick={handleCloseUploadModal}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px', // Softer corners for modern UI
              width: '100%',
              maxWidth: '550px',
              maxHeight: 'calc(100vh - 40px)', // Ensures modal fits inside mobile viewports
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start' // Better for long titles
            }}>
              <div style={{ paddingRight: '12px' }}>
                <h5 style={{ margin: 0, color: '#111827', fontSize: '1.15rem', fontWeight: '700' }}>
                  Submit Request
                </h5>
                <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '13px', lineHeight: '1.4' }}>
                  <strong>{selectedRequest.task_title || 'Document Request'}</strong>
                </p>
              </div>
              <button
                onClick={handleCloseUploadModal}
                style={{
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4B5563',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Modal Body - Scrollable Area */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Select Files <span style={{ color: '#EF4444' }}>*</span>
                </label>

                {/* Enhanced Mobile Input Wrapper */}
                <div style={{
                  border: '2px dashed #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: '#F9FAFB',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  />
                  <div style={{ color: '#6B7280', fontSize: '14px' }}>
                    <span style={{ color: '#F56D2D', fontWeight: '600' }}>Tap to upload</span> or drag and drop
                  </div>
                </div>

                <small style={{ display: 'block', marginTop: '8px', color: '#9CA3AF', fontSize: '12px' }}>
                  Accepted: PDF, JPG, PNG (Max 10MB per file)
                </small>

                {/* Selected File List */}
                {uploadFiles.length > 0 && (
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {uploadFiles.map((file, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          backgroundColor: '#F3F4F6',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB'
                        }}
                      >
                        <span style={{ fontSize: '13px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeFile(index)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                        >
                          <FaTimes size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer - Responsive Stacking */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #F3F4F6',
              display: 'flex',
              flexDirection: window.innerWidth < 576 ? 'flex-column-reverse' : 'row', // logic for stacking on small screens
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#FFFFFF'
            }}>
              {/* CSS workaround for stacking buttons via media queries usually preferred, 
            but for inline styles, we optimize for standard flex flow */}
              <button
                onClick={handleCloseUploadModal}
                disabled={uploading}
                style={{
                  flex: window.innerWidth < 576 ? '1' : 'none',
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '10px',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  minHeight: '48px' // Better touch target
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDocumentRequest}
                disabled={uploading || submittingRequest || uploadFiles.length === 0}
                style={{
                  flex: window.innerWidth < 576 ? '1' : 'none',
                  padding: '12px 24px',
                  backgroundColor: (uploading || submittingRequest || uploadFiles.length === 0) ? '#9CA3AF' : '#32B582',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (uploading || submittingRequest || uploadFiles.length === 0) ? 'not-allowed' : 'pointer',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {uploading || submittingRequest ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <><FaCheckCircle style={{ marginRight: '8px' }} /> Submit</>
                )}
              </button>
            </div>
          </div>
        </div>
<<<<<<< HEAD
      )}
=======
      </div>

      {/* Modal Footer - Responsive Stacking */}
      <div className="modal-footer-container">
        <button
          onClick={handleCloseUploadModal}
          disabled={uploading}
          className="modal-btn-cancel"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmitDocumentRequest}
          disabled={uploading || submittingRequest || uploadFiles.length === 0}
          className="modal-btn-submit"
        >
          {uploading || submittingRequest ? (
             <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            <><FaCheckCircle style={{ marginRight: '8px' }} /> Submit</>
          )}
        </button>
      </div>
    </div>
  </div>
)}
>>>>>>> b6de0f9032f72d8677087a88d5977ac8548b5830
    </div>
  );
}

