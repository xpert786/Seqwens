import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Outlet, useParams } from "react-router-dom";
import { File, UpIcon, Doc, FaildIcon, FiltIcon, CompletedIcon, AwaitingIcon, Received, Uploaded, FileIcon } from "../../component/icons";
import { FaFolder } from "react-icons/fa";
import TaxUploadModal from "../../upload/TaxUploadModal";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError, taxPreparerDocumentsAPI, esignAssignAPI } from "../../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
import { Modal } from "react-bootstrap";
import ConfirmationModal from "../../../components/ConfirmationModal";
import FirmSharedDocuments from "./FirmSharedDocuments";
import SharedDocuments from "./SharedDocuments";
import "../../styles/MyClients.css";
import "./DocumentsPage.css";

const SUPPORTED_PREVIEW_TYPES = new Set(["pdf", "png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"]);

const formatFileSizeDisplay = (value) => {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "number") {
    let bytes = value;
    const units = ["B", "KB", "MB", "GB", "TB"];
    let unitIndex = 0;
    while (bytes >= 1024 && unitIndex < units.length - 1) {
      bytes /= 1024;
      unitIndex += 1;
    }
    const precision = bytes >= 10 || unitIndex === 0 ? 0 : 1;
    return `${bytes.toFixed(precision)} ${units[unitIndex]}`;
  }

  // Attempt to parse formatted values like "2 MB"
  const numericPart = parseFloat(String(value).replace(/[^\d.]/g, ""));
  if (Number.isNaN(numericPart)) {
    return value;
  }

  const lowerValue = String(value).toLowerCase();
  if (lowerValue.includes("kb")) {
    return formatFileSizeDisplay(numericPart * 1024);
  }
  if (lowerValue.includes("mb")) {
    return formatFileSizeDisplay(numericPart * 1024 * 1024);
  }
  if (lowerValue.includes("gb")) {
    return formatFileSizeDisplay(numericPart * 1024 * 1024 * 1024);
  }

  return `${numericPart.toFixed(0)} B`;
};

const formatDateDisplay = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const getDocumentName = (doc = {}) =>
  doc.file_name ||
  doc.name ||
  doc.document_name ||
  doc.filename ||
  doc.title ||
  "Untitled Document";

const getDocumentUrl = (doc = {}) =>
  doc.file_url ||
  doc.download_url ||
  doc.document_url ||
  doc.tax_documents ||
  doc.url ||
  doc.file ||
  "";

const getDocumentExtension = (doc = {}) => {
  const explicit =
    doc.file_type ||
    doc.file_extension ||
    doc.document_type ||
    doc.mime_type;

  if (explicit) {
    const lower = explicit.toString().toLowerCase();
    if (lower.includes("/")) {
      return lower.split("/").pop();
    }
    if (lower.startsWith(".")) {
      return lower.slice(1);
    }
    return lower;
  }

  const name = getDocumentName(doc).toLowerCase();
  const segments = name.split(".");
  return segments.length > 1 ? segments.pop() : "";
};

const getDocumentTypeLabel = (doc = {}) => {
  const extension = getDocumentExtension(doc);
  if (extension) {
    return extension.toUpperCase();
  }
  const fallback = doc.file_type || doc.document_type || "—";
  return fallback.toString().toUpperCase();
};

const getDocumentSizeValue = (doc = {}) =>
  doc.file_size_bytes ??
  doc.size_bytes ??
  (typeof doc.file_size === "number" ? doc.file_size : undefined) ??
  (typeof doc.size === "number" ? doc.size : undefined) ??
  doc.file_size ??
  doc.size ??
  null;

const getDocumentUpdatedAt = (doc = {}) =>
  doc.updated_at_formatted ||
  doc.updated_at ||
  doc.created_at_formatted ||
  doc.created_at ||
  doc.date ||
  doc.uploaded_at ||
  null;

const getDocumentStatus = (doc = {}) =>
  doc.status_display || doc.status || (doc.is_archived ? "Archived" : "Active");

