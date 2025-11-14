import React, { useState, useEffect } from 'react';
import { FileIcon, BlackDateIcon, UpIcon } from "../icons";
import "../../styles/MyDocuments.css";
import { documentsAPI, handleAPIError } from "../../utils/apiUtils";
import { toast } from "react-toastify";
import { FaTimes } from "react-icons/fa";

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

  useEffect(() => {
    const fetchDocumentRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const options = {
          status: filterStatus,
          sort_by: '-due_date' // Sort by due date descending
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
    
    // Filter only PDF files
    const pdfFiles = selectedFiles.filter(file => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      return fileName.endsWith('.pdf') || fileType === 'application/pdf';
    });

    // Show error for non-PDF files
    const nonPdfFiles = selectedFiles.filter(file => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      return !fileName.endsWith('.pdf') && fileType !== 'application/pdf';
    });

    if (nonPdfFiles.length > 0) {
      toast.error(`Only PDF files are allowed. ${nonPdfFiles.length} non-PDF file(s) were ignored.`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }

    // Only add PDF files
    if (pdfFiles.length > 0) {
      setUploadFiles(prev => [...prev, ...pdfFiles]);
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

    try {
      setUploading(true);

      const formData = new FormData();
      
      // Add all files
      uploadFiles.forEach(file => {
        formData.append('files', file);
      });


      const response = await documentsAPI.submitDocumentRequest(selectedRequest.id, formData);

      if (response.success) {
        toast.success(response.message || 'Documents submitted successfully!');
        
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
        throw new Error(response.message || 'Failed to submit documents');
      }
    } catch (error) {
      console.error('Error submitting documents:', error);
      toast.error(handleAPIError(error));
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
      <div className="mydocs-container">
        <div className="mydocs-header">
          <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap">
            <div>
              <h5 className="mydocs-title">Document Requests</h5>
              <p className="mydocs-subtitle">
                Documents requested by your tax professional
              </p>
            </div>
            
            {/* Filter Buttons */}
            <div className="d-flex gap-2 flex-wrap mt-2 mt-md-0">
              <button
                onClick={() => setFilterStatus(null)}
                className="btn btn-sm"
                style={{
                  backgroundColor: filterStatus === null ? "#00C0C6" : "#fff",
                  color: filterStatus === null ? "#fff" : "#3B4A66",
                  border: "1px solid #E8F0FF",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "500",
                  padding: "6px 12px"
                }}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className="btn btn-sm"
                style={{
                  backgroundColor: filterStatus === 'pending' ? "#00C0C6" : "#fff",
                  color: filterStatus === 'pending' ? "#fff" : "#3B4A66",
                  border: "1px solid #E8F0FF",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "500",
                  padding: "6px 12px"
                }}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterStatus('in_progress')}
                className="btn btn-sm"
                style={{
                  backgroundColor: filterStatus === 'in_progress' ? "#00C0C6" : "#fff",
                  color: filterStatus === 'in_progress' ? "#fff" : "#3B4A66",
                  border: "1px solid #E8F0FF",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "500",
                  padding: "6px 12px"
                }}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className="btn btn-sm"
                style={{
                  backgroundColor: filterStatus === 'completed' ? "#00C0C6" : "#fff",
                  color: filterStatus === 'completed' ? "#fff" : "#3B4A66",
                  border: "1px solid #E8F0FF",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "500",
                  padding: "6px 12px"
                }}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="mt-3 text-center py-5">
            <h6 className="mb-2" style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>
              No Document Requests
            </h6>
            <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>
              You don't have any pending document requests at this time. Your tax professional will send you requests when needed.
            </p>
          </div>
        ) : (
          <div className="mt-3">
            {documents.map((doc) => {
              const overdueDays = calculateOverdueDays(doc.due_date || doc.dueDate);
              const requestedDocs = doc.requested_documents || doc.requestedDocs || doc.requested_docs || [];
              
              return (
              <div
                key={doc.id || doc.request_id || `doc-${documents.indexOf(doc)}`}
                className={`mydocs-card ${activeCard === doc.id ? 'active' : ''}`}
                onClick={() => setActiveCard(doc.id)}
              >
                <div className="d-flex justify-content-between align-items-start w-100">
                  <div className="w-100">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-3">
                        <span className="mydocs-icon-wrapper">
                          <FileIcon />
                        </span>

                        <strong className="mydocs-doc-title">
                          {doc.task_title || doc.title || `${doc.tax_year || doc.year || ''} ${doc.document_type || doc.type || 'Document Request'}`.trim()}
                        </strong>

                        {doc.priority && (() => {
                          const priorityLower = (doc.priority || '').toLowerCase();
                          const priorityColors = {
                            'high': { bg: '#EF4444', color: '#FFFFFF' },
                            'medium': { bg: '#F59E0B', color: '#FFFFFF' },
                            'low': { bg: '#10B981', color: '#FFFFFF' }
                          };
                          const colors = priorityColors[priorityLower] || { bg: '#6B7280', color: '#FFFFFF' };
                          return (
                            <span
                              className="badge"
                              style={{
                                backgroundColor: colors.bg,
                                color: colors.color,
                                fontSize: "10px",
                                fontWeight: "700",
                                textTransform: "uppercase",
                                lineHeight: "1",
                                height: "20px",
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "3px 9px",
                                borderRadius: "20px",
                                border: "none"
                              }}
                            >
                              {doc.priority}
                            </span>
                          );
                        })()}
                        <span className="badge mydocs-badge-status">
                          {doc.status || 'Pending'}
                        </span>
                      </div>

                      {(doc.status === 'pending' || !doc.status) && (
                        <button 
                          className="btn btn-sm mydocs-upload-btn d-flex align-items-center gap-2"
                          onClick={(e) => handleUploadClick(e, doc)}
                        >
                          <UpIcon />
                          Upload
                        </button>
                      )}

                    </div>

                    <div className="mydocs-description">
                      {doc.description || doc.instructions || doc.message || 'Please upload the requested documents'}
                    </div>

                    <div className="d-flex flex-wrap mb-1 mydocs-info">
                      <div className="d-flex align-items-center">
                        <BlackDateIcon />
                        {(doc.due_date || doc.dueDate) && (
                          <span className="ms-2">
                            <strong className="fw-normal">Due:</strong> {formatDate(doc.due_date || doc.dueDate)}
                          </span>
                        )}
                        {(doc.created_by_name || doc.requested_by || doc.requestedBy || doc.requested_by_name) && (
                          <span className="ms-2">
                            <strong className="fw-normal">Requested by:</strong> {doc.created_by_name || doc.requested_by || doc.requestedBy || doc.requested_by_name}
                          </span>
                        )}
                        {doc.reminders_count !== undefined && (
                          <span className="ms-2 mydocs-reminder">
                            {doc.reminders_count || doc.reminders || 0} reminder{doc.reminders_count !== 1 ? 's' : ''} sent
                          </span>
                        )}
                      </div>
                    </div>

                    {overdueDays > 0 && (
                      <div className="mydocs-overdue">
                        Overdue by {overdueDays} day{overdueDays !== 1 ? 's' : ''}
                      </div>
                    )}

                    {(doc.instructions || doc.description) && (
                      <div className="mydocs-instructions">
                        <span className="mydocs-instructions-title">Instructions:</span>
                        <p className="mydocs-instructions-text">{doc.instructions || doc.description}</p>
                      </div>
                    )}

                    {requestedDocs.length > 0 && (
                      <div>
                        <strong className="mydocs-req-title">Requested Documents:</strong>
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          {requestedDocs.map((item, idx) => (
                            <div key={idx} className="mydocs-req-chip">
                              {typeof item === 'string' ? item : (item.name || item.document_type || item)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050
          }}
          onClick={handleCloseUploadModal}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h5 style={{ margin: 0, color: '#111827', fontSize: '18px', fontWeight: '600' }}>
                  Upload Documents
                </h5>
                <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '14px' }}>
                  {selectedRequest.task_title || 'Document Request'}
                </p>
              </div>
              <button
                onClick={handleCloseUploadModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#6B7280',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* File Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Select Files <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                />
                <small style={{ 
                  display: 'block', 
                  marginTop: '6px', 
                  color: '#6B7280', 
                  fontSize: '12px' 
                }}>
                  Only PDF files are allowed
                </small>
                {uploadFiles.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    {uploadFiles.map((file, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '6px',
                          marginBottom: '6px'
                        }}
                      >
                        <span style={{ fontSize: '14px', color: '#374151' }}>{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '4px 8px'
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={handleCloseUploadModal}
                disabled={uploading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDocuments}
                disabled={uploading || uploadFiles.length === 0}
                style={{
                  padding: '10px 20px',
                  backgroundColor: uploading || uploadFiles.length === 0 ? '#9CA3AF' : '#FF7A2F',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: uploading || uploadFiles.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? 'Uploading...' : 'Submit Documents'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

