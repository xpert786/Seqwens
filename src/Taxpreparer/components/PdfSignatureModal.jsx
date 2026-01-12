import React, { useState, useRef, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'react-toastify';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { customESignAPI, handleAPIError } from '../../ClientOnboarding/utils/apiUtils';
import '../styles/pdf-signature-modal.css';

// Configure PDF.js worker - use CDN for production builds
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${require('pdfjs-dist/package.json').version}/pdf.worker.min.js`;
}

export default function PdfSignatureModal({ 
  isOpen, 
  onClose, 
  request, 
  onSignComplete 
}) {
  const [activeTab, setActiveTab] = useState('taxpayer'); // 'taxpayer' or 'spouse'
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCanvas, setPageCanvas] = useState(null);
  const [signaturePlacements, setSignaturePlacements] = useState({
    taxpayer: [],
    spouse: []
  });
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentSignatureType, setCurrentSignatureType] = useState(null); // 'taxpayer' or 'spouse'
  const [pendingPlacement, setPendingPlacement] = useState(null); // {x, y, page}
  const [signatureImage, setSignatureImage] = useState(null);
  const [signing, setSigning] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const signaturePadRef = useRef(null);
  const pdfContainerRef = useRef(null);
  const pdfCanvasRef = useRef(null);
  const pdfScale = 1.5; // Scale factor for PDF display

  useEffect(() => {
    if (isOpen && request?.document_url) {
      loadPdf(request.document_url);
    }
  }, [isOpen, request]);

  useEffect(() => {
    if (pdfDoc && currentPage && pdfCanvasRef.current) {
      renderPage(pdfDoc, currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pdfDoc]);

  const renderPage = async (pdf, pageNum) => {
    if (!pdf || !pdfCanvasRef.current) return;
    
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: pdfScale });
      
      const canvas = pdfCanvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      setPageCanvas(canvas);
    } catch (err) {
      console.error('Error rendering PDF page:', err);
      toast.error('Failed to render PDF page');
    }
  };

  useEffect(() => {
    // Cleanup PDF URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const loadPdf = async (url) => {
    try {
      setLoading(true);
      
      // Fetch PDF as blob to avoid CORS issues; fallback to direct URL
      let pdfBlobUrl = url;
      try {
        const response = await fetch(url, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          pdfBlobUrl = URL.createObjectURL(blob);
        }
      } catch (err) {
        console.warn('Could not fetch PDF as blob, using direct URL:', err);
      }
      
      setPdfUrl(pdfBlobUrl);

      // Use bundled PDF.js to load and render
      const loadingTask = getDocument({ url: pdfBlobUrl });
      const pdf = await loadingTask.promise;

      setPdfDoc(pdf);

      const numPages = pdf.numPages;
      const pages = [];
      for (let i = 1; i <= numPages; i++) {
        pages.push(i);
      }
      setPdfPages(pages);

      // Render first page after ensuring canvas exists
      setTimeout(() => {
        if (pdfCanvasRef.current) {
          renderPage(pdf, 1);
        }
      }, 50);

      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Failed to load PDF document');
      setPdfPages([1]);
      setLoading(false);
    }
  };

  const handlePdfClick = (e) => {
    if (showSignaturePad) return; // Don't place signature if pad is open
    
    const canvas = pdfCanvasRef.current;
    if (!canvas) return;
    
    // Calculate coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Get PDF page to calculate coordinates
    if (!pdfDoc) return;
    
    pdfDoc.getPage(currentPage).then(page => {
      const viewport = page.getViewport({ scale: pdfScale });
      
      // Convert canvas coordinates to PDF coordinates (PDF uses points, 72 DPI)
      // Canvas coordinates are already scaled, so divide by scale to get PDF points
      const pdfX = (clickX / pdfScale);
      const pdfY = (clickY / pdfScale);
      
      // Ensure coordinates are within PDF bounds
      if (pdfX < 0 || pdfX > viewport.width || pdfY < 0 || pdfY > viewport.height) {
        toast.info('Please click within the document area');
        return;
      }
      
      // Store pending placement (will be confirmed after signature is drawn)
      setPendingPlacement({
        x: Math.round(pdfX),
        y: Math.round(pdfY),
        page: currentPage
      });
      
      // Open signature pad
      setCurrentSignatureType(activeTab);
      setShowSignaturePad(true);
    }).catch(err => {
      console.error('Error getting PDF page:', err);
      toast.error('Failed to get PDF page information');
    });
  };

  const handleSignatureClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
    setSignatureImage(null);
  };

  const handleSignatureAccept = () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      toast.error('Please draw your signature first');
      return;
    }
    
    if (!pendingPlacement) {
      toast.error('No placement location selected');
      return;
    }
    
    const signatureDataUrl = signaturePadRef.current.toDataURL('image/png');
    setSignatureImage(signatureDataUrl);
    
    // Add the signature placement
    setSignaturePlacements(prev => ({
      ...prev,
      [currentSignatureType]: [...prev[currentSignatureType], {
        x: pendingPlacement.x,
        y: pendingPlacement.y,
        page: pendingPlacement.page,
        signature: signatureDataUrl
      }]
    }));
    
    setPendingPlacement(null);
    setShowSignaturePad(false);
    signaturePadRef.current.clear();
  };

  const removeSignaturePlacement = (index, type) => {
    setSignaturePlacements(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleSubmitSignature = async () => {
    if (signaturePlacements.taxpayer.length === 0) {
      toast.error('Please add at least one taxpayer signature');
      return;
    }
    
    if (request.spouse_sign && signaturePlacements.spouse.length === 0) {
      toast.error('Please add spouse signature');
      return;
    }
    
    try {
      setSigning(true);
      
      // Prepare signature data
      const signatureData = {
        signatures: signaturePlacements.taxpayer.map(placement => ({
          x: placement.x,
          y: placement.y,
          page: placement.page,
          signature_image: placement.signature
        })),
        spouse_signatures: request.spouse_sign ? signaturePlacements.spouse.map(placement => ({
          x: placement.x,
          y: placement.y,
          page: placement.page,
          signature_image: placement.signature
        })) : []
      };
      
      const response = await customESignAPI.submitSignature(request.id, signatureData);
      
      if (response.success) {
        toast.success('Document signed successfully!', {
          position: 'top-right',
          autoClose: 3000
        });
        
        if (onSignComplete) {
          onSignComplete();
        }
        
        handleClose();
      } else {
        throw new Error(response.message || 'Failed to submit signature');
      }
    } catch (error) {
      console.error('Error submitting signature:', error);
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg || 'Failed to submit signature', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setSigning(false);
    }
  };

  const handleClose = () => {
    setShowSignaturePad(false);
    setSignatureImage(null);
    setSignaturePlacements({ taxpayer: [], spouse: [] });
    setPendingPlacement(null);
    setCurrentPage(1);
    setActiveTab('taxpayer');
    setCurrentSignatureType(null);
    setPdfDoc(null);
    setPageCanvas(null);
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
    onClose();
  };

  const canSubmit = () => {
    if (signaturePlacements.taxpayer.length === 0) return false;
    if (request.spouse_sign && signaturePlacements.spouse.length === 0) return false;
    return signaturePlacements.taxpayer.every(p => p.signature) && 
           (!request.spouse_sign || signaturePlacements.spouse.every(p => p.signature));
  };

  if (!isOpen || !request) return null;

  return (
    <Modal
      show={isOpen}
      onHide={handleClose}
      size="xl"
      centered
      backdrop="static"
      style={{ fontFamily: 'BasisGrotesquePro' }}
    >
      <Modal.Header closeButton>
        <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>
          Sign Document: {request.document_name || 'Document'}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ padding: '24px', maxHeight: '80vh', overflow: 'auto' }}>
        {/* Tabs for Taxpayer and Spouse */}
        {request.spouse_sign && (
          <div className="d-flex gap-2 mb-3" style={{ borderBottom: '2px solid #E5E7EB' }}>
            <button
              onClick={() => setActiveTab('taxpayer')}
              className="btn"
              style={{
                border: 'none',
                borderBottom: activeTab === 'taxpayer' ? '3px solid #00C0C6' : '3px solid transparent',
                borderRadius: 0,
                color: activeTab === 'taxpayer' ? '#00C0C6' : '#6B7280',
                fontWeight: activeTab === 'taxpayer' ? '600' : '400',
                backgroundColor: 'transparent',
                padding: '12px 24px'
              }}
            >
              Taxpayer Signature
            </button>
            <button
              onClick={() => setActiveTab('spouse')}
              className="btn"
              style={{
                border: 'none',
                borderBottom: activeTab === 'spouse' ? '3px solid #00C0C6' : '3px solid transparent',
                borderRadius: 0,
                color: activeTab === 'spouse' ? '#00C0C6' : '#6B7280',
                fontWeight: activeTab === 'spouse' ? '600' : '400',
                backgroundColor: 'transparent',
                padding: '12px 24px'
              }}
            >
              Spouse Signature
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="alert alert-info mb-3" style={{ 
          backgroundColor: '#E0F7FA', 
          border: '1px solid #00C0C6',
          color: '#006064',
          fontSize: '14px'
        }}>
          <strong>Instructions:</strong> Click on the PDF where you want to place your signature. 
          Draw your signature in the popup, then click "Accept" to place it.
          {request.spouse_sign && activeTab === 'spouse' && ' Switch to Spouse tab to add spouse signature.'}
        </div>

        {/* Page Navigation */}
        {pdfPages.length > 1 && (
          <div className="d-flex justify-content-between align-items-center mb-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-sm"
              style={{
                backgroundColor: currentPage === 1 ? '#F3F4F6' : '#00C0C6',
                color: currentPage === 1 ? '#9CA3AF' : 'white',
                border: 'none'
              }}
            >
              Previous Page
            </button>
            <span style={{ color: '#3B4A66', fontWeight: '500' }}>
              Page {currentPage} of {pdfPages.length}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(pdfPages.length, p + 1))}
              disabled={currentPage === pdfPages.length}
              className="btn btn-sm"
              style={{
                backgroundColor: currentPage === pdfPages.length ? '#F3F4F6' : '#00C0C6',
                color: currentPage === pdfPages.length ? '#9CA3AF' : 'white',
                border: 'none'
              }}
            >
              Next Page
            </button>
          </div>
        )}

        {/* PDF Viewer */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading PDF...</span>
            </div>
            <p className="mt-3" style={{ color: '#6B7280' }}>Loading PDF document...</p>
          </div>
        ) : pdfDoc && pdfCanvasRef.current ? (
          <div 
            ref={pdfContainerRef}
            onClick={handlePdfClick}
            style={{
              position: 'relative',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              overflow: 'auto',
              cursor: showSignaturePad ? 'default' : 'crosshair',
              backgroundColor: '#F9FAFB',
              minHeight: '500px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: '20px'
            }}
          >
            <div style={{ position: 'relative' }}>
              <canvas
                ref={pdfCanvasRef}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              
              {/* Signature Placement Overlays */}
              {signaturePlacements[activeTab]
                .filter(p => p.page === currentPage)
                .map((placement, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      left: `${placement.x * pdfScale}px`,
                      top: `${placement.y * pdfScale}px`,
                      width: `${200 * pdfScale}px`,
                      height: `${60 * pdfScale}px`,
                      border: '2px solid #00C0C6',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'auto',
                      zIndex: 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {placement.signature ? (
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img
                          src={placement.signature}
                          alt="Signature"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: '4px'
                          }}
                        />
                        <button
                          onClick={() => {
                            const globalIndex = signaturePlacements[activeTab].findIndex(
                              (p, i) => p.page === currentPage && 
                              Math.abs(p.x - placement.x) < 1 && 
                              Math.abs(p.y - placement.y) < 1
                            );
                            removeSignaturePlacement(globalIndex, activeTab);
                          }}
                          className="btn btn-sm"
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            backgroundColor: '#EF4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            padding: 0,
                            fontSize: '14px',
                            lineHeight: '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title="Remove signature"
                        >
                          ×
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
            </div>
          </div>
        ) : pdfUrl ? (
          <div className="alert alert-warning">
            <p>PDF viewer is loading. Please wait...</p>
            <iframe
              src={pdfUrl}
              style={{
                width: '100%',
                height: '600px',
                border: '1px solid #E5E7EB',
                borderRadius: '4px'
              }}
              title="PDF Document"
            />
          </div>
        ) : (
          <div className="text-center py-5">
            <p style={{ color: '#6B7280' }}>No PDF document available</p>
          </div>
        )}

        {/* Signature Pad Modal */}
        {showSignaturePad && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSignaturePad(false);
                setPendingPlacement(null);
                if (signaturePadRef.current) {
                  signaturePadRef.current.clear();
                }
              }
            }}
          >
            <div 
              className="bg-white rounded-lg p-4"
              style={{ maxWidth: '600px', width: '90%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h5 style={{ color: '#3B4A66', marginBottom: '16px' }}>
                Draw Your Signature
              </h5>
              <div style={{ border: '2px solid #E5E7EB', borderRadius: '8px', backgroundColor: 'white' }}>
                <SignatureCanvas
                  ref={signaturePadRef}
                  canvasProps={{
                    width: 500,
                    height: 200,
                    className: 'signature-canvas'
                  }}
                />
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  onClick={() => {
                    setShowSignaturePad(false);
                    setPendingPlacement(null);
                    if (signaturePadRef.current) {
                      signaturePadRef.current.clear();
                    }
                  }}
                  className="btn"
                  style={{
                    backgroundColor: '#F3F4F6',
                    color: '#3B4A66',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignatureClear}
                  className="btn"
                  style={{
                    backgroundColor: '#F3F4F6',
                    color: '#3B4A66',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  Clear
                </button>
                <button
                  onClick={handleSignatureAccept}
                  className="btn"
                  style={{
                    backgroundColor: '#00C0C6',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Signature Summary */}
        <div className="mt-3 p-3" style={{ backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
          <h6 style={{ color: '#3B4A66', marginBottom: '12px' }}>Signature Summary</h6>
          <div className="d-flex flex-column gap-2">
            <div>
              <strong>Taxpayer Signatures:</strong> {signaturePlacements.taxpayer.length} placed
            </div>
            {request.spouse_sign && (
              <div>
                <strong>Spouse Signatures:</strong> {signaturePlacements.spouse.length} placed
              </div>
            )}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          onClick={handleClose}
          className="btn"
          disabled={signing}
          style={{
            backgroundColor: '#F9FAFB',
            color: '#3B4A66',
            border: '1px solid #E5E7EB'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmitSignature}
          disabled={!canSubmit() || signing}
          className="btn"
          style={{
            backgroundColor: canSubmit() && !signing ? '#00C0C6' : '#D1D5DB',
            color: 'white',
            border: 'none'
          }}
        >
          {signing ? 'Signing...' : 'Submit Signatures'}
        </button>
      </Modal.Footer>
    </Modal>
  );
}

