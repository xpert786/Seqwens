import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaSearch, FaFilter, FaFolder, FaDownload, FaEdit, FaTrash, FaPlus, FaFileUpload, FaPenNib } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FileIcon } from "../../component/icons";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError, taxPreparerDocumentsAPI } from "../../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
import { Modal, Button, Form, Dropdown } from "react-bootstrap";
import "../../styles/taxupload.css";
import { UploadsIcon, FileIcon as IconsFileIcon } from "../../component/icons";

export default function ClientDocuments() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [view, setView] = useState("grid");
  const [isDragging, setIsDragging] = useState(false);
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

  // Modals state
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignEsignModal, setShowAssignEsignModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Action target state
  const [itemToRename, setItemToRename] = useState(null); // { type: 'folder'|'file', item: object }
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'folder'|'file', item: object }
  const [fileToEsign, setFileToEsign] = useState(null);

  // Form inputs
  const [newFolderName, setNewFolderName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [uploadFiles, setUploadFiles] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [esignDeadline, setEsignDeadline] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch folders and documents from API
  const fetchDocuments = async (folderId = null, search = "") => {
    try {
      setLoading(true);
      setError(null);

      if (!clientId) throw new Error('Client ID is required');

      // Use the new optimized split endpoints for better performance
      // Fetch folders and files in parallel
      const [foldersResult, filesResult] = await Promise.all([
        taxPreparerDocumentsAPI.getClientFoldersSplit(clientId, {
          folder_id: folderId,
          search
        }),
        taxPreparerDocumentsAPI.getClientFilesSplit(clientId, {
          folder_id: folderId,
          search
        })
      ]);

      if (foldersResult.success && foldersResult.data) {
        // Handle root title if not provided by backend optimized views
        const rootTitle = foldersResult.data.breadcrumbs?.[0]?.title || "Client's Documents";

        setCurrentFolder(foldersResult.data.current_folder || null);
        setParentFolder(foldersResult.data.parent_folder || null);
        setBreadcrumbs(foldersResult.data.breadcrumbs || [{ id: null, title: rootTitle, path: '/' }]);
        setFolders(foldersResult.data.folders || []);

        if (foldersResult.data.statistics) {
          setStatistics(prev => ({
            ...prev,
            total_folders: foldersResult.data.statistics.total_folders || 0,
            is_root: foldersResult.data.statistics.is_root
          }));
        }
      }

      if (filesResult.success && filesResult.data) {
        setDocuments(filesResult.data.documents || []);

        if (filesResult.data.statistics) {
          setStatistics(prev => ({
            ...prev,
            total_documents: filesResult.data.statistics.total_documents || 0,
            archived_documents: filesResult.data.statistics.archived_documents || 0
          }));
        }
      }

      if (!foldersResult.success && !filesResult.success) {
        throw new Error(foldersResult.message || filesResult.message || 'Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching client documents:', error);
      setError(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();
      const url = `${API_BASE_URL}/taxpayer/document-categories/`;

      const response = await fetchWithCors(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setCategories(result.data);
        if (result.data.length > 0) {
          // Try to find "General" or use first
          const general = result.data.find(c => c.name.toLowerCase() === 'general');
          setSelectedCategoryId(general ? general.id : result.data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching categories", error);
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchDocuments(selectedFolderId, searchQuery);
      fetchCategories();
    }
  }, [clientId, selectedFolderId, searchQuery]);

  // --- Actions ---

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }
    setIsProcessing(true);
    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();
      const url = `${API_BASE_URL}/taxpayer/tax-preparer/clients/${clientId}/documents/browse/`;

      const response = await fetchWithCors(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newFolderName.trim(),
          parent_id: selectedFolderId
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Folder created successfully");
        setShowCreateFolderModal(false);
        setNewFolderName("");
        fetchDocuments(selectedFolderId, searchQuery);
      } else {
        toast.error(result.message || "Failed to create folder");
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadFiles = async () => {
    if (uploadFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    const targetFolderId = selectedFolderId || (currentFolder ? currentFolder.id : null);

    if (!targetFolderId) {
      toast.error("Please navigate to a specific folder to upload files.");
      return;
    }

    if (!selectedCategoryId) {
      toast.error("Please select a category for the documents.");
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      uploadFiles.forEach((file) => {
        formData.append('files', file);
      });

      const documentsMetadata = uploadFiles.map(() => ({
        category_id: selectedCategoryId,
        folder_id: targetFolderId
      }));

      formData.append('documents', JSON.stringify(documentsMetadata));
      formData.append('client_id', clientId);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();
      const url = `${API_BASE_URL}/taxpayer/tax-preparer/documents/upload/`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      toast.success("Files uploaded successfully");
      setShowUploadModal(false);
      setUploadFiles([]);
      fetchDocuments(selectedFolderId, searchQuery);

    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload files");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRename = async () => {
    if (!itemToRename || !newItemName.trim()) return;
    setIsProcessing(true);
    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();
      let url = "";

      if (itemToRename.type === 'folder') {
        url = `${API_BASE_URL}/taxpayer/tax-preparer/clients/folders/${itemToRename.item.id}/`;
      } else {
        const docId = itemToRename.item.id || itemToRename.item.document_id;
        url = `${API_BASE_URL}/taxpayer/tax-preparer/clients/documents/${docId}/`;
      }

      const response = await fetchWithCors(url, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItemName.trim(),
          file_name: newItemName.trim()
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`${itemToRename.type === 'folder' ? 'Folder' : 'Document'} renamed successfully`);
        setShowRenameModal(false);
        setItemToRename(null);
        setNewItemName("");
        fetchDocuments(selectedFolderId, searchQuery);
      } else {
        toast.error(result.message || "Failed to rename");
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsProcessing(true);
    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();
      let url = "";

      if (itemToDelete.type === 'folder') {
        url = `${API_BASE_URL}/taxpayer/tax-preparer/clients/folders/${itemToDelete.item.id}/`;
      } else {
        const docId = itemToDelete.item.id || itemToDelete.item.document_id;
        url = `${API_BASE_URL}/taxpayer/tax-preparer/clients/documents/${docId}/`;
      }

      const response = await fetchWithCors(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 204) {
        toast.success("Deleted successfully");
        setShowDeleteModal(false);
        setItemToDelete(null);
        fetchDocuments(selectedFolderId, searchQuery);
        return;
      }

      const result = await response.json();
      if (result.success) {
        toast.success("Deleted successfully");
        setShowDeleteModal(false);
        setItemToDelete(null);
        fetchDocuments(selectedFolderId, searchQuery);
      } else {
        toast.error(result.message || "Failed to delete");
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignEsign = async () => {
    if (!fileToEsign) return;
    if (!esignDeadline) {
      toast.error("Please select a deadline");
      return;
    }
    setIsProcessing(true);

    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();
      const url = `${API_BASE_URL}/taxpayer/esign/assign-document/`;

      const payload = {
        document_id: fileToEsign.id || fileToEsign.document_id,
        taxpayer_id: parseInt(clientId),
        has_spouse: false,
        preparer_must_sign: true,
        deadline: esignDeadline
      };

      const response = await fetchWithCors(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400 && result.code === 'document_already_assigned') {
          toast.warning("This document is already assigned for e-signature.");
        } else {
          throw new Error(result.message || "Failed to assign document");
        }
      } else {
        toast.success("Document assigned for e-signature successfully!");
        setShowAssignEsignModal(false);
        setFileToEsign(null);
        setEsignDeadline("");
      }
    } catch (error) {
      toast.error(handleAPIError(error) || "Failed to assign document");
    } finally {
      setIsProcessing(false);
    }
  };


  // --- Helper Functions ---

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return 'bg-secondary text-white';
    const s = status.toLowerCase();
    if (s.includes('processed') || s.includes('completed') || s.includes('active')) return 'bg-success text-white';
    if (s.includes('signature') || s.includes('pending') || s.includes('waiting')) return 'bg-warning text-dark';
    if (s.includes('review') || s.includes('info')) return 'bg-info text-white';
    return 'bg-primary text-white';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index) => {
    setUploadFiles(files => files.filter((_, i) => i !== index));
  };

  // --- Render ---

  if (loading && !folders.length && !documents.length) {
    return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;
  }

  return (
    <div className="mt-6 position-relative">
      {loading && (
        <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75" style={{ zIndex: 10, top: 0, left: 0, minHeight: '200px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-xl font-bold text-gray-800">
              {clientInfo?.name ? `${clientInfo.name}'s Documents` : 'Client Documents'}
            </h4>
            <p className="text-sm text-gray-500">
              {currentFolder ? `Browsing: ${currentFolder.title}` : 'Organized document folders'}
            </p>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary d-flex align-items-center gap-2"
              onClick={() => setShowCreateFolderModal(true)}
            >
              <FaFolder /> New Folder
            </button>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => setShowUploadModal(true)}
              style={{ backgroundColor: "#00C0C6", border: "none" }}
            >
              <FaFileUpload /> Upload File
            </button>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="mb-4 d-flex align-items-center bg-gray-50 p-3 rounded">
          <button className="btn btn-link p-0 text-decoration-none text-muted" onClick={() => setSelectedFolderId(null)}>
            Root
          </button>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <span className="mx-2 text-muted">/</span>
              <button className="btn btn-link p-0 text-decoration-none text-muted" onClick={() => setSelectedFolderId(crumb.id)}>
                {crumb.title}
              </button>
            </React.Fragment>
          ))}
          {currentFolder && (
            <>
              <span className="mx-2 text-muted">/</span>
              <span className="fw-bold text-dark">{currentFolder.title}</span>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="d-flex gap-3 mb-4">
          <span className="badge bg-light text-dark p-2 border">Folders: {statistics.total_folders}</span>
          <span className="badge bg-light text-dark p-2 border">Documents: {statistics.total_documents}</span>
        </div>

        {/* Folders Grid */}
        {folders.length > 0 && (
          <div className="mb-5">
            <h6 className="text-muted mb-3">Folders</h6>
            <div className="row g-3">
              {folders.map(folder => (
                <div key={folder.id} className="col-12 col-md-3">
                  <div
                    className="border rounded p-3 d-flex flex-column justify-content-between h-100 bg-white shadow-sm hover:shadow-md transition-all w-100"
                    style={{ cursor: 'pointer', minHeight: '120px' }}
                    onClick={() => setSelectedFolderId(folder.id)}
                  >
                    <div className="d-flex justify-content-center mb-2">
                      <FaFolder size={48} color="#F49C2D" />
                    </div>
                    <div className="text-center">
                      <div className="fw-bold text-truncate" title={folder.title}>{folder.title}</div>
                      <div className="text-muted small">{folder.files_count || 0} files</div>
                    </div>
                    <div className="d-flex justify-content-end mt-2 pt-2 border-top" onClick={e => e.stopPropagation()}>
                      <Dropdown>
                        <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                          <BsThreeDotsVertical />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="p-2" style={{ minWidth: '240px' }}>
                          <div className="d-flex flex-column gap-2">
                            <Button
                              variant="light"
                              size="sm"
                              className="w-100 d-flex align-items-center justify-content-start gap-2"
                              onClick={() => {
                                setItemToRename({ type: 'folder', item: folder });
                                setNewItemName(folder.title);
                                setShowRenameModal(true);
                              }}
                            >
                              <FaEdit /> Rename
                            </Button>
                            <Button
                              variant="light"
                              size="sm"
                              className="w-100 d-flex align-items-center justify-content-start gap-2 text-danger"
                              onClick={() => {
                                setItemToDelete({ type: 'folder', item: folder });
                                setShowDeleteModal(true);
                              }}
                            >
                              <FaTrash /> Delete
                            </Button>
                          </div>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents List */}
        {documents.length > 0 ? (
          <div>
            <h6 className="text-muted mb-3">Documents</h6>
            <div className="table-responsive" style={{ minHeight: '200px' }}>
              <table className="table table-hover align-middle mb-0" style={{ fontSize: 'var(--mobile-font-size, 13px)', whiteSpace: 'nowrap' }}>
                <thead className="bg-light">
                  <tr style={{ whiteSpace: 'nowrap' }}>
                    <th className="border-0">Name</th>
                    <th className="border-0 d-none d-md-table-cell">Category</th>
                    <th className="border-0 d-none d-md-table-cell">Size</th>
                    <th className="border-0 d-none d-lg-table-cell">Date</th>
                    <th className="border-0">Status</th>
                    <th className="border-0 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => {
                    const docName = doc.file_name || doc.name || doc.document_name || 'Untitled';
                    // Remove extension for display if it's a PDF on mobile
                    const displayName = docName.replace(/\.[^/.]+$/, "");
                    const fileSize = doc.file_size_bytes || doc.file_size || 0;
                    const fileType = doc.file_type || doc.file_extension || 'FILE';
                    const fileUrl = doc.file_url || doc.tax_documents || '';
                    const isPdf = fileType.toLowerCase().includes('pdf') || (docName.toLowerCase().endsWith('.pdf'));
                    const categoryName = doc.category_name || (doc.category ? doc.category.name : '-');

                    return (
                      <tr key={doc.id} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => fileUrl && window.open(fileUrl, '_blank')}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="text-primary"><FileIcon /></div>
                            <span className="fw-medium text-truncate d-none d-lg-inline-block" style={{ maxWidth: '150px', verticalAlign: 'middle' }} title={docName}>
                              {displayName}
                            </span>
                          </div>
                        </td>
                        <td className="text-muted small d-none d-md-table-cell">{categoryName}</td>
                        <td className="text-muted small d-none d-md-table-cell">{formatFileSize(fileSize)}</td>
                        <td className="text-muted small d-none d-lg-table-cell">{formatDate(doc.created_at || doc.date)}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(doc.status || 'Active')} rounded-pill`}>{doc.status || 'Active'}</span>
                          {doc.esign_status && (
                            <span className="badge bg-warning text-dark rounded-pill ms-2">
                              E-Sign: {doc.esign_status}
                            </span>
                          )}
                        </td>
                        <td className="text-end" onClick={e => e.stopPropagation()}>
                          <div className="d-flex justify-content-end gap-2 flex-nowrap" style={{ whiteSpace: 'nowrap' }}>
                            <button
                              className="btn btn-sm btn-light text-muted d-flex align-items-center justify-content-center"
                              style={{ width: '30px', height: '30px', borderRadius: '6px' }}
                              onClick={() => fileUrl && window.open(fileUrl, '_blank')}
                              title="Download"
                            >
                              <FaDownload size={14} />
                            </button>
                            <Dropdown>
                              <Dropdown.Toggle variant="light" size="sm" className="text-muted no-caret d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', borderRadius: '6px' }}>
                                <BsThreeDotsVertical size={14} />
                              </Dropdown.Toggle>
                              <Dropdown.Menu align="end" style={{ minWidth: '140px', padding: '4px 0' }}>
                                <Dropdown.Item onClick={() => {
                                  setItemToRename({ type: 'file', item: doc });
                                  setNewItemName(docName);
                                  setShowRenameModal(true);
                                }} style={{ fontSize: '11px', padding: '6px 12px' }}>
                                  <div className="d-flex align-items-center gap-2">
                                    <FaEdit size={12} /> <span>Rename</span>
                                  </div>
                                </Dropdown.Item>

                                {isPdf && !doc.esign_status && (
                                  <Dropdown.Item onClick={() => {
                                    setFileToEsign(doc);
                                    setShowAssignEsignModal(true);
                                  }} style={{ fontSize: '11px', padding: '6px 12px' }}>
                                    <div className="d-flex align-items-center gap-2">
                                      <FaPenNib size={12} /> <span>Assign for E-Sign</span>
                                    </div>
                                  </Dropdown.Item>
                                )}

                                <Dropdown.Divider style={{ margin: '4px 0' }} />
                                <Dropdown.Item className="text-danger" onClick={() => {
                                  setItemToDelete({ type: 'file', item: doc });
                                  setShowDeleteModal(true);
                                }} style={{ fontSize: '11px', padding: '6px 12px' }}>
                                  <div className="d-flex align-items-center gap-2">
                                    <FaTrash size={12} /> <span>Delete</span>
                                  </div>
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          folders.length === 0 && (
            <div className="text-center py-5 text-muted">
              <div className="mb-3"><FaFolder size={48} className="text-gray-300" /></div>
              <p>No documents or folders found.</p>
            </div>
          )
        )}
      </div>

      {/* -- MODALS -- */}

      {/* Create Folder Modal */}
      <Modal show={showCreateFolderModal} onHide={() => setShowCreateFolderModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Folder Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Tax Returns 2024"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateFolderModal(false)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim() || isProcessing}
            style={{ backgroundColor: "#00C0C6", border: "none" }}
          >
            {isProcessing ? 'Creating...' : 'Create Folder'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Upload File Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered size="lg" dialogClassName="upload-modal">
        <Modal.Header closeButton style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <Modal.Title className="upload-heading">Upload Documents</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <p className="upload-subheading mb-4">Upload files to this client's folder.</p>

          <div
            className={`upload-dropzone mb-4 ${isDragging ? 'drag-active' : ''}`}
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
          >
            <div className="mb-3 d-flex justify-content-center">
              <UploadsIcon />
            </div>
            <h5 className="texts">Drag & drop files or <span className="text-primary text-decoration-underline">Browse</span></h5>
            <p className="upload-hint">Supported formats: PDF, JPEG, PNG, DOCX, XLSX</p>
            <input
              type="file"
              ref={fileInputRef}
              className="d-none"
              multiple
              onChange={(e) => setUploadFiles(Array.from(e.target.files))}
            />
          </div>

          {/* Selected Files List */}
          {uploadFiles.length > 0 && (
            <div className="mb-4">
              <h6 className="upload-section-title">Selected Files ({uploadFiles.length})</h6>
              <div className="doc-scroll" style={{ maxHeight: '200px', minHeight: 'auto', minWidth: '100%' }}>
                {uploadFiles.map((f, i) => (
                  <div key={i} className="doc-item d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3 overflow-hidden">
                      <div className="file-icon-wrapper p-2 rounded bg-light">
                        <IconsFileIcon />
                      </div>
                      <div className="text-truncate">
                        <div className="text-truncate fw-medium" style={{ fontSize: '14px', color: '#3B4A66' }}>{f.name}</div>
                        <div className="text-muted small" style={{ fontSize: '11px' }}>{formatFileSize(f.size)}</div>
                      </div>
                    </div>
                    <button
                      className="btn btn-link text-danger p-2"
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      title="Remove file"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}


        </Modal.Body>
        <Modal.Footer style={{ borderTop: 'none', paddingTop: 0, paddingBottom: '20px' }}>
          <Button variant="outline-secondary" className="btn-cancel-custom px-4" onClick={() => setShowUploadModal(false)}>Cancel</Button>
          <Button
            className="btn-upload-custom px-4"
            onClick={handleUploadFiles}
            disabled={uploadFiles.length === 0 || isProcessing}
          >
            {isProcessing ? 'Uploading...' : 'Upload Files'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Rename Modal */}
      <Modal show={showRenameModal} onHide={() => setShowRenameModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Rename {itemToRename?.type === 'folder' ? 'Folder' : 'File'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>New Name</Form.Label>
            <Form.Control
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRenameModal(false)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleRename}
            disabled={!newItemName.trim() || isProcessing}
            style={{ backgroundColor: "#00C0C6", border: "none" }}
          >
            {isProcessing ? 'Renaming...' : 'Rename'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Delete {itemToDelete?.type === 'folder' ? 'Folder' : 'File'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete <strong>{itemToDelete?.type === 'folder' ? itemToDelete?.item.title : (itemToDelete?.item.file_name || itemToDelete?.item.name)}</strong>?</p>
          <p className="text-muted small">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={isProcessing}
          >
            {isProcessing ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assign E-Sign Modal */}
      <Modal show={showAssignEsignModal} onHide={() => setShowAssignEsignModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Assign for E-Signature</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You are assigning <strong>{fileToEsign?.file_name || fileToEsign?.name}</strong> to the client.</p>
          <Form.Group className="mb-3">
            <Form.Label>Deadline</Form.Label>
            <Form.Control
              type="date"
              value={esignDeadline}
              onChange={(e) => setEsignDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </Form.Group>
          <div className="alert alert-info small">
            The client will receive a notification to sign this document via SignWell.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignEsignModal(false)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleAssignEsign}
            disabled={!esignDeadline || isProcessing}
            style={{ backgroundColor: "#00C0C6", border: "none" }}
          >
            {isProcessing ? 'Assigning...' : 'Assign'}
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}
