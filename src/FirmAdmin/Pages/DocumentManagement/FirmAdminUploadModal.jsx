import React, { useRef, useState, useEffect, useCallback } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { FaRegFileAlt, FaChevronDown, FaChevronRight, FaFolder, FaTable, FaInfoCircle, FaFileExcel, FaFileWord, FaFileImage, FaFilePdf } from "react-icons/fa";
import { UploadsIcon, CrossIcon } from "../../../ClientOnboarding/components/icons";
import "../../../ClientOnboarding/styles/Upload.css";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import { firmAdminDocumentsAPI } from "../../../ClientOnboarding/utils/apiUtils";

export default function FirmAdminUploadModal({ show, handleClose, onUploadSuccess }) {
    const fileInputRef = useRef();
    const folderDropdownRef = useRef(null);
    const dropzoneRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [step, setStep] = useState(1);
    const [previewMode, setPreviewMode] = useState(false);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [folderDropdownOpen, setFolderDropdownOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState("");
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [creatingFolderLoading, setCreatingFolderLoading] = useState(false);
    const [parentFolderForNewFolder, setParentFolderForNewFolder] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Folder tree - will be populated from API
    const [folderTree, setFolderTree] = useState([]);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [excelPreviewData, setExcelPreviewData] = useState(null);

    // Parse Excel files for preview
    useEffect(() => {
        if (!previewMode || !files[selectedIndex]) {
            setExcelPreviewData(null);
            return;
        }

        const file = files[selectedIndex];
        const fileName = file.name.toLowerCase();

        if (/\.(xlsx|xls|csv)$/i.test(fileName)) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    // Limit to first 50 rows for preview performance
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }).slice(0, 50);
                    setExcelPreviewData(jsonData);
                } catch (err) {
                    console.error("Excel parse error", err);
                    setExcelPreviewData(null);
                }
            };
            reader.readAsArrayBuffer(file.fileObject);
        } else {
            setExcelPreviewData(null);
        }
    }, [previewMode, selectedIndex, files]);

    // Handle click outside folder dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (folderDropdownOpen && folderDropdownRef.current && !folderDropdownRef.current.contains(event.target)) {
                setFolderDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [folderDropdownOpen]);

    // Fetch root folders from API using Firm Admin endpoint - extracted to be reusable
    const fetchRootFolders = useCallback(async () => {
        if (!show) return;

        try {
            setLoadingFolders(true);
            // Use browseDocuments for consistency with the main page
            const response = await firmAdminDocumentsAPI.browseDocuments({});

            let folders = [];
            if (response.success && response.data && Array.isArray(response.data.folders)) {
                folders = response.data.folders;
            } else if (response.folders && Array.isArray(response.folders)) {
                folders = response.folders;
            } else if (response.data && Array.isArray(response.data)) {
                folders = response.data;
            }

            const foldersTree = folders
                .filter(folder => folder && (folder.id || folder.name || folder.title))
                .map(folder => ({
                    id: folder.id,
                    name: folder.title || folder.name || "Untitled Folder",
                    title: folder.title || folder.name || "Untitled Folder",
                    description: folder.description || '',
                    children: [],
                    expanded: false,
                    loaded: false,
                }));

            setFolderTree(foldersTree);
            setExpandedFolders(new Set());
        } catch (error) {
            console.error('Error fetching root folders:', error);
            setFolderTree([]);
        } finally {
            setLoadingFolders(false);
        }
    }, [show]);

    useEffect(() => {
        fetchRootFolders();
    }, [fetchRootFolders]);



    // Drag and drop handlers
    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        processFiles(droppedFiles);
    }, []);




    // Process files (from drag-drop or file input)
    const processFiles = (selectedFiles) => {
        const maxSize = 50 * 1024 * 1024; // 50MB

        // Filter valid files (only check size)
        const validFiles = selectedFiles.filter(file => {
            if (file.size > maxSize) {
                toast.error(`File ${file.name} exceeds 50MB limit and was skipped.`, {
                    position: "top-right",
                    autoClose: 3000,
                });
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) {
            return;
        }

        const newFiles = validFiles.map((file) => ({
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
            category: "",
            folderPath: "",
            status: "Incomplete",
            file: URL.createObjectURL(file),
            fileObject: file,
            categoryId: null,
            folderId: null,
        }));
        setFiles([...files, ...newFiles]);
        setSelectedIndex(0);
    };

    const handleFileSelect = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        processFiles(selectedFiles);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index) => {
        const updated = [...files];
        updated.splice(index, 1);
        setFiles(updated);
        if (selectedIndex >= updated.length) setSelectedIndex(0);
    };



    const handleFolderSelect = (path, folderId) => {
        if (!folderId) {
            console.error('Folder ID is missing for folder:', path);
            toast.error('Invalid folder selected. Please try again.', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        console.log('Folder selected:', path, 'ID:', folderId);

        const updated = [...files];
        updated[selectedIndex].folderPath = path;
        updated[selectedIndex].folderId = folderId;

        // Clear validation errors for this file
        setValidationErrors(prev => prev.filter(err => !err.includes(updated[selectedIndex].name)));

        setFiles(updated);
        setSelectedFolder(path);
        setSelectedFolderId(folderId);
        setFolderDropdownOpen(false);
    };

    const proceedToConfigure = () => {
        if (files.length > 0) setStep(2);
    };

    const resetModal = () => {
        setStep(1);
        setFiles([]);
        setPreviewMode(false);
        setCreatingFolder(false);
        setNewFolderName("");
        setUploading(false);
        setValidationErrors([]);
        setCreatingFolderLoading(false);
        setExpandedFolders(new Set());
        setIsDragging(false);
        handleClose();
    };

    // Create new category


    // Fetch subfolders for a specific folder
    const fetchSubfolders = async (folderId) => {
        try {
            const response = await firmAdminDocumentsAPI.browseDocuments({ folder_id: folderId });

            if (response.success && response.data) {
                const subfolders = response.data.folders || [];
                return subfolders
                    .filter(folder => folder.id) // Filter out folders without IDs
                    .map(folder => ({
                        id: folder.id,
                        name: folder.title,
                        title: folder.title,
                        description: folder.description || '',
                        children: [],
                        expanded: false,
                        loaded: false,
                    }));
            }
            return [];
        } catch (error) {
            console.error('Error fetching subfolders:', error);
            toast.error('Failed to load subfolders.', {
                position: "top-right",
                autoClose: 3000,
            });
            return [];
        }
    };

    // Helper function to find folder by ID
    const findFolderById = (tree, folderId) => {
        for (const folder of tree) {
            if (folder.id === folderId) {
                return folder;
            }
            if (folder.children && folder.children.length > 0) {
                const found = findFolderById(folder.children, folderId);
                if (found) return found;
            }
        }
        return null;
    };

    // Update folder tree with subfolders
    const updateFolderWithSubfolders = (tree, targetFolderId, subfolders) => {
        return tree.map(folder => {
            if (folder.id === targetFolderId) {
                return {
                    ...folder,
                    children: subfolders,
                    loaded: true,
                };
            }
            if (folder.children && folder.children.length > 0) {
                return {
                    ...folder,
                    children: updateFolderWithSubfolders(folder.children, targetFolderId, subfolders),
                };
            }
            return folder;
        });
    };

    const toggleExpand = async (folder) => {
        const isCurrentlyExpanded = expandedFolders.has(folder.id);
        const newExpandedFolders = new Set(expandedFolders);
        if (isCurrentlyExpanded) {
            newExpandedFolders.delete(folder.id);
        } else {
            newExpandedFolders.add(folder.id);
        }
        setExpandedFolders(newExpandedFolders);

        if (!isCurrentlyExpanded && !folder.loaded && folder.id) {
            const subfolders = await fetchSubfolders(folder.id);
            setFolderTree(prevTree => updateFolderWithSubfolders(prevTree, folder.id, subfolders));
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        setCreatingFolderLoading(true);

        try {
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            if (!token) {
                toast.error('No authentication token found. Please login again.', {
                    position: "top-right",
                    autoClose: 3000,
                });
                return;
            }

            const folderData = {
                title: newFolderName.trim(),
                description: `Documents folder: ${newFolderName.trim()}`,
                is_template: false
            };

            const config = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(folderData)
            };

            const response = await fetchWithCors(`${API_BASE_URL}/firm/document-folders/`, config);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
                } catch (parseError) {
                    console.error('Error parsing create folder response:', parseError);
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            let folderInfo = result;
            if (result.data) {
                folderInfo = result.data;
            } else if (result.folder) {
                folderInfo = result.folder;
            }

            // Validate that folder has an ID
            if (!folderInfo.id) {
                console.error('Created folder missing ID:', folderInfo);
                toast.warning('Folder created but ID is missing. Refreshing folder list...', {
                    position: "top-right",
                    autoClose: 3000,
                });
                // Refresh folder list from API to get the correct structure
                await fetchRootFolders();
                setNewFolderName("");
                setCreatingFolder(false);
                setParentFolderForNewFolder(null);
                return;
            }

            toast.success("Folder created successfully! Refreshing folder list...", {
                position: "top-right",
                autoClose: 2000,
            });

            // Refresh folder list from API to ensure we have the latest structure with proper IDs
            await fetchRootFolders();

            setNewFolderName("");
            setCreatingFolder(false);
            setParentFolderForNewFolder(null);

        } catch (error) {
            console.error('Error creating folder:', error);
            const errorMessage = handleAPIError(error);
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setCreatingFolderLoading(false);
        }
    };

    const handleFinalUpload = async () => {
        const errors = [];

        // Basic validation - check if folder is selected
        files.forEach((file) => {
            if (!file?.folderPath || file.folderPath.trim() === '') {
                errors.push(`${file.name}: Please select a folder.`);
            }
        });

        // Check for duplicates
        const fileNames = files.map(f => f.name.trim().toLowerCase());
        const duplicates = fileNames.filter((name, idx) => fileNames.indexOf(name) !== idx);
        if (duplicates.length > 0) {
            errors.push(`Duplicate files detected: ${[...new Set(duplicates)].join(", ")}`);
        }

        setValidationErrors(errors);

        if (errors.length > 0) {
            return;
        }

        const filesToUpload = files.map((file) => {
            let folderName = null;

            // Extract folder name from the folder path (use the last part)
            if (file.folderPath && file.folderPath.trim() !== '') {
                const pathParts = file.folderPath.split(' > ').map(p => p.trim()).filter(p => p);
                if (pathParts.length > 0) {
                    folderName = pathParts[pathParts.length - 1];
                }
            }

            return {
                ...file,
                folderName
            };
        });

        setUploading(true);

        try {
            const formData = new FormData();

            filesToUpload.forEach((file) => {
                if (file.fileObject) {
                    formData.append('files', file.fileObject);
                }
            });

            const documentsMetadata = filesToUpload.map((file) => {
                const metadata = {};
                // Use folder_name (API now accepts folder names!)
                if (file.folderName) {
                    metadata.folder_name = file.folderName;
                }
                return metadata;
            });

            formData.append('documents_metadata', JSON.stringify(documentsMetadata));

            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            if (!token) {
                throw new Error('No authentication token found. Please login again.');
            }

            const config = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            };

            // Use Firm Admin upload endpoint
            const response = await fetchWithCors(`${API_BASE_URL}/firm/documents/upload/`, config);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
                } catch (parseError) {
                    console.error('Error parsing upload response:', parseError);
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            toast.success("Upload successful!", {
                position: "top-right",
                autoClose: 3000,
            });

            resetModal();
            if (onUploadSuccess) {
                onUploadSuccess();
            }

        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = handleAPIError(error);
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setUploading(false);
        }
    };

    // Render folder tree
    const renderFolderTree = (folders, path = []) =>
        folders.map((folder, idx) => {
            const fullPath = [...path, folder.name].join(" > ");
            const hasChildren = folder.children && folder.children.length > 0;
            const isExpanded = expandedFolders.has(folder.id);
            const showExpandIcon = hasChildren || (!folder.loaded && folder.id);

            // Generate unique key: use ID if available, otherwise use full path + index for uniqueness
            const uniqueKey = folder.id || `${fullPath}-${idx}` || `folder-${idx}`;

            return (
                <div key={uniqueKey} style={{ paddingLeft: '8px', marginBottom: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {showExpandIcon ? (
                            <span
                                onClick={() => toggleExpand(folder, path)}
                                style={{ cursor: 'pointer', width: '12px', display: 'inline-block' }}
                            >
                                {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                            </span>
                        ) : <span style={{ width: '12px' }} />}
                        <div
                            onClick={() => {
                                if (!folder.id) {
                                    console.error('Folder ID is missing for folder:', fullPath);
                                    toast.error('This folder is missing an ID. Refreshing folder list...', {
                                        position: "top-right",
                                        autoClose: 3000,
                                    });
                                    fetchRootFolders();
                                    return;
                                }
                                handleFolderSelect(fullPath, folder.id);
                            }}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flex: 1, padding: '2px 0' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <FaFolder style={{ color: '#F59E0B' }} />
                            <span style={{ fontSize: '14px' }}>{folder.name}</span>
                        </div>
                    </div>
                    {hasChildren && isExpanded && (
                        <div style={{ paddingLeft: '12px' }}>
                            {renderFolderTree(folder.children, [...path, folder.name])}
                        </div>
                    )}
                </div>
            );
        });

    return (
        <Modal
            show={show}
            onHide={resetModal}
            centered
            backdrop="static"
            scrollable
            dialogClassName={step === 1 ? "upload-modal-custom" : "upload-modal-custom-wide"}
        >
            <style>
                {`
                    .upload-modal-custom {
                        max-width: 850px;
                        width: 95%;
                        margin: 1.75rem auto;
                        transition: max-width 0.3s ease-in-out;
                    }
                    .upload-modal-custom-wide {
                        max-width: 1250px;
                        width: 95%;
                        margin: 1.75rem auto;
                        transition: max-width 0.3s ease-in-out;
                    }
                    .modal-body-scroll::-webkit-scrollbar {
                        width: 6px;
                    }
                    .modal-body-scroll::-webkit-scrollbar-track {
                        background: #f1f1f1;
                    }
                    .modal-body-scroll::-webkit-scrollbar-thumb {
                        background: #ccc;
                        border-radius: 10px;
                    }
                    .doc-scroll {
                        max-height: 60vh !important;
                    }
                    .config-scroll {
                        max-height: 60vh !important;
                    }
                `}
            </style>
            <Modal.Body className="p-4 modal-body-scroll" style={{
                overflowY: 'auto',
                maxHeight: '85vh',
                fontSize: '13px'
            }}>
                <h5 className="upload-heading" style={{ fontSize: '18px', fontWeight: '600' }}>Upload Documents</h5>
                <p className="upload-subheading" style={{ fontSize: '13px' }}>Upload your tax documents securely</p>

                <p className="upload-section-title" style={{ fontSize: '14px', fontWeight: '500' }}>Add Files</p>

                <div
                    ref={dropzoneRef}
                    className={`upload-dropzone mb-4 bg-white border rounded p-4 cursor-pointer text-center ${isDragging ? 'border-primary' : ''}`}
                    onClick={handleFileSelect}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                        borderColor: isDragging ? '#3AD6F2' : '#d3d3d3',
                        borderWidth: isDragging ? '3px' : '2px',
                        backgroundColor: isDragging ? '#F0F9FF' : '#fafafa',
                    }}
                >
                    <UploadsIcon className="upload-icon" />
                    <p className="upload-text" style={{ fontSize: '13px' }}>
                        <strong className="texts">Drop files here or click to browse</strong>
                    </p>
                    <p className="upload-hint" style={{ fontSize: '11px' }}>
                        Supported formats: All files supported - Max 50MB per file
                    </p>
                    <input
                        type="file"
                        multiple
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="*/*"
                    />
                </div>

                {step === 1 && files.length > 0 && (
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="m-0 text-sm font-semibold">Selected Files ({files.length})</h6>
                            <Button variant="link" className="p-0 text-decoration-none small text-danger" onClick={() => setFiles([])}>Clear All</Button>
                        </div>
                        <div className="border rounded bg-light" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {files.map((file, idx) => (
                                <div key={idx} className="d-flex justify-content-between align-items-center p-2 border-bottom bg-white m-1 rounded shadow-sm">
                                    <div className="d-flex align-items-center text-truncate" style={{ flex: 1 }}>
                                        <div className="me-2 text-primary">
                                            <FaRegFileAlt />
                                        </div>
                                        <div className="text-truncate" style={{ maxWidth: '80%' }}>
                                            <span className="fw-medium small">{file.name}</span>
                                        </div>
                                        <span className="text-muted ms-2 small border-start ps-2">{file.size}</span>
                                    </div>
                                    <span
                                        className="cursor-pointer p-1 text-gray-400 hover:text-danger"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => removeFile(idx)}
                                        title="Remove file"
                                    >
                                        <CrossIcon />
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="d-flex justify-content-end gap-2">
                        <Button className="" onClick={resetModal}>
                            Cancel
                        </Button>
                        <Button
                            className="btn-upload-custom"
                            onClick={proceedToConfigure}
                            disabled={files.length === 0}
                            style={{ fontSize: '13px' }}
                        >
                            Upload Documents
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <>
                        <div className="d-flex flex-column flex-md-row gap-4 mt-4">
                            <div className="doc-scroll" style={{ flex: '0 0 320px' }}>
                                <h6 className="mb-1 custom-doc-header">Documents ({files.length})</h6>
                                <p className="small text-muted custom-doc-subtext">Click on a document to configure it</p>

                                {files.map((file, idx) => (
                                    <div
                                        key={idx}
                                        className={`doc-item ${selectedIndex === idx ? "active" : ""}`}
                                        onClick={() => setSelectedIndex(idx)}
                                    >
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="d-flex align-items-start gap-2">
                                                <div className="file-icon-wrapper">
                                                    <FaRegFileAlt className="file-icon" />
                                                </div>
                                                <div className="d-flex flex-column w-100">
                                                    <div>
                                                        <div className="small fw-semibold">{file.name}</div>
                                                        <small className="text-muted">{file.size}</small>
                                                    </div>
                                                    {selectedIndex === idx && validationErrors.length > 0 && (
                                                        <div className="mt-2">
                                                            {validationErrors.map((error, i) => (
                                                                <div key={i} className="doc-error-box">
                                                                    <span className="doc-error-icon">!</span>
                                                                    {error}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="d-flex gap-2 align-items-center">
                                                <span
                                                    className="remove-icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(idx);
                                                    }}
                                                >
                                                    <CrossIcon />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
                                <div className="d-flex gap-2 mb-3">
                                    <Button className={`toggle-btn ${!previewMode ? "active" : ""}`} onClick={() => setPreviewMode(false)}>Configure</Button>
                                    <Button className={`toggle-btn ${previewMode ? "active" : ""}`} onClick={() => setPreviewMode(true)}>Preview</Button>
                                </div>

                                <div className="config-scroll flex-grow-1">
                                    {!previewMode ? (
                                        <div className="config-panel">


                                            <Form.Group className="mb-3">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <h6 className="txt">Folder</h6>
                                                    {!creatingFolder ? (
                                                        <Button
                                                            variant="link"
                                                            className="p-0 small create-folder-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCreatingFolder(true);
                                                                setParentFolderForNewFolder(selectedFolderId || null);
                                                            }}
                                                        >
                                                            Create New Folder
                                                        </Button>
                                                    ) : (
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Form.Control
                                                                size="sm"
                                                                type="text"
                                                                placeholder="Enter folder name"
                                                                value={newFolderName}
                                                                onChange={(e) => setNewFolderName(e.target.value)}
                                                                disabled={creatingFolderLoading}
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && newFolderName.trim() && !creatingFolderLoading) {
                                                                        handleCreateFolder();
                                                                    }
                                                                    if (e.key === 'Escape') {
                                                                        setCreatingFolder(false);
                                                                        setNewFolderName('');
                                                                        setParentFolderForNewFolder(null);
                                                                    }
                                                                }}
                                                            />
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={handleCreateFolder}
                                                                disabled={creatingFolderLoading || !newFolderName.trim()}
                                                            >
                                                                {creatingFolderLoading ? "Creating..." : "Add"}
                                                            </Button>
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setCreatingFolder(false);
                                                                    setNewFolderName("");
                                                                    setParentFolderForNewFolder(null);
                                                                }}
                                                                disabled={creatingFolderLoading}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div ref={folderDropdownRef} style={{ position: 'relative' }}>
                                                    <div
                                                        className="d-flex flex-column folder-dropdown-toggle border rounded px-2 py-2 bg-white cursor-pointer"
                                                        onClick={() => setFolderDropdownOpen(!folderDropdownOpen)}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                                            <div className="d-flex align-items-center gap-2">
                                                                {!selectedFolder ? (
                                                                    <span className="custom-select">Select a Folder</span>
                                                                ) : (
                                                                    <span>{selectedFolder}</span>
                                                                )}
                                                            </div>
                                                            {selectedFolder && (
                                                                <Button
                                                                    variant="light"
                                                                    size="sm"
                                                                    className="change-btns-t"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedFolder("");
                                                                        setSelectedFolderId(null);
                                                                        const updated = [...files];
                                                                        updated[selectedIndex].folderPath = "";
                                                                        updated[selectedIndex].folderId = null;
                                                                        setFiles(updated);
                                                                    }}
                                                                >
                                                                    ×
                                                                </Button>
                                                            )}
                                                            <FaChevronDown
                                                                size={12}
                                                                style={{
                                                                    color: '#9CA3AF',
                                                                    marginLeft: '8px',
                                                                    transform: folderDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                    transition: 'transform 0.2s'
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="small text-muted">
                                                            {files[selectedIndex]?.name || "N/A"} &gt;{" "}
                                                            {files[selectedIndex]?.folderPath || "No folder selected"}
                                                        </div>
                                                    </div>

                                                    {folderDropdownOpen && (
                                                        <div className="folder-dropdown-content" style={{
                                                            position: 'absolute',
                                                            top: '100%',
                                                            left: 0,
                                                            right: 0,
                                                            marginTop: '4px',
                                                            backgroundColor: 'white',
                                                            border: '1px solid #E5E7EB',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                            maxHeight: '450px',
                                                            overflowY: 'auto',
                                                            zIndex: 1000,
                                                            padding: '8px'
                                                        }}>
                                                            <div style={{
                                                                fontSize: '12px',
                                                                color: '#6B7280',
                                                                marginBottom: '8px',
                                                                fontWeight: '500',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.5px'
                                                            }}>
                                                                FOLDERS
                                                            </div>
                                                            {loadingFolders ? (
                                                                <div className="text-center p-3">
                                                                    <small className="text-muted">Loading folders...</small>
                                                                </div>
                                                            ) : folderTree.length === 0 ? (
                                                                <div className="text-center p-3">
                                                                    <small className="text-muted">No folders available</small>
                                                                </div>
                                                            ) : (
                                                                renderFolderTree(folderTree)
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </Form.Group>
                                        </div>
                                    ) : (
                                        <div className="preview-panel border rounded p-3 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '450px', maxHeight: '600px', backgroundColor: '#f8f9fa' }}>
                                            {(() => {
                                                const selectedFile = files[selectedIndex];
                                                if (!selectedFile) return <p className="text-muted">No file selected</p>;

                                                const fileName = selectedFile.name.toLowerCase();
                                                const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName);
                                                const isPdf = /\.(pdf)$/i.test(fileName);
                                                const isExcel = /\.(xlsx|xls|csv)$/i.test(fileName);
                                                const isWord = /\.(doc|docx)$/i.test(fileName);

                                                if (isImage) {
                                                    return (
                                                        <div className="text-center w-100 h-100" style={{ overflow: 'hidden' }}>
                                                            <img
                                                                src={selectedFile.file}
                                                                alt="Preview"
                                                                style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                                            />
                                                        </div>
                                                    );
                                                } else if (isPdf) {
                                                    return <iframe src={selectedFile.file} title="Document Preview" width="100%" height="500px" style={{ border: 'none', borderRadius: '4px' }} />;
                                                } else if (isExcel && excelPreviewData) {
                                                    return (
                                                        <div className="w-100 bg-white p-2 rounded shadow-sm" style={{ maxHeight: '500px', overflow: 'auto' }}>
                                                            <div className="d-flex align-items-center mb-2 px-2 py-1 bg-light rounded text-success">
                                                                <FaFileExcel className="me-2" />
                                                                <small className="fw-bold">Excel Preview: {selectedFile.name}</small>
                                                            </div>
                                                            <div className="table-responsive">
                                                                <table className="table table-bordered table-sm table-hover small mb-0" style={{ fontSize: '0.8rem' }}>
                                                                    <tbody>
                                                                        {excelPreviewData.map((row, rIdx) => (
                                                                            <tr key={rIdx}>
                                                                                {row.map((cell, cIdx) => (
                                                                                    <td key={cIdx} style={{ padding: '4px 8px', whiteSpace: 'nowrap', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                        {cell}
                                                                                    </td>
                                                                                ))}
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            {excelPreviewData.length >= 50 && (
                                                                <div className="text-center p-2 text-muted small fst-italic">
                                                                    Preview limited to first 50 rows
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                } else {
                                                    // Fallback for Word or unparsed content
                                                    let Icon = FaRegFileAlt;
                                                    let color = '#6c757d';
                                                    let typeLabel = "File";

                                                    if (isWord) { Icon = FaFileWord; color = '#0d6efd'; typeLabel = "Word Document"; }
                                                    else if (isExcel) { Icon = FaFileExcel; color = '#198754'; typeLabel = "Excel Spreadsheet"; }
                                                    else if (isPdf) { Icon = FaFilePdf; color = '#dc3545'; typeLabel = "PDF Document"; }
                                                    else if (isImage) { Icon = FaFileImage; color = '#0dcaf0'; typeLabel = "Image"; }

                                                    return (
                                                        <div className="text-center p-5 bg-white rounded shadow-sm border" style={{ maxWidth: '400px' }}>
                                                            <div className="mb-3">
                                                                <Icon size={64} color={color} />
                                                            </div>
                                                            <h5 className="mb-2 text-break">{selectedFile.name}</h5>
                                                            <p className="text-muted mb-1">{typeLabel}</p>
                                                            <span className="badge bg-light text-dark border">{selectedFile.size}</span>
                                                            <div className="mt-4 pt-3 border-top">
                                                                <p className="small text-muted mb-0">
                                                                    <FaInfoCircle className="me-1" />
                                                                    Preview not available for this file type.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    )}
                                </div>

                                <div className="sticky-footer mt-3 d-flex justify-content-end gap-2">
                                    <Button className="btn-cancel-custom" onClick={resetModal}>
                                        Cancel
                                    </Button>
                                    <Button
                                        className="btn-upload-custom"
                                        onClick={handleFinalUpload}
                                        disabled={uploading}
                                    >
                                        {uploading ? "Uploading..." : `Upload ${files.length} File${files.length !== 1 ? "s" : ""}`}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
}

