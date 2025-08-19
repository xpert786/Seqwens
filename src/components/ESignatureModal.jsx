import React, { useState, useRef } from "react";
import "../styles/ESignatureModal.css";
import { InitialIcon, DateIcon, SignatureIcon, UsersIcon, DoubleUserIcon, Legal2Icon } from "../components/icons";

const ESignatureModal = ({ show, onClose, pages }) => {
  const [activeTab, setActiveTab] = useState("draw");
  const [step, setStep] = useState(1);
  const canvasRef = useRef(null);
  const [typedSignature, setTypedSignature] = useState("");
  const [uploadedSignature, setUploadedSignature] = useState(null);
  const [initials, setInitials] = useState("");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const today = new Date().toISOString().slice(0, 10);

  if (!show) return null;

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedSignature(URL.createObjectURL(file));
    }
  };

  return (
    <div className="esignature-overlay">
      <div className="esignature-modal">

        {/* Header */}
        <div className="esignature-header">
          <div>
            <h5 className="mb-0">E-Signature – Tax_Return_2023_DRAFT.Pdf</h5>
            <small className="text-muted">
              Review and electronically sign this document
            </small>
          </div>

        </div>

        {step === 1 && (
          <div className="selected-signer-header">
            <DoubleUserIcon />
            <span>Selected Current Signer</span>
          </div>
        )}

        {step === 1 && (
          <div className="signer-section">

            <div className={`signer-box ${step === 2 ? "complete" : "primary"}`}>
              <div className="taxpayer-container">
                <span className="icon-background">
                  <UsersIcon />
                </span>
                <div>
                  <div className="fw-bold">Primary Taxpayer</div>
                  <small>Signer: Michael Brown</small>
                </div>
              </div>

              <span className="badge">{step === 2 ? "Complete" : "Pending"}</span>
            </div>
            <div className="signer-box secondary">
              <div className="taxpayer-container">
                <span className="icon-background-gray">
                  <UsersIcon />
                </span>
                <div>
                  <div className="fw-bold">Spouse</div>
                  <small>Signer: Jennifer Brown</small>
                </div>
              </div>

              <span className="badge">Pending</span>
            </div>
          </div>
        )}
        <div className="top-headings">
          <div className="left-title">Document Preview</div>
          <div className="right-title">
            Completed Signature Fields
            <small className="text-muted subtitle ml-2">
              (Primary Taxpayer: Michael Brown)
            </small>
          </div>

        </div>

        {/* Main Wrapper */}
        <div className="esignature-wrapper">
          {/* Left Side - Pages */}
          <div className="left-section">
            <div className="thumbnail-list">
              {pages.map((page, index) => (
                <img
                  key={page.id}
                  src={page.image}
                  alt={`Page ${page.id}`}
                  className={`thumb ${currentPageIndex === index ? "active" : ""}`}
                  onClick={() => setCurrentPageIndex(index)}
                />
              ))}
            </div>

            {/* Large Preview */}
            <div className="preview-area">
              <div className="preview-scroll">
                {pages.map((page, index) => (
                  <div
                    key={page.id}
                    className={`preview-page ${currentPageIndex === index ? "active" : ""}`}
                    onClick={() => setCurrentPageIndex(index)}
                  >
                    <img
                      src={page.image}
                      alt={`Page ${index + 1}`}
                      className="preview-img"
                    />
                    <div className="page-count">
                      Page {index + 1} of {pages.length}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>


          <div className="right-section">

            {step === 1 ? (
              <div className="form-section">
                {/* Signature */}
                <div className="form-control">
                  <div className="top-headings">
                    <span className="icon-label"><SignatureIcon /></span>
                    <span className="left-title">Signature</span>
                    <span className="required">Signature Required</span>
                  </div>

                  {/* Tabs */}
                  <div className="nav-tabs">
                    {["draw", "type", "upload"].map((tab) => (
                      <button
                        key={tab}
                        className={activeTab === tab ? "active" : ""}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>


                  {/* Draw */}
                  {activeTab === "draw" && (
                    <>
                      <canvas
                        ref={canvasRef}
                        width={300}
                        height={120}
                        className="signature-canvas"
                      />
                      <div className="form-actions-inline">
                        <button onClick={clearCanvas} className="btn-outline-danger">
                          Clear
                        </button>
                        <button className="btn-orange">Apply Singnature</button>
                      </div>
                    </>
                  )}

                  {/* Type */}
                  {activeTab === "type" && (
                    <input
                      type="text"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      placeholder="Type your signature"
                      className="form-control"
                    />
                  )}

                  {/* Upload */}
                  {activeTab === "upload" && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        className="form-control"
                      />
                      {uploadedSignature && (
                        <img
                          src={uploadedSignature}
                          alt="Uploaded Signature"
                          className="uploaded-img"
                        />
                      )}
                    </>
                  )}
                </div>

                {/* Date */}
                <div className="form-control">
                  <div className="top-headings">
                    <span className="icon-label"><DateIcon /></span>
                    <span className="left-title">Date</span>
                    <span className="required">Signature Required</span>
                  </div>
                  <input
                    type="text"
                    placeholder="__/__/____"
                    value={today}
                    readOnly
                    className="form-control"
                  />
                </div>

                {/* Initial */}
                <div className="form-control">
                  <div className="top-headings">
                    <span className="icon-label"><InitialIcon /></span>
                    <span className="left-title">Initial</span>
                    <span className="required">Optional</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter Initials"
                    value={initials}
                    onChange={(e) => setInitials(e.target.value)}
                    className="form-control"
                  />
                </div>

              </div>

            ) : (
              <>


                <div className="completed-field">
                  <div className="icon-text">
                    <SignatureIcon />
                    <strong className="text-complete">Signature</strong>
                  </div>
                  <span className="status complete">Complete</span>
                </div>

                <div className="completed-field">
                  <div className="icon-text">
                    <DateIcon />
                    <strong className="text-complete">Date</strong>
                  </div>
                  <span className="status complete">Complete</span>
                </div>

                <div className="completed-field">
                  <div className="icon-text">
                    <InitialIcon />
                    <strong className="text-complete">Initial</strong>
                  </div>
                  <span className="status complete">Complete</span>
                </div>

                {/* Spouse */}
                <h6 className="mt-4 mb-3 completed-header">
                  Completed Signature Fields{" "}
                  <small className="text-muted subtitle">
                    (Spouse: Jennifer Brown)
                  </small>
                </h6>

                <div className="completed-field">
                  <div className="icon-text">
                    <SignatureIcon />
                    <strong className="text-complete">Signature</strong>
                  </div>
                  <span className="status complete">Complete</span>
                </div>

                <div className="completed-field">
                  <div className="icon-text">
                    <DateIcon />
                    <strong className="text-complete">Date</strong>
                  </div>
                  <span className="status complete">Complete</span>
                </div>
              </>

            )}
          </div>
        </div>
        {step === 2 && (
          <div className="legal-notice alert alert-success d-flex align-items-start mt-3">
            <span className="legal-icons me-2 mt-3">
              <Legal2Icon />
            </span>
            <div>
              <strong className="legal">Legal Notice</strong>
              <div className="legal-text">
                By proceeding to sign this document, you agree that your electronic signature will have the same legal effect
                as a handwritten signature. This document<br />will be legally binding once signed.
              </div>
            </div>
          </div>
        )}


        <div className="footer-buttons">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="sig-btn-cancel">
                Cancel
              </button>
              <button className="sig-btn-preview">Preview</button>
              <button className="sig-btn-complete" onClick={() => setStep(2)}>
                Complete Signature
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="sig-btn-cancel">
                Cancel
              </button>
              <button onClick={() => setStep(1)} className="sig-btn-cancel">
                Edit
              </button>
              <button className="sig-btn-complete" onClick={onClose}>
                Complete Signature
              </button>
            </>
          )}
        </div>



      </div>
    </div>

  );
};

export default ESignatureModal;