const getStatusBadgeClass = (status) => {
  const normalized = status?.toString().toLowerCase();
  if (!normalized) return "bg-secondary";
  if (normalized.includes("archived") || normalized.includes("inactive")) return "bg-secondary";
  if (normalized.includes("pending") || normalized.includes("review")) return "bg-warning text-dark";
  if (normalized.includes("error") || normalized.includes("fail") || normalized.includes("reject")) return "bg-danger";
  return "bg-success";
};
export default function DocumentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const isNestedUnderClient = location.pathname.includes("/taxdashboard/client/");
  // Extract client ID from URL if available
  const clientIdFromUrl = params.clientId || (location.pathname.match(/\/client\/(\d+)/)?.[1]);
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewTriggerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('my-documents');  // 'my-documents' or 'firm-shared'
  const [statistics, setStatistics] = useState({
    total_clients: 0,
    reviewed_documents: 0,
    my_uploads: 0
  });
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [statisticsError, setStatisticsError] = useState(null);

  const documents = [
    {
      id: 1,
      title: "John Doe - 2023 Tax Return",
      owner: "John Doe",
      docsCount: 8,
      date: "03/06/2024",
    },
    {
      id: 2,
      title: "Sarah Wilson - Individual Return",
      owner: "Sarah Wilson",
      docsCount: 6,
      date: "02/14/2024",
    },
    {
      id: 3,
      title: "ABC Corp - Business Documents",
      owner: "ABC Corp",
      docsCount: 12,
      date: "03/11/2024",
    },
    {
      id: 4,
      title: "Tax Form Templates",
      owner: "System",
      docsCount: 25,
      date: "01/10/2024",
    },
  ];
  const clients = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "(555) 123-4567",
      statuses: ["Active", "High Priority", "High Priority", "Tax Season"],
      tasks: 3,
      documents: 8,
    },
    {
      id: 2,
      name: "Sarah Wilson",
      email: "sarah.wilson@email.com",
      phone: "(555) 123-4567",
      statuses: ["Pending", "Medium", "New Client"],
      tasks: 0,
      documents: 0,
    },
    {
      id: 3,
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "(555) 123-4567",
      statuses: ["Active", "Medium", "Client"],
      tasks: 2,
      documents: 1,
    },
    {
      id: 4,
      name: "Mike Johnson",
      email: "mike@abccorp.com",
      phone: "(555) 123-4567",
      statuses: ["Active", "High", "Business", "Quarterly"],
      tasks: 5,
      documents: 12,
      due: "3/31/2024",
    },
  ];

  // Fetch statistics from API
  useEffect(() => {
    const fetchStatistics = async () => {
      if (isNestedUnderClient) {
        setStatisticsLoading(false);
        return;
      }

      try {
        setStatisticsLoading(true);
        setStatisticsError(null);
        const response = await taxPreparerDocumentsAPI.getStatistics();

        if (response.success && response.data) {
          setStatistics({
            total_clients: response.data.total_clients || 0,
            reviewed_documents: response.data.reviewed_documents || 0,
            my_uploads: response.data.my_uploads || 0
          });
        } else {
          throw new Error(response.message || 'Failed to fetch statistics');
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setStatisticsError(handleAPIError(error));
        // Set default values on error
        setStatistics({
          total_clients: 0,
          reviewed_documents: 0,
          my_uploads: 0
        });
      } finally {
        setStatisticsLoading(false);
      }
    };

    fetchStatistics();
  }, [isNestedUnderClient]);

  const cardData = [
    { label: "Total Clients", icon: <Doc />, count: statistics.total_clients, color: "#00bcd4" },
    { label: "Reviewed", icon: <Received />, count: statistics.reviewed_documents, color: "#3f51b5" },
    { label: "My Uploads", icon: <Uploaded />, count: statistics.my_uploads, color: "#EF4444" },
  ];

  const getDocumentMeta = (doc) => {
    const extension = getDocumentExtension(doc);
    const url = getDocumentUrl(doc);
    return {
      name: getDocumentName(doc),
      url,
      extension,
      canPreview: Boolean(url) && SUPPORTED_PREVIEW_TYPES.has(extension),
    };
  };

  const openPreviewModal = (doc, triggerElement) => {
    const meta = getDocumentMeta(doc);
    if (!meta.url || !meta.canPreview) {
      toast.error("Preview is not available for this file type.");
      return;
    }
    if (triggerElement) {
      previewTriggerRef.current = triggerElement;
    }
    setPreviewDoc(meta);
    setShowPreview(true);
  };

  const closePreviewModal = () => {
    setShowPreview(false);
    setPreviewDoc(null);
    if (previewTriggerRef.current) {
      previewTriggerRef.current.focus();
    }
  };

  const handleDownload = (doc) => {
    const url = getDocumentUrl(doc);
    if (!url) {
      toast.error("Download link unavailable for this document.");
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = getDocumentName(doc);
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check if document is a file (not a folder)
  const isFile = (doc) => {
    return !doc.is_folder && doc.type !== 'folder' && doc.document_type !== 'folder';
  };

  // Fetch taxpayers/clients for assignment
  const fetchTaxpayers = async () => {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();
      const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/tax-preparer/clients/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const clients = result.data.clients || result.data || [];
          setTaxpayers(clients);
          if (clients.length > 0 && !selectedTaxpayerId) {
            setSelectedTaxpayerId(clients[0].id?.toString() || '');
          }
        }
      } else {
        throw new Error('Failed to fetch taxpayers');
      }
    } catch (error) {
      console.error('Error fetching taxpayers:', error);
      toast.error('Failed to load taxpayers', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Open assign modal
  const handleOpenAssignModal = (doc) => {
    if (!isFile(doc)) {
      toast.warning('Only files can be assigned for e-signing, not folders', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Check if file is PDF
    const fileExtension = getDocumentExtension(doc);
    if (fileExtension?.toLowerCase() !== 'pdf') {
      toast.warning('Only PDF files can be assigned for e-signature', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setDocumentToAssign(doc);
    setShowAssignModal(true);
    setShowMenuIndex(null);

    // If client ID is available from URL, use it
    if (clientIdFromUrl) {
      setSelectedTaxpayerId(clientIdFromUrl);
      // Fetch taxpayers to get client info for display
      fetchTaxpayers();
    } else {
      fetchTaxpayers();
    }

    // Set default deadline to 30 days from now
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 30);
    setDeadline(defaultDeadline.toISOString().split('T')[0]);
  };

  // Poll for e-sign status
  const pollESignStatus = async (esignDocumentId, maxAttempts = 30) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await esignAssignAPI.pollESignStatus(esignDocumentId);

        if (response.success && response.data) {
          const status = response.data.processing_status;
          setPollingStatus({
            status,
            message: status === 'completed' ? 'Processing complete!' : `Processing... (${i + 1}/${maxAttempts})`,
            data: response.data
          });

          if (status === 'completed') {
            return response.data;
          }

          if (status === 'failed') {
            throw new Error(response.data.processing_error || 'Processing failed');
          }
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Processing timeout');
  };

  // Handle assign document for e-sign
  const handleAssignDocument = async () => {
    const taxpayerId = clientIdFromUrl || selectedTaxpayerId;

    if (!documentToAssign || !taxpayerId || !deadline) {
      toast.error('Please fill in all required fields', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setAssigning(true);
      setPollingStatus({ status: 'pending', message: 'Assigning document...' });

      const assignmentData = {
        document_id: documentToAssign.id || documentToAssign.document_id,
        taxpayer_id: parseInt(taxpayerId),
        has_spouse: hasSpouse,
        preparer_must_sign: preparerMustSign,
        deadline: deadline
      };

      const response = await esignAssignAPI.assignDocumentForESign(assignmentData);

      if (response.success && response.data) {
        const esignDocId = response.data.id;

        setPollingStatus({
          status: 'processing',
          message: 'Document assigned. Processing in background...'
        });

        // Poll for status
        try {
          const statusData = await pollESignStatus(esignDocId);

          toast.success('Document assigned for e-signing successfully!', {
            position: "top-right",
            autoClose: 5000,
          });

          // Close modal and reset
          setShowAssignModal(false);
          setDocumentToAssign(null);
          setSelectedTaxpayerId('');
          setDeadline('');
          setHasSpouse(false);
          setPreparerMustSign(false);
          setPollingStatus(null);

          // Refresh documents
          fetchFileManagerDocuments(fileManagerCurrentFolder?.id || null, fileManagerSearchQuery);
        } catch (pollError) {
          console.error('Polling error:', pollError);
          toast.warning('Document assigned but processing is still in progress. Check status later.', {
            position: "top-right",
            autoClose: 5000,
          });
          setShowAssignModal(false);
          setDocumentToAssign(null);
          setSelectedTaxpayerId('');
          setDeadline('');
          setHasSpouse(false);
          setPreparerMustSign(false);
          setPollingStatus(null);
        }
      } else {
        throw new Error(response.message || 'Failed to assign document');
      }
    } catch (error) {
      console.error('Error assigning document:', error);
      const errorMessage = handleAPIError(error);
      toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to assign document'), {
        position: "top-right",
        autoClose: 5000,
      });
      setPollingStatus(null);
    } finally {
      setAssigning(false);
    }
  };

  // Handle delete document
  const handleDeleteDocument = (doc) => {
    setDocumentToDelete(doc);
    setShowDeleteDocumentConfirm(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      setDeletingDocumentId(documentToDelete.id || documentToDelete.document_id);
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const docId = documentToDelete.id || documentToDelete.document_id;
      const url = `${API_BASE_URL}/taxpayer/documents/${docId}/`;

      const config = {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove document from list
      setFileManagerDocuments(prevDocuments =>
        prevDocuments.filter(doc =>
          (doc.id !== docId && doc.document_id !== docId)
        )
      );

      toast.success('Document deleted successfully', {
        position: "top-right",
        autoClose: 3000,
      });

      setShowDeleteDocumentConfirm(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error('Error deleting document:', error);
      const errorMessage = handleAPIError(error);
      toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to delete document'), {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setDeletingDocumentId(null);
    }
  };

  // File Manager State
  const [fileManagerView, setFileManagerView] = useState("grid");
  const [fileManagerFolders, setFileManagerFolders] = useState([]);
  const [fileManagerDocuments, setFileManagerDocuments] = useState([]);
  const [fileManagerLoading, setFileManagerLoading] = useState(false);
  const [fileManagerError, setFileManagerError] = useState(null);
  const [fileManagerCurrentFolder, setFileManagerCurrentFolder] = useState(null);
  const [fileManagerParentFolder, setFileManagerParentFolder] = useState(null);
  const [fileManagerBreadcrumbs, setFileManagerBreadcrumbs] = useState([]);
  const [fileManagerStatistics, setFileManagerStatistics] = useState({
    total_folders: 0,
    total_documents: 0,
    archived_documents: 0
  });
  const [fileManagerSearchQuery, setFileManagerSearchQuery] = useState("");
  const [fileManagerSelectedFolderId, setFileManagerSelectedFolderId] = useState(null);
  const [fileManagerShowArchived, setFileManagerShowArchived] = useState(false);
  const [fileManagerCreatingFolder, setFileManagerCreatingFolder] = useState(false);
  const [fileManagerNewFolderName, setFileManagerNewFolderName] = useState("");
  const [fileManagerNewFolderDescription, setFileManagerNewFolderDescription] = useState("");
  const [fileManagerCreatingFolderLoading, setFileManagerCreatingFolderLoading] = useState(false);

  // Assign for E-Sign states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [documentToAssign, setDocumentToAssign] = useState(null);
  const [taxpayers, setTaxpayers] = useState([]);
  const [selectedTaxpayerId, setSelectedTaxpayerId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [hasSpouse, setHasSpouse] = useState(false);
  const [preparerMustSign, setPreparerMustSign] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [pollingStatus, setPollingStatus] = useState(null);

  // Delete document states
  const [showDeleteDocumentConfirm, setShowDeleteDocumentConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);

  // Menu state
  const [showMenuIndex, setShowMenuIndex] = useState(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenuIndex !== null && !event.target.closest('[data-menu-container]')) {
        setShowMenuIndex(null);
      }
    };

    if (showMenuIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenuIndex]);

  // Fetch documents and folders for file manager
  const fetchFileManagerDocuments = async (folderId = null, search = "") => {
    try {
      setFileManagerLoading(true);
      setFileManagerError(null);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams();
      if (folderId) {
        params.append('folder_id', folderId);
      }
      if (search) {
        params.append('search', search);
      }
      if (fileManagerShowArchived) {
        params.append('show_archived', 'true');
      }

      const queryString = params.toString();
      const url = `${API_BASE_URL}/firm/staff/documents/browse/${queryString ? `?${queryString}` : ''}`;

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        if (result.data.current_folder) {
          setFileManagerCurrentFolder(result.data.current_folder);
        } else {
          setFileManagerCurrentFolder(null);
        }
        if (result.data.parent_folder) {
          setFileManagerParentFolder(result.data.parent_folder);
        } else {
          setFileManagerParentFolder(null);
        }
        if (result.data.breadcrumbs && Array.isArray(result.data.breadcrumbs)) {
          setFileManagerBreadcrumbs(result.data.breadcrumbs);
        } else {
          setFileManagerBreadcrumbs([]);
        }
        const foldersList = result.data.folders || [];
        setFileManagerFolders(foldersList);
        const docs = result.data.documents || [];
        setFileManagerDocuments(docs);
        if (result.data.statistics) {
          setFileManagerStatistics(result.data.statistics);
        }
      } else {
        throw new Error(result.message || 'Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching file manager documents:', error);
      setFileManagerError(handleAPIError(error));
      setFileManagerFolders([]);
      setFileManagerDocuments([]);
    } finally {
      setFileManagerLoading(false);
    }
  };

  // Fetch file manager documents on component mount and when folder/search changes
  useEffect(() => {
    if (!isNestedUnderClient) {
      fetchFileManagerDocuments(fileManagerSelectedFolderId, fileManagerSearchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileManagerSelectedFolderId, fileManagerSearchQuery, fileManagerShowArchived, isNestedUnderClient]);

  // Create folder in file manager
  const handleFileManagerCreateFolder = async () => {
    if (!fileManagerNewFolderName.trim()) {
      toast.error('Please enter a folder name', { position: "top-right", autoClose: 3000 });
      return;
    }

    setFileManagerCreatingFolderLoading(true);

    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const folderData = {
        title: fileManagerNewFolderName.trim(),
        description: fileManagerNewFolderDescription.trim() || ''
      };

      if (fileManagerSelectedFolderId) {
        folderData.parent_id = fileManagerSelectedFolderId;
      }

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(folderData)
      };

      const response = await fetchWithCors(`${API_BASE_URL}/firm/staff/documents/folders/create/`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Folder created successfully!', { position: "top-right", autoClose: 3000 });
        setFileManagerNewFolderName("");
        setFileManagerNewFolderDescription("");
        setFileManagerCreatingFolder(false);
        // Refresh the file manager
        fetchFileManagerDocuments(fileManagerSelectedFolderId, fileManagerSearchQuery);
      } else {
        throw new Error(result.message || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error(handleAPIError(error), { position: "top-right", autoClose: 3000 });
    } finally {
      setFileManagerCreatingFolderLoading(false);
    }
  };

  const wrapperClass = isNestedUnderClient ? "mt-6" : "lg:p-4 md:p-2 px-1 documents-page-wrapper";

  return (
    <div className={wrapperClass}>
      {/* Upload Modal */}
      <TaxUploadModal
        show={showUpload}
        handleClose={() => setShowUpload(false)}
        clientId={clientIdFromUrl}
        onUploadSuccess={() => fetchFileManagerDocuments(fileManagerSelectedFolderId, fileManagerSearchQuery)}
      />
      {/* Header (hide when nested under client) */}
      {!isNestedUnderClient && (
        <div className="header d-flex justify-content-between align-items-center mb-4 documents-header">
          <div className="documents-header-title">
            <h3 className="fw-semibold">Documents</h3>
            <small className="text-muted">Manage client documents and files</small>
          </div>
          <div className="d-flex gap-2 documents-header-buttons">
            <button
              className="btn dashboard-btn btn-upload d-flex align-items-center gap-2"
              onClick={() => setShowUpload(true)}
            >
              <UpIcon />
              <span className="btn-text">Upload Documents</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabs (hide when nested under client) */}
      {!isNestedUnderClient && (
        <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <ul className="nav nav-tabs documents-nav-tabs flex-grow-1 border-0" style={{ gap: '10px' }}>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'my-documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-documents')}
                style={{
                  border: 'none',
                  borderBottom: activeTab === 'my-documents' ? '2px solid #00C0C6' : '2px solid transparent',
                  color: activeTab === 'my-documents' ? '#00C0C6' : '#6B7280',
                  fontWeight: activeTab === 'my-documents' ? '600' : '400',
                  backgroundColor: 'transparent',
                  padding: '12px 24px',
                  fontFamily: 'BasisGrotesquePro',
                  cursor: 'pointer',
                }}
              >
                My Documents
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'firm-shared' ? 'active' : ''}`}
                onClick={() => setActiveTab('firm-shared')}
                style={{
                  border: 'none',
                  borderBottom: activeTab === 'firm-shared' ? '2px solid #00C0C6' : '2px solid transparent',
                  color: activeTab === 'firm-shared' ? '#00C0C6' : '#6B7280',
                  fontWeight: activeTab === 'firm-shared' ? '600' : '400',
                  backgroundColor: 'transparent',
                  padding: '12px 24px',
                  fontFamily: 'BasisGrotesquePro',
                  cursor: 'pointer'
                }}
              >
                Firm Shared Documents
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Render content based on active tab */}
      {!isNestedUnderClient && activeTab === 'firm-shared' ? (
        <FirmSharedDocuments />
      ) : !isNestedUnderClient && activeTab === 'shared-with-me' ? (
        <SharedDocuments />
      ) : (
        <>
          {/* Stats (hide when nested under client) */}
          {!isNestedUnderClient && (
            <div className="documents-stats-container" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'nowrap' }}>
              {statisticsLoading ? (
                // Loading state - show skeleton or loading cards
                cardData.map((item, index) => (
                  <div key={index} style={{ flex: '1', minWidth: '200px' }}>
                    <div className="stat-card d-flex align-items-center p-3 gap-3">
                      <div className="stat-icon p-0 rounded-lg d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ color: item.color, backgroundColor: `${item.color}15`, width: '44px', height: '44px', borderRadius: '8px' }}>
                        {item.icon}
                      </div>
                      <div className="d-flex flex-column">
                        <div className="text-muted fw-medium text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.025em' }}>{item.label}</div>
                        <div className="stat-count">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : statisticsError ? (
                // Error state
                <div style={{ width: '100%' }}>
                  <div className="alert alert-warning" role="alert">
                    <small>Unable to load statistics: {statisticsError}</small>
                  </div>
                </div>
              ) : (
                // Normal state with data
                cardData.map((item, index) => (
                  <div key={index} style={{ flex: '1', minWidth: '200px' }}>
                    <div className="stat-card d-flex align-items-center p-3 gap-3">
                      <div className="stat-icon p-0 rounded-lg d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ color: item.color, backgroundColor: `${item.color}15`, width: '44px', height: '44px', borderRadius: '8px' }}>
                        {item.icon}
                      </div>
                      <div className="d-flex flex-column flex-grow-1">
                        <h3 className="fw-bold mb-0" style={{ fontSize: '24px', color: '#111827' }}>
                          {item.count}
                        </h3>
                        <div className="text-muted fw-medium text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.025em' }}>{item.label}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}



          {/* File Manager Section (only show when not nested under client) */}
          {!isNestedUnderClient && (
            <div className="bg-white rounded-xl p-6">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4 file-manager-header">
                <div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>
                    File Manager
                  </h3>
                  <p className="text-sm text-gray-500 mb-0">
                    {fileManagerCurrentFolder ? `Browsing: ${fileManagerCurrentFolder.title}` : 'Organized document folders'}
                  </p>
                </div>
                <button
                  className="btn btn-primary d-flex align-items-center gap-2"
                  onClick={() => setFileManagerCreatingFolder(true)}
                  style={{
                    backgroundColor: "#00C0C6",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px"
                  }}
                >
                  <FaFolder /> Create Folder
                </button>
              </div>

              {/* Breadcrumb Navigation */}
              {(fileManagerBreadcrumbs.length > 0 || fileManagerCurrentFolder) && (
                <div className="mb-4">
                  <div className="d-flex align-items-center gap-2 flex-wrap breadcrumb-container" style={{ backgroundColor: "#f8f9fa", padding: "12px 16px", borderRadius: "8px" }}>
                    <button
                      className="btn  text-primary p-0 border-0 bg-transparent"
                      onClick={() => setFileManagerSelectedFolderId(null)}
                      style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}
                    >
                      <i className="bi bi-house me-1"></i>
                      Root
                    </button>
                    {fileManagerBreadcrumbs.map((breadcrumb, idx) => (
                      <React.Fragment key={idx}>
                        <span style={{ color: "#6B7280", fontFamily: "BasisGrotesquePro" }}>/</span>
                        <button
                          className="btn  text-primary p-0 border-0 bg-transparent"
                          onClick={() => setFileManagerSelectedFolderId(breadcrumb.id)}
                          style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}
                        >
                          {breadcrumb.title}
                        </button>
                      </React.Fragment>
                    ))}
                    {fileManagerCurrentFolder && (
                      <>
                        <span style={{ color: "#6B7280", fontFamily: "BasisGrotesquePro" }}>/</span>
                        <span style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500" }}>
                          {fileManagerCurrentFolder.title}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}



              {/* Search and Filter */}
              <div className="d-flex align-items-center gap-2 mb-4 file-manager-search-row" style={{ flexWrap: 'nowrap', alignItems: 'center' }}>
                <div className="position-relative file-manager-search-box" style={{ width: '260px', flexShrink: 0 }}>
                  <input
                    type="text"
                    className="form-control rounded"
                    placeholder="Search..."
                    value={fileManagerSearchQuery}
                    onChange={(e) => setFileManagerSearchQuery(e.target.value)}
                    style={{
                      border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                      paddingLeft: "38px",
                      paddingRight: "12px",
                      paddingTop: "10px",
                      paddingBottom: "8px",
                      width: "100%",
                      height: "38px",
                      fontSize: "14px",
                      lineHeight: "22px"
                    }}
                  />
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '12px',
                      zIndex: 10,
                      pointerEvents: 'none'
                    }}
                  >
                    <path d="M11 11L8.49167 8.49167M9.83333 5.16667C9.83333 7.74399 7.74399 9.83333 5.16667 9.83333C2.58934 9.83333 0.5 7.74399 0.5 5.16667C0.5 2.58934 2.58934 0.5 5.16667 0.5C7.74399 0.5 9.83333 2.58934 9.83333 5.16667Z" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>


              </div>

              {/* Loading State */}
              {fileManagerLoading && (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading documents...</p>
                </div>
              )}

              {/* Error State */}
              {fileManagerError && !fileManagerLoading && (
                <div className="alert alert-danger" role="alert">
                  <strong>Error:</strong> {fileManagerError}
                  <button className="btn  btn-outline-danger ms-2" onClick={() => fetchFileManagerDocuments(fileManagerSelectedFolderId, fileManagerSearchQuery)}>
                    Retry
                  </button>
                </div>
              )}

              {/* Folders and Documents */}
              {!fileManagerLoading && !fileManagerError && (
                <>
                  {/* Folders */}
                  {fileManagerFolders.length > 0 && (
                    <div className="mb-4">
                      <h6 className="mb-3 fw-semibold" style={{ color: "#3B4A66" }}>Folders</h6>
                      <div className={fileManagerView === "grid" ? "row g-3" : ""}>
                        {fileManagerFolders.map((folder) => (
                          <div
                            key={folder.id}
                            className={fileManagerView === "grid" ? "col-md-3 col-sm-4 col-6" : "mb-2"}
                            onClick={() => setFileManagerSelectedFolderId(folder.id)}
                            style={{ cursor: "pointer" }}
                          >
                            <div className={`border rounded p-3 ${fileManagerView === "grid" ? "" : "d-flex align-items-center gap-3"}`} style={{ borderColor: "#E8F0FF", transition: "all 0.2s" }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#F9FAFB";
                                e.currentTarget.style.borderColor = "#00C0C6";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "white";
                                e.currentTarget.style.borderColor = "#E8F0FF";
                              }}
                            >
                              {/* <FaFolder style={{ color: "#F59E0B", fontSize: fileManagerView === "grid" ? "32px" : "24px" }} /> */}
                              <div className={fileManagerView === "grid" ? "mt-2" : "flex-grow-1"}>
                                <div className="fw-semibold small" style={{ color: "#3B4A66" }}>{folder.title}</div>
                                {fileManagerView === "grid" && (
                                  <div className="text-muted" style={{ fontSize: "12px" }}>
                                    {folder.document_count || 0} documents
                                    {folder.subfolder_count > 0 && ` • ${folder.subfolder_count} subfolders`}
                                  </div>
                                )}
                                {fileManagerView === "list" && (
                                  <div className="text-muted small">
                                    {folder.document_count || 0} documents
                                    {folder.subfolder_count > 0 && ` • ${folder.subfolder_count} subfolders`}
                                    {folder.description && ` • ${folder.description}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {fileManagerDocuments.length > 0 && (
                    <div>
                      <h6 className="mb-3 fw-semibold" style={{ color: "#3B4A66" }}>Documents</h6>
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Name</th>
                              <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Type</th>
                              <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Size</th>
                              <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Updated</th>

                              <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fileManagerDocuments.map((doc, index) => {
                              const meta = getDocumentMeta(doc);
                              const docStatus = getDocumentStatus(doc);
                              const updatedAt = formatDateDisplay(getDocumentUpdatedAt(doc));
                              const sizeLabel = formatFileSizeDisplay(getDocumentSizeValue(doc));
                              const typeLabel = getDocumentTypeLabel(doc);

                              return (
                                <tr
                                  key={doc.id || doc.document_id || meta.name}
                                  style={{ cursor: meta.url ? "pointer" : "default" }}
                                  onClick={() => {
                                    if (meta.url && showMenuIndex !== index) {
                                      window.open(meta.url, "_blank", "noopener,noreferrer");
                                    }
                                  }}
                                >
                                  <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>
                                    <div className="d-flex align-items-center gap-2">
                                      <FileIcon />
                                      <span>{meta.name}</span>
                                    </div>
                                  </td>
                                  <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>{typeLabel}</td>
                                  <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>{sizeLabel}</td>
                                  <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>{updatedAt}</td>

                                  <td style={{ position: 'relative', zIndex: showMenuIndex === index ? 9999 : 'auto' }} onClick={(e) => e.stopPropagation()}>
                                    <div style={{ position: 'relative', zIndex: showMenuIndex === index ? 9999 : 'auto' }} data-menu-container>
                                      <button
                                        type="button"
                                        className="btn btn-white border-0 p-2 d-flex align-items-center justify-content-center"
                                        style={{
                                          width: "32px",
                                          height: "32px",
                                          borderRadius: "50%",
                                          fontFamily: "BasisGrotesquePro",
                                          backgroundColor: showMenuIndex === index ? '#F3F4F6' : 'transparent',
                                          border: '1px solid #E5E7EB',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#F3F4F6';
                                          e.currentTarget.style.borderColor = '#D1D5DB';
                                        }}
                                        onMouseLeave={(e) => {
                                          if (showMenuIndex !== index) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.borderColor = '#E5E7EB';
                                          }
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowMenuIndex(showMenuIndex === index ? null : index);
                                        }}
                                        title="More options"
                                      >
                                        <i className="bi bi-three-dots-vertical" style={{
                                          fontSize: '18px',
                                          color: '#6B7280',
                                          fontWeight: 'bold'
                                        }} />
                                      </button>
                                      {showMenuIndex === index && (
                                        <div
                                          style={{
                                            position: 'absolute',
                                            right: 0,
                                            top: '100%',
                                            marginTop: '4px',
                                            backgroundColor: 'white',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                            zIndex: 9999,
                                            minWidth: '150px',
                                            padding: '4px 0'
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {meta.canPreview && (
                                            <button
                                              className="btn btn-white border-0 w-100 text-start px-3 py-2"
                                              style={{
                                                fontFamily: 'BasisGrotesquePro',
                                                fontSize: '14px',
                                                color: '#3B4A66',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #E5E7EB'
                                              }}
                                              onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = '#F9FAFB';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = 'white';
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setShowMenuIndex(null);
                                                if (meta.canPreview) {
                                                  openPreviewModal(doc, e.currentTarget);
                                                }
                                              }}
                                            >
                                              <i className="bi bi-eye me-2"></i>
                                              Preview
                                            </button>
                                          )}
                                          {isFile(doc) && (
                                            <button
                                              className="btn btn-white border-0 w-100 text-start px-3 py-2"
                                              style={{
                                                fontFamily: 'BasisGrotesquePro',
                                                fontSize: '14px',
                                                color: '#00C0C6',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #E5E7EB'
                                              }}
                                              onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = '#F0FDFF';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = 'white';
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setShowMenuIndex(null);
                                                handleOpenAssignModal(doc);
                                              }}
                                            >
                                              <i className="bi bi-pen me-2"></i>
                                              Assign
                                            </button>
                                          )}
                                          <button
                                            className="btn btn-white border-0 w-100 text-start px-3 py-2"
                                            style={{
                                              fontFamily: 'BasisGrotesquePro',
                                              fontSize: '14px',
                                              color: '#EF4444',
                                              cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => {
                                              e.target.style.backgroundColor = '#FEF2F2';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.target.style.backgroundColor = 'white';
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setShowMenuIndex(null);
                                              handleDeleteDocument(doc);
                                            }}
                                          >
                                            <i className="bi bi-trash me-2"></i>
                                            Delete
                                          </button>
                                        </div>
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

                  {/* Empty State */}
                  {fileManagerFolders.length === 0 && fileManagerDocuments.length === 0 && (
                    <div className="text-center py-5">
                      {/* <FaFolder style={{ fontSize: "48px", color: "#D1D5DB", marginBottom: "16px" }} /> */}
                      <p className="text-muted mb-0">
                        {fileManagerSearchQuery ? 'No documents or folders found matching your search' : 'No folders or documents in this location'}
                      </p>
                      {!fileManagerSearchQuery && (
                        <button
                          className="btn btn-primary mt-3"
                          onClick={() => setFileManagerCreatingFolder(true)}
                          style={{ backgroundColor: "#00C0C6", border: "none" }}
                        >
                          Create Your First Folder
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Client Folders Section (only show when nested under client) */}
          {isNestedUnderClient && (
            <div className="bg-white rounded-xl p-4">
              <div className="header d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h3 className="fw-semibold">Client Folders</h3>
                  <small className="text-muted">Organized document folders by client</small>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="document-card p-4 flex flex-col justify-between"
                    style={{
                      border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                      borderRadius: "12px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      // Navigate to the all documents page when any document card is clicked
                      navigate("/taxdashboard/documents/all");
                    }}
                  >
                    {/* Header row: icon left, badge right */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-orange-500"><File /></div>
                      <span className="text-xs text-white px-2 py-0.5 rounded-full" style={{ background: "var(--Palette2-Gold-800, #F49C2D)" }}>
                        Client Folder
                      </span>
                    </div>
                    <div className="font-medium text-gray-800">{doc.title}</div>
                    <div className="text-gray-500 text-xs">{doc.owner}</div>
                    {/* Footer row: documents count left, date right */}
                    <div className="flex items-center justify-between text-gray-400 text-xs mt-2">
                      <div>{doc.docsCount} documents</div>
                      <div>{doc.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render nested routes */}
          {isNestedUnderClient && (
            <div className="mt-4">
              <Outlet />
            </div>
          )}
        </>
      )
      }

      {/* Create Folder Modal */}
      <Modal
        show={fileManagerCreatingFolder}
        onHide={() => {
          setFileManagerCreatingFolder(false);
          setFileManagerNewFolderName("");
          setFileManagerNewFolderDescription("");
        }}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #F3F4F6' }}>
          <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#111827' }}>
            Create New Folder
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="mb-4">
            <label className="form-label small fw-bold mb-2" style={{ color: '#374151' }}>
              Folder Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Financial Statements 2024"
              value={fileManagerNewFolderName}
              onChange={(e) => setFileManagerNewFolderName(e.target.value)}
              disabled={fileManagerCreatingFolderLoading}
              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
              autoFocus
            />
          </div>
          <div className="mb-1">
            <label className="form-label small fw-bold mb-2" style={{ color: '#374151' }}>
              Description (Optional)
            </label>
            <textarea
              className="form-control"
              placeholder="Add a brief description..."
              value={fileManagerNewFolderDescription}
              onChange={(e) => setFileManagerNewFolderDescription(e.target.value)}
              rows="3"
              disabled={fileManagerCreatingFolderLoading}
              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', resize: 'none' }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: 'none', padding: '0 24px 24px 24px' }}>
          <button
            className="btn btn-link text-decoration-none text-muted"
            onClick={() => {
              setFileManagerCreatingFolder(false);
              setFileManagerNewFolderName("");
              setFileManagerNewFolderDescription("");
            }}
            disabled={fileManagerCreatingFolderLoading}
            style={{ fontWeight: '500' }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleFileManagerCreateFolder}
            disabled={fileManagerCreatingFolderLoading || !fileManagerNewFolderName.trim()}
            style={{
              backgroundColor: "#00C0C6",
              border: "none",
              borderRadius: "8px",
              padding: '10px 24px',
              fontWeight: '500',
              boxShadow: '0 2px 5px rgba(0, 192, 198, 0.2)'
            }}
          >
            {fileManagerCreatingFolderLoading ? (
              <div className="d-flex align-items-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Creating...</span>
              </div>
            ) : 'Create Folder'}
          </button>
        </Modal.Footer>
      </Modal>

      <Modal show={showPreview} onHide={closePreviewModal} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>{previewDoc?.name || "Document Preview"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewDoc?.url ? (
            previewDoc.extension === "pdf" ? (
              <iframe
                title={previewDoc.name}
                src={`${previewDoc.url}#toolbar=0`}
                width="100%"
                height="600px"
                style={{ border: "none" }}
              />
            ) : (
              <img
                src={previewDoc.url}
                alt={previewDoc.name}
                style={{ maxWidth: "100%", maxHeight: "80vh", display: "block", margin: "0 auto" }}
              />
            )
          ) : (
            <p className="text-muted mb-0">Unable to load document preview.</p>
          )}
        </Modal.Body>
      </Modal>

      {/* Assign Document for E-Sign Modal */}
      <Modal
        show={showAssignModal}
        onHide={() => {
          if (!assigning) {
            setShowAssignModal(false);
            setDocumentToAssign(null);
            setSelectedTaxpayerId('');
            setDeadline('');
            setHasSpouse(false);
            setPreparerMustSign(false);
            setPollingStatus(null);
          }
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #E5E7EB' }}>
          <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', color: '#3B4A66' }}>
            Assign Document for E-Sign
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontFamily: 'BasisGrotesquePro' }}>
          {documentToAssign && (
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '14px', color: '#3B4A66', fontWeight: '500' }}>
                Document <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={getDocumentName(documentToAssign)}
                disabled={true}
                style={{
                  fontFamily: 'BasisGrotesquePro',
                  backgroundColor: '#F3F4F6',
                  cursor: 'not-allowed'
                }}
              />
            </div>
          )}

          {pollingStatus && (
            <div className="mb-3 p-3" style={{
              backgroundColor: pollingStatus.status === 'completed' ? '#F0FDF4' : '#FEF3C7',
              borderRadius: '8px',
              border: `1px solid ${pollingStatus.status === 'completed' ? '#10B981' : '#F59E0B'}`
            }}>
              <div style={{ fontSize: '14px', color: '#3B4A66', fontWeight: '500' }}>
                {pollingStatus.status === 'completed' ? '✓' : '⏳'} {pollingStatus.message}
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '14px', color: '#3B4A66', fontWeight: '500' }}>
              Taxpayer/Client <span style={{ color: '#EF4444' }}>*</span>
            </label>
            {clientIdFromUrl ? (
              <input
                type="text"
                className="form-control"
                value={(() => {
                  const client = taxpayers.find(t => t.id?.toString() === clientIdFromUrl);
                  if (client) {
                    return client.full_name ||
                      `${client.first_name || ''} ${client.last_name || ''}`.trim() ||
                      client.email ||
                      `Taxpayer ${clientIdFromUrl}`;
                  }
                  return `Client ID: ${clientIdFromUrl}`;
                })()}
                disabled={true}
                style={{
                  fontFamily: 'BasisGrotesquePro',
                  backgroundColor: '#F3F4F6',
                  cursor: 'not-allowed'
                }}
              />
            ) : (
              <select
                className="form-control"
                value={selectedTaxpayerId}
                onChange={(e) => setSelectedTaxpayerId(e.target.value)}
                disabled={assigning}
                style={{ fontFamily: 'BasisGrotesquePro' }}
              >
                <option value="">Select taxpayer...</option>
                {taxpayers.map((taxpayer) => (
                  <option key={taxpayer.id} value={taxpayer.id}>
                    {taxpayer.full_name || `${taxpayer.first_name || ''} ${taxpayer.last_name || ''}`.trim() || taxpayer.email || `Taxpayer ${taxpayer.id}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '14px', color: '#3B4A66', fontWeight: '500' }}>
              Signing Deadline <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="date"
              className="form-control"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={assigning}
              min={new Date().toISOString().split('T')[0]}
              style={{ fontFamily: 'BasisGrotesquePro' }}
            />
          </div>

          {taxpayers.find(t => String(t.id) === String(selectedTaxpayerId))?.has_spouse && (
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={hasSpouse}
                  onChange={(e) => setHasSpouse(e.target.checked)}
                  disabled={assigning}
                  id="hasSpouse"
                />
                <label className="form-check-label" htmlFor="hasSpouse" style={{ fontSize: '14px', color: '#3B4A66' }}>
                  Spouse signature required
                </label>
              </div>
            </div>
          )}

          <div className="mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={preparerMustSign}
                onChange={(e) => setPreparerMustSign(e.target.checked)}
                disabled={assigning}
                id="preparerMustSign"
              />
              <label className="form-check-label" htmlFor="preparerMustSign" style={{ fontSize: '14px', color: '#3B4A66' }}>
                Preparer must also sign
              </label>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #E5E7EB' }}>
          <button
            className="btn"
            onClick={() => {
              if (!assigning) {
                setShowAssignModal(false);
                setDocumentToAssign(null);
                setSelectedTaxpayerId('');
                setDeadline('');
                setHasSpouse(false);
                setPreparerMustSign(false);
                setPollingStatus(null);
              }
            }}
            disabled={assigning}
            style={{
              fontFamily: 'BasisGrotesquePro',
              backgroundColor: '#FFFFFF',
              color: '#3B4A66',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '8px 16px'
            }}
          >
            Cancel
          </button>
          <button
            className="btn"
            onClick={handleAssignDocument}
            disabled={assigning || (!selectedTaxpayerId && !clientIdFromUrl) || !deadline}
            style={{
              fontFamily: 'BasisGrotesquePro',
              backgroundColor: assigning ? '#9CA3AF' : '#00C0C6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: assigning || !selectedTaxpayerId || !deadline ? 'not-allowed' : 'pointer'
            }}
          >
            {assigning ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Assigning...
              </>
            ) : (
              'Assign Document'
            )}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Delete Document Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteDocumentConfirm}
        onClose={() => {
          if (!deletingDocumentId) {
            setShowDeleteDocumentConfirm(false);
            setDocumentToDelete(null);
          }
        }}
        onConfirm={confirmDeleteDocument}
        title="Delete Document"
        message={documentToDelete ? `Are you sure you want to delete "${getDocumentName(documentToDelete)}"? This action cannot be undone.` : "Are you sure you want to delete this document? This action cannot be undone."}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
        isLoading={!!deletingDocumentId}
      />
    </div >
  );
}
