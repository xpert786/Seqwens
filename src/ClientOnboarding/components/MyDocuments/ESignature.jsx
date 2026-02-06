import React, { useState, useRef, useEffect } from 'react';
import { FaEye, FaSyncAlt } from "react-icons/fa";
import { FiPenTool } from "react-icons/fi";
import { Modal } from 'react-bootstrap';
import "../../styles/Popup.css";
import "../../styles/Esignpop.css"
import ESignatureModal from "../../components/ESignatureModal";
import AdvancedPDFViewer from "../../../components/AdvancedPDFViewer";
import page1Image from "../../../assets/page1.png";
import page2Image from "../../../assets/page2.png";
import page3Image from "../../../assets/page3.png";
import page4Image from "../../../assets/page4.png";
import { signatureRequestsAPI, handleAPIError } from "../../utils/apiUtils";
import { getUserData } from "../../utils/userUtils";
import { toast } from "react-toastify";
import PDFViewer from "../../../components/PDFViewer";
import { annotationAPI, prepareAnnotationDataForPython } from "../../../utils/annotationAPI";
import PdfAnnotationModal from "../../components/PdfAnnotationModal";

import { FileIcon, ProfileIcon, LegalIcon, SignatureIcon, DateIcon, InitialIcon, CompletedIcon, AwaitingIcon, Sign2WhiteIcon } from "../icons";
import Pagination from "../Pagination";

