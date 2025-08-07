import React, { useState, useRef } from 'react';
import { FaFileAlt, FaEye, FaPen } from "react-icons/fa";
import "../../styles/Popup.css";
import ESignatureModal from "../../components/ESignatureModal";
import page1Image from "../../assets/page1.png";
import page2Image from "../../assets/page2.png";
import page3Image from "../../assets/page3.png";
import page4Image from "../../assets/page4.png";

import { FileIcon, ProfileIcon, LegalIcon, SignatureIcon, DateIcon, InitialIcon, CompletedIcon, AwaitingIcon, Sign2WhiteIcon } from "../icons";

export default function ESignature() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  // const [showSignModal, setShowSignModal] = useState(false);



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
              className="bg-white rounded shadow-sm p-3 d-flex flex-column justify-content-between"
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
                    backgroundColor: "#f1f1f1",
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

      {/* E-Signature Requests Section */}
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
              <FileIcon size={24} style={{ marginTop: "30px" }} />

              <div>
                <div className="fw-semibold">{doc.fileName}</div>
                <div className="small text-muted">
                  Uploaded on {doc.uploadedDate} · Last modified by {doc.modifiedBy}
                </div>
                <span
                  className="mt-2 d-inline-block px-3 py-1 rounded-pill"
                  style={{
                    backgroundColor: "#E8F0FF",
                    color: "#3B4A66",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {doc.status}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="d-flex gap-2 mt-3 mt-md-0">
              <button
                className="btn d-flex align-items-center gap-2 rounded"
                style={{
                  backgroundColor: "#E8F0FF",
                  color: "#3B4A66",
                }}
              >
                <FaEye size={14} style={{ color: "#3B4A66" }} />
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
                    width: "32px",
                    height: "32px",
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

      {/* Signature Modal */}
      {showModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            zIndex: showSignModal ? 1040 : 1050,
            opacity: showSignModal ? 0 : 1,
            pointerEvents: showSignModal ? "none" : "auto",
            transition: "opacity 0.3s ease",
            padding: "16px",
          }}
        >
          <div
            className="bg-white p-3"
            style={{
              width: "100%",
              maxWidth: "700px",
              borderRadius: "16px",
            }}
          >
            {/* Header */}
            <div className="align-items-center mb-3 ">
              <h5
                className="mb-0 me-3"
                style={{
                  color: "#3B4A66",
                  fontSize: "23px",
                  fontWeight: "500",
                  fontFamily: "BasisGrotesquePro",
                }}
              >
                E-Signature
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
                Review and electronically sign this document
              </p>
            </div>


            {/* File Info */}
            <div className="p-2 rounded mb-3 d-flex align-items-start" style={{ backgroundColor: "#FFF4E6" }}>
              {/* File Icon */}
              <div className="me-2">
                <FileIcon />
              </div>

              {/* File Info */}
              <div>
                <div className="fw-semibold small">Tax_Return_2023_DRAFT.pdf</div>
                <div className="text-muted small">
                  Type: Tax Return · Size: 2.1MB · Version: v3 · Prepared by Sarah Johnson
                </div>
                <span
                  className="d-inline-block px-2 py-1 rounded-pill mt-2"
                  style={{
                    backgroundColor: "#E8F0FF",
                    color: "#3B4A66",
                    fontSize: "11px",
                    fontWeight: "500",
                  }}
                >
                  Signature Required
                </span>
              </div>
            </div>

            {/* Signer Info */}
            <div className="d-flex gap-2 mb-3 flex-wrap">
              {[
                { title: "Primary Taxpayer", signer: "Michael Brown" },
                { title: "Spouse", signer: "Jennifer Brown" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded"
                  style={{
                    backgroundColor: "#F6F9FF",
                    flex: "1 1 45%",
                    minWidth: "180px",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "#E8F0FF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ProfileIcon size={16} color="#3B4A66" />
                      </div>
                      <div>
                        <div className="fw-semibold small" style={{ color: "#3B4A66" }}>
                          {item.title}
                        </div>
                        <div className="text-muted small">Signer: {item.signer}</div>
                      </div>
                    </div>

                    <span
                      className="px-2 py-1 rounded-pill"
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#3B4A66",
                        fontSize: "11px",
                        fontWeight: "500",
                        border: "1px solid #E0E7F1",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Signature Required
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Signature Requirements */}
            <h6 className="text-muted fw-semibold mb-2 small">Signature Requirements</h6>
            <div className="d-flex flex-column gap-2 mb-3">
              {[
                { label: "Signature", icon: <SignatureIcon />, who: "Taxpayer", req: "Required" },
                { label: "Date", icon: <DateIcon />, who: "Taxpayer", req: "Required" },
                { label: "Signature", icon: <SignatureIcon />, who: "Spouse", req: "Required" },
                { label: "Date", icon: <DateIcon />, who: "Spouse", req: "Required" },
                { label: "Initial", icon: <InitialIcon />, who: "Taxpayer", req: "Optional" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="d-flex justify-content-between align-items-center px-2 py-2 rounded"
                  style={{
                    backgroundColor: "#ffffff",
                    boxShadow: "0 0 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <span className="d-flex align-items-center gap-2 small">
                    <span style={{ fontSize: "16px" }}>{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="d-flex gap-1 small">
                    <span className="px-2 py-1 rounded-pill" style={{
                      backgroundColor: "#E8F0FF",
                      fontSize: "11px",
                      color: "#3B4A66",
                    }}>{item.who}</span>
                    <span className="px-2 py-1 rounded-pill" style={{
                      backgroundColor: "#E8F0FF",
                      fontSize: "11px",
                      color: "#3B4A66",
                    }}>{item.req}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Legal Notice */}
            <div
              className="d-flex align-items-start gap-2 p-2 rounded mb-3"
              style={{
                backgroundColor: "#FFF4E6",
                fontSize: "12px",
                borderRadius: "10px",
                lineHeight: "1.4",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "#FFE8D0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "6px",
                }}
              >
                <LegalIcon size={14} color="#F56D2D" />
              </div>

              <div>
                <div className="fw-semibold mb-1" style={{ color: "#9A3412", fontSize: "13px" }}>
                  Legal Notice:
                </div>
                <div className="text-muted">
                  By proceeding to sign, you agree that your electronic signature has the same legal effect as a handwritten one.
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-sm border text-dark"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm text-white d-flex align-items-center gap-2"
                style={{ backgroundColor: "#F56D2D", padding: "6px 16px" }}
                onClick={() => setShowSignModal(true)}
              >
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



    </div>


  );
}


