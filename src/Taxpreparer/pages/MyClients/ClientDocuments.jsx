import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaSearch, FaFilter, FaFolder } from "react-icons/fa";
import { FileIcon, File } from "../../component/icons";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";

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
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('processed') || statusLower.includes('completed')) {
      return 'bg-darkgreen text-white';
    } else if (statusLower.includes('signature') || statusLower.includes('waiting')) {
      return 'bg-darkblue text-white';
    } else if (statusLower.includes('review')) {
      return 'bg-darkbroun text-white';
    } else if (statusLower.includes('clarification')) {
      return 'bg-darkcolour text-white';
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

        {/* Search and Filter */}
        <div className="d-flex align-items-center gap-2 mb-4">
          <div className="position-relative search-box flex-grow-1">
            <FaSearch className="search-icon" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }} />
            <input
              type="text"
              className="form-control ps-5"
              placeholder="Search folders and documents..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{
                border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              }}
            />
          </div>
          <button className="btn d-flex align-items-center gap-2 rounded" style={{ backgroundColor: "white", border: "1px solid #E8F0FF" }}>
            <FaFilter />
            Filter
          </button>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm"
              onClick={() => setView("grid")}
              style={{
                backgroundColor: view === "grid" ? "#00C0C6" : "white",
                color: view === "grid" ? "white" : "#3B4A66",
                border: "1px solid #E8F0FF"
              }}
            >
              <i className="bi bi-grid-3x3-gap"></i>
            </button>
            <button
              className="btn btn-sm"
              onClick={() => setView("list")}
              style={{
                backgroundColor: view === "list" ? "#00C0C6" : "white",
                color: view === "list" ? "white" : "#3B4A66",
                border: "1px solid #E8F0FF"
              }}
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
        </div>

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
            <h6 className="mb-3" style={{ fontFamily: "BasisGrotesquePro", fontSize: "16px", fontWeight: "500" }}>
              Folders ({folders.length})
            </h6>
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
                        <div className="mb-3" style={{ fontSize: "48px", color: "#F49C2D" }}>
                          <i className="bi bi-folder-fill"></i>
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
                      <div style={{ fontSize: "40px", color: "#F49C2D" }}>
                        <i className="bi bi-folder-fill"></i>
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
            <div className="row g-3">
              {documents.map((doc, index) => {
                const docName = doc.file_name || doc.name || doc.document_name || doc.filename || 'Untitled Document';
                const docSize = doc.file_size_bytes || doc.file_size || doc.size || '0';
                const docType = doc.file_type || doc.file_extension?.toUpperCase() || doc.type || doc.document_type || 'PDF';
                const docDate = doc.updated_at || doc.updated_at_formatted || doc.created_at || doc.created_at_formatted || doc.date || doc.uploaded_at;
                const docStatus = doc.status || doc.status_display || 'Pending';
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
                        <div className="d-flex align-items-center gap-2 mt-2 mt-md-0" style={{ flexShrink: 0 }}>
                          <span
                            className={`badge ${getStatusBadgeClass(docStatus)} px-3 py-2`}
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
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
