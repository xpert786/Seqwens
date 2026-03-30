
import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaRegFileAlt, FaChevronDown, FaChevronRight, FaFolder, FaExclamationCircle, FaTable } from "react-icons/fa";
import { UploadsIcon, CrossIcon } from "../component/icons";
import "./TaxUploadModal.css";
import { IoMdClose } from "react-icons/io";
import "../../ClientOnboarding/styles/Upload_Premium.css";
import { toast } from "react-toastify";
import { getApiBaseUrl, fetchWithCors } from "../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../ClientOnboarding/utils/userUtils";
import { taxPreparerDocumentsAPI } from "../../ClientOnboarding/utils/apiUtils";
import * as XLSX from "xlsx";

// --- Constants ---
const STATUS_LABELS = {
    pending: 'Pending',
    uploading: 'Uploading...',
    success: 'Completed',
    error: 'Failed'
};

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

    // UI Logic State
    const [modalErrors, setModalErrors] = useState([]); // Top-level errors
    const [isDragging, setIsDragging] = useState(false);
    const [excelPreviews, setExcelPreviews] = useState({}); // Store parsed Excel data by file index

    const fileInputRef = useRef();
    const folderDropdownRef = useRef();

    // --- Effects ---

    // Initial folder fetch
    useEffect(() => {
        if (show) {
            fetchRootFolders();
        } else {
            resetState();
        }
    }, [show, clientId]);

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
        setFolderTree([]);
        setExcelPreviews({});
    };

    const fetchRootFolders = async () => {
        try {
            setLoadingFolders(true);

            // Fetch folders based on context (specific client or general shared documents)
            const result = clientId
                ? await taxPreparerDocumentsAPI.getClientFoldersSplit(clientId, { folder_id: null })
                : await taxPreparerDocumentsAPI.getSharedFolders({ folder_id: null });

            if (result.success) {
                const data = result.data?.folders || [];
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
        try {
            // Fetch folders based on context
            const result = clientId
                ? await taxPreparerDocumentsAPI.getClientFoldersSplit(clientId, { folder_id: parentId })
                : await taxPreparerDocumentsAPI.getSharedFolders({ folder_id: parentId });

            if (result.success) {
                const data = result.data?.folders || [];
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

        const validFiles = rawFiles.filter(f => isValidFileType(f));
        const invalidFiles = rawFiles.filter(f => !isValidFileType(f));

        if (invalidFiles.length > 0) {
            toast.error(`Ignored ${invalidFiles.length} file(s) with unsupported formats.`);
        }

        const startIndex = files.length;
        const newFiles = validFiles.map((f, idx) => ({
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

        if (newFiles.length > 0) {
            setFiles(prev => [...prev, ...newFiles]);
            setStep(2);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Parse Excel files for preview
        newFiles.forEach((fileEntry, idx) => {
            const fileName = fileEntry.name.toLowerCase();
            if (/\.(xlsx?|csv)$/.test(fileName)) {
                parseExcelFile(fileEntry.fileObject, startIndex + idx);
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
        if (updated.length === 0) setStep(1);
        if (selectedIndex >= updated.length) setSelectedIndex(Math.max(0, updated.length - 1));
    };

    const selectFolder = (folder) => {
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
                formData.append("files", file.fileObject);
                const documentsConfig = [{
                    folder_id: file.folderId || null
                }];
                formData.append("documents", JSON.stringify(documentsConfig));

                if (clientId) {
                    formData.append("client_id", clientId);
                }

                const url = `${API_BASE_URL}/taxpayer/tax-preparer/documents/upload/`;

                const response = await fetchWithCors(url, {
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

    if (!show) return null;

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[9999] p-4 lg:p-8 animate-in fade-in duration-200">
            <div className={`w-full ${step === 1 ? 'max-w-3xl' : 'max-w-6xl'} bg-white rounded-2xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300`}>
                {/* Header Section */}
                <div className="p-6 border-b border-[#E8F0FF] flex justify-between items-center bg-white z-20 shrink-0">
                    <div>
                        <h5 className="m-0 text-xl font-bold text-[#3B4A66] leading-tight" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Upload Documents
                        </h5>
                        <p className="mt-1 text-sm text-gray-500 leading-tight" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Upload tax documents securely for the client.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-1 px-2.5 rounded-full text-gray-400 transition-colors"
                    >
                        <IoMdClose size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-white">
                    {/* Error Summary Panel */}
                    {modalErrors.length > 0 && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-4">
                            <FaExclamationCircle size={20} className="text-red-500 mt-1 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <strong className="block text-sm font-bold text-red-800 mb-1 leading-tight">Important: Please fix the following</strong>
                                <ul className="list-disc list-inside space-y-1">
                                    {modalErrors.map((err, i) => (
                                        <li key={i} className="text-xs text-red-700 leading-normal">{err}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {step === 1 ? (
                        /* Step 1: Selection Dropzone */
                        <div className="py-2">
                            <div
                                className={`premium-dropzone border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${isDragging ? 'border-primary bg-primary/5 ring-8 ring-primary/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current.click()}
                            >
                                <div className="p-4 bg-primary/10 rounded-full text-primary shrink-0 transition-transform group-hover:scale-110">
                                    <UploadsIcon />
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>Drop files here or click to browse</div>
                                    <div className="mt-2 text-sm text-gray-500 max-w-sm mx-auto" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                        Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, CSV • Max 50MB per file
                                    </div>
                                </div>
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
                                <div className="mt-6 p-4 border border-gray-100 rounded-xl bg-gray-50 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-700">{files.length} file(s) selected</span>
                                    <button
                                        type="button"
                                        onClick={() => setFiles([])}
                                        className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Step 2: Configuration View */
                        <div className="flex h-full gap-8 min-h-[500px]">
                            {/* Left Sidebar: File List */}
                            <div className="w-72 shrink-0 flex flex-col border border-gray-100 rounded-2xl bg-gray-50/50 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-white">
                                    <h6 className="m-0 text-sm font-bold text-gray-800">Files ({files.length})</h6>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
                                    {files.map((f, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 relative group ${selectedIndex === idx ? 'bg-white border-primary shadow-sm ring-2 ring-primary/5' : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200'} ${f.errors.length > 0 ? 'border-red-200' : ''}`}
                                            onClick={() => setSelectedIndex(idx)}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shrink-0">
                                                <FaRegFileAlt size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-gray-800 truncate leading-snug">{f.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate leading-snug uppercase tracking-wider mt-0.5">{f.size} • {STATUS_LABELS[f.status]}</div>
                                            </div>
                                            {f.errors.length > 0 && (
                                                <div className="text-red-500 shrink-0">
                                                    <FaExclamationCircle size={14} />
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all shrink-0"
                                            >
                                                <IoMdClose size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Area: Config & Preview */}
                            <div className="flex-1 flex flex-col border border-gray-100 rounded-2xl bg-white overflow-hidden shadow-sm">
                                <div className="flex border-b border-gray-100">
                                    {['Configure', 'Preview'].map((tab) => (
                                        <button
                                            key={tab}
                                            className={`flex-1 py-3 text-sm font-bold transition-all relative ${(!previewMode && tab === 'Configure') || (previewMode && tab === 'Preview') ? 'text-primary' : 'text-gray-400 onClick={() => setPreviewMode(tab === 'Preview')}
                                        >
                                            {tab}
                                            {((!previewMode && tab === 'Configure') || (previewMode && tab === 'Preview')) && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full mx-8" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
                                    {!previewMode ? (
                                        <div className="space-y-8 max-w-xl mx-auto">
                                            <div className="space-y-2">
                                                <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-4">Target Folder</h6>
                                                <div className="relative" ref={folderDropdownRef}>
                                                    <div
                                                       className={`w-full h-12 px-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${folderDropdownOpen ? 'border-primary ring-4 ring-primary/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'} ${currentFile?.errors.some(e => e.includes('folder')) ? 'border-red-300 bg-red-50/10' : ''}`}
                                                        onClick={() => setFolderDropdownOpen(!folderDropdownOpen)}
                                                    >
                                                        <div className="flex items-center gap-3 truncate">
                                                            <FaFolder className="text-amber-400 shrink-0" size={18} />
                                                            <span className={`text-sm font-medium truncate ${currentFile?.folderPath ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                                                                {currentFile?.folderPath || 'Select a destination folder...'}
                                                            </span>
                                                        </div>
                                                        <FaChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${folderDropdownOpen ? 'rotate-180' : ''}`} />
                                                    </div>

                                                    {folderDropdownOpen && (
                                                        <div className="absolute mt-2 top-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-2xl z-[100] p-3 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 origin-top">
                                                            {loadingFolders ? (
                                                                <div className="p-8 flex flex-col items-center justify-center gap-3 text-gray-400 italic text-sm">
                                                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                                    Loading folders...
                                                                </div>
                                                            ) : folderTree.length === 0 ? (
                                                                <div className="p-8 text-center text-sm text-gray-400 italic">No folders found</div>
                                                            ) : (
                                                                <div className="space-y-1">
                                                                    {folderTree.map(f => (
                                                                        <FolderNode
                                                                            key={f.id}
                                                                            folder={f}
                                                                            onSelect={selectFolder}
                                                                            selectedId={currentFile?.folderId}
                                                                            expandedFolders={expandedFolders}
                                                                            onToggleExpand={toggleFolderExpand}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {currentFile?.errors.map((err, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 text-xs font-bold text-red-500 pl-1 mt-2">
                                                        <FaExclamationCircle size={10} /> {err}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50/50 space-y-4">
                                                <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">File Details</h6>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Name</span>
                                                        <span className="text-sm font-bold text-gray-800 break-all leading-tight max-w-[200px] truncate">{currentFile?.name}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estimated Size</span>
                                                        <span className="text-sm font-bold text-gray-800 leading-tight">{currentFile?.size}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed relative overflow-hidden group min-h-[400px]">
                                            {currentFile ? (
                                                (() => {
                                                    const fileType = currentFile.fileObject.type;
                                                    const fileName = currentFile.name.toLowerCase();

                                                    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
                                                        return (
                                                            <iframe
                                                                src={currentFile.previewUrl}
                                                                title="Preview"
                                                                className="w-full h-full border-0 rounded-2xl animate-in fade-in duration-500"
                                                            />
                                                        );
                                                    } else if (fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(fileName)) {
                                                        return (
                                                            <div className="p-8 flex items-center justify-center h-full animate-in zoom-in-95 duration-500">
                                                                <img
                                                                    src={currentFile.previewUrl}
                                                                    alt="Preview"
                                                                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                                                />
                                                            </div>
                                                        );
                                                    } else {
                                                        const isExcel = /\.(xlsx?|csv)$/.test(fileName);
                                                        const excelData = excelPreviews[selectedIndex];

                                                        if (isExcel && excelData && excelData.data && excelData.data.length > 0) {
                                                            return (
                                                                <div className="w-full h-full flex flex-col p-4 animate-in fade-in duration-300 shrink-0">
                                                                    <div className="p-4 bg-emerald-500 text-white rounded-t-2xl flex items-center justify-between shadow-lg z-10 shrink-0">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="p-2 bg-white/20 rounded-lg">
                                                                                <FaTable size={16} />
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sm font-bold leading-tight truncate max-w-[250px]">{currentFile.name}</div>
                                                                                <div className="text-[10px] opacity-90 font-medium leading-tight mt-0.5 uppercase tracking-wider">Sheet: {excelData.sheetName} • {excelData.totalRows} rows</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1 overflow-auto border border-gray-100 border-t-0 bg-white rounded-b-2xl shadow-inner custom-scrollbar shrink-0">
                                                                        <table className="w-full border-collapse text-[13px] leading-relaxed ">
                                                                            <tbody className="divide-y divide-gray-100">
                                                                                {excelData.data.map((row, rowIdx) => (
                                                                                    <tr key={rowIdx} className={`transition-colors ${rowIdx === 0 ? 'bg-gray-50/80 sticky top-0 shadow-sm z-[5]' : 'hover:bg-gray-50/30'}`}>
                                                                                        {row.map((cell, cellIdx) => (
                                                                                            <td key={cellIdx} className={`py-3 px-4 border-r border-gray-50 last:border-r-0 whitespace-nowrap ${rowIdx === 0 ? 'font-bold text-gray-700' : 'text-gray-500'}`}>
                                                                                                {cell !== null && cell !== undefined ? String(cell) : ''}
                                                                                            </td>
                                                                                        ))}
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div className="text-center p-12 animate-in slide-in-from-bottom-2 duration-500 flex flex-col items-center max-w-sm">
                                                                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-white shadow-2xl mb-8 group-hover:scale-110 transition-transform bg-gray-500 shadow-gray-500/20`}>
                                                                    <FaRegFileAlt size={48} />
                                                                </div>
                                                                <h6 className="text-lg font-bold text-gray-800 mb-2 truncate w-full" style={{ fontFamily: 'BasisGrotesquePro' }}>{currentFile.name}</h6>
                                                                <p className="text-xs text-gray-400 italic mb-10 leading-relaxed" style={{ fontFamily: 'BasisGrotesquePro' }}>Preview not available for this file type.</p>
                                                                <a
                                                                    href={currentFile.previewUrl}
                                                                    download={currentFile.name}
                                                                    className="px-10 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-xl shadow-gray-900/10 hover:shadow-gray-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all no-underline inline-block whitespace-nowrap"
                                                                    style={{ fontFamily: 'BasisGrotesquePro' }}
                                                                >
                                                                    Download to View
                                                                </a>
                                                            </div>
                                                        );
                                                    }
                                                })()
                                            ) : (
                                                <div className="text-sm font-bold text-gray-300 italic uppercase tracking-widest leading-none">No file selected</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 px-8 border-t border-[#E8F0FF] flex justify-between items-center bg-gray-50/50 shrink-0">
                    <button
                        type="button"
                        className="px-8 py-3 text-sm font-bold text-gray-500 rounded-xl transition-all active:scale-95"
                        onClick={handleClose}
                        style={{ fontFamily: 'BasisGrotesquePro' }}
                    >
                        Cancel
                    </button>
                    {step === 2 && (
                        <button
                            type="button"
                            className={`px-10 py-3 text-sm font-bold text-white rounded-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap ${uploading ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-[#F56D2D]  shadow-[#F56D2D]/20 onClick={performUpload}
                            disabled={uploading}
                            style={{ fontFamily: 'BasisGrotesquePro' }}
                        >
                            {uploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                                    <span>Uploading...</span>
                                </>
                            ) : (
                                'Complete Upload'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
   );
}
