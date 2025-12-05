import React, { useRef, useState, useEffect, useCallback } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { FaRegFileAlt, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { UploadsIcon, CrossIcon } from "../../../ClientOnboarding/components/icons";
import "../../../ClientOnboarding/styles/Upload.css";
import { FaFolder } from "react-icons/fa";
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
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [creatingFolderLoading, setCreatingFolderLoading] = useState(false);
    const [parentFolderForNewFolder, setParentFolderForNewFolder] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [creatingCategory, setCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryDescription, setNewCategoryDescription] = useState("");
    const [creatingCategoryLoading, setCreatingCategoryLoading] = useState(false);

    // Folder tree - will be populated from API
    const [folderTree, setFolderTree] = useState([]);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState(new Set());

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
            // Use listFoldersWithSync to get latest folder structure from B2
            const response = await firmAdminDocumentsAPI.listFoldersWithSync();

            if (response.folders && Array.isArray(response.folders)) {
                // New API response format: { folders: [...] }
                const foldersTree = response.folders
                    .filter(folder => folder.id) // Filter out folders without IDs
                    .map(folder => ({
                        id: folder.id,
                        name: folder.title || folder.name,
                        title: folder.title || folder.name,
                        description: folder.description || '',
                        children: [],
                        expanded: false,
                        loaded: false,
                    }));
                setFolderTree(foldersTree);
                setExpandedFolders(new Set());
            } else if (response.success && response.data) {
                // Fallback to old response structure
                const rootFolders = response.data.folders || [];
                const foldersTree = rootFolders
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
                setFolderTree(foldersTree);
                setExpandedFolders(new Set());
            } else {
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
    }, [show]);

    useEffect(() => {
        fetchRootFolders();
    }, [fetchRootFolders]);

    // Fetch document categories from API using Firm Admin endpoint
    useEffect(() => {
        const fetchCategories = async () => {
            if (!show) return;

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

                const response = await fetchWithCors(`${API_BASE_URL}/firm/document-categories/`, config);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                // Handle different response structures
                let categoriesList = [];
                if (result.success && result.data) {
                    // Check if categories are in result.data.categories
                    if (result.data.categories && Array.isArray(result.data.categories)) {
                        categoriesList = result.data.categories;
                    }
                    // Check if data itself is an array
                    else if (Array.isArray(result.data)) {
                        categoriesList = result.data;
                    }
                } else if (Array.isArray(result)) {
                    categoriesList = result;
                } else if (result.data && Array.isArray(result.data)) {
                    categoriesList = result.data;
                }

                console.log('📋 Categories fetched:', categoriesList);

                // Filter only active categories
                const activeCategories = categoriesList.filter(cat => cat.is_active !== false);
                console.log('✅ Active categories:', activeCategories);
                setCategories(activeCategories);
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

    // Create category mapping
    const categoryMapping = categories.reduce((acc, category) => {
        acc[category.name] = category.id;
        return acc;
    }, {});

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
            });
        }

        if (pdfFiles.length === 0) {
            return;
        }

        const newFiles = pdfFiles.map((file) => ({
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

    const handleCategoryChange = (e) => {
        const updated = [...files];
        const selectedCategoryName = e.target.value;
        updated[selectedIndex].category = selectedCategoryName;

        // Find category by name (case-insensitive, trimmed)
        const selectedCategory = categories.find(cat =>
            cat.name && cat.name.trim().toLowerCase() === selectedCategoryName.trim().toLowerCase()
        );

        if (selectedCategory && selectedCategory.id) {
            updated[selectedIndex].categoryId = selectedCategory.id;
            console.log('Category selected:', selectedCategoryName, 'ID:', selectedCategory.id);
        } else {
            console.error('Category not found:', selectedCategoryName, 'Available categories:', categories.map(c => ({ name: c.name, id: c.id })));
            updated[selectedIndex].categoryId = null;
        }

        // Clear validation errors for this file
        setValidationErrors(prev => prev.filter(err => !err.includes(updated[selectedIndex].name)));

        setFiles(updated);
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
        setCreatingCategory(false);
        setNewCategoryName("");
        setNewCategoryDescription("");
        handleClose();
    };

    // Create new category
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;

        setCreatingCategoryLoading(true);

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

            const categoryData = {
                name: newCategoryName.trim(),
                description: newCategoryDescription.trim() || "",
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

            const response = await fetchWithCors(`${API_BASE_URL}/firm/document-categories/`, config);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
                } catch (parseError) {
                    console.error('Error parsing create category response:', parseError);
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            let categoryInfo = result;
            if (result.data) {
                categoryInfo = result.data;
            } else if (result.category) {
                categoryInfo = result.category;
            }

            // Add new category to the list
            const newCategory = {
                id: categoryInfo.id,
                name: categoryInfo.name || newCategoryName.trim(),
                description: categoryInfo.description || newCategoryDescription.trim(),
                is_active: categoryInfo.is_active !== false
            };

            const updatedCategories = [...categories, newCategory];
            setCategories(updatedCategories);

            // Auto-select the newly created category for the current file
            const updatedFiles = [...files];
            updatedFiles[selectedIndex].category = newCategory.name;
            updatedFiles[selectedIndex].categoryId = newCategory.id;
            setFiles(updatedFiles);

            setNewCategoryName("");
            setNewCategoryDescription("");
            setCreatingCategory(false);

            toast.success("Category created and selected successfully!", {
                position: "top-right",
                autoClose: 3000,
            });

        } catch (error) {
            console.error('Error creating category:', error);
            const errorMessage = handleAPIError(error);
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setCreatingCategoryLoading(false);
        }
    };

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

        // Basic validation - only check if category and folder are selected (not IDs)
        files.forEach((file) => {
            if (!file?.category || file.category.trim() === '') {
                errors.push(`${file.name}: Please select a document category.`);
            }
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

        // Before upload, ensure we have categoryId and extract folder name
        const filesToUpload = files.map((file) => {
            let categoryId = file.categoryId;
            let folderName = null;

            // If categoryId is missing, find it from the category name (case-insensitive)
            if (!categoryId && file.category && file.category.trim() !== '') {
                // Try exact match first
                let foundCategory = categories.find(cat => cat.name && cat.name === file.category);
                // If not found, try case-insensitive match
                if (!foundCategory) {
                    foundCategory = categories.find(cat =>
                        cat.name && cat.name.trim().toLowerCase() === file.category.trim().toLowerCase()
                    );
                }
                if (foundCategory && foundCategory.id) {
                    categoryId = foundCategory.id;
                    console.log('✅ Recovered categoryId for', file.name, ':', categoryId, 'from category:', file.category);
                } else {
                    console.warn('❌ Could not find categoryId for', file.name, 'category:', file.category);
                }
            }

            // Extract folder name from the folder path (use the last part)
            if (file.folderPath && file.folderPath.trim() !== '') {
                const pathParts = file.folderPath.split(' > ').map(p => p.trim()).filter(p => p);
                if (pathParts.length > 0) {
                    folderName = pathParts[pathParts.length - 1];
                    console.log('✅ Extracted folderName for', file.name, ':', folderName, 'from path:', file.folderPath);
                }
            }

            return {
                ...file,
                categoryId: categoryId || file.categoryId,
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

                // ALWAYS try to get category_id - even if we have one, verify it's valid
                let categoryId = null;

                // First, use the stored categoryId if it exists
                if (file.categoryId) {
                    // Verify it's still valid by checking categories array
                    const categoryExists = categories.find(cat => cat.id === file.categoryId);
                    if (categoryExists) {
                        categoryId = file.categoryId;
                    }
                }

                // If no valid categoryId found, try to find by category name
                if (!categoryId && file.category && file.category.trim() !== '') {
                    // Try exact match first
                    let foundCategory = categories.find(cat => cat.name && cat.name === file.category);
                    // If not found, try case-insensitive match
                    if (!foundCategory) {
                        foundCategory = categories.find(cat =>
                            cat.name && cat.name.trim().toLowerCase() === file.category.trim().toLowerCase()
                        );
                    }
                    if (foundCategory && foundCategory.id) {
                        categoryId = foundCategory.id;
                    }
                }

                // ALWAYS include category_id if we found one
                if (categoryId) {
                    metadata.category_id = categoryId;
                } else {
                    console.error('⚠️ Category ID not found for file:', file.name, {
                        selectedCategory: file.category,
                        availableCategories: categories.map(c => ({ name: c.name, id: c.id })),
                        storedCategoryId: file.categoryId
                    });
                }

                // Use folder_name (API now accepts folder names!)
                let folderName = null;

                // Extract folder name from the folder path (use the last part)
                if (file.folderPath && file.folderPath.trim() !== '') {
                    const pathParts = file.folderPath.split(' > ').map(p => p.trim()).filter(p => p);
                    if (pathParts.length > 0) {
                        folderName = pathParts[pathParts.length - 1];
                    }
                }

                // Include folder_name if we found one
                if (folderName) {
                    metadata.folder_name = folderName;
                } else {
                    console.warn('⚠️ Folder name not found for file:', file.name, {
                        selectedFolderPath: file.folderPath
                    });
                }

                console.log('📤 Document metadata for', file.name, ':', JSON.stringify(metadata), '| File:', {
                    category: file.category,
                    categoryId: file.categoryId,
                    folderPath: file.folderPath,
                    folderName: metadata.folder_name
                });

                return metadata;
            });

            console.log('📋 Final documents_metadata before sending:', JSON.stringify(documentsMetadata, null, 2));
            console.log('📋 Files to upload:', filesToUpload.map(f => ({
                name: f.name,
                category: f.category,
                categoryId: f.categoryId,
                folderPath: f.folderPath
            })));

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
        <Modal show={show} onHide={resetModal} centered backdrop="static" size={step === 1 ? "md" : "xl"} className="upload-modal">
            <Modal.Body className="p-4">
                <h5 className="upload-heading">Upload Documents</h5>
                <p className="upload-subheading">Upload your tax documents securely</p>

                <p className="upload-section-title">Add Files</p>

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

                            <div className="flex-grow-1 d-flex flex-column">
                                <div className="d-flex gap-2 mb-3">
                                    <Button className={`toggle-btn ${!previewMode ? "active" : ""}`} onClick={() => setPreviewMode(false)}>Configure</Button>
                                    <Button className={`toggle-btn ${previewMode ? "active" : ""}`} onClick={() => setPreviewMode(true)}>Preview</Button>
                                </div>

                                <div className="config-scroll flex-grow-1">
                                    {!previewMode ? (
                                        <div className="config-panel">
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
                                                                placeholder="Category name"
                                                                value={newCategoryName}
                                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                                disabled={creatingCategoryLoading}
                                                                autoFocus
                                                                style={{ minWidth: '150px' }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && newCategoryName.trim() && !creatingCategoryLoading) {
                                                                        handleCreateCategory();
                                                                    }
                                                                    if (e.key === 'Escape') {
                                                                        setCreatingCategory(false);
                                                                        setNewCategoryName('');
                                                                        setNewCategoryDescription('');
                                                                    }
                                                                }}
                                                            />
                                                            <Form.Control
                                                                size="sm"
                                                                type="text"
                                                                placeholder="Description (optional)"
                                                                value={newCategoryDescription}
                                                                onChange={(e) => setNewCategoryDescription(e.target.value)}
                                                                disabled={creatingCategoryLoading}
                                                                style={{ minWidth: '150px' }}
                                                            />
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={handleCreateCategory}
                                                                disabled={creatingCategoryLoading || !newCategoryName.trim()}
                                                            >
                                                                {creatingCategoryLoading ? "Creating..." : "Add"}
                                                            </Button>
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setCreatingCategory(false);
                                                                    setNewCategoryName("");
                                                                    setNewCategoryDescription("");
                                                                }}
                                                                disabled={creatingCategoryLoading}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                                <Form.Select
                                                    className="custom-select"
                                                    value={files[selectedIndex]?.category || ""}
                                                    onChange={handleCategoryChange}
                                                    disabled={loadingCategories || creatingCategory}
                                                >
                                                    <option value="" key="select-category-default">
                                                        {loadingCategories ? "Loading categories..." : "Select a Category"}
                                                    </option>
                                                    {categories.map((category, catIdx) => (
                                                        <option 
                                                            key={category.id || `category-${catIdx}-${category.name}`} 
                                                            value={category.name}
                                                        >
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                                {/* Debug info */}
                                                {files[selectedIndex] && (
                                                    <small className="text-muted d-block mt-1">
                                                        Selected: {files[selectedIndex].category || 'None'}
                                                        {files[selectedIndex].categoryId && ` (ID: ${files[selectedIndex].categoryId})`}
                                                    </small>
                                                )}
                                                {categories.length === 0 && !loadingCategories && (
                                                    <small className="text-muted">No categories available. Create one to get started.</small>
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
                                                            {files[selectedIndex]?.folderPath || "No folder selected"} &gt;{" "}
                                                            {files[selectedIndex]?.category || "No category selected"}
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
                                            </Form.Group>
                                        </div>
                                    ) : (
                                        <div className="preview-panel border rounded p-3">
                                            <iframe src={files[selectedIndex]?.file} title="Document Preview" width="100%" height="500px" />
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

