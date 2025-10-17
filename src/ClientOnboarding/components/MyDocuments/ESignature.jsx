import React, { useState, useRef } from 'react';
import { FaEye, } from "react-icons/fa";
import "../../styles/Popup.css";
import "../../styles/Esignpop.css"
import ESignatureModal from "../../components/ESignatureModal";
import page1Image from "../../../assets/page1.png";
import page2Image from "../../../assets/page2.png";
import page3Image from "../../../assets/page3.png";
import page4Image from "../../../assets/page4.png";

import { FileIcon, ProfileIcon, LegalIcon, SignatureIcon, DateIcon, InitialIcon, CompletedIcon, AwaitingIcon, Sign2WhiteIcon } from "../icons";

export default function ESignature() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [commentText, setCommentText] = useState("");

  const [previewPages] = useState([
    { id: 1, image: page1Image },
    { id: 2, image: page2Image },
    { id: 3, image: page3Image },
    { id: 4, image: page4Image },
  ]);

  const highlights = [
    {
      page: 0,
      top: "20%",
      left: "35%",
      width: "120px",
      height: "20px",
      text: "Movement Feedback"
    }
  ];

  const handleHighlightClick = (highlight) => {
    const newMarker = {
      id: Date.now(),
      page: highlight.page,
      top: highlight.top,
      left: `calc(${highlight.left} + ${highlight.width} + 5px)`,
      comment: ""
    };
    setMarkers((prev) => [...prev, newMarker]);
  };


  const handleSaveComment = () => {
    if (selectedMarker !== null) {
      setMarkers((prev) =>
        prev.map((m) =>
          m.id === selectedMarker ? { ...m, comment: commentText } : m
        )
      );
      setCommentText("");
      setSelectedMarker(null);
    }
  };


  const signatureData = [
    {
      fileName: "Tax_Return_2023_Draft.pdf",
      uploadedDate: "Mar 13, 2025",
      modifiedBy: "Sarah Johnson",
      status: "Signature Required",
    },
  ];

  const cardData = [
    { label: "Pending Signature", icon: <SignatureIcon />, count: 1, color: "#00bcd4" },
    { label: "Completed", icon: <CompletedIcon />, count: 5, color: "#4caf50" },
    { label: "Awaiting others", icon: <AwaitingIcon />, count: 1, color: "#3f51b5" },
  ];

  return (
    <div style={{ backgroundColor: "#F5F9FF", minHeight: "100vh" }}>
      {/* Cards Row */}
      <div className="row g-3 mb-3">
        {cardData.map((item, index) => (
          <div className="col-md-4" key={index}>
            <div
              className="bg-white rounded p-3 d-flex flex-column justify-content-between"
              style={{ borderRadius: "12px", height: "130px" }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "32px",
                    height: "32px",
                    color: item.color,
                    fontSize: "16px",
                  }}
                >
                  {item.icon}
                </div>
                <div
                  className="px-3 py-1 rounded text-dark fw-bold"
                  style={{

                    minWidth: "38px",
                    textAlign: "center",
                  }}
                >
                  {item.count}
                </div>
              </div>
              <div className="mt-2">
                <p className="mb-0 text-muted small fw-semibold">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded">
        <div className="align-items-center mb-3 ">
          <h5
            className="mb-0 me-3"
            style={{
              color: "#3B4A66",
              fontSize: "20px",
              fontWeight: "500",
              fontFamily: "BasisGrotesquePro",
            }}
          >
            E-Signature Requests
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
            Documents requiring your electronic signature
          </p>
        </div>



        {signatureData.map((doc, index) => (
          <div
            key={index}
            onClick={() => setSelectedIndex(index)}
            className="p-3 rounded  d-flex justify-content-between align-items-center flex-wrap mb-3 cursor-pointer"
            style={{
              backgroundColor: selectedIndex === index ? "#FFF4E6" : "#fff",
              border: selectedIndex === index ? "1px solid #F49C2D" : "1px solid #eee",
              transition: "background-color 0.2s ease, border-color 0.2s ease",
            }}
          >

            <div className="d-flex align-items-start gap-3 flex-grow-1">
              <span className="mydocs-icon">
                <FileIcon />
              </span>

              <div>
                <div className="fw-semibold">{doc.fileName}</div>
                <div className="small text-muted">
                  Uploaded on {doc.uploadedDate} · Last modified by {doc.modifiedBy}
                </div>
                <span
                  className="mt-2 d-inline-block px-3 py-1 rounded-pill"
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: "#3B4A66",
                    fontSize: "12px",
                    fontWeight: "500",
                    border: "1px solid #E8F0FF"
                  }}
                >
                  {doc.status}
                </span>
              </div>
            </div>

            <div className="d-flex gap-4 mt-3 mt-md-0">

              <button
                className="btn d-flex align-items-center gap-2 rounded btn-preview-trigger"
                onClick={() => setShowPreviewModal(true)}
              >
                <FaEye size={14} className="icon-eye" />
                Preview
              </button>



              <button
                className="btn d-flex align-items-center gap-2 rounded text-white"
                style={{ backgroundColor: "#F56D2D" }}
                onClick={() => setShowModal(true)}
              >
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    color: "#FFFFFF",
                  }}
                >
                  <Sign2WhiteIcon size={14} />
                </div>
                Sign Document
              </button>
            </div>
          </div>
        ))}
      </div>






      {showModal && (
        <div className={`esign-overlay ${showSignModal ? "esign-overlay-hidden" : ""}`}>
          <div className="esign-modal-box">
            {/* Header */}
            <div className="esign-header">
              <h5 className="esign-title">E-Signature</h5>
              <p className="esign-subtitle">Review and electronically sign this document</p>
            </div>

            {/* File Info */}
            <div className="esign-fileinfo">
              <div className="esign-file-icon">
                <span className='files'>  <FileIcon /></span>
              </div>
              <div>
                <div className="esign-file-name">Tax_Return_2023_DRAFT.pdf</div>
                <div className="esign-file-details">
                  Type: Tax Return · Size: 2.1MB · Version: v3 · Prepared by Sarah Johnson
                </div>
                <span className="esign-file-badge">Signature Required</span>
              </div>
            </div>

            {/* Signer Info */}
            <div className="esign-signers">
              {[
                { title: "Primary Taxpayer", signer: "Michael Brown" },
                { title: "Spouse", signer: "Jennifer Brown" },
              ].map((item, idx) => (
                <div key={idx} className="esign-signer-card">
                  <div className="esign-signer-top">
                    <div className="esign-signer-left">
                      <div className="esign-signer-icon">
                        <ProfileIcon size={16} color="#3B4A66" />
                      </div>
                      <div>
                        <div className="esign-signer-title">{item.title}</div>
                        <div className="esign-signer-subtitle">Signer: {item.signer}</div>
                      </div>
                    </div>
                    <span className="esign-signer-badge">Signature Required</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Signature Requirements */}
            <h6 className="esign-requirements-title">Signature Requirements</h6>
            <div className="esign-requirements-list">
              {[
                { label: "Signature", icon: <SignatureIcon />, who: "Taxpayer", req: "Required" },
                { label: "Date", icon: <DateIcon />, who: "Taxpayer", req: "Required" },
                { label: "Signature", icon: <SignatureIcon />, who: "Spouse", req: "Required" },
                { label: "Date", icon: <DateIcon />, who: "Spouse", req: "Required" },
                { label: "Initial", icon: <InitialIcon />, who: "Taxpayer", req: "Optional" },
              ].map((item, idx) => (
                <div key={idx} className="esign-requirement-item">
                  <span className="esign-requirement-left">
                    <span className="esign-requirement-icon">{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="esign-requirement-tags">
                    <span className="esign-tag">{item.who}</span>
                    <span className="esign-tag">{item.req}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Legal Notice */}
            <div className="esign-legal-notice">
              <div className="esign-legal-icon">
                <LegalIcon size={14} color="#F56D2D" />
              </div>
              <div>
                <div className="esign-legal-title">Legal Notice:</div>
                <div className="esign-legal-text">
                  By proceeding to sign, you agree that your electronic signature has the same legal effect as a handwritten one.
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="esign-footer">
              <button className="esign-btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="esign-btn-proceed" onClick={() => setShowSignModal(true)}>
                <Sign2WhiteIcon />
                Proceed signature
              </button>
            </div>
          </div>
        </div>
      )}


      {showSignModal && (
        <ESignatureModal
          show={showSignModal}
          onClose={() => setShowSignModal(false)}
          pages={[
            { id: 1, title: "Page 1", image: page1Image },
            { id: 2, title: "Page 2", image: page2Image },
            { id: 3, title: "Page 3", image: page3Image },
            { id: 4, title: "Page 4", image: page4Image },
          ]}
        />
      )}

      {showPreviewModal && (
        <div className="esign-preview-overlay">
          <div className="esign-preview-modal">
            <div className="esign-preview-header">
              E-Signature – Tax_Return_2023_DRAFT.pdf
            </div>
            <h6 className='pre'>Documents preview</h6>

            <div className="esign-preview-body">
              <div className="esign-preview-sidebar">
                {previewPages.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`esign-preview-thumb ${activePage === idx ? "active" : ""}`}
                    onClick={() => setActivePage(idx)}
                  >
                    <img src={p.image} alt={`Page ${p.id}`} />
                  </div>
                ))}
              </div>

              <div className="esign-preview-main">
                <img
                  className="esign-preview-page"
                  src={previewPages[activePage].image}
                  alt={`Page ${previewPages[activePage].id}`}
                />

                {highlights
                  .filter((h) => h.page === activePage)
                  .map((h, i) => (
                    <div
                      key={i}
                      className="highlight-overlay"
                      style={{
                        top: h.top,
                        left: h.left,
                        width: h.width,
                        height: h.height
                      }}
                      onClick={() => handleHighlightClick(h)}
                    ></div>
                  ))}

                {markers
                  .filter((m) => m.page === activePage)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="teal-marker"
                      style={{
                        top: m.top,
                        left: `calc(${m.left} + ${m.width} + 5px)`
                      }}
                      onClick={() => setSelectedMarker(m.id)}
                    ></div>
                  ))}
              </div>

              {selectedMarker !== null && (
                <div className="comment-panel-outside">
                  <textarea
                    placeholder="Type your comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  ></textarea>
                  <div className="comment-buttons">
                    <button onClick={() => setSelectedMarker(null)}>Cancel</button>
                    <button>Comment</button>
                  </div>
                </div>
              )}
            </div>

            <div className="esign-preview-footer">
              <button className="btn-cancel" onClick={() => setShowPreviewModal(false)}>Cancel</button>
              <button className="btn-preview">Preview</button>
              <button className="btn-complete">Complete Signature</button>
            </div>
          </div>
        </div>
      )}




    </div>


  );
}


