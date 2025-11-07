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
      // Prioritize spouse_sign field - if it's explicitly false, don't show spouse option
      // If it's explicitly true, show spouse option
      // Otherwise, check other fields
      let requiresSpouse = false;
      
      if (signatureRequest.spouse_sign === false) {
        // Explicitly false - don't show spouse option
        requiresSpouse = false;
      } else if (signatureRequest.spouse_sign === true) {
        // Explicitly true - show spouse option
        requiresSpouse = true;
      } else {
        // Check other fields if spouse_sign is not explicitly set
        requiresSpouse = signatureRequest.task_info?.spouse_sign === true ||
                         signatureRequest.spouse_signature_required === true || 
                         signatureRequest.spouse_sign_required === true ||
                         signatureRequest.task_info?.spouse_signature_required === true ||
                         false;
      }
      
      console.log('Checking spouse requirement:', {
        signatureRequest,
        task_info: signatureRequest.task_info,
        requiresSpouse,
        spouse_sign: signatureRequest.spouse_sign,
        spouse_signature_required: signatureRequest.spouse_signature_required,
        task_info_spouse_sign: signatureRequest.task_info?.spouse_sign,
        task_info_spouse_signature_required: signatureRequest.task_info?.spouse_signature_required
      });
      
      setIsSpouseRequired(requiresSpouse);
      
      // If spouse is not required and activeSigner is spouse, switch back to primary
      if (!requiresSpouse) {
        setActiveSigner((prev) => prev === "spouse" ? "primary" : prev);
      }
    } else {
      // If no signature request, default to false
      setIsSpouseRequired(false);
      // If no signature request and activeSigner is spouse, switch back to primary
      setActiveSigner((prev) => prev === "spouse" ? "primary" : prev);
    }
  }, [signatureRequest]);

  // Initialize canvas when component mounts or tab changes to draw or signer changes
  useEffect(() => {
    // Small delay to ensure canvas is rendered
    const timer = setTimeout(() => {
      if (show && activeTab === "draw") {
        // Initialize primary canvas
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (!signatureImage) {
            // Set canvas background to grey
            ctx.fillStyle = "#F3F4F6";
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
          // Set drawing properties
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
        }
        
        // Initialize spouse canvas only if spouse is required
        if (isSpouseRequired && spouseCanvasRef.current) {
          const ctx = spouseCanvasRef.current.getContext("2d");
          if (!spouseSignatureImage) {
            // Set canvas background to grey
            ctx.fillStyle = "#F3F4F6";
            ctx.fillRect(0, 0, spouseCanvasRef.current.width, spouseCanvasRef.current.height);
          }
          // Set drawing properties
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [show, activeTab, activeSigner, signatureImage, spouseSignatureImage, isSpouseRequired]);

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
    if (activeSigner === "primary") {
      return canvasRef.current;
    } else if (isSpouseRequired) {
      return spouseCanvasRef.current;
    }
    return canvasRef.current; // Fallback to primary if spouse not required
  };

  // Drawing functions
  const startDrawing = (e) => {
    if (activeSigner === "primary") {
      setIsDrawing(true);
    } else if (isSpouseRequired) {
      setIsSpouseDrawing(true);
    } else {
      return; // Don't allow drawing if spouse not required
    }
    const canvas = getCurrentCanvas();
    if (!canvas) return;
    const coords = getCoordinates(e, canvas);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    const isCurrentlyDrawing = activeSigner === "primary" ? isDrawing : (isSpouseRequired ? isSpouseDrawing : false);
    if (!isCurrentlyDrawing) return;
    
    const canvas = getCurrentCanvas();
    if (!canvas) return;
    const coords = getCoordinates(e, canvas);
    const ctx = canvas.getContext("2d");
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (activeSigner === "primary") {
      setIsDrawing(false);
    } else if (isSpouseRequired) {
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
    } else if (isSpouseRequired) {
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
    } else if (isSpouseRequired) {
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
      } else if (isSpouseRequired) {
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
      } else if (isSpouseRequired) {
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

      // Prepare primary signature data
      let primarySignatureData = null;
      let primaryTypedText = null;
      
      // Check for typed text first (takes precedence)
      if (typedSignature.trim()) {
        primaryTypedText = typedSignature.trim();
      } else {
        // If no typed text, get signature image (from draw or upload)
        if (signatureImage) {
          // Canvas image (from draw)
          primarySignatureData = await fileToBase64(signatureImage);
        } else if (uploadedSignatureFile) {
          // Uploaded file
          primarySignatureData = await fileToBase64(uploadedSignatureFile);
        }
      }

      if (!primaryTypedText && !primarySignatureData) {
        toast.error('Please provide a signature');
        setSubmitting(false);
        return;
      }

      // Prepare spouse signature data if required
      let spouseSignatureData = null;
      let spouseTypedText = null;
      
      if (isSpouseRequired) {
        // Check for typed text first (takes precedence)
        if (spouseTypedSignature.trim()) {
          spouseTypedText = spouseTypedSignature.trim();
        } else {
          // If no typed text, get signature image (from draw or upload)
          if (spouseSignatureImage) {
            // Canvas image (from draw)
            spouseSignatureData = await fileToBase64(spouseSignatureImage);
          } else if (spouseUploadedSignatureFile) {
            // Uploaded file
            spouseSignatureData = await fileToBase64(spouseUploadedSignatureFile);
          }
        }

        if (!spouseTypedText && !spouseSignatureData) {
          toast.error('Spouse signature is required for this document');
          setSubmitting(false);
          return;
        }
      }

      // Prepare API request data
      const signatureData = {
        signature_request_id: requestId
      };

      // Add primary signature - typed_text takes precedence over signature_image
      if (primaryTypedText) {
        signatureData.typed_text = primaryTypedText;
      } else if (primarySignatureData) {
        signatureData.signature_image = primarySignatureData;
      }

      // Add spouse signature - typed_text takes precedence over signature_image
      if (isSpouseRequired) {
        if (spouseTypedText) {
          signatureData.spouse_typed_text = spouseTypedText;
        } else if (spouseSignatureData) {
          signatureData.spouse_signature_image = spouseSignatureData;
        }
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
          // If spouse signature is required but not detected, set it now
          if (!isSpouseRequired) {
            setIsSpouseRequired(true);
          }
          // Switch to spouse signer if spouse signature is required
          setActiveSigner("spouse");
          setStep(1); // Go back to step 1 to complete spouse signature
          // Initialize spouse canvas if on draw tab
          if (activeTab === "draw" && spouseCanvasRef.current && !spouseSignatureImage) {
            setTimeout(() => {
              const ctx = spouseCanvasRef.current.getContext("2d");
              ctx.fillStyle = "#F3F4F6";
              ctx.fillRect(0, 0, spouseCanvasRef.current.width, spouseCanvasRef.current.height);
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 2;
              ctx.lineCap = "round";
              ctx.lineJoin = "round";
            }, 100);
          }
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
            <div 
              className={`signer-box ${activeSigner === "primary" ? "primary active" : ""} ${primarySignatureComplete ? "complete" : ""}`}
              onClick={() => {
                setActiveSigner("primary");
                // Initialize canvas for primary if on draw tab
                if (activeTab === "draw") {
                  setTimeout(() => {
                    if (canvasRef.current && !signatureImage) {
                      const ctx = canvasRef.current.getContext("2d");
                      ctx.fillStyle = "#F3F4F6";
                      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                      ctx.strokeStyle = "#000000";
                      ctx.lineWidth = 2;
                      ctx.lineCap = "round";
                      ctx.lineJoin = "round";
                    }
                  }, 50);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="taxpayer-container">
                <span className={activeSigner === "primary" ? "icon-background" : "icon-background-gray"}>
                  <UsersIcon />
                </span>
                <div>
                  <div className="fw-bold">Primary Taxpayer</div>
                  <small>Signer: {signatureRequest?.client_name || "Michael Brown"}</small>
                </div>
              </div>

              <span className="badge">
                {primarySignatureComplete ? "Complete" : activeSigner === "primary" ? "Active" : "Pending"}
              </span>
            </div>
            {/* Only show spouse box if spouse_sign is true */}
            {isSpouseRequired && (
              <div 
                className={`signer-box ${activeSigner === "spouse" ? "primary active" : "secondary"} ${spouseSignatureComplete ? "complete" : ""}`}
                onClick={() => {
                  setActiveSigner("spouse");
                  // Ensure we're on the draw tab to show the canvas
                  if (activeTab !== "draw") {
                    setActiveTab("draw");
                  }
                  // Initialize canvas for spouse if on draw tab
                  setTimeout(() => {
                    if (spouseCanvasRef.current && !spouseSignatureImage) {
                      const ctx = spouseCanvasRef.current.getContext("2d");
                      ctx.fillStyle = "#F3F4F6";
                      ctx.fillRect(0, 0, spouseCanvasRef.current.width, spouseCanvasRef.current.height);
                      ctx.strokeStyle = "#000000";
                      ctx.lineWidth = 2;
                      ctx.lineCap = "round";
                      ctx.lineJoin = "round";
                    }
                  }, 100);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="taxpayer-container">
                  <span className={activeSigner === "spouse" ? "icon-background" : "icon-background-gray"}>
                    <UsersIcon />
                  </span>
                  <div>
                    <div className="fw-bold">Spouse</div>
                    <small>Signer: {signatureRequest?.spouse_name || signatureRequest?.task_info?.spouse_name || "Jennifer Brown"}</small>
                  </div>
                </div>

                <span className="badge">
                  {spouseSignatureComplete ? "Complete" : activeSigner === "spouse" ? "Active" : "Pending"}
                </span>
              </div>
            )}
          </div>
        )}
        <div className="top-headings">
          <div className="left-title">Document Preview</div>
          <div className="right-title">
            Completed Signature Fields
            <small className="text-muted subtitle ml-2">
              ({activeSigner === "primary" ? "Primary Taxpayer" : (isSpouseRequired ? "Spouse" : "Primary Taxpayer")}: {activeSigner === "primary" ? (signatureRequest?.client_name || "Michael Brown") : (isSpouseRequired ? (signatureRequest?.spouse_name || "Spouse") : (signatureRequest?.client_name || "Michael Brown"))})
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
                      {/* Primary Taxpayer Canvas */}
                      <div style={{ 
                        position: 'relative', 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '8px',
                        backgroundColor: '#F3F4F6',
                        padding: '8px',
                        display: activeSigner === "primary" ? 'block' : 'none'
                      }}>
                        <canvas
                          ref={canvasRef}
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
                      {/* Spouse Canvas - Only show if spouse_sign is true */}
                      {isSpouseRequired && (
                        <div style={{ 
                          position: 'relative', 
                          border: '1px solid #E5E7EB', 
                          borderRadius: '8px',
                          backgroundColor: '#F3F4F6',
                          padding: '8px',
                          display: activeSigner === "spouse" ? 'block' : 'none'
                        }}>
                          <canvas
                            ref={spouseCanvasRef}
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
                      )}
                      {((activeSigner === "primary" && signatureImage) || (activeSigner === "spouse" && isSpouseRequired && spouseSignatureImage)) && (
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
                    <>
                      <input
                        type="text"
                        value={activeSigner === "primary" ? typedSignature : spouseTypedSignature}
                        onChange={(e) => {
                          if (activeSigner === "primary") {
                            setTypedSignature(e.target.value);
                            // Mark as complete when text is entered
                            if (e.target.value.trim()) {
                              setPrimarySignatureComplete(true);
                            } else {
                              setPrimarySignatureComplete(false);
                            }
                          } else if (isSpouseRequired) {
                            setSpouseTypedSignature(e.target.value);
                            // Mark as complete when text is entered
                            if (e.target.value.trim()) {
                              setSpouseSignatureComplete(true);
                            } else {
                              setSpouseSignatureComplete(false);
                            }
                          }
                        }}
                        placeholder="Type your signature"
                        className="form-control"
                        disabled={activeSigner === "spouse" && !isSpouseRequired}
                      />
                      {(activeSigner === "primary" ? typedSignature : (isSpouseRequired ? spouseTypedSignature : "")).trim() && (
                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#F9FAFB', borderRadius: '4px' }}>
                          <small style={{ color: '#10B981', fontWeight: '500' }}>✓ Signature ready</small>
                        </div>
                      )}
                    </>
                  )}

                  {/* Upload */}
                  {activeTab === "upload" && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        className="form-control"
                        disabled={activeSigner === "spouse" && !isSpouseRequired}
                      />
                      {(activeSigner === "primary" ? uploadedSignature : (isSpouseRequired ? spouseUploadedSignature : null)) && (
                        <>
                          <img
                            src={activeSigner === "primary" ? uploadedSignature : spouseUploadedSignature}
                            alt="Uploaded Signature"
                            className="uploaded-img"
                            style={{ marginTop: '8px', maxWidth: '100%', borderRadius: '4px' }}
                          />
                          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#F9FAFB', borderRadius: '4px' }}>
                            <small style={{ color: '#10B981', fontWeight: '500' }}>✓ Signature uploaded and ready</small>
                          </div>
                        </>
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
                      } else if (isSpouseRequired) {
                        setSpouseInitials(e.target.value);
                      }
                    }}
                    className="form-control"
                    disabled={activeSigner === "spouse" && !isSpouseRequired}
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