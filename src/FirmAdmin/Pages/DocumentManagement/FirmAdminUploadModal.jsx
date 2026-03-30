// import React, { useRef, useState, useEffect, useCallback } from "react";
// import { createPortal } from "react-dom";
// import { FaRegFileAlt, FaChevronDown, FaChevronRight, FaFolder, FaTable, FaInfoCircle, FaFileExcel, FaFileWord, FaFileImage, FaFilePdf, FaPlus } from "react-icons/fa";
// import { IoMdClose } from "react-icons/io";
// import { UploadsIcon, CrossIcon } from "../../../ClientOnboarding/components/icons";
// import "../../../ClientOnboarding/styles/Upload.css";
// import * as XLSX from "xlsx";
// import { toast } from "react-toastify";
// import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
// import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
// import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
// import { firmAdminDocumentsAPI } from "../../../ClientOnboarding/utils/apiUtils";

// export default function FirmAdminUploadModal({ show, handleClose, onUploadSuccess }) {
//     const fileInputRef = useRef();
//     const folderDropdownRef = useRef(null);
//     const dropzoneRef = useRef(null);
//     const [files, setFiles] = useState([]);
//     const [selectedIndex, setSelectedIndex] = useState(0);
//     const [step, setStep] = useState(1);
//     const [previewMode, setPreviewMode] = useState(false);
//     const [creatingFolder, setCreatingFolder] = useState(false);
//     const [newFolderName, setNewFolderName] = useState("");
//     const [folderDropdownOpen, setFolderDropdownOpen] = useState(false);
//     const [selectedFolder, setSelectedFolder] = useState("");
//     const [selectedFolderId, setSelectedFolderId] = useState(null);
//     const [validationErrors, setValidationErrors] = useState([]);
//     const [uploading, setUploading] = useState(false);
//     const [creatingFolderLoading, setCreatingFolderLoading] = useState(false);
//     const [parentFolderForNewFolder, setParentFolderForNewFolder] = useState(null);
//     const [isDragging, setIsDragging] = useState(false);

//     // Folder tree - will be populated from API
//     const [folderTree, setFolderTree] = useState([]);
//     const [loadingFolders, setLoadingFolders] = useState(false);
//     const [expandedFolders, setExpandedFolders] = useState(new Set());
//     const [excelPreviewData, setExcelPreviewData] = useState(null);

//     // Parse Excel files for preview
//     useEffect(() => {
//         if (!previewMode || !files[selectedIndex]) {
//             setExcelPreviewData(null);
//             return;
//         }

//         const file = files[selectedIndex];
//         const fileName = file.name.toLowerCase();

//         if (/\.(xlsx|xls|csv)$/i.test(fileName)) {
//             const reader = new FileReader();
//             reader.onload = (e) => {
//                 try {
//                     const data = e.target.result;
//                     const workbook = XLSX.read(data, { type: 'array' });
//                     const firstSheetName = workbook.SheetNames[0];
//                     const worksheet = workbook.Sheets[firstSheetName];
//                     // Limit to first 50 rows for preview performance
//                     const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }).slice(0, 50);
//                     setExcelPreviewData(jsonData);
//                 } catch (err) {
//                     console.error("Excel parse error", err);
//                     setExcelPreviewData(null);
//                 }
//             };
//             reader.readAsArrayBuffer(file.fileObject);
//         } else {
//             setExcelPreviewData(null);
//         }
//     }, [previewMode, selectedIndex, files]);

//     // Handle click outside folder dropdown
//     useEffect(() => {
//         const handleClickOutside = (event) => {
//             if (folderDropdownOpen && folderDropdownRef.current && !folderDropdownRef.current.contains(event.target)) {
//                 setFolderDropdownOpen(false);
//             }
//         };
//         document.addEventListener('mousedown', handleClickOutside);
//         return () => {
//             document.removeEventListener('mousedown', handleClickOutside);
//         };
//     }, [folderDropdownOpen]);

//     // Fetch root folders from API using Firm Admin endpoint - extracted to be reusable
//     const fetchRootFolders = useCallback(async () => {
//         if (!show) return;

//         try {
//             setLoadingFolders(true);
//             // Use browseDocuments for consistency with the main page
//             const response = await firmAdminDocumentsAPI.browseDocuments({});

//             let folders = [];
//             if (response.success && response.data && Array.isArray(response.data.folders)) {
//                 folders = response.data.folders;
//             } else if (response.folders && Array.isArray(response.folders)) {
//                 folders = response.folders;
//             } else if (response.data && Array.isArray(response.data)) {
//                 folders = response.data;
//             }

//             const foldersTree = folders
//                 .filter(folder => folder && (folder.id || folder.name || folder.title))
//                 .map(folder => ({
//                     id: folder.id,
//                     name: folder.title || folder.name || "Untitled Folder",
//                     title: folder.title || folder.name || "Untitled Folder",
//                     description: folder.description || '',
//                     children: [],
//                     expanded: false,
//                     loaded: false,
//                 }));

//             setFolderTree(foldersTree);
//             setExpandedFolders(new Set());
//         } catch (error) {
//             console.error('Error fetching root folders:', error);
//             setFolderTree([]);
//         } finally {
//             setLoadingFolders(false);
//         }
//     }, [show]);

//     useEffect(() => {
//         fetchRootFolders();
//     }, [fetchRootFolders]);



//     // Drag and drop handlers
//     const handleDragEnter = useCallback((e) => {
//         e.preventDefault();
//         e.stopPropagation();
//         setIsDragging(true);
//     }, []);

//     const handleDragLeave = useCallback((e) => {
//         e.preventDefault();
//         e.stopPropagation();
//         if (!e.currentTarget.contains(e.relatedTarget)) {
//             setIsDragging(false);
//         }
//     }, []);

//     const handleDragOver = useCallback((e) => {
//         e.preventDefault();
//         e.stopPropagation();
//     }, []);

//     const handleDrop = useCallback((e) => {
//         e.preventDefault();
//         e.stopPropagation();
//         setIsDragging(false);

//         const droppedFiles = Array.from(e.dataTransfer.files);
//         processFiles(droppedFiles);
//     }, []);




//     // Process files (from drag-drop or file input)
//     const processFiles = (selectedFiles) => {
//         const maxSize = 50 * 1024 * 1024; // 50MB

