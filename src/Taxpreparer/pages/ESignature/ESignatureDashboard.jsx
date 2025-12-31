import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { signatureRequestsAPI, taxPreparerClientAPI, taxPreparerDocumentsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { FiClock, FiCheckCircle, FiXCircle, FiFileText, FiSearch, FiFilter, FiRefreshCw, FiPlus } from 'react-icons/fi';
import ProcessingModal from '../../../components/ProcessingModal';
import '../../styles/esignature-dashboard.css';

export default function ESignatureDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signatureRequests, setSignatureRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, completed, declined, expired
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
  const [preparerMustSign, setPreparerMustSign] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [deadline, setDeadline] = useState('');
  
  // Processing state for async e-sign document creation
  const [processing, setProcessing] = useState(false);
  const [documentId, setDocumentId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [processingError, setProcessingError] = useState(null);
  
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

  // Fetch signature requests
  useEffect(() => {
    fetchSignatureRequests();
  }, []);

  // Filter requests when search term or status filter changes
  useEffect(() => {
    filterRequests();
  }, [searchTerm, statusFilter, signatureRequests]);

  const fetchSignatureRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all signature requests
      const response = await signatureRequestsAPI.getSignatureRequests();
      
      if (response.success && response.data) {
        let requests = [];
        
        if (response.data.requests && Array.isArray(response.data.requests)) {
          requests = response.data.requests;
        } else if (Array.isArray(response.data)) {
          requests = response.data;
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
      completed: 0,
      declined: 0,
      expired: 0,
      total: requests.length
    };

    requests.forEach(request => {
      const status = request.status?.toLowerCase();
      
      if (status === 'pending' || status === 'sent' || status === 'viewed') {
        stats.pending++;
      } else if (status === 'completed' || status === 'signed') {
        stats.completed++;
      } else if (status === 'declined' || status === 'cancelled') {
        stats.declined++;
      } else if (status === 'expired' || isExpired(request)) {
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
            return status === 'pending' || status === 'sent' || status === 'viewed';
          case 'completed':
            return status === 'completed' || status === 'signed';
          case 'declined':
            return status === 'declined' || status === 'cancelled';
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
    const isExpiredRequest = isExpired(request);
    
    if (isExpiredRequest && status !== 'completed' && status !== 'signed') {
      return {
        text: 'Expired',
        className: 'status-badge-expired'
      };
    }
    
    switch (status) {
      case 'pending':
        return { text: 'Pending', className: 'status-badge-pending' };
      case 'sent':
        return { text: 'Sent', className: 'status-badge-sent' };
      case 'viewed':
        return { text: 'Viewed', className: 'status-badge-viewed' };
      case 'signed':
        return { text: 'Signed', className: 'status-badge-signed' };
      case 'completed':
        return { text: 'Completed', className: 'status-badge-completed' };
      case 'declined':
        return { text: 'Declined', className: 'status-badge-declined' };
      case 'cancelled':
        return { text: 'Cancelled', className: 'status-badge-declined' };
      case 'expired':
        return { text: 'Expired', className: 'status-badge-expired' };
      default:
        return { text: status || 'Unknown', className: 'status-badge-default' };
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

  const handleViewDetails = (request, e) => {
    // Check if preparer needs to sign
    if (request.preparer_must_sign === true && request.preparer_needs_to_sign === true && request.embedded_url) {
      e?.stopPropagation();
      // Open SignWell in a new window/tab (cannot use iframe due to X-Frame-Options)
      const signWellWindow = window.open(request.embedded_url, '_blank', 'width=1200,height=800');
      
      if (signWellWindow) {
        // Show a toast notification
        toast.info('Opening SignWell signing page in a new window. Please sign the document there.', {
          autoClose: 5000,
          position: "top-right"
        });
        
        // Poll for status updates using the polling endpoint
        const esignDocumentId = request.id || request.esign_id || request.document;
        console.log('Starting polling for e-sign document:', esignDocumentId, request);
        if (esignDocumentId) {
          // Declare pollInterval variable first
          let pollInterval = null;
          
          // Start polling immediately, then continue every 10 seconds
          const pollStatus = async () => {
            try {
              console.log('Polling e-sign status for document:', esignDocumentId);
              const pollResponse = await signatureRequestsAPI.pollESignStatus(esignDocumentId);
              console.log('Poll response:', pollResponse);
              if (pollResponse.success && pollResponse.data) {
                // Update the request status if it changed
                setSignatureRequests(prevRequests => 
                  prevRequests.map(req => 
                    req.id === esignDocumentId 
                      ? { ...req, ...pollResponse.data }
                      : req
                  )
                );
                
                // If document is completed/signed, stop polling and refresh full list
                if (pollResponse.data.status === 'signed' || 
                    pollResponse.data.status === 'completed' ||
                    pollResponse.data.status === 'cancelled') {
                  if (pollInterval) {
                    clearInterval(pollInterval);
                  }
                  if (signWellWindow.closed) {
                    setTimeout(() => fetchSignatureRequests(), 1000);
                  } else {
                    // Refresh full list even if window is still open
                    fetchSignatureRequests();
                  }
                }
              }
            } catch (pollError) {
              console.error('Error polling e-sign status:', pollError);
              // Continue polling even if one request fails
            }
          };
          
          // Start polling immediately
          pollStatus();
          
          // Then poll every 10 seconds
          pollInterval = setInterval(pollStatus, 10000);
          
          // Stop polling when window is closed
          const windowCheckInterval = setInterval(() => {
            if (signWellWindow.closed) {
              clearInterval(windowCheckInterval);
              clearInterval(pollInterval);
              setTimeout(() => fetchSignatureRequests(), 1000);
            }
          }, 2000);
          
          // Clean up intervals after 5 minutes
          setTimeout(() => {
            clearInterval(pollInterval);
            clearInterval(windowCheckInterval);
            fetchSignatureRequests();
          }, 300000);
        } else {
          // Fallback: Poll for window closure and refresh
          const checkInterval = setInterval(() => {
            if (signWellWindow.closed) {
              clearInterval(checkInterval);
              setTimeout(() => {
                fetchSignatureRequests();
              }, 1000);
            }
          }, 2000);
          
          // Also set a timeout to refresh after 30 seconds regardless
          setTimeout(() => {
            clearInterval(checkInterval);
            fetchSignatureRequests();
          }, 30000);
        }
      } else {
        toast.error('Please allow pop-ups for this site to open the signing page', {
          autoClose: 5000,
          position: "top-right"
        });
      }
    } else {
      // Navigate to client details with e-sign logs
      if (request.client_id || request.client?.id) {
        const clientId = request.client_id || request.client.id;
        navigate(`/taxdashboard/clients/${clientId}/esign-logs`);
      }
    }
  };

  const handleRefresh = () => {
    fetchSignatureRequests();
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
        const response = await signatureRequestsAPI.pollESignStatus(id);
        console.log(`[Poll ${attempts + 1}] Response:`, response);
        
        if (response.success && response.data) {
          const { status, processing_status, processing_error, signing_url, signer_urls } = response.data;
          
          console.log(`[Poll ${attempts + 1}] Status: ${status}, Processing Status: ${processing_status}`);
          
          // Update processing status for UI
          setProcessingStatus(processing_status);
          
          // Check if processing is complete
          if (processing_status === 'completed' && status === 'ready') {
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
          } else if (processing_status === 'failed') {
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
              console.log(`[Poll ${attempts}] Still processing, will poll again in ${POLL_INTERVAL/1000} seconds...`);
              pollTimeoutId = setTimeout(poll, POLL_INTERVAL);
              return { processing: true, status: processing_status };
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
    console.log(`Starting status polling for document ID: ${id} - will poll every ${POLL_INTERVAL/1000} seconds`);
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

    try {
      setCreating(true);
      setProcessingError(null);
      
      const requestData = {
        taxpayer_id: selectedClient.id || selectedClient.client_id,
        has_spouse: hasSpouse,
        preparer_must_sign: preparerMustSign,
        file: selectedFile,
        ...(selectedFolder && { folder_id: selectedFolder.id || selectedFolder.folder_id }),
        ...(deadline && { deadline })
      };

      const response = await taxPreparerClientAPI.createESignRequest(requestData);

      if (response.success) {
        // Check if document is being processed asynchronously
        const documentData = response.data;
        const status = documentData?.status;
        const processingStatus = documentData?.processing_status;
        
        // Check if response indicates async processing
        // Response structure: { success: true, data: { id, status: "processing", processing_status: "pending", ... } }
        console.log('Create response received:', {
          success: response.success,
          documentData: documentData,
          status: status,
          processingStatus: processingStatus
        });
        
        if (status === 'processing' || processingStatus) {
          // Document is being processed asynchronously
          console.log('E-sign document created, starting background processing:', {
            id: documentData.id,
            status: status,
            processing_status: processingStatus
          });
          
          setDocumentId(documentData.id);
          setProcessingStatus(processingStatus || 'pending');
          setProcessing(true);
          setCreating(false);
          
          // Start polling every 3 seconds
          console.log('Calling pollStatus with document ID:', documentData.id);
          pollStatus(documentData.id);
        } else {
          // Immediate success (legacy behavior - document ready immediately)
          toast.success('E-Signature request created successfully!', {
            position: "top-right",
            autoClose: 3000,
          });
          handleCloseCreateModal();
          fetchSignatureRequests(); // Refresh the list
        }
      } else {
        throw new Error(response.message || 'Failed to create e-signature request');
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
    <div className="esignature-dashboard-container" style={{ fontFamily: 'BasisGrotesquePro' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ color: '#3B4A66', fontWeight: '600', marginBottom: '8px' }}>
            E-Signature Dashboard
          </h2>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
            Track and manage all e-signature requests across your clients
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={handleOpenCreateModal}
            className="btn d-flex align-items-center gap-2"
            style={{
              backgroundColor: '#00C0C6',
              border: 'none',
              color: 'white',
              fontFamily: 'BasisGrotesquePro',
              fontWeight: '500'
            }}
          >
            <FiPlus size={16} />
            Create E-Signature Request
          </button>
          <button
            onClick={handleRefresh}
            className="btn d-flex align-items-center gap-2"
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

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="stat-card stat-card-pending">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="stat-label">Pending Signatures</p>
                <h3 className="stat-value">{statistics.pending}</h3>
              </div>
              <div className="stat-icon">
                <FiClock size={32} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="stat-card stat-card-completed">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="stat-label">Completed</p>
                <h3 className="stat-value">{statistics.completed}</h3>
              </div>
              <div className="stat-icon">
                <FiCheckCircle size={32} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="stat-card stat-card-declined">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="stat-label">Declined / Cancelled</p>
                <h3 className="stat-value">{statistics.declined}</h3>
              </div>
              <div className="stat-icon">
                <FiXCircle size={32} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="stat-card stat-card-expired">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="stat-label">Expired</p>
                <h3 className="stat-value">{statistics.expired}</h3>
              </div>
              <div className="stat-icon">
                <FiFileText size={32} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="d-flex flex-column flex-md-row gap-3 mb-4">
        <div className="flex-grow-1 position-relative">
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
            placeholder="Search by client name, document, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: '40px',
              fontFamily: 'BasisGrotesquePro',
              borderColor: '#E5E7EB'
            }}
          />
        </div>
        <div className="d-flex align-items-center gap-2">
          <FiFilter size={18} style={{ color: '#6B7280' }} />
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              fontFamily: 'BasisGrotesquePro',
              borderColor: '#E5E7EB',
              minWidth: '150px'
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Signature Requests List */}
      <div className="signature-requests-list">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-5">
            <FiFileText size={48} style={{ color: '#D1D5DB', marginBottom: '16px' }} />
            <p style={{ color: '#6B7280', fontSize: '16px', marginBottom: '8px' }}>
              No signature requests found
            </p>
            <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Signature requests will appear here when created'}
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredRequests.map((request) => {
              const statusBadge = getStatusBadge(request);
              const clientName = request.client_name || request.client?.full_name || 'Unknown Client';
              const documentName = request.document_name || request.document?.name || 'No Document';
              
              return (
                <div
                  key={request.id}
                  className="signature-request-card"
                  onClick={(e) => handleViewDetails(request, e)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h5 style={{ color: '#3B4A66', fontWeight: '600', margin: 0 }}>
                          {request.title || documentName}
                        </h5>
                        <span className={`status-badge ${statusBadge.className}`}>
                          {statusBadge.text}
                        </span>
                      </div>
                      <div className="d-flex flex-column gap-1 mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>
                            Client:
                          </span>
                          <span style={{ color: '#3B4A66', fontSize: '14px' }}>
                            {clientName}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>
                            Document:
                          </span>
                          <span style={{ color: '#3B4A66', fontSize: '14px' }}>
                            {documentName}
                          </span>
                        </div>
                      </div>
                      {request.description && (
                        <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '8px' }}>
                          {request.description}
                        </p>
                      )}
                      {request.preparer_must_sign === true && request.preparer_needs_to_sign === true && request.embedded_url && (
                        <div className="mb-2">
                          <span style={{ 
                            color: '#00C0C6', 
                            fontSize: '13px', 
                            fontWeight: '500',
                            backgroundColor: '#E0F7FA',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            ⚠️ Preparer signature required - Click to sign
                          </span>
                        </div>
                      )}
                      <div className="d-flex flex-wrap gap-3" style={{ fontSize: '12px', color: '#9CA3AF' }}>
                        <span>
                          Created: {formatDate(request.created_at)}
                        </span>
                        {request.expires_at && (
                          <span>
                            Expires: {formatDate(request.expires_at)}
                          </span>
                        )}
                        {request.signed_at && (
                          <span>
                            Signed: {formatDate(request.signed_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredRequests.length > 0 && (
        <div className="mt-4 text-center" style={{ color: '#6B7280', fontSize: '14px' }}>
          Showing {filteredRequests.length} of {signatureRequests.length} signature request{signatureRequests.length !== 1 ? 's' : ''}
        </div>
      )}


      {/* Create E-Signature Request Modal */}
      <Modal
        show={showCreateModal}
        onHide={processing ? undefined : handleCloseCreateModal}
        size="lg"
        centered
        backdrop={processing ? 'static' : true}
        keyboard={!processing}
        style={{ fontFamily: 'BasisGrotesquePro' }}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>
            Create E-Signature Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '24px' }}>
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
                            // Check if client has spouse
                            if (client.id || client.client_id) {
                              taxPreparerClientAPI.checkClientSpouse(client.id || client.client_id)
                                .then(res => {
                                  if (res.success && res.data?.has_spouse) {
                                    setHasSpouse(true);
                                  }
                                })
                                .catch(() => {});
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

            {/* Has Spouse Checkbox */}
            <div>
              <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hasSpouse}
                  onChange={(e) => setHasSpouse(e.target.checked)}
                  disabled={creating || processing}
                  style={{ cursor: creating || processing ? 'not-allowed' : 'pointer', opacity: creating || processing ? 0.6 : 1 }}
                />
                <span style={{ color: '#3B4A66', fontWeight: '500' }}>
                  Client has a spouse (spouse signature required)
                </span>
              </label>
            </div>

            {/* Preparer Must Sign Checkbox */}
            <div>
              <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={preparerMustSign}
                  onChange={(e) => setPreparerMustSign(e.target.checked)}
                  disabled={creating || processing}
                  style={{ cursor: creating || processing ? 'not-allowed' : 'pointer', opacity: creating || processing ? 0.6 : 1 }}
                />
                <span style={{ color: '#3B4A66', fontWeight: '500' }}>
                  Preparer must sign
                </span>
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
                        <path d="M14 2H2C1.44772 2 1 2.44772 1 3V13C1 13.5523 1.44772 14 2 14H14C14.5523 14 15 13.5523 15 13V3C15 2.44772 14.5523 2 14 2Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 6H11M5 9H11M5 12H8" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                      className="btn btn-sm"
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#EF4444',
                        padding: '4px 8px'
                      }}
                      disabled={creating || processing}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                    if (creating || processing) return;
                    setShowFolderDropdown(!showFolderDropdown);
                    if (!showFolderDropdown && folders.length === 0) {
                      fetchFolders();
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
                  <span style={{ color: selectedFolder ? '#3B4A66' : '#9CA3AF' }}>
                    {selectedFolder 
                      ? (selectedFolder.name || selectedFolder.folder_name || `Folder #${selectedFolder.id}`)
                      : 'Select a folder (optional)'}
                  </span>
                  <span style={{ color: '#6B7280' }}>▼</span>
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
                          {folder.name || folder.folder_name || `Folder #${folder.id || folder.folder_id}`}
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
                Deadline (Optional)
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
              />
              <p className="text-muted mt-1" style={{ fontSize: '12px', fontFamily: 'BasisGrotesquePro' }}>
                Select a date for the signature deadline
              </p>
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
            disabled={creating || processing || !selectedClient || !selectedFile}
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
      </Modal>

      {/* Processing Modal */}
      <ProcessingModal
        show={processing}
        processingStatus={processingStatus}
        processingError={processingError}
        onClose={handleCloseProcessingModal}
      />
    </div>
  );
}

