import React, { useRef, useState, useEffect } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { FaRegFileAlt, FaChevronDown, FaChevronRight, FaFolder, FaExclamationCircle, FaEye, FaDownload } from "react-icons/fa";
import { UploadsIcon, CrossIcon } from "../component/icons";
import "../../ClientOnboarding/styles/Upload_Premium.css";
import { toast } from "react-toastify";
import { getApiBaseUrl, fetchWithCors } from "../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../ClientOnboarding/utils/apiUtils";

// --- Sub-Components ---

/**
 * Renders a single node in the folder tree
 */
const FolderNode = ({ folder, level = 0, onSelect, expandedFolders, onToggleExpand, selectedId }) => {
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedId === folder.id;
  const hasChildren = folder.children && folder.children.length > 0;
  const canExpand = hasChildren || (!folder.loaded && folder.id);

  return (
    <div className="folder-node-wrapper" style={{ marginLeft: `${level * 16}px` }}>
      <div
        className={`tree-node ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelect(folder)}
      >
        {canExpand ? (
          <span
            className="expand-toggle"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(folder);
            }}
          >
            {isExpanded ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
          </span>
        ) : (
          <span className="spacer" style={{ width: 12 }} />
        )}
        <FaFolder className="folder-icon" />
        <span className="folder-name">{folder.name}</span>
      </div>
      {isExpanded && hasChildren && (
        <div className="children-container">
          {folder.children.map(child => (
            <FolderNode
              key={child.id}
              folder={child}
              level={level + 1}
              onSelect={onSelect}
              expandedFolders={expandedFolders}
              onToggleExpand={onToggleExpand}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Helpers ---

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const STATUS_LABELS = {
  pending: "Queued",
  uploading: "Uploading…",
  success: "Uploaded",
  error: "Failed",
};

const getExtension = (name = "") => {
  return name.split('.').pop().toLowerCase();
};

const isPreviewable = (file) => {
  const extension = getExtension(file.name);
  const previewableExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const previewableMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'];

  if (file.fileObject?.type && previewableMimeTypes.includes(file.fileObject.type.toLowerCase())) {
    return true;
  }
  return previewableExtensions.includes(extension.toLowerCase());
};

// --- Main Component ---

export default function TaxUploadModal({ show, handleClose, clientId = null, onUploadSuccess }) {
  // --- States ---
  const [step, setStep] = useState(1); // 1: Select, 2: Configure
  const [files, setFiles] = useState([]); // { name, size, folderId, folderPath, fileObject, previewUrl, errors: [], status: 'pending'|'uploading'|'success'|'error' }
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Folder State
  const [folderTree, setFolderTree] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [folderDropdownOpen, setFolderDropdownOpen] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolderLoading, setCreatingFolderLoading] = useState(false);
  const [parentFolderForNewFolder, setParentFolderForNewFolder] = useState(null);

  // UI Logic State
  const [modalErrors, setModalErrors] = useState([]); // Top-level errors
  const [isDragging, setIsDragging] = useState(false);

  // Client Selection State (Removed)
  const [internalClientId, setInternalClientId] = useState(clientId);


  // Preview Modal State
  const [previewModalShow, setPreviewModalShow] = useState(false);
  const [previewFileIndex, setPreviewFileIndex] = useState(null);
  const previewModalRef = useRef(null);

  const fileInputRef = useRef();
  const folderDropdownRef = useRef();

  // --- Effects ---

  useEffect(() => {
    setInternalClientId(clientId);
  }, [clientId]);

  // Initial load
  useEffect(() => {
    if (show) {
      // Fetch folders regardless of client selection (fetches firm docs if no client)
      fetchRootFolders();
    } else {
      resetState();
    }
  }, [show, clientId]);

  // Fetch folders when client changes
  useEffect(() => {
    if (show && internalClientId) {
      fetchRootFolders();
    } else if (!internalClientId) {
      setFolderTree([]);
    }
  }, [internalClientId]);

  // Click outside listener for folder dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (folderDropdownOpen && folderDropdownRef.current && !folderDropdownRef.current.contains(event.target)) {
        setFolderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [folderDropdownOpen]);

  // Handle ESC key in preview modal
  useEffect(() => {
    if (!previewModalShow) return;
    const handleEscKey = (event) => {
      if (event.key === 'Escape') handleClosePreview();
    };
    document.addEventListener('keydown', handleEscKey);
    setTimeout(() => previewModalRef.current?.focus(), 100);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [previewModalShow]);

  // --- Logic Functions ---

  const resetState = () => {
    setStep(1);
    files.forEach(f => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setSelectedIndex(0);
    setUploading(false);
    setModalErrors([]);
    setExpandedFolders(new Set());
    setPreviewMode(false);
    setInternalClientId(clientId);
    setFolderTree([]);
  };



  const fetchRootFolders = async () => {
    try {
      setLoadingFolders(true);
      const token = getAccessToken();
      const API_BASE_URL = getApiBaseUrl();

      let url = `${API_BASE_URL}/firm/staff/documents/browse/`;
      if (internalClientId) {
        url = `${API_BASE_URL}/firm/staff/folders/browse/?client_id=${internalClientId}`;
      }

      const response = await fetchWithCors(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch folders');
      const result = await response.json();

      if (result.success) {
        let rootFolders = [];
        if (Array.isArray(result.data.subfolders)) {
          rootFolders = result.data.subfolders;
        } else if (Array.isArray(result.data.folders)) {
          rootFolders = result.data.folders;
        } else if (Array.isArray(result.data)) {
          rootFolders = result.data;
        }

        const formatted = rootFolders.map(f => ({
          id: f.id,
          name: f.title || f.name,
          children: [],
          loaded: false
        }));
        setFolderTree(formatted);
      }
    } catch (err) {
      console.error(err);
      setModalErrors(['Could not load folder structure. Please try again.']);
    } finally {
      setLoadingFolders(false);
    }
  };

  const fetchSubfolders = async (parentId) => {
    const token = getAccessToken();
    const API_BASE_URL = getApiBaseUrl();
    try {
      const response = await fetchWithCors(`${API_BASE_URL}/firm/staff/folders/browse/?client_id=${internalClientId}&folder_id=${parentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        let subfolders = [];
        if (Array.isArray(result.data.subfolders)) {
          subfolders = result.data.subfolders;
        } else if (Array.isArray(result.data.folders)) {
          subfolders = result.data.folders;
        }

        return subfolders.map(f => ({
          id: f.id,
          name: f.title || f.name,
          children: [],
          loaded: false
        }));
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  };

  const toggleFolderExpand = async (folder) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folder.id)) {
      newExpanded.delete(folder.id);
    } else {
      newExpanded.add(folder.id);
      if (!folder.loaded) {
        const subs = await fetchSubfolders(folder.id);
        updateFolderInTree(folder.id, subs);
      }
    }
    setExpandedFolders(newExpanded);
  };

  const updateFolderInTree = (id, children) => {
    const updateRecursive = (list) => list.map(f => {
      if (f.id === id) return { ...f, children, loaded: true };
      if (f.children.length > 0) return { ...f, children: updateRecursive(f.children) };
      return f;
    });
    setFolderTree(prev => updateRecursive(prev));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolderLoading(true);
    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();
      if (!token) return;

      const folderData = {
        title: newFolderName.trim(),
        description: `Documents folder: ${newFolderName.trim()}`,
      };
      if (parentFolderForNewFolder) {
        folderData.parent_id = parentFolderForNewFolder;
      }

      const response = await fetchWithCors(`${API_BASE_URL}/firm/staff/documents/folders/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(folderData),
      });

      if (!response.ok) throw new Error("Failed to create folder");

      const result = await response.json();
      const folderInfo = result?.data || result;

      const newFolder = {
        id: folderInfo.id,
        name: folderInfo.title || folderInfo.name || newFolderName.trim(),
        children: [],
        loaded: false,
      };

      setFolderTree(prev => {
        if (parentFolderForNewFolder) {
          const updateRecursive = (list) => list.map(f => {
            if (f.id === parentFolderForNewFolder) {
              return { ...f, children: [...(f.children || []), newFolder], loaded: true };
            }
            if (f.children.length > 0) return { ...f, children: updateRecursive(f.children) };
            return f;
          });
          return updateRecursive(prev);
        } else {
          return [...prev, newFolder];
        }
      });

      setNewFolderName("");
      setCreatingFolder(false);
      setParentFolderForNewFolder(null);
      toast.success("Folder created successfully!");

    } catch (error) {
      console.error(error);
      toast.error("Failed to create folder.");
    } finally {
      setCreatingFolderLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const rawFiles = Array.from(e.target.files);
    processFiles(rawFiles);
    if (e.target) e.target.value = '';
  };

  const processFiles = (rawFiles) => {
    // Allowed file extensions
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.csv'];
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    const isValidFileType = (file) => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      const fileExtension = '.' + fileName.split('.').pop();

      return allowedExtensions.includes(fileExtension) || allowedMimeTypes.includes(fileType);
    };

    const validFiles = [];
    const skipped = [];
    const invalidFormat = [];

    rawFiles.forEach(f => {
      if (!isValidFileType(f)) {
        invalidFormat.push(f.name);
      } else if (f.size > MAX_FILE_SIZE) {
        skipped.push(f.name);
      } else {
        validFiles.push(f);
      }
    });

    if (skipped.length > 0) {
      toast.error(`Skipped ${skipped.length} files larger than 50MB.`);
    }

    if (invalidFormat.length > 0) {
      toast.error(`Skipped ${invalidFormat.length} files with unsupported formats. Supported: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, CSV`);
    }

    const newFiles = validFiles.map(f => ({
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + " MB",
      fileObject: f,
      previewUrl: URL.createObjectURL(f),
      folderId: null,
      folderPath: '',
      errors: [],
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploading) return;
    processFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (idx) => {
    const updated = [...files];
    const removed = updated.splice(idx, 1)[0];
    if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    setFiles(updated);
    if (selectedIndex >= updated.length) setSelectedIndex(Math.max(0, updated.length - 1));
  };

  const selectFolder = (folder) => {
    const updated = [...files];
    updated[selectedIndex].folderId = folder.id;
    updated[selectedIndex].folderPath = folder.name;
    updated[selectedIndex].errors = updated[selectedIndex].errors.filter(e => !e.includes('folder'));
    setFiles(updated);
    setFolderDropdownOpen(false);
  };

  const validateBeforeUpload = () => {
    const newModalErrors = [];
    const updatedFiles = files.map(f => {
      const fileErrors = [];
      if (!f.folderId) fileErrors.push('Please select a folder');
      return { ...f, errors: fileErrors };
    });

    const filesWithErrors = updatedFiles.filter(f => f.errors.length > 0);
    if (filesWithErrors.length > 0) {
      newModalErrors.push(`Configuration incomplete for ${filesWithErrors.length} file(s).`);
    }

    setFiles(updatedFiles);
    setModalErrors(newModalErrors);
    return newModalErrors.length === 0;
  };

  const retryFile = (index) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'pending', errors: [], progress: 0 } : f));
  }

  const performUpload = async () => {
    if (!validateBeforeUpload()) return;

    setUploading(true);
    setModalErrors([]);
    const token = getAccessToken();
    const API_BASE_URL = getApiBaseUrl();

    let successCount = 0;
    let finalFiles = [...files];

    for (let i = 0; i < finalFiles.length; i++) {
      const file = finalFiles[i];
      if (file.status === 'success') {
        successCount++;
        continue;
      }

      finalFiles[i].status = 'uploading';
      finalFiles[i].progress = 20;
      setFiles([...finalFiles]);

      try {
        const formData = new FormData();
        formData.append("files", file.fileObject);
        const documentsPayload = [{
          folder_id: file.folderId,
          file_name: file.name,
          client_id: internalClientId
        }];
        formData.append("documents", JSON.stringify(documentsPayload));

        const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/tax-preparer/documents/upload/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success || result) {
            finalFiles[i].status = 'success';
            finalFiles[i].progress = 100;
            finalFiles[i].errors = [];
            successCount++;
          } else {
            throw new Error(result.message || 'Upload failed');
          }
        } else {
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
          } catch (_) { }
          throw new Error(errorMessage);
        }
      } catch (err) {
        finalFiles[i].status = 'error';
        finalFiles[i].progress = 0;
        finalFiles[i].errors = [err.message || 'Network error occurred'];
      }
      setFiles([...finalFiles]);
    }

    setUploading(false);

    if (successCount === finalFiles.length) {
      toast.success('All documents uploaded successfully!');
      onUploadSuccess && onUploadSuccess();
      handleClose();
    } else {
      setModalErrors([`${finalFiles.length - successCount} file(s) encountered errors during upload.`]);
      toast.error("Some files failed to upload. Please review errors.");
    }
  };

  // Preview Handlers
  const handlePreview = (index, event) => {
    event.stopPropagation();
    const file = files[index];
    if (file && isPreviewable(file) && file.previewUrl) {
      setPreviewFileIndex(index);
      setPreviewModalShow(true);
    }
  };

  const handleClosePreview = () => {
    setPreviewModalShow(false);
    setPreviewFileIndex(null);
  };

  const handleDownload = (index, event) => {
    event.stopPropagation();
    const file = files[index];
    if (file) {
      const link = document.createElement('a');
      link.href = file.previewUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // --- Steps Logic ---
  const handleNextStep = () => {
    if (files.length === 0) return;
    setStep(2);
  };

  // --- Render Helpers ---

  const currentFile = files[selectedIndex];

  return (
    <Modal
      show={show}
      onHide={() => resetState()}
      centered
      backdrop="static"
      size={step === 1 ? "md" : "xl"}
      className="upload-modal"
    >
      <Modal.Body className="p-0">
        {/* Header Section */}
        <div className="p-4 bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="upload-heading">Upload Documents</h5>
              <p className="upload-subheading mb-0">Upload documents for your client</p>
            </div>
            <Button variant="link" className="p-0 text-muted" onClick={handleClose}>
              <CrossIcon />
            </Button>
          </div>
        </div>

        <div className="p-4">
          {/* Error Summary Panel */}
          {modalErrors.length > 0 && (
            <div className="error-summary-banner">
              <FaExclamationCircle size={20} className="mt-1" />
              <div className="error-summary-content">
                <strong>Important: Please fix the following</strong>
                <ul className="error-summary-list">
                  {modalErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            </div>
          )}

          {step === 1 ? (
            /* Step 1: Selection Dropzone */
            <div className="step-selection">

              <div
                className={`premium-dropzone ${isDragging ? 'active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
              >
                <div className="dropzone-icon-container">
                  <UploadsIcon />
                </div>
                <div className="dropzone-text">Drop files here or click to browse</div>
                <div className="dropzone-hint">Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, CSV • Max 50MB per file</div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                />
              </div>

              {files.length > 0 && (
                <div className="mt-4 p-3 border rounded bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small fw-semibold">{files.length} file(s) selected</span>
                    <Button variant="link" size="sm" onClick={() => setFiles([])}>Clear All</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Configuration View */
            <div className="config-layout">
              {/* Left Sidebar: File List */}
              <div className="file-sidebar">
                <div className="file-list-header">
                  <h6 className="mb-0 fw-bold">Selected Documents ({files.length})</h6>
                </div>
                <div className="file-items-container custom-scrollbar">
                  {files.map((f, idx) => (
                    <div
                      key={idx}
                      className={`file-item-premium ${selectedIndex === idx ? 'active' : ''} ${f.errors.length > 0 ? 'has-error' : ''}`}
                      onClick={() => setSelectedIndex(idx)}
                    >
                      <div className="file-icon-square">
                        <FaRegFileAlt size={18} />
                      </div>
                      <div className="file-info-mini">
                        <div className="file-name-txt">{f.name}</div>
                        <div className="file-meta-txt">{f.size} • {STATUS_LABELS[f.status] || f.status}</div>
                        {f.status === 'uploading' && (
                          <div className="doc-progress mt-1" style={{ height: '3px' }}>
                            <div className="doc-progress-bar doc-progress-uploading" style={{ width: `${f.progress}%` }}></div>
                          </div>
                        )}
                      </div>
                      {f.status === 'error' ? (
                        <div className="text-danger small fw-bold ms-2">!</div>
                      ) : (
                        <span
                          className="ms-2 text-muted"
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          role="button"
                        >
                          <CrossIcon size={14} />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Area: Config & Preview */}
              <div className="main-config-area">
                <div className="config-tabs">
                  <button
                    className={`tab-btn ${!previewMode ? 'active' : ''}`}
                    onClick={() => setPreviewMode(false)}
                  >
                    Configure
                  </button>
                  <button
                    className={`tab-btn ${previewMode ? 'active' : ''}`}
                    onClick={() => setPreviewMode(true)}
                  >
                    Preview
                  </button>
                </div>

                <div className="config-content-wrapper custom-scrollbar">
                  {!previewMode ? (
                    <div className="form-content">
                      <h6 className="fw-bold mb-3">Configure Document Settings</h6>

                      {/* Folder Selection */}
                      <Form.Group className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="small fw-600 text-muted uppercase mb-0">Target Folder</Form.Label>
                          {!creatingFolder ? (
                            <Button variant="link" className="p-0 small create-folder-btn" onClick={() => {
                              setCreatingFolder(true);
                              setParentFolderForNewFolder(currentFile?.folderId || null);
                            }}>Create New Folder</Button>
                          ) : null}
                        </div>

                        {!creatingFolder ? (
                          <div className="position-relative">
                            <div
                              className={`premium-folder-select ${currentFile?.errors.some(e => e.includes('folder')) ? 'border-danger' : ''}`}
                              onClick={() => setFolderDropdownOpen(!folderDropdownOpen)}
                            >
                              <div className="folder-path-display">
                                <FaFolder className="text-warning" />
                                <span>{currentFile?.folderPath || 'Select a destination folder...'}</span>
                              </div>
                              <FaChevronDown size={12} className="text-muted" />
                            </div>

                            {folderDropdownOpen && (
                              <div className="folder-dropdown-premium" ref={folderDropdownRef}>
                                {loadingFolders ? (
                                  <div className="text-center p-3"><Spinner size="sm" /></div>
                                ) : folderTree.length === 0 ? (
                                  <div className="text-center p-3 small text-muted">No folders found</div>
                                ) : (
                                  folderTree.map(f => (
                                    <FolderNode
                                      key={f.id}
                                      folder={f}
                                      onSelect={selectFolder}
                                      selectedId={currentFile?.folderId}
                                      expandedFolders={expandedFolders}
                                      onToggleExpand={toggleFolderExpand}
                                    />
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="d-flex align-items-center gap-2 mt-1">
                            <Form.Control
                              size="sm"
                              type="text"
                              placeholder="Enter folder name"
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              autoFocus
                            />
                            <Button variant="primary" size="sm" onClick={handleCreateFolder} disabled={creatingFolderLoading || !newFolderName.trim()}>
                              {creatingFolderLoading ? '...' : 'Add'}
                            </Button>
                            <Button variant="outline-secondary" size="sm" onClick={() => setCreatingFolder(false)}>Cancel</Button>
                          </div>
                        )}

                        {currentFile?.errors.map((err, i) => (
                          <div key={i} className="text-danger small mt-1 d-flex align-items-center gap-1">
                            <FaExclamationCircle size={10} /> {err}
                          </div>
                        ))}
                      </Form.Group>

                      <div className="bg-light p-3 rounded">
                        <div className="small fw-bold text-main mb-1">File Details</div>
                        <div className="small text-muted">Name: {currentFile?.name}</div>
                        <div className="small text-muted">Estimated Size: {currentFile?.size}</div>
                        {currentFile?.status === 'error' && (
                          <div className="mt-2">
                            <span className="text-danger small">{currentFile.errors[0]}</span>
                            <Button variant="link" size="sm" className="p-0 ms-2" onClick={() => retryFile(selectedIndex)}>Retry</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="preview-container h-100">
                      {currentFile?.previewUrl ? (
                        <iframe
                          src={currentFile?.previewUrl}
                          title="Preview"
                          width="100%"
                          height="450px"
                          className="border rounded"
                        />
                      ) : (
                        <div className="text-center p-5 text-muted">No preview available</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer-premium">
          <Button
            className="btn-premium-secondary"
            onClick={step === 2 ? () => setStep(1) : handleClose}
            disabled={uploading}
          >
            {step === 2 ? 'Back to Selection' : 'Cancel'}
          </Button>

          {step === 1 ? (
            <Button
              className="btn-premium-primary"
              disabled={files.length === 0}
              onClick={handleNextStep}
            >
              Configure Upload
            </Button>
          ) : (
            <Button
              className="btn-premium-primary"
              onClick={performUpload}
              disabled={uploading}
            >
              {uploading ? (
                <><Spinner size="sm" className="me-2" /> Uploading...</>
              ) : `Finish & Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      </Modal.Body>

      {/* Full Screen Preview Modal */}
      <Modal
        show={previewModalShow}
        onHide={handleClosePreview}
        centered
        size="xl"
        className="preview-modal"
        ref={previewModalRef}
        tabIndex={-1}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Preview: {files[previewFileIndex]?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, minHeight: '500px' }}>
          {files[previewFileIndex]?.previewUrl && (
            <iframe
              src={files[previewFileIndex].previewUrl}
              title="Full Preview"
              width="100%"
              height="100%"
              style={{ minHeight: '70vh', border: 'none' }}
            />
          )}
        </Modal.Body>
      </Modal>
    </Modal>
  );
}