//         // Filter valid files (only check size)
//         const validFiles = selectedFiles.filter(file => {
//             if (file.size > maxSize) {
//                 toast.error(`File ${file.name} exceeds 50MB limit and was skipped.`, {
//                     position: "top-right",
//                     autoClose: 3000,
//                 });
//                 return false;
//             }
//             return true;
//         });

//         if (validFiles.length === 0) {
//             return;
//         }

//         const newFiles = validFiles.map((file) => ({
//             name: file.name,
//             size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
//             category: "",
//             folderPath: "",
//             status: "Incomplete",
//             file: URL.createObjectURL(file),
//             fileObject: file,
//             categoryId: null,
//             folderId: null,
//         }));
//         setFiles([...files, ...newFiles]);
//         setSelectedIndex(0);
//     };

//     const handleFileSelect = () => fileInputRef.current.click();

//     const handleFileChange = (e) => {
//         const selectedFiles = Array.from(e.target.files);
//         processFiles(selectedFiles);

//         // Reset file input
//         if (fileInputRef.current) {
//             fileInputRef.current.value = '';
//         }
//     };

//     const removeFile = (index) => {
//         const updated = [...files];
//         updated.splice(index, 1);
//         setFiles(updated);
//         if (selectedIndex >= updated.length) setSelectedIndex(0);
//     };



//     const handleFolderSelect = (path, folderId) => {
//         if (!folderId) {
//             console.error('Folder ID is missing for folder:', path);
//             toast.error('Invalid folder selected. Please try again.', {
//                 position: "top-right",
//                 autoClose: 3000,
//             });
//             return;
//         }

//         console.log('Folder selected:', path, 'ID:', folderId);

//         const updated = [...files];
//         updated[selectedIndex].folderPath = path;
//         updated[selectedIndex].folderId = folderId;

//         // Clear validation errors for this file
//         setValidationErrors(prev => prev.filter(err => !err.includes(updated[selectedIndex].name)));

//         setFiles(updated);
//         setSelectedFolder(path);
//         setSelectedFolderId(folderId);
//         setFolderDropdownOpen(false);
//     };

//     const proceedToConfigure = () => {
//         if (files.length > 0) setStep(2);
//     };

//     const resetModal = () => {
//         setStep(1);
//         setFiles([]);
//         setPreviewMode(false);
//         setCreatingFolder(false);
//         setNewFolderName("");
//         setUploading(false);
//         setValidationErrors([]);
//         setCreatingFolderLoading(false);
//         setExpandedFolders(new Set());
//         setIsDragging(false);
//         handleClose();
//     };

//     // Create new category


//     // Fetch subfolders for a specific folder
//     const fetchSubfolders = async (folderId) => {
//         try {
//             const response = await firmAdminDocumentsAPI.browseDocuments({ folder_id: folderId });

//             if (response.success && response.data) {
//                 const subfolders = response.data.folders || [];
//                 return subfolders
//                     .filter(folder => folder.id) // Filter out folders without IDs
//                     .map(folder => ({
//                         id: folder.id,
//                         name: folder.title,
//                         title: folder.title,
//                         description: folder.description || '',
//                         children: [],
//                         expanded: false,
//                         loaded: false,
//                     }));
//             }
//             return [];
//         } catch (error) {
//             console.error('Error fetching subfolders:', error);
//             toast.error('Failed to load subfolders.', {
//                 position: "top-right",
//                 autoClose: 3000,
//             });
//             return [];
//         }
//     };

//     // Helper function to find folder by ID
//     const findFolderById = (tree, folderId) => {
//         for (const folder of tree) {
//             if (folder.id === folderId) {
//                 return folder;
//             }
//             if (folder.children && folder.children.length > 0) {
//                 const found = findFolderById(folder.children, folderId);
//                 if (found) return found;
//             }
//         }
//         return null;
//     };

//     // Update folder tree with subfolders
//     const updateFolderWithSubfolders = (tree, targetFolderId, subfolders) => {
//         return tree.map(folder => {
//             if (folder.id === targetFolderId) {
//                 return {
//                     ...folder,
//                     children: subfolders,
//                     loaded: true,
//                 };
//             }
//             if (folder.children && folder.children.length > 0) {
//                 return {
//                     ...folder,
//                     children: updateFolderWithSubfolders(folder.children, targetFolderId, subfolders),
//                 };
//             }
//             return folder;
//         });
//     };

//     const toggleExpand = async (folder) => {
//         const isCurrentlyExpanded = expandedFolders.has(folder.id);
//         const newExpandedFolders = new Set(expandedFolders);
//         if (isCurrentlyExpanded) {
//             newExpandedFolders.delete(folder.id);
//         } else {
//             newExpandedFolders.add(folder.id);
//         }
//         setExpandedFolders(newExpandedFolders);

//         if (!isCurrentlyExpanded && !folder.loaded && folder.id) {
//             const subfolders = await fetchSubfolders(folder.id);
//             setFolderTree(prevTree => updateFolderWithSubfolders(prevTree, folder.id, subfolders));
//         }
//     };

//     const handleCreateFolder = async () => {
//         if (!newFolderName.trim()) return;

//         setCreatingFolderLoading(true);

//         try {
//             const API_BASE_URL = getApiBaseUrl();
//             const token = getAccessToken();

//             if (!token) {
//                 toast.error('No authentication token found. Please login again.', {
//                     position: "top-right",
//                     autoClose: 3000,
//                 });
//                 return;
//             }

//             const folderData = {
//                 title: newFolderName.trim(),
//                 description: `Documents folder: ${newFolderName.trim()}`,
//                 is_template: false
//             };

//             const config = {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(folderData)
//             };

//             const response = await fetchWithCors(`${API_BASE_URL}/firm/document-folders/`, config);

//             if (!response.ok) {
//                 let errorMessage = `HTTP error! status: ${response.status}`;
//                 try {
//                     const errorData = await response.json();
//                     errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
//                 } catch (parseError) {
//                     console.error('Error parsing create folder response:', parseError);
//                 }
//                 throw new Error(errorMessage);
//             }

//             const result = await response.json();
//             let folderInfo = result;
//             if (result.data) {
//                 folderInfo = result.data;
//             } else if (result.folder) {
//                 folderInfo = result.folder;
//             }

//             // Validate that folder has an ID
//             if (!folderInfo.id) {
//                 console.error('Created folder missing ID:', folderInfo);
//                 toast.warning('Folder created but ID is missing. Refreshing folder list...', {
//                     position: "top-right",
//                     autoClose: 3000,
//                 });
//                 // Refresh folder list from API to get the correct structure
//                 await fetchRootFolders();
//                 setNewFolderName("");
//                 setCreatingFolder(false);
//                 setParentFolderForNewFolder(null);
//                 return;
//             }

