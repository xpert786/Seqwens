
import React, { useState, useEffect } from "react";
import { FileIcon, OverdueIcon, UploadIcons, CompletedIcon, AwaitingIcon } from "../icons";
import "../../styles/Document.css";
import { documentsAPI, handleAPIError } from "../../utils/apiUtils";

export default function MyDocumentsContent() {
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [view, setView] = useState("list");
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        pending: 0,
        completed: 0,
        overdue: 0,
        uploaded: 0
    });

    useEffect(() => {
        const fetchDocuments = async () => {
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

                // Filter to only show documents for current taxpayer
                // The API should already filter by authenticated user, but we add an extra safety check
                setDocuments(docs);

                // Calculate stats
                const newStats = {
                    pending: docs.filter(d => d.status === 'Pending' || d.status === 'pending' || d.status === 'Waiting Signature' || d.status === 'Quick Review').length,
                    completed: docs.filter(d => d.status === 'Processed' || d.status === 'Completed' || d.status === 'completed').length,
                    overdue: docs.filter(d => {
                        if (d.due_date || d.dueDate) {
                            const due = new Date(d.due_date || d.dueDate);
                            const today = new Date();
                            return due < today && (d.status === 'Pending' || d.status === 'pending');
                        }
                        return false;
                    }).length,
                    uploaded: docs.length
                };
                setStats(newStats);
            } catch (err) {
                console.error('Error fetching documents:', err);
                // If API endpoint doesn't exist yet, return empty array (new taxpayer - clean slate)
                if (err.message.includes('404') || err.message.includes('Not Found')) {
                    setDocuments([]);
                    setStats({ pending: 0, completed: 0, overdue: 0, uploaded: 0 });
                } else {
                    setError(handleAPIError(err));
                    setDocuments([]);
                    setStats({ pending: 0, completed: 0, overdue: 0, uploaded: 0 });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
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

    if (loading) {
        return (
            <div>
                <div className="text-center py-5">
                    <p>Loading documents...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <div className="text-center py-5">
                    <p className="text-danger">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div  >

            <div className="row g-3 mb-3">
                {["Pending", "Completed", "Overdue", "Uploaded"].map((label, index) => {

                    const IconComponent = {
                        Pending: AwaitingIcon,
                        Completed: CompletedIcon,
                        Overdue: OverdueIcon,
                        Uploaded: UploadIcons,
                    }[label];

                    const count = stats[label.toLowerCase()] || 0;

                    return (
                        <div className="col-sm-6 col-md-3" key={index}>
                            <div
                                className="bg-white p-3 d-flex flex-column justify-content-between"
                                style={{ borderRadius: "12px", height: "130px" }}
                            >
                                <div className="d-flex justify-content-between align-items-start">
                                    <div
                                        className="d-flex align-items-center justify-content-center"
                                        style={{
                                            width: "30px",
                                            height: "30px",

                                        }}
                                    >
                                        {/* Icons hidden for now */}
                                    </div>
                                    <span className="fw-semibold text-dark">{count}</span>
                                </div>

                                {/* Bottom label */}
                                <div className="mt-2">
                                    <p className="mb-0 text-muted small fw-semibold" style={{ fontFamily: "BasisGrotesquePro", }}>{label}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>


            {/* Filters */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">

                <div className="mydocs-search-wrapper">
                    <i className="bi bi-search mydocs-search-icon"></i>
                    <input
                        type="text"
                        className="form-control mydocs-search-input"
                        placeholder="Search..."
                    />
                </div>


                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <select className="form-select" style={{ width: "140px" }}>
                        <option>All Status</option>
                        <option>Processed</option>
                        <option>Pending</option>
                    </select>

                    <select className="form-select" style={{ width: "120px" }}>
                        <option>Date</option>
                        <option>Name</option>
                    </select>

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

            <div className="p-4 bg-white" style={{ borderRadius: "15px" }}>


                <div className="align-items-center mb-3 ">
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
                        All documents you've uploaded and shared documents
                    </p>
                </div>


                {documents.length === 0 ? (
                    <div className="pt-4 pb-4 text-center">
                        <h6 className="mb-2" style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>
                            No Documents Yet
                        </h6>
                        <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>
                            You haven't uploaded any documents yet. Use the "Upload Documents" button above to get started.
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

                                return (
                                    <div className="col-12" key={doc.id || doc.document_id || index}>
                                        <div
                                            className="p-3 border rounded-4"
                                            style={{
                                                backgroundColor: selectedIndex === index ? "#FFF4E6" : "#FFFFFF",
                                                cursor: "pointer",
                                                transition: "background-color 0.3s ease",
                                            }}
                                            onClick={() => setSelectedIndex(index)}
                                        >
                                            <div className="d-flex justify-content-between align-items-start flex-wrap">
                                                {/* Left Side: File Info */}
                                                <div className="d-flex gap-3 align-items-start">
                                                    <div
                                                        className="d-flex align-items-center justify-content-center"
                                                        style={{ width: 40, height: 40 }}
                                                    >
                                                        <span className="mydocs-icon-wrapper">
                                                            <FileIcon />
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <div className="fw-medium" style={{ fontFamily: "BasisGrotesquePro" }}>
                                                            {docName}
                                                        </div>
                                                        <div className="text-muted " style={{ fontSize: "13px", fontFamily: "BasisGrotesquePro", color: "#131323", fontWeight: "400" }}>
                                                            Type: {docType} • Size: {formatFileSize(docSize)} • Updated: {formatDate(docDate)} • Folder: {docFolder}
                                                        </div>

                                                        {docTags.length > 0 && (
                                                            <div className="mt-2 d-flex flex-wrap gap-2">
                                                                {docTags.map((tag, tagIdx) => (
                                                                    <span
                                                                        key={tagIdx}
                                                                        className="badge rounded-pill bg-white text-dark "
                                                                        style={{ fontSize: "0.75rem", fontFamily: "BasisGrotesquePro" }}
                                                                    >
                                                                        {typeof tag === 'string' ? tag : (tag.name || tag)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Side: Status + Menu */}
                                                <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
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
    );
}


