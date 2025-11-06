import React, { useState, useRef, useEffect } from "react";
import "../styles/ESignatureModal.css";
import { InitialIcon, DateIcon, SignatureIcon, UsersIcon, DoubleUserIcon, Legal2Icon } from "../components/icons";
import { signatureRequestsAPI, handleAPIError } from "../utils/apiUtils";
import { toast } from "react-toastify";

const ESignatureModal = ({ show, onClose, pages, requestId, signatureRequest, onSignatureComplete }) => {
  const [activeTab, setActiveTab] = useState("draw");
  const [activeSigner, setActiveSigner] = useState("primary"); // "primary" or "spouse"
  const [step, setStep] = useState(1);
  
  // Primary taxpayer signature state
  const canvasRef = useRef(null);
  const [typedSignature, setTypedSignature] = useState("");
  const [uploadedSignature, setUploadedSignature] = useState(null);
  const [uploadedSignatureFile, setUploadedSignatureFile] = useState(null);
  const [initials, setInitials] = useState("");
  const [signatureImage, setSignatureImage] = useState(null);
  const [primarySignatureComplete, setPrimarySignatureComplete] = useState(false);
  
  // Spouse signature state
  const spouseCanvasRef = useRef(null);
  const [spouseTypedSignature, setSpouseTypedSignature] = useState("");
  const [spouseUploadedSignature, setSpouseUploadedSignature] = useState(null);
  const [spouseUploadedSignatureFile, setSpouseUploadedSignatureFile] = useState(null);
  const [spouseInitials, setSpouseInitials] = useState("");
  const [spouseSignatureImage, setSpouseSignatureImage] = useState(null);
  const [spouseSignatureComplete, setSpouseSignatureComplete] = useState(false);
  const [isSpouseRequired, setIsSpouseRequired] = useState(false);
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSpouseDrawing, setIsSpouseDrawing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  // Check if spouse signature is required from signature request
  useEffect(() => {
    if (signatureRequest) {
      // Check if spouse signature is required - this could come from task_info or the request itself
      const requiresSpouse = signatureRequest.task_info?.spouse_signature_required || 
                           signatureRequest.spouse_sign_required || 
                           false;
      setIsSpouseRequired(requiresSpouse);
    }
  }, [signatureRequest]);

  // Initialize canvas when component mounts or tab changes to draw
  useEffect(() => {
    const canvas = activeSigner === "primary" ? canvasRef.current : spouseCanvasRef.current;
    if (show && canvas && activeTab === "draw") {
      const ctx = canvas.getContext("2d");
      
      // Set canvas background to grey
      ctx.fillStyle = "#F3F4F6";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set drawing properties
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [show, activeTab, activeSigner]);

  if (!show) return null;

  // Get mouse/touch coordinates relative to canvas
  const getCoordinates = (e, canvas = null) => {
    const targetCanvas = canvas || getCurrentCanvas();
    if (!targetCanvas) return { x: 0, y: 0 };
    
    const rect = targetCanvas.getBoundingClientRect();
    const scaleX = targetCanvas.width / rect.width;
    const scaleY = targetCanvas.height / rect.height;
    
    const clientX = e.clientX !== undefined ? e.clientX : e.touches[0].clientX;
    const clientY = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Get current canvas ref based on active signer
  const getCurrentCanvas = () => {
    return activeSigner === "primary" ? canvasRef.current : spouseCanvasRef.current;
  };

  // Drawing functions
  const startDrawing = (e) => {
    if (activeSigner === "primary") {
      setIsDrawing(true);
    } else {
      setIsSpouseDrawing(true);
    }
    const canvas = getCurrentCanvas();
    const coords = getCoordinates(e, canvas);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    const isCurrentlyDrawing = activeSigner === "primary" ? isDrawing : isSpouseDrawing;
    if (!isCurrentlyDrawing) return;
    
    const canvas = getCurrentCanvas();
    const coords = getCoordinates(e, canvas);
    const ctx = canvas.getContext("2d");
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (activeSigner === "primary") {
      setIsDrawing(false);
    } else {
      setIsSpouseDrawing(false);
    }
  };

  // Touch events for mobile
  const getTouchPos = (e) => {
    return getCoordinates(e);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    startDrawing(e);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    draw(e);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  const clearCanvas = () => {
    const canvas = getCurrentCanvas();
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#F3F4F6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (activeSigner === "primary") {
      setSignatureImage(null);
      setUploadedSignature(null);
    } else {
      setSpouseSignatureImage(null);
      setSpouseUploadedSignature(null);
    }
  };

  // Convert canvas to image blob
  const canvasToImage = (canvas = null) => {
    const targetCanvas = canvas || getCurrentCanvas();
    return new Promise((resolve) => {
      targetCanvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  };

  // Convert image file/blob to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Apply signature - save canvas as image
  const handleApplySignature = async () => {
    const canvas = getCurrentCanvas();
    if (!canvas) return;
    
    // Check if canvas has any drawing
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawing = imageData.data.some((channel, index) => {
      // Skip alpha channel (every 4th value) and check if pixel is not grey background
      if (index % 4 === 3) return false;
      return channel !== 243 && channel !== 244 && channel !== 246; // Not grey background
    });

    if (!hasDrawing) {
      toast.error('Please draw your signature first');
      return;
    }

    const blob = await canvasToImage(canvas);
    const file = new File([blob], `signature_${activeSigner}.png`, { type: 'image/png' });
    
    if (activeSigner === "primary") {
      setSignatureImage(file);
      const imageUrl = URL.createObjectURL(blob);
      setUploadedSignature(imageUrl);
      setPrimarySignatureComplete(true);
    } else {
      setSpouseSignatureImage(file);
      const imageUrl = URL.createObjectURL(blob);
      setSpouseUploadedSignature(imageUrl);
      setSpouseSignatureComplete(true);
    }
    
    toast.success('Signature applied successfully!');
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (activeSigner === "primary") {
        setUploadedSignature(URL.createObjectURL(file));
        setUploadedSignatureFile(file);
        setSignatureImage(file);
        setPrimarySignatureComplete(true);
      } else {
        setSpouseUploadedSignature(URL.createObjectURL(file));
        setSpouseUploadedSignatureFile(file);
        setSpouseSignatureImage(file);
        setSpouseSignatureComplete(true);
      }
    }
  };

  // Handle complete signature - prepare data for API
  const handleCompleteSignature = async () => {
    if (step === 1) {
      // Validate primary signature
      if (activeSigner === "primary") {
        if (activeTab === "draw" && !signatureImage) {
          toast.error('Please draw and apply your signature first');
          return;
        }
        if (activeTab === "type" && !typedSignature.trim()) {
          toast.error('Please type your signature first');
          return;
        }
        if (activeTab === "upload" && !uploadedSignatureFile) {
          toast.error('Please upload your signature first');
          return;
        }
        
        setPrimarySignatureComplete(true);
        
        // If spouse signature is required, switch to spouse
        if (isSpouseRequired && !spouseSignatureComplete) {
          setActiveSigner("spouse");
          toast.info('Please complete spouse signature');
          return;
        }
      } else {
        // Validate spouse signature
        if (activeTab === "draw" && !spouseSignatureImage) {
          toast.error('Please draw and apply spouse signature first');
          return;
        }
        if (activeTab === "type" && !spouseTypedSignature.trim()) {
          toast.error('Please type spouse signature first');
          return;
        }
        if (activeTab === "upload" && !spouseUploadedSignatureFile) {
          toast.error('Please upload spouse signature first');
          return;
        }
        
        setSpouseSignatureComplete(true);
      }
      
      // If both signatures are complete (or spouse not required), move to step 2
      if (primarySignatureComplete && (!isSpouseRequired || spouseSignatureComplete)) {
        setStep(2);
      } else if (activeSigner === "primary" && isSpouseRequired) {
        // Stay on step 1 but switch to spouse
        return;
      } else {
        setStep(2);
      }
    } else {
      // Step 2 - Final submission
      await submitSignature();
    }
  };

  // Submit signature to API
  const submitSignature = async () => {
    if (!requestId) {
      toast.error('Signature request ID is missing');
      return;
    }

    try {
      setSubmitting(true);

      // Get primary signature image as base64
      let primarySignatureBase64 = null;
      if (signatureImage) {
        primarySignatureBase64 = await fileToBase64(signatureImage);
      } else if (uploadedSignatureFile) {
        primarySignatureBase64 = await fileToBase64(uploadedSignatureFile);
      } else if (typedSignature.trim()) {
        // For typed signatures, you might want to create an image from text
        // For now, we'll skip if no image is available
        toast.error('Please provide a signature image');
        setSubmitting(false);
        return;
      }

      if (!primarySignatureBase64) {
        toast.error('Please provide a signature');
        setSubmitting(false);
        return;
      }

      // Get spouse signature image as base64 if required and provided
      let spouseSignatureBase64 = null;
      if (isSpouseRequired) {
        if (spouseSignatureImage) {
          spouseSignatureBase64 = await fileToBase64(spouseSignatureImage);
        } else if (spouseUploadedSignatureFile) {
          spouseSignatureBase64 = await fileToBase64(spouseUploadedSignatureFile);
        } else if (spouseTypedSignature.trim()) {
          // For typed signatures, create an image from text if needed
          toast.error('Please provide a spouse signature image');
          setSubmitting(false);
          return;
        }

        if (!spouseSignatureBase64) {
          toast.error('Spouse signature is required for this document');
          setSubmitting(false);
          return;
        }
      }

      // Prepare API request data
      const signatureData = {
        signature_request_id: requestId,
        signature_image: primarySignatureBase64
      };

      if (spouseSignatureBase64) {
        signatureData.spouse_signature_image = spouseSignatureBase64;
      }

      // Call API
      const response = await signatureRequestsAPI.submitSignatureRequest(signatureData);

      if (response.success) {
        toast.success('Signature submitted successfully!');
        
        // Call the callback if provided
        if (onSignatureComplete) {
          onSignatureComplete({
            success: true,
            data: response.data
          });
        }

        onClose();
      } else {
        throw new Error(response.message || 'Failed to submit signature');
      }
    } catch (error) {
      console.error('Error submitting signature:', error);
      const errorMessage = handleAPIError(error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (errors.spouse_signature_image) {
          toast.error(errors.spouse_signature_image[0] || 'Spouse signature is required');
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
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
              ({activeSigner === "primary" ? "Primary Taxpayer" : "Spouse"}: {activeSigner === "primary" ? (signatureRequest?.client_name || "Michael Brown") : (signatureRequest?.spouse_name || "Spouse")})
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
                      <div style={{ 
                        position: 'relative', 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '8px',
                        backgroundColor: '#F3F4F6',
                        padding: '8px'
                      }}>
                        <canvas
                          ref={activeSigner === "primary" ? canvasRef : spouseCanvasRef}
                          width={300}
                          height={120}
                          className="signature-canvas"
                          style={{
                            display: 'block',
                            cursor: 'crosshair',
                            backgroundColor: '#F3F4F6',
                            borderRadius: '4px',
                            width: '100%',
                            height: '120px'
                          }}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                        />
                        <small style={{ 
                          display: 'block', 
                          textAlign: 'center', 
                          color: '#6B7280', 
                          marginTop: '4px',
                          fontSize: '11px'
                        }}>
                          Draw your signature in the grey area above
                        </small>
                      </div>
                      {(activeSigner === "primary" ? signatureImage : spouseSignatureImage) && (
                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#F9FAFB', borderRadius: '4px' }}>
                          <small style={{ color: '#10B981', fontWeight: '500' }}>✓ Signature applied</small>
                        </div>
                      )}
                      <div className="form-actions-inline">
                        <button onClick={clearCanvas} className="btn-outline-danger">
                          Clear
                        </button>
                        <button onClick={handleApplySignature} className="btn-orange">
                          Apply Signature
                        </button>
                      </div>
                    </>
                  )}

                  {/* Type */}
                  {activeTab === "type" && (
                    <input
                      type="text"
                      value={activeSigner === "primary" ? typedSignature : spouseTypedSignature}
                      onChange={(e) => {
                        if (activeSigner === "primary") {
                          setTypedSignature(e.target.value);
                        } else {
                          setSpouseTypedSignature(e.target.value);
                        }
                      }}
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
                      {(activeSigner === "primary" ? uploadedSignature : spouseUploadedSignature) && (
                        <img
                          src={activeSigner === "primary" ? uploadedSignature : spouseUploadedSignature}
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
                    value={activeSigner === "primary" ? initials : spouseInitials}
                    onChange={(e) => {
                      if (activeSigner === "primary") {
                        setInitials(e.target.value);
                      } else {
                        setSpouseInitials(e.target.value);
                      }
                    }}
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

                {/* Spouse - Only show if required */}
                {isSpouseRequired && (
                  <>
                    <h6 className="mt-4 mb-3 completed-header">
                      Completed Signature Fields{" "}
                      <small className="text-muted subtitle">
                        (Spouse: {signatureRequest?.spouse_name || "Spouse"})
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
              <button className="sig-btn-complete" onClick={handleCompleteSignature}>
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
              <button 
                className="sig-btn-complete" 
                onClick={handleCompleteSignature}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Signature'}
              </button>
            </>
          )}
        </div>



      </div>
    </div>

  );
};

export default ESignatureModal;