//             toast.success("Folder created successfully! Refreshing folder list...", {
//                 position: "top-right",
//                 autoClose: 2000,
//             });

//             // Refresh folder list from API to ensure we have the latest structure with proper IDs
//             await fetchRootFolders();

//             setNewFolderName("");
//             setCreatingFolder(false);
//             setParentFolderForNewFolder(null);

//         } catch (error) {
//             console.error('Error creating folder:', error);
//             const errorMessage = handleAPIError(error);
//             toast.error(errorMessage, {
//                 position: "top-right",
//                 autoClose: 5000,
//             });
//         } finally {
//             setCreatingFolderLoading(false);
//         }
//     };

//     const handleFinalUpload = async () => {
//         const errors = [];

//         // Basic validation - check if folder is selected
//         files.forEach((file) => {
//             if (!file?.folderPath || file.folderPath.trim() === '') {
//                 errors.push(`${file.name}: Please select a folder.`);
//             }
//         });

//         // Check for duplicates
//         const fileNames = files.map(f => f.name.trim().toLowerCase());
//         const duplicates = fileNames.filter((name, idx) => fileNames.indexOf(name) !== idx);
//         if (duplicates.length > 0) {
//             errors.push(`Duplicate files detected: ${[...new Set(duplicates)].join(", ")}`);
//         }

//         setValidationErrors(errors);

//         if (errors.length > 0) {
//             return;
//         }

//         const filesToUpload = files.map((file) => {
//             let folderName = null;

//             // Extract folder name from the folder path (use the last part)
//             if (file.folderPath && file.folderPath.trim() !== '') {
//                 const pathParts = file.folderPath.split(' > ').map(p => p.trim()).filter(p => p);
//                 if (pathParts.length > 0) {
//                     folderName = pathParts[pathParts.length - 1];
//                 }
//             }

//             return {
//                 ...file,
//                 folderName
//             };
//         });

//         setUploading(true);

//         try {
//             const formData = new FormData();

//             filesToUpload.forEach((file) => {
//                 if (file.fileObject) {
//                     formData.append('files', file.fileObject);
//                 }
//             });

//             const documentsMetadata = filesToUpload.map((file) => {
//                 const metadata = {};
//                 // Use folder_name (API now accepts folder names!)
//                 if (file.folderName) {
//                     metadata.folder_name = file.folderName;
//                 }
//                 return metadata;
//             });

//             formData.append('documents_metadata', JSON.stringify(documentsMetadata));

//             const API_BASE_URL = getApiBaseUrl();
//             const token = getAccessToken();

//             if (!token) {
//                 throw new Error('No authentication token found. Please login again.');
//             }

//             const config = {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                 },
//                 body: formData
//             };

//             // Use Firm Admin upload endpoint
//             const response = await fetchWithCors(`${API_BASE_URL}/firm/documents/upload/`, config);

//             if (!response.ok) {
//                 let errorMessage = `HTTP error! status: ${response.status}`;
//                 try {
//                     const errorData = await response.json();
//                     errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
//                 } catch (parseError) {
//                     console.error('Error parsing upload response:', parseError);
//                 }
//                 throw new Error(errorMessage);
//             }

//             const result = await response.json();

//             toast.success("Upload successful!", {
//                 position: "top-right",
//                 autoClose: 3000,
//             });

//             resetModal();
//             if (onUploadSuccess) {
//                 onUploadSuccess();
//             }

//         } catch (error) {
//             console.error('Upload error:', error);
//             const errorMessage = handleAPIError(error);
//             toast.error(errorMessage, {
//                 position: "top-right",
//                 autoClose: 5000,
//             });
//         } finally {
//             setUploading(false);
//         }
//     };

//     // Internal sub-component for folder tree nodes
//     const FolderNode = ({ folder, path = [] }) => {
//         const fullPath = [...path, folder.name].join(" > ");
//         const hasChildren = folder.children && folder.children.length > 0;
//         const isExpanded = expandedFolders.has(folder.id);
//         const showExpandIcon = hasChildren || (!folder.loaded && folder.id);

//         return (
//             <div className="pl-2 mb-0.5 select-none">
//                 <div className="flex items-center gap-1 group">
//                     <div
//                         className="w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded transition-colors shrink-0"
//                         onClick={(e) => {
//                             e.stopPropagation();
//                             if (showExpandIcon) toggleExpand(folder, path);
//                         }}
//                     >
//                         {showExpandIcon ? (
//                             isExpanded ? <FaChevronDown size={10} className="text-gray-400" /> : <FaChevronRight size={10} className="text-gray-400" />
//                         ) : null}
//                     </div>
//                     <div
//                         onClick={() => {
//                             if (!folder.id) {
//                                 toast.error('This folder is missing an ID. Refreshing...');
//                                 fetchRootFolders();
//                                 return;
//                             }
//                             handleFolderSelect(fullPath, folder.id);
//                         }}
//                         className={`flex items-center gap-2 flex-1 py-1.5 px-2 rounded-lg cursor-pointer transition-all ${selectedFolderId === folder.id ? 'bg-primary/5 text-primary' : 'hover:bg-gray-50 text-gray-700'}`}
//                     >
//                         <FaFolder className={`${selectedFolderId === folder.id ? 'text-primary' : 'text-amber-400'} shrink-0`} size={16} />
//                         <span className="text-sm font-medium truncate leading-tight">{folder.name}</span>
//                         {selectedFolderId === folder.id && (
//                             <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
//                         )}
//                     </div>
//                 </div>
//                 {hasChildren && isExpanded && (
//                     <div className="ml-3 border-l border-gray-100 mt-0.5">
//                         {folder.children.map((child, idx) => (
//                             <FolderNode
//                                 key={child.id || `folder-${fullPath}-${idx}`}
//                                 folder={child}
//                                 path={[...path, folder.name]}
//                             />
//                         ))}
//                     </div>
//                 )}
//             </div>
//         );
//     };

//     if (!show) return null;

