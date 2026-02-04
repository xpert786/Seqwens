import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaSearch, FaRegCalendarAlt, FaRegShareSquare } from "react-icons/fa";
import { Doc, UpIcon, File, AwaitingIcon, Received, FileIcon, Uplopadedd, FaildIcon, Uploaded, FiltIcon, CalenderListing, Archieve } from "../../component/icons";
import TaxUploadModal from "../../upload/TaxUploadModal";
import "../../styles/MyClients.css";

// Mock data for demonstration
const mockDocuments = {
  "SCH-2024-021": {
    id: "SCH-2024-021",
    title: "Quarterly Planning Session",
    date: "Mar 15, 2024",
    time: "10:00 AM - 11:00 AM",
    method: "Zoom Meeting",
    status: "confirmed",
    person: "Sarah Johnson",
    note: "Discuss Q1 2024 tax planning strategies",
    files: [
      { id: 1, name: "Q1_Planning_2024.pdf", type: "pdf", size: "2.4 MB", uploaded: "Mar 10, 2024" },
      { id: 2, name: "Financial_Report_Q1_2024.xlsx", type: "xlsx", size: "1.8 MB", uploaded: "Mar 12, 2024" }
    ]
  },
  "SCH-2024-025": {
    id: "SCH-2024-025",
    title: "Tax Return Review",
    date: "Mar 22, 2024",
    time: "2:00 PM - 3:00 PM",
    method: "Zoom Meeting",
    status: "confirmed",
    person: "Sarah Johnson",
    note: "Review and finalize 2023 tax return",
    files: [
      { id: 3, name: "Tax_Return_2023.pdf", type: "pdf", size: "3.2 MB", uploaded: "Mar 20, 2024" },
      { id: 4, name: "W2_2023.pdf", type: "pdf", size: "1.1 MB", uploaded: "Mar 20, 2024" }
    ]
  },
  "SCH-2024-028": {
    id: "SCH-2024-028",
    title: "Document Review",
    date: "Mar 28, 2024",
    time: "9:00 AM - 9:30 AM",
    method: "Zoom Meeting",
    status: "pending",
    person: "John Smith",
    note: "Quick review of uploaded documents",
    files: [
      { id: 5, name: "Document_Review_Checklist.pdf", type: "pdf", size: "0.8 MB", uploaded: "Mar 25, 2024" }
    ]
  }
};

