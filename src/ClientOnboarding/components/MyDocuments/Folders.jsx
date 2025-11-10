import React, { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaFolder, FaTrash, FaUndo } from "react-icons/fa";
import { BiGridAlt, BiListUl } from "react-icons/bi";
import { FileIcon } from "../icons";
import { handleAPIError, folderTrashAPI } from "../../utils/apiUtils";
import { getApiBaseUrl, fetchWithCors } from "../../utils/corsConfig";
import { getAccessToken } from "../../utils/userUtils";
import { toast } from "react-toastify";
import "../../styles/Folders.css";

export default function Folders({ onFolderSelect }) {
    const [view, setView] = useState("grid");
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDocIndex, setSelectedDocIndex] = useState(null);
    const [activeButton, setActiveButton] = useState("folder"); // "folder" or "trash"
    const [folders, setFolders] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [folderPath, setFolderPath] = useState([]);
    const [statistics, setStatistics] = useState({
        total_folders: 0,
        total_documents: 0,
        archived_documents: 0
    });
    const [trashedFolders, setTrashedFolders] = useState([]);
    const [trashingFolder, setTrashingFolder] = useState(null);
    const [recoveringFolder, setRecoveringFolder] = useState(null);

    // Fetch folders from API
    const fetchFolders = async (folderId = null) => {
        try {
            setLoading(true);
            setError(null);

            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            if (!token) {
                console.error('No authentication token found');
                setLoading(false);
                return;
            }

            const config = {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };

            const url = folderId
                ? `${API_BASE_URL}/taxpayer/my-documents/browse/?folder_id=${folderId}`
                : `${API_BASE_URL}/taxpayer/my-documents/browse/`;

            const response = await fetchWithCors(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Folders API response:', result);

            if (result.success && result.data) {
                // Update current folder
                if (result.data.current_folder) {
                    setCurrentFolder(result.data.current_folder);
                    // Update folder path from breadcrumbs
                    if (result.data.breadcrumbs && Array.isArray(result.data.breadcrumbs)) {
                        const path = result.data.breadcrumbs.map(b => b.title);
                        setFolderPath(path);
                    } else {
                        setFolderPath([]);
                    }
                } else {
                    setCurrentFolder(null);
                    // Update folder path from breadcrumbs even when at root
                    if (result.data.breadcrumbs && Array.isArray(result.data.breadcrumbs)) {
                        const path = result.data.breadcrumbs.map(b => b.title);
                        setFolderPath(path);
                    } else {
                        setFolderPath([]);
                    }
                }

                // Handle folders - check for 'folders' array (root level) or 'subfolders' (inside a folder)
                let foldersList = [];
                if (result.data.folders && Array.isArray(result.data.folders)) {
                    // Root level folders
                    foldersList = result.data.folders;
                } else if (result.data.subfolders && Array.isArray(result.data.subfolders)) {
                    // Subfolders when inside a folder
                    foldersList = result.data.subfolders;
                }
                setFolders(foldersList);

                // Set documents - check for 'documents' array or files from current_folder
                // IMPORTANT: At root level, documents array should be empty - files inside folders should NOT be shown
                // Only show documents when explicitly inside a folder (current_folder exists or documents array has items)
                let docs = [];

                // First priority: Check if documents array exists and has items (main way API returns files when inside a folder)
                if (result.data.documents && Array.isArray(result.data.documents)) {
                    docs = result.data.documents;
                }
                // Second priority: Check if current_folder has files array (alternative structure)
                else if (result.data.current_folder && result.data.current_folder.files && Array.isArray(result.data.current_folder.files)) {
                    docs = result.data.current_folder.files;
                }
                // At root level (current_folder is null and documents is empty), docs will be empty array - this is correct

                console.log('Setting documents:', docs.length, 'documents');
                setDocuments(docs);

                // Set statistics
                if (result.data.statistics) {
                    setStatistics(result.data.statistics);
                }
            } else {
                setFolders([]);
                setDocuments([]);
            }
        } catch (error) {
            console.error('Error fetching folders:', error);
            setError(handleAPIError(error));
            setFolders([]);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch folders on component mount
    useEffect(() => {
        if (activeButton === "folder") {
            fetchFolders(null);
        } else if (activeButton === "trash") {
            fetchTrashedFolders();
        }
    }, [activeButton]);

    // Fetch trashed folders
    const fetchTrashedFolders = async (search = '', sortBy = '-trashed_at', page = 1, pageSize = 20) => {
        try {
            setLoading(true);
            setError(null);

            const result = await folderTrashAPI.getTrashedFolders(search, sortBy, page, pageSize);

            if (result.success && result.data) {
                setTrashedFolders(result.data.folders || []);
                if (result.data.statistics) {
                    setStatistics({
                        total_folders: result.data.statistics.total_trashed_folders || 0,
                        total_documents: result.data.statistics.total_trashed_documents || 0,
                        archived_documents: 0
                    });
                }
            } else {
                setTrashedFolders([]);
            }
        } catch (error) {
            console.error('Error fetching trashed folders:', error);
            setError(handleAPIError(error).message || 'Failed to load trashed folders');
            setTrashedFolders([]);
            toast.error(handleAPIError(error).message || 'Failed to load trashed folders', {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle trash folder action
    const handleTrashFolder = async (folderId, folderTitle) => {
        if (!window.confirm(`Are you sure you want to move "${folderTitle}" to trash? This will also move all documents and subfolders inside it to trash.`)) {
            return;
        }

        try {
            setTrashingFolder(folderId);
            const result = await folderTrashAPI.trashFolder(folderId);

            if (result.success) {
                toast.success(result.message || `Folder "${folderTitle}" moved to trash successfully`, {
                    position: "top-right",
                    autoClose: 3000,
                });
                // Refresh folders list
                fetchFolders(null);
            } else {
                throw new Error(result.message || 'Failed to trash folder');
            }
        } catch (error) {
            console.error('Error trashing folder:', error);
            const errorMessage = handleAPIError(error).message || 'Failed to move folder to trash';
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setTrashingFolder(null);
        }
    };

    // Handle recover folder action
    const handleRecoverFolder = async (folderId, folderTitle) => {
        try {
            setRecoveringFolder(folderId);
            const result = await folderTrashAPI.recoverFolder(folderId);

            if (result.success) {
                toast.success(result.message || `Folder "${folderTitle}" recovered from trash successfully`, {
                    position: "top-right",
                    autoClose: 3000,
                });
                // Refresh trashed folders list
                fetchTrashedFolders();
            } else {
                throw new Error(result.message || 'Failed to recover folder');
            }
        } catch (error) {
            console.error('Error recovering folder:', error);
            const errorMessage = handleAPIError(error).message || 'Failed to recover folder from trash';
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setRecoveringFolder(null);
        }
    };

    // Format file size helper
    const formatFileSize = (bytes) => {
        if (!bytes) return '0 KB';
        if (typeof bytes === 'string') {
            if (bytes.includes('MB') || bytes.includes('KB')) return bytes;
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

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        const statusLower = (status || '').toLowerCase();
        if (statusLower.includes('processed') || statusLower.includes('completed')) {
            return 'bg-darkgreen text-white';
        } else if (statusLower.includes('signature') || statusLower.includes('waiting')) {
            return 'bg-darkblue text-white';
        } else if (statusLower.includes('review')) {
            return 'bg-darkbroun text-white';
        } else if (statusLower.includes('clarification')) {
            return 'bg-darkcolour text-white';
        }
        return 'bg-darkblue text-white';
    };

    // Handle folder click - navigate into folder on same page
    const handleFolderClick = (folder, idx) => {
        setSelectedIndex(idx);
        // Clear current documents before fetching new folder contents
        setDocuments([]);
        // Fetch folder contents - this will update the page content on same page
        // The API should return files in documents array or current_folder.files when inside a folder
        fetchFolders(folder.id);
    };

    // Handle back to folders
    const handleBackToFolders = () => {
        setSelectedFolder(null);
        setSelectedIndex(null);
        setDocuments([]);
        // Navigate back to root or parent folder
        fetchFolders(null);
        if (onFolderSelect) {
            onFolderSelect(false);
        }
    };

    // If folder is selected, show documents view
    if (selectedFolder) {
        return (
            <div className="folders-wrapper" style={{ minHeight: '400px', padding: '0' }}>
                {/* Back Button and Breadcrumb */}
                <div className="mb-3 px-2" style={{ backgroundColor: "white", padding: "12px 16px", borderRadius: "8px" }}>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <button
                            onClick={handleBackToFolders}
                            className="btn btn-sm text-primary p-0 border-0 bg-transparent"
                            style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}
                        >
                            <i className="bi bi-house me-1"></i>
                            Home
                        </button>
                        {folderPath.map((pathSegment, idx) => (
                            <React.Fragment key={idx}>
                                <span style={{ color: "#6B7280", fontFamily: "BasisGrotesquePro" }}>/</span>
                                <span
                                    className="text-primary"
                                    style={{
                                        fontFamily: "BasisGrotesquePro",
                                        fontSize: "14px",
                                        fontWeight: idx === folderPath.length - 1 ? "500" : "400"
                                    }}
                                >
                                    {pathSegment}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Top Controls */}
                <div className="d-flex justify-content-between align-items-center flex-wrap px-2 pt-2">
                    <div className="d-flex align-items-center gap-2">
                        <div className="search-box position-relative" style={{ width: "100%" }}>
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{
                                    position: "absolute",
                                    left: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    zIndex: 1
                                }}
                            >
                                <path d="M11 11L8.49167 8.49167M9.83333 5.16667C9.83333 7.74399 7.74399 9.83333 5.16667 9.83333C2.58934 9.83333 0.5 7.74399 0.5 5.16667C0.5 2.58934 2.58934 0.5 5.16667 0.5C7.74399 0.5 9.83333 2.58934 9.83333 5.16667Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="form-control ps-5"
                                style={{ paddingLeft: "36px" }}
                            />
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
                        <button className="btn  d-flex align-items-center gap-2 rounded custom-btn" style={{ backgroundColor: "white" }}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6.64282 9.3795C4.77757 7.9845 3.44707 6.45 2.72032 5.5875C2.49532 5.3205 2.42182 5.12475 2.37757 4.7805C2.22607 3.6015 2.15032 3.012 2.49607 2.631C2.84182 2.25 3.45307 2.25 4.67557 2.25H13.3246C14.5471 2.25 15.1583 2.25 15.5041 2.63025C15.8498 3.01125 15.7741 3.60075 15.6226 4.77975C15.5776 5.124 15.5041 5.31975 15.2798 5.58675C14.5523 6.45075 13.2196 7.98825 11.3498 9.3855C11.2634 9.45278 11.1919 9.53735 11.14 9.63382C11.0881 9.73029 11.0568 9.83653 11.0483 9.94575C10.8631 11.994 10.6921 13.116 10.5856 13.683C10.4138 14.5995 9.11557 15.1508 8.41957 15.642C8.00557 15.9345 7.50307 15.5865 7.44982 15.1335C7.25067 13.4074 7.08214 11.6779 6.94432 9.94575C6.93661 9.83549 6.90579 9.72809 6.85384 9.63053C6.80189 9.53297 6.73 9.44744 6.64282 9.3795Z" stroke="#131323" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Filter
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
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0.5 4.5H12.5M0.5 8.5H12.5M4.5 0.5V12.5M8.5 0.5V12.5M1.83333 0.5H11.1667C11.903 0.5 12.5 1.09695 12.5 1.83333V11.1667C12.5 11.903 11.903 12.5 11.1667 12.5H1.83333C1.09695 12.5 0.5 11.903 0.5 11.1667V1.83333C0.5 1.09695 1.09695 0.5 1.83333 0.5Z" stroke={view === "grid" ? "white" : "#3B4A66"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Documents Content */}
                <div className="container-fluid px-0 mt-3">
                    <div className="bg-white p-4 rounded-3">
                        <div className="align-items-center mb-3">
                            <h5 className="mb-0 me-3" style={{ fontSize: "20px", fontWeight: "500", color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                                {currentFolder ? currentFolder.title : 'My Documents'}
                                {folders.length > 0 && ` (${folders.length} folders, ${documents.length} files)`}
                                {folders.length === 0 && documents.length > 0 && ` (${documents.length})`}
                                {folders.length === 0 && documents.length === 0 && ""}
                            </h5>
                            <p
                                className="mb-0"
                                style={{
                                    color: "#4B5563",
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    fontFamily: "BasisGrotesquePro",
                                }}
                            >
                                {currentFolder
                                    ? `All folders and documents in ${currentFolder.title}`
                                    : 'All documents'}
                            </p>
                        </div>

                        {/* Show subfolders if any */}
                        {folders.length > 0 && (
                            <div className={view === "grid" ? "row g-3 mb-4" : "mb-4"}>
                                {folders.map((folder) => (
                                    <div
                                        key={folder.id}
                                        className={view === "grid" ? "col-sm-6 col-md-4 col-lg-3" : "col-12 mb-2"}
                                        onClick={() => handleFolderClick(folder, folders.indexOf(folder))}
                                        style={{ cursor: "pointer" }}
                                    >
                                        {view === "grid" ? (
                                            <div
                                                className="border rounded p-3 bg-white"
                                                style={{
                                                    borderRadius: "12px",
                                                    transition: "all 0.2s ease",
                                                    height: "100%",
                                                    minHeight: "140px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "space-between"
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#F9FAFB";
                                                    e.currentTarget.style.borderColor = "#00C0C6";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                                                    e.currentTarget.style.borderColor = "#E8F0FF";
                                                }}
                                            >
                                                <div className="d-flex flex-column align-items-center text-center">
                                                    <div className="mb-3" style={{ fontSize: "48px", color: "#F49C2D" }}>
                                                        <i className="bi bi-folder-fill"></i>
                                                    </div>
                                                    <div
                                                        className="fw-medium mb-1 text-truncate w-100"
                                                        style={{
                                                            fontFamily: "BasisGrotesquePro",
                                                            fontSize: "14px",
                                                            color: "#3B4A66"
                                                        }}
                                                        title={folder.title}
                                                    >
                                                        {folder.title}
                                                    </div>
                                                    {folder.description && (
                                                        <div
                                                            className="text-muted text-truncate w-100"
                                                            style={{
                                                                fontFamily: "BasisGrotesquePro",
                                                                fontSize: "12px"
                                                            }}
                                                            title={folder.description}
                                                        >
                                                            {folder.description}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                                    <small className="text-muted" style={{ fontFamily: "BasisGrotesquePro", fontSize: "11px" }}>
                                                        {folder.document_count || folder.files_count || 0} {folder.document_count === 1 || folder.files_count === 1 ? 'file' : 'files'}
                                                    </small>
                                                    {folder.subfolder_count > 0 && (
                                                        <small className="text-muted" style={{ fontFamily: "BasisGrotesquePro", fontSize: "11px" }}>
                                                            {folder.subfolder_count} {folder.subfolder_count === 1 ? 'folder' : 'folders'}
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className="border rounded p-3 bg-white d-flex align-items-center gap-3"
                                                style={{
                                                    borderRadius: "12px",
                                                    transition: "all 0.2s ease"
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#F9FAFB";
                                                    e.currentTarget.style.borderColor = "#00C0C6";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                                                    e.currentTarget.style.borderColor = "#E8F0FF";
                                                }}
                                            >
                                                <div style={{ fontSize: "40px", color: "#F49C2D" }}>
                                                    <i className="bi bi-folder-fill"></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="fw-medium mb-1" style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", color: "#3B4A66" }}>
                                                        {folder.title}
                                                    </div>
                                                    {folder.description && (
                                                        <div className="text-muted" style={{ fontFamily: "BasisGrotesquePro", fontSize: "12px" }}>
                                                            {folder.description}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="d-flex align-items-center gap-3">
                                                    <small className="text-muted" style={{ fontFamily: "BasisGrotesquePro", fontSize: "12px" }}>
                                                        {folder.document_count || folder.files_count || 0} {folder.document_count === 1 || folder.files_count === 1 ? 'file' : 'files'}
                                                    </small>
                                                    {folder.subfolder_count > 0 && (
                                                        <small className="text-muted" style={{ fontFamily: "BasisGrotesquePro", fontSize: "12px" }}>
                                                            {folder.subfolder_count} {folder.subfolder_count === 1 ? 'folder' : 'folders'}
                                                        </small>
                                                    )}
                                                    <i className="bi bi-chevron-right text-muted"></i>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center py-5">
                                <p>Loading documents...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-5">
                                <p className="text-danger">{error}</p>
                            </div>
                        ) : documents.length === 0 && folders.length === 0 ? (
                            <div className="pt-4 pb-4 text-center">
                                <h6 className="mb-2" style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>
                                    {currentFolder ? 'This folder is empty' : 'No Documents in This Folder'}
                                </h6>
                                <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>
                                    {currentFolder
                                        ? 'This folder doesn\'t contain any documents or subfolders yet.'
                                        : 'This folder doesn\'t contain any documents yet.'}
                                </p>
                            </div>
                        ) : documents.length === 0 && folders.length > 0 ? (
                            <div className="pt-2 pb-2">
                                <p className="text-muted text-center" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>
                                    No documents in this folder
                                </p>
                            </div>
                        ) : (
                            <div className="pt-2 pb-2">
                                <div className="row g-3">
                                    {documents.map((doc, index) => {
                                        const docName = doc.file_name || doc.name || doc.document_name || doc.filename || 'Untitled Document';
                                        const docSize = doc.file_size_bytes || doc.file_size || doc.size || '0';
                                        const docType = doc.file_type || doc.file_extension?.toUpperCase() || doc.type || doc.document_type || 'PDF';
                                        const docDate = doc.updated_at || doc.updated_at_formatted || doc.created_at || doc.created_at_formatted || doc.date || doc.uploaded_at;
                                        const docFolder = doc.folder?.title || doc.folder?.name || doc.folder_name || doc.category?.name || doc.category || 'General';
                                        const docStatus = doc.status || 'Pending';
                                        const docTags = doc.tags || doc.tag_list || [];
                                        const docVersion = doc.version || '';
                                        const isEditable = doc.editable || false;
                                        const fileUrl = doc.file_url || doc.tax_documents || '';

                                        return (
                                            <div className="col-12" key={doc.id || doc.document_id || index}>
                                                <div
                                                    className="p-3 border rounded-4"
                                                    style={{
                                                        backgroundColor: selectedDocIndex === index ? "#FFF4E6" : "#FFFFFF",
                                                        cursor: "pointer",
                                                        transition: "background-color 0.3s ease",
                                                    }}
                                                    onClick={() => setSelectedDocIndex(index)}
                                                >
                                                    <div className="d-flex justify-content-between align-items-start flex-wrap">
                                                        {/* Left Side: File Info */}
                                                        <div className="d-flex gap-3 align-items-start" style={{ flex: 1 }}>
                                                            <div
                                                                className="d-flex align-items-center justify-content-center"
                                                                style={{ width: 40, height: 40, flexShrink: 0 }}
                                                            >
                                                                <span className="mydocs-icon-wrapper">
                                                                    <FileIcon />
                                                                </span>
                                                            </div>

                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                                    <div className="fw-medium" style={{ fontFamily: "BasisGrotesquePro", fontSize: "15px" }}>
                                                                        {docName}
                                                                    </div>
                                                                    {docVersion && (
                                                                        <span style={{ fontSize: "12px", color: "#6B7280", fontFamily: "BasisGrotesquePro" }}>
                                                                            {docVersion}
                                                                        </span>
                                                                    )}
                                                                    {isEditable && (
                                                                        <span style={{ fontSize: "12px", color: "#00C0C6", fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>
                                                                            Editable
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-muted" style={{ fontSize: "13px", fontFamily: "BasisGrotesquePro", color: "#6B7280", fontWeight: "400" }}>
                                                                    Type: {docType} • Size: {formatFileSize(docSize)} • Uploaded: {formatDate(docDate)}
                                                                    {docFolder && ` • Folder: ${docFolder}`}
                                                                    {doc.category?.name && ` • Category: ${doc.category.name}`}
                                                                </div>

                                                                {(docTags.length > 0 || doc.category?.name) && (
                                                                    <div className="mt-2 d-flex flex-wrap gap-2">
                                                                        {doc.category?.name && (
                                                                            <span
                                                                                className="badge rounded-pill bg-white text-dark border"
                                                                                style={{ fontSize: "0.75rem", fontFamily: "BasisGrotesquePro", padding: "4px 8px" }}
                                                                            >
                                                                                {doc.category.name}
                                                                            </span>
                                                                        )}
                                                                        {docTags.map((tag, tagIdx) => (
                                                                            <span
                                                                                key={tagIdx}
                                                                                className="badge rounded-pill bg-white text-dark border"
                                                                                style={{ fontSize: "0.75rem", fontFamily: "BasisGrotesquePro", padding: "4px 8px" }}
                                                                            >
                                                                                {typeof tag === 'string' ? tag : (tag.name || tag)}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Right Side: Status + Menu */}
                                                        <div className="d-flex align-items-center gap-2 mt-2 mt-md-0" style={{ flexShrink: 0 }}>
                                                            {/* Show Preview button for pending_sign status, otherwise show status badge */}
                                                            {/* {(docStatus.toLowerCase() === 'pending_sign' || docStatus.toLowerCase() === 'pending sign') ? (
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
                                                                        cursor: "pointer"
                                                                    }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const isPdf = docType.toLowerCase() === 'pdf' || doc.file_extension?.toLowerCase() === 'pdf';
                                                                        if (isPdf && fileUrl) {
                                                                            // Handle PDF preview
                                                                        }
                                                                    }}
                                                                >
                                                                    Preview
                                                                </button>
                                                            ) : ( */}
                                                            <span
                                                                className={`badge ${getStatusBadgeClass(docStatus)} px-3 py-2`}
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
                                                            {/* )} */}

                                                            <button
                                                                className="btn btn-white border-0 p-2 d-flex align-items-center justify-content-center"
                                                                style={{
                                                                    width: "32px",
                                                                    height: "32px",
                                                                    borderRadius: "50%",
                                                                    fontFamily: "BasisGrotesquePro",
                                                                }}
                                                            >
                                                                <i className="bi bi-three-dots-vertical" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Default folders view
    return (
        <div className="folders-wrapper" style={{ minHeight: '400px', padding: '0' }}>
            {/* Top Controls */}
            <div className="d-flex justify-content-between align-items-center flex-wrap px-2 pt-4">
                <div className="d-flex align-items-center gap-2">
                    <div className="search-box">
                        <div className="search-box position-relative">
                            <i className="bi bi-search search-icon-inside"></i>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="form-control  ps-5"
                            />
                        </div>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
                    <button className="btn  d-flex align-items-center gap-2 rounded custom-btn" style={{ backgroundColor: "white" }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.64282 9.3795C4.77757 7.9845 3.44707 6.45 2.72032 5.5875C2.49532 5.3205 2.42182 5.12475 2.37757 4.7805C2.22607 3.6015 2.15032 3.012 2.49607 2.631C2.84182 2.25 3.45307 2.25 4.67557 2.25H13.3246C14.5471 2.25 15.1583 2.25 15.5041 2.63025C15.8498 3.01125 15.7741 3.60075 15.6226 4.77975C15.5776 5.124 15.5041 5.31975 15.2798 5.58675C14.5523 6.45075 13.2196 7.98825 11.3498 9.3855C11.2634 9.45278 11.1919 9.53735 11.14 9.63382C11.0881 9.73029 11.0568 9.83653 11.0483 9.94575C10.8631 11.994 10.6921 13.116 10.5856 13.683C10.4138 14.5995 9.11557 15.1508 8.41957 15.642C8.00557 15.9345 7.50307 15.5865 7.44982 15.1335C7.25067 13.4074 7.08214 11.6779 6.94432 9.94575C6.93661 9.83549 6.90579 9.72809 6.85384 9.63053C6.80189 9.53297 6.73 9.44744 6.64282 9.3795Z" stroke="#131323" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Filter
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
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0.5 4.5H12.5M0.5 8.5H12.5M4.5 0.5V12.5M8.5 0.5V12.5M1.83333 0.5H11.1667C11.903 0.5 12.5 1.09695 12.5 1.83333V11.1667C12.5 11.903 11.903 12.5 11.1667 12.5H1.83333C1.09695 12.5 0.5 11.903 0.5 11.1667V1.83333C0.5 1.09695 1.09695 0.5 1.83333 0.5Z" stroke={view === "grid" ? "white" : "#3B4A66"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Breadcrumb Navigation - Hide when viewing trash */}
            {(activeButton === "folder" && (folderPath.length > 0 || currentFolder)) && (
                <div className="mb-3 px-2">
                    <div className="d-flex align-items-center gap-2 flex-wrap" style={{ backgroundColor: "white", padding: "12px 16px", borderRadius: "8px" }}>
                        <button
                            className="btn btn-sm text-primary p-0 border-0 bg-transparent"
                            onClick={() => {
                                setCurrentFolder(null);
                                setFolderPath([]);
                                setSelectedFolder(null);
                                setSelectedIndex(null);
                                fetchFolders(null);
                            }}
                            style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}
                        >
                            <i className="bi bi-house me-1"></i>
                            Home
                        </button>
                        {folderPath.map((pathSegment, idx) => (
                            <React.Fragment key={idx}>
                                <span style={{ color: "#6B7280", fontFamily: "BasisGrotesquePro" }}>/</span>
                                <button
                                    className="btn btn-sm text-primary p-0 border-0 bg-transparent"
                                    onClick={() => {
                                        // Navigate to this folder level - would need to track folder IDs
                                        // For now, just show the path
                                    }}
                                    style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}
                                >
                                    {pathSegment}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            {/* Folder Box */}
            <div className="container-fluid px-0 mt-3">
                <div className="bg-white p-4 rounded-3">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h5 className="folders-title mb-0">
                                {activeButton === "trash"
                                    ? 'Trashed Folders'
                                    : currentFolder
                                        ? currentFolder.title
                                        : 'Document Folders'}
                            </h5>
                            <p className="folders-subtitle mb-0 mt-1">
                                {activeButton === "trash"
                                    ? 'Folders that have been moved to trash. You can recover them to restore all contents.'
                                    : currentFolder
                                        ? `Organize your documents in ${currentFolder.title}`
                                        : 'Organize your documents by category and tax year'}
                            </p>
                        </div>
                        <div
                            className="d-flex align-items-center"
                            style={{
                                gap: "16px",
                                backgroundColor: "#F3F7FF",
                                border: "1px solid #E8F0FF",
                                borderRadius: "8px",
                                padding: "4px"
                            }}
                        >
                            <button
                                className="border-0 d-flex align-items-center justify-content-center"
                                onClick={() => setActiveButton("folder")}
                                style={{
                                    minWidth: "80px",
                                    height: "34px",
                                    backgroundColor: activeButton === "folder" ? "#00C0C6" : "white",
                                    border: "1px solid #E8F0FF",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    padding: "0 12px",
                                    color: activeButton === "folder" ? "white" : "#3B4A66"
                                }}
                                title="Add Folder"
                            >
                                Folder
                            </button>
                            <button
                                className="border-0 d-flex align-items-center justify-content-center"
                                onClick={() => setActiveButton("trash")}
                                style={{
                                    minWidth: "80px",
                                    height: "34px",
                                    backgroundColor: activeButton === "trash" ? "#00C0C6" : "white",
                                    border: "1px solid #E8F0FF",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    padding: "0 12px",
                                    color: activeButton === "trash" ? "white" : "#3B4A66"
                                }}
                                title="Delete Folder"
                            >
                                Trash
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <p>Loading folders...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-5">
                            <p className="text-danger">{error}</p>
                        </div>
                    ) : (activeButton === "trash" ? trashedFolders.length === 0 : folders.length === 0) ? (
                        <div className="pt-4 pb-4 text-center">
                            <h6 className="mb-2" style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>
                                {activeButton === "trash"
                                    ? 'No Trashed Folders'
                                    : currentFolder
                                        ? 'No Subfolders in This Folder'
                                        : 'No Folders Yet'}
                            </h6>
                            <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>
                                {activeButton === "trash"
                                    ? 'You don\'t have any folders in trash.'
                                    : currentFolder
                                        ? 'This folder doesn\'t contain any subfolders yet.'
                                        : 'You haven\'t created any folders yet.'}
                            </p>
                        </div>
                    ) : view === "grid" ? (
                        activeButton === "trash" ? (
                            // Trashed folders grid view
                            <div className="row g-4">
                                {trashedFolders.map((folder, idx) => (
                                    <div className="col-12 col-md-6" key={folder.id || idx}>
                                        <div
                                            className="folder-card border rounded-3"
                                            style={{
                                                cursor: "default",
                                                transition: "all 0.2s ease",
                                                padding: "18px 24px",
                                                width: "100%",
                                                height: "100%",
                                                backgroundColor: "transparent",
                                                opacity: 0.8
                                            }}
                                        >
                                            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                                                <div className="d-flex align-items-center gap-2" style={{ flex: 1 }}>
                                                    <FaFolder size={24} className="folder-icon" style={{ minWidth: "24px", flexShrink: 0, color: "#9CA3AF" }} />
                                                    <div className="fw-semibold folder-name" style={{ fontSize: "15px", flex: 1, minWidth: 0, lineHeight: "1.3" }}>
                                                        {folder.title}
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRecoverFolder(folder.id, folder.title);
                                                    }}
                                                    disabled={recoveringFolder === folder.id}
                                                    style={{
                                                        backgroundColor: "#10B981",
                                                        color: "white",
                                                        border: "none",
                                                        padding: "4px 12px",
                                                        borderRadius: "6px",
                                                        fontSize: "12px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "4px"
                                                    }}
                                                    title="Recover Folder"
                                                >
                                                    {recoveringFolder === folder.id ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                            Recovering...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaUndo size={12} />
                                                            Recover
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <div style={{ marginLeft: "32px" }}>
                                                {folder.description && (
                                                    <div className="text-muted small mt-1 folder-desc" style={{ fontSize: "13px", lineHeight: "1.4", marginBottom: "8px", wordBreak: "break-word" }}>
                                                        {folder.description}
                                                    </div>
                                                )}
                                                <div className="d-flex justify-content-between align-items-center text-muted small folder-info" style={{ fontSize: "12px", gap: "8px" }}>
                                                    <span>{folder.document_count || folder.statistics?.documents_count || 0} {((folder.document_count || folder.statistics?.documents_count || 0) === 1) ? 'File' : 'Files'}</span>
                                                    {((folder.subfolder_count || folder.statistics?.subfolders_count || 0) > 0) && (
                                                        <span>{folder.subfolder_count || folder.statistics?.subfolders_count || 0} {(folder.subfolder_count || folder.statistics?.subfolders_count || 0) === 1 ? 'Folder' : 'Folders'}</span>
                                                    )}
                                                </div>
                                                {folder.trashed_at && (
                                                    <div className="text-muted small mt-1" style={{ fontSize: "11px" }}>
                                                        Trashed: {formatDate(folder.trashed_at)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="row g-4">
                                {folders.map((folder, idx) => (
                                    <div className="col-12 col-md-6" key={folder.id || idx}>
                                        <div
                                            className={`folder-card border rounded-3 ${selectedIndex === idx ? "active" : ""}`}
                                            onClick={() => handleFolderClick(folder, idx)}
                                            style={{
                                                cursor: "pointer",
                                                transition: "all 0.2s ease",
                                                padding: "18px 24px",
                                                width: "100%",
                                                height: "100%",
                                                backgroundColor: selectedIndex === idx ? "#00C0C6" : "transparent",
                                                position: "relative"
                                            }}
                                        >
                                            <div className="d-flex align-items-center justify-content-start gap-2 mb-2">
                                                <FaFolder size={24} className="folder-icon" style={{ minWidth: "24px", flexShrink: 0 }} />
                                                <div className="fw-semibold folder-name" style={{ fontSize: "15px", flex: 1, minWidth: 0, lineHeight: "1.3" }}>
                                                    {folder.title}
                                                </div>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTrashFolder(folder.id, folder.title);
                                                    }}
                                                    disabled={trashingFolder === folder.id}
                                                    style={{
                                                        backgroundColor: "#EF4444",
                                                        color: "white",
                                                        border: "none",
                                                        padding: "4px 12px",
                                                        borderRadius: "6px",
                                                        fontSize: "12px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "4px",
                                                        zIndex: 10
                                                    }}
                                                    title="Move to Trash"
                                                >
                                                    {trashingFolder === folder.id ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                            Trashing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaTrash size={12} />
                                                            Trash
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <div style={{ marginLeft: "32px" }}>
                                                {folder.description && (
                                                    <div className="text-muted small mt-1 folder-desc" style={{ fontSize: "13px", lineHeight: "1.4", marginBottom: "8px", wordBreak: "break-word" }}>
                                                        {folder.description}
                                                    </div>
                                                )}
                                                <div className="d-flex justify-content-between align-items-center text-muted small folder-info" style={{ fontSize: "12px", gap: "8px" }}>
                                                    <span>{folder.document_count || folder.files_count || 0} {folder.document_count === 1 || folder.files_count === 1 ? 'File' : 'Files'}</span>
                                                    {folder.subfolder_count > 0 && (
                                                        <span>{folder.subfolder_count} {folder.subfolder_count === 1 ? 'Folder' : 'Folders'}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        activeButton === "trash" ? (
                            // Trashed folders list view
                            <div className="d-flex flex-column gap-3">
                                {trashedFolders.map((folder, idx) => (
                                    <div
                                        key={folder.id || idx}
                                        className="folder-card border rounded-3"
                                        style={{
                                            cursor: "default",
                                            transition: "all 0.2s ease",
                                            padding: "16px 20px",
                                            width: "100%",
                                            backgroundColor: "transparent",
                                            opacity: 0.8
                                        }}
                                    >
                                        <div className="d-flex align-items-center justify-content-between gap-3">
                                            <div className="d-flex align-items-center gap-3" style={{ flex: 1 }}>
                                                <FaFolder size={28} className="folder-icon" style={{ minWidth: "28px", flexShrink: 0, color: "#9CA3AF" }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <div className="fw-semibold folder-name" style={{ fontSize: "16px", lineHeight: "1.3" }}>
                                                            {folder.title}
                                                        </div>
                                                        {folder.is_template && (
                                                            <span className="badge bg-white text-muted border rounded-pill template-badge" style={{ fontSize: "10px", whiteSpace: "nowrap", flexShrink: 0 }}>
                                                                Template
                                                            </span>
                                                        )}
                                                    </div>
                                                    {folder.description && (
                                                        <div className="text-muted small folder-desc" style={{ fontSize: "13px", lineHeight: "1.4", marginBottom: "4px", wordBreak: "break-word" }}>
                                                            {folder.description}
                                                        </div>
                                                    )}
                                                    <div className="d-flex align-items-center gap-3 text-muted small folder-info" style={{ fontSize: "12px" }}>
                                                        <span>{folder.document_count || folder.statistics?.documents_count || 0} {(folder.document_count || folder.statistics?.documents_count || 0) === 1 ? 'File' : 'Files'}</span>
                                                        {((folder.subfolder_count || folder.statistics?.subfolders_count || 0) > 0) && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{folder.subfolder_count || folder.statistics?.subfolders_count || 0} {(folder.subfolder_count || folder.statistics?.subfolders_count || 0) === 1 ? 'Folder' : 'Folders'}</span>
                                                            </>
                                                        )}
                                                        {folder.trashed_at && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Trashed: {formatDate(folder.trashed_at)}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-sm"
                                                onClick={() => handleRecoverFolder(folder.id, folder.title)}
                                                disabled={recoveringFolder === folder.id}
                                                style={{
                                                    backgroundColor: "#10B981",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "6px 16px",
                                                    borderRadius: "6px",
                                                    fontSize: "12px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                }}
                                                title="Recover Folder"
                                            >
                                                {recoveringFolder === folder.id ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                        Recovering...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaUndo size={12} />
                                                        Recover
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Regular folders list view
                            <div className="d-flex flex-column gap-3">
                                {folders.map((folder, idx) => (
                                    <div
                                        key={folder.id || idx}
                                        className={`folder-card border rounded-3 ${selectedIndex === idx ? "active" : ""}`}
                                        onClick={() => handleFolderClick(folder, idx)}
                                        style={{
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            padding: "16px 20px",
                                            width: "100%",
                                            backgroundColor: selectedIndex === idx ? "#00C0C6" : "transparent"
                                        }}
                                    >
                                        <div className="d-flex align-items-center justify-content-between gap-3">
                                            <div className="d-flex align-items-center gap-3" style={{ flex: 1 }}>
                                                <FaFolder size={28} className="folder-icon" style={{ minWidth: "28px", flexShrink: 0 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <div className="fw-semibold folder-name" style={{ fontSize: "16px", lineHeight: "1.3" }}>
                                                            {folder.title}
                                                        </div>
                                                        {folder.is_template && (
                                                            <span className="badge bg-white text-muted border rounded-pill template-badge" style={{ fontSize: "10px", whiteSpace: "nowrap", flexShrink: 0 }}>
                                                                Template
                                                            </span>
                                                        )}
                                                    </div>
                                                    {folder.description && (
                                                        <div className="text-muted small folder-desc" style={{ fontSize: "13px", lineHeight: "1.4", marginBottom: "4px", wordBreak: "break-word" }}>
                                                            {folder.description}
                                                        </div>
                                                    )}
                                                    <div className="d-flex align-items-center gap-3 text-muted small folder-info" style={{ fontSize: "12px" }}>
                                                        <span>{folder.document_count || folder.files_count || 0} {folder.document_count === 1 || folder.files_count === 1 ? 'File' : 'Files'}</span>
                                                        {folder.subfolder_count > 0 && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{folder.subfolder_count} {folder.subfolder_count === 1 ? 'Folder' : 'Folders'}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTrashFolder(folder.id, folder.title);
                                                    }}
                                                    disabled={trashingFolder === folder.id}
                                                    style={{
                                                        backgroundColor: "#EF4444",
                                                        color: "white",
                                                        border: "none",
                                                        padding: "4px 12px",
                                                        borderRadius: "6px",
                                                        fontSize: "12px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "4px"
                                                    }}
                                                    title="Move to Trash"
                                                >
                                                    {trashingFolder === folder.id ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                        </>
                                                    ) : (
                                                        <FaTrash size={12} />
                                                    )}
                                                </button>
                                                <i className="bi bi-chevron-right text-muted"></i>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* Show documents if any - display after folders */}
                    {documents.length > 0 && (
                        <div className="mt-4">
                            <h6 className="mb-3" style={{ fontSize: "18px", fontWeight: "500", color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                                Documents ({documents.length})
                            </h6>
                            <div className="row g-3">
                                {documents.map((doc, index) => {
                                    const docName = doc.file_name || doc.name || doc.document_name || doc.filename || 'Untitled Document';
                                    const docSize = doc.file_size_bytes || doc.file_size || doc.size || '0';
                                    const docType = doc.file_type || doc.file_extension?.toUpperCase() || doc.type || doc.document_type || 'PDF';
                                    const docDate = doc.updated_at || doc.updated_at_formatted || doc.created_at || doc.created_at_formatted || doc.date || doc.uploaded_at;
                                    const docFolder = doc.folder?.title || doc.folder?.name || doc.folder_name || doc.category?.name || doc.category || 'General';
                                    const docStatus = doc.status || 'Pending';
                                    const docTags = doc.tags || doc.tag_list || [];
                                    const docVersion = doc.version || '';
                                    const isEditable = doc.editable || false;
                                    const fileUrl = doc.file_url || doc.tax_documents || '';

                                    return (
                                        <div className="col-12" key={doc.id || doc.document_id || index}>
                                            <div
                                                className="p-3 border rounded-4"
                                                style={{
                                                    backgroundColor: selectedDocIndex === index ? "#FFF4E6" : "#FFFFFF",
                                                    cursor: "pointer",
                                                    transition: "background-color 0.3s ease",
                                                }}
                                                onClick={() => setSelectedDocIndex(index)}
                                            >
                                                <div className="d-flex justify-content-between align-items-start flex-wrap">
                                                    {/* Left Side: File Info */}
                                                    <div className="d-flex gap-3 align-items-start" style={{ flex: 1 }}>
                                                        <div
                                                            className="d-flex align-items-center justify-content-center"
                                                            style={{ width: 40, height: 40, flexShrink: 0 }}
                                                        >
                                                            <span className="mydocs-icon-wrapper">
                                                                <FileIcon />
                                                            </span>
                                                        </div>

                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                                <div className="fw-medium" style={{ fontFamily: "BasisGrotesquePro", fontSize: "15px" }}>
                                                                    {docName}
                                                                </div>
                                                                {docVersion && (
                                                                    <span style={{ fontSize: "12px", color: "#6B7280", fontFamily: "BasisGrotesquePro" }}>
                                                                        {docVersion}
                                                                    </span>
                                                                )}
                                                                {isEditable && (
                                                                    <span style={{ fontSize: "12px", color: "#00C0C6", fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>
                                                                        Editable
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-muted" style={{ fontSize: "13px", fontFamily: "BasisGrotesquePro", color: "#6B7280", fontWeight: "400" }}>
                                                                Type: {docType} • Size: {formatFileSize(docSize)} • Uploaded: {formatDate(docDate)}
                                                                {docFolder && ` • Folder: ${docFolder}`}
                                                                {doc.category?.name && ` • Category: ${doc.category.name}`}
                                                            </div>

                                                            {(docTags.length > 0 || doc.category?.name) && (
                                                                <div className="mt-2 d-flex flex-wrap gap-2">
                                                                    {doc.category?.name && (
                                                                        <span
                                                                            className="badge rounded-pill bg-white text-dark border"
                                                                            style={{ fontSize: "0.75rem", fontFamily: "BasisGrotesquePro", padding: "4px 8px" }}
                                                                        >
                                                                            {doc.category.name}
                                                                        </span>
                                                                    )}
                                                                    {docTags.map((tag, tagIdx) => (
                                                                        <span
                                                                            key={tagIdx}
                                                                            className="badge rounded-pill bg-white text-dark border"
                                                                            style={{ fontSize: "0.75rem", fontFamily: "BasisGrotesquePro", padding: "4px 8px" }}
                                                                        >
                                                                            {typeof tag === 'string' ? tag : (tag.name || tag)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Right Side: Status + Menu */}
                                                    <div className="d-flex align-items-center gap-2 mt-2 mt-md-0" style={{ flexShrink: 0 }}>
                                                        {/* Show Preview button for pending_sign status, otherwise show status badge */}
                                                        {/* {(docStatus.toLowerCase() === 'pending_sign' || docStatus.toLowerCase() === 'pending sign') ? (
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
                                                                    cursor: "pointer"
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const isPdf = docType.toLowerCase() === 'pdf' || doc.file_extension?.toLowerCase() === 'pdf';
                                                                    if (isPdf && fileUrl) {
                                                                        // Handle PDF preview
                                                                    }
                                                                }}
                                                            >
                                                                Preview
                                                                
                                                            </button>
                                                        ) : ( */}
                                                        {/* <span
                                                            className={`badge ${getStatusBadgeClass(docStatus)} px-3 py-2`}
                                                            style={{
                                                                borderRadius: "20px",
                                                                fontSize: "0.75rem",
                                                                fontWeight: "500",
                                                                fontFamily: "BasisGrotesquePro",
                                                                color: "#FFFFFF"
                                                            }}
                                                        >
                                                            {docStatus}
                                                        </span> */}
                                                        {/* )} */}

                                                        <button
                                                            className="btn btn-white border-0 p-2 d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: "32px",
                                                                height: "32px",
                                                                borderRadius: "50%",
                                                                fontFamily: "BasisGrotesquePro",
                                                            }}
                                                        >
                                                            <i className="bi bi-three-dots-vertical" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
