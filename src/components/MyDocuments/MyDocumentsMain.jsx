import React, { useState } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import DocumentRequests from './DocumentRequests';
import MyDocumentsContent from './MyDocumentsContent';
import Folders from './Folders';
import ESignature from './ESignature';

const tabs = [
  { name: 'Document Requests', key: 'requests' },
  { name: 'My Documents', key: 'my' },
  { name: 'Folders', key: 'folders' },
  { name: 'E-signature', key: 'signature' },
];

export default function MyDocumentsMain() {
  const [activeTab, setActiveTab] = useState('requests');

  return (
    <div className='px-2'>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-0" style={{ fontSize: '26px', fontWeight: '500', color: '#3B4A66',  fontFamily: "BasisGrotesquePro", }}>
            My Documents
          </h5>
          <small style={{ fontFamily: "BasisGrotesquePro",fontWeight:"400", fontWeight:"15px"}}>
            Upload, organize, and manage your tax documents securely
          </small>
        </div>
        <button
          className="btn text-white fw-semibold px-3"
          style={{ backgroundColor: '#F56D2D' }}
        >
          <FaCloudUploadAlt className="me-2" />
          Upload Documents
        </button>
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



      {/* Conditional Content */}
      <div >
        {activeTab === 'requests' && <DocumentRequests />}
        {activeTab === 'my' && <MyDocumentsContent />}
        {activeTab === 'folders' && <Folders />}
        {activeTab === 'signature' && <ESignature />}
      </div>
    </div>
  );
}