export default function ESignature() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAdvancedPDFModal, setShowAdvancedPDFModal] = useState(false);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [selectedDocumentForAnnotation, setSelectedDocumentForAnnotation] = useState(null);
  const [activePage, setActivePage] = useState(0);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [signatureFieldsStatus, setSignatureFieldsStatus] = useState({}); // { documentId: { hasFields: bool, totalFields: number, loading: bool, regenerating: bool } }
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
  const [filter, setFilter] = useState(null); // null = all, 'pending', 'inprogress', 'expired'
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

  // Fetch signature requests function
  const fetchSignatureRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const options = {
        filter: filter
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

  // Check signature fields for a document
  const checkSignatureFieldsForDocument = async (esignDocumentId) => {
    if (!esignDocumentId) return;

    // Set loading state
    setSignatureFieldsStatus(prev => ({
      ...prev,
      [esignDocumentId]: { ...prev[esignDocumentId], loading: true }
    }));

    try {
      const response = await signatureRequestsAPI.checkSignatureFields(esignDocumentId, false);

      if (response.success) {
        setSignatureFieldsStatus(prev => ({
          ...prev,
          [esignDocumentId]: {
            hasFields: response.total_fields > 0,
            totalFields: response.total_fields || 0,
            fieldsExisted: response.fields_existed || false,
            regenerated: response.regenerated || false,
            loading: false
          }
        }));

        if (response.regenerated) {
          toast.success(`Successfully extracted ${response.total_fields} signature field(s)`, {
            position: "top-right",
            autoClose: 3000,
          });
        } else if (response.total_fields > 0) {
          // Fields already existed, no need to show toast
          console.log(`Found ${response.total_fields} existing signature fields`);
        }
      } else {
        setSignatureFieldsStatus(prev => ({
          ...prev,
          [esignDocumentId]: {
            hasFields: false,
            totalFields: 0,
            loading: false,
            error: response.message
          }
        }));
      }
    } catch (error) {
      console.error('Error checking signature fields:', error);
      const errorMsg = handleAPIError(error);
      setSignatureFieldsStatus(prev => ({
        ...prev,
        [esignDocumentId]: {
          hasFields: false,
          totalFields: 0,
          loading: false,
          error: errorMsg
        }
      }));
    }
  };

  // Regenerate signature fields
  const regenerateSignatureFields = async (esignDocumentId) => {
    if (!esignDocumentId) return;

    // Set regenerating state for this document
    setSignatureFieldsStatus(prev => ({
      ...prev,
      [esignDocumentId]: { ...prev[esignDocumentId], regenerating: true, loading: true }
    }));

    try {
      const response = await signatureRequestsAPI.checkSignatureFields(esignDocumentId, true);

      if (response.success) {
        setSignatureFieldsStatus(prev => ({
          ...prev,
          [esignDocumentId]: {
            hasFields: response.total_fields > 0,
            totalFields: response.total_fields || 0,
            fieldsExisted: false,
            regenerated: true,
            loading: false,
            regenerating: false
          }
        }));

        toast.success(`Successfully regenerated ${response.total_fields} signature field(s)`, {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        setSignatureFieldsStatus(prev => ({
          ...prev,
          [esignDocumentId]: { ...prev[esignDocumentId], regenerating: false, loading: false, error: response.message }
        }));
        toast.error(response.message || 'Failed to regenerate signature fields', {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error('Error regenerating signature fields:', error);
      const errorMsg = handleAPIError(error);
      setSignatureFieldsStatus(prev => ({
        ...prev,
        [esignDocumentId]: { ...prev[esignDocumentId], regenerating: false, loading: false, error: errorMsg }
      }));
      toast.error(errorMsg || 'Failed to regenerate signature fields', {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  // Fetch signature requests on mount and when filters change
  useEffect(() => {
    fetchSignatureRequests();
  }, [filter]);

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
  }, [filter]);

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
      'ready': 'Ready',
      'sent': 'Sent',
      'viewed': 'Viewed',
      'created': 'Created',
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
      'ready': { bg: '#D1FAE5', color: '#065F46', border: '#065F46' },
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
                setFilter(null);
              }}
              className="btn "
              style={{
                backgroundColor: filter === null ? "#00C0C6" : "#fff",
                color: filter === null ? "#fff" : "#3B4A66",
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
                setFilter('pending');
              }}
              className="btn "
              style={{
                backgroundColor: filter === 'pending' ? "#00C0C6" : "#fff",
                color: filter === 'pending' ? "#fff" : "#3B4A66",
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
                setFilter('inprogress');
              }}
              className="btn "
              style={{
                backgroundColor: filter === 'inprogress' ? "#00C0C6" : "#fff",
                color: filter === 'inprogress' ? "#fff" : "#3B4A66",
                border: "1px solid #E8F0FF",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "500",
                padding: "6px 12px"
              }}
            >
              Completed
            </button>
            <button
              onClick={() => {
                setFilter('completed');
              }}
              className="btn "
              style={{
                backgroundColor: filter === 'completed' ? "#00C0C6" : "#fff",
                color: filter === 'completed' ? "#fff" : "#3B4A66",
                border: "1px solid #E8F0FF",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "500",
                padding: "6px 12px"
              }}
            >
              Completed
            </button>
            <button
              onClick={() => {
                setFilter('declined');
              }}
              className="btn "
              style={{
                backgroundColor: filter === 'declined' ? "#00C0C6" : "#fff",
                color: filter === 'declined' ? "#fff" : "#3B4A66",
                border: "1px solid #E8F0FF",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "500",
                padding: "6px 12px"
              }}
            >
              Declined
            </button>
            <button
              onClick={() => {
                setFilter('expired');
              }}
              className="btn "
              style={{
                backgroundColor: filter === 'expired' ? "#00C0C6" : "#fff",
                color: filter === 'expired' ? "#fff" : "#3B4A66",
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
                      {request.spouse_sign === true && (
                        <div className="small mb-1" style={{ color: '#F49C2D', fontWeight: '500' }}>
                          ⚠️ Spouse signature also required
                        </div>
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
                      <>
                        <button
                          className="btn d-flex align-items-center gap-2 rounded btn-preview-trigger"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setSelectedIndex(originalIndex);

                            // Check signature fields when opening preview
                            const esignDocId = request.id || request.esign_id || request.document;
                            if (esignDocId) {
                              await checkSignatureFieldsForDocument(esignDocId);
                            }

                            setShowPreviewModal(true);
                          }}
                        >
                          <FaEye size={14} className="icon-eye" />
                          Preview
                        </button>

                        {/* Check if both taxpayer and spouse have signed */}
                        {(() => {
                          const bothSigned = request.taxpayer_signed === true && request.spouse_signed === true;

                          // If both have signed, show Preview Annotated PDF button (if annotated_pdf_url exists)
                          if (bothSigned && request.annotated_pdf_url) {
                            return (
                              <button
                                className="btn d-flex align-items-center gap-2 rounded"
                                style={{
                                  backgroundColor: "#10B981",
                                  color: "#fff",
                                  border: "none",
                                  fontSize: "12px",
                                  fontWeight: "500"
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIndex(originalIndex);
                                  // Open preview modal with annotated PDF
                                  setShowPreviewModal(true);
                                }}
                                title="Preview Annotated PDF"
                              >
                                <FaEye size={14} />
                                Preview Annotated PDF
                              </button>
                            );
                          }

                          // If both haven't signed and status is not "processing", show Annotate PDF button
                          if (!bothSigned && request.status !== 'processing') {
                            return (
                              <button
                                className="btn d-flex align-items-center gap-2 rounded"
                                style={{
                                  backgroundColor: "#00C0C6",
                                  color: "#fff",
                                  border: "none",
                                  fontSize: "12px",
                                  fontWeight: "500"
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIndex(originalIndex);
                                  // Use annotated_pdf_url if available, otherwise use document_url
                                  const pdfUrl = request.annotated_pdf_url || request.document_url;
                                  setSelectedDocumentForAnnotation({
                                    url: pdfUrl,
                                    name: request.document_name || request.title || 'Document',
                                    id: request.id || request.esign_id,  // E-signature request ID
                                    document_id: request.document  // Actual document ID for backend
                                  });
                                  console.log('📄 Opening annotation modal for:', {
                                    esign_request_id: request.id,
                                    document_id: request.document,
                                    document_name: request.document_name,
                                    using_annotated_pdf: !!request.annotated_pdf_url,
                                    pdf_url: pdfUrl
                                  });
                                  setShowAnnotationModal(true);
                                }}
                                title="Open PDF Annotation Tool"
                              >
                                <FiPenTool size={14} />
                                Annotate PDF
                              </button>
                            );
                          }

                          return null;
                        })()}
                      </>
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

            {/* Compact Summary from API payload */}
            {selectedIndex !== null && signatureRequests[selectedIndex] && (() => {
              const selectedRequest = signatureRequests[selectedIndex];
              const taskInfo = selectedRequest.task_info || {};

              return (
                <div className="mt-3">
                  {/* Document & Client Info */}
                  <div className="mb-3 d-flex flex-wrap gap-3">
                    <div>
                      <div className="text-xs text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px' }}>
                        Document
                      </div>
                      <div className="text-sm fw-semibold" style={{ fontFamily: 'BasisGrotesquePro', color: '#111827' }}>
                        {selectedRequest.document_name || selectedRequest.title || 'Document'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px' }}>
                        Client
                      </div>
                      <div className="text-sm fw-semibold" style={{ fontFamily: 'BasisGrotesquePro', color: '#111827' }}>
                        {selectedRequest.client_name || '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px' }}>
                        Requested By
                      </div>
                      <div className="text-sm fw-semibold" style={{ fontFamily: 'BasisGrotesquePro', color: '#111827' }}>
                        {selectedRequest.requested_by_name || selectedRequest.staff_info?.name || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Status & Dates */}
                  <div className="mb-3 d-flex flex-wrap gap-3">
                    <div>
                      <div className="text-xs text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px' }}>
                        Status
                      </div>
                      <span className="esign-file-badge">
                        {selectedRequest.status_display || selectedRequest.status || '—'}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px' }}>
                        Created
                      </div>
                      <div className="text-sm" style={{ fontFamily: 'BasisGrotesquePro', color: '#374151' }}>
                        {selectedRequest.created_at ? formatDate(selectedRequest.created_at) : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px' }}>
                        Due Date
                      </div>
                      <div className="text-sm" style={{ fontFamily: 'BasisGrotesquePro', color: '#374151' }}>
                        {taskInfo.due_date ? formatDate(taskInfo.due_date) : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedRequest.description && (
                    <div className="mb-2">
                      <div className="text-xs text-[#6B7280] mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px' }}>
                        Description
                      </div>
                      <div className="text-sm" style={{ fontFamily: 'BasisGrotesquePro', color: '#4B5563' }}>
                        {selectedRequest.description}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Footer Buttons */}
            <div className="esign-footer">
              <button className="esign-btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="esign-btn-proceed"
                onClick={async () => {
                  try {
                    const selectedRequest = selectedIndex !== null ? signatureRequests[selectedIndex] : null;
                    if (!selectedRequest) {
                      toast.error('No document selected');
                      return;
                    }

                    // Open signature modal directly
                    setShowSignModal(true);
                  } catch (error) {
                    console.error('Error in SignWell workflow:', error);
                    toast.error(handleAPIError(error) || 'An error occurred. You can still sign manually.', {
                      autoClose: 5000
                    });
                    // Fallback to regular signature modal
                    setShowSignModal(true);
                  }
                }}
              >
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
          pages={<PDFViewer
            pdfUrl={signatureRequests[selectedIndex]?.document_url}
            height="70vh"
            showThumbnails={true}
          />}
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
            {selectedIndex !== null && signatureRequests[selectedIndex] ? (
              (() => {
                const request = signatureRequests[selectedIndex];
                const isAnnotated = request.taxpayer_signed === true && request.spouse_signed === true && request.annotated_pdf_url;
                const docName = request.document_name || request.title || 'Document';
                return `E-Signature – ${isAnnotated ? 'Annotated ' : ''}${docName}`;
              })()
            ) : 'E-Signature – Document Preview'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, minHeight: '70vh' }}>
          {selectedIndex !== null && signatureRequests[selectedIndex] ? (
            <>
              {(() => {
                const request = signatureRequests[selectedIndex];
                // Use annotated_pdf_url if both taxpayer and spouse have signed, otherwise use document_url
                const pdfUrl = (request.taxpayer_signed === true && request.spouse_signed === true && request.annotated_pdf_url)
                  ? request.annotated_pdf_url
                  : request.document_url;

                return pdfUrl ? (
                  <PDFViewer
                    pdfUrl={pdfUrl}
                    height="70vh"
                    showThumbnails={true}
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                    <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      No document available for preview.
                    </p>
                  </div>
                );
              })()}
              {/* Signature Fields Status */}

            </>
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

      {/* PDF Annotation Modal */}
      {showAnnotationModal && selectedDocumentForAnnotation && (
        <PdfAnnotationModal
          isOpen={showAnnotationModal}
          onClose={() => {
            setShowAnnotationModal(false);
            setSelectedDocumentForAnnotation(null);
          }}
          documentUrl={selectedDocumentForAnnotation.url}
          documentName={selectedDocumentForAnnotation.name}
          requestId={selectedDocumentForAnnotation.id}
          spouseSignRequired={(() => {
            const request = signatureRequests.find(req =>
              req.id === selectedDocumentForAnnotation.id ||
              req.esign_id === selectedDocumentForAnnotation.id ||
              req.document === selectedDocumentForAnnotation.document_id
            );
            return request?.spouse_sign === true;
          })()}
          spouseSigned={(() => {
            const request = signatureRequests.find(req =>
              req.id === selectedDocumentForAnnotation.id ||
              req.esign_id === selectedDocumentForAnnotation.id ||
              req.document === selectedDocumentForAnnotation.document_id
            );
            return request?.spouse_signed === true;
          })()}
          onSave={async (annotationData) => {
            try {
              console.log('💾 Preparing to save annotations:', {
                esign_request_id: selectedDocumentForAnnotation.id,
                document_id: selectedDocumentForAnnotation.document_id,
                annotations_count: annotationData.annotations?.length || 0,
                images_count: annotationData.images?.length || 0,
                pdf_scale: annotationData.pdf_scale,
                canvas_info: annotationData.canvas_info
              });

              // Send to backend using annotationAPI
              const response = await annotationAPI.saveAnnotations({
                pdfUrl: selectedDocumentForAnnotation.url,
                annotations: annotationData.annotations || [],
                images: annotationData.images || [],
                spouse_annotations: annotationData.spouse_annotations || [],
                spouse_images: annotationData.spouse_images || [],
                pdf_scale: annotationData.pdf_scale || 1.5,
                canvas_info: annotationData.canvas_info,
                requestId: selectedDocumentForAnnotation.document_id, // Use document_id from signature request
                esign_document_id: selectedDocumentForAnnotation.id,  // Keep esign request ID for reference
                metadata: {
                  request_id: selectedDocumentForAnnotation.id,
                  document_id: selectedDocumentForAnnotation.document_id,
                  document_url: selectedDocumentForAnnotation.url,
                  document_name: selectedDocumentForAnnotation.name,
                  timestamp: new Date().toISOString(),
                  canvas_info: annotationData.canvas_info
                }
              });

              if (response.success) {
                toast.success('PDF annotations saved successfully!', {
                  position: 'top-right',
                  autoClose: 5000
                });

                // Close the annotation modal
                setShowAnnotationModal(false);
                setSelectedDocumentForAnnotation(null);

                // Refresh signature requests
                setTimeout(() => {
                  fetchSignatureRequests();
                }, 1000);
              } else {
                throw new Error(response.message || 'Failed to save annotations');
              }
            } catch (error) {
              console.error('Error saving annotations:', error);
              const errorMsg = handleAPIError(error);
              toast.error(errorMsg || 'Failed to save annotations', {
                position: 'top-right',
                autoClose: 5000
              });
            }
          }}
        />
      )}

      {/* Advanced PDF Viewer Modal */}
      {showAdvancedPDFModal && selectedIndex !== null && signatureRequests[selectedIndex] && (
        <AdvancedPDFViewer
          show={showAdvancedPDFModal}
          onHide={() => {
            setShowAdvancedPDFModal(false);
            setSelectedIndex(null);
          }}
          pdfUrl={signatureRequests[selectedIndex]?.document_url}
          onSaveAnnotations={async (annotationData) => {
            try {
              // Prepare data for Python backend
              const canvasInfo = {
                width: 800, // This will be updated by the component
                height: 600,
                pdfWidth: annotationData.metadata?.canvasWidth || 800,
                pdfHeight: annotationData.metadata?.canvasHeight || 600
              };

              const processedData = prepareAnnotationDataForPython(annotationData.annotations, canvasInfo);

              // Send to backend
              const response = await annotationAPI.saveAnnotations({
                ...annotationData,
                processedAnnotations: processedData,
                requestId: signatureRequests[selectedIndex]?.id,
                documentName: signatureRequests[selectedIndex]?.document_name
              });

              if (response.success) {
                toast.success('PDF annotations saved and sent for processing!');

                // Optionally refresh the signature requests
                setTimeout(async () => {
                  const refreshResponse = await signatureRequestsAPI.getSignatureRequests();
                  if (refreshResponse.success && refreshResponse.data && refreshResponse.data.requests) {
                    setSignatureRequests(refreshResponse.data.requests);
                  }
                }, 2000);
              } else {
                toast.error(response.message || 'Failed to save annotations');
              }
            } catch (error) {
              console.error('Error saving annotations:', error);
              toast.error('Failed to save annotations');
            }
          }}
          initialAnnotations={[]} // Can be populated from backend if needed
        />
      )}



    </div>


  );
}


