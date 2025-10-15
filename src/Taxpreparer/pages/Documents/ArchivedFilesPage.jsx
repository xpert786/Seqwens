import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { CalenderListing, FileIcon, Uplopadedd, Doc, AwaitingIcon, Received, FaildIcon, Uploaded, FiltIcon, Archieve, UpIcon } from "../../component/icons";
import "../../styles/MyClients.css";
import { useNavigate } from "react-router-dom";
import TaxUploadModal from "../../upload/TaxUploadModal";

export default function ArchivedFilesPage() {
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);
  const handleUploadClick = () => setShowUpload(true);
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
  const initialFiles = [
    { id: 1, name: "W_2_JohnDoe_2023.pdf", owner: "John Doe", size: "240 KB", date: "03/15/2024" },
    { id: 2, name: "1099-INT_JohnDoe_2023.pdf", owner: "John Doe", size: "102.77 KB", date: "03/15/2024" },
    { id: 3, name: "Tax_Return_Draft_2023.pdf", owner: "John Doe", size: "500 KB", date: "03/14/2024" },
    { id: 4, name: "Business_Expenses_2023.xlsx", owner: "ABC Corp", size: "873 KB", date: "03/13/2024" },
  ];
  const [files, setFiles] = useState(initialFiles);
  const [recoverTarget, setRecoverTarget] = useState(null);

  return (
    <div className="p-4">
      {/* Upload Modal */}
      <TaxUploadModal show={showUpload} handleClose={() => setShowUpload(false)} />
      <div className="header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-semibold">Documents </h3>
          <small className="text-muted">Manage client documents and files</small>
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
      <div className="row g-3 mb-4">
        {cardData.map((item, index) => (
          <div className="col-md-3 col-sm-6" key={index}>
            <div className="stat-card">
              <div className="d-flex justify-content-between align-items-start">
                <div className="stat-icon" style={{ color: item.color, fontSize: 18 }}>
                  {item.icon}
                </div>
                <div className="stat-count" style={{ color: "#3B4A66", fontWeight: 600 }}>{item.count}</div>
              </div>
              <div className="mt-2">
                <p className="mb-0 text-muted small fw-semibold">{item.label}</p>
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

      <div className="bg-white rounded-xl p-3" style={{ border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)" }}>
        <div className="header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-semibold"> Archived Files</h3>
          <small className="text-muted">List of previously archived files</small>
        </div>
      </div>
      
        {files.map((f) => (
          <div
            key={f.id}
            className="document-card rounded-3 px-3 py-2 d-flex align-items-start mb-3"
            style={{
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              borderRadius: 12,
              position: "relative",
            }}
          >
            {/* Left icon */}
            <span className="icon-circle" style={{ marginRight: 12 }}><FileIcon /></span>

            {/* Main */}
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)", fontSize: 16 }}>{f.name}</div>
                  <div className="text-muted d-flex flex-wrap align-items-center" style={{ gap: 12, fontSize: 12 }}>
                    <span>{f.owner}</span>
                    <span>{f.size}</span>
                    <span className="d-inline-flex align-items-center" style={{ gap: 6 }}>
                      <CalenderListing /> {f.date}
                    </span>
                    <span className="rounded-pill d-inline-flex align-items-center" style={{ fontSize: 11, border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)", gap: 6, padding: "4px 10px" }}>
                      <Uplopadedd /> Shared
                    </span>
                  </div>
                </div>

                {/* Recover button */}
                <button
                  className="btn d-flex align-items-center justify-content-center"
                  style={{ whiteSpace: "nowrap", height: 32, padding: "0 14px", borderRadius: 10, border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)" }}
                  onClick={() => setRecoverTarget(f)}
                >
                  Recover File
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recover confirmation modal */}
      {recoverTarget && (
        <div>
          {/* Overlay */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              zIndex: 1050,
            }}
            onClick={() => setRecoverTarget(null)}
          />
          {/* Modal */}
          <div
            style={{
              position: "fixed",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              background: "#FFFFFF",
              borderRadius: 12,
              padding: 20,
              minWidth: 420,
              boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
              zIndex: 1051,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className="fw-semibold mb-2">Recover Archived File</h5>
            <div className="text-muted mb-3" style={{ lineHeight: 1.5 }}>
              You're about to recover <span className="fw-semibold">{recoverTarget.name}</span>. This will copy the file back to active storage.
            </div>
            <div className="d-flex justify-content-end" style={{ gap: 10 }}>
              <button className="btn btn-outline-secondary" onClick={() => setRecoverTarget(null)}>Cancel</button>
              <button
                className="btn dashboard-btn btn-upload"
                onClick={() => {
                  // Simulate recovery: remove from archived and go to all documents
                  setFiles(prev => prev.filter(x => x.id !== recoverTarget.id));
                  setRecoverTarget(null);
                  navigate('/taxdashboard/documents/all');
                }}
              >
                Confirm Recover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