//     return createPortal(
//         <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[9999] p-4 lg:p-8 animate-in fade-in duration-200">
//             <div className={`w-full ${step === 1 ? 'max-w-3xl' : 'max-w-6xl'} bg-white rounded-2xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300`}>
//                 {/* Header Section */}
//                 <div className="p-6 border-b border-[#E8F0FF] flex justify-between items-center bg-white z-20 shrink-0">
//                     <div>
//                         <h5 className="m-0 text-xl font-bold text-[#3B4A66] leading-tight" style={{ fontFamily: 'BasisGrotesquePro' }}>
//                             Upload Documents
//                         </h5>
//                         <p className="mt-1 text-sm text-gray-500 leading-tight" style={{ fontFamily: 'BasisGrotesquePro' }}>
//                             Upload documents securely for internal or client storage.
//                         </p>
//                     </div>
//                     <button
//                         type="button"
//                         onClick={resetModal}
//                         className="p-1 px-2.5 rounded-full text-gray-400 transition-colors"
//                         style={{ borderRadius: "50%" }}
//                     >
//                         <IoMdClose size={24} />
//                     </button>
//                 </div>

//                 <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-white">
//                     {/* Error Summary Panel */}
//                     {validationErrors.length > 0 && (
//                         <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-4">
//                             <FaExclamationCircle size={20} className="text-red-500 mt-1 shrink-0" />
//                             <div className="flex-1 min-w-0">
//                                 <strong className="block text-sm font-bold text-red-800 mb-1 leading-tight">Important: Please fix the following</strong>
//                                 <ul className="list-disc list-inside space-y-1">
//                                     {validationErrors.map((err, i) => (
//                                         <li key={i} className="text-xs text-red-700 leading-normal">{err}</li>
//                                     ))}
//                                 </ul>
//                             </div>
//                         </div>
//                     )}

//                     {step === 1 ? (
//                         /* Step 1: Selection Dropzone */
//                         <div className="py-2">
//                             <div
//                                 className={`premium-dropzone border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${isDragging ? 'border-primary bg-primary/5 ring-8 ring-primary/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
//                                 onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
//                                 onDragLeave={() => setIsDragging(false)}
//                                 onDrop={handleDrop}
//                                 onClick={handleFileSelect}
//                             >
//                                 <div className="p-4 bg-primary/10 rounded-full text-primary shrink-0 transition-transform group-hover:scale-110">
//                                     <UploadsIcon />
//                                 </div>
//                                 <div className="text-center">
//                                     <div className="text-lg font-bold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>Drop files here or click to browse</div>
//                                     <div className="mt-2 text-sm text-gray-500 max-w-sm mx-auto" style={{ fontFamily: 'BasisGrotesquePro' }}>
//                                         All file formats supported • Max 50MB per file
//                                     </div>
//                                 </div>
//                                 <input
//                                     type="file"
//                                     ref={fileInputRef}
//                                     onChange={handleFileChange}
//                                     multiple
//                                     hidden
//                                     accept="*/*"
//                                 />
//                             </div>

//                             {files.length > 0 && (
//                                 <div className="mt-8 space-y-4">
//                                     <div className="flex items-center justify-between px-2">
//                                         <h6 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Selected Files ({files.length})</h6>
//                                         <button
//                                             type="button"
//                                             onClick={() => setFiles([])}
//                                             className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
//                                         >
//                                             Clear All
//                                         </button>
//                                     </div>
//                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
//                                         {files.map((file, idx) => (
//                                             <div key={idx} className="p-3 border border-gray-100 rounded-xl bg-gray-50 flex items-center gap-3 group relative transition-all hover:bg-white hover:border-gray-200 hover:shadow-sm">
//                                                 <div className="w-10 h-10 rounded-lg bg-gray-200/50 flex items-center justify-center text-primary/70 shrink-0">
//                                                     <FaRegFileAlt size={18} />
//                                                 </div>
//                                                 <div className="flex-1 min-w-0">
//                                                     <div className="text-xs font-bold text-gray-800 truncate leading-snug">{file.name}</div>
//                                                     <div className="text-[10px] text-gray-500 truncate mt-0.5 flex items-center gap-2">
//                                                         <span>{file.size}</span>
//                                                         <span className="w-1 h-1 rounded-full bg-gray-300" />
//                                                         <span>Ready</span>
//                                                     </div>
//                                                 </div>
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => removeFile(idx)}
//                                                     className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all shrink-0"
//                                                 >
//                                                     <IoMdClose size={18} />
//                                                 </button>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     ) : (
//                         /* Step 2: Configuration View */
//                         <div className="flex h-full gap-8 min-h-[500px]">
//                             {/* Left Sidebar: File List */}
//                             <div className="w-72 shrink-0 flex flex-col border border-gray-100 rounded-2xl bg-gray-50/50 overflow-hidden">
//                                 <div className="p-4 border-b border-gray-100 bg-white">
//                                     <h6 className="m-0 text-sm font-bold text-gray-800 leading-tight">Documents ({files.length})</h6>
//                                     <p className="mt-1 text-[10px] text-gray-400 uppercase tracking-widest font-bold">Select to configure</p>
//                                 </div>
//                                 <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
//                                     {files.map((file, idx) => (
//                                         <div
//                                             key={idx}
//                                             className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 relative group ${selectedIndex === idx ? 'bg-white border-primary shadow-sm ring-2 ring-primary/5' : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200'}`}
//                                             onClick={() => setSelectedIndex(idx)}
//                                         >
//                                             <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shrink-0">
//                                                 <FaRegFileAlt size={18} />
//                                             </div>
//                                             <div className="flex-1 min-w-0">
//                                                 <div className="text-xs font-bold text-gray-800 truncate leading-snug">{file.name}</div>
//                                                 <div className="text-[10px] text-gray-500 truncate mt-0.5">{file.size}</div>
//                                             </div>
//                                             <button
//                                                 type="button"
//                                                 onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
//                                                 className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all shrink-0"
//                                             >
//                                                 <IoMdClose size={18} />
//                                             </button>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>

//                             {/* Right Area: Config & Preview */}
//                             <div className="flex-1 flex flex-col border border-gray-100 rounded-2xl bg-white overflow-hidden shadow-sm">
//                                 <div className="flex border-b border-gray-100">
//                                     {['Configure', 'Preview'].map((tab) => (
//                                         <button
//                                             key={tab}
//                                             className={`flex-1 py-3 text-sm font-bold transition-all relative ${(!previewMode && tab === 'Configure') || (previewMode && tab === 'Preview') ? 'text-primary' : 'text-gray-400 onClick={() => setPreviewMode(tab === 'Preview')}
//                                         >
//                                             {tab}
//                                             {((!previewMode && tab === 'Configure') || (previewMode && tab === 'Preview')) && (
//                                                 <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full mx-8" />
//                                             )}
//                                         </button>
//                                     ))}
//                                 </div>

