import React, { useState } from 'react';
import { UpIcon } from "../icons";
import DocumentRequests from './DocumentRequests';
import MyDocumentsContent from './MyDocumentsContent';
import UploadModal from "../../upload/UploadModal";
import Folders from './Folders';
import ESignature from './ESignature';
import ArchivedDocuments from './ArchivedDocuments';

const tabs = [
  { name: 'Document Requests', key: 'requests' },
  { name: 'My Documents', key: 'my' },
  { name: 'Folders', key: 'folders' },
  { name: 'E-signature', key: 'signature' },
  { name: 'Archived Documents', key: 'archived' }
];

export default function MyDocumentsMain() {
  const [activeTab, setActiveTab] = useState('requests');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isFolderSelected, setIsFolderSelected] = useState(false);

  return (
    <div className='px-4'>
      {/* Header - Hide when folder is selected */}
      {!isFolderSelected && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-0" style={{ fontSize: '26px', fontWeight: '500', color: '#3B4A66', fontFamily: "BasisGrotesquePro", }}>
                My Documents
              </h5>
              <small style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "15px" }}>
                Upload, organize, and manage your tax documents securely
              </small>
            </div>
            <button
              className="btn text-white fw-semibold px-3 d-flex align-items-center gap-2"
              onClick={() => setShowUploadModal(true)}
              style={{ backgroundColor: "#F56D2D" }}
            >
              <UpIcon />
              Upload Documents
            </button>

            <UploadModal show={showUploadModal} handleClose={() => setShowUploadModal(false)} />

          </div>


          <div
            className="d-inline-block mb-4"
            style={{
              padding: "6px 10px",
              border: "1px solid #E8F0FF",
              borderRadius: "12px",
              backgroundColor: "#FFFFFF",
              fontFamily: "BasisGrotesquePro",
            }}
          >
            <div className="d-flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: "8px 22px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "15px",
                    backgroundColor: activeTab === tab.key ? "#00C0C6" : "transparent",
                    color: activeTab === tab.key ? "#ffffff" : "#3B4A66",
                    fontFamily: "BasisGrotesquePro",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}



      {/* Conditional Content */}
      <div >
        {activeTab === 'requests' && <DocumentRequests />}
        {activeTab === 'my' && <MyDocumentsContent />}
        {activeTab === 'folders' && <Folders onFolderSelect={setIsFolderSelected} />}
        {activeTab === 'signature' && <ESignature />}
        {activeTab === 'archived' && <ArchivedDocuments />}
      </div>
    </div>
  );
}
