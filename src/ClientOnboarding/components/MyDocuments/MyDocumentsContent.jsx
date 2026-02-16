
import React, { useState, useEffect, useMemo, useRef } from "react";
import { FileIcon, OverdueIcon, UploadIcons, CompletedIcon, AwaitingIcon } from "../icons";
import "../../styles/Document.css";
import { handleAPIError, esignAssignAPI, documentsAPI } from "../../utils/apiUtils";
import { getApiBaseUrl, fetchWithCors } from "../../utils/corsConfig";
import { getAccessToken } from "../../utils/userUtils";
import { toast } from "react-toastify";
import Pagination from "../Pagination";
import ConfirmationModal from "../../../components/ConfirmationModal";
import { Modal } from "react-bootstrap";
import NewFolderModal from "./NewFolderModal";
import * as XLSX from "xlsx";

export default function MyDocumentsContent() {
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [view, setView] = useState("list");
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState(null); // null = all, "pending", "completed", "overdue", "uploaded"
    const [stats, setStats] = useState({
        pending: 0,
        completed: 0,
        overdue: 0,
        uploaded: 0
    });
    const [archivingDocumentId, setArchivingDocumentId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 3;
    const [showDeleteDocumentConfirm, setShowDeleteDocumentConfirm] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const [deletingDocumentId, setDeletingDocumentId] = useState(null);
    const [showMenuIndex, setShowMenuIndex] = useState(null);

    // Assign for E-Sign states
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [documentToAssign, setDocumentToAssign] = useState(null);
    const [taxpayers, setTaxpayers] = useState([]);
    const [selectedTaxpayerId, setSelectedTaxpayerId] = useState('');
    const [deadline, setDeadline] = useState('');
    const [hasSpouse, setHasSpouse] = useState(false);
    const [preparerMustSign, setPreparerMustSign] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [pollingStatus, setPollingStatus] = useState(null);

    // Folder navigation state
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);

    // Excel preview state
    const [excelPreviewData, setExcelPreviewData] = useState(null);
    const [loadingExcelPreview, setLoadingExcelPreview] = useState(false);

    // Reset Excel preview when selected document changes
    useEffect(() => {
        setExcelPreviewData(null);
        setLoadingExcelPreview(false);
    }, [selectedDocument]);

    // Aggregated data for recursive mode
    const allFoldersRef = useRef([]);
    const allDocumentsRef = useRef([]);
    const isRecursiveLoaded = useRef(false);

    // Filter local data to show current folder content
    const updateViewFromLocalData = (folderId) => {
        setLoading(true);
        setError(null); // Clear error when showing local data
        // 1. Get current folder info
        let currentFolder = null;
        if (folderId) {
            currentFolder = allFoldersRef.current.find(f => f.id === folderId || f.id === parseInt(folderId));
        }

        // 2. Build breadcrumbs
        const newBreadcrumbs = [];
        let tempFolder = currentFolder;
        while (tempFolder) {
            newBreadcrumbs.unshift({
                id: tempFolder.id,
                title: tempFolder.title || tempFolder.name
            });
            // Find parent
            if (tempFolder.parent) {
                // If parent is an object with ID
                const parentId = typeof tempFolder.parent === 'object' ? tempFolder.parent.id : tempFolder.parent;
                tempFolder = allFoldersRef.current.find(f => f.id === parentId);
            } else {
                tempFolder = null;
            }
        }
        setBreadcrumbs(newBreadcrumbs);

        // 3. Filter folders
        // Subfolders whose parent is currentFolder.id (or null if root)
        const filteredFolders = allFoldersRef.current.filter(f => {
            const pId = f.parent ? (typeof f.parent === 'object' ? f.parent.id : f.parent) : null;
            return folderId ? pId === parseInt(folderId) : pId === null;
        }).map(folder => ({
            ...folder,
            is_folder: true,
            type: 'folder',
            document_type: 'folder'
        }));

        // 4. Filter documents
        const filteredDocs = allDocumentsRef.current.filter(d => {
            const fId = d.folder ? (typeof d.folder === 'object' ? d.folder.id : d.folder) : d.folder_id;
            return folderId ? fId === parseInt(folderId) : !fId;
        });

        // 5. Merge and set
        setDocuments([...filteredFolders, ...filteredDocs]);
        setLoading(false);
    };

    // Fetch documents using browse API (supports folder navigation)
    const fetchAllDocuments = async (folderId = null, force = false) => {
        try {
            setLoading(true);
            setError(null);

            // In parallel mode, fetch folders and files separately
            const [foldersResult, filesResult] = await Promise.all([
                documentsAPI.browseFoldersSplit({
                    folder_id: folderId,
                    search: searchTerm
                }),
                documentsAPI.browseFilesSplit({
                    folder_id: folderId,
                    search: searchTerm,
                    show_archived: selectedFilter === 'archived'
                })
            ]);

            if (foldersResult.success && foldersResult.data) {
                // Set breadcrumbs
                setBreadcrumbs(foldersResult.data.breadcrumbs || []);

                // Transform folders
                const foldersAsDocs = (foldersResult.data.folders || []).map(folder => ({
                    ...folder,
                    is_folder: true,
                    type: 'folder',
                    document_type: 'folder'
                }));

                if (filesResult.success && filesResult.data) {
                    const docs = filesResult.data.documents || [];
                    setDocuments([...foldersAsDocs, ...docs]);

                    // Update stats
                    if (filesResult.data.statistics) {
                        const statsData = filesResult.data.statistics;
                        setStats({
                            pending: 0,
                            completed: 0,
                            overdue: 0,
                            uploaded: statsData.total_documents || docs.length
                        });
                    }
                } else {
                    setDocuments(foldersAsDocs);
                }
            } else if (filesResult.success && filesResult.data) {
                const docs = filesResult.data.documents || [];
                setDocuments(docs);
            } else {
                throw new Error('Failed to load documents');
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
            setError(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    // Handle folder click - navigate into folder
    const handleFolderClick = (folder) => {
        const folderId = folder.id || folder.folder_id;
        setCurrentFolderId(folderId);
        setSelectedIndex(null);
        setShowMenuIndex(null);

        if (isRecursiveLoaded.current) {
            updateViewFromLocalData(folderId);
        } else {
            fetchAllDocuments(folderId);
        }
    };

    // Handle breadcrumb click - navigate to parent folder
    const handleBreadcrumbClick = (folderId) => {
        setCurrentFolderId(folderId);
        setSelectedIndex(null);
        setShowMenuIndex(null);

        if (isRecursiveLoaded.current) {
            updateViewFromLocalData(folderId);
        } else {
            fetchAllDocuments(folderId);
        }
    };

    // Fetch all documents on component mount
    useEffect(() => {
        fetchAllDocuments(currentFolderId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Format file size helper
    const formatFileSize = (bytes) => {
        if (!bytes) return '0 KB';
        if (typeof bytes === 'string') {
            // If already formatted, return as is
            if (bytes.includes('MB') || bytes.includes('KB')) return bytes;
            // Try to parse
            bytes = parseInt(bytes);
        }
        if (isNaN(bytes)) return '0 KB';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateString;
        }
    };

    // Handle delete document
    const handleDeleteDocument = (doc) => {
        setDocumentToDelete(doc);
        setShowDeleteDocumentConfirm(true);
        setShowMenuIndex(null);
    };

    const confirmDeleteDocument = async () => {
        if (!documentToDelete) return;

        try {
            setDeletingDocumentId(documentToDelete.id || documentToDelete.document_id);
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            if (!token) {
                console.error('No authentication token found');
                return;
            }

            const docId = documentToDelete.id || documentToDelete.document_id;
            const url = `${API_BASE_URL}/taxpayer/documents/${docId}/`;

            const config = {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };

            const response = await fetchWithCors(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Remove document from list
            setDocuments(prevDocuments =>
                prevDocuments.filter(doc =>
                    (doc.id !== docId && doc.document_id !== docId)
                )
            );

            // Close modal if deleted document was selected
            if (selectedDocument && (selectedDocument.id === docId || selectedDocument.document_id === docId)) {
                setShowPdfModal(false);
                setSelectedDocument(null);
            }

            // Update stats
            setStats(prevStats => ({
                ...prevStats,
                uploaded: Math.max(0, prevStats.uploaded - 1)
            }));

            toast.success('Document deleted successfully', {
                position: "top-right",
                autoClose: 3000,
            });

            setShowDeleteDocumentConfirm(false);
            setDocumentToDelete(null);
        } catch (error) {
            console.error('Error deleting document:', error);
            const errorMessage = handleAPIError(error);
            toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to delete document'), {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setDeletingDocumentId(null);
        }
    };

    // Handle archive/unarchive document
    const handleArchiveDocument = async (documentId, isArchived) => {
        try {
            setArchivingDocumentId(documentId);
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            if (!token) {
                console.error('No authentication token found');
                return;
            }

            const action = isArchived ? 'unarchive' : 'archive';
            const url = `${API_BASE_URL}/taxpayer/documents/${documentId}/archive/`;

            const config = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action }),
            };

            const response = await fetchWithCors(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                // Update the document in the documents array
                setDocuments(prevDocuments =>
                    prevDocuments.map(doc =>
                        doc.id === documentId || doc.document_id === documentId
                            ? { ...doc, ...result.data }
                            : doc
                    )
                );

                // Update selectedDocument if it's the same document
                if (selectedDocument && (selectedDocument.id === documentId || selectedDocument.document_id === documentId)) {
                    setSelectedDocument({ ...selectedDocument, ...result.data });
                }

                console.log(`Document ${action}d successfully:`, result.data);
                toast.success(`Document ${action}d successfully`, {
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
            } else {
                throw new Error(result.message || 'Failed to archive/unarchive document');
            }
        } catch (error) {
            console.error('Error archiving/unarchiving document:', error);
            const errorMessage = handleAPIError(error);
            toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to archive/unarchive document'), {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                icon: false,
                className: "custom-toast-error",
                bodyClassName: "custom-toast-body",
            });
        } finally {
            setArchivingDocumentId(null);
        }
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        const statusLower = (status || '').toLowerCase();
        if (statusLower.includes('processed') || statusLower.includes('completed')) {
            return 'bg-darkgreen text-white';
        } else if (statusLower.includes('pending_sign') || statusLower.includes('signature') || statusLower.includes('pending')) {
            return 'bg-darkblue text-white';
        } else if (statusLower.includes('under_review') || statusLower.includes('review')) {
            return 'bg-darkbroun text-white';
        } else if (statusLower.includes('need_clarification') || statusLower.includes('clarification')) {
            return 'bg-darkcolour text-white';
        }
        return 'bg-darkblue text-white';
    };

    // Check if document is a file (not a folder)
    const isFile = (doc) => {
        // Folders typically have is_folder: true or type: 'folder'
        return !doc.is_folder && doc.type !== 'folder' && doc.document_type !== 'folder';
    };

    // Create folder
    const handleCreateFolder = async (folderName) => {
        if (!folderName || !folderName.trim()) return;

        try {
            setLoading(true);
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            const url = `${API_BASE_URL}/taxpayer/document-folders/`;
            const payload = {
                title: folderName,
                parent: currentFolderId || null
            };

            const response = await fetchWithCors(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                toast.success('Folder created successfully');
                // Refresh data
                // Clear recursive cache to force reload
                isRecursiveLoaded.current = false;
                fetchAllDocuments(currentFolderId);
            } else {
                throw new Error('Failed to create folder');
            }
        } catch (error) {
            console.error('Error creating folder:', error);
            const msg = handleAPIError(error);
            toast.error(typeof msg === 'string' ? msg : 'Failed to create folder');
        } finally {
            setLoading(false);
        }
    };

    // Rename folder
    const handleRenameFolder = async (folder, newName) => {
        if (!newName || !newName.trim()) return;

        try {
            setLoading(true);
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            const url = `${API_BASE_URL}/taxpayer/document-folders/${folder.id}/`;

            const response = await fetchWithCors(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: newName })
            });

            if (response.ok) {
                toast.success('Folder renamed successfully');
                // Clear recursive cache
                isRecursiveLoaded.current = false;
                fetchAllDocuments(currentFolderId);
            } else {
                throw new Error('Failed to rename folder');
            }
        } catch (error) {
            console.error('Error renaming folder:', error);
            toast.error('Failed to rename folder');
        } finally {
            setLoading(false);
        }
    };

    // Delete folder (soft delete/trash)
    const handleDeleteFolder = async (folder) => {
        if (!confirm(`Are you sure you want to delete folder "${folder.title}" and all its contents?`)) return;

        try {
            setLoading(true);
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            // Assuming DELETE method on folder detail view soft deletes it
            const url = `${API_BASE_URL}/taxpayer/document-folders/${folder.id}/`;

            const response = await fetchWithCors(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Folder deleted successfully');
                isRecursiveLoaded.current = false;
                fetchAllDocuments(currentFolderId);
            } else {
                throw new Error('Failed to delete folder');
            }
        } catch (error) {
            console.error('Error deleting folder:', error);
            toast.error('Failed to delete folder');
        } finally {
            setLoading(false);
            setShowMenuIndex(null);
        }
    };

    // Archive folder (move to trash)
    const handleArchiveFolder = async (folder) => {
        if (!confirm(`Archive folder "${folder.title}" and all its contents? You can recover it from trash.`)) return;

        try {
            setLoading(true);
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            const url = `${API_BASE_URL}/taxpayer/folders/${folder.id}/trash/`;

            const response = await fetchWithCors(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Folder archived successfully');
                isRecursiveLoaded.current = false;
                fetchAllDocuments(currentFolderId);
            } else {
                throw new Error('Failed to archive folder');
            }
        } catch (error) {
            console.error('Error archiving folder:', error);
            toast.error('Failed to archive folder');
        } finally {
            setLoading(false);
            setShowMenuIndex(null);
        }
    };
    const fetchTaxpayers = async () => {
        try {
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();
            // Get current user ID to use as fallback
            let currentUserId = null;
            try {
                // Assuming logic to get ID from token or stored user data
                const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
                currentUserId = userData.id || userData.user_id;
            } catch (e) { console.error("Error getting user data", e); }

            const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/tax-preparer/clients/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    const clients = result.data.clients || result.data || [];
                    setTaxpayers(clients);
                    if (clients.length > 0 && !selectedTaxpayerId) {
                        setSelectedTaxpayerId(clients[0].id?.toString() || '');
                    } else if (clients.length === 0 && currentUserId) {
                        // If no clients (taxpayer mode), set self
                        setSelectedTaxpayerId(currentUserId.toString());
                    }
                }
            } else {
                // Likely 403 because we are a taxpayer, not a preparer.
                // So we just assign to ourselves.
                console.log('Not a preparer, defaulting to self-assignment');
                if (currentUserId) setSelectedTaxpayerId(currentUserId.toString());
            }
        } catch (error) {
            console.error('Error fetching taxpayers:', error);
            // Don't show error toast here, as it's expected for taxpayers
            try {
                const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
                if (userData.id) setSelectedTaxpayerId(userData.id.toString());
            } catch (e) { }
        }
    };

    // Open assign modal
    const handleOpenAssignModal = (doc) => {
        if (!isFile(doc)) {
            toast.warning('Only files can be assigned for e-signing, not folders', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }
        setDocumentToAssign(doc);
        setShowAssignModal(true);
        fetchTaxpayers();

        // Set default deadline to 30 days from now
        const defaultDeadline = new Date();
        defaultDeadline.setDate(defaultDeadline.getDate() + 30);
        setDeadline(defaultDeadline.toISOString().split('T')[0]);
    };

    // Poll for e-sign status
    const pollESignStatus = async (esignDocumentId, maxAttempts = 30) => {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await esignAssignAPI.pollESignStatus(esignDocumentId);

                if (response.success && response.data) {
                    const status = response.data.processing_status;
                    setPollingStatus({
                        status,
                        message: status === 'completed' ? 'Processing complete!' : `Processing... (${i + 1}/${maxAttempts})`,
                        data: response.data
                    });

                    if (status === 'completed') {
                        return response.data;
                    }

                    if (status === 'failed') {
                        throw new Error(response.data.processing_error || 'Processing failed');
                    }
                }

                // Wait 2 seconds before next poll
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                if (i === maxAttempts - 1) {
                    throw error;
                }
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        throw new Error('Processing timeout');
    };

    // Handle assign document for e-sign
    const handleAssignDocument = async () => {
        if (!documentToAssign || !selectedTaxpayerId || !deadline) {
            toast.error('Please fill in all required fields', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        try {
            setAssigning(true);
            setPollingStatus({ status: 'pending', message: 'Assigning document...' });

            const assignmentData = {
                document_id: documentToAssign.id || documentToAssign.document_id,
                taxpayer_id: parseInt(selectedTaxpayerId),
                has_spouse: hasSpouse,
                preparer_must_sign: preparerMustSign,
                deadline: deadline
            };

            const response = await esignAssignAPI.assignDocumentForESign(assignmentData);

            if (response.success && response.data) {
                const esignDocId = response.data.id;

                setPollingStatus({
                    status: 'processing',
                    message: 'Document assigned. Processing in background...'
                });

                // Poll for status
                try {
                    const statusData = await pollESignStatus(esignDocId);

                    toast.success('Document assigned for e-signing successfully!', {
                        position: "top-right",
                        autoClose: 5000,
                    });

                    // Close modal and reset
                    setShowAssignModal(false);
                    setDocumentToAssign(null);
                    setSelectedTaxpayerId('');
                    setDeadline('');
                    setHasSpouse(false);
                    setPreparerMustSign(false);
                    setPollingStatus(null);

                    // Refresh documents
                    fetchAllDocuments();
                } catch (pollError) {
                    console.error('Polling error:', pollError);
                    toast.warning('Document assigned but processing is still in progress. Check status later.', {
                        position: "top-right",
                        autoClose: 5000,
                    });
                    setShowAssignModal(false);
                    setDocumentToAssign(null);
                    setSelectedTaxpayerId('');
                    setDeadline('');
                    setHasSpouse(false);
                    setPreparerMustSign(false);
                    setPollingStatus(null);
                }
            } else {
                throw new Error(response.message || 'Failed to assign document');
            }
        } catch (error) {
            console.error('Error assigning document:', error);
            const errorMessage = handleAPIError(error);
            toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to assign document'), {
                position: "top-right",
                autoClose: 5000,
            });
            setPollingStatus(null);
        } finally {
            setAssigning(false);
        }
    };

    // Filter documents based on selected filter and search term
    const getFilteredDocuments = () => {
        let sourceDocs = documents;

        // If searching and we have all data loaded, search EVERYTHING globally
        if (searchTerm.trim() && isRecursiveLoaded.current) {
            const allDocs = allDocumentsRef.current;
            const allFoldersWithFlag = allFoldersRef.current.map(f => ({
                ...f,
                is_folder: true,
                type: 'folder',
                document_type: 'folder'
            }));
            sourceDocs = [...allFoldersWithFlag, ...allDocs];

            // Remove duplicates if any (though there shouldn't be)
            const seenIds = new Set();
            sourceDocs = sourceDocs.filter(d => {
                const id = d.id || d.document_id;
                const isFolder = d.is_folder || d.type === 'folder';
                const key = `${isFolder ? 'f' : 'd'}-${id}`;
                if (seenIds.has(key)) return false;
                seenIds.add(key);
                return true;
            });
        }

        let filtered = sourceDocs;

        // Apply status filter
        if (selectedFilter) {
            const filterLower = selectedFilter.toLowerCase();

            if (filterLower === 'pending') {
                filtered = filtered.filter(d => {
                    const status = (d.status || '').toLowerCase();
                    return status === 'pending_sign' || status === 'pending' || status === 'waiting signature';
                });
            } else if (filterLower === 'completed') {
                filtered = filtered.filter(d => {
                    const status = (d.status || '').toLowerCase();
                    return status === 'processed' || status === 'completed';
                });
            } else if (filterLower === 'overdue') {
                filtered = filtered.filter(d => {
                    if (d.due_date || d.dueDate) {
                        const due = new Date(d.due_date || d.dueDate);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return due < today && (d.status === 'pending_sign' || d.status === 'pending' || (d.status || '').toLowerCase() === 'pending');
                    }
                    return false;
                });
            } else if (filterLower === 'uploaded') {
                // Keep filtered as is, but ensure we are only showing documents, not folders for this stat
                // unless it's a global search
                if (!searchTerm.trim()) {
                    filtered = filtered.filter(d => !d.is_folder && d.type !== 'folder');
                }
            }
        }

        // Apply search filter
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(d => {
                const isFolder = d.is_folder || d.type === 'folder' || d.document_type === 'folder';
                const docName = isFolder
                    ? (d.title || d.name || d.folder_name || 'Untitled Folder').toLowerCase()
                    : (d.file_name || d.name || d.document_name || d.filename || 'Untitled Document').toLowerCase();
                const docType = (d.file_type || d.file_extension || d.type || d.document_type || '').toLowerCase();
                const docFolder = (d.folder?.title || d.folder?.name || d.folder_name || '').toLowerCase();
                const docCategory = (d.category?.name || '').toLowerCase();

                return docName.includes(searchLower) ||
                    docType.includes(searchLower) ||
                    docFolder.includes(searchLower) ||
                    docCategory.includes(searchLower);
            });
        }

        return filtered;
    };

    // Reset to page 1 when filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedFilter, searchTerm]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showMenuIndex !== null && !event.target.closest('[data-menu-container]')) {
                setShowMenuIndex(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showMenuIndex]);

    // Memoize filtered documents to ensure reactivity
    const filteredDocuments = useMemo(() => {
        return getFilteredDocuments();
    }, [documents, selectedFilter, searchTerm]);

    // Pagination for documents
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredDocuments.length);
    const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="p-4 bg-white documents-wrapper" style={{ borderRadius: "15px", minHeight: "400px" }}>
                <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: "300px" }}>
                    <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem", color: "#00C0C6 !important" }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '16px' }}>Loading your documents...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-white documents-wrapper" style={{ borderRadius: "15px", minHeight: "400px" }}>
                <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: "300px" }}>
                    <i className="bi bi-exclamation-triangle-fill text-danger mb-3" style={{ fontSize: "48px" }}></i>
                    <p className="text-danger mb-3" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '16px', fontWeight: '500' }}>Error loading documents</p>
                    <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>{error}</p>
                    <button
                        className="btn btn-primary mt-3"
                        onClick={() => fetchAllDocuments(currentFolderId, true)}
                        style={{ backgroundColor: '#00C0C6', border: 'none' }}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div  >

            {/* Breadcrumb Navigation */}
            {breadcrumbs.length > 0 && (
                <div className="mb-3 d-flex align-items-center gap-2 mydocs-breadcrumb-wrapper" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    <button
                        onClick={() => handleBreadcrumbClick(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#00C0C6',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                        Home
                    </button>
                    {breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={crumb.id}>
                            <span style={{ color: '#6B7280' }}>/</span>
                            {idx === breadcrumbs.length - 1 ? (
                                <span style={{ color: '#3B4A66', fontSize: '14px', fontWeight: '500' }}>
                                    {crumb.title}
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleBreadcrumbClick(crumb.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#00C0C6',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        padding: '4px 8px',
                                        borderRadius: '4px'
                                    }}
                                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                >
                                    {crumb.title}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}

            <div className="row g-3 mb-3">
                {["Pending", "Completed", "Overdue", "Uploaded"].map((label, index) => {

                    const IconComponent = {
                        Pending: AwaitingIcon,
                        Completed: CompletedIcon,
                        Overdue: OverdueIcon,
                        Uploaded: UploadIcons,
                    }[label];

                    const count = stats[label.toLowerCase()] || 0;
                    const isSelected = selectedFilter === label.toLowerCase();
                    const filterKey = label.toLowerCase();

                    return (
                        <div className="col-sm-6 col-md-3" key={index}>
                            <div
                                className="bg-white p-3 d-flex flex-column justify-content-between"
                                style={{
                                    borderRadius: "12px",
                                    height: "130px",
                                    cursor: "pointer",
                                    border: isSelected ? "2px solid #00C0C6" : "1px solid #E8F0FF",
                                    backgroundColor: isSelected ? "#F0FDFF" : "#FFFFFF",
                                    transition: "all 0.2s ease",
                                    boxShadow: isSelected ? "0 2px 8px rgba(0, 192, 198, 0.15)" : "none"
                                }}
                                onClick={() => {
                                    // Toggle filter: if same filter is clicked, deselect it
                                    setSelectedFilter(isSelected ? null : filterKey);
                                    setSelectedIndex(null); // Reset selected document when filter changes
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = "#00C0C6";
                                        e.currentTarget.style.backgroundColor = "#F0FDFF";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = "#E8F0FF";
                                        e.currentTarget.style.backgroundColor = "#FFFFFF";
                                    }
                                }}
                            >
                                <div className="d-flex justify-content-between align-items-start">
                                    <div
                                        className="d-flex align-items-center justify-content-center"
                                        style={{
                                            width: "30px",
                                            height: "30px",
                                            color: isSelected ? "#00C0C6" : "#3B4A66",
                                        }}
                                    >
                                        {IconComponent && <IconComponent size={24} style={{ color: isSelected ? "#00C0C6" : "#3B4A66" }} />}
                                    </div>
                                    <span className="fw-semibold" style={{ color: isSelected ? "#00C0C6" : "#3B4A66", fontSize: "24px" }}>{count}</span>
                                </div>

                                {/* Bottom label */}
                                <div className="mt-2">
                                    <p className="mb-0 small fw-semibold" style={{
                                        fontFamily: "BasisGrotesquePro",
                                        color: isSelected ? "#00C0C6" : "#6B7280"
                                    }}>{label}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>




            {/* Filters */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 mydocs-filter-container">

                <div className="mydocs-search-wrapper">
                    <i className="bi bi-search mydocs-search-icon"></i>
                    <input
                        type="text"
                        className="form-control mydocs-search-input"
                        placeholder="Search folders and documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>


                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <button
                        className="btn btn-primary d-flex align-items-center gap-2"
                        onClick={() => {
                            setShowNewFolderModal(true);
                        }}
                        style={{
                            height: "34px",
                            fontSize: "14px",
                            backgroundColor: "#00C0C6",
                            border: "none"
                        }}
                    >
                        <i className="bi bi-folder-plus"></i>
                        <span className="d-none d-sm-inline">New Folder</span>
                    </button>

                    <button
                        className="rounded border-0 d-flex align-items-center justify-content-center"
                        onClick={() => setView("list")}
                        style={{
                            width: "34px",
                            height: "34px",
                            backgroundColor: view === "list" ? "rgb(0, 192, 198)" : "white",
                            border: view === "list" ? "none" : "1px solid #E8F0FF",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.33333 4H14M5.33333 8H14M5.33333 12H14M2 4H2.00667M2 8H2.00667M2 12H2.00667" stroke={view === "list" ? "white" : "#3B4A66"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button
                        className="rounded border-0 d-flex align-items-center justify-content-center"
                        onClick={() => setView("grid")}
                        style={{
                            width: "34px",
                            height: "34px",
                            backgroundColor: view === "grid" ? "rgb(0, 192, 198)" : "white",
                            border: view === "grid" ? "none" : "1px solid #E8F0FF",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 6H14M2 10H14M6 2V14M10 2V14M3.33333 2H12.6667C13.403 2 14 2.59695 14 3.33333V12.6667C14 13.403 13.403 14 12.6667 14H3.33333C2.59695 14 2 13.403 2 12.6667V3.33333C2 2.59695 2.59695 2 3.33333 2Z" stroke={view === "grid" ? "white" : "#3B4A66"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="p-4 bg-white documents-wrapper" style={{ borderRadius: "15px" }}>
                {/* Documents Section */}
                <div className="align-items-center mb-3">
                    <h5 className="mb-0 me-3" style={{ fontSize: "20px", fontWeight: "500", color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                        {selectedFilter ? `${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Documents` : 'All Documents'} {filteredDocuments.length > 0 && `(${filteredDocuments.length})`}
                    </h5>
                    {filteredDocuments.length > 0 && (
                        <p
                            className="mb-0"
                            style={{
                                color: "#4B5563",
                                fontSize: "14px",
                                fontWeight: "400",
                                fontFamily: "BasisGrotesquePro",
                            }}
                        >
                            {selectedFilter ? `Showing ${selectedFilter} documents` : 'View and manage all your uploaded documents'}
                        </p>
                    )}
                </div>

                {filteredDocuments.length === 0 && documents.length === 0 && (
                    <div className="pt-4 pb-4 text-center">
                        <h6 className="mb-2" style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>
                            No Documents Yet
                        </h6>
                        <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>
                            You haven't uploaded any documents yet. Use the "Upload Documents" button above to get started.
                        </p>
                    </div>
                )}
                {filteredDocuments.length === 0 && documents.length > 0 && (
                    <div className="pt-4 pb-4 text-center">
                        <h6 className="mb-2" style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>
                            {searchTerm.trim() ? 'No Documents Found' : `No ${selectedFilter ? selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1) : ''} Documents`}
                        </h6>
                        <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>
                            {searchTerm.trim()
                                ? `No documents found matching "${searchTerm}". Try a different search term.`
                                : (selectedFilter ? `No documents match the ${selectedFilter} filter.` : 'No documents found.')
                            }
                        </p>
                    </div>
                )}
                {filteredDocuments.length > 0 && (
                    <div className="pt-2 pb-2">
                        <div className={`row g-3 ${view === "grid" ? "" : ""}`}>
                            {paginatedDocuments.map((doc, index) => {
                                const isFolder = doc.is_folder || doc.type === 'folder' || doc.document_type === 'folder';
                                const docName = isFolder
                                    ? (doc.title || doc.name || doc.folder_name || 'Untitled Folder')
                                    : (doc.file_name || doc.name || doc.document_name || doc.filename || 'Untitled Document');
                                const docSize = doc.file_size_formatted || (doc.file_size_bytes ? formatFileSize(doc.file_size_bytes) : (doc.file_size ? formatFileSize(doc.file_size) : '0 KB'));
                                const docType = doc.file_type || doc.file_extension?.toUpperCase() || doc.type || doc.document_type || 'PDF';
                                const docDate = doc.updated_at_formatted || doc.created_at_formatted || doc.updated_at || doc.created_at || doc.date || 'N/A';
                                const docFolder = doc.folder?.title || doc.folder?.name || doc.folder_name || 'General';
                                // Get category from multiple possible sources
                                const docCategory = doc.category?.name ||
                                    (doc.requested_categories && Array.isArray(doc.requested_categories) && doc.requested_categories.length > 0
                                        ? doc.requested_categories.map(cat => cat.name || cat).join(', ')
                                        : '') ||
                                    (doc.document_request?.requested_categories && Array.isArray(doc.document_request.requested_categories) && doc.document_request.requested_categories.length > 0
                                        ? doc.document_request.requested_categories.map(cat => cat.name || cat).join(', ')
                                        : '');
                                const docStatus = doc.status_display || doc.status || 'Pending';
                                const docStatusValue = doc.status || 'pending';
                                const fileUrl = doc.file_url || doc.tax_documents || '';

                                return (
                                    <div className={view === "grid" ? "col-12 col-sm-6 col-md-4 col-lg-3" : "col-12"} key={doc.id || doc.document_id || index}>
                                        <div
                                            className="p-3 border rounded-4"
                                            style={{
                                                backgroundColor: selectedIndex === (startIndex + index) ? "#FFF4E6" : "#FFFFFF",
                                                cursor: "pointer",
                                                transition: "background-color 0.3s ease",
                                            }}
                                            onClick={() => {
                                                // Close menu if clicking on document
                                                if (showMenuIndex === (startIndex + index)) {
                                                    setShowMenuIndex(null);
                                                    return;
                                                }

                                                // Check if it's a folder - navigate into it
                                                if (doc.is_folder || doc.type === 'folder' || doc.document_type === 'folder') {
                                                    handleFolderClick(doc);
                                                    return;
                                                }

                                                setSelectedIndex(startIndex + index);
                                                // Allow preview for PDFs and Images
                                                if (fileUrl) {
                                                    setSelectedDocument(doc);
                                                    setShowPdfModal(true);
                                                }
                                            }}
                                            title={doc.is_folder || doc.type === 'folder' || doc.document_type === 'folder' ? 'Click to open folder' : (fileUrl ? 'Click to preview' : '')}
                                        >
                                            <div className="d-flex justify-content-between align-items-start flex-wrap">
                                                {/* Left Side: File Info */}
                                                <div className="d-flex gap-3 align-items-start" style={{ flex: 1, minWidth: 0 }}>
                                                    <div
                                                        className="d-flex align-items-center justify-content-center"
                                                        style={{ width: 40, height: 40, flexShrink: 0 }}
                                                    >
                                                        {doc.is_folder || doc.type === 'folder' || doc.document_type === 'folder' ? (
                                                            <i className="bi bi-folder-fill" style={{ fontSize: '40px', color: '#F49C2D' }}></i>
                                                        ) : (
                                                            <span className="mydocs-icon-wrapper">
                                                                <FileIcon />
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div className="fw-medium mb-1 d-none d-md-flex align-items-center gap-2" style={{ fontFamily: "BasisGrotesquePro", fontSize: "15px", color: "#3B4A66" }}>
                                                            {docName}
                                                            {/* {(docType.toLowerCase() === 'pdf' || doc.file_extension?.toLowerCase() === 'pdf') && (
                                                                <span style={{ fontSize: '12px', color: '#EF4444', fontFamily: 'BasisGrotesquePro' }}>
                                                                    <i className="bi bi-file-pdf me-1"></i>
                                                                    PDF
                                                                </span>
                                                            )} */}
                                                        </div>
                                                        <div className="text-muted" style={{ fontSize: "13px", fontFamily: "BasisGrotesquePro", color: "#6B7280", fontWeight: "400" }}>
                                                            {doc.is_folder || doc.type === 'folder' || doc.document_type === 'folder' ? (
                                                                <>Folder • Updated: {docDate}</>
                                                            ) : (
                                                                <>Size: {docSize} • Updated: {docDate}
                                                                    {docCategory && docCategory.trim() && (
                                                                        <> • Category: {docCategory}</>
                                                                    )}</>
                                                            )}
                                                        </div>

                                                        {docCategory && docCategory.trim() && (
                                                            <div className="mt-2 d-flex flex-wrap gap-2">
                                                                {docCategory.split(', ').map((category, catIndex) => (
                                                                    <span
                                                                        key={catIndex}
                                                                        className="badge rounded-pill bg-white text-dark border"
                                                                        style={{
                                                                            fontSize: "0.75rem",
                                                                            fontFamily: "BasisGrotesquePro",
                                                                            padding: "4px 8px",
                                                                            borderColor: "#E8F0FF"
                                                                        }}
                                                                    >
                                                                        {category.trim()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Side: Status + Actions + Menu */}
                                                <div className="d-flex align-items-center gap-2 mt-2 mt-md-0" style={{ flexShrink: 0 }}>
                                                    {/* Status badge for files */}
                                                    {!(doc.is_folder || doc.type === 'folder' || doc.document_type === 'folder') && (
                                                        <>


                                                            {/* Show Preview button for pending_sign status, otherwise show status badge */}
                                                            {(docStatusValue.toLowerCase() === 'pending_sign' || docStatusValue.toLowerCase() === 'pending sign') ? (
                                                                <button
                                                                    className="btn px-3 py-2"
                                                                    style={{
                                                                        borderRadius: "20px",
                                                                        fontSize: "0.75rem",
                                                                        fontWeight: "500",
                                                                        fontFamily: "BasisGrotesquePro",
                                                                        backgroundColor: "#3AD6F2",
                                                                        color: "#FFFFFF",
                                                                        border: "none",
                                                                        cursor: "pointer",
                                                                    }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (fileUrl) {
                                                                            setSelectedDocument(doc);
                                                                            setShowPdfModal(true);
                                                                        }
                                                                    }}
                                                                >
                                                                    Preview
                                                                </button>
                                                            ) : (
                                                                <span
                                                                    className={`badge ${getStatusBadgeClass(docStatusValue)} px-3 py-2`}
                                                                    style={{
                                                                        borderRadius: "20px",
                                                                        fontSize: "0.75rem",
                                                                        fontWeight: "500",
                                                                        fontFamily: "BasisGrotesquePro",
                                                                        color: "#FFFFFF"
                                                                    }}
                                                                >
                                                                    {docStatus}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Menu for both files and folders */}
                                                    {true && (
                                                        <div style={{ position: 'relative' }} data-menu-container>
                                                            <button
                                                                className="btn btn-white border-0 p-2 d-flex align-items-center justify-content-center"
                                                                style={{
                                                                    width: "32px",
                                                                    height: "32px",
                                                                    borderRadius: "50%",
                                                                    fontFamily: "BasisGrotesquePro",
                                                                    backgroundColor: showMenuIndex === (startIndex + index) ? '#F3F4F6' : 'transparent',
                                                                    border: '1px solid #E5E7EB',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                                                                    e.currentTarget.style.borderColor = '#D1D5DB';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (showMenuIndex !== (startIndex + index)) {
                                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                                        e.currentTarget.style.borderColor = '#E5E7EB';
                                                                    }
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowMenuIndex(showMenuIndex === (startIndex + index) ? null : (startIndex + index));
                                                                }}
                                                                title="More options"
                                                            >
                                                                <i className="bi bi-three-dots-vertical" style={{
                                                                    fontSize: '18px',
                                                                    color: '#6B7280',
                                                                    fontWeight: 'bold'
                                                                }} />
                                                            </button>
                                                            {showMenuIndex === (startIndex + index) && (
                                                                <div
                                                                    style={{
                                                                        position: 'absolute',
                                                                        right: 0,
                                                                        top: '100%',
                                                                        marginTop: '4px',
                                                                        backgroundColor: 'white',
                                                                        border: '1px solid #E5E7EB',
                                                                        borderRadius: '8px',
                                                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                                                        zIndex: 1000,
                                                                        minWidth: '150px',
                                                                        padding: '4px 0'
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {/* Only show Assign for E-Sign for files, not folders */}
                                                                    {isFile(doc) ? (
                                                                        <>


                                                                            <button
                                                                                className="btn btn-white border-0 w-100 text-start px-3 py-2"
                                                                                style={{
                                                                                    fontFamily: 'BasisGrotesquePro',
                                                                                    fontSize: '14px',
                                                                                    color: '#FF9800',
                                                                                    cursor: 'pointer',
                                                                                    borderBottom: '1px solid #E5E7EB'
                                                                                }}
                                                                                onMouseEnter={(e) => {
                                                                                    e.target.style.backgroundColor = '#FFF4E5';
                                                                                }}
                                                                                onMouseLeave={(e) => {
                                                                                    e.target.style.backgroundColor = 'white';
                                                                                }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setShowMenuIndex(null);
                                                                                    handleArchiveDocument(doc.id || doc.document_id, false);
                                                                                }}
                                                                            >
                                                                                <i className="bi bi-archive me-2"></i>
                                                                                Archive
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        /* Folder options: Rename + Archive */
                                                                        <>
                                                                            <button
                                                                                className="btn btn-white border-0 w-100 text-start px-3 py-2"
                                                                                style={{
                                                                                    fontFamily: 'BasisGrotesquePro',
                                                                                    fontSize: '14px',
                                                                                    color: '#3B4A66',
                                                                                    cursor: 'pointer',
                                                                                    borderBottom: '1px solid #E5E7EB'
                                                                                }}
                                                                                onMouseEnter={(e) => {
                                                                                    e.target.style.backgroundColor = '#F3F4F6';
                                                                                }}
                                                                                onMouseLeave={(e) => {
                                                                                    e.target.style.backgroundColor = 'white';
                                                                                }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setShowMenuIndex(null);
                                                                                    // Simple rename prompt for MVP
                                                                                    const newName = prompt("Enter new folder name:", doc.title || doc.name);
                                                                                    if (newName && newName !== doc.title && newName !== doc.name) {
                                                                                        handleRenameFolder(doc, newName);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <i className="bi bi-pencil-square me-2"></i>
                                                                                Rename
                                                                            </button>

                                                                            <button
                                                                                className="btn btn-white border-0 w-100 text-start px-3 py-2"
                                                                                style={{
                                                                                    fontFamily: 'BasisGrotesquePro',
                                                                                    fontSize: '14px',
                                                                                    color: '#FF9800',
                                                                                    cursor: 'pointer',
                                                                                    borderBottom: '1px solid #E5E7EB'
                                                                                }}
                                                                                onMouseEnter={(e) => {
                                                                                    e.target.style.backgroundColor = '#FFF4E5';
                                                                                }}
                                                                                onMouseLeave={(e) => {
                                                                                    e.target.style.backgroundColor = 'white';
                                                                                }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setShowMenuIndex(null);
                                                                                    handleArchiveFolder(doc);
                                                                                }}
                                                                            >
                                                                                <i className="bi bi-archive me-2"></i>
                                                                                Archive
                                                                            </button>
                                                                        </>
                                                                    )}

                                                                    <button
                                                                        className="btn btn-white border-0 w-100 text-start px-3 py-2"
                                                                        style={{
                                                                            fontFamily: 'BasisGrotesquePro',
                                                                            fontSize: '14px',
                                                                            color: '#EF4444',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            e.target.style.backgroundColor = '#FEF2F2';
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.target.style.backgroundColor = 'white';
                                                                        }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (isFile(doc)) {
                                                                                handleDeleteDocument(doc);
                                                                            } else {
                                                                                handleDeleteFolder(doc);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <i className="bi bi-trash me-2"></i>
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {filteredDocuments.length > itemsPerPage && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={filteredDocuments.length}
                                itemsPerPage={itemsPerPage}
                                startIndex={startIndex}
                                endIndex={endIndex}
                            />
                        )}
                    </div>
                )}

            </div>

            {/* PDF Viewer Modal */}
            {showPdfModal && selectedDocument && (
                <div
                    className="modal pdf-modal-overlay"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        zIndex: 1050,
                        padding: '20px'
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowPdfModal(false);
                            setSelectedDocument(null);
                        }
                    }}
                >
                    <div className="pdf-modal-container"
                        style={{
                            width: '100%',
                            maxWidth: 'min(880px, 70vw)',
                            minHeight: '70vh',
                            maxHeight: '90vh',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #E5E7EB',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'white',
                            borderTopLeftRadius: '12px',
                            borderTopRightRadius: '12px'
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h5 style={{
                                    margin: 0,
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#3B4A66',
                                    fontFamily: 'BasisGrotesquePro',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {selectedDocument.file_name || selectedDocument.name || 'Document'}
                                </h5>
                                <small style={{
                                    color: '#6B7280',
                                    fontSize: '12px',
                                    fontFamily: 'BasisGrotesquePro'
                                }}>
                                    {selectedDocument.file_size_formatted || 'PDF Document'}
                                </small>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {/* Download button */}
                                <a
                                    href={selectedDocument.file_url || selectedDocument.tax_documents}
                                    download={selectedDocument.file_name || 'document.pdf'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#F3F4F6',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '6px',
                                        color: '#3B4A66',
                                        fontSize: '14px',
                                        textDecoration: 'none',
                                        fontFamily: 'BasisGrotesquePro',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#E5E7EB'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                                >
                                    <i className="bi bi-download"></i>
                                    Download
                                </a>
                                {/* Archive/Unarchive button */}
                                {selectedDocument && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const docId = selectedDocument.id || selectedDocument.document_id;
                                            const isArchived = selectedDocument.is_archived || false;
                                            if (docId) {
                                                handleArchiveDocument(docId, isArchived);
                                            }
                                        }}
                                        disabled={archivingDocumentId === (selectedDocument.id || selectedDocument.document_id)}
                                        style={{
                                            padding: '8px 12px',
                                            backgroundColor: selectedDocument.is_archived ? '#10B981' : '#F3F4F6',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '6px',
                                            color: selectedDocument.is_archived ? '#FFFFFF' : '#3B4A66',
                                            fontSize: '14px',
                                            fontFamily: 'BasisGrotesquePro',
                                            cursor: archivingDocumentId === (selectedDocument.id || selectedDocument.document_id) ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            transition: 'background-color 0.2s',
                                            opacity: archivingDocumentId === (selectedDocument.id || selectedDocument.document_id) ? 0.6 : 1
                                        }}
                                        onMouseEnter={(e) => {
                                            if (archivingDocumentId !== (selectedDocument.id || selectedDocument.document_id)) {
                                                e.target.style.backgroundColor = selectedDocument.is_archived ? '#059669' : '#E5E7EB';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (archivingDocumentId !== (selectedDocument.id || selectedDocument.document_id)) {
                                                e.target.style.backgroundColor = selectedDocument.is_archived ? '#10B981' : '#F3F4F6';
                                            }
                                        }}
                                    >
                                        <i className="bi bi-archive"></i>
                                        {archivingDocumentId === (selectedDocument.id || selectedDocument.document_id)
                                            ? 'Processing...'
                                            : (selectedDocument.is_archived ? 'Archived' : 'Archive')
                                        }
                                    </button>
                                )}
                                {/* Close button */}
                                <button
                                    onClick={() => {
                                        setShowPdfModal(false);
                                        setSelectedDocument(null);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#6B7280',
                                        fontSize: '24px',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        transition: 'background-color 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#F3F4F6';
                                        e.target.style.color = '#111827';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                        e.target.style.color = '#6B7280';
                                    }}
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            </div>
                        </div>

                        {/* PDF Viewer */}
                        <div style={{
                            flex: 1,
                            overflow: 'hidden',
                            position: 'relative',
                            backgroundColor: '#F9FAFB',
                            display: 'flex',
                            justifyContent: 'center',
                            padding: '24px 16px'
                        }}>
                            {(() => {
                                const fileExt = (selectedDocument.file_extension || selectedDocument.file_type || '').toLowerCase();
                                const fileName = (selectedDocument.file_name || selectedDocument.name || '').toLowerCase();
                                const isPdf = fileExt === 'pdf' || fileName.endsWith('.pdf');
                                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(fileExt) || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(fileName);

                                if (isPdf) {
                                    return (
                                        <iframe
                                            src={`${selectedDocument.file_url || selectedDocument.tax_documents}#toolbar=1`}
                                            title={selectedDocument.file_name || 'PDF Viewer'}
                                            style={{
                                                width: '100%',
                                                maxWidth: '700px',
                                                height: '100%',
                                                border: 'none',
                                                minHeight: '500px'
                                            }}
                                        ></iframe>
                                    );
                                } else if (isImage) {
                                    return (
                                        <img
                                            src={selectedDocument.file_url || selectedDocument.tax_documents}
                                            alt={selectedDocument.file_name || 'Preview'}
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                objectFit: 'contain',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                    );
                                } else {
                                    const isExcel = ['xlsx', 'xls', 'csv'].includes(fileExt) || /\.(xlsx?|csv)$/.test(fileName);

                                    if (isExcel) {
                                        // Excel file - show loading or table based on state
                                        const fileUrl = selectedDocument.file_url || selectedDocument.tax_documents;

                                        // Trigger Excel parsing if not already loaded
                                        if (!excelPreviewData && !loadingExcelPreview && fileUrl) {
                                            setLoadingExcelPreview(true);
                                            fetch(fileUrl)
                                                .then(response => response.arrayBuffer())
                                                .then(arrayBuffer => {
                                                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                                                    const firstSheetName = workbook.SheetNames[0];
                                                    const worksheet = workbook.Sheets[firstSheetName];
                                                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                                                    // Limit to first 100 rows and 10 columns for preview
                                                    const previewData = jsonData.slice(0, 100).map(row =>
                                                        Array.isArray(row) ? row.slice(0, 10) : []
                                                    );

                                                    setExcelPreviewData({
                                                        sheetName: firstSheetName,
                                                        data: previewData,
                                                        totalRows: jsonData.length,
                                                        totalSheets: workbook.SheetNames.length
                                                    });
                                                    setLoadingExcelPreview(false);
                                                })
                                                .catch(error => {
                                                    console.error('Error loading Excel file:', error);
                                                    setLoadingExcelPreview(false);
                                                });
                                        }

                                        if (loadingExcelPreview) {
                                            return (
                                                <div className="d-flex flex-column align-items-center justify-content-center text-center h-100">
                                                    <div className="spinner-border text-success mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                    <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>Loading Excel preview...</p>
                                                </div>
                                            );
                                        }

                                        if (excelPreviewData && excelPreviewData.data && excelPreviewData.data.length > 0) {
                                            return (
                                                <div style={{ width: '100%', maxWidth: '900px', height: '100%', overflow: 'auto' }}>
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
                                                            <i className="bi bi-table" style={{ fontSize: '18px' }}></i>
                                                            <span style={{ fontWeight: '600' }}>{selectedDocument.file_name || selectedDocument.name}</span>
                                                        </div>
                                                        <span style={{ fontSize: '12px', opacity: 0.9 }}>
                                                            Sheet: {excelPreviewData.sheetName} • {excelPreviewData.totalRows} rows
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        maxHeight: '450px',
                                                        overflow: 'auto',
                                                        border: '1px solid #E5E7EB',
                                                        borderTop: 'none',
                                                        borderRadius: '0 0 8px 8px',
                                                        backgroundColor: 'white'
                                                    }}>
                                                        <table style={{
                                                            width: '100%',
                                                            borderCollapse: 'collapse',
                                                            fontSize: '13px'
                                                        }}>
                                                            <tbody>
                                                                {excelPreviewData.data.map((row, rowIdx) => (
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
                                                    {excelPreviewData.totalRows > 100 && (
                                                        <div style={{
                                                            padding: '8px',
                                                            textAlign: 'center',
                                                            backgroundColor: '#FEF3C7',
                                                            borderRadius: '0 0 8px 8px',
                                                            fontSize: '12px',
                                                            color: '#92400E'
                                                        }}>
                                                            Showing first 100 rows. Download file to view all {excelPreviewData.totalRows} rows.
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                    }

                                    // Default fallback for non-previewable files
                                    return (
                                        <div className="d-flex flex-column align-items-center justify-content-center text-center h-100">
                                            <div className="mb-3 p-4 bg-white rounded-circle shadow-sm" style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <i className={`bi ${isExcel ? 'bi-file-earmark-spreadsheet text-success' : 'bi-file-earmark-text text-secondary'}`} style={{ fontSize: '40px' }}></i>
                                            </div>
                                            <h5 className="text-secondary mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>{isExcel ? 'Unable to load preview' : 'Preview not available'}</h5>
                                            <p className="text-muted mb-4" style={{ maxWidth: '300px', fontSize: '14px' }}>
                                                {isExcel ? 'There was an error loading the Excel preview. Please download the file to view it.' : 'This file type cannot be previewed directly. Please download the file to view it.'}
                                            </p>
                                            <a
                                                href={selectedDocument.file_url || selectedDocument.tax_documents}
                                                download={selectedDocument.file_name || 'document'}
                                                className="btn btn-primary"
                                                style={{ backgroundColor: '#00C0C6', border: 'none' }}
                                            >
                                                Download File
                                            </a>
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Document Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteDocumentConfirm}
                onClose={() => {
                    if (!deletingDocumentId) {
                        setShowDeleteDocumentConfirm(false);
                        setDocumentToDelete(null);
                    }
                }}
                onConfirm={confirmDeleteDocument}
                title="Delete Document"
                message={documentToDelete ? `Are you sure you want to delete "${documentToDelete.file_name || documentToDelete.name || documentToDelete.document_name || 'this document'}"? This action cannot be undone.` : "Are you sure you want to delete this document? This action cannot be undone."}
                confirmText="Delete"
                cancelText="Cancel"
                confirmButtonStyle={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
                isLoading={!!deletingDocumentId}
            />

            {/* Assign Document for E-Sign Modal */}
            <Modal
                show={showAssignModal}
                onHide={() => {
                    if (!assigning) {
                        setShowAssignModal(false);
                        setDocumentToAssign(null);
                        setSelectedTaxpayerId('');
                        setDeadline('');
                        setHasSpouse(false);
                        setPreparerMustSign(false);
                        setPollingStatus(null);
                    }
                }}
                centered
                size="lg"
            >
                <Modal.Header closeButton style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', color: '#3B4A66' }}>
                        Assign Document for E-Sign
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ fontFamily: 'BasisGrotesquePro' }}>
                    {documentToAssign && (
                        <div className="mb-3 p-3" style={{ backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>Document</div>
                            <div style={{ fontSize: '16px', color: '#3B4A66', fontWeight: '500' }}>
                                {documentToAssign.file_name || documentToAssign.name || documentToAssign.document_name || 'Untitled Document'}
                            </div>
                        </div>
                    )}

                    {pollingStatus && (
                        <div className="mb-3 p-3" style={{
                            backgroundColor: pollingStatus.status === 'completed' ? '#F0FDF4' : '#FEF3C7',
                            borderRadius: '8px',
                            border: `1px solid ${pollingStatus.status === 'completed' ? '#10B981' : '#F59E0B'}`
                        }}>
                            <div style={{ fontSize: '14px', color: '#3B4A66', fontWeight: '500' }}>
                                {pollingStatus.status === 'completed' ? '✓' : '⏳'} {pollingStatus.message}
                            </div>
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="form-label" style={{ fontSize: '14px', color: '#3B4A66', fontWeight: '500' }}>
                            Signer <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <select
                            className="form-control"
                            value={selectedTaxpayerId}
                            onChange={(e) => setSelectedTaxpayerId(e.target.value)}
                            disabled={assigning}
                            style={{ fontFamily: 'BasisGrotesquePro' }}
                        >
                            {/* If we have taxpayers loaded (Preparer mode), list them */}
                            {taxpayers.length > 0 ? (
                                <>
                                    <option value="">Select signer...</option>
                                    {taxpayers.map((taxpayer) => (
                                        <option key={taxpayer.id} value={taxpayer.id}>
                                            {taxpayer.full_name || `${taxpayer.first_name || ''} ${taxpayer.last_name || ''}`.trim() || taxpayer.email || `Taxpayer ${taxpayer.id}`}
                                        </option>
                                    ))}
                                </>
                            ) : (
                                /* If no taxpayers loaded (Taxpayer mode), default to current user */
                                <option value={selectedTaxpayerId}>Me (Current User)</option>
                            )}
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="form-label" style={{ fontSize: '14px', color: '#3B4A66', fontWeight: '500' }}>
                            Signing Deadline <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <input
                            type="date"
                            className="form-control"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            disabled={assigning}
                            min={new Date().toISOString().split('T')[0]}
                            style={{ fontFamily: 'BasisGrotesquePro' }}
                        />
                    </div>

                    <div className="mb-3">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={hasSpouse}
                                onChange={(e) => setHasSpouse(e.target.checked)}
                                disabled={assigning}
                                id="hasSpouse"
                            />
                            <label className="form-check-label" htmlFor="hasSpouse" style={{ fontSize: '14px', color: '#3B4A66' }}>
                                Spouse signature required
                            </label>
                        </div>
                    </div>

                    <div className="mb-3">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={preparerMustSign}
                                onChange={(e) => setPreparerMustSign(e.target.checked)}
                                disabled={assigning}
                                id="preparerMustSign"
                            />
                            <label className="form-check-label" htmlFor="preparerMustSign" style={{ fontSize: '14px', color: '#3B4A66' }}>
                                Preparer must also sign
                            </label>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ borderTop: '1px solid #E5E7EB' }}>
                    <button
                        className="btn"
                        onClick={() => {
                            if (!assigning) {
                                setShowAssignModal(false);
                                setDocumentToAssign(null);
                                setSelectedTaxpayerId('');
                                setDeadline('');
                                setHasSpouse(false);
                                setPreparerMustSign(false);
                                setPollingStatus(null);
                            }
                        }}
                        disabled={assigning}
                        style={{
                            fontFamily: 'BasisGrotesquePro',
                            backgroundColor: '#FFFFFF',
                            color: '#3B4A66',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '8px 16px'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn"
                        onClick={handleAssignDocument}
                        disabled={assigning || !selectedTaxpayerId || !deadline}
                        style={{
                            fontFamily: 'BasisGrotesquePro',
                            backgroundColor: assigning ? '#9CA3AF' : '#00C0C6',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            cursor: assigning || !selectedTaxpayerId || !deadline ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {assigning ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Assigning...
                            </>
                        ) : (
                            'Assign Document'
                        )}
                    </button>
                </Modal.Footer>
            </Modal>
            <NewFolderModal
                show={showNewFolderModal}
                handleClose={() => setShowNewFolderModal(false)}
                onCreateFolder={handleCreateFolder}
            />
        </div>
    );
}