//                                 <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
//                                     {!previewMode ? (
//                                         <div className="space-y-8 max-w-xl mx-auto">
//                                             <div className="space-y-4">
//                                                 <div className="flex justify-between items-end">
//                                                     <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Target Folder</h6>
//                                                     {!creatingFolder ? (
//                                                         <button
//                                                             className="text-xs font-bold text-primary transition-colors flex items-center gap-1"
//                                                             onClick={() => {
//                                                                 setCreatingFolder(true);
//                                                                 setParentFolderForNewFolder(selectedFolderId || null);
//                                                             }}
//                                                         >
//                                                             <FaPlus size={10} /> Create New
//                                                         </button>
//                                                     ) : (
//                                                         <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-200">
//                                                             <input
//                                                                 type="text"
//                                                                 className="h-8 px-3 text-xs border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
//                                                                 placeholder="Folder name..."
//                                                                 value={newFolderName}
//                                                                 onChange={(e) => setNewFolderName(e.target.value)}
//                                                                 autoFocus
//                                                             />
//                                                             <button
//                                                                 className="px-3 h-8 text-[10px] font-bold bg-primary text-white rounded-lg disabled:bg-gray-200"
//                                                                 onClick={handleCreateFolder}
//                                                                 disabled={creatingFolderLoading || !newFolderName.trim()}
//                                                             >
//                                                                 {creatingFolderLoading ? "..." : "Add"}
//                                                             </button>
//                                                             <button
//                                                                 className="px-2 h-8 text-[10px] font-bold text-gray-400 onClick={() => { setCreatingFolder(false); setNewFolderName(""); }}
//                                                             >
//                                                                 Cancel
//                                                             </button>
//                                                         </div>
//                                                     )}
//                                                 </div>

//                                                 <div className="relative" ref={folderDropdownRef}>
//                                                     <div
//                                                        className={`w-full h-12 px-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${folderDropdownOpen ? 'border-primary ring-4 ring-primary/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'} ${validationErrors.some(e => e.includes(files[selectedIndex]?.name) && e.includes('folder')) ? 'border-red-300 bg-red-50/10' : ''}`}
//                                                         onClick={() => setFolderDropdownOpen(!folderDropdownOpen)}
//                                                     >
//                                                         <div className="flex items-center gap-3 truncate">
//                                                             <FaFolder className={`${selectedFolder ? 'text-amber-400' : 'text-gray-300'} shrink-0`} size={18} />
//                                                             <span className={`text-sm font-medium truncate ${selectedFolder ? 'text-gray-800' : 'text-gray-400 italic'}`}>
//                                                                 {selectedFolder || 'Select a destination folder...'}
//                                                             </span>
//                                                         </div>
//                                                         <FaChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${folderDropdownOpen ? 'rotate-180' : ''}`} />
//                                                     </div>

//                                                     {folderDropdownOpen && (
//                                                         <div className="absolute mt-2 top-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-2xl z-[100] p-3 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 origin-top scrollbar-thin">
//                                                             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">AVAILABLE FOLDERS</div>
//                                                             {loadingFolders ? (
//                                                                 <div className="p-8 flex flex-col items-center justify-center gap-3 text-gray-400 italic text-sm">
//                                                                     <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
//                                                                     Loading folders...
//                                                                 </div>
//                                                             ) : folderTree.length === 0 ? (
//                                                                 <div className="p-8 text-center text-sm text-gray-400 italic">No folders found</div>
//                                                             ) : (
//                                                                 <div className="space-y-1">
//                                                                     {folderTree.map(f => (
//                                                                         <FolderNode
//                                                                             key={f.id}
//                                                                             folder={f}
//                                                                         />
//                                                                     ))}
//                                                                 </div>
//                                                             )}
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                             </div>

//                                             <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50/50 space-y-4">
//                                                 <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">File Details</h6>
//                                                 <div className="flex flex-col gap-2">
//                                                     <div className="flex items-center justify-between">
//                                                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Name</span>
//                                                         <span className="text-sm font-bold text-gray-800 break-all leading-tight max-w-[200px] truncate">{files[selectedIndex]?.name}</span>
//                                                     </div>
//                                                     <div className="flex items-center justify-between">
//                                                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estimated Size</span>
//                                                         <span className="text-sm font-bold text-gray-800 leading-tight">{files[selectedIndex]?.size}</span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     ) : (
//                                         <div className="h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed relative overflow-hidden group min-h-[400px]">
//                                             {(() => {
//                                                 const selectedFile = files[selectedIndex];
//                                                 if (!selectedFile) return <div className="text-sm font-bold text-gray-300 italic uppercase tracking-widest leading-none">No file selected</div>;

//                                                 const fileName = selectedFile.name.toLowerCase();
//                                                 const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName);
//                                                 const isPdf = /\.(pdf)$/i.test(fileName);
//                                                 const isExcel = /\.(xlsx|xls|csv)$/i.test(fileName);
//                                                 const isWord = /\.(doc|docx)$/i.test(fileName);

