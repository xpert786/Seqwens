import React, { useState, useEffect, useRef } from "react";
import { FileIcon, UpIcon } from "../../component/icons";
import { FaFolder, FaSearch, FaDownload, FaEye, FaUpload, FaEdit, FaTrash, FaEllipsisV } from "react-icons/fa";
import TaxUploadModal from "../../upload/TaxUploadModal";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
import { Modal } from "react-bootstrap";

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

export default function DocumentManager() {
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewTriggerRef = useRef(null);

  // Document Manager State
  const [view, setView] = useState("grid");
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [parentFolder, setParentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [statistics, setStatistics] = useState({
    total_folders: 0,
    total_documents: 0,
    archived_documents: 0
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [creatingFolderLoading, setCreatingFolderLoading] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToRename, setDocumentToRename] = useState(null);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch documents and folders
  const fetchDocuments = async (folderId = null, search = "") => {
    try {
      setLoading(true);
      setError(null);

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
      if (showArchived) {
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
          setCurrentFolder(result.data.current_folder);
        } else {
          setCurrentFolder(null);
        }
        if (result.data.parent_folder) {
          setParentFolder(result.data.parent_folder);
        } else {
          setParentFolder(null);
        }
        if (result.data.breadcrumbs && Array.isArray(result.data.breadcrumbs)) {
          setBreadcrumbs(result.data.breadcrumbs);
        } else {
          setBreadcrumbs([]);
        }
        const foldersList = result.data.folders || [];
        setFolders(foldersList);
        const docs = result.data.documents || [];
        setDocuments(docs);
        if (result.data.statistics) {
          setStatistics(result.data.statistics);
        }
      } else {
        throw new Error(result.message || 'Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(handleAPIError(error));
      setFolders([]);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents on component mount and when folder/search changes
  useEffect(() => {
    fetchDocuments(selectedFolderId, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolderId, searchQuery, showArchived]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuIndex !== null && !event.target.closest('.position-relative')) {
        setOpenMenuIndex(null);
      }
    };

    if (openMenuIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuIndex]);

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name', { position: "top-right", autoClose: 3000 });
      return;
    }

    setCreatingFolderLoading(true);

    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const folderData = {
        title: newFolderName.trim(),
        description: newFolderDescription.trim() || ''
      };

      if (selectedFolderId) {
        folderData.parent_id = selectedFolderId;
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
        setNewFolderName("");
        setNewFolderDescription("");
        setCreatingFolder(false);
        // Refresh the documents
        fetchDocuments(selectedFolderId, searchQuery);
      } else {
        throw new Error(result.message || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error(handleAPIError(error), { position: "top-right", autoClose: 3000 });
    } finally {
      setCreatingFolderLoading(false);
    }
  };

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

  const handleRename = (doc) => {
    setDocumentToRename(doc);
    setNewDocumentName(getDocumentName(doc));
    setShowRenameModal(true);
    setOpenMenuIndex(null);
  };

  const handleDelete = (doc) => {
    setDocumentToDelete(doc);
    setShowDeleteModal(true);
    setOpenMenuIndex(null);
  };

  const confirmRename = async () => {
    if (!documentToRename || !newDocumentName.trim()) {
      toast.error("Please enter a valid document name", { position: "top-right", autoClose: 3000 });
      return;
    }

    setRenaming(true);
    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const documentId = documentToRename.id || documentToRename.document_id;
      const url = `${API_BASE_URL}/firm/staff/documents/${documentId}/`;

      const config = {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_name: newDocumentName.trim() })
      };

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Document renamed successfully!', { position: "top-right", autoClose: 3000 });
        setShowRenameModal(false);
        setDocumentToRename(null);
        setNewDocumentName("");
        fetchDocuments(selectedFolderId, searchQuery);
      } else {
        throw new Error(result.message || 'Failed to rename document');
      }
    } catch (error) {
      console.error('Error renaming document:', error);
      toast.error(handleAPIError(error), { position: "top-right", autoClose: 3000 });
    } finally {
      setRenaming(false);
    }
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    setDeleting(true);
    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const documentId = documentToDelete.id || documentToDelete.document_id;
      const url = `${API_BASE_URL}/firm/staff/documents/${documentId}/`;

      const config = {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      };

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      toast.success('Document deleted successfully!', { position: "top-right", autoClose: 3000 });
      setShowDeleteModal(false);
      setDocumentToDelete(null);
      fetchDocuments(selectedFolderId, searchQuery);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(handleAPIError(error), { position: "top-right", autoClose: 3000 });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="lg:p-4 md:p-2 px-1">
      {/* Upload Modal */}
      <TaxUploadModal
        show={showUpload}
        handleClose={() => setShowUpload(false)}
        onUploadSuccess={() => fetchDocuments(selectedFolderId, searchQuery)}
      />

      {/* Header */}
      <div className="header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-semibold">Document Manager</h3>
          <small className="text-muted">Manage documents shared with you by Firm Admin</small>
        </div>
        <button
          className="btn dashboard-btn btn-upload d-flex align-items-center gap-2"
          onClick={() => setShowUpload(true)}
        >
          <UpIcon />
          Upload Documents
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 mb-3">
        <div className="col-md-3 col-sm-12">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div className="stat-icon" style={{ color: "#00bcd4" }}>
                <FaFolder />
              </div>
              <div className="stat-count">{statistics.total_folders || 0}</div>
            </div>
            <div className="mt-2">
              <p className="mb-0 text-muted small fw-semibold">Total Folders</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-12">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div className="stat-icon" style={{ color: "#4caf50" }}>
                <FileIcon />
              </div>
              <div className="stat-count">{statistics.total_documents || 0}</div>
            </div>
            <div className="mt-2">
              <p className="mb-0 text-muted small fw-semibold">Total Documents</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-12">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div className="stat-icon" style={{ color: "#3f51b5" }}>
                <FileIcon />
              </div>
              <div className="stat-count">{documents.length}</div>
            </div>
            <div className="mt-2">
              <p className="mb-0 text-muted small fw-semibold">Current View</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-12">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div className="stat-icon" style={{ color: "#EF4444" }}>
                <FileIcon />
              </div>
              <div className="stat-count">{statistics.archived_documents || 0}</div>
            </div>
            <div className="mt-2">
              <p className="mb-0 text-muted small fw-semibold">Archived</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl p-6">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>
              Shared Documents
            </h3>
            <p className="text-sm text-gray-500 mb-0">
              {currentFolder ? `Browsing: ${currentFolder.title}` : 'Documents shared by Firm Admin'}
            </p>
          </div>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => setCreatingFolder(true)}
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
        {(breadcrumbs.length > 0 || currentFolder) && (
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 flex-wrap" style={{ backgroundColor: "#f8f9fa", padding: "12px 16px", borderRadius: "8px" }}>
              <button
                className="btn btn-sm text-primary p-0 border-0 bg-transparent"
                onClick={() => setSelectedFolderId(null)}
                style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}
              >
                <i className="bi bi-house me-1"></i>
                Root
              </button>
              {breadcrumbs.map((breadcrumb, idx) => (
                <React.Fragment key={idx}>
                  <span style={{ color: "#6B7280", fontFamily: "BasisGrotesquePro" }}>/</span>
                  <button
                    className="btn btn-sm text-primary p-0 border-0 bg-transparent"
                    onClick={() => setSelectedFolderId(breadcrumb.id)}
                    style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}
                  >
                    {breadcrumb.title}
                  </button>
                </React.Fragment>
              ))}
              {currentFolder && (
                <>
                  <span style={{ color: "#6B7280", fontFamily: "BasisGrotesquePro" }}>/</span>
                  <span style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500" }}>
                    {currentFolder.title}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Create Folder Modal */}
        {creatingFolder && (
          <div className="mb-4 p-3 border rounded" style={{ backgroundColor: "#f8f9fa" }}>
            <div className="mb-2">
              <label className="form-label small fw-semibold text-black">Folder Name <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control form-control-sm text-black"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                disabled={creatingFolderLoading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-black">Description (Optional)</label>
              <textarea
                className="form-control form-control-sm"
                placeholder="Enter folder description"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                rows="2"
                disabled={creatingFolderLoading}
              />
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-primary"
                onClick={handleCreateFolder}
                disabled={creatingFolderLoading || !newFolderName.trim()}
                style={{ backgroundColor: "#00C0C6", border: "none" }}
              >
                {creatingFolderLoading ? 'Creating...' : 'Create'}
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setCreatingFolder(false);
                  setNewFolderName("");
                  setNewFolderDescription("");
                }}
                disabled={creatingFolderLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="d-flex align-items-center gap-2 mb-4" style={{ flexWrap: 'nowrap', alignItems: 'center' }}>
          <div className="position-relative" style={{ width: '260px', flexShrink: 0 }}>
            <input
              type="text"
              className="form-control rounded"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <FaSearch
              style={{
                position: 'absolute',
                left: '14px',
                top: '12px',
                zIndex: 10,
                pointerEvents: 'none',
                color: '#6B7280'
              }}
            />
          </div>
          <div className="form-check ms-auto">
            <input
              className="form-check-input"
              type="checkbox"
              id="showArchived"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="showArchived" style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>
              Show Archived
            </label>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading documents...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="alert alert-danger" role="alert">
            <strong>Error:</strong> {error}
            <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => fetchDocuments(selectedFolderId, searchQuery)}>
              Retry
            </button>
          </div>
        )}

        {/* Folders and Documents */}
        {!loading && !error && (
          <>
            {/* Folders */}
            {folders.length > 0 && (
              <div className="mb-4">
                <h6 className="mb-3 fw-semibold" style={{ color: "#3B4A66" }}>Folders</h6>
                <div className={view === "grid" ? "row g-3" : ""}>
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className={view === "grid" ? "col-md-3 col-sm-4 col-6" : "mb-2"}
                      onClick={() => setSelectedFolderId(folder.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className={`border rounded p-3 ${view === "grid" ? "" : "d-flex align-items-center gap-3"}`}
                        style={{ borderColor: "#E8F0FF", transition: "all 0.2s" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#F9FAFB";
                          e.currentTarget.style.borderColor = "#00C0C6";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "white";
                          e.currentTarget.style.borderColor = "#E8F0FF";
                        }}
                      >
                        <FaFolder style={{ color: "#F59E0B", fontSize: view === "grid" ? "32px" : "24px" }} />
                        <div className={view === "grid" ? "mt-2" : "flex-grow-1"}>
                          <div className="fw-semibold small" style={{ color: "#3B4A66" }}>{folder.title}</div>
                          {view === "grid" && (
                            <div className="text-muted" style={{ fontSize: "12px" }}>
                              {folder.document_count || 0} documents
                              {folder.subfolder_count > 0 && ` • ${folder.subfolder_count} subfolders`}
                            </div>
                          )}
                          {view === "list" && (
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
            {documents.length > 0 && (
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
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Status</th>
                        <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => {
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
                              if (meta.url) {
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
                            <td>
                              <span
                                className={`badge ${getStatusBadgeClass(docStatus)} px-2 py-1`}
                                style={{ borderRadius: "12px", fontSize: "12px" }}
                              >
                                {docStatus}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-2 flex-wrap align-items-center">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  disabled={!meta.canPreview}
                                  title={meta.canPreview ? "Preview" : "Preview not available for this file type"}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (meta.canPreview) {
                                      openPreviewModal(doc, event.currentTarget);
                                    }
                                  }}
                                >
                                  <FaEye className="me-1" />
                                  Preview
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  disabled={!meta.url}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDownload(doc);
                                  }}
                                >
                                  <FaDownload className="me-1" />
                                  Download
                                </button>
                                <div className="position-relative">
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setOpenMenuIndex(openMenuIndex === doc.id ? null : doc.id);
                                    }}
                                    title="More options"
                                  >
                                    <FaEllipsisV />
                                  </button>
                                  {openMenuIndex === doc.id && (
                                    <div
                                      className="position-absolute bg-white border rounded shadow-lg"
                                      style={{
                                        right: 0,
                                        top: '100%',
                                        zIndex: 1000,
                                        minWidth: '150px',
                                        marginTop: '4px'
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        className="btn btn-sm w-100 text-start d-flex align-items-center gap-2"
                                        style={{ border: 'none', borderRadius: 0 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRename(doc);
                                        }}
                                      >
                                        <FaEdit /> Rename
                                      </button>
                                      <button
                                        className="btn btn-sm w-100 text-start d-flex align-items-center gap-2 text-danger"
                                        style={{ border: 'none', borderRadius: 0 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(doc);
                                        }}
                                      >
                                        <FaTrash /> Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
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
            {folders.length === 0 && documents.length === 0 && (
              <div className="text-center py-5">
                <FaFolder style={{ fontSize: "48px", color: "#D1D5DB", marginBottom: "16px" }} />
                <p className="text-muted mb-0">
                  {searchQuery ? 'No documents or folders found matching your search' : 'No folders or documents in this location'}
                </p>
                {!searchQuery && (
                  <button
                    className="btn btn-primary mt-3"
                    onClick={() => setCreatingFolder(true)}
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

      {/* Preview Modal */}
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

      {/* Rename Modal */}
      <Modal show={showRenameModal} onHide={() => {
        setShowRenameModal(false);
        setDocumentToRename(null);
        setNewDocumentName("");
      }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Rename Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Document Name</label>
            <input
              type="text"
              className="form-control"
              value={newDocumentName}
              onChange={(e) => setNewDocumentName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  confirmRename();
                }
              }}
              autoFocus
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowRenameModal(false);
              setDocumentToRename(null);
              setNewDocumentName("");
            }}
            disabled={renaming}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={confirmRename}
            disabled={renaming || !newDocumentName.trim()}
            style={{ backgroundColor: "#00C0C6", border: "none" }}
          >
            {renaming ? 'Renaming...' : 'Rename'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => {
        setShowDeleteModal(false);
        setDocumentToDelete(null);
      }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete "{documentToDelete ? getDocumentName(documentToDelete) : ''}"? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setDocumentToDelete(null);
            }}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

