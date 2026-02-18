import React, { useState, useRef } from 'react';
import { UpIcon } from "../icons";
import DocumentRequests from './DocumentRequests';
import MyDocumentsContent from './MyDocumentsContent';
import UploadModal from "../../upload/UploadModal";
import ESignature from './ESignature';
import ArchivedDocuments from './ArchivedDocuments';
import ReviewRequests from './ReviewRequests';
import '../../styles/MyDocumentMain.css';

const tabs = [
  { name: 'Document Requests', key: 'requests' },
  { name: 'My Documents', key: 'my' },
  { name: 'E-signature', key: 'signature' },
  { name: 'Review Requests', key: 'reviews' },
  { name: 'Archived Documents', key: 'archived' }
];

export default function MyDocumentsMain() {
  const [activeTab, setActiveTab] = useState('requests');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documentsRefreshKey, setDocumentsRefreshKey] = useState(0);

  return (
    <div
      className="container-fluid px-2 px-md-4 py-3"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F8FAFC"
      }}
    >
      {/* Header Section */}
      <div className="container-fluid px-3 px-md-4 py-2 py-md-3">
        {/* Header Container: Switches to vertical stack on mobile, horizontal on desktop */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 px-1">

          {/* Left: Branding & Context */}
          <div className="flex-grow-1 min-w-0">
            <h5
              className="mb-1 text-truncate"
              style={{
                fontSize: 'calc(1.3rem + 0.4vw)',
                fontWeight: '700',
                color: '#3B4A66',
                fontFamily: "BasisGrotesquePro",
                letterSpacing: '-0.02em'
              }}
            >
              My Documents
            </h5>
            <p
              className="text-muted mb-0 d-none d-sm-block"
              style={{
                fontFamily: "BasisGrotesquePro",
                fontSize: "14px",
                lineHeight: "1.4",
                maxWidth: "450px"
              }}
            >
              Upload, organize, and manage your tax documents securely
            </p>
          </div>

          {/* Right: The Fixed Primary Button */}
          <div className="w-100 w-md-auto d-flex justify-content-center justify-content-md-end align-self-center align-self-md-center">
            <button
              className="btn text-white fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm transition-all"
              onClick={() => setShowUploadModal(true)}
              style={{
                backgroundColor: "#F56D2D",
                borderRadius: "12px",
                padding: "12px 24px",
                minHeight: "48px",
                width: "auto",
                border: "none",
                boxShadow: "0 4px 14px 0 rgba(245, 109, 45, 0.39)",
                fontSize: "15px"
              }}
            >
              <UpIcon size={20} className="flex-shrink-0" />
              <span className="text-nowrap">Upload Documents</span>
            </button>
          </div>

          <UploadModal
            show={showUploadModal}
            handleClose={() => setShowUploadModal(false)}
            onUploadSuccess={() => {
              setDocumentsRefreshKey(prev => prev + 1);
            }}
          />
        </div>
      </div>

      {/* Tabs Section - Scrollable on Mobile */}
      <div className="tabs-container mb-4">
        <div
          className="d-inline-flex p-1 shadow-sm"
          style={{
            border: "1px solid #E8F0FF",
            borderRadius: "14px",
            backgroundColor: "#FFFFFF",
            fontFamily: "BasisGrotesquePro",
            whiteSpace: "nowrap"
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "10px 22px",
                borderRadius: "11px",
                border: "none",
                fontSize: "14px",
                fontWeight: "500",
                backgroundColor: activeTab === tab.key ? "#00C0C6" : "transparent",
                color: activeTab === tab.key ? "#ffffff" : "#3B4A66",
                fontFamily: "BasisGrotesquePro",
                transition: "all 0.2s ease",
                cursor: "pointer",
                marginRight: "4px"
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow-1" style={{ paddingBottom: "100px" }}>
        {activeTab === 'requests' && <DocumentRequests />}
        {activeTab === 'my' && <MyDocumentsContent key={documentsRefreshKey} />}
        {activeTab === 'signature' && <ESignature />}
        {activeTab === 'reviews' && <ReviewRequests />}
        {activeTab === 'archived' && <ArchivedDocuments />}
      </div>
    </div>
  );
}