//                                                 if (isImage) {
//                                                     return (
//                                                         <div className="p-8 flex items-center justify-center h-full animate-in zoom-in-95 duration-500">
//                                                             <img
//                                                                 src={selectedFile.file}
//                                                                 alt="Preview"
//                                                                 className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
//                                                             />
//                                                         </div>
//                                                     );
//                                                 } else if (isPdf) {
//                                                     return (
//                                                         <iframe
//                                                             src={selectedFile.file}
//                                                             title="Preview"
//                                                             className="w-full h-full border-0 rounded-2xl animate-in fade-in duration-500"
//                                                         />
//                                                     );
//                                                 } else if (isExcel && excelPreviewData) {
//                                                     return (
//                                                         <div className="w-full h-full flex flex-col p-4 animate-in fade-in duration-300 shrink-0">
//                                                             <div className="p-4 bg-emerald-500 text-white rounded-t-2xl flex items-center justify-between shadow-lg z-10 shrink-0">
//                                                                 <div className="flex items-center gap-3">
//                                                                     <div className="p-2 bg-white/20 rounded-lg">
//                                                                         <FaTable size={16} />
//                                                                     </div>
//                                                                     <div>
//                                                                         <div className="text-sm font-bold leading-tight truncate max-w-[250px]">{selectedFile.name}</div>
//                                                                         <div className="text-[10px] opacity-90 font-medium leading-tight mt-0.5 uppercase tracking-wider">Excel Preview • {excelPreviewData.length} rows</div>
//                                                                     </div>
//                                                                 </div>
//                                                             </div>
//                                                             <div className="flex-1 overflow-auto border border-gray-100 border-t-0 bg-white rounded-b-2xl shadow-inner custom-scrollbar shrink-0">
//                                                                 <table className="w-full border-collapse text-[13px] leading-relaxed ">
//                                                                     <tbody className="divide-y divide-gray-100">
//                                                                         {excelPreviewData.map((row, rowIdx) => (
//                                                                             <tr key={rowIdx} className={`transition-colors ${rowIdx === 0 ? 'bg-gray-50/80 sticky top-0 shadow-sm z-[5]' : 'hover:bg-gray-50/30'}`}>
//                                                                                 {row.map((cell, cellIdx) => (
//                                                                                     <td key={cellIdx} className={`py-3 px-4 border-r border-gray-50 last:border-r-0 whitespace-nowrap ${rowIdx === 0 ? 'font-bold text-gray-700' : 'text-gray-500'}`}>
//                                                                                         {cell !== null && cell !== undefined ? String(cell) : ''}
//                                                                                     </td>
//                                                                                 ))}
//                                                                             </tr>
//                                                                         ))}
//                                                                     </tbody>
//                                                                 </table>
//                                                             </div>
//                                                         </div>
//                                                     );
//                                                 } else {
//                                                     let Icon = FaRegFileAlt;
//                                                     let colorClass = 'bg-gray-500 shadow-gray-500/20';
//                                                     let typeLabel = "File";

//                                                     if (isWord) { Icon = FaFileWord; colorClass = 'bg-blue-500 shadow-blue-500/20'; typeLabel = "Word Doc"; }
//                                                     else if (isExcel) { Icon = FaFileExcel; colorClass = 'bg-green-500 shadow-green-500/20'; typeLabel = "Excel Sheet"; }
//                                                     else if (isPdf) { Icon = FaFilePdf; colorClass = 'bg-red-500 shadow-red-500/20'; typeLabel = "PDF Doc"; }

//                                                     return (
//                                                         <div className="text-center p-12 animate-in slide-in-from-bottom-2 duration-500 flex flex-col items-center max-w-sm">
//                                                             <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-white shadow-2xl mb-8 group-hover:scale-110 transition-transform ${colorClass}`}>
//                                                                 <Icon size={48} />
//                                                             </div>
//                                                             <h6 className="text-lg font-bold text-gray-800 mb-2 truncate w-full" style={{ fontFamily: 'BasisGrotesquePro' }}>{selectedFile.name}</h6>
//                                                             <p className="text-xs text-gray-400 mt-2 mb-10 leading-relaxed uppercase tracking-widest font-bold" style={{ fontFamily: 'BasisGrotesquePro' }}>{typeLabel} • Preview not available</p>
//                                                             <a
//                                                                 href={selectedFile.file}
//                                                                 download={selectedFile.name}
//                                                                 className="px-10 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-xl shadow-gray-900/10 hover:shadow-gray-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all no-underline inline-block whitespace-nowrap"
//                                                                 style={{ fontFamily: 'BasisGrotesquePro' }}
//                                                             >
//                                                                 Download to View
//                                                             </a>
//                                                         </div>
//                                                     );
//                                                 }
//                                             })()}
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </div>

//                 <div className="p-6 px-8 border-t border-[#E8F0FF] flex justify-between items-center bg-gray-50/50 shrink-0">
//                     <button
//                         type="button"
//                         className="px-8 py-3 text-sm font-bold rounded-xl transition-all active:scale-95"
//                         onClick={resetModal}
//                         style={{
//                             fontFamily: 'BasisGrotesquePro',
//                             borderRadius: "10px",
//                             backgroundColor: "#EEF2FF",
//                             color: "#4F46E5",
//                             border: "1px solid #C7D2FE",
//                             boxShadow: "0 2px 6px rgba(79, 70, 229, 0.15)",
//                             cursor: "pointer"
//                         }}
//                         onMouseEnter={(e) => {
//                             e.target.style.backgroundColor = "#E0E7FF";
//                         }}
//                         onMouseLeave={(e) => {
//                             e.target.style.backgroundColor = "#EEF2FF";
//                         }}
//                     >
//                         Cancel
//                     </button>
//                     <button
//                         type="button"
//                         className={`px-10 py-3 text-sm font-bold text-white rounded-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap ${uploading || (step === 1 && files.length === 0) ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-[#F56D2D]  shadow-[#F56D2D]/20 onClick={step === 1 ? proceedToConfigure : handleFinalUpload}
//                         disabled={uploading || (step === 1 && files.length === 0)}
//                         style={{ fontFamily: 'BasisGrotesquePro', borderRadius: "10px" }}
//                     >
//                         {uploading ? (
//                             <>
//                                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
//                                 <span>Uploading...</span>
//                             </>
//                         ) : step === 1 ? (
//                             'Continue to Configure'
//                         ) : (
//                            `Complete Upload (${files.length})`
//                         )}
//                     </button>
//                 </div>
//             </div>
//         </div>,
//         document.body
//     );
// }


