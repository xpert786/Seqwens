import React, { useRef, useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { FaRegFileAlt, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { UploadsIcon, CrossIcon } from "../components/icons";
import "../styles/Upload.css";
import { FaFolder } from "react-icons/fa";
import { toast } from "react-toastify";
import { getApiBaseUrl, fetchWithCors } from "../utils/corsConfig";
import { getAccessToken } from "../utils/userUtils";
import { handleAPIError } from "../utils/apiUtils";


export default function UploadModal({ show, handleClose }) {
    const fileInputRef = useRef();
    const [files, setFiles] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [step, setStep] = useState(1);
    const [previewMode, setPreviewMode] = useState(false);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [folderDropdownOpen, setFolderDropdownOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState("");
    const [validationErrors, setValidationErrors] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [creatingFolderLoading, setCreatingFolderLoading] = useState(false);

    // Fetch root folders from API
    useEffect(() => {
        const fetchRootFolders = async () => {
            if (!show) return; // Only fetch when modal is open
            
            try {
                setLoadingFolders(true);
                const API_BASE_URL = getApiBaseUrl();
                const token = getAccessToken();

                if (!token) {
                    console.error('No authentication token found');
                    return;
                }

                // Fetch root folders (no folder_id parameter)
                const config = {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                };

                const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/folders/browse/`, config);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log('Root folders API response:', result);

                if (result.success) {
                    // Convert API response to folder tree structure
                    // Handle different response structures:
                    // - Direct subfolders array
                    // - Data object with subfolders
                    // - Current folder with subfolders (for root, current_folder might be null)
                    let rootFolders = [];
                    
                    if (result.subfolders && Array.isArray(result.subfolders)) {
                        rootFolders = result.subfolders;
                    } else if (result.data && Array.isArray(result.data)) {
                        rootFolders = result.data;
                    } else if (result.data && result.data.subfolders && Array.isArray(result.data.subfolders)) {
                        rootFolders = result.data.subfolders;
                    }

                    const foldersTree = rootFolders.map(folder => ({
                        id: folder.id,
                        name: folder.title || folder.name,
                        title: folder.title || folder.name,
                        description: folder.description || '',
                        children: [],
                        expanded: false,
                        loaded: false, // Track if subfolders have been loaded
                    }));
                    setFolderTree(foldersTree);
                } else {
                    console.error('Unexpected folders response structure:', result);
                    setFolderTree([]);
                }
            } catch (error) {
                console.error('Error fetching root folders:', error);
                toast.error('Failed to load folders. Please refresh the page.', {
                    position: "top-right",
                    autoClose: 3000,
                });
                setFolderTree([]);
            } finally {
                setLoadingFolders(false);
            }
        };

        fetchRootFolders();
    }, [show]);

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
                    const activeCategories = result.data.filter(cat => cat.is_active);
                    setCategories(activeCategories);
                } else {
                    console.error('Unexpected categories response structure:', result);
                    setCategories([]);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                toast.error('Failed to load document categories. Please refresh the page.', {
                    position: "top-right",
                    autoClose: 3000,
                });
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

            formData.append('documents_metadata', JSON.stringify(documentsMetadata));

            // Get API base URL and token
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            if (!token) {
                throw new Error('No authentication token found. Please login again.');
            }

            // Make API request
            const config = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Don't set Content-Type for FormData - let browser set it with boundary
                },
                body: formData
            };

            console.log('Upload API Request URL:', `${API_BASE_URL}/taxpayer/documents/upload/`);
            console.log('Upload API Request Config:', config);
            console.log('Documents Metadata:', documentsMetadata);

            const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/documents/upload/`, config);

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

            toast.success("Upload successful!", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                icon: false,
                className: "custom-toast-success",
                bodyClassName: "custom-toast-body",
            });

            // Reset modal after successful upload
            resetModal();

        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = handleAPIError(error);
            toast.error(errorMessage, {
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

    // Folder tree - will be populated from API
    const [folderTree, setFolderTree] = useState([]);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState(new Set()); // Track which folders are expanded

    // Helper function to find folder ID by path
    const findFolderIdByPath = (path, tree = folderTree, currentPath = []) => {
        for (const folder of tree) {
            const fullPath = [...currentPath, folder.name].join(" > ");
            if (fullPath === path && folder.id) {
                return folder.id;
            }
            if (folder.children && folder.children.length > 0) {
                const found = findFolderIdByPath(path, folder.children, [...currentPath, folder.name]);
                if (found) return found;
            }
        }
        return null;
    };

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
        updated[selectedIndex].category = e.target.value;
        updated[selectedIndex].categoryId = categoryMapping[e.target.value] || null;
        setFiles(updated);
    };

    const handleFolderSelect = (path, folderId) => {
        const updated = [...files];
        updated[selectedIndex].folderPath = path;
        updated[selectedIndex].folderId = folderId || findFolderIdByPath(path);
        setFiles(updated);
        setSelectedFolder(path);
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
        handleClose();
    };

    // Fetch subfolders for a specific folder
    const fetchSubfolders = async (folderId) => {
        try {
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            if (!token) {
                console.error('No authentication token found');
                return [];
            }

            const config = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };

            const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/folders/browse/?folder_id=${folderId}`, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Subfolders API response for folder', folderId, ':', result);

            if (result.success && result.subfolders) {
                return result.subfolders.map(folder => ({
                    id: folder.id,
                    name: folder.title,
                    title: folder.title,
                    description: folder.description,
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

    const toggleExpand = async (folder, path = []) => {
        // Check if folder is currently expanded
        const isCurrentlyExpanded = expandedFolders.has(folder.id);

        // Toggle expansion state
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
    const addFolderToParent = (tree, parentName, newFolder) => {
        return tree.map(folder => {
            if (folder.name === parentName) {
                return {
                    ...folder,
                    children: [...folder.children, newFolder]
                };
            }
            if (folder.children?.length) {
                return {
                    ...folder,
                    children: addFolderToParent(folder.children, parentName, newFolder)
                };
            }
            return folder;
        });
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

            // Prepare folder data
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

            console.log('Create Folder API Request URL:', `${API_BASE_URL}/taxpayer/document-folders/`);
            console.log('Create Folder API Request Data:', folderData);

            const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/document-folders/`, config);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.error('Create Folder API Error Response:', errorData);
                    errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
                } catch (parseError) {
                    console.error('Error parsing create folder response:', parseError);
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Create Folder API Response:', result);

            // Extract folder data from response
            // Response structure may vary, handle different possibilities
            let folderInfo = result;
            if (result.data) {
                folderInfo = result.data;
            } else if (result.folder) {
                folderInfo = result.folder;
            }

            // Create folder object with API response data
            const newFolderObj = {
                name: folderInfo.title || folderInfo.name || newFolderName.trim(),
                id: folderInfo.id,
                title: folderInfo.title || folderInfo.name || newFolderName.trim(),
                description: folderInfo.description || '',
                children: [],
                expanded: false,
                loaded: false
            };

            // Add folder to tree
            let updatedTree;
            if (selectedFolder) {
                // Find parent folder by ID and add as child
                const parentFolderId = files[selectedIndex]?.folderId;
                if (parentFolderId) {
                    updatedTree = updateFolderWithSubfolders(folderTree, parentFolderId, [
                        ...findFolderById(folderTree, parentFolderId)?.children || [],
                        newFolderObj
                    ]);
                } else {
                    // Fallback to path-based search
                    updatedTree = addFolderToParent(folderTree, selectedFolder, newFolderObj);
                }
            } else {
                // Add as root level folder
                updatedTree = [...folderTree, newFolderObj];
            }

            setFolderTree(updatedTree);
            setNewFolderName("");
            setCreatingFolder(false);

            toast.success("Folder created successfully!", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });

        } catch (error) {
            console.error('Error creating folder:', error);
            const errorMessage = handleAPIError(error);
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } finally {
            setCreatingFolderLoading(false);
        }
    };




    const renderTree = (folders, path = []) =>
        folders.map((folder, idx) => {
            const fullPath = [...path, folder.name].join(" > ");
            const hasChildren = folder.children && folder.children.length > 0;
            const isExpanded = expandedFolders.has(folder.id);

            return (
                <div key={folder.id || idx} className="ps-2">
                    <div className="d-flex align-items-center gap-1 folder-tree-item">
                        {hasChildren ? (
                            <span onClick={() => toggleExpand(folder, path)} className="cursor-pointer">
                                {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                            </span>
                        ) : <span style={{ width: "12px" }} />}
                        <div onClick={() => handleFolderSelect(fullPath, folder.id)} className="cursor-pointer">
                            <span className="d-flex align-items-center gap-2">
                                <FaFolder className="text-warning" />
                                {folder.name}
                            </span>
                        </div>
                    </div>
                    {hasChildren && isExpanded && (
                        <div className="ps-3">
                            {renderTree(folder.children, [...path, folder.name])}
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
                        Supported formats: All file types (AVIF, JPG, PNG, PDF, DOC, DOCX, XLS, XLSX, etc.) - Max 50MB per file
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
                                                    )}
                                                </div>
                                            </div>

                                            {/* RIGHT */}
                                            <div className="d-flex gap-2 align-items-center">
                                                <span className="custom-badge">{file.status}</span>
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
                                                <h6 className="txt">Document Category</h6>
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
                                                {categories.length === 0 && !loadingCategories && (
                                                    <small className="text-muted">No categories available</small>
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
                                                                {creatingFolderLoading ? "Creating..." : "Add"}
                                                            </Button>
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCreatingFolder(false);
                                                                    setNewFolderName("");
                                                                }}
                                                                disabled={creatingFolderLoading}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div
                                                    className="d-flex flex-column folder-dropdown-toggle border rounded px-2 py-2 bg-white cursor-pointer"
                                                    onClick={() => {
                                                        if (!selectedFolder) {
                                                            setFolderDropdownOpen(!folderDropdownOpen);
                                                        }
                                                    }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <div className="d-flex align-items-center gap-2">
                                                            {!selectedFolder ? (
                                                                <>

                                                                    <span className="custom-select">Select a Folder</span>
                                                                </>
                                                            ) : (
                                                                <span>{selectedFolder}</span>
                                                            )}
                                                        </div>

                                                        {!selectedFolder ? (
                                                            <FaChevronDown />
                                                        ) : (
                                                            <Button
                                                                variant="light"
                                                                size="sm"
                                                                className="change-btns-t"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFolderDropdownOpen(true);
                                                                }}
                                                            >
                                                                Change
                                                            </Button>

                                                        )}
                                                    </div>

                                                    <div className="small text-muted">
                                                        {files[selectedIndex]?.name || "N/A"} &gt;{" "}
                                                        {files[selectedIndex]?.folderPath || "No folder selected"} &gt;{" "}
                                                        {files[selectedIndex]?.category || "No category selected"}
                                                    </div>
                                                </div>


                                                {/* Folder dropdown content */}
                                                {folderDropdownOpen && (
                                                    <div className="folder-dropdown-content">
                                                        <div className="small text-muted mb-1">FOLDERS</div>
                                                        {loadingFolders ? (
                                                            <div className="text-center p-3">
                                                                <small className="text-muted">Loading folders...</small>
                                                            </div>
                                                        ) : folderTree.length === 0 ? (
                                                            <div className="text-center p-3">
                                                                <small className="text-muted">No folders available</small>
                                                            </div>
                                                        ) : (
                                                            renderTree(folderTree)
                                                        )}
                                                    </div>
                                                )}
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
}














