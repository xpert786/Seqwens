import React, { useRef, useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { FaRegFileAlt, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { UploadsIcon, CrossIcon } from "../components/icons";
import "../styles/Upload.css";
import { FaFolder } from "react-icons/fa";
import { toast } from "react-toastify";
import { getApiBaseUrl, fetchWithCors } from "../utils/corsConfig";
import { getAccessToken } from "../utils/userUtils";
import { handleAPIError, documentsAPI } from "../utils/apiUtils";


export default function UploadModal({ show, handleClose, onUploadSuccess }) {
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
    const [uploading, setUploading] = useState(false);
    const [fileErrors, setFileErrors] = useState({}); // Store errors by file index
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [creatingFolderLoading, setCreatingFolderLoading] = useState(false);
    const [parentFolderForNewFolder, setParentFolderForNewFolder] = useState(null);
    const [creatingCategory, setCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [creatingCategoryLoading, setCreatingCategoryLoading] = useState(false);

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
                    setExpandedFolders(new Set());
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
                const result = await documentsAPI.getDocumentCategories();
                console.log('Categories API response:', result);

                // Handle different response structures
                let categoriesData = [];
                if (result.success && result.data && Array.isArray(result.data)) {
                    categoriesData = result.data;
                } else if (Array.isArray(result)) {
                    categoriesData = result;
                } else if (result.data && Array.isArray(result.data)) {
                    categoriesData = result.data;
                }

                // Filter only active categories if is_active field exists
                const activeCategories = categoriesData.filter(cat => cat.is_active !== false);
                setCategories(activeCategories);
            } catch (error) {
                console.error('Error fetching categories:', error);
                const errorMsg = handleAPIError(error);
                toast.error(errorMsg || 'Failed to load document categories. Please refresh the page.', {
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

    // Convert technical error messages to user-friendly messages
    const getUserFriendlyError = (errorMessage) => {
        if (!errorMessage || typeof errorMessage !== 'string') {
            return errorMessage;
        }

        const lowerMessage = errorMessage.toLowerCase();

        // Handle category/folder errors - check for "does not belong" first (most specific)
        if (lowerMessage.includes('does not belong') || 
            lowerMessage.includes('category does not belong') ||
            (lowerMessage.includes('invalid category') && lowerMessage.includes('does not belong'))) {
            return 'Folder does not belong to you';
        }
        
        // Handle invalid category ID errors
        if (lowerMessage.includes('invalid category id') || 
            (lowerMessage.includes('invalid') && lowerMessage.includes('category id'))) {
            return 'Folder does not belong to you';
        }
        
        // Handle other invalid category errors
        if (lowerMessage.includes('invalid') && lowerMessage.includes('category')) {
            return 'Invalid folder selected';
        }

        // For any other errors, remove technical details but keep the message
        let friendlyMessage = errorMessage;
        
        // Remove ID references (None, null, or numbers)
        friendlyMessage = friendlyMessage.replace(/category\s+ID\s+(None|null|\d+)/gi, '');
        friendlyMessage = friendlyMessage.replace(/ID\s+(None|null|\d+)/gi, '');
        friendlyMessage = friendlyMessage.replace(/id\s+(None|null|\d+)/gi, '');
        
        // Remove "or" at the beginning
        friendlyMessage = friendlyMessage.replace(/^or\s+/i, '');
        
        // Clean up extra spaces and punctuation
        friendlyMessage = friendlyMessage.replace(/\s+/g, ' ').trim();
        friendlyMessage = friendlyMessage.replace(/^\s*,\s*/, '');
        
        return friendlyMessage || 'An error occurred with this file';
    };



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
            // Get API base URL and token
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            if (!token) {
                throw new Error('No authentication token found. Please login again.');
            }

            const errorsByFileIndex = {};
            let successCount = 0;
            let failCount = 0;

            // Upload files one by one using the new API endpoint
            for (let idx = 0; idx < files.length; idx++) {
                const file = files[idx];
                
                if (!file.fileObject) {
                    errorsByFileIndex[idx] = ['File object not found'];
                    failCount++;
                    continue;
                }

                try {
                    // Prepare FormData for single file upload
                    const formData = new FormData();
                    formData.append('file', file.fileObject);
                    
                    // Add optional folder_id if provided
                    if (file.folderId) {
                        formData.append('folder_id', file.folderId);
                    }
                    
                    // Add optional category_id if provided
                    if (file.categoryId) {
                        formData.append('category_id', file.categoryId);
                    }

                    // Make API request for this file
                    const config = {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            // Don't set Content-Type for FormData - let browser set it with boundary
                        },
                        body: formData
                    };

                    console.log(`Upload API Request for file ${idx + 1}/${files.length}:`, file.name);
                    console.log('Upload API Request URL:', `${API_BASE_URL}/taxpayer/documents/upload/`);
                    console.log('Folder ID:', file.folderId);
                    console.log('Category ID:', file.categoryId);

                    const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/documents/upload/`, config);

                    let result;
                    try {
                        result = await response.json();
                    } catch (parseError) {
                        console.error('Error parsing upload response:', parseError);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        throw new Error('Failed to parse server response');
                    }

                    console.log(`Upload API Response for file ${idx + 1}:`, result);

                    // Check if upload was successful
                    if (!response.ok) {
                        let errorMessage = `HTTP error! status: ${response.status}`;
                        errorMessage = result.message || result.detail || result.error || errorMessage;
                        
                        // Handle specific error cases
                        if (response.status === 400) {
                            if (result.message && result.message.includes('Only PDF files are allowed')) {
                                errorMessage = 'Only PDF files are allowed';
                            } else if (result.errors && result.errors.file) {
                                errorMessage = Array.isArray(result.errors.file) 
                                    ? result.errors.file.join(', ') 
                                    : result.errors.file;
                            }
                        } else if (response.status === 404) {
                            if (result.message && result.message.includes('Folder not found')) {
                                errorMessage = 'Folder not found';
                            } else if (result.message && result.message.includes('Category not found')) {
                                errorMessage = 'Category not found';
                            }
                        } else if (response.status === 401) {
                            errorMessage = 'Authentication failed. Please login again.';
                        } else if (response.status === 500) {
                            errorMessage = result.message || 'An error occurred while uploading the file';
                        }
                        
                        errorsByFileIndex[idx] = [getUserFriendlyError(errorMessage)];
                        failCount++;
                        continue;
                    }

                    // Check success response
                    if (result.success === false) {
                        const errorMessage = result.message || 'Upload failed';
                        errorsByFileIndex[idx] = [getUserFriendlyError(errorMessage)];
                        failCount++;
                        continue;
                    }

                    // Success
                    if (result.success === true && result.data) {
                        console.log(`File ${idx + 1} uploaded successfully. Document ID: ${result.data.document_id}, Pages: ${result.data.pages || 'N/A'}`);
                        successCount++;
                    } else {
                        // Unexpected response format
                        errorsByFileIndex[idx] = ['Unexpected server response'];
                        failCount++;
                    }

                } catch (fileError) {
                    console.error(`Error uploading file ${idx + 1} (${file.name}):`, fileError);
                    const errorMessage = handleAPIError(fileError);
                    errorsByFileIndex[idx] = [getUserFriendlyError(errorMessage)];
                    failCount++;
                }
            }

            // Set file-specific errors if any
            if (Object.keys(errorsByFileIndex).length > 0) {
                setFileErrors(errorsByFileIndex);

                // Show error message for failed uploads
                if (failCount > 0) {
                    toast.error(`${failCount} file(s) failed to upload. ${successCount > 0 ? `${successCount} file(s) uploaded successfully.` : ''}`, {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                    });

                    // Scroll to first file with error
                    const firstErrorIndex = Math.min(...Object.keys(errorsByFileIndex).map(Number));
                    if (firstErrorIndex >= 0 && firstErrorIndex < files.length) {
                        setSelectedIndex(firstErrorIndex);
                    }

                    setUploading(false);
                    return;
                }
            }

            // All files uploaded successfully
            if (successCount === files.length) {
                toast.success(`All ${successCount} file(s) uploaded successfully!`, {
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

                // Call success callback if provided (e.g., to refresh documents list)
                if (onUploadSuccess && typeof onUploadSuccess === 'function') {
                    onUploadSuccess();
                }

                // Reset modal after successful upload
                resetModal();
            }

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
        const selectedFiles = Array.from(e.target.files);

        // Filter only PDF files
        const pdfFiles = selectedFiles.filter(file => {
            const fileName = file.name.toLowerCase();
            const fileType = file.type.toLowerCase();
            return fileName.endsWith('.pdf') || fileType === 'application/pdf';
        });

        // Show error for non-PDF files
        const nonPdfFiles = selectedFiles.filter(file => {
            const fileName = file.name.toLowerCase();
            const fileType = file.type.toLowerCase();
            return !fileName.endsWith('.pdf') && fileType !== 'application/pdf';
        });

        if (nonPdfFiles.length > 0) {
            toast.error(`Only PDF files are allowed. ${nonPdfFiles.length} non-PDF file(s) were ignored.`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }

        // Only process PDF files
        if (pdfFiles.length === 0) {
            return;
        }

        const newFiles = pdfFiles.map((file) => ({
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

        // Reset file input so same file can be selected again if needed
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

    const handleCategoryChange = (e) => {
        const updated = [...files];
        updated[selectedIndex].category = e.target.value;
        updated[selectedIndex].categoryId = categoryMapping[e.target.value] || null;
        setFiles(updated);
        
        // Clear errors for this file when user makes changes
        if (fileErrors[selectedIndex]) {
            const newFileErrors = { ...fileErrors };
            delete newFileErrors[selectedIndex];
            setFileErrors(newFileErrors);
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
            const categoryData = {
                name: newCategoryName.trim(),
                description: `Document category: ${newCategoryName.trim()}`,
                is_active: true
            };

            const result = await documentsAPI.createDocumentCategory(categoryData);
            
            // Handle different response structures
            let categoryInfo = result;
            if (result.success && result.data) {
                categoryInfo = result.data;
            } else if (result.category) {
                categoryInfo = result.category;
            }

            // Add new category to the list
            const newCategory = {
                id: categoryInfo.id,
                name: categoryInfo.name || newCategoryName.trim(),
                description: categoryInfo.description || categoryData.description,
                is_active: categoryInfo.is_active !== false
            };

            const updatedCategories = [...categories, newCategory];
            setCategories(updatedCategories);

            // Auto-select the newly created category for the current file
            const updated = [...files];
            updated[selectedIndex].category = newCategory.name;
            updated[selectedIndex].categoryId = newCategory.id;
            setFiles(updated);

            // Clear errors for this file
            if (fileErrors[selectedIndex]) {
                const newFileErrors = { ...fileErrors };
                delete newFileErrors[selectedIndex];
                setFileErrors(newFileErrors);
            }

            setNewCategoryName("");
            setCreatingCategory(false);

            toast.success(result.message || "Category created and selected successfully!", {
                position: "top-right",
                autoClose: 3000,
            });
        } catch (error) {
            console.error('Error creating category:', error);
            const errorMsg = handleAPIError(error);
            toast.error(errorMsg || 'Failed to create category', {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setCreatingCategoryLoading(false);
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
        
        // Clear errors for this file when user makes changes
        if (fileErrors[selectedIndex]) {
            const newFileErrors = { ...fileErrors };
            delete newFileErrors[selectedIndex];
            setFileErrors(newFileErrors);
        }
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
        setFileErrors({});
        setCreatingFolderLoading(false);
        setExpandedFolders(new Set());
        setCreatingCategory(false);
        setNewCategoryName("");
        setCreatingCategoryLoading(false);
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
            if (parentFolderForNewFolder) {
                updatedTree = updateFolderWithSubfolders(folderTree, parentFolderForNewFolder, [
                    ...(findFolderById(folderTree, parentFolderForNewFolder)?.children || []),
                    newFolderObj
                ]);
            } else {
                // Add as root level folder
                updatedTree = [...folderTree, newFolderObj];
            }

            setFolderTree(updatedTree);
            setNewFolderName("");
            setCreatingFolder(false);
            setParentFolderForNewFolder(null);

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




    // Render folder tree
    const renderFolderTree = (folders, path = []) =>
        folders.map((folder, idx) => {
            const fullPath = [...path, folder.name].join(" > ");
            const hasChildren = folder.children && folder.children.length > 0;
            const isExpanded = expandedFolders.has(folder.id);
            // Show expand icon if folder has children or might have children (not loaded yet)
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
                        Supported formats: PDF only - Max 50MB per file
                    </p>
                    <input
                        type="file"
                        multiple
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,application/pdf"
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


                                                    {/* Show validation errors */}
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
                                                    {/* Show API errors for this file */}
                                                    {fileErrors[idx] && fileErrors[idx].length > 0 && (
                                                        <div className="mt-2">
                                                            {fileErrors[idx].map((error, i) => (
                                                                <div key={i} className="doc-error-box">
                                                                    <span className="doc-error-icon">!</span>
                                                                    {error}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {/*  */}
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
                                                            style={{
                                                                color: '#00C0C6',
                                                                textDecoration: 'none',
                                                                fontSize: '12px',
                                                                fontWeight: '500'
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
                                                                    if (e.key === 'Enter' && newCategoryName.trim() && !creatingCategoryLoading) {
                                                                        e.preventDefault();
                                                                        handleCreateCategory();
                                                                    } else if (e.key === 'Escape') {
                                                                        setCreatingCategory(false);
                                                                        setNewCategoryName("");
                                                                    }
                                                                }}
                                                                style={{
                                                                    width: '150px',
                                                                    borderRadius: '8px'
                                                                }}
                                                            />
                                                            <Button
                                                                size="sm"
                                                                variant="success"
                                                                onClick={handleCreateCategory}
                                                                disabled={!newCategoryName.trim() || creatingCategoryLoading}
                                                                style={{
                                                                    borderRadius: '8px',
                                                                    fontSize: '12px',
                                                                    padding: '4px 12px'
                                                                }}
                                                            >
                                                                {creatingCategoryLoading ? '...' : 'Save'}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline-secondary"
                                                                onClick={() => {
                                                                    setCreatingCategory(false);
                                                                    setNewCategoryName("");
                                                                }}
                                                                disabled={creatingCategoryLoading}
                                                                style={{
                                                                    borderRadius: '8px',
                                                                    fontSize: '12px',
                                                                    padding: '4px 12px'
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                                <Form.Select
                                                    className={`custom-select ${fileErrors[selectedIndex] && fileErrors[selectedIndex].length > 0 ? 'border-danger' : ''}`}
                                                    value={files[selectedIndex]?.category || ""}
                                                    onChange={handleCategoryChange}
                                                    disabled={loadingCategories || creatingCategory}
                                                    style={{
                                                        borderRadius: '8px'
                                                    }}
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
                                                {/* Show category/folder related errors under the category field */}
                                                {fileErrors[selectedIndex] && fileErrors[selectedIndex].length > 0 && (
                                                    <div className="mt-2">
                                                        {fileErrors[selectedIndex].map((error, i) => (
                                                            <div key={i} className="text-danger small">
                                                                {error}
                                                            </div>
                                                        ))}
                                                    </div>
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
                                                                {creatingFolderLoading ? "Creating..." : "Add"}
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
                                                        className={`d-flex flex-column folder-dropdown-toggle border rounded px-2 py-2 bg-white cursor-pointer ${fileErrors[selectedIndex] && fileErrors[selectedIndex].length > 0 ? 'border-danger' : ''}`}
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
                                                {/* Show folder related errors under the folder field */}
                                                {fileErrors[selectedIndex] && fileErrors[selectedIndex].length > 0 && (
                                                    <div className="mt-2">
                                                        {fileErrors[selectedIndex].map((error, i) => (
                                                            <div key={i} className="text-danger small">
                                                                {error}
                                                            </div>
                                                        ))}
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














