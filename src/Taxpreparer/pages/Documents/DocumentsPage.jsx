import React, { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { File,UpIcon,Doc,FaildIcon,FiltIcon,CompletedIcon ,AwaitingIcon, Received, Uploaded} from "../../component/icons";
import { FaSearch } from "react-icons/fa";
import TaxUploadModal from "../../upload/TaxUploadModal";
export default function DocumentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isNestedUnderClient = location.pathname.includes("/taxdashboard/client/");
  const [showUpload, setShowUpload] = useState(false);
  const documents = [
    {
      id: 1,
      title: "John Doe - 2023 Tax Return",
      owner: "John Doe",
      docsCount: 8,
      date: "03/06/2024",
    },
    {
      id: 2,
      title: "Sarah Wilson - Individual Return",
      owner: "Sarah Wilson",
      docsCount: 6,
      date: "02/14/2024",
    },
    {
      id: 3,
      title: "ABC Corp - Business Documents",
      owner: "ABC Corp",
      docsCount: 12,
      date: "03/11/2024",
    },
    {
      id: 4,
      title: "Tax Form Templates",
      owner: "System",
      docsCount: 25,
      date: "01/10/2024",
    },
  ];
  const clients = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "(555) 123-4567",
      statuses: ["Active", "High Priority", "High Priority", "Tax Season"],
      tasks: 3,
      documents: 8,
    },
    {
      id: 2,
      name: "Sarah Wilson",
      email: "sarah.wilson@email.com",
      phone: "(555) 123-4567",
      statuses: ["Pending", "Medium", "New Client"],
      tasks: 0,
      documents: 0,
    },
    {
      id: 3,
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "(555) 123-4567",
      statuses: ["Active", "Medium", "Client"],
      tasks: 2,
      documents: 1,
    },
    {
      id: 4,
      name: "Mike Johnson",
      email: "mike@abccorp.com",
      phone: "(555) 123-4567",
      statuses: ["Active", "High", "Business", "Quarterly"],
      tasks: 5,
      documents: 12,
      due: "3/31/2024",
    },
  ];

  const cardData = [
    { label: "Total Clients", icon: <Doc />, count: clients.length, color: "#00bcd4" },
    { label: "Pending", icon: <AwaitingIcon />, count: clients.filter(c => c.statuses.includes("Active")).length, color: "#4caf50" },
    { label: "Reviewed", icon: <Received />, count: clients.filter(c => c.statuses.includes("Pending")).length, color: "#3f51b5" },
    { label: "Needs Revision", icon: <FaildIcon />, count: clients.filter(c => c.statuses.includes("High Priority")).length, color: "#EF4444" },
     { label: "My Uploads", icon: <Uploaded />, count: clients.filter(c => c.statuses.includes("My Uploads")).length, color: "#EF4444" },
  ];

  const wrapperClass = isNestedUnderClient ? "mt-6" : "p-4";

  return (
    <div className={wrapperClass}>
      {/* Upload Modal */}
      <TaxUploadModal show={showUpload} handleClose={() => setShowUpload(false)} />
      {/* Header (hide when nested under client) */}
      {!isNestedUnderClient && (
        <div className="header d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-semibold">Documents</h3>
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
      )}

      {/* Stats (hide when nested under client) */}
      {!isNestedUnderClient && (
        <div className="row g-3 mb-3">
          {cardData.map((item, index) => (
            <div className="col-md-3 col-sm-6" key={index}>
              <div className="stat-card ">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="stat-icon" style={{ color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="stat-count">{item.count}</div>
                </div>
                <div className="mt-2">
                  <p className="mb-0 text-muted small fw-semibold">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filter (hide when nested under client) */}
      {!isNestedUnderClient && (
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
      )}

      {/* Client Folders Section (always show; this is what you want under MyClient > Documents) */}
      <div className="bg-white rounded-xl p-4">
        <div className="header d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-semibold">Client Folders</h3>
            <small className="text-muted">Organized document folders by client</small>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc, idx) => (
            <div
              key={doc.id}
              className="document-card p-4 flex flex-col justify-between"
              style={{
                border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                borderRadius: "12px",
                cursor: "pointer",
              }}
              onClick={() => {
                // Navigate to the all documents page when any document card is clicked
                navigate("/taxdashboard/documents/all");
              }}
            >
              {/* Header row: icon left, badge right */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-orange-500"><File /></div>
                <span className="text-xs text-white px-2 py-0.5 rounded-full" style={{ background: "var(--Palette2-Gold-800, #F49C2D)" }}>
                  Client Folder
                </span>
              </div>
              <div className="font-medium text-gray-800">{doc.title}</div>
              <div className="text-gray-500 text-xs">{doc.owner}</div>
              {/* Footer row: documents count left, date right */}
              <div className="flex items-center justify-between text-gray-400 text-xs mt-2">
                <div>{doc.docsCount} documents</div>
                <div>{doc.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Render nested routes */}
      <div className="mt-4">
        <Outlet />
      </div>
    </div>
  );
}
