import React, { useState, useEffect, useRef } from 'react';
import { handleAPIError } from "../../utils/apiUtils";
import { getApiBaseUrl, fetchWithCors } from "../../utils/corsConfig";
import { getAccessToken } from "../../utils/userUtils";
import { UpIcon } from '../icons';
import { toast } from "react-toastify";
import ConfirmationModal from "../../../components/ConfirmationModal";
import "../../styles/Document.css";
import Pagination from "../Pagination";

export default function ArchivedDocuments() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('General');
    const [selectedStatus, setSelectedStatus] = useState('All Status');
    const [categories, setCategories] = useState([]);
    const categoryMapRef = useRef({}); // Map category names to IDs (using ref to avoid re-renders)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;
    const [showDeleteDocumentConfirm, setShowDeleteDocumentConfirm] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);

    // Fetch archived documents from the API
    const fetchArchivedDocuments = async (search = '', categoryId = null) => {
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

            // Build query parameters
            const params = new URLSearchParams();
            if (search) {
                params.append('search', search);
            }
            if (categoryId && categoryId !== 'All Categories') {
                params.append('category_id', categoryId);
            }

            const queryString = params.toString();
            const url = `${API_BASE_URL}/taxpayer/documents/archived/${queryString ? '?' + queryString : ''}`;

            const response = await fetchWithCors(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Archived Documents API response:', result);

            if (result.success && result.data) {
                // Get documents array
                const docs = result.data.documents || [];
                setDocuments(docs);

                // Extract unique categories from documents with their IDs
                const categoryMap = {};
                const uniqueCategories = [];
                docs.forEach(doc => {
                    if (doc.category?.name && doc.category?.id) {
                        if (!categoryMap[doc.category.name]) {
                            categoryMap[doc.category.name] = doc.category.id;
                            uniqueCategories.push(doc.category.name);
                        }
                    }
                });
                setCategories(uniqueCategories);
                categoryMapRef.current = categoryMap;
            } else {
                setDocuments([]);
                setCategories([]);
                categoryMapRef.current = {};
            }
        } catch (err) {
            console.error('Error fetching archived documents:', err);
            if (err.message.includes('404') || err.message.includes('Not Found')) {
                setDocuments([]);
                setCategories([]);
                categoryMapRef.current = {};
            } else {
                setError(handleAPIError(err));
                setDocuments([]);
                setCategories([]);
                categoryMapRef.current = {};
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArchivedDocuments();
    }, []);

    // Refetch when search query or category changes (skip initial mount)
    const isInitialMount = useRef(true);
    useEffect(() => {
        // Skip the first render
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            // Get category ID from categoryMapRef
            let categoryId = null;
            if (selectedCategory !== 'General') {
                categoryId = categoryMapRef.current[selectedCategory] || null;
            }
            fetchArchivedDocuments(searchQuery, categoryId);
        }, 500); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedCategory]);

    // Filter documents based on status (search and category are handled by API)
    const filteredDocuments = documents.filter(doc => {
        const matchesStatus = selectedStatus === 'All Status' ||
            (doc.status_display || doc.status || '').toLowerCase() === selectedStatus.toLowerCase();

        // Filter by category if not "General"
        const matchesCategory = selectedCategory === 'General' ||
            (doc.category?.name || 'General') === selectedCategory;

        return matchesStatus && matchesCategory;
    });

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, selectedStatus, searchQuery]);

    // Pagination for archived documents
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredDocuments.length);
    const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

    const handleRecover = async (docId) => {
        try {
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            if (!token) {
                console.error('No authentication token found');
                return;
            }

            const url = `${API_BASE_URL}/taxpayer/documents/${docId}/archive/`;

            const config = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'unarchive' }),
            };

            const response = await fetchWithCors(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Refresh the archived documents list
                const categoryId = selectedCategory !== 'General'
                    ? categoryMapRef.current[selectedCategory] || null
                    : null;
                fetchArchivedDocuments(searchQuery, categoryId);
                alert('Document recovered successfully');
            } else {
                throw new Error(result.message || 'Failed to recover document');
            }
        } catch (error) {
            console.error('Error recovering document:', error);
            alert(handleAPIError(error));
        }
    };

    const handleDelete = async (docId) => {
        setDocumentToDelete(docId);
        setShowDeleteDocumentConfirm(true);
    };

    const confirmDeleteDocument = async () => {
        if (!documentToDelete) return;

        try {
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            if (!token) {
                console.error('No authentication token found');
                return;
            }

            const url = `${API_BASE_URL}/taxpayer/documents/${documentToDelete}/`;

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

            // Refresh the archived documents list
            const categoryId = selectedCategory !== 'General'
                ? categoryMapRef.current[selectedCategory] || null
                : null;
            fetchArchivedDocuments(searchQuery, categoryId);
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
        }
    };

    const handleDownload = (docId) => {
        const doc = documents.find(d => (d.id || d.document_id) === docId);
        if (doc && (doc.tax_documents || doc.file_url)) {
            const fileUrl = doc.tax_documents || doc.file_url;
            const fileName = doc.document_name || doc.file_name || 'document.pdf';
            window.open(fileUrl, '_blank');
        } else {
            alert('Document file not available');
        }
    };

    const handleExportLog = () => {
        // TODO: Implement export archived log functionality
        console.log('Export archived log');
    };

    if (loading) {
        return (
            <div className="container-fluid px-0 mt-3">
                <div className="bg-white p-4 rounded-3">
                    <div className="text-center py-5">
                        <p>Loading archived documents...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid px-0 mt-3">
                <div className="bg-white p-4 rounded-3">
                    <div className="text-center py-5">
                        <p className="text-danger">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="container-fluid px-0 mt-3">
            <div className="bg-white p-4 rounded-3">
                <div className="mb-3">
                    <h5 className="mb-0" style={{ fontSize: "20px", fontWeight: "500", color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                        Taxpayer — My Documents (Archived)
                    </h5>
                    <p className="mb-0 mt-1" style={{ fontSize: "14px", color: "#4B5563", fontFamily: "BasisGrotesquePro" }}>
                        All archived documents you've uploaded and shared documents
                    </p>
                </div>

                {/* Search and Filter Bar */}
                <div className="d-flex align-items-center justify-content-between mb-4" style={{ flexWrap: "wrap", gap: "12px" }}>
                    <div className="d-flex align-items-center" style={{ gap: "12px", flexWrap: "wrap" }}>
                        <div className="position-relative" style={{
                            width: "250px",
                            border: "1px solid #E5E7EB",
                            borderRadius: "6px",
                            backgroundColor: "#F3F7FF",
                            height: "32px",
                            display: "flex",
                            alignItems: "center"
                        }}>
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{
                                    position: "absolute",
                                    left: "12px",
                                    top: "45%",
                                    transform: "translateY(-50%)",
                                    zIndex: 1,
                                    pointerEvents: "none"
                                }}
                            >
                                <path d="M12.25 12.25L9.74167 9.74167M11.0833 6.41667C11.0833 8.99399 8.99399 11.0833 6.41667 11.0833C3.83934 11.0833 1.75 8.99399 1.75 6.41667C1.75 3.83934 3.83934 1.75 6.41667 1.75C8.99399 1.75 11.0833 3.83934 11.0833 6.41667Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search documents by name, client, or uploader..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    backgroundColor: "transparent",
                                    height: "100%",
                                    fontSize: "13px",
                                    paddingLeft: "32px",
                                    paddingRight: "10px",
                                    paddingTop: "10px",
                                    paddingBottom: "0",
                                    margin: "0",
                                    border: "none",
                                    outline: "none",
                                    boxShadow: "none",
                                    width: "100%",
                                    lineHeight: "28px",
                                    boxSizing: "border-box",
                                    display: "block"
                                }}
                            />
                        </div>

                        <select
                            className="form-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{
                                width: "140px",
                                fontFamily: "BasisGrotesquePro",
                                fontSize: "14px"
                            }}
                        >
                            <option>General</option>
                            {categories.map((category, index) => (
                                <option key={index} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>

                        <select
                            className="form-select"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            style={{
                                width: "140px",
                                fontFamily: "BasisGrotesquePro",
                                fontSize: "14px"
                            }}
                        >
                            <option>All Status</option>
                            <option>Active</option>
                            <option>Archived</option>
                        </select>
                    </div>

                    <div className="d-flex align-items-center" style={{ gap: "12px", flexShrink: 0 }}>
                        <button
                            className="btn text-white fw-semibold d-flex align-items-center gap-2"
                            onClick={handleExportLog}
                            style={{
                                backgroundColor: "#F56D2D",
                                fontFamily: "BasisGrotesquePro",
                                fontSize: "12px",
                                padding: "6px 10px",
                                whiteSpace: "nowrap"
                            }}
                        >
                            <UpIcon />
                            Export Archived Log
                        </button>
                    </div>
                </div>

                {/* Documents Table */}
                {filteredDocuments.length === 0 ? (
                    <div className="text-center py-5">
                        <p style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>
                            No archived documents found
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="table" style={{ fontFamily: "BasisGrotesquePro" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #E8F0FF" }}>
                                        <th style={{ padding: "12px", color: "#3B4A66", fontWeight: "500", fontSize: "14px" }}>File Name</th>
                                        <th style={{ padding: "12px", color: "#3B4A66", fontWeight: "500", fontSize: "14px" }}>Category</th>
                                        <th style={{ padding: "12px", color: "#3B4A66", fontWeight: "500", fontSize: "14px", textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedDocuments.map((doc, index) => {
                                    const docName = doc.document_name || doc.file_name || doc.name || doc.filename || 'Untitled Document';
                                    const docCategory = doc.category?.name || 'General';
                                    const fileUrl = doc.tax_documents || doc.file_url || '';

                                    return (
                                        <tr key={doc.id || doc.document_id || index} style={{ borderBottom: "1px solid #E8F0FF" }}>
                                            <td style={{ padding: "16px 12px", color: "#3B4A66", fontSize: "14px" }}>
                                                {docName}
                                            </td>
                                            <td style={{ padding: "16px 12px" }}>
                                                <span
                                                    className="badge"
                                                    style={{
                                                        backgroundColor: "#F3F4F6",
                                                        color: "#6B7280",
                                                        padding: "4px 12px",
                                                        borderRadius: "12px",
                                                        fontSize: "12px",
                                                        fontWeight: "500"
                                                    }}
                                                >
                                                    {docCategory}
                                                </span>
                                            </td>
                                            <td style={{ padding: "16px 12px", textAlign: "right" }}>
                                                <div className="d-flex align-items-center justify-content-end gap-2">
                                                    <button
                                                        className="btn btn-sm"
                                                        onClick={() => handleRecover(doc.id || doc.document_id)}
                                                        style={{
                                                            backgroundColor: "#00C0C6",
                                                            color: "white",
                                                            border: "none",
                                                            borderRadius: "6px",
                                                            padding: "6px 16px",
                                                            fontSize: "13px",
                                                            fontFamily: "BasisGrotesquePro",
                                                            fontWeight: "500"
                                                        }}
                                                    >
                                                        Recover
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        onClick={() => handleDownload(doc.id || doc.document_id)}
                                                        style={{
                                                            backgroundColor: "#F3F4F6",
                                                            color: "#6B7280",
                                                            border: "none",
                                                            borderRadius: "6px",
                                                            padding: "6px 16px",
                                                            fontSize: "13px",
                                                            fontFamily: "BasisGrotesquePro",
                                                            fontWeight: "500"
                                                        }}
                                                    >
                                                        Download
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                    })}
                                </tbody>
                            </table>
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
                    </>
                )}
            </div>
        </div>

        {/* Delete Document Confirmation Modal */}
        <ConfirmationModal
            isOpen={showDeleteDocumentConfirm}
            onClose={() => {
                setShowDeleteDocumentConfirm(false);
                setDocumentToDelete(null);
            }}
            onConfirm={confirmDeleteDocument}
            title="Delete Document"
            message="Are you sure you want to delete this document? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            isDestructive={true}
        />
        </>
    );
}