import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { FaRegFileAlt, FaChevronDown, FaChevronRight, FaFolder, FaTable, FaInfoCircle, FaFileExcel, FaFileWord, FaFileImage, FaFilePdf, FaPlus, FaExclamationCircle } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
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

    // Fetch root folders from API using the correct endpoint for folders
    const fetchRootFolders = useCallback(async () => {
        if (!show) return;

        try {
            setLoadingFolders(true);
            // Use browseFoldersSplit for getting all folders (same as main DocumentManagement page)
            const response = await firmAdminDocumentsAPI.browseFoldersSplit({});

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

    // Fetch subfolders for a specific folder
    const fetchSubfolders = async (folderId) => {
        try {
            const response = await firmAdminDocumentsAPI.browseFoldersSplit({ folder_id: folderId });

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

    // Internal sub-component for folder tree nodes
    const FolderNode = ({ folder, path = [] }) => {
        const fullPath = [...path, folder.name].join(" > ");
        const hasChildren = folder.children && folder.children.length > 0;
        const isExpanded = expandedFolders.has(folder.id);
        const showExpandIcon = hasChildren || (!folder.loaded && folder.id);

        return (
            <div className="pl-2 mb-0.5 select-none">
                <div className="flex items-center gap-1 group">
                    <div
                        className="w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded transition-colors shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (showExpandIcon) toggleExpand(folder, path);
                        }}
                    >
                        {showExpandIcon ? (
                            isExpanded ? <FaChevronDown size={10} className="text-gray-400" /> : <FaChevronRight size={10} className="text-gray-400" />
                        ) : null}
                    </div>
                    <div
                        onClick={() => {
                            if (!folder.id) {
                                toast.error('This folder is missing an ID. Refreshing...');
                                fetchRootFolders();
                                return;
                            }
                            handleFolderSelect(fullPath, folder.id);
                        }}
                        className={`flex items-center gap-2 flex-1 py-1.5 px-2 rounded-lg cursor-pointer transition-all ${selectedFolderId === folder.id ? 'bg-primary/5 text-primary' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                        <FaFolder className={`${selectedFolderId === folder.id ? 'text-primary' : 'text-amber-400'} shrink-0`} size={16} />
                        <span className="text-sm font-medium truncate leading-tight">{folder.name}</span>
                        {selectedFolderId === folder.id && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="ml-3 border-l border-gray-100 mt-0.5">
                        {folder.children.map((child, idx) => (
                            <FolderNode
                                key={child.id || `folder-${fullPath}-${idx}`}
                                folder={child}
                                path={[...path, folder.name]}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

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
                            Upload documents securely for internal or client storage.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={resetModal}
                        className="p-1 px-2.5 rounded-full text-gray-400 transition-colors"
                        style={{ borderRadius: "50%" }}
                    >
                        <IoMdClose size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-white">
                    {/* Error Summary Panel */}
                    {validationErrors.length > 0 && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-4">
                            <FaExclamationCircle size={20} className="text-red-500 mt-1 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <strong className="block text-sm font-bold text-red-800 mb-1 leading-tight">Important: Please fix the following</strong>
                                <ul className="list-disc list-inside space-y-1">
                                    {validationErrors.map((err, i) => (
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
                                className={`premium-dropzone border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${isDragging ? 'border-primary bg-primary/5 ring-8 ring-primary/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={handleFileSelect}
                            >
                                <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0 transition-transform group-hover:scale-110">
                                    <UploadsIcon />
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>Drop files here or click to browse</div>
                                    <div className="mt-2 text-sm text-gray-500 max-w-sm mx-auto" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                        All file formats supported • Max 50MB per file
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    multiple
                                    hidden
                                    accept="*/*"
                                />
                            </div>

                            {files.length > 0 && (
                                <div className="mt-8 space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h6 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Selected Files ({files.length})</h6>
                                        <button
                                            type="button"
                                            onClick={() => setFiles([])}
                                            className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                        {files.map((file, idx) => (
                                            <div key={idx} className="p-3 border border-gray-100 rounded-xl bg-gray-50 flex items-center gap-3 group relative transition-all hover:bg-white hover:border-gray-200 hover:shadow-sm">
                                                <div className="w-10 h-10 rounded-lg bg-gray-200/50 flex items-center justify-center text-primary/70 shrink-0">
                                                    <FaRegFileAlt size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-gray-800 truncate leading-snug">{file.name}</div>
                                                    <div className="text-[10px] text-gray-500 truncate mt-0.5 flex items-center gap-2">
                                                        <span>{file.size}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                        <span>Ready</span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(idx)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all shrink-0"
                                                >
                                                    <IoMdClose size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Step 2: Configuration View */
                        <div className="flex h-full gap-8 min-h-[500px]">
                            {/* Left Sidebar: File List */}
                            <div className="w-72 shrink-0 flex flex-col border border-gray-100 rounded-2xl bg-gray-50/50 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-white">
                                    <h6 className="m-0 text-sm font-bold text-gray-800 leading-tight">Documents ({files.length})</h6>
                                    <p className="mt-1 text-[10px] text-gray-400 uppercase tracking-widest font-bold">Select to configure</p>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
                                    {files.map((file, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 relative group ${selectedIndex === idx ? 'bg-white border-primary shadow-sm ring-2 ring-primary/5' : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200'}`}
                                            onClick={() => setSelectedIndex(idx)}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shrink-0">
                                                <FaRegFileAlt size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-gray-800 truncate leading-snug">{file.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate mt-0.5">{file.size}</div>
                                            </div>
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
                                {/* FIX 1: Tab buttons - extracted onClick out of className string */}
                                <div className="flex border-b border-gray-100">
                                    {['Configure', 'Preview'].map((tab) => (
                                        <button
                                            key={tab}
                                            className={`flex-1 py-3 text-sm font-bold transition-all relative ${(!previewMode && tab === 'Configure') || (previewMode && tab === 'Preview') ? 'text-primary' : 'text-gray-400'}`}
                                            onClick={() => setPreviewMode(tab === 'Preview')}
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
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Target Folder</h6>
                                                    {!creatingFolder ? (
                                                        <button
                                                            className="text-xs font-bold text-primary transition-colors flex items-center gap-1"
                                                            onClick={() => {
                                                                setCreatingFolder(true);
                                                                setParentFolderForNewFolder(selectedFolderId || null);
                                                            }}
                                                        >
                                                            <FaPlus size={10} /> Create New
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-200">
                                                            <input
                                                                type="text"
                                                                className="h-8 px-3 text-xs border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                                placeholder="Folder name..."
                                                                value={newFolderName}
                                                                onChange={(e) => setNewFolderName(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <button
                                                                className="px-3 h-8 text-[10px] font-bold bg-primary text-white rounded-lg disabled:bg-gray-200"
                                                                onClick={handleCreateFolder}
                                                                disabled={creatingFolderLoading || !newFolderName.trim()}
                                                            >
                                                                {creatingFolderLoading ? "..." : "Add"}
                                                            </button>
                                                            {/* FIX 2: Cancel button - extracted onClick out of className string */}
                                                            <button
                                                                className="px-2 h-8 text-[10px] font-bold text-gray-400"
                                                                onClick={() => { setCreatingFolder(false); setNewFolderName(""); }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="relative" ref={folderDropdownRef}>
                                                    <div
                                                        className={`w-full h-12 px-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${folderDropdownOpen ? 'border-primary ring-4 ring-primary/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'} ${validationErrors.some(e => e.includes(files[selectedIndex]?.name) && e.includes('folder')) ? 'border-red-300 bg-red-50/10' : ''}`}
                                                        onClick={() => setFolderDropdownOpen(!folderDropdownOpen)}
                                                    >
                                                        <div className="flex items-center gap-3 truncate">
                                                            <FaFolder className={`${selectedFolder ? 'text-amber-400' : 'text-gray-300'} shrink-0`} size={18} />
                                                            <span className={`text-sm font-medium truncate ${selectedFolder ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                                                                {selectedFolder || 'Select a destination folder...'}
                                                            </span>
                                                        </div>
                                                        <FaChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${folderDropdownOpen ? 'rotate-180' : ''}`} />
                                                    </div>

                                                    {folderDropdownOpen && (
                                                        <div className="absolute mt-2 top-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-2xl z-[100] p-3 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 origin-top scrollbar-thin">
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">AVAILABLE FOLDERS</div>
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
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50/50 space-y-4">
                                                <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">File Details</h6>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Name</span>
                                                        <span className="text-sm font-bold text-gray-800 break-all leading-tight max-w-[200px] truncate">{files[selectedIndex]?.name}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estimated Size</span>
                                                        <span className="text-sm font-bold text-gray-800 leading-tight">{files[selectedIndex]?.size}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed relative overflow-hidden group min-h-[400px]">
                                            {(() => {
                                                const selectedFile = files[selectedIndex];
                                                if (!selectedFile) return <div className="text-sm font-bold text-gray-300 italic uppercase tracking-widest leading-none">No file selected</div>;

                                                const fileName = selectedFile.name.toLowerCase();
                                                const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName);
                                                const isPdf = /\.(pdf)$/i.test(fileName);
                                                const isExcel = /\.(xlsx|xls|csv)$/i.test(fileName);
                                                const isWord = /\.(doc|docx)$/i.test(fileName);

                                                if (isImage) {
                                                    return (
                                                        <div className="p-8 flex items-center justify-center h-full animate-in zoom-in-95 duration-500">
                                                            <img
                                                                src={selectedFile.file}
                                                                alt="Preview"
                                                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                                            />
                                                        </div>
                                                    );
                                                } else if (isPdf) {
                                                    return (
                                                        <iframe
                                                            src={selectedFile.file}
                                                            title="Preview"
                                                            className="w-full h-full border-0 rounded-2xl animate-in fade-in duration-500"
                                                        />
                                                    );
                                                } else if (isExcel && excelPreviewData) {
                                                    return (
                                                        <div className="w-full h-full flex flex-col p-4 animate-in fade-in duration-300 shrink-0">
                                                            <div className="p-4 bg-emerald-500 text-white rounded-t-2xl flex items-center justify-between shadow-lg z-10 shrink-0">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-white/20 rounded-lg">
                                                                        <FaTable size={16} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-bold leading-tight truncate max-w-[250px]">{selectedFile.name}</div>
                                                                        <div className="text-[10px] opacity-90 font-medium leading-tight mt-0.5 uppercase tracking-wider">Excel Preview • {excelPreviewData.length} rows</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 overflow-auto border border-gray-100 border-t-0 bg-white rounded-b-2xl shadow-inner custom-scrollbar shrink-0">
                                                                <table className="w-full border-collapse text-[13px] leading-relaxed">
                                                                    <tbody className="divide-y divide-gray-100">
                                                                        {excelPreviewData.map((row, rowIdx) => (
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
                                                } else {
                                                    let Icon = FaRegFileAlt;
                                                    let colorClass = 'bg-gray-500 shadow-gray-500/20';
                                                    let typeLabel = "File";

                                                    if (isWord) { Icon = FaFileWord; colorClass = 'bg-blue-500 shadow-blue-500/20'; typeLabel = "Word Doc"; }
                                                    else if (isExcel) { Icon = FaFileExcel; colorClass = 'bg-green-500 shadow-green-500/20'; typeLabel = "Excel Sheet"; }
                                                    else if (isPdf) { Icon = FaFilePdf; colorClass = 'bg-red-500 shadow-red-500/20'; typeLabel = "PDF Doc"; }

                                                    return (
                                                        <div className="text-center p-12 animate-in slide-in-from-bottom-2 duration-500 flex flex-col items-center max-w-sm">
                                                            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-white shadow-2xl mb-8 group-hover:scale-110 transition-transform ${colorClass}`}>
                                                                <Icon size={48} />
                                                            </div>
                                                            <h6 className="text-lg font-bold text-gray-800 mb-2 truncate w-full" style={{ fontFamily: 'BasisGrotesquePro' }}>{selectedFile.name}</h6>
                                                            <p className="text-xs text-gray-400 mt-2 mb-10 leading-relaxed uppercase tracking-widest font-bold" style={{ fontFamily: 'BasisGrotesquePro' }}>{typeLabel} • Preview not available</p>
                                                            <a
                                                                href={selectedFile.file}
                                                                download={selectedFile.name}
                                                                className="px-10 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-xl shadow-gray-900/10 hover:shadow-gray-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all no-underline inline-block whitespace-nowrap"
                                                                style={{ fontFamily: 'BasisGrotesquePro' }}
                                                            >
                                                                Download to View
                                                            </a>
                                                        </div>
                                                    );
                                                }
                                            })()}
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
                        className="px-8 py-3 text-sm font-bold rounded-xl transition-all active:scale-95"
                        onClick={resetModal}
                        style={{
                            fontFamily: 'BasisGrotesquePro',
                            borderRadius: "10px",
                            backgroundColor: "#EEF2FF",
                            color: "#4F46E5",
                            border: "1px solid #C7D2FE",
                            boxShadow: "0 2px 6px rgba(79, 70, 229, 0.15)",
                            cursor: "pointer"
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#E0E7FF";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#EEF2FF";
                        }}
                    >
                        Cancel
                    </button>
                    {/* FIX 3: Upload button - extracted onClick out of className string, fixed unclosed template literal */}
                    <button
                        type="button"
                        className={`px-10 py-3 text-sm font-bold text-white rounded-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap ${uploading || (step === 1 && files.length === 0) ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-[#F56D2D] shadow-[#F56D2D]/20'}`}
                        onClick={step === 1 ? proceedToConfigure : handleFinalUpload}
                        disabled={uploading || (step === 1 && files.length === 0)}
                        style={{ fontFamily: 'BasisGrotesquePro', borderRadius: "10px" }}
                    >
                        {uploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                                <span>Uploading...</span>
                            </>
                        ) : step === 1 ? (
                            'Continue to Configure'
                        ) : (
                            `Complete Upload (${files.length})`
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
