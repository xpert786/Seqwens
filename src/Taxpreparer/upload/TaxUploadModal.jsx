import React, { useRef, useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { FaRegFileAlt, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { UploadsIcon, CrossIcon } from "../component/icons";
import "../styles/taxupload.css";
import { FaFolder } from "react-icons/fa";
import { staffAPI } from "../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
import { getApiBaseUrl, fetchWithCors } from "../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../ClientOnboarding/utils/apiUtils";

export default function TaxUploadModal({ show, handleClose, clientId = null }) {
    const fileInputRef = useRef();
    const folderDropdownRef = useRef(null);
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
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [creatingFolderLoading, setCreatingFolderLoading] = useState(false);
    const [parentFolderForNewFolder, setParentFolderForNewFolder] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [creatingCategory, setCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [creatingCategoryLoading, setCreatingCategoryLoading] = useState(false);

    const handleFinalUpload = async () => {
        const errors = [];

        // Validate all files have category and folder
        files.forEach((file, idx) => {
            if (!file?.category) {
                errors.push(`${file.name}: Please select a document category.`);
            }
            if (!file?.folderPath) {
                errors.push(`${file.name}: Please select a folder.`);
            }
            if (!file?.categoryId) {
                errors.push(`${file.name}: Invalid category selected.`);
            }
            if (!file?.folderId) {
                errors.push(`${file.name}: Invalid folder selected.`);
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

        setUploading(true);

        try {
            // Prepare FormData
            const formData = new FormData();

            // Add all files
            files.forEach((file) => {
                if (file.fileObject) {
                    formData.append('files', file.fileObject);
                }
            });

            // Prepare documents metadata
            const documentsMetadata = files.map((file) => ({
                category_id: file.categoryId,
                folder_id: file.folderId,
            }));

            // Use 'documents' field name as per API documentation (alternative format)
            formData.append('documents', JSON.stringify(documentsMetadata));

            // Get API base URL and token
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            if (!token) {
                throw new Error('No authentication token found. Please login again.');
            }

            // Use tax preparer upload endpoint
            const uploadUrl = `${API_BASE_URL}/taxpayer/tax-preparer/documents/upload/`;

            const config = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Don't set Content-Type for FormData - let browser set it with boundary
                },
                body: formData
            };

            console.log('Upload API Request URL:', uploadUrl);
            console.log('Upload API Request Config:', config);
            console.log('Documents Metadata:', documentsMetadata);

            const response = await fetchWithCors(uploadUrl, config);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.error('Upload API Error Response:', errorData);
                    errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
                } catch (parseError) {
                    console.error('Error parsing upload response:', parseError);
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Upload successful:', result);

            toast.success(result.message || "Documents uploaded successfully!", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });

            // Reset modal after successful upload
            resetModal();

        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = handleAPIError(error);
            const message = typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to upload documents. Please try again.');
            toast.error(message, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } finally {
            setUploading(false);
        }
    };

    const [folderTree, setFolderTree] = useState([]);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

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

    // Fetch root folders when modal opens
    useEffect(() => {
        const fetchRootFolders = async () => {
            if (!show) return;

            try {
                setLoadingFolders(true);
                const API_BASE_URL = getApiBaseUrl();
                const token = getAccessToken();

                if (!token) {
                    console.error('No authentication token found');
                    return;
                }

                const config = {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                };

                let response;
                if (clientId) {
                    // Use client folder browsing API
                    response = await fetchWithCors(`${API_BASE_URL}/firm/staff/folders/browse/?client_id=${clientId}`, config);
                } else {
                    // Use staff's own documents API
                    response = await fetchWithCors(`${API_BASE_URL}/firm/staff/documents/browse/`, config);
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result.success && result.data) {
                    let rootFolders = [];

                    if (clientId) {
                        // Client folder structure
                        if (result.data.subfolders && Array.isArray(result.data.subfolders)) {
                            rootFolders = result.data.subfolders;
                        } else if (result.data.folders && Array.isArray(result.data.folders)) {
                            rootFolders = result.data.folders;
                        } else if (Array.isArray(result.data)) {
                            rootFolders = result.data;
                        }
                    } else {
                        // Staff documents structure
                        if (result.data.folders && Array.isArray(result.data.folders)) {
                            rootFolders = result.data.folders;
                        }
                    }

                    const foldersTree = rootFolders.map(folder => ({
                        id: folder.id,
                        name: folder.title || folder.name,
                        title: folder.title || folder.name,
                        description: folder.description || '',
                        children: [],
                        loaded: false,
                    }));
                    setFolderTree(foldersTree);
                    setExpandedFolders(new Set());
                } else {
                    setFolderTree([]);
                }
            } catch (error) {
                console.error('Error fetching root folders:', error);
                toast.error('Failed to load folders. Please try again.');
                setFolderTree([]);
            } finally {
                setLoadingFolders(false);
            }
        };

        fetchRootFolders();
    }, [show, clientId]);

    // Fetch document categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            if (!show) return; // Only fetch when modal is open

            try {
                setLoadingCategories(true);
                const API_BASE_URL = getApiBaseUrl();
                const token = getAccessToken();

                if (!token) {
                    console.error('No authentication token found');
                    return;
                }

                const config = {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                };

                const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/document-categories/`, config);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log('Categories API response:', result);

                if (result.success && result.data && Array.isArray(result.data)) {
                    // Filter only active categories
                    const activeCategories = result.data.filter(cat => cat.is_active !== false);
                    setCategories(activeCategories);
                } else if (Array.isArray(result)) {
                    // Handle case where API returns array directly
                    const activeCategories = result.filter(cat => cat.is_active !== false);
                    setCategories(activeCategories);
                } else {
                    console.error('Unexpected categories response structure:', result);
                    setCategories([]);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                toast.error('Failed to load document categories. Please try again.');
                setCategories([]);
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
    }, [show]);

    // Create category mapping from fetched categories
    const categoryMapping = categories.reduce((acc, category) => {
        acc[category.name] = category.id;
        return acc;
    }, {});

    const handleFileSelect = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files).map((file) => ({
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
            category: "",
            folderPath: "",
            status: "Incomplete",
            file: URL.createObjectURL(file), // For preview
            fileObject: file, // Store actual File object for upload
            categoryId: null,
            folderId: null,
        }));
        setFiles([...files, ...newFiles]);
        setSelectedIndex(0);
    };

    const removeFile = (index) => {
        const updated = [...files];
        updated.splice(index, 1);
        setFiles(updated);
        if (selectedIndex >= updated.length) setSelectedIndex(0);
    };

    const handleCategoryChange = (e) => {
        const updated = [...files];
        const categoryName = e.target.value;
        updated[selectedIndex].category = categoryName;
        updated[selectedIndex].categoryId = categoryMapping[categoryName] || null;
        setFiles(updated);
    };

    // Fetch subfolders for a specific folder
    const fetchSubfolders = async (folderId) => {
        try {
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            if (!token) {
                return [];
            }

            const config = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };

            let response;
            if (clientId) {
                response = await fetchWithCors(`${API_BASE_URL}/firm/staff/folders/browse/?client_id=${clientId}&folder_id=${folderId}`, config);
            } else {
                response = await fetchWithCors(`${API_BASE_URL}/firm/staff/documents/browse/?folder_id=${folderId}`, config);
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                let subfolders = [];

                if (clientId) {
                    if (result.data.subfolders && Array.isArray(result.data.subfolders)) {
                        subfolders = result.data.subfolders;
                    } else if (result.data.folders && Array.isArray(result.data.folders)) {
                        subfolders = result.data.folders;
                    }
                } else {
                    if (result.data.folders && Array.isArray(result.data.folders)) {
                        subfolders = result.data.folders;
                    }
                }

                return subfolders.map(folder => ({
                    id: folder.id,
                    name: folder.title || folder.name,
                    title: folder.title || folder.name,
                    description: folder.description || '',
                    children: [],
                    loaded: false,
                }));
            }
            return [];
        } catch (error) {
            console.error('Error fetching subfolders:', error);
            return [];
        }
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

    const toggleExpand = async (folder, path = []) => {
        const isCurrentlyExpanded = expandedFolders.has(folder.id);

        const newExpandedFolders = new Set(expandedFolders);
        if (isCurrentlyExpanded) {
            newExpandedFolders.delete(folder.id);
        } else {
            newExpandedFolders.add(folder.id);
        }
        setExpandedFolders(newExpandedFolders);

        // If expanding and subfolders haven't been loaded, fetch them
        if (!isCurrentlyExpanded && !folder.loaded && folder.id) {
            const subfolders = await fetchSubfolders(folder.id);
            setFolderTree(prevTree => updateFolderWithSubfolders(prevTree, folder.id, subfolders));
        }
    };

    const handleFolderSelect = (path, folderId) => {
        const updated = [...files];
        updated[selectedIndex].folderPath = path;
        updated[selectedIndex].folderId = folderId;
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
        setCreatingCategory(false);
        setNewCategoryName("");
        setUploading(false);
        setValidationErrors([]);
        setSelectedFolder("");
        setSelectedFolderId(null);
        setFolderDropdownOpen(false);
        handleClose();
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

    // Create new folder
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        setCreatingFolderLoading(true);

        try {
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            if (!token) {
                toast.error('No authentication token found. Please login again.');
                return;
            }

            const folderData = {
                title: newFolderName.trim(),
                description: `Documents folder: ${newFolderName.trim()}`
            };

            if (parentFolderForNewFolder) {
                folderData.parent_id = parentFolderForNewFolder;
            }

            // Use client folder API if clientId is provided, otherwise use staff documents API
            let apiUrl;
            if (clientId) {
                // For client folders, we might need to use a different endpoint
                // For now, using staff documents API as fallback
                apiUrl = `${API_BASE_URL}/firm/staff/documents/folders/create/`;
            } else {
                apiUrl = `${API_BASE_URL}/firm/staff/documents/folders/create/`;
            }

            const config = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(folderData)
            };

            const response = await fetchWithCors(apiUrl, config);

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
            }

            const newFolderObj = {
                name: folderInfo.title || folderInfo.name || newFolderName.trim(),
                id: folderInfo.id,
                title: folderInfo.title || folderInfo.name || newFolderName.trim(),
                description: folderInfo.description || '',
                children: [],
                loaded: false
            };

            let updatedTree;
            if (parentFolderForNewFolder) {
                updatedTree = updateFolderWithSubfolders(folderTree, parentFolderForNewFolder, [
                    ...(findFolderById(folderTree, parentFolderForNewFolder)?.children || []),
                    newFolderObj
                ]);
            } else {
                updatedTree = [...folderTree, newFolderObj];
            }

            setFolderTree(updatedTree);
            setNewFolderName("");
            setCreatingFolder(false);
            setParentFolderForNewFolder(null);
            toast.success('Folder created successfully!');
        } catch (error) {
            console.error('Error creating folder:', error);
            toast.error(handleAPIError(error));
        } finally {
            setCreatingFolderLoading(false);
        }
    };

    // Create new category
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Please enter a category name', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        setCreatingCategoryLoading(true);

        try {
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            if (!token) {
                toast.error('No authentication token found. Please login again.');
                return;
            }

            // Minimal example - only name is required, description is optional
            const categoryData = {
                name: newCategoryName.trim(),
                description: `Document category: ${newCategoryName.trim()}`,
                is_active: true
            };

            const config = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(categoryData)
            };

            const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/document-categories/`, config);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.error('Create category API error response:', errorData);

                    // Handle validation errors with field-specific messages
                    if (errorData.errors) {
                        const fieldErrors = Object.entries(errorData.errors)
                            .map(([field, errors]) => {
                                const errorList = Array.isArray(errors) ? errors.join(', ') : errors;
                                return `${field}: ${errorList}`;
                            })
                            .join('; ');
                        errorMessage = errorData.message ? `${errorData.message}. ${fieldErrors}` : fieldErrors;
                    } else {
                        errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
                    }
                } catch (parseError) {
                    console.error('Error parsing create category response:', parseError);
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Create category API response:', result);

            // Handle response structure: { success: true, data: {...}, message: "..." }
            if (!result.success) {
                throw new Error(result.message || 'Failed to create category');
            }

            const categoryInfo = result.data;

            const newCategoryObj = {
                id: categoryInfo.id,
                name: categoryInfo.name || newCategoryName.trim(),
                description: categoryInfo.description || '',
                is_active: categoryInfo.is_active !== false
            };

            // Add new category to the list
            setCategories([...categories, newCategoryObj]);

            // Automatically select the newly created category for the current file
            const updated = [...files];
            updated[selectedIndex].category = newCategoryObj.name;
            updated[selectedIndex].categoryId = newCategoryObj.id;
            setFiles(updated);

            toast.success(result.message || 'Category created successfully!', {
                position: "top-right",
                autoClose: 3000,
            });

            setNewCategoryName("");
            setCreatingCategory(false);
        } catch (error) {
            console.error('Error creating category:', error);
            const errorMessage = error.message || 'Failed to create category. Please try again.';
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setCreatingCategoryLoading(false);
        }
    };

    // Render folder tree
    const renderFolderTree = (folders, path = []) =>
        folders.map((folder, idx) => {
            const fullPath = [...path, folder.name].join(" > ");
            const hasChildren = folder.children && folder.children.length > 0;
            const isExpanded = expandedFolders.has(folder.id);
            const showExpandIcon = hasChildren || (!folder.loaded && folder.id);

            return (
                <div key={folder.id || idx} style={{ paddingLeft: '8px', marginBottom: '2px' }}>
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
                            onClick={() => handleFolderSelect(fullPath, folder.id)}
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
        <Modal show={show} onHide={resetModal} centered backdrop="static" size={step === 1 ? "md" : "xl"} className="upload-modal">
            <Modal.Body className="p-4">

                <h5 className="upload-heading">Upload Documents</h5>
                <p className="upload-subheading ">Upload your tax documents securely</p>


                <p className="upload-section-title">Add Files</p>

                <div
                    className="upload-dropzone mb-4 bg-white border rounded p-4 cursor-pointer text-center"
                    onClick={handleFileSelect}
                >
                    <UploadsIcon className="upload-icon" />
                    <p className="upload-text">
                        <strong className="texts">Drop files here or click to browse</strong>
                    </p>
                    <p className="upload-hint">
                        Supported formats: All file types (PDF) - Max 50MB per file
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

                {step === 1 && (
                    <div className="d-flex justify-content-end gap-2">
                        <Button className="btn-cancel-custom" onClick={resetModal}>
                            Cancel
                        </Button>

                        <Button
                            className="btn-upload-custom"
                            onClick={proceedToConfigure}
                            disabled={files.length === 0}
                        >
                            Upload Documents
                        </Button>
                    </div>

                )}
                {step === 2 && (
                    <>
                        <div className="d-flex flex-wrap gap-4 mt-4">
                            <div className="doc-scroll">
                                <h6 className="mb-1 custom-doc-header">Documents ({files.length})</h6>
                                <p className="small text-muted custom-doc-subtext">Click on a document to configure it</p>

                                {files.map((file, idx) => (
                                    <div
                                        key={idx}
                                        className={`doc-item ${selectedIndex === idx ? "active" : ""}`}
                                        onClick={() => setSelectedIndex(idx)}
                                    >
                                        <div className="d-flex justify-content-between align-items-start">
                                            {/* LEFT */}
                                            <div className="d-flex align-items-start gap-2">
                                                {/* File Icon */}
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

                                                    {/* 
                                                    {selectedIndex === idx && (
                                                        <div className="doc-action-btns mt-2">
                                                            <Button
                                                                size="sm"
                                                                className="doc-btn save-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    console.log("Save clicked", file);
                                                                }}
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="doc-btn replace-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    console.log("Replace clicked", file);
                                                                }}
                                                            >
                                                                Replace
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="doc-btn keep-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    console.log("Keep Both clicked", file);
                                                                }}
                                                            >
                                                                Keep Both
                                                            </Button>
                                                        </div>
                                                    )} */}
                                                </div>
                                            </div>

                                            {/* RIGHT */}
                                            <div className="d-flex gap-2 align-items-center">
                                                {/* <span className="custom-badge">{file.status}</span> */}
                                                <span className="remove-icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(idx);
                                                    }}><CrossIcon /></span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>




                            <div className="flex-grow-1 d-flex flex-column">
                                <div className="d-flex gap-2 mb-3">
                                    <Button className={`toggle-btn ${!previewMode ? "active" : ""}`} onClick={() => setPreviewMode(false)}>Configure</Button>
                                    <Button className={`toggle-btn ${previewMode ? "active" : ""}`} onClick={() => setPreviewMode(true)}>Preview</Button>
                                </div>

                                <div className="config-scroll flex-grow-1">
                                    {!previewMode ? (
                                        <div className="config-panel">
                                            <h6 className="mb-1 custom-doc-header">Documents ({files.length})</h6>
                                            <p className="small text-muted custom-doc-subtext">Click on a document to configure it</p>


                                            <Form.Group className="mb-3">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <h6 className="txt">Document Category</h6>
                                                    {!creatingCategory ? (
                                                        <Button
                                                            variant="link"
                                                            className="p-0 small create-folder-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCreatingCategory(true);
                                                            }}
                                                        >
                                                            Create New Category
                                                        </Button>
                                                    ) : (
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Form.Control
                                                                size="sm"
                                                                type="text"
                                                                placeholder="Enter category name"
                                                                value={newCategoryName}
                                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                                disabled={creatingCategoryLoading}
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handleCreateCategory();
                                                                    } else if (e.key === 'Escape') {
                                                                        setCreatingCategory(false);
                                                                        setNewCategoryName("");
                                                                    }
                                                                }}
                                                                style={{ width: "180px" }}
                                                            />
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="p-0"
                                                                onClick={handleCreateCategory}
                                                                disabled={creatingCategoryLoading || !newCategoryName.trim()}
                                                                style={{ fontSize: "12px", minWidth: "50px" }}
                                                            >
                                                                {creatingCategoryLoading ? "..." : "Create"}
                                                            </Button>
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="p-0"
                                                                onClick={() => {
                                                                    setCreatingCategory(false);
                                                                    setNewCategoryName("");
                                                                }}
                                                                disabled={creatingCategoryLoading}
                                                                style={{ fontSize: "12px", minWidth: "50px" }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                                {!creatingCategory && (
                                                    <Form.Select
                                                        className="custom-select"
                                                        value={files[selectedIndex]?.category || ""}
                                                        onChange={handleCategoryChange}
                                                        disabled={loadingCategories}
                                                    >
                                                        <option value="">
                                                            {loadingCategories ? "Loading categories..." : "Select a Category"}
                                                        </option>
                                                        {categories.map((category) => (
                                                            <option key={category.id} value={category.name}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                )}
                                                {categories.length === 0 && !loadingCategories && !creatingCategory && (
                                                    <small className="text-muted" style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>
                                                        No categories available
                                                    </small>
                                                )}
                                            </Form.Group>

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
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCreateFolder();
                                                                }}
                                                                disabled={creatingFolderLoading || !newFolderName.trim()}
                                                            >
                                                                {creatingFolderLoading ? 'Creating...' : 'Add'}
                                                            </Button>
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
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
                                                            {files[selectedIndex]?.folderPath || "No folder selected"} &gt;{" "}
                                                            {files[selectedIndex]?.category || "No category selected"}
                                                        </div>
                                                    </div>

                                                    {/* Folder dropdown content */}
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
                                                            maxHeight: '300px',
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
                                                                {clientId ? "CLIENT FOLDERS" : "FOLDERS"}
                                                            </div>
                                                            {loadingFolders ? (
                                                                <div className="text-center p-3">
                                                                    <small className="text-muted">Loading folders...</small>
                                                                </div>
                                                            ) : folderTree.length === 0 ? (
                                                                <div className="text-center p-3">
                                                                    <small className="text-muted">
                                                                        {clientId ? "No folders found" : "No folders available"}
                                                                    </small>
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
                                        <div className="preview-panel border rounded p-3">
                                            <iframe src={files[selectedIndex]?.file} title="Document Preview" width="100%" height="500px" />
                                        </div>
                                    )}
                                </div>

                                {/* Sticky footer buttons */}
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
};