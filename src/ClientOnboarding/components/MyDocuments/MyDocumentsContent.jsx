
import React, { useState, useEffect } from "react";
import { FileIcon, OverdueIcon, UploadIcons, CompletedIcon, AwaitingIcon } from "../icons";
import "../../styles/Document.css";
import { handleAPIError } from "../../utils/apiUtils";
import { getApiBaseUrl, fetchWithCors } from "../../utils/corsConfig";
import { getAccessToken } from "../../utils/userUtils";
import Pagination from "../Pagination";

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
    const itemsPerPage = 3;

    // Fetch all documents from the documents API
    const fetchAllDocuments = async () => {
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

            const url = `${API_BASE_URL}/taxpayer/documents/`;

            const response = await fetchWithCors(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Documents API response:', result);

            if (result.success && result.data) {
                // Get documents array
                const docs = result.data.documents || [];
                setDocuments(docs);

                // Get statistics from API response
                if (result.data.statistics) {
                    const statsData = result.data.statistics;
                    const newStats = {
                        pending: statsData.by_status?.pending_sign?.count || 0,
                        completed: statsData.by_status?.processed?.count || 0,
                        overdue: 0, // Calculate from documents if needed
                        uploaded: statsData.total_documents || docs.length
                    };

                    // Calculate overdue from documents
                    const overdueCount = docs.filter(d => {
                        if (d.due_date || d.dueDate) {
                            const due = new Date(d.due_date || d.dueDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return due < today && (d.status === 'pending_sign' || d.status === 'Pending');
                        }
                        return false;
                    }).length;
                    newStats.overdue = overdueCount;

                    setStats(newStats);
                } else {
                    // Fallback: calculate stats from documents
                    const newStats = {
                        pending: docs.filter(d => {
                            const status = (d.status || '').toLowerCase();
                            return status === 'pending_sign' || status === 'pending' || status === 'waiting signature';
                        }).length,
                        completed: docs.filter(d => {
                            const status = (d.status || '').toLowerCase();
                            return status === 'processed' || status === 'completed';
                        }).length,
                        overdue: docs.filter(d => {
                            if (d.due_date || d.dueDate) {
                                const due = new Date(d.due_date || d.dueDate);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return due < today && (d.status === 'pending_sign' || d.status === 'pending');
                            }
                            return false;
                        }).length,
                        uploaded: docs.length
                    };
                    setStats(newStats);
                }
            } else {
                setDocuments([]);
                setStats({ pending: 0, completed: 0, overdue: 0, uploaded: 0 });
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
            setError(handleAPIError(error));
            setDocuments([]);
            setStats({ pending: 0, completed: 0, overdue: 0, uploaded: 0 });
        } finally {
            setLoading(false);
        }
    };

    // Fetch all documents on component mount
    useEffect(() => {
        fetchAllDocuments();
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
            } else {
                throw new Error(result.message || 'Failed to archive/unarchive document');
            }
        } catch (error) {
            console.error('Error archiving/unarchiving document:', error);
            alert(handleAPIError(error));
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

    // Filter documents based on selected filter
    const getFilteredDocuments = () => {
        if (!selectedFilter) {
            return documents;
        }

        const filterLower = selectedFilter.toLowerCase();

        if (filterLower === 'pending') {
            return documents.filter(d => {
                const status = (d.status || '').toLowerCase();
                return status === 'pending_sign' || status === 'pending' || status === 'waiting signature';
            });
        } else if (filterLower === 'completed') {
            return documents.filter(d => {
                const status = (d.status || '').toLowerCase();
                return status === 'processed' || status === 'completed';
            });
        } else if (filterLower === 'overdue') {
            return documents.filter(d => {
                if (d.due_date || d.dueDate) {
                    const due = new Date(d.due_date || d.dueDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return due < today && (d.status === 'pending_sign' || d.status === 'pending' || (d.status || '').toLowerCase() === 'pending');
                }
                return false;
            });
        } else if (filterLower === 'uploaded') {
            return documents; // All documents are uploaded
        }

        return documents;
    };

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedFilter]);

    // Pagination for documents
    const filteredDocuments = getFilteredDocuments();
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredDocuments.length);
    const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

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
                                        }}
                                    >
                                        {/* Icons hidden for now */}
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
                            No {selectedFilter ? selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1) : ''} Documents
                        </h6>
                        <p className="text-muted" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>
                            {selectedFilter ? `No documents match the ${selectedFilter} filter.` : 'No documents found.'}
                        </p>
                    </div>
                )}
                {filteredDocuments.length > 0 && (
                    <div className="pt-2 pb-2">
                        <div className="row g-3">
                            {paginatedDocuments.map((doc, index) => {
                                const docName = doc.file_name || doc.name || doc.document_name || doc.filename || 'Untitled Document';
                                const docSize = doc.file_size_formatted || (doc.file_size_bytes ? formatFileSize(doc.file_size_bytes) : (doc.file_size ? formatFileSize(doc.file_size) : '0 KB'));
                                const docType = doc.file_type || doc.file_extension?.toUpperCase() || doc.type || doc.document_type || 'PDF';
                                const docDate = doc.updated_at_formatted || doc.created_at_formatted || doc.updated_at || doc.created_at || doc.date || 'N/A';
                                const docFolder = doc.folder?.title || doc.folder?.name || doc.folder_name || 'General';
                                const docCategory = doc.category?.name || '';
                                const docStatus = doc.status_display || doc.status || 'Pending';
                                const docStatusValue = doc.status || 'pending';
                                const fileUrl = doc.file_url || doc.tax_documents || '';

                                return (
                                    <div className="col-12" key={doc.id || doc.document_id || index}>
                                        <div
                                            className="p-3 border rounded-4"
                                            style={{
                                                backgroundColor: selectedIndex === (startIndex + index) ? "#FFF4E6" : "#FFFFFF",
                                                cursor: "pointer",
                                                transition: "background-color 0.3s ease",
                                            }}
                                            onClick={() => {
                                                setSelectedIndex(startIndex + index);
                                                // Check if document is a PDF
                                                const isPdf = docType.toLowerCase() === 'pdf' || doc.file_extension?.toLowerCase() === 'pdf';
                                                if (isPdf && fileUrl) {
                                                    setSelectedDocument(doc);
                                                    setShowPdfModal(true);
                                                }
                                            }}
                                            title={(docType.toLowerCase() === 'pdf' || doc.file_extension?.toLowerCase() === 'pdf') && fileUrl ? 'Click to view PDF' : ''}
                                        >
                                            <div className="d-flex justify-content-between align-items-start flex-wrap">
                                                {/* Left Side: File Info */}
                                                <div className="d-flex gap-3 align-items-start" style={{ flex: 1, minWidth: 0 }}>
                                                    <div
                                                        className="d-flex align-items-center justify-content-center"
                                                        style={{ width: 40, height: 40, flexShrink: 0 }}
                                                    >
                                                        <span className="mydocs-icon-wrapper">
                                                            <FileIcon />
                                                        </span>
                                                    </div>

                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div className="fw-medium mb-1 d-flex align-items-center gap-2" style={{ fontFamily: "BasisGrotesquePro", fontSize: "15px", color: "#3B4A66" }}>
                                                            {docName}
                                                            {/* {(docType.toLowerCase() === 'pdf' || doc.file_extension?.toLowerCase() === 'pdf') && (
                                                                <span style={{ fontSize: '12px', color: '#EF4444', fontFamily: 'BasisGrotesquePro' }}>
                                                                    <i className="bi bi-file-pdf me-1"></i>
                                                                    PDF
                                                                </span>
                                                            )} */}
                                                        </div>
                                                        <div className="text-muted" style={{ fontSize: "13px", fontFamily: "BasisGrotesquePro", color: "#6B7280", fontWeight: "400" }}>
                                                            {/* Type: {docType} • Size: {docSize} • Updated: {docDate} */}
                                                            {/* {docFolder && docFolder !== 'General' && docFolder !== 'Uncategorized' && ` • Folder: ${docFolder}`} */}
                                                            {/* {docCategory && docCategory !== 'General' && docCategory !== 'Task Documents' && ` • Category: ${docCategory}`} */}
                                                            Size: {docSize} • Updated: {docDate}
                                                        </div>

                                                        {/* {docCategory && docCategory !== 'General' && docCategory !== 'Task Documents' && (
                                                            <div className="mt-2 d-flex flex-wrap gap-2">
                                                                {docCategory && (
                                                                    <span
                                                                        className="badge rounded-pill bg-white text-dark border"
                                                                        style={{ fontSize: "0.75rem", fontFamily: "BasisGrotesquePro", padding: "4px 8px" }}
                                                                    >
                                                                        {docCategory}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )} */}
                                                    </div>
                                                </div>

                                                {/* Right Side: Status + Menu */}
                                                <div className="d-flex align-items-center gap-2 mt-2 mt-md-0" style={{ flexShrink: 0 }}>
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
                                                                cursor: "pointer"
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const isPdf = docType.toLowerCase() === 'pdf' || doc.file_extension?.toLowerCase() === 'pdf';
                                                                if (isPdf && fileUrl) {
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

                                                    <button
                                                        className="btn btn-white border-0 p-2 d-flex align-items-center justify-content-center"
                                                        style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            borderRadius: "50%",
                                                            fontFamily: "BasisGrotesquePro",
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Handle menu click
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
                    className="modal"
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
                    <div
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


