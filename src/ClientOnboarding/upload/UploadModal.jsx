import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { FaRegFileAlt, FaChevronDown, FaChevronRight, FaFolder, FaExclamationCircle, FaTable } from "react-icons/fa";
import { UploadsIcon, CrossIcon } from "../components/icons";
import "../styles/Upload_Premium.css";
import { toast } from "react-toastify";
import { getApiBaseUrl, fetchWithCors } from "../utils/corsConfig";
import { getAccessToken } from "../utils/userUtils";
import { handleAPIError } from "../utils/apiUtils";
import * as XLSX from "xlsx";

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

// --- Main Component ---

export default function UploadModal({ show, handleClose, onUploadSuccess }) {
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

    // UI Logic State
    const [modalErrors, setModalErrors] = useState([]); // Top-level errors
    const [isDragging, setIsDragging] = useState(false);
    const [excelPreviews, setExcelPreviews] = useState({}); // Store parsed Excel data by file index

    const fileInputRef = useRef();
    const folderDropdownRef = useRef();

    // --- Effects ---

    // Initial folder fetch
    useEffect(() => {
        if (show) fetchRootFolders();
        else resetState();
    }, [show]);

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
    };

    const fetchRootFolders = async () => {
        try {
            setLoadingFolders(true);
            const token = getAccessToken();
            const API_BASE_URL = getApiBaseUrl();

            const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/folders/browse/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch folders');
            const result = await response.json();

            if (result.success) {
                const data = result.data?.folders || result.subfolders || result.data || [];
                const formatted = data.map(f => ({
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
            const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/folders/browse/?folder_id=${parentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                const data = result.data?.subfolders || result.subfolders || result.data || [];
                return data.map(f => ({
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

    const handleFileChange = (e) => {
        const rawFiles = Array.from(e.target.files);
        processFiles(rawFiles);
    };

    const processFiles = (rawFiles) => {
        // Allow all files
        const startIndex = files.length;
        const newFiles = rawFiles.map((f, idx) => ({
            name: f.name,
            size: (f.size / (1024 * 1024)).toFixed(2) + " MB",
            fileObject: f,
            previewUrl: URL.createObjectURL(f),
            folderId: null,
            folderPath: '',
            errors: [],
            status: 'pending',
            fileIndex: startIndex + idx
        }));

        setFiles(prev => [...prev, ...newFiles]);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Parse Excel files for preview
        newFiles.forEach((fileEntry, idx) => {
            const fileName = fileEntry.name.toLowerCase();
            if (/\.(xlsx?|csv)$/.test(fileName)) {
                parseExcelFile(fileEntry.fileObject, startIndex + idx);
            }
        });
    };

    // Function to parse Excel files
    const parseExcelFile = async (file, fileIndex) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Limit to first 100 rows and 10 columns for preview
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

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(Array.from(e.dataTransfer.files));
    };

    const removeFile = (idx) => {
        const updated = [...files];
        const removed = updated.splice(idx, 1)[0];
        if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
        setFiles(updated);
        if (selectedIndex >= updated.length) setSelectedIndex(Math.max(0, updated.length - 1));
    };

    const selectFolder = (folder, path = []) => {
        // Path calculation is complex with nested tree, simplify by using current display or a helper
        // For simplicity in this UI, we just use the name for display if full path is too hard to track reactively
        const updated = [...files];
        updated[selectedIndex].folderId = folder.id;
        updated[selectedIndex].folderPath = folder.name; // In a full implementation, this should be the breadcrumb
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
            setFiles([...finalFiles]);

            try {
                const formData = new FormData();
                formData.append('file', file.fileObject);
                formData.append('folder_id', file.folderId);

                const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/documents/upload/`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    finalFiles[i].status = 'success';
                    finalFiles[i].errors = [];
                    successCount++;
                } else {
                    const msg = result.message || 'Upload failed';
                    finalFiles[i].status = 'error';
                    finalFiles[i].errors = [msg];
                }
            } catch (err) {
                finalFiles[i].status = 'error';
                finalFiles[i].errors = ['Network error occurred'];
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
        }
    };

    // --- Render Helpers ---

    const currentFile = files[selectedIndex];

    return (
        <Modal
            show={show}
            onHide={handleClose}
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
                            <p className="upload-subheading mb-0">Upload your tax documents securely to Seqwens</p>
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
                                <div className="dropzone-hint">Supported formats: All files (PDF, Images, Excel, etc.) • Max 50MB per file</div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    multiple
                                    hidden
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
                                                <div className="file-meta-txt">{f.size} • {f.status}</div>
                                            </div>
                                            {f.errors.length > 0 && <FaExclamationCircle className="error-indicator" />}
                                            <span
                                                className="ms-2 text-muted"
                                                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                            >
                                                <CrossIcon size={14} />
                                            </span>
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
                                            <Form.Group className="mb-4">
                                                <Form.Label className="small fw-600 text-muted uppercase">Target Folder</Form.Label>
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
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="preview-container h-100 d-flex align-items-center justify-content-center bg-light border rounded">
                                            {currentFile ? (
                                                (() => {
                                                    const fileType = currentFile.fileObject.type;
                                                    const fileName = currentFile.name.toLowerCase();

                                                    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
                                                        return (
                                                            <iframe
                                                                src={currentFile.previewUrl}
                                                                title="Preview"
                                                                width="100%"
                                                                height="100%"
                                                                className="border-0"
                                                            />
                                                        );
                                                    } else if (fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(fileName)) {
                                                        return (
                                                            <img
                                                                src={currentFile.previewUrl}
                                                                alt="Preview"
                                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                            />
                                                        );
                                                    } else {
                                                        // Get file extension for icon display
                                                        const ext = fileName.split('.').pop().toUpperCase();
                                                        const isExcel = /\.(xlsx?|csv)$/.test(fileName);
                                                        const isWord = /\.(docx?|rtf)$/.test(fileName);
                                                        const excelData = excelPreviews[selectedIndex];

                                                        // If it's an Excel file and we have parsed data, show table
                                                        if (isExcel && excelData && excelData.data && excelData.data.length > 0) {
                                                            return (
                                                                <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
                                                                    <div style={{
                                                                        padding: '12px 16px',
                                                                        backgroundColor: '#22C55E',
                                                                        color: 'white',
                                                                        borderRadius: '8px 8px 0 0',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'space-between'
                                                                    }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <FaTable size={18} />
                                                                            <span style={{ fontWeight: '600' }}>{currentFile.name}</span>
                                                                        </div>
                                                                        <span style={{ fontSize: '12px', opacity: 0.9 }}>
                                                                            Sheet: {excelData.sheetName} • {excelData.totalRows} rows
                                                                        </span>
                                                                    </div>
                                                                    <div style={{
                                                                        maxHeight: '350px',
                                                                        overflow: 'auto',
                                                                        border: '1px solid #E5E7EB',
                                                                        borderTop: 'none',
                                                                        borderRadius: '0 0 8px 8px'
                                                                    }}>
                                                                        <table style={{
                                                                            width: '100%',
                                                                            borderCollapse: 'collapse',
                                                                            fontSize: '13px'
                                                                        }}>
                                                                            <tbody>
                                                                                {excelData.data.map((row, rowIdx) => (
                                                                                    <tr key={rowIdx} style={{
                                                                                        backgroundColor: rowIdx === 0 ? '#F3F4F6' : (rowIdx % 2 === 0 ? '#FAFAFA' : 'white')
                                                                                    }}>
                                                                                        {row.map((cell, cellIdx) => (
                                                                                            <td key={cellIdx} style={{
                                                                                                padding: '8px 12px',
                                                                                                borderBottom: '1px solid #E5E7EB',
                                                                                                borderRight: '1px solid #E5E7EB',
                                                                                                whiteSpace: 'nowrap',
                                                                                                fontWeight: rowIdx === 0 ? '600' : 'normal',
                                                                                                color: rowIdx === 0 ? '#374151' : '#6B7280'
                                                                                            }}>
                                                                                                {cell !== null && cell !== undefined ? String(cell) : ''}
                                                                                            </td>
                                                                                        ))}
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                    {excelData.totalRows > 100 && (
                                                                        <div style={{
                                                                            padding: '8px',
                                                                            textAlign: 'center',
                                                                            backgroundColor: '#FEF3C7',
                                                                            borderRadius: '0 0 8px 8px',
                                                                            fontSize: '12px',
                                                                            color: '#92400E'
                                                                        }}>
                                                                            Showing first 100 rows. Download file to view all {excelData.totalRows} rows.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div className="text-center p-4" style={{
                                                                backgroundColor: '#F8FAFC',
                                                                borderRadius: '12px',
                                                                border: '1px dashed #E2E8F0',
                                                                minHeight: '200px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                <div style={{
                                                                    width: '80px',
                                                                    height: '80px',
                                                                    borderRadius: '16px',
                                                                    backgroundColor: isExcel ? '#22C55E' : isWord ? '#3B82F6' : '#6B7280',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    marginBottom: '16px'
                                                                }}>
                                                                    <FaRegFileAlt size={36} color="white" />
                                                                </div>
                                                                <p style={{
                                                                    fontSize: '16px',
                                                                    fontWeight: '600',
                                                                    color: '#1F2937',
                                                                    marginBottom: '4px'
                                                                }}>{currentFile.name}</p>
                                                                <p style={{
                                                                    fontSize: '14px',
                                                                    color: '#6B7280',
                                                                    marginBottom: '8px'
                                                                }}>{ext} File • {currentFile.size}</p>
                                                                <p style={{
                                                                    fontSize: '13px',
                                                                    color: '#9CA3AF',
                                                                    marginBottom: '16px'
                                                                }}>{isExcel ? 'Loading preview...' : 'Preview not available in browser'}</p>
                                                                <a
                                                                    href={currentFile.previewUrl}
                                                                    download={currentFile.name}
                                                                    className="btn btn-sm"
                                                                    style={{
                                                                        backgroundColor: '#F56D2D',
                                                                        color: 'white',
                                                                        padding: '8px 20px',
                                                                        borderRadius: '8px',
                                                                        textDecoration: 'none'
                                                                    }}
                                                                >
                                                                    Download to View
                                                                </a>
                                                            </div>
                                                        );
                                                    }
                                                })()
                                            ) : (
                                                <div className="text-muted">No file selected</div>
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
                            onClick={() => setStep(2)}
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
        </Modal>
    );
}
