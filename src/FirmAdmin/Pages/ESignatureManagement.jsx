import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument } from 'pdf-lib';
import { DocumentSuccessIcon, ESignatureUpload } from '../Components/icons';
import { firmAdminClientsAPI, firmAdminDocumentsAPI, handleAPIError, refreshAccessToken, clearUserData, getLoginUrl } from '../../ClientOnboarding/utils/apiUtils';
import { getApiBaseUrl, fetchWithCors } from '../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../ClientOnboarding/utils/userUtils';
import { toast } from 'react-toastify';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  // Try multiple approaches for worker loading
  const workerVersion = pdfjs.version || '5.3.31';

  // First try: Local file from public folder (most reliable)
  // If that fails, react-pdf will fall back to CDN
  const baseUrl = import.meta.env.BASE_URL || '/';

  // Use jsdelivr CDN as primary source (most reliable CDN)
  // The worker file for pdfjs-dist 5.x is at /build/pdf.worker.min.mjs
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${workerVersion}/build/pdf.worker.min.mjs`;
}

export default function ESignatureManagement() {
  const [activeTab, setActiveTab] = useState('Signature Request');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Settings state
  const [defaultExpiry, setDefaultExpiry] = useState('7');
  const [reminderFrequency, setReminderFrequency] = useState('2');
  const [authenticationRequired, setAuthenticationRequired] = useState(true);
  const [smsVerificationRequired, setSmsVerificationRequired] = useState(false);
  const [certificateAuthority, setCertificateAuthority] = useState('DocuSign');
  const [auditTrailRetention, setAuditTrailRetention] = useState('7');
  const [esignActCompliant, setEsignActCompliant] = useState(true);
  const [uetaCompliant, setUetaCompliant] = useState(true);
  const [euEidasCompliant, setEuEidasCompliant] = useState(false);

  // Create Signature Request Modal state
  const [signatureType, setSignatureType] = useState('signature_request');
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [spouseAlso, setSpouseAlso] = useState(false);
  const [documentCategory, setDocumentCategory] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [folderId, setFolderId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Client and folder selection state
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientDropdownRef = useRef(null);
  const [folderTree, setFolderTree] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const folderDropdownRef = useRef(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedFolderPath, setSelectedFolderPath] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState(0);
  const [selectedSigner, setSelectedSigner] = useState('@johndoe');
  const [selectedSignatureType, setSelectedSignatureType] = useState('Signature');
  const [showFinalSignatureModal, setShowFinalSignatureModal] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [commentIconPosition, setCommentIconPosition] = useState(null);
  const [comments, setComments] = useState([]);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [currentComment, setCurrentComment] = useState('');
  const documentContentRef = useRef(null);
  const pdfContainerRef = useRef(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfFileUrl, setPdfFileUrl] = useState(null);
  const [pdfFileData, setPdfFileData] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(5);
  const [pdfPageWidth, setPdfPageWidth] = useState(550);

  // E-Signature Requests state
  const [esignRequests, setEsignRequests] = useState([]);
  const [esignStatistics, setEsignStatistics] = useState({
    total: 0,
    pending: 0,
    sent: 0,
    viewed: 0,
    signed: 0,
    completed: 0,
    cancelled: 0,
    expired: 0
  });
  const [esignLoading, setEsignLoading] = useState(false);
  const [esignError, setEsignError] = useState(null);
  const [esignFilters, setEsignFilters] = useState({
    status: '',
    client_id: '',
    requested_by: '',
    search: '',
    start_date: '',
    end_date: ''
  });
  const [esignPagination, setEsignPagination] = useState({
    page: 1,
    page_size: 10,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false
  });
  const [esignCurrentPage, setEsignCurrentPage] = useState(1);

  // E-Signature Templates state
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState(null);
  const [templatesPagination, setTemplatesPagination] = useState({
    page: 1,
    page_size: 10,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false
  });
  const [templatesCurrentPage, setTemplatesCurrentPage] = useState(1);
  const [templatesFilters, setTemplatesFilters] = useState({
    is_active: '',
    search: ''
  });
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showDeleteTemplateModal, setShowDeleteTemplateModal] = useState(false);
  const [selectedTemplateForDelete, setSelectedTemplateForDelete] = useState(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    document: null,
    is_active: true
  });
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  // Memoize PDF options to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
  }), []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Close mobile navbar after selecting a tab (only on mobile screens ≤767px)
    if (window.innerWidth <= 767) {
      setShowMobileNav(false);
    }
  };

  // Handle PDF load success
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setTotalPages(numPages);
  };

  // Handle PDF load error
  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
  };

  // Handle text selection and show comment icon
  const handleTextSelection = (e) => {
    // Don't process selection if clicking on comment icon or comment input
    if (e.target.closest('.comment-icon') || e.target.closest('.comment-input-container')) {
      return;
    }

    const selection = window.getSelection();
    if (selection.toString().trim().length > 0 && !showCommentInput) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const container = documentContentRef.current;

      if (container) {
        const containerRect = container.getBoundingClientRect();
        const selectedText = selection.toString().trim();
        setSelectedText(selectedText);
        setCommentIconPosition({
          top: rect.top - containerRect.top + rect.height,
          left: rect.right - containerRect.left + 10,
          page: pageNumber || selectedPage
        });
      }
    } else if (!showCommentInput) {
      setSelectedText(null);
      setCommentIconPosition(null);
    }
  };

  // Handle comment icon click
  const handleCommentIconClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Comment icon clicked, selectedText:', selectedText);
    if (selectedText) {
      setShowCommentInput(true);
      console.log('Setting showCommentInput to true');
    }
  };

  // Save comment
  const handleSaveComment = () => {
    if (currentComment.trim() && selectedText) {
      const newComment = {
        id: Date.now(),
        text: selectedText,
        comment: currentComment,
        position: commentIconPosition,
        page: pageNumber || selectedPage
      };
      setComments([...comments, newComment]);
      setCurrentComment('');
      setShowCommentInput(false);
      setSelectedText(null);
      setCommentIconPosition(null);
      window.getSelection().removeAllRanges();
    }
  };

  // Close comment input
  const handleCloseCommentInput = () => {
    setShowCommentInput(false);
    setCurrentComment('');
    setSelectedText(null);
    setCommentIconPosition(null);
    window.getSelection().removeAllRanges();
  };

  // Reset all state and PDF when modal is cancelled
  const resetAllState = () => {
    // Reset file and PDF related state
    setUploadedFile(null);
    setUploadedFiles([]);
    setPdfFileData(null);
    if (pdfFileUrl) {
      URL.revokeObjectURL(pdfFileUrl);
    }
    setPdfFileUrl(null);
    setPdfLoading(false);

    // Reset comment related state
    setComments([]);
    setSelectedText(null);
    setCommentIconPosition(null);
    setShowCommentInput(false);
    setCurrentComment('');

    // Reset page related state
    setSelectedPage(0);
    setPageNumber(1);
    setNumPages(null);
    setTotalPages(5);

    // Reset signature request form state
    setTaskTitle('');
    setSelectedClientIds([]);
    setSpouseAlso(false);
    setDocumentCategory('');
    setFolderId('');
    setDueDate('');
    setPriority('');
    setDescription('');
    setSelectedFolderPath('');
    setShowClientDropdown(false);
    setShowFolderDropdown(false);
    setExpandedFolders(new Set());
    setSignatureType('signature_request');

    // Clear any text selection
    window.getSelection().removeAllRanges();
  };

  // Merge annotations back to PDF
  const mergeAnnotationsToPdf = async () => {
    if (!uploadedFile) return null;

    try {
      const pdfBytes = await uploadedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Add comments as text annotations
      for (const comment of comments) {
        try {
          const page = pdfDoc.getPage(comment.page - 1);
          const { width, height } = page.getSize();

          // Calculate annotation position (convert from screen coordinates to PDF coordinates)
          // Note: This is a simplified conversion - you may need to adjust based on actual PDF dimensions
          const x = comment.position.left;
          const y = height - comment.position.top; // PDF coordinates are bottom-up

          // Create a text annotation (popup annotation)
          // pdf-lib supports popup annotations for comments
          page.drawText(`Comment: ${comment.comment}\nSelected: "${comment.text}"`, {
            x: Math.max(0, Math.min(x, width - 200)),
            y: Math.max(0, Math.min(y, height - 50)),
            size: 10,
            color: { r: 0, g: 0, b: 0 },
          });
        } catch (error) {
          console.error(`Error adding comment to page ${comment.page}:`, error);
        }
      }

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      return blob;
    } catch (error) {
      console.error('Error merging annotations:', error);
      return null;
    }
  };

  const modalRef = useRef(null);

  // Close modal when clicking outside and prevent body scroll
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowCreateModal(false);
        resetAllState();
      }
    };

    if (showCreateModal || showPreviewModal || showFinalSignatureModal) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      if (showCreateModal) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      // Close on Escape key
      const handleEscape = (event) => {
        if (event.key === 'Escape') {
          if (showFinalSignatureModal) {
            setShowFinalSignatureModal(false);
            resetAllState();
          } else if (showPreviewModal) {
            setShowPreviewModal(false);
            resetAllState();
          } else if (showCreateModal) {
            setShowCreateModal(false);
            resetAllState();
          }
        }
      };
      document.addEventListener('keydown', handleEscape);

      return () => {
        if (showCreateModal) {
          document.removeEventListener('mousedown', handleClickOutside);
        }
        document.removeEventListener('keydown', handleEscape);
        if (!showCreateModal && !showPreviewModal && !showFinalSignatureModal) {
          document.body.style.overflow = 'unset';
        }
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showCreateModal, showPreviewModal, showFinalSignatureModal]);

  // Convert PDF file to ArrayBuffer when uploaded
  useEffect(() => {
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setPdfLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfFileData(e.target.result);
        setPdfLoading(false);
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        setPdfLoading(false);
      };
      reader.readAsArrayBuffer(uploadedFile);

      // Also create blob URL as fallback
      const url = URL.createObjectURL(uploadedFile);
      setPdfFileUrl(url);

      return () => {
        // Cleanup on unmount
        if (pdfFileUrl) {
          URL.revokeObjectURL(pdfFileUrl);
        }
      };
    } else {
      setPdfFileData(null);
      if (pdfFileUrl) {
        URL.revokeObjectURL(pdfFileUrl);
        setPdfFileUrl(null);
      }
    }
  }, [uploadedFile]);

  // Reset page number when selected page changes
  useEffect(() => {
    setPageNumber(selectedPage + 1);
  }, [selectedPage]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showClientDropdown && clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setShowClientDropdown(false);
      }
      if (showFolderDropdown && folderDropdownRef.current && !folderDropdownRef.current.contains(event.target)) {
        setShowFolderDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClientDropdown, showFolderDropdown]);

  // Fetch clients from API
  const fetchClients = useCallback(async () => {
    try {
      setLoadingClients(true);
      const response = await firmAdminClientsAPI.listClients({ page: 1, page_size: 100 });
      if (response.success && response.data) {
        setClients(response.data.clients || []);
      } else if (Array.isArray(response)) {
        setClients(response);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error(handleAPIError(error));
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  // Fetch clients when modal opens
  useEffect(() => {
    if (showCreateModal && clients.length === 0 && !loadingClients) {
      fetchClients();
    }
  }, [showCreateModal, clients.length, loadingClients, fetchClients]);

  // Fetch root folders from API
  useEffect(() => {
    const fetchRootFolders = async () => {
      if (!showCreateModal) return;

      try {
        setLoadingFolders(true);
        const response = await firmAdminDocumentsAPI.listFolders();
        if (response.success && response.data) {
          const folders = response.data.folders || response.data || [];
          setFolderTree(folders);
        } else if (Array.isArray(response)) {
          setFolderTree(response);
        } else {
          setFolderTree([]);
        }
      } catch (error) {
        console.error('Error fetching folders:', error);
        setFolderTree([]);
      } finally {
        setLoadingFolders(false);
      }
    };

    if (showCreateModal) {
      fetchRootFolders();
    }
  }, [showCreateModal]);

  // Handle spouse signature toggle with validation
  const handleSpouseSignatureToggle = async (checked) => {
    if (!checked) {
      setSpouseAlso(false);
      return;
    }

    if (!selectedClientIds || selectedClientIds.length === 0) {
      toast.error('Please select at least one client first.');
      return;
    }

    try {
      // Check spouse for all selected clients
      const spouseChecks = await Promise.all(
        selectedClientIds.map(async (clientId) => {
          try {
            const response = await firmAdminClientsAPI.getClientDetails(clientId);
            if (response.success && response.data) {
              const hasSpouse = response.data.personal_information?.spouse_information || 
                               response.data.spouse_information ||
                               response.data.has_spouse;
              return {
                clientId,
                hasSpouse: !!hasSpouse,
                clientName: response.data.profile?.name || 
                           `${response.data.profile?.first_name || ''} ${response.data.profile?.last_name || ''}`.trim() ||
                           `Client ${clientId}`
              };
            }
            return { clientId, hasSpouse: false, clientName: `Client ${clientId}` };
          } catch (error) {
            console.error(`Error checking spouse for client ${clientId}:`, error);
            return { clientId, hasSpouse: false, clientName: `Client ${clientId}` };
          }
        })
      );

      const clientsWithoutSpouse = spouseChecks.filter(check => !check.hasSpouse);
      if (clientsWithoutSpouse.length > 0) {
        const clientNames = clientsWithoutSpouse.map(c => c.clientName).join(', ');
        toast.error(`The following client(s) do not have a partner/spouse: ${clientNames}. Spouse signature cannot be required.`);
        return;
      }

      setSpouseAlso(true);
    } catch (error) {
      console.error('Error checking spouse:', error);
      toast.error(handleAPIError(error) || 'Failed to check spouse information. Please try again.');
    }
  };

  // Handle folder selection
  const handleFolderSelect = (folder) => {
    setFolderId(folder.id);
    setSelectedFolderPath(folder.title || folder.name);
    setShowFolderDropdown(false);
  };

  // Toggle folder expansion
  const toggleFolderExpansion = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Handle file upload (multiple files)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files]);
      if (files.length === 1) {
        setUploadedFile(files[0]);
        if (files[0].type === 'application/pdf') {
          const url = URL.createObjectURL(files[0]);
          setPdfFileUrl(url);
        }
      }
    }
    // Reset input
    e.target.value = '';
  };

  // Remove file from list
  const removeFile = (index) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (index === 0 && newFiles.length > 0) {
        setUploadedFile(newFiles[0]);
      } else if (newFiles.length === 0) {
        setUploadedFile(null);
      }
      return newFiles;
    });
  };

  // Fetch e-signature requests
  const fetchEsignRequests = useCallback(async () => {
    try {
      setEsignLoading(true);
      setEsignError(null);

      const token = getAccessToken();
      const queryParams = new URLSearchParams();
      
      queryParams.append('page', esignCurrentPage.toString());
      queryParams.append('page_size', '10');

      if (esignFilters.status) {
        queryParams.append('status', esignFilters.status);
      }
      if (esignFilters.client_id) {
        queryParams.append('client_id', esignFilters.client_id);
      }
      if (esignFilters.requested_by) {
        queryParams.append('requested_by', esignFilters.requested_by);
      }
      if (esignFilters.search) {
        queryParams.append('search', esignFilters.search);
      }
      if (esignFilters.start_date) {
        queryParams.append('start_date', esignFilters.start_date);
      }
      if (esignFilters.end_date) {
        queryParams.append('end_date', esignFilters.end_date);
      }

      const response = await fetchWithCors(`${getApiBaseUrl()}/firm/esign-requests/?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setEsignRequests(result.data.requests || []);
        if (result.data.statistics) {
          setEsignStatistics(result.data.statistics);
        }
        if (result.data.pagination) {
          setEsignPagination(result.data.pagination);
        }
      } else {
        throw new Error(result.message || 'Failed to fetch e-signature requests');
      }
    } catch (err) {
      console.error('Error fetching e-signature requests:', err);
      setEsignError(handleAPIError(err));
      toast.error(handleAPIError(err) || 'Failed to fetch e-signature requests', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setEsignLoading(false);
    }
  }, [esignCurrentPage, esignFilters]);

  // Fetch e-signature requests when tab is active or filters/page change
  useEffect(() => {
    if (activeTab === 'Signature Request') {
      fetchEsignRequests();
    }
  }, [activeTab, esignCurrentPage, esignFilters, fetchEsignRequests]);

  // Create signature request
  const createSignatureRequest = async () => {
    if (!taskTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    if (!selectedClientIds || selectedClientIds.length === 0) {
      toast.error('Please select at least one client');
      return;
    }

    if (!uploadedFiles || uploadedFiles.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    try {
      setLoading(true);

      // Create documents_metadata array - one object per file
      // This is REQUIRED by the API and must match the number of files exactly
      // Each metadata object should have category_id and folder_id
      const documentsMetadata = uploadedFiles.map((file) => {
        const metadata = {};
        
        // Add category_id if document category is selected
        // Note: If documentCategory is a string, we need to fetch the actual category ID
        // For now, if it's a number, use it; otherwise, we'll need to fetch categories
        if (documentCategory) {
          const categoryId = parseInt(documentCategory);
          if (!isNaN(categoryId)) {
            metadata.category_id = categoryId;
          }
          // If documentCategory is a string, we might need to fetch categories first
          // For now, we'll skip category_id if it's not a valid number
        }
        
        // Add folder_id if folder is selected (must be an integer)
        if (folderId) {
          const folderIdInt = parseInt(folderId);
          if (!isNaN(folderIdInt)) {
            metadata.folder_id = folderIdInt;
          }
        }
        
        // Ensure at least an empty object is returned (API requires metadata for each file)
        return metadata;
      });

      console.log('Creating signature request with:', {
        filesCount: uploadedFiles.length,
        metadataCount: documentsMetadata.length,
        documentsMetadata: documentsMetadata
      });

      // Create signature requests for all selected clients
      // Note: The API accepts one client_id per request, so we create one request per client
      const requests = selectedClientIds.map(async (clientId) => {
        const requestData = {
          type: signatureType || 'signature_request',
          task_title: taskTitle,
          client_id: clientId,
          spouse_sign: spouseAlso || false,
          files: uploadedFiles,
          documents_metadata: documentsMetadata // Required: must match number of files exactly
        };

        // Add optional fields if provided
        if (dueDate) {
          requestData.due_date = dueDate;
        }
        if (description) {
          requestData.description = description;
        }
        if (priority) {
          requestData.priority = priority;
        }

        console.log('Request data for client', clientId, ':', {
          ...requestData,
          files: `${requestData.files.length} file(s)`,
          documents_metadata: requestData.documents_metadata
        });

        // Create signature/document request directly
        const token = getAccessToken();
        if (!token) {
          throw new Error('No authentication token found. Please login again.');
        }

        const formData = new FormData();

        // Required fields
        formData.append('type', requestData.type); // "signature_request" or "document_request"
        formData.append('task_title', requestData.task_title);
        formData.append('client_id', requestData.client_id.toString());
        
        // spouse_sign field - always send, default to false if not provided
        formData.append('spouse_sign', requestData.spouse_sign === true ? 'true' : 'false');

        // Add files (multiple files)
        if (requestData.files && Array.isArray(requestData.files)) {
          requestData.files.forEach((file) => {
            formData.append('files', file);
          });
        }

        // Add documents_metadata or documents (JSON string array)
        if (requestData.documents_metadata && Array.isArray(requestData.documents_metadata)) {
          formData.append('documents_metadata', JSON.stringify(requestData.documents_metadata));
        } else if (requestData.documents && Array.isArray(requestData.documents)) {
          formData.append('documents_metadata', JSON.stringify(requestData.documents));
        } else if (requestData.files && Array.isArray(requestData.files) && requestData.files.length > 0) {
          // If documents_metadata is not provided, create an array of empty objects matching the number of files
          const defaultMetadata = requestData.files.map(() => ({}));
          formData.append('documents_metadata', JSON.stringify(defaultMetadata));
        }

        const config = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type for FormData - let browser set it with boundary
          },
          body: formData
        };

        let response = await fetchWithCors(`${getApiBaseUrl()}/firm/signature-document-requests/create/`, config);

        // Handle 401 Unauthorized - try to refresh token
        if (response.status === 401) {
          try {
            await refreshAccessToken();

            // Retry the original request with new token
            config.headers = {
              'Authorization': `Bearer ${getAccessToken()}`,
            };
            response = await fetchWithCors(`${getApiBaseUrl()}/firm/signature-document-requests/create/`, config);

            if (response.status === 401) {
              // Refresh failed, redirect to login
              clearUserData();
              window.location.href = getLoginUrl();
              throw new Error('Session expired. Please login again.');
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            clearUserData();
            window.location.href = getLoginUrl();
            throw new Error('Session expired. Please login again.');
          }
        }

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData.errors) {
              const fieldErrors = Object.entries(errorData.errors)
                .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                .join('; ');
              errorMessage = `${errorData.message || 'Validation failed'}. ${fieldErrors}`;
            } else {
              errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
            }
          } catch (parseError) {
            console.error('Error parsing signature/document request response:', parseError);
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        return result;
      });

      // Wait for all requests to complete
      await Promise.all(requests);

      toast.success(`Signature request${selectedClientIds.length > 1 ? 's' : ''} created successfully!`);
      setShowCreateModal(false);
      resetAllState();
      
      // Optionally refresh signature requests list here
      // fetchSignatureRequests();
    } catch (error) {
      console.error('Error creating signature request:', error);
      toast.error(handleAPIError(error) || 'Failed to create signature request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate PDF page width based on container size
  useEffect(() => {
    const calculatePdfWidth = () => {
      if (documentContentRef.current && (showPreviewModal || showFinalSignatureModal)) {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
          if (documentContentRef.current) {
            const containerWidth = documentContentRef.current.offsetWidth;
            // Account for padding (p-6 = 24px on each side = 48px total)
            // Account for inner padding (p-8 = 32px on each side = 64px total)
            // Leave some margin for better fit
            const availableWidth = containerWidth - 48 - 64 - 20; // 20px for extra margin
            // Set max width to available width, but not less than 400px and not more than 700px
            const calculatedWidth = Math.max(400, Math.min(availableWidth, 700));
            setPdfPageWidth(calculatedWidth);
          }
        }, 100);
      }
    };

    if (showPreviewModal || showFinalSignatureModal) {
      calculatePdfWidth();
      window.addEventListener('resize', calculatePdfWidth);
      return () => {
        window.removeEventListener('resize', calculatePdfWidth);
      };
    }
  }, [showPreviewModal, showFinalSignatureModal]);

  // Fetch e-signature templates
  const fetchTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      setTemplatesError(null);

      const token = getAccessToken();
      const queryParams = new URLSearchParams();
      
      queryParams.append('page', templatesCurrentPage.toString());
      queryParams.append('page_size', '10');

      if (templatesFilters.is_active !== '') {
        queryParams.append('is_active', templatesFilters.is_active);
      }
      if (templatesFilters.search) {
        queryParams.append('search', templatesFilters.search);
      }

      const response = await fetchWithCors(`${getApiBaseUrl()}/firm/esign-templates/?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setTemplates(result.data.templates || []);
        if (result.data.pagination) {
          setTemplatesPagination(result.data.pagination);
        }
      } else {
        throw new Error(result.message || 'Failed to fetch templates');
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setTemplatesError(handleAPIError(err));
      toast.error(handleAPIError(err) || 'Failed to fetch templates', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setTemplatesLoading(false);
    }
  }, [templatesCurrentPage, templatesFilters]);

  // Fetch templates when tab is active or filters/page change
  useEffect(() => {
    if (activeTab === 'Templates') {
      fetchTemplates();
    }
  }, [activeTab, templatesCurrentPage, templatesFilters, fetchTemplates]);

  // Create template
  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.document) {
      toast.error('Please provide template name and document', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setCreatingTemplate(true);
      const token = getAccessToken();
      const formData = new FormData();
      
      formData.append('name', newTemplate.name);
      if (newTemplate.description) {
        formData.append('description', newTemplate.description);
      }
      formData.append('document', newTemplate.document);
      formData.append('is_active', newTemplate.is_active.toString());

      const response = await fetchWithCors(`${getApiBaseUrl()}/firm/esign-templates/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Template created successfully', {
          position: "top-right",
          autoClose: 3000,
        });
        setShowCreateTemplateModal(false);
        setNewTemplate({
          name: '',
          description: '',
          document: null,
          is_active: true
        });
        fetchTemplates();
      } else {
        throw new Error(result.message || 'Failed to create template');
      }
    } catch (err) {
      console.error('Error creating template:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to create template', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setCreatingTemplate(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId) => {
    try {
      setDeletingTemplate(true);
      const token = getAccessToken();

      const response = await fetchWithCors(`${getApiBaseUrl()}/firm/esign-templates/${templateId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      toast.success('Template deleted successfully', {
        position: "top-right",
        autoClose: 3000,
      });
      setShowDeleteTemplateModal(false);
      setSelectedTemplateForDelete(null);
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to delete template', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setDeletingTemplate(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-[rgb(243,247,255)] min-h-screen">
      {/* Header Section */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
              E-Signature Management
            </h3>
            <p className="text-sm sm:text-base text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Manage document signatures and templates
            </p>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'Templates') {
                setShowCreateTemplateModal(true);
              } else {
                setShowCreateModal(true);
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium w-full sm:w-auto"
            style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">New Signature Request</span>
            <span className="sm:hidden">New Request</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-4 md:mb-6">
        {/* Desktop Navigation - Always visible on screens ≥ 768px */}
        <div className="hidden md:block mb-6 w-fit">
          <div className="flex flex-wrap gap-2 sm:gap-3 bg-white rounded-lg p-1 border border-blue-50 w-full">
            {['Signature Request', 'Templates'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors relative whitespace-nowrap ${activeTab === tab
                  ? 'text-white bg-[#3AD6F2]'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>


        {/* Mobile Navigation - Only visible on screens < 768px */}
        <div className="block md:hidden">
          {/* Logo Icon Toggle Button */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-blue-50 text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label="Toggle Navigation"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform duration-300 ${showMobileNav ? 'rotate-180' : ''}`}
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  fill="#3AD6F2"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="#3AD6F2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="#3AD6F2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {/* Current Active Tab Display */}
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                {activeTab === 'Signature Request' ? 'Signature Request' :
                  activeTab === 'Templates' ? 'Templates' : 'Signature Request'}
              </span>
            </div>
          </div>

          {/* Collapsible Menu - Only visible when showMobileNav is true */}
          {showMobileNav && (
            <div className="bg-white rounded-lg border border-blue-50 shadow-lg overflow-hidden">
              <button
                onClick={() => handleTabChange('Signature Request')}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'Signature Request'
                  ? 'text-white bg-[#3AD6F2]'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
                style={{ fontFamily: 'BasisGrotesquePro' }}
              >
                <div className="flex items-center justify-between">
                  <span>Signature Request</span>
                  {activeTab === 'Signature Request' && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.3333 4L6 11.3333L2.66667 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange('Templates')}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-t border-gray-100 ${activeTab === 'Templates'
                  ? 'text-white bg-[#3AD6F2]'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
                style={{ fontFamily: 'BasisGrotesquePro' }}
              >
                <div className="flex items-center justify-between">
                  <span>Templates</span>
                  {activeTab === 'Templates' && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.3333 4L6 11.3333L2.66667 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Templates Tab Content */}
      {activeTab === 'Templates' && (
        <div className="bg-white rounded-lg p-4 sm:p-6">
          <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h5 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                Signature Templates
              </h5>
              <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                Manage reusable signature templates
              </p>
            </div>
            <button
              onClick={() => setShowCreateTemplateModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium w-full sm:w-auto"
              style={{ fontFamily: 'BasisGrotesquePro' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Add Template
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>Status</label>
              <select
                value={templatesFilters.is_active}
                onChange={(e) => {
                  setTemplatesFilters(prev => ({ ...prev, is_active: e.target.value }));
                  setTemplatesCurrentPage(1);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                style={{ fontFamily: 'BasisGrotesquePro' }}
              >
                <option value="">All Templates</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>Search</label>
              <input
                type="text"
                value={templatesFilters.search}
                onChange={(e) => {
                  setTemplatesFilters(prev => ({ ...prev, search: e.target.value }));
                  setTemplatesCurrentPage(1);
                }}
                placeholder="Search templates..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                style={{ fontFamily: 'BasisGrotesquePro' }}
              />
            </div>
          </div>

          {/* Template Cards Grid */}
          {templatesLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Loading templates...</p>
            </div>
          ) : templatesError ? (
            <div className="text-center py-8">
              <p className="text-red-500" style={{ fontFamily: 'BasisGrotesquePro' }}>{templatesError}</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>No templates found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white rounded-lg p-4 sm:p-5"
                    style={{
                      border: '1px solid #E8F0FF',
                      borderRadius: '10px',
                      padding: '10px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Template Title */}
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="text-base sm:text-lg font-semibold text-gray-800 flex-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        {template.name}
                      </h5>
                      {template.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Inactive
                        </span>
                      )}
                    </div>

                    {/* Template Description */}
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      {template.description || 'No description'}
                    </p>

                    {/* Template Details */}
                    <div className="space-y-2 mb-3 sm:mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Signature Fields:
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          {template.signature_fields_count || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Created by:
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          {template.created_by_name || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Created:
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
                      {template.document_url && (
                        <button
                          onClick={() => window.open(template.document_url, '_blank')}
                          className="w-full sm:flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
                        >
                          View Document
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTemplateForDelete(template.id);
                          setShowDeleteTemplateModal(true);
                        }}
                        className="w-full sm:flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                        style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {templatesPagination.total_count > 0 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                    Showing {((templatesPagination.page - 1) * templatesPagination.page_size) + 1} to {Math.min(templatesPagination.page * templatesPagination.page_size, templatesPagination.total_count)} of {templatesPagination.total_count} templates
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTemplatesCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!templatesPagination.has_previous || templatesCurrentPage === 1}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${!templatesPagination.has_previous || templatesCurrentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, templatesPagination.total_pages) }, (_, i) => {
                        let pageNum;
                        if (templatesPagination.total_pages <= 5) {
                          pageNum = i + 1;
                        } else if (templatesCurrentPage <= 3) {
                          pageNum = i + 1;
                        } else if (templatesCurrentPage >= templatesPagination.total_pages - 2) {
                          pageNum = templatesPagination.total_pages - 4 + i;
                        } else {
                          pageNum = templatesCurrentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setTemplatesCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${
                              templatesCurrentPage === pageNum
                                ? 'bg-[#F56D2D] text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setTemplatesCurrentPage(prev => Math.min(templatesPagination.total_pages, prev + 1))}
                      disabled={!templatesPagination.has_next || templatesCurrentPage === templatesPagination.total_pages}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${!templatesPagination.has_next || templatesCurrentPage === templatesPagination.total_pages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Signature Request Tab Content */}
      {activeTab === 'Signature Request' && (
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
          {/* Header Section */}
          <div className="mb-6">
            <h5 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Active Signature Requests
            </h5>
            <p className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Track and manage document signature requests
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600" style={{ fontFamily: 'BasisGrotesquePro' }}>{esignStatistics.pending}</div>
              <div className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Pending</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600" style={{ fontFamily: 'BasisGrotesquePro' }}>{esignStatistics.signed}</div>
              <div className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Signed</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600" style={{ fontFamily: 'BasisGrotesquePro' }}>{esignStatistics.expired}</div>
              <div className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Expired</div>
            </div>
          </div>

          {/* Signature Requests Table */}
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm  text-gray-400" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Request ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm  text-gray-400" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Document
                    </th>
                    <th className="text-left py-3 px-4 text-sm  text-gray-400" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Client
                    </th>
                    <th className="text-left py-3 px-4 text-sm  text-gray-400" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm  text-gray-400" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Progress
                    </th>
                    <th className="text-left py-3 px-4 text-sm  text-gray-400" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Expires At
                    </th>
                    <th className="text-left py-3 px-4 text-sm  text-gray-400" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {esignLoading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Loading...
                      </td>
                    </tr>
                  ) : esignError ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-red-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        {esignError}
                      </td>
                    </tr>
                  ) : esignRequests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        No signature requests found
                      </td>
                    </tr>
                  ) : (
                    esignRequests.map((request) => {
                      const getStatusColor = (status) => {
                        switch (status) {
                          case 'pending': return { bg: '#FBBF24', text: 'white', icon: 'pending' };
                          case 'sent': return { bg: '#3B82F6', text: 'white', icon: 'sent' };
                          case 'viewed': return { bg: '#6366F1', text: 'white', icon: 'viewed' };
                          case 'signed': return { bg: '#8B5CF6', text: 'white', icon: 'signed' };
                          case 'completed': return { bg: '#22C55E', text: 'white', icon: 'completed' };
                          case 'cancelled': return { bg: '#6B7280', text: 'white', icon: 'cancelled' };
                          case 'expired': return { bg: '#EF4444', text: 'white', icon: 'expired' };
                          default: return { bg: '#6B7280', text: 'white', icon: 'default' };
                        }
                      };
                      const statusStyle = getStatusColor(request.status);
                      const expiresDate = request.expires_at ? new Date(request.expires_at).toLocaleDateString() : 'N/A';
                      const progress = `${request.completed_fields || 0}/${request.total_fields || 0}`;

                      return (
                        <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium text-gray-400" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              #{request.id}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '500' }}>
                              {request.title || request.document_name || 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '500' }}>
                              {request.client_name || 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-4 flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '500', backgroundColor: statusStyle.bg }}>
                              {request.status_display || request.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '500' }}>{progress}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '500' }}>
                              {expiresDate}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {request.document_url && (
                                <button
                                  onClick={() => window.open(request.document_url, '_blank')}
                                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                  aria-label="View"
                                >
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 8C1 8 3.66667 3 8 3C12.3333 3 15 8 15 8C15 8 12.3333 13 8 13C3.66667 13 1 8 1 8Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                              )}
                              {request.document_url && (
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = request.document_url;
                                    link.download = request.document_name || 'document.pdf';
                                    link.click();
                                  }}
                                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                  aria-label="Download"
                                >
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10M5.33333 6.66667L8 10M8 10L10.6667 6.66667M8 10V2" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {esignPagination.total_count > 0 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                Showing {((esignPagination.page - 1) * esignPagination.page_size) + 1} to {Math.min(esignPagination.page * esignPagination.page_size, esignPagination.total_count)} of {esignPagination.total_count} requests
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEsignCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!esignPagination.has_previous || esignCurrentPage === 1}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${!esignPagination.has_previous || esignCurrentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, esignPagination.total_pages) }, (_, i) => {
                    let pageNum;
                    if (esignPagination.total_pages <= 5) {
                      pageNum = i + 1;
                    } else if (esignCurrentPage <= 3) {
                      pageNum = i + 1;
                    } else if (esignCurrentPage >= esignPagination.total_pages - 2) {
                      pageNum = esignPagination.total_pages - 4 + i;
                    } else {
                      pageNum = esignCurrentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setEsignCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${
                          esignCurrentPage === pageNum
                            ? 'bg-[#F56D2D] text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setEsignCurrentPage(prev => Math.min(esignPagination.total_pages, prev + 1))}
                  disabled={!esignPagination.has_next || esignCurrentPage === esignPagination.total_pages}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${!esignPagination.has_next || esignCurrentPage === esignPagination.total_pages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Signature Request Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-[9999] p-3 sm:p-4 md:p-6"
          style={{
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            paddingTop: '80px',
            paddingBottom: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              resetAllState();
            }
          }}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[calc(100vh-100px)] sm:max-h-[90vh] overflow-y-auto relative my-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start p-4 sm:p-6  sticky top-0 bg-white z-10 rounded-t-lg">
              <div className="flex-1 pr-4">
                <h4 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Create Signature Request
                </h4>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Send a document for electronic signature
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetAllState();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1 -mt-1 -mr-1"
                aria-label="Close modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                  <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                </svg>


              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-6 flex-1">
              {/* Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value="signature_request"
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm appearance-none bg-gray-100 cursor-not-allowed opacity-75"
                    style={{ fontFamily: 'BasisGrotesquePro' }}
                  >
                    <option value="signature_request">Signature Request</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 6L8 10L12 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Task Title */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                  style={{ fontFamily: 'BasisGrotesquePro' }}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm resize-none"
                  style={{ fontFamily: 'BasisGrotesquePro' }}
                />
              </div>

              {/* Client Multi-Select */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Clients <span className="text-red-500">*</span>
                </label>
                <div ref={clientDropdownRef} className="relative">
                  <div
                    onClick={() => setShowClientDropdown(!showClientDropdown)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white min-h-[42px] cursor-pointer"
                  >
                    {selectedClientIds.length > 0 ? (
                      <div className="flex flex-wrap gap-2 flex-1">
                        {selectedClientIds.map((clientId) => {
                          const client = clients.find(c => c.id?.toString() === clientId.toString() || c.profile?.id?.toString() === clientId.toString());
                          if (!client) return null;
                          const clientName = client.profile?.name || 
                                           client.name ||
                                           `${client.profile?.first_name || client.first_name || ''} ${client.profile?.last_name || client.last_name || ''}`.trim() ||
                                           `Client ${clientId}`;
                          return (
                            <div key={clientId} className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                              <span style={{ fontFamily: 'BasisGrotesquePro' }}>{clientName}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedClientIds(prev => prev.filter(id => id !== clientId));
                                }}
                                className="text-blue-700 hover:text-blue-900 ml-1"
                              >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        {loadingClients ? 'Loading clients...' : 'Select one or more clients'}
                      </span>
                    )}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 10L12 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Client Dropdown Menu */}
                  {showClientDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {loadingClients ? (
                        <div className="p-4 text-center text-sm text-gray-500">Loading clients...</div>
                      ) : clients.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">No clients available</div>
                      ) : (
                        clients.map((client) => {
                          const clientId = client.id || client.profile?.id;
                          const clientName = client.profile?.name || 
                                           client.name ||
                                           `${client.profile?.first_name || client.first_name || ''} ${client.profile?.last_name || client.last_name || ''}`.trim() ||
                                           `Client ${clientId}`;
                          const isSelected = selectedClientIds.includes(clientId?.toString());
                          return (
                            <div
                              key={clientId}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedClientIds(prev => prev.filter(id => id !== clientId.toString()));
                                } else {
                                  setSelectedClientIds(prev => [...prev, clientId.toString()]);
                                }
                              }}
                              className={`p-3 cursor-pointer hover:bg-gray-50 flex items-center gap-2 ${
                                isSelected ? 'bg-blue-50' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                {clientName}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Spouse Signature Toggle - Only for signature requests */}
              {signatureType === 'signature_request' && (
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Spouse's signature required
                  </label>
                  <button
                    onClick={() => handleSpouseSignatureToggle(!spouseAlso)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${spouseAlso ? 'bg-orange-500' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${spouseAlso ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              )}

              {/* Add Files */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Add Files <span className="text-red-500">*</span>
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer relative"
                  onClick={() => document.getElementById('file-upload').click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#3AD6F2';
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#D1D5DB';
                    const files = Array.from(e.dataTransfer.files);
                    if (files.length > 0) {
                      setUploadedFiles(prev => [...prev, ...files]);
                      if (files.length === 1) {
                        setUploadedFile(files[0]);
                        if (files[0].type === 'application/pdf') {
                          const url = URL.createObjectURL(files[0]);
                          setPdfFileUrl(url);
                        }
                      }
                    }
                  }}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="flex flex-col items-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="#00C0C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700 mb-1 mt-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Drop files here or click to browse
                    </p>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (Max 10MB per file)
                    </p>
                  </div>
                </div>
                
                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 11V13.3333C14 13.687 13.8595 14.0261 13.6095 14.2761C13.3594 14.5262 13.0203 14.6667 12.6667 14.6667H3.33333C2.97971 14.6667 2.64057 14.5262 2.39052 14.2761C2.14048 14.0261 2 13.687 2 13.3333V11M5.33333 8L8 10.6667M8 10.6667L10.6667 8M8 10.6667V2" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-sm text-gray-700 truncate" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Document category */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Document category
                </label>
                <div className="relative">
                  <select
                    value={documentCategory}
                    onChange={(e) => setDocumentCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm appearance-none bg-white"
                    style={{ fontFamily: 'BasisGrotesquePro' }}
                  >
                    <option value="">Select a Category (Optional)</option>
                    <option value="tax_documents">Tax Documents</option>
                    <option value="legal_documents">Legal Documents</option>
                    <option value="financial_documents">Financial Documents</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 6L8 10L12 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Folder Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Folder (Optional)
                </label>
                <div ref={folderDropdownRef} className="relative">
                  <div
                    onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                    className="flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-lg bg-white min-h-[42px] cursor-pointer"
                  >
                    <span className={`text-sm ${selectedFolderPath ? 'text-gray-700' : 'text-gray-400'}`} style={{ fontFamily: 'BasisGrotesquePro' }}>
                      {selectedFolderPath || (loadingFolders ? 'Loading folders...' : 'Select a folder (optional)')}
                    </span>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 10L12 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Folder Dropdown Menu */}
                  {showFolderDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {loadingFolders ? (
                        <div className="p-4 text-center text-sm text-gray-500">Loading folders...</div>
                      ) : folderTree.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">No folders available</div>
                      ) : (
                        <div className="p-2">
                          <div
                            onClick={() => {
                              setFolderId('');
                              setSelectedFolderPath('Root');
                              setShowFolderDropdown(false);
                            }}
                            className={`p-2 cursor-pointer hover:bg-gray-50 rounded ${!folderId ? 'bg-blue-50' : ''}`}
                          >
                            <span className="text-sm text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Root</span>
                          </div>
                          {folderTree.map((folder) => {
                            const folderTitle = folder.title || folder.name;
                            return (
                              <div key={folder.id} className="mt-1">
                                <div
                                  onClick={() => handleFolderSelect(folder)}
                                  className={`p-2 cursor-pointer hover:bg-gray-50 rounded flex items-center gap-2 ${folderId === folder.id ? 'bg-blue-50' : ''}`}
                                >
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6.66667C7.02029 2 7.35943 2.14048 7.60948 2.39052C7.85952 2.64057 8 2.97971 8 3.33333V6.66667C8 7.02029 7.85952 7.35943 7.60948 7.60948C7.35943 7.85952 7.02029 8 6.66667 8H3.33333C2.97971 8 2.64057 7.85952 2.39052 7.60948C2.14048 7.35943 2 7.02029 2 6.66667V3.33333Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                    <path d="M2 9.33333C2 8.97971 2.14048 8.64057 2.39052 8.39052C2.64057 8.14048 2.97971 8 3.33333 8H6.66667C7.02029 8 7.35943 8.14048 7.60948 8.39052C7.85952 8.64057 8 8.97971 8 9.33333V12.6667C8 13.0203 7.85952 13.3594 7.60948 13.6095C7.35943 13.8595 7.02029 14 6.66667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V9.33333Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                  </svg>
                                  <span className="text-sm text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>{folderTitle}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Due Date and Priority - Side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Due Date */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                    style={{ fontFamily: 'BasisGrotesquePro' }}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm appearance-none bg-white"
                      style={{ fontFamily: 'BasisGrotesquePro' }}
                    >
                      <option value="">Select Priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 10L12 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 sticky bottom-0 bg-white z-10 rounded-b-lg">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetAllState();
                }}
                disabled={loading}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
              >
                Cancel
              </button>
              <button
                onClick={createSignatureRequest}
                disabled={loading || !taskTitle.trim() || selectedClientIds.length === 0 || uploadedFiles.length === 0}
                className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  loading || !taskTitle.trim() || selectedClientIds.length === 0 || uploadedFiles.length === 0
                    ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    : 'text-white bg-orange-500 hover:bg-orange-600'
                }`}
                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <ESignatureUpload />
                    <span>Create Signature Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-[9999] p-3 sm:p-4"
          style={{
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            paddingTop: '80px',
            paddingBottom: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPreviewModal(false);
              resetAllState();
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[calc(100vh-100px)] sm:max-h-[90vh] overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start p-4 sm:p-6 sticky top-0 bg-white z-10 rounded-t-lg">
              <div className="flex-1 pr-4">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Create Signature Request
                </h3>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Send a document for electronic signature
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  resetAllState();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1 -mt-1 -mr-1"
                aria-label="Close modal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-6 sm:h-6">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Two Column Layout */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              {/* Left Side - Document Preview */}
              <div className="flex-1 flex flex-col bg-gray-50 min-w-0 overflow-hidden">
                <div className="p-4 bg-white border-b border-gray-200">
                  <h5 className="text-base font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Document Preview
                  </h5>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  {/* Page Thumbnails Sidebar */}
                  {uploadedFile && uploadedFile.type === 'application/pdf' && (
                    <div
                      id="thumbnails"
                      className="w-20 bg-[#EEEEEE] border-r border-gray-200 overflow-y-auto p-2 flex-shrink-0"
                    >
                      {Array.from({ length: numPages || totalPages }, (_, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSelectedPage(index);
                            setPageNumber(index + 1);
                          }}
                          className="mb-2 cursor-pointer"
                        >
                          <div
                            className={`aspect-[3/4] bg-white rounded flex items-center justify-center ${selectedPage === index
                              ? 'border-2 border-[#3AD6F2]'
                              : 'border border-gray-200'
                              }`}
                            style={{
                              boxShadow: selectedPage === index ? '0 1px 3px rgba(58, 214, 242, 0.2)' : 'none'
                            }}
                          >
                            <span className="text-[10px] text-gray-400">{index + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Main Document View */}
                  <div className="flex-1 bg-white overflow-y-auto min-w-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 #F3F4F6' }}>
                    <div ref={pdfContainerRef} className="p-6 w-full">
                      <div className="bg-[#EEEEEE] shadow-sm rounded border border-gray-200 p-8 w-full pb-12">
                        {uploadedFile && uploadedFile.type === 'application/pdf' ? (
                          pdfFileData ? (
                            <Document
                              file={pdfFileData}
                              onLoadSuccess={onDocumentLoadSuccess}
                              onLoadError={(error) => {
                                console.error('Error loading PDF in preview:', error);
                                console.error('Error details:', {
                                  message: error.message,
                                  name: error.name,
                                  file: uploadedFile?.name,
                                  fileType: uploadedFile?.type,
                                  fileSize: uploadedFile?.size,
                                  workerSrc: pdfjs.GlobalWorkerOptions.workerSrc,
                                  hasPdfFileData: !!pdfFileData
                                });
                                onDocumentLoadError(error);
                              }}
                              loading={
                                <div className="flex items-center justify-center p-8">
                                  <p className="text-sm text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                    Loading PDF...
                                  </p>
                                </div>
                              }
                              options={pdfOptions}
                              className="w-full"
                            >
                              {numPages ? (
                                Array.from(new Array(numPages), (el, index) => (
                                  <div key={`page_${index + 1}`} className={`w-full flex justify-center ${index === numPages - 1 ? 'mb-0' : 'mb-4'}`}>
                                    <div className="bg-white shadow-lg" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                                      <Page
                                        pageNumber={index + 1}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={true}
                                        width={pdfPageWidth}
                                        className="max-w-full"
                                      />
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center justify-center p-8">
                                  <p className="text-sm text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                    Loading pages...
                                  </p>
                                </div>
                              )}
                            </Document>
                          ) : pdfLoading ? (
                            <div className="flex items-center justify-center p-8">
                              <p className="text-sm text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                Preparing PDF file...
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center p-8">
                              <p className="text-sm text-red-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                Error: Could not load PDF file
                              </p>
                            </div>
                          )
                        ) : uploadedFile && uploadedFile.type !== 'application/pdf' ? (
                          /* Simulated Document Content */
                          <div className="space-y-4 text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            <h2 className="text-2xl font-bold mb-4">Project Overview: MVP Beta - Movement Feedback Module</h2>

                            <div>
                              <h3 className="text-lg font-semibold mb-2">Objective</h3>
                              <p className="text-sm leading-relaxed">
                                The MVP Beta focuses on creating a streamlined feedback module that allows users to provide movement-related feedback efficiently.
                              </p>
                            </div>

                            <div>
                              <h3 className="text-lg font-semibold mb-2">Target User Experience (Beta)</h3>
                              <p className="text-sm leading-relaxed">
                                Users should be able to quickly submit feedback about movements with minimal friction.
                              </p>
                            </div>

                            <div>
                              <h3 className="text-lg font-semibold mb-2">User Features (Front-End)</h3>
                              <ul className="text-sm leading-relaxed list-disc list-inside space-y-1">
                                <li>Feedback submission form</li>
                                <li>Movement tracking interface</li>
                                <li>Real-time status updates</li>
                              </ul>
                            </div>

                            {/* Signature Placeholder */}
                            <div className="mt-8 pt-8 w-fit">
                              <div className="inline-flex items-center gap-2 px-4 py-3 bg-[#FF383C] rounded-lg">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M2 12L6 8M6 8L10 12M6 8V2" stroke="#EC4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="text-grey-700 font-semibold italic" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                  Signature
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-8">
                            <p className="text-sm text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              No document uploaded
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Add Sign */}
              <div className="lg:w-80 xl:w-96 flex flex-col bg-white flex-shrink-0 border-l border-gray-200">
                <div className="p-4  bg-white">
                  <h5 className="text-base font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Add Sign
                  </h5>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Choose Signer */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Choose signer
                    </label>
                    <div className="relative">
                      <div className="flex items-center gap-2 px-4 py-2.5  rounded-lg bg-white min-h-[42px]">
                        {selectedSigner && (
                          <div className="flex items-center gap-1.5 bg-[#E8F0FF] text-grey-700 px-3 py-1 rounded-full text-sm">
                            <span style={{ fontFamily: 'BasisGrotesquePro' }}>{selectedSigner}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSigner('');
                              }}
                              className="text-grey-700 hover:text-grey-900 ml-1"
                            >
                              <svg width="15" height="15" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="15" height="15" rx="4" fill="white" />
                                <path d="M2.58594 5.4146L5.4146 2.58594M5.4146 5.4146L2.58594 2.58594" stroke="#EF4444" stroke-width="0.6" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                              </svg>

                            </button>
                          </div>
                        )}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6L8 10L12 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signature Type Buttons */}
                  <div>
                    <div className="flex flex-col gap-2">
                      {/* Signature Button */}
                      <button
                        onClick={() => setSelectedSignatureType('Signature')}
                        className={`w-[150px] flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${selectedSignatureType === 'Signature'
                          ? 'bg-pink-100 text-grey-700'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6.56543 8.50977C6.85541 8.33897 7.23164 8.18854 7.62695 8.32031L7.72559 8.3584C8.07002 8.51125 8.24487 8.80716 8.36621 9.12891L8.4834 9.48438V9.48535C8.50968 9.57876 8.55561 9.66607 8.61816 9.74023C8.64485 9.77031 8.66631 9.78492 8.67969 9.79199C8.69259 9.79877 8.6995 9.79883 8.7002 9.79883C8.78363 9.79872 8.92496 9.75145 9.12695 9.63184L9.30273 9.52148C9.36039 9.48379 9.41748 9.4452 9.47363 9.40527L9.47461 9.4043C9.54207 9.35704 9.61102 9.31008 9.68164 9.26367L9.9209 9.12109C10.0022 9.07683 10.0852 9.03568 10.1699 8.99805H10.1709C10.2319 8.97121 10.283 8.94993 10.3232 8.93652L10.3652 8.92285L10.3848 8.91113H10.4082C10.5042 8.88837 10.6054 8.90065 10.6924 8.94824C10.7853 8.99911 10.8539 9.08491 10.8838 9.18652C10.9136 9.28828 10.9024 9.39817 10.8516 9.49121C10.8011 9.58343 10.7158 9.65139 10.6152 9.68164L10.6123 9.68359L10.6113 9.68262L10.5898 9.69141C10.5704 9.6981 10.5379 9.7098 10.4922 9.72949C10.4035 9.76842 10.2729 9.83403 10.1172 9.93457L9.96094 10.041C9.8374 10.1254 9.68093 10.2337 9.53418 10.3203L9.5332 10.3213C9.31412 10.4502 9.01297 10.5995 8.7002 10.5996C8.39879 10.5996 8.16946 10.4396 8.02051 10.2725C7.87237 10.1055 7.77234 9.901 7.7168 9.71484L7.61133 9.39746C7.57983 9.3155 7.55097 9.25456 7.52344 9.20898C7.47296 9.12556 7.42933 9.09753 7.37402 9.0791C7.31829 9.06064 7.20601 9.06083 6.97168 9.19922C6.76001 9.32418 6.52723 9.512 6.24707 9.74023L6.17676 9.79785C5.87836 10.0405 5.53658 10.3126 5.16699 10.5234C4.79563 10.7346 4.36959 10.8993 3.90039 10.8994C3.04036 10.8994 2.35917 10.5555 1.90234 10.2236L1.90137 10.2227L1.87012 10.1992L1.70117 10.0732L1.90625 10.0225L2.71484 9.82031L2.75098 9.81152L2.78418 9.82812C3.09576 9.9845 3.47113 10.0996 3.90039 10.0996C4.18088 10.0995 4.46728 10.0007 4.77051 9.82812C5.07565 9.65392 5.37128 9.42126 5.67285 9.17676L5.75098 9.11328C6.01622 8.89751 6.29668 8.66855 6.56543 8.50977ZM8.25586 1.11133C8.46426 1.1092 8.67129 1.14879 8.86426 1.22754C9.05717 1.30633 9.23253 1.42296 9.37988 1.57031C9.52724 1.71772 9.6439 1.89295 9.72266 2.08594C9.80143 2.27899 9.84104 2.48585 9.83887 2.69434C9.83669 2.90273 9.79268 3.10852 9.70996 3.2998C9.62744 3.49053 9.50719 3.6626 9.35742 3.80664L8.66406 4.5C8.7761 4.61667 8.86674 4.75276 8.92871 4.90234C8.99393 5.05992 9.02732 5.22887 9.02734 5.39941C9.02734 5.57018 8.99408 5.7397 8.92871 5.89746C8.86335 6.05517 8.76723 6.19864 8.64648 6.31934L7.78223 7.18262L7.78125 7.18359C7.70585 7.25642 7.60482 7.29676 7.5 7.2959C7.39517 7.29499 7.29486 7.2528 7.2207 7.17871C7.14655 7.10456 7.10444 7.00427 7.10352 6.89941C7.1026 6.79454 7.14296 6.6936 7.21582 6.61816L8.08105 5.75293C8.17473 5.6592 8.2275 5.53192 8.22754 5.39941C8.22754 5.27573 8.17991 5.15794 8.09766 5.06641L4.18262 8.98242C4.13115 9.0336 4.06657 9.06857 3.99609 9.08594L3.99707 9.08691L1.59668 9.6875C1.52723 9.70475 1.45431 9.70308 1.38574 9.68262C1.31714 9.66212 1.25566 9.62286 1.20703 9.57031C1.15847 9.51782 1.12452 9.45368 1.10938 9.38379C1.09425 9.3138 1.0985 9.24079 1.12109 9.17285L1.87109 6.92285L1.90918 6.83984C1.92535 6.81348 1.94484 6.78868 1.9668 6.7666L7.14062 1.59277C7.28487 1.44241 7.4582 1.32302 7.64941 1.24023C7.8408 1.15743 8.04734 1.1135 8.25586 1.11133ZM8.25 1.93262C8.04677 1.93267 7.85178 2.01358 7.70801 2.15723L2.59961 7.26465L2.10938 8.7334L3.69531 8.33789L8.79199 3.24219C8.93575 3.09836 9.0166 2.90257 9.0166 2.69922C9.01651 2.496 8.93566 2.30097 8.79199 2.15723C8.64819 2.01366 8.45321 1.93262 8.25 1.93262Z" fill="#3B4A66" stroke="#3B4A66" stroke-width="0.2" />
                        </svg>

                        <span className="font-medium text-sm">Signature</span>
                      </button>

                      {/* Date Button */}
                      <button
                        onClick={() => setSelectedSignatureType('Date')}
                        className={`w-[150px] flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${selectedSignatureType === 'Date'
                          ? 'bg-pink-100 text-grey-700'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clip-path="url(#clip0_5150_31011)">
                            <path d="M3.5 2V1.25M8.5 2V1.25M1.25 4.5H10.75M1 6C1 4.1145 1 3.1715 1.586 2.586C2.172 2.0005 3.1145 2 5 2H7C8.8855 2 9.8285 2 10.414 2.586C10.9995 3.172 11 4.1145 11 6V7C11 8.8855 11 9.8285 10.414 10.414C9.828 10.9995 8.8855 11 7 11H5C3.1145 11 2.1715 11 1.586 10.414C1.0005 9.828 1 8.8855 1 7V6Z" stroke="#3B4A66" stroke-linecap="round" />
                            <path d="M9 8.5C9 8.63261 8.94732 8.75979 8.85355 8.85355C8.75979 8.94732 8.63261 9 8.5 9C8.36739 9 8.24021 8.94732 8.14645 8.85355C8.05268 8.75979 8 8.63261 8 8.5C8 8.36739 8.05268 8.24021 8.14645 8.14645C8.24021 8.05268 8.36739 8 8.5 8C8.63261 8 8.75979 8.05268 8.85355 8.14645C8.94732 8.24021 9 8.36739 9 8.5ZM9 6.5C9 6.63261 8.94732 6.75979 8.85355 6.85355C8.75979 6.94732 8.63261 7 8.5 7C8.36739 7 8.24021 6.94732 8.14645 6.85355C8.05268 6.75979 8 6.63261 8 6.5C8 6.36739 8.05268 6.24021 8.14645 6.14645C8.24021 6.05268 8.36739 6 8.5 6C8.63261 6 8.75979 6.05268 8.85355 6.14645C8.94732 6.24021 9 6.36739 9 6.5ZM6.5 8.5C6.5 8.63261 6.44732 8.75979 6.35355 8.85355C6.25979 8.94732 6.13261 9 6 9C5.86739 9 5.74021 8.94732 5.64645 8.85355C5.55268 8.75979 5.5 8.63261 5.5 8.5C5.5 8.36739 5.55268 8.24021 5.64645 8.14645C5.74021 8.05268 5.86739 8 6 8C6.13261 8 6.25979 8.05268 6.35355 8.14645C6.44732 8.24021 6.5 8.36739 6.5 8.5ZM6.5 6.5C6.5 6.63261 6.44732 6.75979 6.35355 6.85355C6.25979 6.94732 6.13261 7 6 7C5.86739 7 5.74021 6.94732 5.64645 6.85355C5.55268 6.75979 5.5 6.63261 5.5 6.5C5.5 6.36739 5.55268 6.24021 5.64645 6.14645C5.74021 6.05268 5.86739 6 6 6C6.13261 6 6.25979 6.05268 6.35355 6.14645C6.44732 6.24021 6.5 6.36739 6.5 6.5ZM4 8.5C4 8.63261 3.94732 8.75979 3.85355 8.85355C3.75979 8.94732 3.63261 9 3.5 9C3.36739 9 3.24021 8.94732 3.14645 8.85355C3.05268 8.75979 3 8.63261 3 8.5C3 8.36739 3.05268 8.24021 3.14645 8.14645C3.24021 8.05268 3.36739 8 3.5 8C3.63261 8 3.75979 8.05268 3.85355 8.14645C3.94732 8.24021 4 8.36739 4 8.5ZM4 6.5C4 6.63261 3.94732 6.75979 3.85355 6.85355C3.75979 6.94732 3.63261 7 3.5 7C3.36739 7 3.24021 6.94732 3.14645 6.85355C3.05268 6.75979 3 6.63261 3 6.5C3 6.36739 3.05268 6.24021 3.14645 6.14645C3.24021 6.05268 3.36739 6 3.5 6C3.63261 6 3.75979 6.05268 3.85355 6.14645C3.94732 6.24021 4 6.36739 4 6.5Z" fill="#3B4A66" />
                          </g>
                          <defs>
                            <clipPath id="clip0_5150_31011">
                              <rect width="12" height="12" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>

                        <span className="font-medium text-sm">Date</span>
                      </button>

                      {/* Initials Button */}
                      <button
                        onClick={() => setSelectedSignatureType('Initials')}
                        className={`w-[150px] flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${selectedSignatureType === 'Initials'
                          ? 'bg-pink-100 text-grey-700'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clip-path="url(#clip0_5150_31017)">
                            <path d="M9 6.5L8.3125 3.063C8.2938 2.96949 8.24875 2.88328 8.18266 2.81453C8.11657 2.74579 8.0322 2.69737 7.9395 2.675L1.6175 1.014C1.53422 0.993866 1.44715 0.995471 1.36467 1.01866C1.28218 1.04186 1.20704 1.08586 1.14645 1.14645C1.08586 1.20704 1.04186 1.28218 1.01866 1.36467C0.995471 1.44715 0.993866 1.53422 1.014 1.6175L2.675 7.9395C2.69737 8.0322 2.74579 8.11657 2.81453 8.18266C2.88328 8.24875 2.96949 8.2938 3.063 8.3125L6.5 9M1.15 1.15L4.793 4.793M7.8535 10.6465C7.75974 10.7402 7.63259 10.7929 7.5 10.7929C7.36742 10.7929 7.24027 10.7402 7.1465 10.6465L6.3535 9.8535C6.25977 9.75974 6.20711 9.63259 6.20711 9.5C6.20711 9.36742 6.25977 9.24027 6.3535 9.1465L9.1465 6.3535C9.24027 6.25977 9.36742 6.20711 9.5 6.20711C9.63259 6.20711 9.75974 6.25977 9.8535 6.3535L10.6465 7.1465C10.7402 7.24027 10.7929 7.36742 10.7929 7.5C10.7929 7.63259 10.7402 7.75974 10.6465 7.8535L7.8535 10.6465ZM6.5 5.5C6.5 6.05229 6.05229 6.5 5.5 6.5C4.94772 6.5 4.5 6.05229 4.5 5.5C4.5 4.94772 4.94772 4.5 5.5 4.5C6.05229 4.5 6.5 4.94772 6.5 5.5Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                          </g>
                          <defs>
                            <clipPath id="clip0_5150_31017">
                              <rect width="12" height="12" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>

                        <span className="font-medium text-sm">Initials</span>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center gap-2 pt-4">
                    <button
                      className="flex-1 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                      style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                    >
                      Clear
                    </button>
                    <button
                      className="flex-1  py-2.5 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors"
                      style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                    >
                      Apply Signature
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 sticky bottom-0 bg-white z-10 rounded-b-lg">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  resetAllState();
                }}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  if (uploadedFile && uploadedFile.type === 'application/pdf') {
                    const url = URL.createObjectURL(uploadedFile);
                    setPdfFileUrl(url);
                  }
                  setShowFinalSignatureModal(true);
                }}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-sm font-medium text-white  bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors"
                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Signature Modal - Draft View with Comments using react-pdf */}
      {showFinalSignatureModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-[9999] p-3 sm:p-4"
          style={{
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            paddingTop: '80px',
            paddingBottom: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFinalSignatureModal(false);
              resetAllState();
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[calc(100vh-100px)] sm:max-h-[90vh] overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-lg">
              <div className="flex-1 pr-4">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  E-Signature - {uploadedFile ? uploadedFile.name : 'Tax_Return_2023_DRAFT.Pdf'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Document Preview
                </p>
              </div>
              <button
                onClick={() => {
                  setShowFinalSignatureModal(false);
                  resetAllState();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1 -mt-1 -mr-1"
                aria-label="Close modal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-6 sm:h-6">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Document Preview with Thumbnails */}
            <div className="flex flex-1 overflow-hidden bg-gray-50">
              {/* Left Sidebar - Page Thumbnails */}
              <div
                id="thumbnails"
                className="w-20 bg-[#EEEEEE] border-r border-gray-200 overflow-y-auto p-2 flex-shrink-0"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 #F3F4F6' }}
              >
                {Array.from({ length: numPages || totalPages }, (_, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedPage(index);
                      setPageNumber(index + 1);
                    }}
                    className="mb-2 cursor-pointer"
                  >
                    <div
                      className={`aspect-[3/4] bg-white rounded flex items-center justify-center ${selectedPage === index
                        ? 'border-2 border-[#3AD6F2]'
                        : 'border border-gray-200'
                        }`}
                      style={{
                        boxShadow: selectedPage === index ? '0 1px 3px rgba(58, 214, 242, 0.2)' : 'none'
                      }}
                    >
                      <span className="text-[10px] text-gray-400">{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Document View */}
              <div
                ref={documentContentRef}
                className="flex-1 overflow-y-auto bg-white relative"
                onMouseUp={handleTextSelection}
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 #F3F4F6' }}
              >
                <div className="p-6 w-fit">
                  <div className="bg-[#EEEEEE] shadow-sm rounded border border-gray-200 p-8 w-full pb-12 relative">
                    {/* Comment Icon - appears when text is selected */}
                    {commentIconPosition && selectedText && !showCommentInput && (
                      <div
                        className="absolute z-20 cursor-pointer comment-icon"
                        style={{
                          top: `${commentIconPosition.top}px`,
                          left: `${commentIconPosition.left}px`,
                          pointerEvents: 'auto'
                        }}
                        onClick={handleCommentIconClick}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                      >
                        <div className="w-6 h-6 bg-[#3AD6F2] rounded flex items-center justify-center shadow-md hover:bg-[#2BC4E0] transition-colors">
                          <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.5 0.5C17.5751 0.5 22.5 5.42487 22.5 11.5C22.5 17.5751 17.5751 22.5 11.5 22.5H0.5V11.5C0.5 5.42487 5.42487 0.5 11.5 0.5Z" fill="#00C0C6" />
                            <path d="M11.5 0.5C17.5751 0.5 22.5 5.42487 22.5 11.5C22.5 17.5751 17.5751 22.5 11.5 22.5H0.5V11.5C0.5 5.42487 5.42487 0.5 11.5 0.5Z" stroke="#00C0C6" />
                            <path d="M8.09222 13.2767H14.6678V12.6789H8.09222V13.2767ZM8.09222 11.4833H14.6678V10.8856H8.09222V11.4833ZM8.09222 9.69H14.6678V9.09222H8.09222V9.69ZM16.76 17.2083L14.9206 15.3689H6.96601C6.69063 15.3689 6.46069 15.2768 6.27617 15.0927C6.09166 14.9086 5.9996 14.6789 6 14.4035V7.96541C6 7.69043 6.09226 7.46069 6.27677 7.27617C6.46129 7.09166 6.69083 6.9996 6.96541 7H15.7946C16.0696 7 16.2991 7.09206 16.4832 7.27617C16.6673 7.46029 16.7596 7.69004 16.76 7.96541V17.2083ZM6.96601 14.7711H15.1759L16.1622 15.7539V7.96601C16.1622 7.87395 16.124 7.78947 16.0474 7.71255C15.9709 7.63564 15.8866 7.59738 15.7946 7.59778H6.96541C6.87375 7.59778 6.78947 7.63604 6.71255 7.71255C6.63564 7.78907 6.59738 7.87335 6.59778 7.96541V14.4035C6.59778 14.4951 6.63604 14.5794 6.71255 14.6563C6.78907 14.7333 6.87335 14.7715 6.96541 14.7711" fill="white" />
                          </svg>

                        </div>
                      </div>
                    )}


                    {/* Display existing comments */}
                    {comments
                      .filter(comment => comment.page === (pageNumber || selectedPage))
                      .map((comment) => (
                        <div
                          key={comment.id}
                          className="absolute z-10"
                          style={{
                            top: `${comment.position.top}px`,
                            left: `${comment.position.left}px`,
                          }}
                        >
                          <div className="bg-white rounded-lg shadow-lg border-2 border-[#3AD6F2] p-3 max-w-xs">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-[#3AD6F2] rounded flex items-center justify-center">
                                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 2C4.69 2 2 4.24 2 7C2 8.5 2.5 9.87 3.3 10.95L2 14L5.3 12.8C6.35 13.53 7.62 14 9 14C12.31 14 15 11.76 15 9C15 6.24 12.31 4 9 4H8V2Z" fill="white" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                  Comment
                                </span>
                              </div>
                              <button
                                onClick={() => setComments(comments.filter(c => c.id !== comment.id))}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-1 italic">"{comment.text}"</p>
                            <p className="text-sm text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              {comment.comment}
                            </p>
                          </div>
                        </div>
                      ))}

                    {/* PDF Rendering using react-pdf */}
                    {uploadedFile && uploadedFile.type === 'application/pdf' ? (
                      uploadedFile ? (
                        <Document
                          file={uploadedFile}
                          onLoadSuccess={onDocumentLoadSuccess}
                          onLoadError={(error) => {
                            console.error('Error loading PDF in final modal:', error);
                            console.error('Error details:', {
                              message: error.message,
                              name: error.name,
                              file: uploadedFile?.name,
                              fileType: uploadedFile?.type,
                              fileSize: uploadedFile?.size,
                              workerSrc: pdfjs.GlobalWorkerOptions.workerSrc
                            });
                            onDocumentLoadError(error);
                          }}
                          loading={
                            <div className="flex items-center justify-center p-8">
                              <p className="text-sm text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                Loading PDF...
                              </p>
                            </div>
                          }
                          options={pdfOptions}
                          className="w-full"
                        >
                          {numPages ? (
                            Array.from(new Array(numPages), (el, index) => (
                              <div key={`page_${index + 1}`} className={`w-full flex justify-center ${index === numPages - 1 ? 'mb-0' : 'mb-4'}`}>
                                <div className="bg-white shadow-lg" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                                  <Page
                                    pageNumber={index + 1}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    width={pdfPageWidth}
                                    className="max-w-full"
                                  />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-center p-8">
                              <p className="text-sm text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                Loading pages...
                              </p>
                            </div>
                          )}
                        </Document>
                      ) : (
                        <div className="flex items-center justify-center p-8">
                          <p className="text-sm text-red-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Error: Could not load PDF file
                          </p>
                        </div>
                      )
                    ) : uploadedFile && uploadedFile.type !== 'application/pdf' ? (
                      /* Simulated Document Content for non-PDF files */
                      <div className="space-y-4 text-gray-800 relative" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        <div className="flex items-center gap-2 mb-4">
                          <h2 className="text-2xl font-bold">Project Overview: MVP Beta - Movement Feedback Module</h2>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM10 16C6.69 16 4 13.31 4 10C4 6.69 6.69 4 10 4C13.31 4 16 6.69 16 10C16 13.31 13.31 16 10 16Z" fill="#3AD6F2" />
                            <path d="M10 6C9.45 6 9 6.45 9 7V10C9 10.55 9.45 11 10 11C10.55 11 11 10.55 11 10V7C11 6.45 10.55 6 10 6ZM10 13C9.45 13 9 13.45 9 14C9 14.55 9.45 15 10 15C10.55 15 11 14.55 11 14C11 13.45 10.55 13 10 13Z" fill="#3AD6F2" />
                          </svg>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">Objective</h3>
                          <p className="text-sm leading-relaxed">
                            The MVP Beta focuses on creating a streamlined feedback module that allows users to provide movement-related feedback efficiently.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">Target User Experience (Beta)</h3>
                          <p className="text-sm leading-relaxed">
                            Users should be able to quickly submit feedback about movements with minimal friction.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">User Features (Front-End)</h3>
                          <ul className="text-sm leading-relaxed list-disc list-inside space-y-1 mb-4">
                            <li>Feedback submission form</li>
                            <li>Movement tracking interface</li>
                            <li>Real-time status updates</li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">2. Guided Instructions Display</h3>
                          <p className="text-sm leading-relaxed mb-4">
                            Provide clear instructions and guidance throughout the feedback process to ensure users understand each step.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">3. Camera Access & Recording Tool</h3>
                          <p className="text-sm leading-relaxed mb-4">
                            Enable users to capture and record movement-related content using their device camera.
                          </p>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-200">
                          <p className="text-xs text-gray-500 italic">
                            This document is for informational purposes only. Please review all terms and conditions carefully.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-8">
                        <p className="text-sm text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          No document uploaded
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Comment Input and Comment List */}
              {showCommentInput && (
                <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col flex-shrink-0">
                  {/* Comment Input Section */}
                  <div className="bg-white border-b border-gray-200 p-4">
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Selected text:
                      </p>
                      <p className="text-sm font-medium text-gray-800 bg-yellow-50 p-2 rounded border border-yellow-200" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        "{selectedText}"
                      </p>
                    </div>
                    <textarea
                      value={currentComment}
                      onChange={(e) => setCurrentComment(e.target.value)}
                      placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm resize-none comment-input-container"
                      rows="4"
                      style={{ fontFamily: 'BasisGrotesquePro' }}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={handleCloseCommentInput}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveComment}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors"
                        style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                      >
                        Comment
                      </button>
                    </div>
                  </div>

                  {/* Comment List Section */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Comments
                    </h4>
                    {comments
                      .filter(comment => {
                        const currentPageNum = pageNumber || (selectedPage + 1) || 1;
                        return comment.page === currentPageNum;
                      })
                      .length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        No comments yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {comments
                          .filter(comment => {
                            const currentPageNum = pageNumber || (selectedPage + 1) || 1;
                            return comment.page === currentPageNum;
                          })
                          .map((comment) => (
                            <div
                              key={comment.id}
                              className="bg-white rounded-lg border border-gray-200 p-3 relative"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 text-[#3AD6F2] border-gray-300 rounded focus:ring-[#3AD6F2]"
                                  />
                                  <span className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                    Mark as resolved and hide discussion
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const updatedComments = comments.map(c =>
                                        c.id === comment.id ? { ...c, comment: prompt('Edit comment:', c.comment) || c.comment } : c
                                      );
                                      setComments(updatedComments);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M11.333 2.667L13.333 4.667M12 1.333L10 3.333M2 14L10.667 5.333L13.333 8L4.667 14H2V11.333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => setComments(comments.filter(c => c.id !== comment.id))}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mb-2 italic" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                "{comment.text}"
                              </p>
                              <p className="text-sm text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                {comment.comment}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comment List Sidebar - Always visible when there are comments but no input */}
              {!showCommentInput && comments.filter(comment => {
                const currentPageNum = pageNumber || (selectedPage + 1) || 1;
                return comment.page === currentPageNum;
              }).length > 0 && (
                  <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col flex-shrink-0">
                    <div className="flex-1 overflow-y-auto p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Comments ({comments.filter(comment => {
                          const currentPageNum = pageNumber || (selectedPage + 1) || 1;
                          return comment.page === currentPageNum;
                        }).length})
                      </h4>
                      <div className="space-y-3">
                        {comments
                          .filter(comment => {
                            const currentPageNum = pageNumber || (selectedPage + 1) || 1;
                            return comment.page === currentPageNum;
                          })
                          .map((comment) => (
                            <div
                              key={comment.id}
                              className="bg-white rounded-lg border border-gray-200 p-3 relative"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 text-[#3AD6F2] border-gray-300 rounded focus:ring-[#3AD6F2]"
                                  />
                                  <span className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                    Mark as resolved and hide discussion
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const updatedComments = comments.map(c =>
                                        c.id === comment.id ? { ...c, comment: prompt('Edit comment:', c.comment) || c.comment } : c
                                      );
                                      setComments(updatedComments);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <g clip-path="url(#clip0_5150_36196)">
                                        <path d="M4 1.00008H1.66667C1.48986 1.00008 1.32029 1.07031 1.19526 1.19534C1.07024 1.32036 1 1.48993 1 1.66674V6.33341C1 6.51022 1.07024 6.67979 1.19526 6.80481C1.32029 6.92984 1.48986 7.00008 1.66667 7.00008H6.33333C6.51014 7.00008 6.67971 6.92984 6.80474 6.80481C6.92976 6.67979 7 6.51022 7 6.33341V4.00008M6.125 0.875075C6.25761 0.742467 6.43746 0.667969 6.625 0.667969C6.81254 0.667969 6.99239 0.742467 7.125 0.875075C7.25761 1.00768 7.33211 1.18754 7.33211 1.37508C7.33211 1.56261 7.25761 1.74247 7.125 1.87508L4 5.00008L2.66667 5.33341L3 4.00008L6.125 0.875075Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                      </g>
                                      <defs>
                                        <clipPath id="clip0_5150_36196">
                                          <rect width="16" height="16" fill="white" />
                                        </clipPath>
                                      </defs>
                                    </svg>

                                  </button>
                                  <button
                                    onClick={() => setComments(comments.filter(c => c.id !== comment.id))}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <g clip-path="url(#clip0_5150_36199)">
                                        <path d="M1 2.0013H7M6.33333 2.0013V6.66797C6.33333 7.0013 6 7.33464 5.66667 7.33464H2.33333C2 7.33464 1.66667 7.0013 1.66667 6.66797V2.0013M2.66667 2.0013V1.33464C2.66667 1.0013 3 0.667969 3.33333 0.667969H4.66667C5 0.667969 5.33333 1.0013 5.33333 1.33464V2.0013M3.33333 3.66797V5.66797M4.66667 3.66797V5.66797" stroke="#EF4444" stroke-linecap="round" stroke-linejoin="round" />
                                      </g>
                                      <defs>
                                        <clipPath id="clip0_5150_36199">
                                          <rect width="16" height="16" fill="white" />
                                        </clipPath>
                                      </defs>
                                    </svg>

                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mb-2 italic" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                "{comment.text}"
                              </p>
                              <p className="text-sm text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                {comment.comment}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 sticky bottom-0 bg-white z-10 rounded-b-lg">
              <button
                onClick={() => {
                  setShowFinalSignatureModal(false);
                  resetAllState();
                }}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (uploadedFile) {
                    if (uploadedFile.type === 'application/pdf') {
                      window.open(pdfFileUrl, '_blank');
                    } else {
                      window.open(URL.createObjectURL(uploadedFile), '_blank');
                    }
                  }
                }}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
              >
                Preview
              </button>
              <button
                onClick={async () => {
                  // Merge annotations and complete signature
                  if (uploadedFile && uploadedFile.type === 'application/pdf' && comments.length > 0) {
                    const mergedPdf = await mergeAnnotationsToPdf();
                    if (mergedPdf) {
                      const url = URL.createObjectURL(mergedPdf);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `signed_${uploadedFile.name}`;
                      link.click();
                    }
                  }
                  alert('Signature completed successfully!');
                  setShowFinalSignatureModal(false);
                }}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors"
                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
              >
                Complete Signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !creatingTemplate && setShowCreateTemplateModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900" style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>
                Create Template
              </h2>
              <button
                onClick={() => !creatingTemplate && setShowCreateTemplateModal(false)}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                disabled={creatingTemplate}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  style={{ fontFamily: 'BasisGrotesquePro' }}
                  disabled={creatingTemplate}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Description
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  style={{ fontFamily: 'BasisGrotesquePro' }}
                  disabled={creatingTemplate}
                  rows="3"
                  placeholder="Enter template description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Document <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".doc,.docx,.pdf"
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, document: e.target.files[0] }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  style={{ fontFamily: 'BasisGrotesquePro' }}
                  disabled={creatingTemplate}
                />
                {newTemplate.document && (
                  <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Selected: {newTemplate.document.name}
                  </p>
                )}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newTemplate.is_active}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-[#3AD6F2] border-gray-300 rounded focus:ring-[#3AD6F2]"
                  disabled={creatingTemplate}
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Active
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateTemplateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-[BasisGrotesquePro]"
                  disabled={creatingTemplate}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTemplate}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity font-[BasisGrotesquePro]"
                  style={{ background: '#F56D2D' }}
                  disabled={creatingTemplate}
                >
                  {creatingTemplate ? 'Creating...' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Template Confirmation Modal */}
      {showDeleteTemplateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !deletingTemplate && setShowDeleteTemplateModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900" style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>
                Delete Template
              </h2>
              <button
                onClick={() => !deletingTemplate && setShowDeleteTemplateModal(false)}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                disabled={deletingTemplate}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                Are you sure you want to delete this template? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteTemplateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-[BasisGrotesquePro]"
                disabled={deletingTemplate}
              >
                Cancel
              </button>
              <button
                onClick={() => selectedTemplateForDelete && handleDeleteTemplate(selectedTemplateForDelete)}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity font-[BasisGrotesquePro]"
                style={{ background: '#EF4444' }}
                disabled={deletingTemplate}
              >
                {deletingTemplate ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

