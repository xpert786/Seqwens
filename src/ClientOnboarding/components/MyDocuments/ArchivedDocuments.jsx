import React, { useState, useEffect } from 'react';
import { documentsAPI, handleAPIError } from "../../utils/apiUtils";
import { UpIcon } from '../icons';

export default function ArchivedDocuments() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [selectedStatus, setSelectedStatus] = useState('All Status');

    useEffect(() => {
        const fetchArchivedDocuments = async () => {
            try {
                setLoading(true);
                setError(null);
                // TODO: Replace with actual archived documents API endpoint
                const response = await documentsAPI.getDocuments();

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

                // In archived documents page, show all documents (both Active and Archived status)
                // The API should return archived documents, but we show all here
                // Filter by status can be done via the status dropdown
                setDocuments(docs);
            } catch (err) {
                console.error('Error fetching archived documents:', err);
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

        fetchArchivedDocuments();
    }, []);

    // Filter documents based on search, category, and status
    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = !searchQuery ||
            (doc.name || doc.file_name || doc.document_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All Categories' ||
            (doc.category || doc.folder || '') === selectedCategory;
        const matchesStatus = selectedStatus === 'All Status' ||
            (doc.status || '').toLowerCase() === selectedStatus.toLowerCase();

        return matchesSearch && matchesCategory && matchesStatus;
    });

    const handleRecover = (docId) => {
        // TODO: Implement recover functionality
        console.log('Recover document:', docId);
    };

    const handleDelete = (docId) => {
        // TODO: Implement delete functionality
        console.log('Delete document:', docId);
    };

    const handleDownload = (docId) => {
        // TODO: Implement download functionality
        console.log('Download document:', docId);
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
        <div className="container-fluid px-0 mt-3">
            <div className="bg-white p-4 rounded-3">
                <div className="mb-3">
                    <h5 className="mb-0" style={{ fontSize: "20px", fontWeight: "500", color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                        Taxpayer — My Documents (Active)
                    </h5>
                    <p className="mb-0 mt-1" style={{ fontSize: "14px", color: "#4B5563", fontFamily: "BasisGrotesquePro" }}>
                        All documents you've uploaded and shared documents
                    </p>
                </div>

                {/* Search and Filter Bar */}
                <div className="d-flex align-items-center justify-content-between mb-4" style={{ flexWrap: "nowrap", gap: "12px" }}>
                    <div className="position-relative" style={{ maxWidth: "250px", width: "100%" }}>
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
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
                            <path d="M11 11L8.49167 8.49167M9.83333 5.16667C9.83333 7.74399 7.74399 9.83333 5.16667 9.83333C2.58934 9.83333 0.5 7.74399 0.5 5.16667C0.5 2.58934 2.58934 0.5 5.16667 0.5C7.74399 0.5 9.83333 2.58934 9.83333 5.16667Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search documents by name, client, or uploader..."
                            className="form-control ps-5"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: "40px", fontSize: "14px", backgroundColor: "#F3F7FF" }}
                        />
                    </div>

                    <div className="d-flex align-items-center" style={{ gap: "12px", flexShrink: 0 }}>
                        <select
                            className="form-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{
                                width: "120px",
                                fontFamily: "BasisGrotesquePro",
                                fontSize: "14px"
                            }}
                        >
                            <option>All Categories</option>
                            <option>Tax Returns</option>
                            <option>Banking</option>
                            <option>Medical</option>
                            <option>Receipts</option>
                        </select>

                        <select
                            className="form-select"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            style={{
                                width: "110px",
                                fontFamily: "BasisGrotesquePro",
                                fontSize: "14px"
                            }}
                        >
                            <option>All Status</option>
                            <option>Active</option>
                            <option>Archived</option>
                        </select>

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
                    <div className="table-responsive">
                        <table className="table" style={{ fontFamily: "BasisGrotesquePro" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #E8F0FF" }}>
                                    <th style={{ padding: "12px", color: "#3B4A66", fontWeight: "500", fontSize: "14px" }}>File Name</th>
                                    <th style={{ padding: "12px", color: "#3B4A66", fontWeight: "500", fontSize: "14px" }}>Status</th>
                                    <th style={{ padding: "12px", color: "#3B4A66", fontWeight: "500", fontSize: "14px", textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDocuments.map((doc, index) => {
                                    const docName = doc.name || doc.file_name || doc.document_name || doc.filename || 'Untitled Document';
                                    const docStatus = doc.status || 'Active';
                                    const isArchived = docStatus.toLowerCase() === 'archived';
                                    const isActive = docStatus.toLowerCase() === 'active';

                                    return (
                                        <tr key={doc.id || doc.document_id || index} style={{ borderBottom: "1px solid #E8F0FF" }}>
                                            <td style={{ padding: "16px 12px", color: "#3B4A66", fontSize: "14px" }}>
                                                {docName}
                                            </td>
                                            <td style={{ padding: "16px 12px" }}>
                                                <span
                                                    className="badge"
                                                    style={{
                                                        backgroundColor: isActive ? "#E8F5E9" : "#F3F4F6",
                                                        color: isActive ? "#2E7D32" : "#6B7280",
                                                        padding: "4px 12px",
                                                        borderRadius: "12px",
                                                        fontSize: "12px",
                                                        fontWeight: "500"
                                                    }}
                                                >
                                                    {docStatus}
                                                </span>
                                            </td>
                                            <td style={{ padding: "16px 12px", textAlign: "right" }}>
                                                <div className="d-flex align-items-center justify-content-end gap-2">
                                                    {isActive ? (
                                                        <>
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
                                                                onClick={() => handleDelete(doc.id || doc.document_id)}
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
                                                                Delete
                                                            </button>
                                                        </>
                                                    ) : isArchived ? (
                                                        <button
                                                            className="btn btn-sm"
                                                            onClick={() => handleDownload(doc.id || doc.document_id)}
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
                                                            Download
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