export default function AllDocumentsPage() {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [documentDetails, setDocumentDetails] = useState(null);
  const navigate = useNavigate();
  const { documentId } = useParams();

  useEffect(() => {
    if (documentId) {
      // If we have a documentId, find and set the document details
      const doc = mockDocuments[documentId];
      if (doc) {
        setDocumentDetails(doc);
      } else {
        // If document not found, redirect to documents list
        navigate("/taxdashboard/documents/all");
      }
    } else {
      // If no documentId, reset document details
      setDocumentDetails(null);
    }
  }, [documentId, navigate]);

  // Mimic top stats like DocumentsPage
  const clients = [
    { id: 1, statuses: ["Active", "High Priority"] },
    { id: 2, statuses: ["Pending"] },
    { id: 3, statuses: ["Active"] },
  ];
  const cardData = [
    { label: "Total Clients", icon: <Doc />, count: clients.length, color: "#00bcd4" },
    { label: "Pending", icon: <AwaitingIcon />, count: clients.filter(c => c.statuses.includes("Active")).length, color: "#4caf50" },
    { label: "Reviewed", icon: <Received />, count: clients.filter(c => c.statuses.includes("Pending")).length, color: "#3f51b5" },
    { label: "Needs Revision", icon: <FaildIcon />, count: clients.filter(c => c.statuses.includes("High Priority")).length, color: "#EF4444" },
    { label: "My Uploads", icon: <Uploaded />, count: clients.filter(c => c.statuses.includes("My Uploads")).length, color: "#EF4444" },
  ];
  const files = [
    { id: 1, name: "W_2_JohnDoe_2023.pdf", owner: "John Doe", size: "2.4 MB", date: "02/15/2024", status: "Processed" },
    { id: 2, name: "1099-MI_JohnDoe_2023.pdf", owner: "John Doe", size: "1.1 MB", date: "02/01/2024", status: "Pending" },
    { id: 3, name: "Tax_Return_Draft_2023.pdf", owner: "John Doe", size: "3.8 MB", date: "03/01/2024", status: "Reviewed" },
    { id: 4, name: "Business_Expenses_2023.xlsx", owner: "ABC Corp", size: "835 KB", date: "01/22/2024", status: "Reviewed" },
  ];
  // If we have document details, show the document view
  if (documentDetails) {
    return (
      <div className="p-4">
        <div className="d-flex align-items-center mb-4">
          <button
            className="btn btn-link text-decoration-none me-3"
            onClick={() => navigate(-1)}
          >
            &larr; Back to Schedule
          </button>
          <h4 className="mb-0">{documentDetails.title}</h4>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h5 className="card-title">{documentDetails.title}</h5>
                <p className="card-text">{documentDetails.note}</p>
                <p className="card-text">
                  <small className="text-muted">
                    <strong>Date:</strong> {documentDetails.date} at {documentDetails.time}<br />
                    <strong>With:</strong> {documentDetails.person}<br />
                    <strong>Status:</strong> {documentDetails.status}
                  </small>
                </p>
              </div>
              <div className="col-md-6">
                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-primary">
                    <i className="bi bi-download me-2"></i>Download All
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setShowUpload(true)}
                  >
                    <i className="bi bi-upload me-2"></i>Add Files
                  </button>
                </div>
              </div>
            </div>

            <h6 className="mb-3">Attached Files ({documentDetails.files.length})</h6>
            <div className="list-group">
              {documentDetails.files.map(file => (
                <div key={file.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i className={`bi bi-filetype-${file.type} fs-4 me-3`}></i>
                    <div>
                      <h6 className="mb-0">{file.name}</h6>
                      <small className="text-muted">{file.size} • Uploaded {file.uploaded}</small>
                    </div>
                  </div>
                  <div className="btn-group">
                    <button className="btn  btn-outline-secondary">
                      <i className="bi bi-download"></i>
                    </button>
                    <button className="btn  btn-outline-secondary">
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <TaxUploadModal show={showUpload} handleClose={() => setShowUpload(false)} />
      </div>
    );
  }

  // Default view - documents list
  return (
    <div className="p-4">
      {/* Upload Modal */}
      <TaxUploadModal show={showUpload} handleClose={() => setShowUpload(false)} />

      {/* Top header */}
      <div className="header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-semibold">Documents</h4>
          <small className="text-muted">Select a document to view details</small>
        </div>
        <button
          className="btn dashboard-btn btn-upload d-flex align-items-center gap-2"
          onClick={() => setShowUpload(true)}
        >
          <UpIcon />
          Upload Documents
        </button>
      </div>

      {/* Stats */}

      <div className="row g-3 mb-3">

        {cardData.map((item, index) => (
          <div className="col-md-3 col-sm-6" key={index}>

            <div className="stat-card">
              <div className="d-flex justify-content-start align-items-start">
                <div className="stat-icon" style={{ color: item.color }}>
                  {item.icon}
                </div>
              </div>
              <div className="stat-count-wrapper">
                <div className="stat-count">{item.count}</div>
              </div>
              <div className="mt-2">
                <p className="mb-0 text-muted small fw-semibold text-center">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search / Filter row with Archive right-aligned (single line) */}
      <div className="d-flex align-items-center justify-content-between flex-nowrap mb-3 mt-3" style={{ gap: 12 }}>
        <div className="d-flex align-items-center gap-2 mb-3 mt-3">
          <div className="position-relative search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="form-control ps-5 rounded mt-2"
              placeholder="Search.."
              style={{ border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)" }}
            />
          </div>
          <button className="btn btn-filter d-flex align-items-center rounded px-4" style={{ border: "none" }}>
            <FiltIcon className="me-3 text-muted" />
            <span className="ms-1">Filter</span>
          </button>
        </div>

        <button
          className="btn dashboard-btn btn-upload d-flex align-items-center gap-2"
          style={{ whiteSpace: "nowrap", height: 36, padding: "0 16px", borderRadius: 10 }}
          onClick={() => navigate('/taxdashboard/documents/archived')}
        >
          <Archieve />
          Archive Files
        </button>
      </div>

      {/* List container */}
      <div className="bg-white rounded-xl p-3" style={{ border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)" }}>
        <div className="header mb-4">
          <h4 className="fw-semibold">All Documents</h4>
          <small className="text-muted">Complete list of client documents</small>
        </div>
        {files.map((f, idx) => (
          <div
            key={f.id}
            className="document-card rounded-3 px-3 py-2 d-flex align-items-start mb-4"
            style={{
              // background: idx === 0 ? "var(--Palette2-Gold-200, #FFF4E6)" : "transparent",
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              borderRadius: 12,
              marginBottom: 6,
              position: "relative",
            }}
            onClick={() => setOpenMenuId(null)}
          >
            {/* Left file icon bubble with spacing */}
            <span className="icon-circle" style={{ marginRight: 12 }}><FileIcon /></span>

            {/* Main content */}
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="fw-semibold" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)", fontSize: 16 }}>
                    {f.name}
                  </div>
                  <div className="text-muted d-flex flex-wrap align-items-center" style={{ gap: 12, fontSize: 12 }}>
                    <span>{f.owner}</span>
                    <span>{f.size}</span>
                    <span className="d-inline-flex align-items-center" style={{ gap: 6 }}>
                      <CalenderListing /> {f.date}
                    </span>
                  </div>
                </div>

                {/* right menu with V1 and kebab */}
                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                  <span
                    className="rounded"
                    style={{
                      padding: "2px 8px",
                      fontSize: 12,

                    }}
                  >
                    V1
                  </span>
                  <button
                    type="button"
                    className="btn p-1"
                    style={{
                      lineHeight: 1,
                      border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                      background: "#FFFFFF",
                      color: "#3B4A66",
                      borderRadius: 8,
                      width: 28,
                      height: 28,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === f.id ? null : f.id);
                    }}
                  >
                    ⋮
                  </button>
                </div>
              </div>
              {openMenuId === f.id && (
                <div className="document-card"
                  style={{
                    position: "absolute",
                    right: 12,

                    top: 40,
                    background: "#FFFFFF",
                    border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                    borderRadius: 12,
                    padding: 8,
                    width: 170,
                    boxShadow: "0 12px 30px rgba(59,74,102,0.12)",
                    zIndex: 20,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="document-card"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      // background: "var(--Palette2-Gold-200, #FFF4E6)",
                      color: "#3B4A66",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={() => { setOpenMenuId(null); navigate('/taxdashboard/documents/archived'); }}
                  >
                    View
                  </div>
                  <div className="document-card"
                    style={{ padding: "10px 12px", borderRadius: 8, color: "#3B4A66", cursor: "pointer" }}
                    onClick={() => setOpenMenuId(null)}
                  >
                    Download
                  </div>
                  <div className="document-card"
                    style={{ padding: "10px 12px", borderRadius: 8, color: "#3B4A66", cursor: "pointer" }}
                    onClick={() => { setOpenMenuId(null); navigate('/taxdashboard/documents/archived'); }}
                  >
                    Archive
                  </div>
                </div>
              )}
              {/* Pills row */}
              <div className="mt-1 d-flex flex-wrap" style={{ gap: 6 }}>
                {/* Pending review */}
                <span
                  className="rounded-pill"
                  style={{
                    border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                    cursor: idx === 0 ? "pointer" : "default",
                    color: "#000",
                    fontSize: 11,

                    padding: "4px 10px",
                  }}
                >
                  pending review
                </span>
                {/* w-2 */}
                <span className="rounded-pill" style={{
                  color: "#000", fontSize: 11, border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                  cursor: idx === 0 ? "pointer" : "default", padding: "4px 10px"
                }}>w-2</span>
                {/* 2023 */}
                <span className="rounded-pill" style={{
                  color: "#000", fontSize: 11, border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                  cursor: idx === 0 ? "pointer" : "default", padding: "4px 10px"
                }}>2023</span>
                {/* Individual */}
                <span className="rounded-pill" style={{
                  color: "#000", fontSize: 11, border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                  cursor: idx === 0 ? "pointer" : "default", padding: "4px 10px"
                }}>Individual</span>
                {/* Shared */}
                <span className="rounded-pill d-inline-flex align-items-center" style={{
                  fontSize: 11, border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                  cursor: idx === 0 ? "pointer" : "default", gap: 6, padding: "4px 10px"
                }}>
                  <Uplopadedd /> Shared
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
