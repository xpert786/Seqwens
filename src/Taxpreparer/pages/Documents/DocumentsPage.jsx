import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { File, UpIcon, Doc, FaildIcon, FiltIcon, CompletedIcon, AwaitingIcon, Received, Uploaded, FileIcon } from "../../component/icons";
import { FaFolder } from "react-icons/fa";
import TaxUploadModal from "../../upload/TaxUploadModal";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
export default function DocumentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isNestedUnderClient = location.pathname.includes("/taxdashboard/client/");
  const [showUpload, setShowUpload] = useState(false);
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

  const cardData = [
    { label: "Total Clients", icon: <Doc />, count: clients.length, color: "#00bcd4" },
    { label: "Pending", icon: <AwaitingIcon />, count: clients.filter(c => c.statuses.includes("Active")).length, color: "#4caf50" },
    { label: "Reviewed", icon: <Received />, count: clients.filter(c => c.statuses.includes("Pending")).length, color: "#3f51b5" },
    { label: "Needs Revision", icon: <FaildIcon />, count: clients.filter(c => c.statuses.includes("High Priority")).length, color: "#EF4444" },
    { label: "My Uploads", icon: <Uploaded />, count: clients.filter(c => c.statuses.includes("My Uploads")).length, color: "#EF4444" },
  ];

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

  const wrapperClass = isNestedUnderClient ? "mt-6" : "p-4";

  return (
    <div className={wrapperClass}>
      {/* Upload Modal */}
      <TaxUploadModal show={showUpload} handleClose={() => setShowUpload(false)} />
      {/* Header (hide when nested under client) */}
      {!isNestedUnderClient && (
        <div className="header d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-semibold">Documents</h3>
            <small className="text-muted">Manage client documents and files</small>
          </div>
          <button
            className="btn dashboard-btn btn-upload d-flex align-items-center gap-2"
            onClick={() => setShowUpload(true)}
          >
            <UpIcon />
            Upload Documents
          </button>
        </div>
      )}

      {/* Stats (hide when nested under client) */}
      {!isNestedUnderClient && (
        <div className="row g-3 mb-3">
          {cardData.map((item, index) => (
            <div className="col-md-3 col-sm-6" key={index}>
              <div className="stat-card ">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="stat-icon" style={{ color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="stat-count">{item.count}</div>
                </div>
                <div className="mt-2">
                  <p className="mb-0 text-muted small fw-semibold">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}



      {/* File Manager Section (only show when not nested under client) */}
      {!isNestedUnderClient && (
        <div className="bg-white rounded-xl p-6">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
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
              <div className="d-flex align-items-center gap-2 flex-wrap" style={{ backgroundColor: "#f8f9fa", padding: "12px 16px", borderRadius: "8px" }}>
                <button
                  className="btn btn-sm text-primary p-0 border-0 bg-transparent"
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
                      className="btn btn-sm text-primary p-0 border-0 bg-transparent"
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

          {/* Create Folder Modal */}
          {fileManagerCreatingFolder && (
            <div className="mb-4 p-3 border rounded" style={{ backgroundColor: "#f8f9fa" }}>
              <div className="mb-2">
                <label className="form-label small fw-semibold text-black ">Folder Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control form-control-sm text-black"
                  placeholder="Enter folder name"
                  value={fileManagerNewFolderName}
                  onChange={(e) => setFileManagerNewFolderName(e.target.value)}
                  disabled={fileManagerCreatingFolderLoading}
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-black">Description (Optional)</label>
                <textarea
                  className="form-control form-control-sm"
                  placeholder="Enter folder description"
                  value={fileManagerNewFolderDescription}
                  onChange={(e) => setFileManagerNewFolderDescription(e.target.value)}
                  rows="2"
                  disabled={fileManagerCreatingFolderLoading}
                />
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleFileManagerCreateFolder}
                  disabled={fileManagerCreatingFolderLoading || !fileManagerNewFolderName.trim()}
                  style={{ backgroundColor: "#00C0C6", border: "none" }}
                >
                  {fileManagerCreatingFolderLoading ? 'Creating...' : 'Create'}
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setFileManagerCreatingFolder(false);
                    setFileManagerNewFolderName("");
                    setFileManagerNewFolderDescription("");
                  }}
                  disabled={fileManagerCreatingFolderLoading}
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
              <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => fetchFileManagerDocuments(fileManagerSelectedFolderId, fileManagerSearchQuery)}>
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
                          <th style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fileManagerDocuments.map((doc) => (
                          <tr key={doc.id} style={{ cursor: "pointer" }}>
                            <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>
                              <div className="d-flex align-items-center gap-2">
                                <FileIcon />
                                {doc.name || doc.title || 'Untitled'}
                              </div>
                            </td>
                            <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>{doc.file_type || 'N/A'}</td>
                            <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>
                              {doc.file_size ? (typeof doc.file_size === 'string' ? doc.file_size : `${(doc.file_size / 1024).toFixed(1)} KB`) : 'N/A'}
                            </td>
                            <td style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>
                              {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                            </td>
                            <td>
                              <span className={`badge ${doc.is_archived ? 'bg-secondary' : 'bg-success'} text-white px-2 py-1`} style={{ borderRadius: "12px", fontSize: "12px" }}>
                                {doc.is_archived ? 'Archived' : 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))}
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
      <div className="mt-4">
        <Outlet />
      </div>
    </div>
  );
}
