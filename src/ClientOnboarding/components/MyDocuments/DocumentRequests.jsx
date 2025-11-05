import React, { useState, useEffect } from 'react';
import { FileIcon, BlackDateIcon, OverIcon, UpIcon } from "../icons";
import "../../styles/MyDocuments.css";
import { documentsAPI, handleAPIError } from "../../utils/apiUtils";

export default function DocumentRequests() {
  const [activeCard, setActiveCard] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocumentRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await documentsAPI.getDocumentRequests();
        
        // Handle different response structures
        let documentRequests = [];
        if (Array.isArray(response)) {
          documentRequests = response;
        } else if (response.data && Array.isArray(response.data)) {
          documentRequests = response.data;
        } else if (response.results && Array.isArray(response.results)) {
          documentRequests = response.results;
        } else if (response.document_requests && Array.isArray(response.document_requests)) {
          documentRequests = response.document_requests;
        }
        
        // Filter to only show requests for current taxpayer
        // The API should already filter by authenticated user, but we add an extra safety check
        setDocuments(documentRequests);
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
  }, []);

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
          <h5 className="mydocs-title">Pending Document Requests</h5>
          <p className="mydocs-subtitle">
            Documents requested by your tax professional
          </p>
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
                          {doc.tax_year || doc.year} {doc.document_type || doc.type || 'Document Request'}
                        </strong>

                        {doc.priority && (
                          <span className="badge mydocs-badge-priority">
                            {doc.priority}
                          </span>
                        )}
                        <span className="badge mydocs-badge-status">
                          {doc.status || 'Pending'}
                        </span>
                      </div>

                      <button className="btn btn-sm mydocs-upload-btn d-flex align-items-center gap-2">
                        <UpIcon />
                        Upload
                      </button>

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
                        {(doc.requested_by || doc.requestedBy || doc.requested_by_name) && (
                          <span className="ms-2">
                            <strong className="fw-normal">Requested by:</strong> {doc.requested_by || doc.requestedBy || doc.requested_by_name}
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
                        <OverIcon /> Overdue by {overdueDays} day{overdueDays !== 1 ? 's' : ''}
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
    </div>
  );
}

