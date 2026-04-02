import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { customESignAPI, taxPreparerClientAPI, taxPreparerDocumentsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getUserData } from '../../../ClientOnboarding/utils/userUtils';
import { toast } from 'react-toastify';
import { FiClock, FiCheckCircle, FiXCircle, FiFileText, FiSearch, FiFilter, FiRefreshCw, FiPlus, FiPenTool, FiEye, FiInfo } from 'react-icons/fi';
import ProcessingModal from '../../../components/ProcessingModal';
import Pagination from '../../../ClientOnboarding/components/Pagination';
import PdfSignatureModal from '../../components/PdfSignatureModal.jsx';
import PdfAnnotationModal from '../../../ClientOnboarding/components/PdfAnnotationModal';
import PDFViewer from '../../../components/PDFViewer';
import { annotationAPI } from '../../../utils/annotationAPI';
import '../../styles/esignature-dashboard.css';

const previewStyles = `
  .pdf-preview-modal .modal-dialog {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    margin: 0 auto !important;
    max-width: 600px !important;
  }
  .pdf-preview-modal .modal-content {
    max-height: 90vh !important;
    overflow: hidden !important;
  }
`;

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

export default function ESignatureDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signatureRequests, setSignatureRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, completed, declined, expired
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [statistics, setStatistics] = useState({
    pending: 0,
    completed: 0,
    declined: 0,
    expired: 0,
    total: 0
  });

  // Create E-Signature Request Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [hasSpouse, setHasSpouse] = useState(false);
  const [spouseEmail, setSpouseEmail] = useState('');
  const [spouseName, setSpouseName] = useState('');
  const [preparerMustSign, setPreparerMustSign] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [deadline, setDeadline] = useState('');

  // Processing state for async e-sign document creation
  const [processing, setProcessing] = useState(false);
  const [documentId, setDocumentId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [processingError, setProcessingError] = useState(null);

  // SignWell embedded signing modal state
  const [showSignWellModal, setShowSignWellModal] = useState(false);
  const [signWellEmbeddedUrl, setSignWellEmbeddedUrl] = useState(null);
  const [currentSigningRequest, setCurrentSigningRequest] = useState(null);
  const signWellIframeRef = useRef(null);

  // PDF Signature Modal state
  const [showPdfSignatureModal, setShowPdfSignatureModal] = useState(false);
  const [currentSignatureRequest, setCurrentSignatureRequest] = useState(null);

  // PDF Annotation Modal state
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [selectedDocumentForAnnotation, setSelectedDocumentForAnnotation] = useState(null);

  // PDF Preview Modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPreviewDocument, setSelectedPreviewDocument] = useState(null);

  // Signing Status Modal state
  const [showSigningStatusModal, setShowSigningStatusModal] = useState(false);
  const [selectedSigningStatus, setSelectedSigningStatus] = useState(null);

  // Data for dropdowns
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // Dropdown visibility
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);

  const clientDropdownRef = useRef(null);
  const folderDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Statistics calculation for the UI
  const stats = [
    { label: 'Pending', value: statistics.pending + statistics.inprogress, icon: <FiClock />, color: '#3AD6F2' },
    { label: 'Completed', value: statistics.completed, icon: <FiCheckCircle />, color: '#22C55E' },
    { label: 'Declined', value: statistics.declined, icon: <FiXCircle />, color: '#EF4444' },
    { label: 'Expired', value: statistics.expired, icon: <FiInfo />, color: '#F56D2D' }
  ];

  // Fetch signature requests
  useEffect(() => {
    fetchSignatureRequests();
  }, []);

  // Listen for SignWell postMessage events (for embedded signing completion)
  // Note: The new custom e-sign API still uses SignWell for the actual signing interface
  useEffect(() => {
    const handleSignWellMessage = (event) => {
      // SignWell sends messages from app.signwell.com or signwell.com
      if (!event.origin.includes('signwell.com')) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        console.log('SignWell event received:', data);

        // Handle different SignWell events
        if (data.event === 'completed' || data.type === 'signwell:document:completed') {
          toast.success('Document signed successfully!', {
            position: 'top-right',
            autoClose: 3000
          });
          setShowSignWellModal(false);
          setSignWellEmbeddedUrl(null);
          setCurrentSigningRequest(null);
          setTimeout(() => fetchSignatureRequests(), 1000);
        } else if (data.event === 'cancelled' || data.type === 'signwell:document:cancelled') {
          toast.info('Signing cancelled', {
            position: 'top-right',
            autoClose: 3000
          });
          setShowSignWellModal(false);
          setSignWellEmbeddedUrl(null);
          setCurrentSigningRequest(null);
        } else if (data.event === 'declined' || data.type === 'signwell:document:declined') {
          toast.warning('Document signing declined', {
            position: 'top-right',
            autoClose: 3000
          });
          setShowSignWellModal(false);
          setSignWellEmbeddedUrl(null);
          setCurrentSigningRequest(null);
          setTimeout(() => fetchSignatureRequests(), 1000);
        }
      } catch (e) {
        // Not a JSON message or not from SignWell
        console.log('Non-SignWell message or parse error:', e);
      }
    };

    window.addEventListener('message', handleSignWellMessage);
    return () => window.removeEventListener('message', handleSignWellMessage);
  }, []);

  // Filter requests when search term or status filter changes
  useEffect(() => {
    filterRequests();
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchTerm, statusFilter, signatureRequests]);

  const fetchSignatureRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch signature requests using the new API endpoint
      const response = await customESignAPI.listSignatureRequests();

      if (response.success && response.data) {
        let requests = [];

        if (Array.isArray(response.data)) {
          requests = response.data;
        } else if (response.data.requests && Array.isArray(response.data.requests)) {
          requests = response.data.requests;
        }

        setSignatureRequests(requests);
        calculateStatistics(requests);
      } else {
        throw new Error(response.message || 'Failed to fetch signature requests');
      }
    } catch (err) {
      console.error('Error fetching signature requests:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
      toast.error(errorMsg || 'Failed to load signature requests', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (requests) => {
    const stats = {
      pending: 0,
      inprogress: 0,
      completed: 0,
      declined: 0,
      expired: 0,
      total: requests.length
    };

    requests.forEach(request => {
      const status = request.status?.toLowerCase();

      if (status === 'created' || status === 'pending' || status === 'processing' || status === 'ready') {
        stats.pending++;
      } else if (status === 'sent' || status === 'viewed' || status === 'taxpayer_pending' || status === 'preparer_pending' || status === 'under_review' || status === 'in_progress') {
        stats.inprogress++;
      } else if (status === 'signed' || status === 'completed') {
        stats.completed++;
      } else if (status === 'failed' || status === 'cancelled') {
        stats.declined++;
      } else if (status === 'expired') {
        stats.expired++;
      } else if (isExpired(request)) {
        stats.expired++;
      }
    });

    setStatistics(stats);
  };

  const isExpired = (request) => {
    if (!request.expires_at) return false;
    const expiryDate = new Date(request.expires_at);
    const now = new Date();
    return expiryDate < now && request.status !== 'completed' && request.status !== 'signed';
  };

  const filterRequests = () => {
    let filtered = [...signatureRequests];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => {
        const status = request.status?.toLowerCase();

        switch (statusFilter) {
          case 'pending':
            return status === 'created' || status === 'pending' || status === 'processing' || status === 'ready' ||
              status === 'sent' || status === 'viewed' || status === 'taxpayer_pending' || status === 'preparer_pending' || status === 'under_review' || status === 'in_progress';
          case 'inprogress':
            return status === 'sent' || status === 'viewed' || status === 'taxpayer_pending' || status === 'preparer_pending' || status === 'under_review' || status === 'in_progress';
          case 'completed':
            return status === 'signed' || status === 'completed';
          case 'declined':
            return status === 'failed' || status === 'cancelled';
          case 'expired':
            return status === 'expired' || isExpired(request);
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(request => {
        const clientName = request.client_name || request.client?.full_name || '';
        const documentName = request.document_name || request.document?.name || '';
        const title = request.title || '';
        const description = request.description || '';

        return (
          clientName.toLowerCase().includes(searchLower) ||
          documentName.toLowerCase().includes(searchLower) ||
          title.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredRequests(filtered);
  };

  const getStatusBadge = (request) => {
    const status = request.status?.toLowerCase();

    switch (status) {
      case 'created':
      case 'pending':
        return { text: 'Pending', className: 'status-badge-pending' };
      case 'processing':
      case 'ready':
        return { text: 'Processing', className: 'status-badge-pending' };
      case 'sent':
      case 'viewed':
      case 'taxpayer_pending':
      case 'preparer_pending':
      case 'under_review':
      case 'in_progress':
        return { text: 'In Progress', className: 'status-badge-pending' };
      case 'signed':
      case 'completed':
        return { text: 'Completed', className: 'status-badge-signed' };
      case 'expired':
        return { text: 'Expired', className: 'status-badge-expired' };
      case 'failed':
      case 'cancelled':
        return { text: 'Declined', className: 'status-badge-declined' };
      default:
        // Check if actually expired by date
        if (isExpired(request)) {
          return { text: 'Expired', className: 'status-badge-expired' };
        }
        return { text: status ? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ') : 'Unknown', className: 'status-badge-default' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Helper function to get signing URL from request
  const getSigningUrl = (request) => {
    // Check signer_urls for signing URL
    if (request.signer_urls) {
      const userData = getUserData();
      const userEmail = userData?.email || userData?.user?.email;

      if (userEmail && request.signer_urls[userEmail]) {
        const signerData = request.signer_urls[userEmail];
        return signerData.url || signerData.signing_url;
      }

      // If no email match, get first available signer
      const firstSigner = Object.values(request.signer_urls)[0];
      if (firstSigner) {
        return firstSigner.url || firstSigner.signing_url;
      }
    }

    // Fallback to signing_url
    if (request.signing_url) {
      return request.signing_url;
    }

    return null;
  };

  // Open signing URL in a new window as fallback
  const openSigningInNewWindow = (signingUrl, request) => {
    const signingWindow = window.open(signingUrl, '_blank', 'width=1200,height=800');

    if (signingWindow) {
      toast.info('Opening signing page in a new window. Please sign the document there.', {
        autoClose: 5000,
        position: "top-right"
      });

      // Poll for status updates
      const esignDocumentId = request.id || request.esign_document_id;
      if (esignDocumentId) {
        let pollInterval = null;

        const pollStatus = async () => {
          try {
            const pollResponse = await customESignAPI.refreshStatus(esignDocumentId);
            if (pollResponse.success && pollResponse.data) {
              setSignatureRequests(prevRequests =>
                prevRequests.map(req =>
                  req.id === esignDocumentId
                    ? { ...req, ...pollResponse.data }
                    : req
                )
              );

              if (['signed', 'expired', 'failed'].includes(pollResponse.data.status)) {
                if (pollInterval) clearInterval(pollInterval);
                setTimeout(() => fetchSignatureRequests(), 1000);
              }
            }
          } catch (pollError) {
            console.error('Error polling e-sign status:', pollError);
          }
        };

        pollStatus();
        pollInterval = setInterval(pollStatus, 10000);

        // Stop polling when window is closed
        const windowCheckInterval = setInterval(() => {
          if (signingWindow.closed) {
            clearInterval(windowCheckInterval);
            if (pollInterval) clearInterval(pollInterval);
            setTimeout(() => fetchSignatureRequests(), 1000);
          }
        }, 2000);

        // Clean up after 5 minutes
        setTimeout(() => {
          if (pollInterval) clearInterval(pollInterval);
          clearInterval(windowCheckInterval);
        }, 300000);
      }
    } else {
      toast.error('Please allow pop-ups for this site to open the signing page', {
        position: "top-right",
        autoClose: 5000
      });
    }
  };

  const handleSignDocument = (request, e) => {
    e?.stopPropagation();
    setCurrentSignatureRequest(request);
    setShowPdfSignatureModal(true);
  };

  const handleViewDetails = (request, e) => {
    // Check if preparer needs to sign
    const userData = getUserData();
    const userEmail = userData?.email || userData?.user?.email;
    const preparerEmail = request.preparer_email;

    if (request.preparer_must_sign === true && userEmail === preparerEmail) {
      e?.stopPropagation();

      // Get signing URL
      const signingUrl = getSigningUrl(request);

      if (!signingUrl) {
        toast.error('No signing URL available. Please try again later.', {
          position: "top-right",
          autoClose: 3000
        });
        return;
      }

      console.log('Signing URL:', signingUrl);

      // Check if URL is embeddable (from app.signwell.com)
      const isEmbeddableUrl = signingUrl.includes('app.signwell.com') ||
        signingUrl.includes('/e/') ||
        signingUrl.includes('embedded');

      if (isEmbeddableUrl) {
        // Try iframe embedding first
        setSignWellEmbeddedUrl(signingUrl);
        setCurrentSigningRequest(request);
        setShowSignWellModal(true);

        // Start polling for status updates
        const esignDocumentId = request.id || request.esign_document_id;
        if (esignDocumentId) {
          let pollInterval = setInterval(async () => {
            try {
              const pollResponse = await customESignAPI.refreshStatus(esignDocumentId);
              if (pollResponse.success && pollResponse.data) {
                setSignatureRequests(prevRequests =>
                  prevRequests.map(req =>
                    req.id === esignDocumentId
                      ? { ...req, ...pollResponse.data }
                      : req
                  )
                );

                if (['signed', 'expired', 'failed'].includes(pollResponse.data.status)) {
                  clearInterval(pollInterval);
                  setShowSignWellModal(false);
                  setTimeout(() => fetchSignatureRequests(), 1000);
                }
              }
            } catch (pollError) {
              console.error('Error polling e-sign status:', pollError);
            }
          }, 10000);

          // Store cleanup function
          window.signWellPollCleanup = () => {
            if (pollInterval) clearInterval(pollInterval);
          };

          // Clean up after 5 minutes
          setTimeout(() => {
            if (pollInterval) clearInterval(pollInterval);
          }, 300000);
        }
      } else {
        // Fallback to new window for non-embeddable URLs
        openSigningInNewWindow(signingUrl, request);
      }
    } else {
      // Navigate to client details with e-sign logs, or open signing status modal
      if (request.taxpayer || request.taxpayer_id) {
        const taxpayerId = request.taxpayer || request.taxpayer_id;
        navigate(`/taxdashboard/clients/${taxpayerId}/esign-logs`);
      } else {
        // Open signing status modal if no client ID available
        e?.stopPropagation();
        setSelectedSigningStatus(request);
        setShowSigningStatusModal(true);
      }
    }
  };

  const handleRefresh = () => {
    fetchSignatureRequests();
  };

  // Helper function to check if all signees have signed
  const areAllSigneesSigned = (request) => {
    // Check taxpayer signature
    if (!request.taxpayer_signed) {
      return false;
    }

    // Check preparer signature if required
    if (request.preparer_must_sign === true && !request.preparer_signed) {
      return false;
    }

    // Check spouse signature if required
    if (request.spouse_sign === true && !request.spouse_signed) {
      return false;
    }

    return true;
  };

  // Helper function to check if taxpayer and spouse (if required) have signed
  const areTaxpayerAndSpouseSigned = (request) => {
    // Check taxpayer signature
    if (!request.taxpayer_signed) {
      return false;
    }

    // Check spouse signature if required
    if (request.spouse_sign === true && !request.spouse_signed) {
      return false;
    }

    return true;
  };

  // Handle marking e-sign request as completed
  const handleCompleteRequest = async (requestId, e) => {
    e?.stopPropagation();

    try {
      const response = await taxPreparerClientAPI.completeSignatureRequest(requestId);

      if (response.success) {
        toast.success('E-Sign Request marked as completed successfully!', {
          position: "top-right",
          autoClose: 3000
        });
        // Refresh the list
        fetchSignatureRequests();
      } else {
        throw new Error(response.message || 'Failed to complete request');
      }
    } catch (error) {
      console.error('Error completing signature request:', error);
      handleAPIError(error);
    }
  };

  // State for re-requesting loading
  const [rerequestingId, setRerequestingId] = useState(null);

  // Handle re-requesting e-sign
  const handleRerequestSignature = async (requestId, e) => {
    e?.stopPropagation();

    try {
      setRerequestingId(requestId);
      const response = await taxPreparerClientAPI.rerequestSignature(requestId);

      if (response.success) {
        toast.success('E-Sign Request re-sent successfully!', {
          position: "top-right",
          autoClose: 3000
        });
        // Refresh the list
        fetchSignatureRequests();
      } else {
        throw new Error(response.message || 'Failed to re-request signature');
      }
    } catch (error) {
      console.error('Error re-requesting signature:', error);
      handleAPIError(error);
    } finally {
      setRerequestingId(null);
    }
  };

  // Fetch clients for dropdown
  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await taxPreparerClientAPI.getClients();
      if (response.success && response.data) {
        setClients(response.data.clients || response.data || []);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      toast.error('Failed to load clients');
    } finally {
      setLoadingClients(false);
    }
  };


  // Fetch folders for dropdown
  const fetchFolders = async () => {
    try {
      setLoadingFolders(true);
      const response = await taxPreparerDocumentsAPI.browseSharedDocuments({});
      if (response.success && response.data) {
        const foldersData = response.data.folders || [];
        setFolders(foldersData);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    } finally {
      setLoadingFolders(false);
    }
  };

  // Open create modal
  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    fetchClients();
    fetchFolders();
  };

  // Close create modal and reset form
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setSelectedClient(null);
    setHasSpouse(false);
    setSpouseEmail('');
    setSpouseName('');
    setPreparerMustSign(true);
    setSelectedFile(null);
    setSelectedFolder(null);
    setDeadline('');
    setShowClientDropdown(false);
    setShowFolderDropdown(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Reset processing state if modal is closed
    if (!processing) {
      setProcessingStatus(null);
      setProcessingError(null);
      setDocumentId(null);
    }
  };

  const handleCloseProcessingModal = () => {
    setProcessing(false);
    setProcessingStatus(null);
    setProcessingError(null);
    setDocumentId(null);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        e.target.value = '';
        return;
      }
      // Validate file size (e.g., 10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  // Poll processing status
  // Polls the status endpoint every 3 seconds until processing is complete or failed
  const pollStatus = async (id) => {
    const POLL_INTERVAL = 3000; // 3 seconds
    const maxAttempts = 100; // ~5 minutes max (100 * 3 seconds)
    let attempts = 0;
    let pollTimeoutId = null;

    const poll = async () => {
      try {
        console.log(`[Poll ${attempts + 1}] Checking status for document ID: ${id}`);
        const response = await customESignAPI.refreshStatus(id);
        console.log(`[Poll ${attempts + 1}] Response:`, response);

        if (response.success && response.data) {
          const { status, processing_status, processing_error, signing_url, signer_urls } = response.data;

          console.log(`[Poll ${attempts + 1}] Status: ${status}, Processing Status: ${processing_status}`);

          // Update processing status for UI
          setProcessingStatus(processing_status);

          // Check if processing is complete
          if (status === 'ready' || status === 'in_progress') {
            // Ready for signing!
            console.log('Document processing completed and ready for signing!');
            setProcessing(false);
            if (pollTimeoutId) {
              clearTimeout(pollTimeoutId);
              pollTimeoutId = null;
            }

            toast.success('Document is ready for signing!', {
              position: "top-right",
              autoClose: 3000,
            });
            handleCloseCreateModal();
            fetchSignatureRequests(); // Refresh the list

            // Log signing information for debugging
            if (signing_url) {
              console.log('Document ready - Signing URL:', signing_url);
            }
            if (signer_urls) {
              console.log('Document ready - Signer URLs:', signer_urls);
            }

            return { ready: true, signingUrl: signing_url };
          } else if (status === 'failed' || processing_status === 'failed') {
            // Processing failed
            console.error('Document processing failed:', processing_error);
            setProcessing(false);
            if (pollTimeoutId) {
              clearTimeout(pollTimeoutId);
              pollTimeoutId = null;
            }
            setProcessingError(processing_error || 'Processing failed');
            toast.error(processing_error || 'Processing failed', {
              position: "top-right",
              autoClose: 5000,
            });
            return { error: processing_error || 'Processing failed' };
          } else {
            // Still processing - continue polling
            attempts++;
            if (attempts < maxAttempts) {
              // Update loader message based on status - poll again in 3 seconds
              console.log(`[Poll ${attempts}] Still processing, will poll again in ${POLL_INTERVAL / 1000} seconds...`);
              pollTimeoutId = setTimeout(poll, POLL_INTERVAL);
              return { processing: true, status: processing_status || status };
            } else {
              // Timeout reached
              console.error('Polling timeout reached after', attempts, 'attempts');
              setProcessing(false);
              if (pollTimeoutId) {
                clearTimeout(pollTimeoutId);
                pollTimeoutId = null;
              }
              setProcessingError('Processing timeout. Please check status later.');
              toast.error('Processing timeout. Please check status later.', {
                position: "top-right",
                autoClose: 5000,
              });
              return { error: 'Processing timeout' };
            }
          }
        } else {
          // Invalid response structure
          console.warn(`[Poll ${attempts + 1}] Invalid response structure:`, response);
          attempts++;
          if (attempts < maxAttempts) {
            pollTimeoutId = setTimeout(poll, POLL_INTERVAL);
          } else {
            setProcessing(false);
            if (pollTimeoutId) {
              clearTimeout(pollTimeoutId);
              pollTimeoutId = null;
            }
            setProcessingError('Invalid response from server');
            toast.error('Failed to check processing status', {
              position: "top-right",
              autoClose: 5000,
            });
          }
        }
      } catch (err) {
        console.error(`[Poll ${attempts + 1}] Error polling status:`, err);
        attempts++;
        if (attempts < maxAttempts) {
          pollTimeoutId = setTimeout(poll, POLL_INTERVAL);
        } else {
          setProcessing(false);
          if (pollTimeoutId) {
            clearTimeout(pollTimeoutId);
            pollTimeoutId = null;
          }
          setProcessingError('Failed to check status');
          toast.error('Failed to check processing status', {
            position: "top-right",
            autoClose: 5000,
          });
        }
      }
    };

    // Start polling immediately, then continue every 3 seconds
    console.log(`Starting status polling for document ID: ${id} - will poll every ${POLL_INTERVAL / 1000} seconds`);
    poll();
  };

  // Handle create e-signature request
  const handleCreateESignRequest = async () => {
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }
    if (!selectedFile) {
      toast.error('Please upload a PDF file');
      return;
    }
    if (!deadline) {
      toast.error('Please select a deadline');
      return;
    }

    try {
      setCreating(true);
      setProcessingError(null);

      const taxpayerId = selectedClient.id || selectedClient.client_id;

      // Step 1: Upload PDF
      console.log('Step 1: Uploading PDF...');
      const uploadResponse = await customESignAPI.uploadPDF({
        file: selectedFile,
        taxpayer_id: taxpayerId,
        folder_id: selectedFolder ? (selectedFolder.id || selectedFolder.folder_id) : undefined
      });

      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message || 'Failed to upload PDF');
      }

      const { esign_draft_id, pdf_info } = uploadResponse;
      console.log('PDF uploaded successfully:', { esign_draft_id, pdf_info });

      // Step 2: Create e-sign request with default fields
      // For now, we'll place default signature fields on the first page
      // In a full implementation, this would be done via drag & drop UI
      const fields = [];

      // Get first page dimensions (default to US Letter if not available)
      const firstPage = pdf_info?.pages?.[0] || { width: 612, height: 792 };
      const pageWidth = firstPage.width || 612;
      const pageHeight = firstPage.height || 792;

      // Place taxpayer signature field (bottom-left origin, so y is from bottom)
      fields.push({
        type: 'signature',
        x: 100,
        y: 100,
        width: 200,
        height: 50,
        page: 1,
        recipient_id: 'taxpayer',
        required: true,
        label: 'Taxpayer Signature'
      });

      // Place date field next to signature
      fields.push({
        type: 'date',
        x: 320,
        y: 100,
        width: 100,
        height: 25,
        page: 1,
        recipient_id: 'taxpayer',
        required: true,
        label: 'Date'
      });

      // If spouse is required, add spouse signature field
      if (hasSpouse) {
        fields.push({
          type: 'signature',
          x: 100,
          y: 200,
          width: 200,
          height: 50,
          page: 1,
          recipient_id: 'spouse',
          required: true,
          label: 'Spouse Signature'
        });
      }

      // If preparer must sign, add preparer signature field
      if (preparerMustSign) {
        fields.push({
          type: 'signature',
          x: 100,
          y: hasSpouse ? 300 : 200,
          width: 200,
          height: 50,
          page: 1,
          recipient_id: 'preparer',
          required: true,
          label: 'Preparer Signature'
        });
      }

      console.log('Step 2: Creating e-sign request with fields...', fields);

      // Format deadline to YYYY-MM-DD for date input
      let deadlineFormatted = deadline;
      if (deadline && !deadline.includes('T')) {
        deadlineFormatted = deadline; // Already in YYYY-MM-DD format from date input
      }

      const createResponse = await customESignAPI.createESignRequest({
        esign_draft_id: esign_draft_id,
        taxpayer_id: taxpayerId,
        has_spouse: hasSpouse,
        spouse_email: hasSpouse ? spouseEmail : undefined,
        spouse_name: hasSpouse && spouseName ? spouseName : undefined,
        preparer_must_sign: preparerMustSign,
        deadline: deadlineFormatted,
        fields: fields,
        folder_id: selectedFolder ? (selectedFolder.id || selectedFolder.folder_id) : undefined
      });

      if (createResponse.success) {
        // Check if document is being processed asynchronously
        const documentData = createResponse;
        const status = documentData?.status;
        const processingStatus = documentData?.processing_status;
        const esignDocumentId = documentData?.esign_document_id;

        console.log('Create response received:', {
          success: createResponse.success,
          esignDocumentId: esignDocumentId,
          status: status,
          processingStatus: processingStatus
        });

        if (status === 'processing' || processingStatus || !esignDocumentId) {
          // Document is being processed asynchronously
          console.log('E-sign document created, starting background processing:', {
            id: esignDocumentId,
            status: status,
            processing_status: processingStatus
          });

          setDocumentId(esignDocumentId);
          setProcessingStatus(processingStatus || 'pending');
          setProcessing(true);
          setCreating(false);

          // Start polling every 3 seconds
          console.log('Calling pollStatus with document ID:', esignDocumentId);
          pollStatus(esignDocumentId);
        } else {
          // Immediate success (document ready immediately)
          toast.success('E-Signature request created successfully!', {
            position: "top-right",
            autoClose: 3000,
          });
          handleCloseCreateModal();
          fetchSignatureRequests(); // Refresh the list
        }
      } else {
        throw new Error(createResponse.message || 'Failed to create e-signature request');
      }
    } catch (err) {
      console.error('Error creating e-signature request:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to create e-signature request', {
        position: "top-right",
        autoClose: 5000,
      });
      setProcessing(false);
    } finally {
      setCreating(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setShowClientDropdown(false);
      }
      if (folderDropdownRef.current && !folderDropdownRef.current.contains(event.target)) {
        setShowFolderDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div className="esignature-dashboard-container">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3" style={{ color: '#6B7280', fontFamily: 'BasisGrotesquePro' }}>
              Loading E-Signature Dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && signatureRequests.length === 0) {
    return (
      <div className="esignature-dashboard-container">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <p className="text-danger mb-3" style={{ fontFamily: 'BasisGrotesquePro' }}>{error}</p>
            <button
              onClick={handleRefresh}
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 font-basis">
      <style>{previewStyles}</style>

      {/* Unified Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 mt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-14 py-2 rounded-2xl bg-[#3AD6F2] flex items-center justify-center text-white shadow-xl shadow-[#3AD6F2]/30">
              <FiPenTool size={32} />
            </div>
            <div>
              <h3 className="mb-0 font-black text-gray-900 tracking-tight leading-none">
                E-Signatures
              </h3>
              <span className="text-gray-400 text-sm font-medium tracking-tight">Manage your digital signature requests and document execution.</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={handleRefresh}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-black !text-xs uppercase tracking-[0.2em] transition-all !rounded-xl shadow-sm border border-gray-200 active:scale-95"
          >
            <FiRefreshCw size={18} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-[#F56D2D] text-white font-black !text-xs uppercase tracking-[0.2em] transition-all !rounded-xl shadow-2xl shadow-[#F56D2D]/10 active:scale-95"
          >
            <FiPlus size={18} />
            <span>Create Request</span>
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {[
          {
            id: 'pending',
            label: 'Pending / In Progress',
            val: (statistics.pending || 0) + (statistics.inprogress || 0),
            icon: <FiClock size={20} />,
            color: '#F56D2D',
            active: statusFilter === 'pending' || statusFilter === 'inprogress'
          },
          {
            id: 'completed',
            label: 'Completed',
            val: statistics.completed || 0,
            icon: <FiCheckCircle size={20} />,
            color: '#10B981',
            active: statusFilter === 'completed'
          },
          {
            id: 'declined',
            label: 'Declined / Cancelled',
            val: statistics.declined || 0,
            icon: <FiXCircle size={20} />,
            color: '#EF4444',
            active: statusFilter === 'declined'
          },
          {
            id: 'expired',
            label: 'Expired',
            val: statistics.expired || 0,
            icon: <FiFileText size={20} />,
            color: '#6B7280',
            active: statusFilter === 'expired'
          }
        ].map((stat) => (
          <div key={stat.id} className="col-lg-3 col-md-6 col-12">
            <div
              className={`stat-card ${stat.active ? 'active' : ''}`}
              onClick={() => {
                if (stat.id === 'pending') {
                  setStatusFilter(statusFilter === 'pending' || statusFilter === 'inprogress' ? 'all' : 'pending');
                } else {
                  setStatusFilter(statusFilter === stat.id ? 'all' : stat.id);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div className="stat-icon" style={{ color: stat.color }}>
                  {stat.icon}
                </div>
              </div>
              <div className="stat-count-wrapper">
                <div className="stat-count">{stat.val}</div>
              </div>
              <div className="mt-2 text-center w-100">
                <p className="mb-0 text-muted small fw-semibold">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row items-center gap-3 mb-6 mt-4">
        <div className="relative w-full md:w-[350px] group">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F56D2D] transition-colors" size={16} />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8F0FF] rounded-2xl text-[13px] font-medium text-gray-700 focus:border-[#F56D2D]/30 outline-none transition-all placeholder:text-gray-400"
            placeholder="Search request or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full md:w-auto relative">
          <select
            className="w-full pl-4 pr-10 py-2.5 bg-white border border-[#E8F0FF] rounded-2xl text-[12px] font-bold uppercase tracking-wider text-gray-500 cursor-pointer appearance-none transition-all hover:border-[#F56D2D]/30 outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="inprogress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
            <option value="expired">Expired</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
      </div>

      {/* Signature Requests List */}
      <div className="signature-requests-list">
        {filteredRequests.length === 0 ? (
          <div className="py-20 text-center w-full">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
              <FiFileText size={40} className="text-gray-300" />
            </div>
            <h5 className="text-gray-900 font-bold mb-1" style={{ color: '#131323' }}>No requests found</h5>
            <p className="text-gray-500 text-sm">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters or search'
                : 'Signature requests will appear here when created'}
            </p>
          </div>
        ) : (
          <div className="row g-3 w-full">
            {filteredRequests
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((request, index) => {
                const documentId = request.document_id || request.id;
                const documentName = request.document_name || request.doc_name || 'Document';
                const clientName = request.client_name || request.client?.full_name || 'Unknown Client';
                const statusBadge = getStatusBadge(request);
                const userData = getUserData();
                const currentUserId = userData?.id || userData?.user?.id;
                const isAssignedPreparer = request.assigned_preparer_ids?.includes(currentUserId);
                const isFirmAdmin = userData?.role === 'FirmAdmin' || userData?.user?.role === 'FirmAdmin' || userData?.is_firm_admin;
                const isCreator = currentUserId && request.requested_by && String(currentUserId) === String(request.requested_by);
                const canManage = isCreator || isFirmAdmin;

                return (
                  <div key={`${request.id}-${index}`} className="col-md-6 col-12">
                    <div
                      className="client-card bg-white !rounded-2xl p-3 transition-all cursor-pointer hover:bg-[#FFF4E6] hover:border-[#F56D2D]/30 h-full flex flex-column"
                      onClick={() => handleViewDetails(request)}
                      style={{ border: '1px solid #E8F0FF' }}
                    >
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="flex gap-2.5">
                          <div className="client-initials flex-shrink-0" style={{ width: '36px', height: '36px', background: '#E8F0FF', borderRadius: '50%', color: '#131323', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                            {getInitials(clientName)}
                          </div>
                          <div className="flex flex-column" style={{ overflow: 'hidden' }}>
                            <h6 className="mb-0 font-bold truncate" style={{ color: '#131323', fontSize: '14px', lineHeight: '1.2' }}>
                              {request.title || documentName}
                            </h6>
                            <span className="text-gray-400 text-[11px] font-medium truncate">{clientName}</span>
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              <span className={`status-badge ${statusBadge.className}`} style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '20px' }}>
                                {statusBadge.text}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className="text-gray-400 block" style={{ fontSize: '9px' }}>
                            {formatDate(request.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3 p-1.5 bg-gray-50 rounded-xl border border-gray-100">
                        <FiFileText size={12} className="text-[#3AD6F2]" />
                        <span className="text-[11px] font-semibold text-gray-600 truncate" title={documentName}>
                          {documentName}
                        </span>
                      </div>

                      {/* Action Required Alert */}
                      {request.preparer_must_sign === true && request.preparer_signed === false && (() => {
                        const userEmail = userData?.email || userData?.user?.email;
                        const preparerEmail = request.preparer_email;
                        if (userEmail === preparerEmail) {
                          return (
                            <div className="mb-3 p-1.5 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
                              <FiPenTool size={12} className="text-amber-500" />
                              <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider">
                                Action Required
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <div className="mt-auto pt-2.5 border-t border-gray-100 flex flex-wrap gap-1.5">
                        {request.document_url && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPreviewDocument({
                                url: request.document_url,
                                name: request.document_name || request.title || 'Document',
                                isAnnotated: false
                              });
                              setShowPreviewModal(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-gray-50 text-[#3B4A66] border border-[#E8F0FF] !rounded-xl text-[10px] font-bold hover:bg-gray-100 transition-all"
                          >
                            <FiEye size={12} />
                            Preview
                          </button>
                        )}

                        {areTaxpayerAndSpouseSigned(request) &&
                          request.preparer_must_sign === true &&
                          request.preparer_signed === false &&
                          (isAssignedPreparer || !request.assigned_preparer_ids?.length) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const pdfUrl = request.annotated_pdf_url || request.document_url;
                                setSelectedDocumentForAnnotation({
                                  url: pdfUrl,
                                  name: request.document_name || request.title || 'Document',
                                  id: request.id,
                                  document_id: request.document
                                });
                                setShowAnnotationModal(true);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#00C0C6] text-white !rounded-xl text-[10px] font-bold hover:brightness-110 transition-all shadow-sm"
                            >
                              <FiPenTool size={12} />
                              Sign
                            </button>
                          )}

                        {request.annotated_pdf_url && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPreviewDocument({
                                url: request.annotated_pdf_url,
                                name: request.document_name || request.title || 'Document',
                                isAnnotated: true
                              });
                              setShowPreviewModal(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#F6FAFF] text-[#3AD6F2] border border-[#3AD6F2]/20 !rounded-xl text-[10px] font-bold hover:bg-[#3AD6F2]/5 transition-all"
                          >
                            <FiEye size={12} />
                            Full
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            <div className="col-12 mt-6">
              <Pagination
                totalItems={filteredRequests.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                startIndex={(currentPage - 1) * itemsPerPage}
                endIndex={Math.min(currentPage * itemsPerPage, filteredRequests.length)}
              />
            </div>
          </div>
        )}
      </div>


      {/* Create E-Signature Request Modal */}
      <Modal
        show={showCreateModal}
        onHide={processing ? undefined : handleCloseCreateModal}
        size="lg"
        centered
        scrollable
        backdrop={processing ? 'static' : true}
        keyboard={!processing}
        style={{ fontFamily: 'BasisGrotesquePro' }}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>
            Create E-Signature Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }} className="p-0 custom-scrollbar">
          <div style={{ padding: '24px', paddingBottom: '200px' }}>
            <div className="d-flex flex-column gap-4">
              {/* Client Selection */}
              <div>
                <label style={{ color: '#3B4A66', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                  Client (Taxpayer) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div className="position-relative" ref={clientDropdownRef}>
                  <button
                    type="button"
                    className="form-control text-start d-flex justify-content-between align-items-center"
                    onClick={() => {
                      if (creating || processing) return;
                      setShowClientDropdown(!showClientDropdown);
                      if (!showClientDropdown && clients.length === 0) {
                        fetchClients();
                      }
                    }}
                    disabled={creating || processing}
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: creating || processing ? '#F3F4F6' : 'white',
                      cursor: creating || processing ? 'not-allowed' : 'pointer',
                      opacity: creating || processing ? 0.6 : 1
                    }}
                  >
                    <span style={{ color: selectedClient ? '#3B4A66' : '#9CA3AF' }}>
                      {selectedClient
                        ? (selectedClient.full_name || selectedClient.name || selectedClient.client_name || `Client #${selectedClient.id}`)
                        : 'Select a client'}
                    </span>
                    <span style={{ color: '#6B7280' }}>▼</span>
                  </button>
                  {showClientDropdown && (
                    <div
                      className="position-absolute w-100 bg-white border rounded shadow-lg"
                      style={{
                        top: '100%',
                        left: 0,
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}
                    >
                      {loadingClients ? (
                        <div className="p-3 text-center text-muted">Loading clients...</div>
                      ) : clients.length === 0 ? (
                        <div className="p-3 text-center text-muted">No clients found</div>
                      ) : (
                        clients.map((client) => (
                          <button
                            key={client.id || client.client_id}
                            type="button"
                            className="w-100 text-start p-3 border-0 bg-white"
                            style={{
                              cursor: 'pointer',
                              borderBottom: '1px solid #F3F4F6'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                            onClick={() => {
                              setSelectedClient(client);
                              setShowClientDropdown(false);
                              // Check if client has spouse and get spouse info
                              if (client.id || client.client_id) {
                                taxPreparerClientAPI.checkClientSpouse(client.id || client.client_id)
                                  .then(res => {
                                    if (res.success && res.data?.has_spouse) {
                                      setHasSpouse(true);
                                      // Try to get spouse email and name from client data
                                      if (res.data.spouse_email) {
                                        setSpouseEmail(res.data.spouse_email);
                                      } else if (client.spouse_contact_details?.email) {
                                        setSpouseEmail(client.spouse_contact_details.email);
                                      } else if (client.spouseContact?.email) {
                                        setSpouseEmail(client.spouseContact.email);
                                      }
                                      if (res.data.spouse_name) {
                                        setSpouseName(res.data.spouse_name);
                                      } else if (client.spouse_information?.name) {
                                        setSpouseName(client.spouse_information.name);
                                      } else if (client.spouse?.name) {
                                        setSpouseName(client.spouse.name);
                                      }
                                    } else {
                                      setHasSpouse(false);
                                      setSpouseEmail('');
                                      setSpouseName('');
                                    }
                                  })
                                  .catch(() => { });
                              }
                            }}
                          >
                            {client.full_name || client.name || client.client_name || `Client #${client.id || client.client_id}`}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Has Spouse Toggle */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  justifyContent: 'space-between',
                  cursor: creating || processing ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#3B4A66',
                  opacity: creating || processing ? 0.6 : 1
                }}>
                  <span>Client has a spouse (spouse signature required)</span>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <input
                      type="checkbox"
                      checked={hasSpouse}
                      onChange={async (e) => {
                        const checked = e.target.checked;
                        if (!checked) {
                          setHasSpouse(false);
                          setSpouseEmail('');
                          setSpouseName('');
                          return;
                        }

                        // If checking, validate that client has a spouse
                        if (!selectedClient) {
                          toast.error('Please select a client first.');
                          return;
                        }

                        try {
                          const clientId = selectedClient.id || selectedClient.client_id;
                          const response = await taxPreparerClientAPI.checkClientSpouse(clientId);

                          if (response.success && response.data) {
                            if (response.data.has_spouse) {
                              setHasSpouse(true);
                              // Try to get spouse email and name
                              if (response.data.spouse_email || response.data.spouse_info?.spouse_email) {
                                setSpouseEmail(response.data.spouse_email || response.data.spouse_info.spouse_email);
                              }
                              if (response.data.spouse_name || response.data.spouse_info?.spouse_name) {
                                setSpouseName(response.data.spouse_name || response.data.spouse_info.spouse_name);
                              }
                            } else {
                              toast.error('This client does not have a partner/spouse. Spouse signature cannot be required.');
                            }
                          } else {
                            toast.error('Failed to check spouse information. Please try again.');
                          }
                        } catch (error) {
                          console.error('Error checking spouse:', error);
                          toast.error(handleAPIError(error) || 'Failed to check spouse information. Please try again.');
                        }
                      }}
                      disabled={creating || processing}
                      style={{
                        width: '44px',
                        height: '24px',
                        appearance: 'none',
                        backgroundColor: hasSpouse ? '#00C0C6' : '#D1D5DB',
                        borderRadius: '12px',
                        position: 'relative',
                        cursor: creating || processing ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s',
                        outline: 'none'
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        left: hasSpouse ? '22px' : '2px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: 'left 0.2s',
                        pointerEvents: 'none',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    />
                  </div>
                </label>
              </div>

              {/* Spouse Email (required if has_spouse) */}




              {/* Preparer Must Sign Toggle */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: creating || processing ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#3B4A66',
                  opacity: creating || processing ? 0.6 : 1
                }}>
                  <span>Preparer must sign</span>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <input
                      type="checkbox"
                      checked={preparerMustSign}
                      onChange={(e) => setPreparerMustSign(e.target.checked)}
                      disabled={creating || processing}
                      style={{
                        width: '44px',
                        height: '24px',
                        appearance: 'none',
                        backgroundColor: preparerMustSign ? '#00C0C6' : '#D1D5DB',
                        borderRadius: '12px',
                        position: 'relative',
                        cursor: creating || processing ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s',
                        outline: 'none'
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        left: preparerMustSign ? '22px' : '2px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: 'left 0.2s',
                        pointerEvents: 'none',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    />
                  </div>
                </label>
              </div>

              {/* PDF File Upload */}
              <div>
                <label style={{ color: '#3B4A66', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                  PDF File <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="form-control"
                  style={{
                    borderColor: '#E5E7EB',
                    padding: '8px',
                    borderRadius: '8px',
                    opacity: creating || processing ? 0.6 : 1
                  }}
                  disabled={creating || processing}
                />
                {selectedFile && (
                  <div className="mt-2 p-2 bg-gray-50 rounded" style={{ borderRadius: '8px' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H2C1.44772 2 1 2.44772 1 3V13C1 13.5523 1.44772 14 2 14H14C14.5523 14 15 13.5523 15 13V3C15 2.44772 14.5523 2 14 2Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M5 6H11M5 9H11M5 12H8" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ color: '#3B4A66', fontSize: '14px', fontFamily: 'BasisGrotesquePro' }}>
                          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="btn "
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          padding: '4px 8px'
                        }}
                        disabled={creating || processing}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-muted mt-1" style={{ fontSize: '12px', fontFamily: 'BasisGrotesquePro' }}>
                  Upload a PDF file (max 10MB). The file will be saved to the preparer's documents.
                </p>
              </div>

              {/* Folder Selection (Optional) */}
              <div>
                <label style={{ color: '#3B4A66', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                  Folder (Optional)
                </label>
                <div className="position-relative" ref={folderDropdownRef}>
                  <button
                    type="button"
                    className="form-control text-start d-flex justify-content-between align-items-center"
                    onClick={() => {
                      if (creating || processing || loadingFolders) return;
                      setShowFolderDropdown(!showFolderDropdown);
                      if (!showFolderDropdown && folders.length === 0) {
                        fetchFolders();
                      }
                    }}
                    disabled={creating || processing || loadingFolders}
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: creating || processing || loadingFolders ? '#F3F4F6' : 'white',
                      cursor: creating || processing || loadingFolders ? 'not-allowed' : 'pointer',
                      opacity: creating || processing || loadingFolders ? 0.6 : 1
                    }}
                  >
                    <span style={{ color: selectedFolder ? '#3B4A66' : '#9CA3AF' }}>
                      {loadingFolders ? 'Loading folders...' : (selectedFolder
                        ? (selectedFolder.title || selectedFolder.name || selectedFolder.folder_name || `Folder #${selectedFolder.id}`)
                        : 'Select a folder (optional)')}
                    </span>
                    {loadingFolders ? (
                      <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: '16px', height: '16px', borderWidth: '2px' }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      <span style={{ color: '#6B7280' }}>▼</span>
                    )}
                  </button>
                  {showFolderDropdown && (
                    <div
                      className="position-absolute w-100 bg-white border rounded shadow-lg"
                      style={{
                        top: '100%',
                        left: 0,
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}
                    >
                      <button
                        type="button"
                        className="w-100 text-start p-3 border-0 bg-white"
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid #F3F4F6'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        onClick={() => {
                          setSelectedFolder(null);
                          setShowFolderDropdown(false);
                        }}
                      >
                        None
                      </button>
                      {loadingFolders ? (
                        <div className="p-3 text-center text-muted">Loading folders...</div>
                      ) : folders.length === 0 ? (
                        <div className="p-3 text-center text-muted">No folders found</div>
                      ) : (
                        folders.map((folder) => (
                          <button
                            key={folder.id || folder.folder_id}
                            type="button"
                            className="w-100 text-start p-3 border-0 bg-white"
                            style={{
                              cursor: 'pointer',
                              borderBottom: '1px solid #F3F4F6'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                            onClick={() => {
                              setSelectedFolder(folder);
                              setShowFolderDropdown(false);
                            }}
                          >
                            {folder.title || folder.name || folder.folder_name || `Folder #${folder.id || folder.folder_id}`}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label style={{ color: '#3B4A66', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                  Deadline <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    borderColor: '#E5E7EB',
                    borderRadius: '8px',
                    opacity: creating || processing ? 0.6 : 1
                  }}
                  disabled={creating || processing}
                  required
                />
                <p className="text-muted mt-1" style={{ fontSize: '12px', fontFamily: 'BasisGrotesquePro' }}>
                  Select a date for the signature deadline (required)
                </p>
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button
            className="btn"
            onClick={handleCloseCreateModal}
            disabled={processing}
            style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              color: processing ? '#9CA3AF' : '#3B4A66',
              fontFamily: 'BasisGrotesquePro',
              borderRadius: '8px',
              opacity: processing ? 0.6 : 1,
              cursor: processing ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            className="btn"
            onClick={handleCreateESignRequest}
            disabled={creating || processing || !selectedClient || !selectedFile || !deadline}
            style={{
              backgroundColor: creating || processing || !selectedClient || !selectedFile ? '#D1D5DB' : '#00C0C6',
              border: 'none',
              color: 'white',
              fontFamily: 'BasisGrotesquePro',
              fontWeight: '500',
              borderRadius: '8px'
            }}
          >
            {creating ? 'Creating...' : processing ? 'Processing...' : 'Create Request'}
          </button>
        </Modal.Footer>
      </Modal >

      {/* Processing Modal */}
      < ProcessingModal
        show={processing}
        processingStatus={processingStatus}
        processingError={processingError}
        onClose={handleCloseProcessingModal}
      />

      {/* SignWell Embedded Signing Modal */}
      < Modal
        show={showSignWellModal}
        onHide={() => {
          // Clean up any polling intervals
          if (window.signWellPollCleanup) {
            window.signWellPollCleanup();
            window.signWellPollCleanup = null;
          }
          setShowSignWellModal(false);
          setSignWellEmbeddedUrl(null);
          setCurrentSigningRequest(null);
          // Refresh requests after a short delay
          setTimeout(() => fetchSignatureRequests(), 1000);
        }
        }
        size="xl"
        centered
        fullscreen="lg-down"
        dialogClassName="signwell-modal"
        style={{ fontFamily: 'BasisGrotesquePro' }}
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #E5E7EB' }}>
          <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>
            Sign Document
            {currentSigningRequest?.document_name && (
              <span style={{ fontSize: '14px', fontWeight: '400', color: '#6B7280', marginLeft: '8px' }}>
                - {currentSigningRequest.document_name}
              </span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, height: '80vh', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          {/* Instructions */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#F0FDFA',
            borderBottom: '1px solid #99F6E4',
            fontSize: '13px',
            color: '#0D9488',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span>
              <strong>Drag & Drop Signing:</strong> Click on the document to place your signature. You can draw, type, or upload your signature.
            </span>
          </div>
          {/* SignWell Embedded iframe */}
          {signWellEmbeddedUrl ? (
            <iframe
              ref={signWellIframeRef}
              src={signWellEmbeddedUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                minHeight: '600px',
                flex: 1,
                backgroundColor: '#F9FAFB'
              }}
              title="SignWell Document Signing"
              allow="camera; microphone; geolocation; clipboard-write"
              onError={(e) => {
                console.error('SignWell iframe load error:', e);
                // Fallback to new window if iframe fails
                setShowSignWellModal(false);
                if (signWellEmbeddedUrl && currentSigningRequest) {
                  openSignWellInNewWindow(signWellEmbeddedUrl, currentSigningRequest);
                }
              }}
            />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#6B7280',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span>Loading signing interface...</span>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #E5E7EB', padding: '12px 16px' }}>
          <button
            onClick={() => {
              // Open in new window as fallback
              if (signWellEmbeddedUrl && currentSigningRequest) {
                setShowSignWellModal(false);
                openSignWellInNewWindow(signWellEmbeddedUrl, currentSigningRequest);
              }
            }}
            style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              color: '#3B4A66',
              fontFamily: 'BasisGrotesquePro',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open in New Window
          </button>
        </Modal.Footer>
      </Modal >

      {/* PDF Signature Modal */}
      < PdfSignatureModal
        isOpen={showPdfSignatureModal}
        onClose={() => {
          setShowPdfSignatureModal(false);
          setCurrentSignatureRequest(null);
        }}
        request={currentSignatureRequest}
        onSignComplete={() => {
          fetchSignatureRequests();
        }}
      />

      {/* Signing Status Modal */}
      <Modal
        show={showSigningStatusModal}
        onHide={() => {
          setShowSigningStatusModal(false);
          setSelectedSigningStatus(null);
        }}
        centered
        style={{ fontFamily: 'BasisGrotesquePro' }}
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #E5E7EB' }}>
          <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>
            Signing Status
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '24px' }}>
          {selectedSigningStatus && (
            <div className="d-flex flex-column gap-3">
              {/* Taxpayer Signed */}
              <div className="d-flex justify-content-between align-items-center" style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <span style={{ color: '#3B4A66', fontSize: '14px', fontWeight: '500' }}>
                  Taxpayer Signed:
                </span>
                <span style={{
                  color: selectedSigningStatus.taxpayer_signed ? '#10B981' : '#6B7280',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {selectedSigningStatus.taxpayer_signed ? 'Signed' : 'Not Signed'}
                </span>
              </div>

              {/* Preparer Signed */}
              <div className="d-flex justify-content-between align-items-center" style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <span style={{ color: '#3B4A66', fontSize: '14px', fontWeight: '500' }}>
                  Preparer Signed:
                </span>
                <span style={{
                  color: selectedSigningStatus.preparer_signed ? '#10B981' : '#6B7280',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {selectedSigningStatus.preparer_signed ? 'Signed' : 'Not Signed'}
                </span>
              </div>

              {/* Spouse Signed */}
              <div className="d-flex justify-content-between align-items-center" style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <span style={{ color: '#3B4A66', fontSize: '14px', fontWeight: '500' }}>
                  Spouse Signed:
                </span>
                <span style={{
                  color: selectedSigningStatus.spouse_sign === false ? '#9CA3AF' : selectedSigningStatus.spouse_signed ? '#10B981' : '#6B7280',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {selectedSigningStatus.spouse_sign === false ? 'Not Required' : selectedSigningStatus.spouse_signed ? 'Signed' : 'Not Signed'}
                </span>
              </div>

              {/* Preparer Must Sign */}
              <div className="d-flex justify-content-between align-items-center" style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <span style={{ color: '#3B4A66', fontSize: '14px', fontWeight: '500' }}>
                  Preparer Must Sign:
                </span>
                <span style={{
                  color: selectedSigningStatus.preparer_must_sign ? '#F59E0B' : '#9CA3AF',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {selectedSigningStatus.preparer_must_sign ? 'Yes' : 'No'}
                </span>
              </div>

              {/* Preparer Needs to Sign */}
              {selectedSigningStatus.preparer_must_sign && (
                <div className="d-flex justify-content-between align-items-center" style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <span style={{ color: '#3B4A66', fontSize: '14px', fontWeight: '500' }}>
                    Preparer Needs to Sign:
                  </span>
                  <span style={{
                    color: selectedSigningStatus.preparer_needs_to_sign ? '#F59E0B' : '#9CA3AF',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {selectedSigningStatus.preparer_needs_to_sign ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #E5E7EB' }}>
          <button
            className="btn"
            onClick={() => {
              setShowSigningStatusModal(false);
              setSelectedSigningStatus(null);
            }}
            style={{
              fontFamily: 'BasisGrotesquePro',
              backgroundColor: '#F3F4F6',
              color: '#3B4A66',
              border: '1px solid #E5E7EB',
              fontWeight: '500',
              padding: '8px 16px',
              borderRadius: '6px'
            }}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>

      {/* PDF Preview Modal */}
      <Modal
        show={showPreviewModal}
        onHide={() => {
          setShowPreviewModal(false);
          setSelectedPreviewDocument(null);
        }}
        size="lg"
        centered
        scrollable
        dialogClassName="pdf-preview-modal"
        style={{ fontFamily: 'BasisGrotesquePro' }}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600' }}>
            {selectedPreviewDocument
              ? `E-Signature – ${selectedPreviewDocument.isAnnotated ? 'Annotated ' : ''}${selectedPreviewDocument.name}`
              : 'E-Signature – Document Preview'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedPreviewDocument?.url ? (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <PDFViewer
                pdfUrl={selectedPreviewDocument.url}
                height="50vh"
                showThumbnails={false}
                className="w-100"
              />
            </div>
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
              setSelectedPreviewDocument(null);
            }}
            style={{ fontFamily: 'BasisGrotesquePro' }}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>

      {/* PDF Annotation Modal */}
      {
        showAnnotationModal && selectedDocumentForAnnotation && (
          <PdfAnnotationModal
            isOpen={showAnnotationModal}
            onClose={() => {
              setShowAnnotationModal(false);
              setSelectedDocumentForAnnotation(null);
            }}
            documentUrl={selectedDocumentForAnnotation.url}
            documentName={selectedDocumentForAnnotation.name}
            requestId={selectedDocumentForAnnotation.id}
            onSave={async (annotationData) => {
              try {
                console.log('💾 Preparing to save preparer annotations:', {
                  esign_request_id: selectedDocumentForAnnotation.id,
                  document_id: selectedDocumentForAnnotation.document_id,
                  annotations_count: annotationData.annotations?.length || 0,
                  images_count: annotationData.images?.length || 0,
                  pdf_scale: annotationData.pdf_scale,
                  canvas_info: annotationData.canvas_info
                });

                // Send to backend using tax preparer specific API with A4 coordinate conversion
                const response = await annotationAPI.savePreparerAnnotations({
                  pdfUrl: selectedDocumentForAnnotation.url,
                  annotations: annotationData.annotations || [],
                  images: annotationData.images || [],
                  pdf_scale: annotationData.pdf_scale || 1.5,
                  canvas_info: annotationData.canvas_info,
                  canvasWidth: annotationData.canvas_info?.width,
                  canvasHeight: annotationData.canvas_info?.height,
                  requestId: selectedDocumentForAnnotation.document_id,
                  esign_document_id: selectedDocumentForAnnotation.id,
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
        )
      }

    </div >
  );
}

