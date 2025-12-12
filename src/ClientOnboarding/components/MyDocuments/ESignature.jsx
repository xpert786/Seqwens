import React, { useState, useRef, useEffect } from 'react';
import { FaEye, } from "react-icons/fa";
import { Modal } from 'react-bootstrap';
import "../../styles/Popup.css";
import "../../styles/Esignpop.css"
import ESignatureModal from "../../components/ESignatureModal";
import page1Image from "../../../assets/page1.png";
import page2Image from "../../../assets/page2.png";
import page3Image from "../../../assets/page3.png";
import page4Image from "../../../assets/page4.png";
import { signatureRequestsAPI, handleAPIError } from "../../utils/apiUtils";
import { toast } from "react-toastify";
import PDFViewer from "../../../components/PDFViewer";

import { FileIcon, ProfileIcon, LegalIcon, SignatureIcon, DateIcon, InitialIcon, CompletedIcon, AwaitingIcon, Sign2WhiteIcon } from "../icons";
import Pagination from "../Pagination";

export default function ESignature() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [signatureRequests, setSignatureRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    sent: 0,
    viewed: 0,
    signed: 0,
    completed: 0,
    cancelled: 0
  });
  const [filterStatus, setFilterStatus] = useState(null); // null = all, 'pending', 'sent', etc.
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const [previewPages] = useState([
    { id: 1, image: page1Image },
    { id: 2, image: page2Image },
    { id: 3, image: page3Image },
    { id: 4, image: page4Image },
  ]);

  const highlights = [
    {
      page: 0,
      top: "20%",
      left: "35%",
      width: "120px",
      height: "20px",
      text: "Movement Feedback"
    }
  ];

  // Fetch signature requests from API
  useEffect(() => {
    const fetchSignatureRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const options = {
          status: filterStatus,
          activeOnly: showActiveOnly,
          expiredOnly: showExpiredOnly
        };
        
        const response = await signatureRequestsAPI.getSignatureRequests(options);
        
        // Handle API response structure
        let requests = [];
        let counts = {
          pending: 0,
          sent: 0,
          viewed: 0,
          signed: 0,
          completed: 0,
          cancelled: 0
        };
        
        if (response.success && response.data) {
          if (response.data.requests && Array.isArray(response.data.requests)) {
            requests = response.data.requests;
          }
          
          // Update status counts from API if available
          if (response.data.status_counts) {
            counts = {
              pending: response.data.pending_count || response.data.status_counts.pending || 0,
              sent: response.data.sent_count || response.data.status_counts.sent || 0,
              viewed: response.data.viewed_count || response.data.status_counts.viewed || 0,
              signed: response.data.signed_count || response.data.status_counts.signed || 0,
              completed: response.data.completed_count || response.data.status_counts.completed || 0,
              cancelled: response.data.cancelled_count || response.data.status_counts.cancelled || 0
            };
          }
        } else if (Array.isArray(response)) {
          requests = response;
        } else if (response.data && Array.isArray(response.data)) {
          requests = response.data;
        }
        
        setSignatureRequests(requests);
        setStatusCounts(counts);
      } catch (err) {
        console.error('Error fetching signature requests:', err);
        setError(handleAPIError(err));
        setSignatureRequests([]);
        toast.error('Failed to load signature requests', {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSignatureRequests();
  }, [filterStatus, showActiveOnly, showExpiredOnly]);

  const handleHighlightClick = (highlight) => {
    const newMarker = {
      id: Date.now(),
      page: highlight.page,
      top: highlight.top,
      left: `calc(${highlight.left} + ${highlight.width} + 5px)`,
      comment: ""
    };
    setMarkers((prev) => [...prev, newMarker]);
  };

  const handleSaveComment = () => {
    if (selectedMarker !== null) {
      setMarkers((prev) =>
        prev.map((m) =>
          m.id === selectedMarker ? { ...m, comment: commentText } : m
        )
      );
      setCommentText("");
      setSelectedMarker(null);
    }
  };

  // Calculate statistics - use API counts if available, otherwise calculate from current requests
  const calculateStatistics = () => {
    // If we have status counts from API, use those (they reflect all requests, not just filtered)
    if (statusCounts.pending > 0 || statusCounts.sent > 0 || statusCounts.completed > 0) {
      return {
        pending: statusCounts.pending,
        completed: statusCounts.completed + statusCounts.signed,
        awaiting: statusCounts.sent + statusCounts.viewed
      };
    }
    
    // Fallback: calculate from current filtered requests
    const pending = signatureRequests.filter(req => req.status === 'pending').length;
    const completed = signatureRequests.filter(req => req.status === 'completed' || req.status === 'signed').length;
    const awaiting = signatureRequests.filter(req => req.status === 'sent' || req.status === 'viewed').length;
    
    return {
      pending: pending,
      completed: completed,
      awaiting: awaiting
    };
  };

  const stats = calculateStatistics();

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, showActiveOnly, showExpiredOnly]);

  // Pagination for signature requests
  const totalPages = Math.ceil(signatureRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, signatureRequests.length);
  const paginatedRequests = signatureRequests.slice(startIndex, endIndex);

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

  // Get status display text
  const getStatusDisplay = (status) => {
    const statusMap = {
      'pending': 'Signature Required',
      'sent': 'Sent',
      'viewed': 'Viewed',
      'completed': 'Completed',
      'signed': 'Signed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status || 'Pending';
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    const colorMap = {
      'pending': { bg: '#FFF4E6', color: '#F49C2D', border: '#F49C2D' },
      'sent': { bg: '#E0F2FE', color: '#0369A1', border: '#0369A1' },
      'viewed': { bg: '#DBEAFE', color: '#1E40AF', border: '#1E40AF' },
      'completed': { bg: '#D1FAE5', color: '#065F46', border: '#065F46' },
      'signed': { bg: '#D1FAE5', color: '#065F46', border: '#065F46' },
      'cancelled': { bg: '#FEE2E2', color: '#991B1B', border: '#991B1B' }
    };
    return colorMap[status] || { bg: '#F3F4F6', color: '#6B7280', border: '#6B7280' };
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority) => {
    if (!priority) return null;
    const priorityLower = priority.toLowerCase();
    const colorMap = {
      'high': { bg: '#EF4444', color: '#FFFFFF' },
      'medium': { bg: '#F59E0B', color: '#FFFFFF' },
      'low': { bg: '#10B981', color: '#FFFFFF' }
    };
    return colorMap[priorityLower] || { bg: '#6B7280', color: '#FFFFFF' };
  };

  const cardData = [
    { label: "Pending Signature", icon: <SignatureIcon />, count: stats.pending, color: "#00bcd4" },
    { label: "Completed", icon: <CompletedIcon />, count: stats.completed, color: "#4caf50" },
    { label: "Awaiting others", icon: <AwaitingIcon />, count: stats.awaiting, color: "#3f51b5" },
  ];

  return (
    <div style={{ backgroundColor: "#F5F9FF", minHeight: "100vh" }}>
      {/* Cards Row */}
      <div className="row g-3 mb-3">
        {cardData.map((item, index) => (
          <div className="col-md-4" key={index}>
            <div
              className="bg-white rounded p-3 d-flex flex-column justify-content-between"
              style={{ borderRadius: "12px", height: "130px" }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "32px",
                    height: "32px",
                    color: item.color,
                    fontSize: "16px",
                  }}
                >
                  {item.icon}
                </div>
                <div
                  className="px-3 py-1 rounded text-dark fw-bold"
                  style={{

                    minWidth: "38px",
                    textAlign: "center",
                  }}
                >
                  {item.count}
                </div>
              </div>
              <div className="mt-2">
                <p className="mb-0 text-muted small fw-semibold">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded">
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap">
          <div>
            <h5
              className="mb-0 me-3"
              style={{
                color: "#3B4A66",
                fontSize: "20px",
                fontWeight: "500",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              E-Signature Requests
            </h5>
            <p
              className="mb-0 mt-1"
              style={{
                color: "#4B5563",
                fontSize: "14px",
                fontWeight: "400",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              Documents requiring your electronic signature
            </p>
          </div>
          
          {/* Filter Buttons */}
          <div className="d-flex gap-2 flex-wrap mt-2 mt-md-0">
            <button
              onClick={() => {
                setFilterStatus(null);
                setShowActiveOnly(false);
                setShowExpiredOnly(false);
              }}
              className="btn btn-sm"
              style={{
                backgroundColor: filterStatus === null && !showActiveOnly && !showExpiredOnly ? "#00C0C6" : "#fff",
                color: filterStatus === null && !showActiveOnly && !showExpiredOnly ? "#fff" : "#3B4A66",
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
              onClick={() => {
                setFilterStatus('pending');
                setShowActiveOnly(false);
                setShowExpiredOnly(false);
              }}
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
              onClick={() => {
                setFilterStatus(null);
                setShowActiveOnly(true);
                setShowExpiredOnly(false);
              }}
              className="btn btn-sm"
              style={{
                backgroundColor: showActiveOnly ? "#00C0C6" : "#fff",
                color: showActiveOnly ? "#fff" : "#3B4A66",
                border: "1px solid #E8F0FF",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "500",
                padding: "6px 12px"
              }}
            >
              Active
            </button>
            <button
              onClick={() => {
                setFilterStatus(null);
                setShowActiveOnly(false);
                setShowExpiredOnly(true);
              }}
              className="btn btn-sm"
              style={{
                backgroundColor: showExpiredOnly ? "#00C0C6" : "#fff",
                color: showExpiredOnly ? "#fff" : "#3B4A66",
                border: "1px solid #E8F0FF",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "500",
                padding: "6px 12px"
              }}
            >
              Expired
            </button>
          </div>
        </div>



        {loading ? (
          <div className="text-center py-5">
            <p>Loading signature requests...</p>
          </div>
        ) : error ? (
          <div className="text-center py-5">
            <p className="text-danger">{error}</p>
          </div>
        ) : signatureRequests.length === 0 ? (
          <div className="text-center py-5">
            <h6 className="mb-2" style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>
              No Signature Requests
            </h6>
            <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>
              You don't have any pending signature requests at this time.
            </p>
          </div>
        ) : (
          <>
            {paginatedRequests.map((request, index) => {
              const statusColors = getStatusBadgeColor(request.status);
              const originalIndex = startIndex + index;
              const selectedRequest = signatureRequests[selectedIndex];
              
              return (
                <div
                  key={request.id || originalIndex}
                  onClick={() => setSelectedIndex(originalIndex)}
                className="p-3 rounded  d-flex justify-content-between align-items-center flex-wrap mb-3 cursor-pointer"
                style={{
                  backgroundColor: selectedIndex === originalIndex ? "#FFF4E6" : "#fff",
                  border: selectedIndex === originalIndex ? "1px solid #F49C2D" : "1px solid #eee",
                  transition: "background-color 0.2s ease, border-color 0.2s ease",
                }}
              >
                <div className="d-flex align-items-start gap-3 flex-grow-1">
                  <span className="mydocs-icon">
                    <FileIcon />
                  </span>

                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <div className="fw-semibold">{request.title || request.document_name || 'Signature Request'}</div>
                      {(request.task_info?.priority || request.priority) && (() => {
                        const priority = request.task_info?.priority || request.priority;
                        const priorityColors = getPriorityBadgeColor(priority);
                        return priorityColors ? (
                          <span
                            className="d-inline-block px-2 py-1 rounded"
                            style={{
                              backgroundColor: priorityColors.bg,
                              color: priorityColors.color,
                              fontSize: "10px",
                              fontWeight: "700",
                              textTransform: "uppercase",
                              lineHeight: "1",
                              height: "20px",
                              display: "inline-flex",
                              alignItems: "center"
                            }}
                          >
                            {priority}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    {request.description && (
                      <div className="small text-muted mb-1">{request.description}</div>
                    )}
                    <div className="small text-muted">
                      {request.created_at && `Created on ${formatDate(request.created_at)}`}
                      {request.requested_by_name && ` · Requested by ${request.requested_by_name}`}
                      {request.expires_at && ` · Expires ${formatDate(request.expires_at)}`}
                    </div>
                    
                    <div className="d-flex align-items-center gap-2 mt-2">
                      <span
                        className="d-inline-block px-3 py-1 rounded-pill"
                        style={{
                          backgroundColor: statusColors.bg,
                          color: statusColors.color,
                          fontSize: "12px",
                          fontWeight: "500",
                          border: `1px solid ${statusColors.border}`
                        }}
                      >
                        {request.status_display || getStatusDisplay(request.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-4 mt-3 mt-md-0">
                  {request.document_url && (
                    <button
                      className="btn d-flex align-items-center gap-2 rounded btn-preview-trigger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIndex(originalIndex);
                        setShowPreviewModal(true);
                      }}
                    >
                      <FaEye size={14} className="icon-eye" />
                      Preview
                    </button>
                  )}

                  {(request.status === 'pending' || request.status === 'sent' || request.status === 'viewed') && (
                    <button
                      className="btn d-flex align-items-center gap-2 rounded text-white"
                      style={{ backgroundColor: "#F56D2D" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIndex(originalIndex);
                        setShowModal(true);
                      }}
                    >
                      <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          color: "#FFFFFF",
                        }}
                      >
                        <Sign2WhiteIcon size={14} />
                      </div>
                      Sign Document
                    </button>
                  )}
                </div>
              </div>
            );
            })}
            {signatureRequests.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={signatureRequests.length}
                itemsPerPage={itemsPerPage}
                startIndex={startIndex}
                endIndex={endIndex}
              />
            )}
          </>
        )}
      </div>






      {showModal && (
        <div className={`esign-overlay ${showSignModal ? "esign-overlay-hidden" : ""}`}>
          <div className="esign-modal-box">
            {/* Header */}
            <div className="esign-header">
              <h5 className="esign-title">E-Signature</h5>
              <p className="esign-subtitle">Review and electronically sign this document</p>
            </div>

            {/* File Info */}
            {selectedIndex !== null && signatureRequests[selectedIndex] && (() => {
              const selectedRequest = signatureRequests[selectedIndex];
              return (
                <div className="esign-fileinfo">
                  <div className="esign-file-icon">
                    <span className='files'>  <FileIcon /></span>
                  </div>
                  <div>
                    <div className="esign-file-name">{selectedRequest.document_name || selectedRequest.title || 'Document'}</div>
                    <div className="esign-file-details">
                      {selectedRequest.description && `Description: ${selectedRequest.description} · `}
                      {selectedRequest.requested_by_name && `Prepared by ${selectedRequest.requested_by_name}`}
                      {selectedRequest.expires_at && ` · Expires ${formatDate(selectedRequest.expires_at)}`}
                    </div>
                    <span className="esign-file-badge">
                      {selectedRequest.status_display || getStatusDisplay(selectedRequest.status)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Signer Info */}
            <div className="esign-signers">
              {[
                { title: "Primary Taxpayer", signer: "Michael Brown" },
                { title: "Spouse", signer: "Jennifer Brown" },
              ].map((item, idx) => (
                <div key={idx} className="esign-signer-card">
                  <div className="esign-signer-top">
                    <div className="esign-signer-left">
                      <div className="esign-signer-icon">
                        <ProfileIcon size={16} color="#3B4A66" />
                      </div>
                      <div>
                        <div className="esign-signer-title">{item.title}</div>
                        <div className="esign-signer-subtitle">Signer: {item.signer}</div>
                      </div>
                    </div>
                    <span className="esign-signer-badge">Signature Required</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Signature Requirements */}
            <h6 className="esign-requirements-title">Signature Requirements</h6>
            <div className="esign-requirements-list">
              {[
                { label: "Signature", icon: <SignatureIcon />, who: "Taxpayer", req: "Required" },
                { label: "Date", icon: <DateIcon />, who: "Taxpayer", req: "Required" },
                { label: "Signature", icon: <SignatureIcon />, who: "Spouse", req: "Required" },
                { label: "Date", icon: <DateIcon />, who: "Spouse", req: "Required" },
                { label: "Initial", icon: <InitialIcon />, who: "Taxpayer", req: "Optional" },
              ].map((item, idx) => (
                <div key={idx} className="esign-requirement-item">
                  <span className="esign-requirement-left">
                    <span className="esign-requirement-icon">{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="esign-requirement-tags">
                    <span className="esign-tag">{item.who}</span>
                    <span className="esign-tag">{item.req}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Legal Notice */}
            <div className="esign-legal-notice">
              <div className="esign-legal-icon">
                <LegalIcon size={14} color="#F56D2D" />
              </div>
              <div>
                <div className="esign-legal-title">Legal Notice:</div>
                <div className="esign-legal-text">
                  By proceeding to sign, you agree that your electronic signature has the same legal effect as a handwritten one.
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="esign-footer">
              <button className="esign-btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="esign-btn-proceed" onClick={() => setShowSignModal(true)}>
                <Sign2WhiteIcon />
                Proceed signature
              </button>
            </div>
          </div>
        </div>
      )}


      {showSignModal && selectedIndex !== null && signatureRequests[selectedIndex] && (
        <ESignatureModal
          show={showSignModal}
          onClose={() => {
            setShowSignModal(false);
            setSelectedIndex(null);
          }}
          pages={[
            { id: 1, title: "Page 1", image: page1Image },
            { id: 2, title: "Page 2", image: page2Image },
            { id: 3, title: "Page 3", image: page3Image },
            { id: 4, title: "Page 4", image: page4Image },
          ]}
          requestId={signatureRequests[selectedIndex]?.id}
          signatureRequest={signatureRequests[selectedIndex]}
          onSignatureComplete={async (result) => {
            if (result.success) {
              // Refresh signature requests list
              const response = await signatureRequestsAPI.getSignatureRequests();
              if (response.success && response.data && response.data.requests) {
                setSignatureRequests(response.data.requests);
              }
            }
          }}
        />
      )}

      {/* PDF Preview Modal */}
      <Modal
        show={showPreviewModal}
        onHide={() => {
          setShowPreviewModal(false);
          setSelectedIndex(null);
        }}
        size="xl"
        centered
        fullscreen="lg-down"
        style={{ fontFamily: 'BasisGrotesquePro' }}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600' }}>
            {selectedIndex !== null && signatureRequests[selectedIndex]
              ? `E-Signature – ${signatureRequests[selectedIndex].document_name || signatureRequests[selectedIndex].title || 'Document'}`
              : 'E-Signature – Document Preview'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, minHeight: '70vh' }}>
          {selectedIndex !== null && signatureRequests[selectedIndex]?.document_url ? (
            <PDFViewer
              pdfUrl={signatureRequests[selectedIndex].document_url}
              height="70vh"
              showThumbnails={true}
            />
          ) : (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
              <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro' }}>
                No document available for preview.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowPreviewModal(false);
              setSelectedIndex(null);
            }}
            style={{ fontFamily: 'BasisGrotesquePro' }}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>




    </div>


  );
}


