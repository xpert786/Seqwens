import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaSearch, FaFilter, FaFolder, FaDownload, FaEdit, FaTrash, FaEllipsisV } from "react-icons/fa";
import { FileIcon, File } from "../../component/icons";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
import { Modal } from "react-bootstrap";

export default function ClientDocuments() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [view, setView] = useState("grid");
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [parentFolder, setParentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [statistics, setStatistics] = useState({
    total_folders: 0,
    total_documents: 0,
    archived_documents: 0
  });
  const [clientInfo, setClientInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToRename, setDocumentToRename] = useState(null);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch folders and documents from API
  const fetchDocuments = async (folderId = null, search = "") => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      // Build query parameters
      const params = new URLSearchParams();
      if (folderId) {
        params.append('folder_id', folderId);
      }
      if (search) {
        params.append('search', search);
      }

      const queryString = params.toString();
      const url = `${API_BASE_URL}/taxpayer/tax-preparer/clients/${clientId}/documents/browse/${queryString ? `?${queryString}` : ''}`;

      console.log('Fetching client documents from:', url);

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Client documents API response:', result);

      if (result.success && result.data) {
        // Set client info
        if (result.data.client) {
          setClientInfo(result.data.client);
        }

        // Update current folder
        if (result.data.current_folder) {
          setCurrentFolder(result.data.current_folder);
        } else {
          setCurrentFolder(null);
        }

        // Update parent folder
        if (result.data.parent_folder) {
          setParentFolder(result.data.parent_folder);
        } else {
          setParentFolder(null);
        }

        // Update breadcrumbs
        if (result.data.breadcrumbs && Array.isArray(result.data.breadcrumbs)) {
          setBreadcrumbs(result.data.breadcrumbs);
        } else {
          setBreadcrumbs([]);
        }

        // Set folders
        const foldersList = result.data.folders || [];
        setFolders(foldersList);

        // Set documents
        const docs = result.data.documents || [];
        setDocuments(docs);

        // Set statistics
        if (result.data.statistics) {
          setStatistics(result.data.statistics);
        }
      } else {
        throw new Error(result.message || 'Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching client documents:', error);
      setError(handleAPIError(error));
      setFolders([]);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents on component mount and when folder/search changes
  useEffect(() => {
    if (clientId) {
      fetchDocuments(selectedFolderId, searchQuery);
    }
  }, [clientId, selectedFolderId, searchQuery]);

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (typeof bytes === 'string') {
      if (bytes.includes('MB') || bytes.includes('KB')) return bytes;
      bytes = parseInt(bytes);
    }
    if (isNaN(bytes)) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    if (!status) return 'bg-secondary text-white';
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('processed') || statusLower.includes('completed') || statusLower.includes('active')) {
      return 'bg-darkgreen text-white';
    } else if (statusLower.includes('signature') || statusLower.includes('pending sign') || statusLower.includes('waiting')) {
      return 'bg-darkblue text-white';
    } else if (statusLower.includes('review')) {
      return 'bg-darkbroun text-white';
    } else if (statusLower.includes('clarification')) {
      return 'bg-darkcolour text-white';
    } else if (statusLower.includes('pending')) {
      return 'bg-darkblue text-white';
    }
    return 'bg-darkblue text-white';
  };

  // Handle folder click
  const handleFolderClick = (folder) => {
    setSelectedFolderId(folder.id);
  };

  // Handle breadcrumb click
  const handleBreadcrumbClick = (breadcrumb) => {
    if (breadcrumb.id) {
      setSelectedFolderId(breadcrumb.id);
    } else {
      setSelectedFolderId(null); // Go to root
    }
  };

  // Handle back to root
  const handleBackToRoot = () => {
    setSelectedFolderId(null);
  };

  // Handle search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

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

  const handleDownload = (doc) => {
    const fileUrl = doc.file_url || doc.tax_documents || '';
    if (!fileUrl) {
      toast.error("Download link unavailable for this document.", { position: "top-right", autoClose: 3000 });
      return;
    }
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = doc.file_name || doc.name || doc.document_name || 'document';
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRename = (doc) => {
    setDocumentToRename(doc);
    setNewDocumentName(doc.file_name || doc.name || doc.document_name || '');
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
      const url = `${API_BASE_URL}/taxpayer/tax-preparer/clients/${clientId}/documents/${documentId}/`;

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
      const url = `${API_BASE_URL}/taxpayer/tax-preparer/clients/${clientId}/documents/${documentId}/`;

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

  if (loading) {
    return (
      <div className="mt-6">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6">
        <div className="alert alert-danger" role="alert">
          <strong>Error:</strong> {error}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => fetchDocuments(selectedFolderId, searchQuery)}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="bg-white rounded-xl p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>
              {clientInfo?.name ? `${clientInfo.name}'s Documents` : 'Client Documents'}
            </h3>
            <p className="text-sm text-gray-500">
              {currentFolder ? `Browsing: ${currentFolder.title}` : 'Organized document folders'}
            </p>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {(breadcrumbs.length > 0 || currentFolder) && (
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 flex-wrap" style={{ backgroundColor: "#f8f9fa", padding: "12px 16px", borderRadius: "8px" }}>
              <button
                className="btn btn-sm text-primary p-0 border-0 bg-transparent"
                onClick={handleBackToRoot}
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
                    onClick={() => handleBreadcrumbClick(breadcrumb)}
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



        {/* Statistics */}
        {statistics && (
          <div className="d-flex gap-3 mb-4">
            <div className="bg-light rounded p-2">

              <small className="text-muted">Folders: {statistics.total_folders}</small>
            </div>
            <div className="bg-light rounded p-2">
              <small className="text-muted">Documents: {statistics.total_documents}</small>
            </div>
            {statistics.archived_documents > 0 && (
              <div className="bg-light rounded p-2">
                <small className="text-muted">Archived: {statistics.archived_documents}</small>
              </div>
            )}
          </div>
        )}

        {/* Folders */}
        {folders.length > 0 && (
          <div className="mb-4">
            {/* <h6 className="mb-3" style={{ fontFamily: "BasisGrotesquePro", fontSize: "16px", fontWeight: "500" }}>
              Folders ({folders.length})
            </h6> */}
            <div className={view === "grid" ? "row g-3" : "d-flex flex-column gap-2"}>
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className={view === "grid" ? "col-md-3 col-sm-6" : "col-12"}
                  onClick={() => handleFolderClick(folder)}
                  style={{ cursor: "pointer" }}
                >
                  {view === "grid" ? (

                    <div
                      className="border rounded p-3 bg-white"
                      style={{
                        borderRadius: "12px",
                        transition: "all 0.2s ease",
                        height: "100%",
                        minHeight: "140px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#F9FAFB";
                        e.currentTarget.style.borderColor = "#00C0C6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#FFFFFF";
                        e.currentTarget.style.borderColor = "#E8F0FF";
                      }}
                    >
                      <div className="d-flex flex-column align-items-center text-center">
                        <div className="mb-3" style={{ fontSize: "48px", color: "#F49C2D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="48" height="48" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.334 13.3333C13.6876 13.3333 14.0267 13.1929 14.2768 12.9428C14.5268 12.6928 14.6673 12.3536 14.6673 12V5.33333C14.6673 4.97971 14.5268 4.64057 14.2768 4.39052C14.0267 4.14048 13.6876 4 13.334 4H8.06732C7.84433 4.00219 7.62435 3.94841 7.42752 3.84359C7.23069 3.73877 7.06329 3.58625 6.94065 3.4L6.40065 2.6C6.27924 2.41565 6.11397 2.26432 5.91965 2.1596C5.72533 2.05488 5.50806 2.00004 5.28732 2H2.66732C2.3137 2 1.97456 2.14048 1.72451 2.39052C1.47446 2.64057 1.33398 2.97971 1.33398 3.33333V12C1.33398 12.3536 1.47446 12.6928 1.72451 12.9428C1.97456 13.1929 2.3137 13.3333 2.66732 13.3333H13.334Z" stroke="#F49C2D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="fw-medium mb-1 text-truncate w-100" style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", color: "#3B4A66" }}>
                          {folder.title}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                        <small className="text-muted" style={{ fontFamily: "BasisGrotesquePro", fontSize: "11px" }}>
                          {folder.files_count || folder.document_count || 0} {folder.files_count === 1 || folder.document_count === 1 ? 'file' : 'files'}
                        </small>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="border rounded p-3 bg-white d-flex align-items-center gap-3"
                      style={{ borderRadius: "12px", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#F9FAFB";
                        e.currentTarget.style.borderColor = "#00C0C6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#FFFFFF";
                        e.currentTarget.style.borderColor = "#E8F0FF";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.334 13.3333C13.6876 13.3333 14.0267 13.1929 14.2768 12.9428C14.5268 12.6928 14.6673 12.3536 14.6673 12V5.33333C14.6673 4.97971 14.5268 4.64057 14.2768 4.39052C14.0267 4.14048 13.6876 4 13.334 4H8.06732C7.84433 4.00219 7.62435 3.94841 7.42752 3.84359C7.23069 3.73877 7.06329 3.58625 6.94065 3.4L6.40065 2.6C6.27924 2.41565 6.11397 2.26432 5.91965 2.1596C5.72533 2.05488 5.50806 2.00004 5.28732 2H2.66732C2.3137 2 1.97456 2.14048 1.72451 2.39052C1.47446 2.64057 1.33398 2.97971 1.33398 3.33333V12C1.33398 12.3536 1.47446 12.6928 1.72451 12.9428C1.97456 13.1929 2.3137 13.3333 2.66732 13.3333H13.334Z" stroke="#F49C2D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-medium mb-1" style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", color: "#3B4A66" }}>
                          {folder.title}
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <small className="text-muted" style={{ fontFamily: "BasisGrotesquePro", fontSize: "12px" }}>
                          {folder.files_count || folder.document_count || 0} {folder.files_count === 1 || folder.document_count === 1 ? 'file' : 'files'}
                        </small>
                        <i className="bi bi-chevron-right text-muted"></i>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <div>
            <h6 className="mb-3" style={{ fontFamily: "BasisGrotesquePro", fontSize: "16px", fontWeight: "500" }}>
              Documents ({documents.length})
            </h6>
            {view === "list" ? (
              // Table view for list mode
              <div className="table-responsive">
                <table className="table table-hover" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "2px solid #E5E7EB" }}>
                      <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#6B7280", padding: "12px" }}>Name</th>
                      <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#6B7280", padding: "12px" }}>Type</th>
                      <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#6B7280", padding: "12px" }}>Size</th>
                      <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#6B7280", padding: "12px" }}>Updated</th>
                      <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#6B7280", padding: "12px" }}>Status</th>
                      <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#6B7280", padding: "12px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc, index) => {
                      // Use file_name first, then fallback options - ensure we don't show "Untitled" if data exists
                      const docName = doc.file_name || doc.name || doc.document_name || doc.filename || doc.title || 'Untitled Document';
                      // Use file_size_bytes for accurate size calculation
                      const docSize = doc.file_size_bytes || (doc.file_size && typeof doc.file_size === 'number' ? doc.file_size * 1024 * 1024 : doc.file_size) || doc.size || '0';
                      // Use file_type or file_extension
                      const docType = doc.file_type || (doc.file_extension ? doc.file_extension.toUpperCase() : null) || doc.type || doc.document_type || 'PDF';
                      // Use updated_at_formatted first, then updated_at, then created_at_formatted, then created_at
                      const docDate = doc.updated_at_formatted || doc.updated_at || doc.created_at_formatted || doc.created_at || doc.date || doc.uploaded_at;
                      // Use status_display first as per API response, then status
                      const docStatus = doc.status_display || doc.status || 'Pending';
                      const fileUrl = doc.file_url || doc.tax_documents || '';

                      return (
                        <tr
                          key={doc.id || doc.document_id || index}
                          style={{ cursor: "pointer", borderBottom: "1px solid #E5E7EB" }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9FAFB"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          onClick={() => {
                            if (fileUrl) {
                              window.open(fileUrl, '_blank');
                            }
                          }}
                        >
                          <td style={{ padding: "12px", fontFamily: "BasisGrotesquePro", fontSize: "14px", color: "#3B4A66" }}>
                            <div className="d-flex align-items-center gap-2">
                              <FileIcon />
                              <span className="fw-medium">{docName}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px", fontFamily: "BasisGrotesquePro", fontSize: "14px", color: "#6B7280" }}>{docType}</td>
                          <td style={{ padding: "12px", fontFamily: "BasisGrotesquePro", fontSize: "14px", color: "#6B7280" }}>{formatFileSize(docSize)}</td>
                          <td style={{ padding: "12px", fontFamily: "BasisGrotesquePro", fontSize: "14px", color: "#6B7280" }}>{formatDate(docDate)}</td>
                          <td style={{ padding: "12px" }}>
                            <span
                              className={`badge ${getStatusBadgeClass(docStatus)} px-3 py-1`}
                              style={{
                                borderRadius: "20px",
                                fontSize: "0.75rem",
                                fontWeight: "500",
                                fontFamily: "BasisGrotesquePro",
                                color: "#FFFFFF"
                              }}
                            >
                              {docStatus}
                            </span>
                          </td>
                          <td style={{ padding: "12px" }} onClick={(e) => e.stopPropagation()}>
                            <div className="d-flex gap-2 align-items-center">
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(doc);
                                }}
                                title="Download"
                              >
                                <FaDownload />
                              </button>
                              <div className="position-relative">
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
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
            ) : (
              // Card/Grid view
              <div className="row g-3">
                {documents.map((doc, index) => {
                  // Use file_name first, then fallback options - ensure we don't show "Untitled" if data exists
                  const docName = doc.file_name || doc.name || doc.document_name || doc.filename || doc.title || 'Untitled Document';
                  // Use file_size_bytes for accurate size calculation
                  const docSize = doc.file_size_bytes || (doc.file_size && typeof doc.file_size === 'number' ? doc.file_size * 1024 * 1024 : doc.file_size) || doc.size || '0';
                  // Use file_type or file_extension
                  const docType = doc.file_type || (doc.file_extension ? doc.file_extension.toUpperCase() : null) || doc.type || doc.document_type || 'PDF';
                  // Use updated_at_formatted first, then updated_at, then created_at_formatted, then created_at
                  const docDate = doc.updated_at_formatted || doc.updated_at || doc.created_at_formatted || doc.created_at || doc.date || doc.uploaded_at;
                  // Use status_display first as per API response, then status
                  const docStatus = doc.status_display || doc.status || 'Pending';
                  const fileUrl = doc.file_url || doc.tax_documents || '';

                  return (
                    <div className="col-12" key={doc.id || doc.document_id || index}>
                      <div
                        className="p-3 border rounded-4"
                        style={{
                          backgroundColor: "#FFFFFF",
                          cursor: "pointer",
                          transition: "background-color 0.3s ease",
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start flex-wrap">
                          <div className="d-flex gap-3 align-items-start" style={{ flex: 1, minWidth: 0 }}>
                            <div className="d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, flexShrink: 0 }}>
                              <span className="mydocs-icon-wrapper">
                                <FileIcon />
                              </span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="fw-medium mb-1" style={{ fontFamily: "BasisGrotesquePro", fontSize: "15px", color: "#3B4A66" }}>
                                {docName}
                              </div>
                              <div className="text-muted" style={{ fontSize: "13px", fontFamily: "BasisGrotesquePro", color: "#6B7280", fontWeight: "400" }}>
                                Type: {docType} • Size: {formatFileSize(docSize)} • Updated: {formatDate(docDate)}
                              </div>
                            </div>
                          </div>
                          <div className="d-flex gap-2 align-items-center">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(doc);
                              }}
                              title="Download"
                            >
                              <FaDownload />
                            </button>
                            <div className="position-relative">
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
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
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
            <p>Are you sure you want to delete "{documentToDelete ? (documentToDelete.file_name || documentToDelete.name || documentToDelete.document_name || 'this document') : ''}"? This action cannot be undone.</p>
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

        {/* Empty State */}
        {folders.length === 0 && documents.length === 0 && !loading && (
          <div className="text-center py-5">
            <h6 className="mb-2" style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>
              {currentFolder ? 'This folder is empty' : 'No Folders or Documents'}
            </h6>
            <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>
              {currentFolder
                ? 'This folder doesn\'t contain any documents or subfolders yet.'
                : 'No folders or documents found for this client.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
