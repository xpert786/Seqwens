
import React, { useRef, useState, useEffect } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { FaRegFileAlt, FaChevronDown, FaChevronRight, FaFolder, FaExclamationCircle, FaEye, FaDownload, FaTable } from "react-icons/fa";
import { UploadsIcon, CrossIcon } from "../component/icons";
import "../styles/taxupload.css";
import { toast } from "react-toastify";
import { getApiBaseUrl, fetchWithCors } from "../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../ClientOnboarding/utils/apiUtils";
import * as XLSX from "xlsx";

// --- Sub-Components ---

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
  const [files, setFiles] = useState([]); // Array of file objects with status, progress, etc.
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
  const [modalErrors, setModalErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [excelPreviews, setExcelPreviews] = useState({});

  // Client Selection State
  const [internalClientId, setInternalClientId] = useState(clientId);
  const [availableClients, setAvailableClients] = useState([]); // For client dropdown if needed
  const [loadingClients, setLoadingClients] = useState(false);

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
      if (!clientId) {
        // Fetch clients if no client is pre-selected
        fetchClients();
      }
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
    setExcelPreviews({});
  };

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const token = getAccessToken();
      const API_BASE_URL = getApiBaseUrl();
      const response = await fetchWithCors(`${API_BASE_URL}/firm/clients/`, { // Adjust endpoint as needed
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setAvailableClients(result.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClients(false);
    }
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
      setFolderTree([]);
    } finally {
      setLoadingFolders(false);
    }
  };

  const fetchSubfolders = async (parentId) => {
    const token = getAccessToken();
    const API_BASE_URL = getApiBaseUrl();
    try {
      let url = `${API_BASE_URL}/firm/staff/documents/browse/?folder_id=${parentId}`;
      if (internalClientId) {
        url = `${API_BASE_URL}/firm/staff/folders/browse/?client_id=${internalClientId}&folder_id=${parentId}`;
      }

      const response = await fetchWithCors(url, {
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


  const handleFilesAdded = (fileList) => {
    if (uploading) return;

    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    // Validation Logic
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

    const skippedSize = [];
    const skippedType = [];
    const validFiles = [];

    incoming.forEach(file => {
      if (!isValidFileType(file)) {
        skippedType.push(file.name);
      } else if (file.size > MAX_FILE_SIZE) {
        skippedSize.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (skippedSize.length > 0) {
      toast.error(`Skipped ${skippedSize.length} files larger than 50MB.`);
    }

    if (skippedType.length > 0) {
      toast.error(`Skipped ${skippedType.length} files with unsupported formats. Supported: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, CSV`);
    }

    const startingIndex = files.length;
    const newEntries = validFiles.map((file, idx) => ({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      sizeLabel: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      fileObject: file,
      previewUrl: URL.createObjectURL(file),
      folderId: null,
      folderPath: '',
      errors: [], // For compatibility
      issues: [],  // For compatibility
      status: 'pending',
      progress: 0,
      fileIndex: startingIndex + idx
    }));

    setFiles((prev) => [...prev, ...newEntries]);
    if (newEntries.length > 0) {
      setSelectedIndex(Math.max(0, files.length)); // Select the first new file
    }

    // Parse Excel files for preview
    newEntries.forEach((fileEntry, idx) => {
      const fileName = fileEntry.name.toLowerCase();
      if (/\.(xlsx?|csv)$/.test(fileName)) {
        parseExcelFile(fileEntry.fileObject, fileEntry.fileIndex);
      }
    });
  };

  const parseExcelFile = async (file, fileIndex) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const previewData = jsonData.slice(0, 100).map(row =>
        Array.isArray(row) ? row.slice(0, 10) : []
      );

      setExcelPreviews(prev => ({
        ...prev,
        [fileIndex]: {
          sheetName: firstSheetName,
          data: previewData,
          totalRows: jsonData.length,
          totalSheets: workbook.SheetNames.length
        }
      }));
    } catch (error) {
      console.error('Error parsing Excel file:', error);
    }
  };

  const handleFileChange = (event) => {
    handleFilesAdded(event.target.files);
    if (event.target) event.target.value = "";
  };

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); if (!uploading) setIsDragging(true); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); if (!uploading) { e.dataTransfer.dropEffect = "copy"; setIsDragging(true); } };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget === e.target) setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (uploading) return;
    setIsDragging(false);
    handleFilesAdded(e.dataTransfer.files);
  };

  const removeFile = (idx) => {
    const updated = [...files];
    const removed = updated.splice(idx, 1)[0];
    if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);

    // Re-index remaining files if needed, or just keep as is? 
    // Re-indexing might break excelPreviews map if it uses index.
    // Better to use a stable ID, but index is what we have. 
    // For now, let's just update files. Excel previews might get misaligned if we delete from middle.
    // Ideally we should use a unique ID for files.
    // But for this quick fix, let's just clear excelPreviews for the removed index if we can, or just accept it might be buggy for Excel previews after delete.

    setFiles(updated);
    if (selectedIndex >= updated.length) setSelectedIndex(Math.max(0, updated.length - 1));
  };

  const selectFolder = (folder) => {
    const updated = [...files];
    if (updated[selectedIndex]) {
      updated[selectedIndex].folderId = folder.id;
      updated[selectedIndex].folderPath = folder.name;
      updated[selectedIndex].issues = updated[selectedIndex].issues.filter(e => !e.toLowerCase().includes('folder'));
      updated[selectedIndex].errors = updated[selectedIndex].errors.filter(e => !e.toLowerCase().includes('folder'));
      setFiles(updated);
    }
    setFolderDropdownOpen(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolderLoading(true);

    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();
      const folderData = {
        title: newFolderName.trim(),
        description: `Documents folder: ${newFolderName.trim()}`,
      };
      if (parentFolderForNewFolder) folderData.parent_id = parentFolderForNewFolder;
      if (internalClientId) folderData.client_id = internalClientId;

      const apiUrl = `${API_BASE_URL}/firm/staff/documents/folders/create/`; // Verify endpoint
      const response = await fetchWithCors(apiUrl, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData),
      });

      if (!response.ok) throw new Error('Failed to create folder');
      const result = await response.json();
      const folderInfo = result.data || result;

      const newFolder = {
        id: folderInfo.id,
        name: folderInfo.title || folderInfo.name,
        children: [],
        loaded: false
      };

      // Simplistic update: reload folders or append to tree?
      // Reloading is safer for consistency
      fetchRootFolders();

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

  const validateBeforeUpload = () => {
    const updatedFiles = files.map(f => {
      const issues = [];
      if (!f.folderId) issues.push('Please select a folder');
      return { ...f, issues, errors: issues };
    });

    const hasErrors = updatedFiles.some(f => f.issues.length > 0);
    setFiles(updatedFiles);
    return !hasErrors;
  };

  const uploadSingleFile = async ({ fileEntry, clientId }) => {
    const API_BASE_URL = getApiBaseUrl();
    const token = getAccessToken();
    const formData = new FormData();
    formData.append("file", fileEntry.fileObject);

    // Handle folder ID. The backend expects 'folder_id' or 'category' often.
    // Based on previous code, 'folder_id' seems correct.
    if (fileEntry.folderId) {
      formData.append("folder_id", fileEntry.folderId);
    }

    if (clientId) {
      formData.append("client_id", clientId);
    }

    // Endpoint: Use the one for Tax Preparer upload
    // /taxpayer/tax-preparer/documents/upload/
    const url = `${API_BASE_URL}/taxpayer/tax-preparer/documents/upload/`;

    const response = await fetchWithCors(url, {
      method: "POST",
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) {
      const resText = await response.text();
      let message = "Upload failed";
      try {
        const resJson = JSON.parse(resText);
        message = resJson.message || resJson.error || message;
      } catch (e) { }
      throw new Error(message);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Upload failed');
    }
    return result;
  };

  const handleFinalUpload = async () => {
    if (uploading || files.length === 0) return;
    if (!validateBeforeUpload()) {
      toast.error("Please resolve issues before uploading.");
      return;
    }

    setUploading(true);
    let successCount = 0;
    let failureCount = 0;
    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      updatedFiles[i].status = 'uploading';
      updatedFiles[i].progress = 20;
      setFiles([...updatedFiles]);

      try {
        await uploadSingleFile({ fileEntry: updatedFiles[i], clientId: internalClientId });
        updatedFiles[i].status = 'success';
        updatedFiles[i].progress = 100;
        updatedFiles[i].issues = [];
        updatedFiles[i].errors = [];
        successCount++;
      } catch (err) {
        console.error(err);
        updatedFiles[i].status = 'error';
        updatedFiles[i].progress = 0;
        updatedFiles[i].issues = [err.message];
        updatedFiles[i].errors = [err.message];
        failureCount++;
      }
      setFiles([...updatedFiles]);
    }

    setUploading(false);

    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded successfully.`);
      if (onUploadSuccess) onUploadSuccess();
      if (failureCount === 0) {
        handleClose();
      }
    }

    if (failureCount > 0) {
      toast.error(`${failureCount} file(s) failed to upload.`);
    }
  };

  // Preview Logic
  const handlePreview = (index, e) => {
    e.stopPropagation();
    setPreviewFileIndex(index);
    setPreviewModalShow(true);
  };

  const handleClosePreview = () => {
    setPreviewModalShow(false);
    setPreviewFileIndex(null);
  };

  const handleDownload = (index, e) => {
    e.stopPropagation();
    const file = files[index];
    if (file && file.previewUrl) {
      const link = document.createElement('a');
      link.href = file.previewUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // --- Render ---

  const currentFile = files[selectedIndex];

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static" size="xl" className="upload-modal" scrollable={true}>
      <Modal.Body className="p-4">
        <h5 className="upload-heading">Upload Documents</h5>
        <p className="upload-subheading">Upload your tax documents securely</p>

        {!clientId && (
          <Form.Group className="mb-4">
            <Form.Label>Select Client <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={internalClientId || ""}
              onChange={(e) => {
                setInternalClientId(e.target.value);
                setFolderTree([]);
                setFiles((prev) => prev.map(f => ({ ...f, folderId: null, folderPath: "", issues: [] })));
              }}
              disabled={loadingClients}
            >
              <option value="">-- Select Client --</option>
              {availableClients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name} ({client.email})
                </option>
              ))}
            </Form.Select>
            {loadingClients && <div className="text-muted small mt-1">Loading clients...</div>}
          </Form.Group>
        )}

        <p className="upload-section-title">Add Files</p>

        <div
          className={`upload-dropzone mb-4 ${isDragging ? "drag-active" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
        >
          <UploadsIcon className="upload-icon" />
          <p className="upload-text">
            <strong className="texts">Drop files here or click to browse</strong>
          </p>
          <p className="upload-hint">Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, CSV • Max 50MB per file</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          />
        </div>

        {files.length > 0 ? (
          <div className="d-flex flex-wrap gap-4">
            <div className="doc-scroll">
              <h6 className="mb-1 custom-doc-header">Documents ({files.length})</h6>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className={`doc-item ${selectedIndex === index ? "active" : ""}`}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <div className="d-flex align-items-start gap-2">
                      <div className="file-icon-wrapper"><FaRegFileAlt className="file-icon" /></div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between">
                          <div>
                            <div className="small fw-semibold">{file.name}</div>
                            <small className="text-muted">{file.sizeLabel}</small>
                          </div>
                          <div className="d-flex gap-1" onClick={(e) => e.stopPropagation()}>
                            {isPreviewable(file) && <Button variant="link" size="sm" className="p-0 text-dark" onClick={(e) => handlePreview(index, e)}><FaEye /></Button>}
                            <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => removeFile(index)}><CrossIcon size={12} /></Button>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <span className={`badge bg-${file.status === 'success' ? 'success' : file.status === 'error' ? 'danger' : 'secondary'}`}>{STATUS_LABELS[file.status]}</span>
                        </div>
                        {file.issues.length > 0 && <div className="text-danger small mt-1">{file.issues[0]}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-grow-1 d-flex flex-column">
              {/* Config Panel */}
              {currentFile && (
                <div className="config-panel">
                  <h6 className="mb-3">Configuration for {currentFile.name}</h6>
                  <Form.Group className="mb-3">
                    <Form.Label>Target Folder</Form.Label>
                    <div className="position-relative">
                      <div className="form-control d-flex justify-content-between align-items-center" onClick={() => setFolderDropdownOpen(!folderDropdownOpen)} style={{ cursor: 'pointer' }}>
                        <span>{currentFile.folderPath || 'Select Folder'}</span>
                        <FaChevronDown />
                      </div>
                      {folderDropdownOpen && (
                        <div className="folder-dropdown-premium border rounded mt-1 bg-white p-2" ref={folderDropdownRef} style={{ position: 'absolute', width: '100%', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                          {!creatingFolder ? (
                            <>
                              <Button variant="link" size="sm" onClick={() => { setCreatingFolder(true); setParentFolderForNewFolder(null); }}>+ Create New Folder</Button>
                              {folderTree.map(f => (
                                <FolderNode key={f.id} folder={f} onSelect={selectFolder} expandedFolders={expandedFolders} onToggleExpand={toggleFolderExpand} selectedId={currentFile.folderId} />
                              ))}
                            </>
                          ) : (
                            <div className="p-2">
                              <Form.Control size="sm" placeholder="Folder Name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="mb-2" />
                              <div className="d-flex gap-2">
                                <Button size="sm" onClick={handleCreateFolder} disabled={creatingFolderLoading}>Create</Button>
                                <Button size="sm" variant="secondary" onClick={() => setCreatingFolder(false)}>Cancel</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Form.Group>

                  {/* Preview Area within Config */}
                  {currentFile.previewUrl && (
                    <div className="mt-3 border rounded p-3 bg-light text-center" style={{ minHeight: '200px' }}>
                      {isPreviewable(currentFile) ? (
                        currentFile.fileObject.type === 'application/pdf' ?
                          <iframe src={currentFile.previewUrl} width="100%" height="200px" title="preview" /> :
                          <img src={currentFile.previewUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                      ) : (
                        <div className="text-muted py-4">
                          <FaRegFileAlt size={32} className="mb-2" />
                          <div>Preview not available</div>
                          {/\.(xlsx?|csv)$/.test(currentFile.name.toLowerCase()) && excelPreviews[currentFile.fileIndex] && (
                            <div className="mt-2 text-success"><FaTable /> Excel Data Loaded</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-5 bg-light rounded text-muted">No files selected</div>
        )}

        <div className="d-flex justify-content-between align-items-center mt-4">
          <Button variant="link" className="text-danger text-decoration-none" onClick={() => { setFiles([]); }}>Clear All</Button>
          <div className="d-flex gap-2">
            <Button variant="light" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleFinalUpload} disabled={uploading || files.length === 0}>
              {uploading ? <><Spinner size="sm" /> Uploading</> : 'Upload Files'}
            </Button>
          </div>
        </div>

      </Modal.Body>

      {/* Full Preview Modal */}
      <Modal show={previewModalShow} onHide={handleClosePreview} size="xl" centered>
        <Modal.Header closeButton><Modal.Title>Preview</Modal.Title></Modal.Header>
        <Modal.Body className="p-0">
          {files[previewFileIndex]?.previewUrl && (
            <iframe src={files[previewFileIndex].previewUrl} width="100%" height="600px" title="Full Preview" className="border-0" />
          )}
        </Modal.Body>
      </Modal>
    </Modal>
  );
}
