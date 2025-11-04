import React, { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaFolder } from "react-icons/fa";
import { BiGridAlt, BiListUl } from "react-icons/bi";
import { FileIcon } from "../icons";
import { documentsAPI, handleAPIError } from "../../utils/apiUtils";
import "../../styles/Folders.css";

const folderData = [
    { name: "Tax Year 2023", description: "All documents related to 2023 tax year", count: "3 Documents", date: "12/06/2025" },
    { name: "Tax Year 2022", description: "Archived documents from 2022 tax year", count: "3 Documents", date: "10/06/2025" },
    { name: "Business Expenses", description: "Business-related receipts and documentation", count: "2 Documents", date: "12/05/2025" },
    { name: "Investment Documents", description: "Investment statements and tax forms", count: "2 Documents", date: "12/05/2025" },
    { name: "Banking", description: "Bank statements and financial records", count: "2 Documents", date: "03/06/2025" },
    { name: "Medical", description: "Medical expenses and insurance documents", count: "2 Documents", date: "12/05/2025" },
    { name: "Tax Returns", description: "Completed and draft tax returns", count: "3 Documents", date: "12/05/2025" },
];

export default function Folders({ onFolderSelect }) {
    const [view, setView] = useState("grid");
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedDocIndex, setSelectedDocIndex] = useState(null);
    const [activeButton, setActiveButton] = useState("folder"); // "folder" or "trash"

    // Fetch documents when folder is selected
    useEffect(() => {
        const fetchFolderDocuments = async () => {
            if (!selectedFolder) return;

            try {
                setLoading(true);
                setError(null);
                const response = await documentsAPI.getDocuments();

                // Handle different response structures
                let docs = [];
                if (Array.isArray(response)) {
                    docs = response;
                } else if (response.data && Array.isArray(response.data)) {
                    docs = response.data;
                } else if (response.results && Array.isArray(response.results)) {
                    docs = response.results;
                } else if (response.documents && Array.isArray(response.documents)) {
                    docs = response.documents;
                }

                // Filter documents by folder name
                const filteredDocs = docs.filter(doc => {
                    const docFolder = doc.folder || doc.folder_name || doc.category || '';
                    return docFolder.toLowerCase() === selectedFolder.name.toLowerCase() ||
                        docFolder.toLowerCase().includes(selectedFolder.name.toLowerCase());
                });

                setDocuments(filteredDocs);
            } catch (err) {
                console.error('Error fetching folder documents:', err);
                if (err.message.includes('404') || err.message.includes('Not Found')) {
                    setDocuments([]);
                } else {
                    setError(handleAPIError(err));
                    setDocuments([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchFolderDocuments();
    }, [selectedFolder]);

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

    // Handle folder click
    const handleFolderClick = (folder, idx) => {
        setSelectedFolder(folder);
        setSelectedIndex(idx);
        if (onFolderSelect) {
            onFolderSelect(true);
        }
    };

    // Handle back to folders
    const handleBackToFolders = () => {
        setSelectedFolder(null);
        setSelectedIndex(null);
        setDocuments([]);
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
                    <button
                        onClick={handleBackToFolders}
                        className="btn btn-link p-0 border-0 text-decoration-none d-flex align-items-center gap-2 mb-2"
                        style={{
                            color: "#3B4A66",
                            fontFamily: "BasisGrotesquePro",
                            fontSize: "14px",
                            cursor: "pointer"
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 14.25L3.75 9M3.75 9L9 3.75M3.75 9H14.25" stroke="#3B4A66" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>

                        <span style={{ color: "#F56D2D" }}>Back to All Documents /</span>
                        <span style={{ fontWeight: "500" }}>{selectedFolder.name}</span>
                    </button>
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
                                My Documents ({documents.length})
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
                                Documents in {selectedFolder.name}
                            </p>
                        </div>

                        {loading ? (
                            <div className="text-center py-5">
                                <p>Loading documents...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-5">
                                <p className="text-danger">{error}</p>
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="pt-4 pb-4 text-center">
                                <h6 className="mb-2" style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>
                                    No Documents in This Folder
                                </h6>
                                <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>
                                    This folder doesn't contain any documents yet.
                                </p>
                            </div>
                        ) : (
                            <div className="pt-2 pb-2">
                                <div className="row g-3">
                                    {documents.map((doc, index) => {
                                        const docName = doc.name || doc.file_name || doc.document_name || doc.filename || 'Untitled Document';
                                        const docSize = doc.size || doc.file_size || '0';
                                        const docType = doc.type || doc.file_type || doc.document_type || 'PDF';
                                        const docDate = doc.date || doc.uploaded_at || doc.created_at || doc.updated_at;
                                        const docFolder = doc.folder || doc.folder_name || doc.category || 'General';
                                        const docStatus = doc.status || 'Pending';
                                        const docTags = doc.tags || doc.tag_list || [];
                                        const docVersion = doc.version || '';
                                        const isEditable = doc.editable || false;

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
                                                                    Type: {docType} • Size: {formatFileSize(docSize)} • Uploaded: {formatDate(docDate)} • Folder: {docFolder}
                                                                </div>

                                                                {docTags.length > 0 && (
                                                                    <div className="mt-2 d-flex flex-wrap gap-2">
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

            {/* Folder Box */}
            <div className="container-fluid px-0 mt-3">
                <div className="bg-white p-4 rounded-3">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h5 className="folders-title mb-0">Document Folders</h5>
                            <p className="folders-subtitle mb-0 mt-1">
                                Organize your documents by category and tax year
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

                    {view === "grid" ? (
                        <div className="row g-4">
                            {folderData.map((folder, idx) => (
                                <div className="col-12 col-md-6" key={idx}>
                                    <div
                                        className={`folder-card border rounded-3 ${selectedIndex === idx ? "active" : ""}`}
                                        onClick={() => handleFolderClick(folder, idx)}
                                        style={{
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            padding: "18px 24px",
                                            width: "100%",
                                            height: "100%",
                                            backgroundColor: selectedIndex === idx ? "#00C0C6" : "transparent"
                                        }}
                                    >
                                        <div className="d-flex align-items-center justify-content-start gap-2 mb-2">
                                            <FaFolder size={24} className="folder-icon" style={{ minWidth: "24px", flexShrink: 0 }} />
                                            <div className="fw-semibold folder-name" style={{ fontSize: "15px", flex: 1, minWidth: 0, lineHeight: "1.3" }}>
                                                {folder.name}
                                            </div>
                                            <span className="badge bg-white text-muted border rounded-pill template-badge" style={{ fontSize: "10px", whiteSpace: "nowrap", flexShrink: 0 }}>
                                                Template
                                            </span>
                                        </div>
                                        <div style={{ marginLeft: "32px" }}>
                                            <div className="text-muted small mt-1 folder-desc" style={{ fontSize: "13px", lineHeight: "1.4", marginBottom: "8px", wordBreak: "break-word" }}>
                                                {folder.description}
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center text-muted small folder-info" style={{ fontSize: "12px", gap: "8px" }}>
                                                <span>{folder.count}</span>
                                                <span>Last: {folder.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {folderData.map((folder, idx) => (
                                <div
                                    key={idx}
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
                                                        {folder.name}
                                                    </div>
                                                    <span className="badge bg-white text-muted border rounded-pill template-badge" style={{ fontSize: "10px", whiteSpace: "nowrap", flexShrink: 0 }}>
                                                        Template
                                                    </span>
                                                </div>
                                                <div className="text-muted small folder-desc" style={{ fontSize: "13px", lineHeight: "1.4", marginBottom: "4px", wordBreak: "break-word" }}>
                                                    {folder.description}
                                                </div>
                                                <div className="d-flex align-items-center gap-3 text-muted small folder-info" style={{ fontSize: "12px" }}>
                                                    <span>{folder.count}</span>
                                                    <span>•</span>
                                                    <span>Last: {folder.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
