import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { FiPenTool, FiEraser, FiImage, FiSave, FiX, FiZoomIn, FiZoomOut, FiRotateCw, FiDownload, FiTrash2 } from 'react-icons/fi';
import { handleAPIError } from '../utils/apiUtils';
import '../styles/PdfAnnotationModal.css';

// Configure PDF.js worker - use CDN for production builds
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${require('pdfjs-dist/package.json').version}/pdf.worker.min.js`;
}

const TOOLS = {
  PEN: 'pen',
  TRASH: 'trash',
  IMAGE: 'image',
  SELECT: 'select'
};

export default function PdfAnnotationModal({ 
  isOpen, 
  onClose, 
  documentUrl, 
  documentName,
  requestId,
  onSave 
}) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState(TOOLS.PEN);
  const [penColor, setPenColor] = useState('#000000');
  const [penWidth, setPenWidth] = useState(2);
  const [eraserWidth, setEraserWidth] = useState(20);
  const [annotations, setAnnotations] = useState([]); // [{type, page, data, id}]
  const [images, setImages] = useState([]); // [{id, page, x, y, width, height, src}]
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const canvasRefs = useRef({});
  const containerRef = useRef(null);
  const imageInputRef = useRef(null);
  const startPosRef = useRef(null);
  const annotationIdCounter = useRef(0);

  // Load PDF
  useEffect(() => {
    if (isOpen && documentUrl) {
      loadPdf(documentUrl);
    }
  }, [isOpen, documentUrl]);

  // Render page when currentPage or scale changes
  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(pdfDoc, currentPage);
    }
  }, [currentPage, scale, pdfDoc]);

  // Redraw annotations when they change
  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(pdfDoc, currentPage);
    }
  }, [annotations, images, currentPage]);

  const loadPdf = async (url) => {
    try {
      setLoading(true);
      
      // Fetch PDF as blob
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Load PDF document
      const loadingTask = getDocument({ url: blobUrl });
      const pdf = await loadingTask.promise;
      
      setPdfDoc(pdf);
      
      // Get page count
      const numPages = pdf.numPages;
      const pages = [];
      for (let i = 1; i <= numPages; i++) {
        pages.push(i);
      }
      setPdfPages(pages);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Failed to load PDF document');
      setLoading(false);
    }
  };

  const renderPage = async (pdf, pageNum) => {
    const canvasId = `page-${pageNum}`;
    const container = containerRef.current;
    if (!container) return;
    
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      // Find or create wrapper
      let wrapper = container.querySelector(`[data-page="${pageNum}"]`);
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'pdf-page-wrapper';
        wrapper.setAttribute('data-page', pageNum);
        wrapper.style.position = 'relative';
        wrapper.style.marginBottom = '20px';
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = 'center';
        wrapper.style.cursor = activeTool === TOOLS.PEN || activeTool === TOOLS.TRASH ? 'crosshair' : 'default';
        container.appendChild(wrapper);
      }
      
      // Find or create canvas
      let canvas = wrapper.querySelector('canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = canvasId;
        canvasRefs.current[canvasId] = canvas;
        wrapper.appendChild(canvas);
      }
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const context = canvas.getContext('2d');
      
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Render PDF page
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Draw annotations for this page
      drawAnnotations(context, pageNum, viewport);
      
      // Draw images for this page
      drawImages(context, pageNum, viewport);
      
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const drawAnnotations = (context, pageNum, viewport) => {
    const pageAnnotations = annotations.filter(a => a.page === pageNum);
    
    pageAnnotations.forEach(annotation => {
      if (annotation.type === 'drawing') {
        context.strokeStyle = annotation.color || penColor;
        context.lineWidth = annotation.width || penWidth;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        
        if (annotation.path && annotation.path.length > 0) {
          context.beginPath();
          annotation.path.forEach((point, index) => {
            if (index === 0) {
              context.moveTo(point.x, point.y);
            } else {
              context.lineTo(point.x, point.y);
            }
          });
          context.stroke();
        }
      }
    });
  };

  const drawImages = (context, pageNum, viewport) => {
    const pageImages = images.filter(img => img.page === pageNum);
    
    pageImages.forEach(img => {
      const imageObj = new Image();
      imageObj.src = img.src;
      imageObj.onload = () => {
        context.drawImage(
          imageObj,
          img.x * scale,
          img.y * scale,
          img.width * scale,
          img.height * scale
        );
      };
    });
  };

  const handleMouseDown = (e) => {
    const target = e.target;
    if (!target || target.tagName !== 'CANVAS') return;
    
    const wrapper = target.closest('[data-page]');
    if (!wrapper) return;
    
    const pageNum = parseInt(wrapper.getAttribute('data-page'));
    const canvas = target;
    
    if (activeTool === TOOLS.PEN || activeTool === TOOLS.TRASH) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      
      setIsDrawing(true);
      startPosRef.current = { x, y, page: pageNum };
      
      if (activeTool === TOOLS.PEN) {
        const newAnnotation = {
          id: `annotation-${annotationIdCounter.current++}`,
          type: 'drawing',
          page: pageNum,
          color: penColor,
          width: penWidth,
          path: [{ x, y }]
        };
        setAnnotations(prev => [...prev, newAnnotation]);
        setSelectedAnnotation(newAnnotation.id);
      }
    } else if (activeTool === TOOLS.IMAGE && selectedAnnotation) {
      // Place image at clicked position
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width) / scale;
      const y = (e.clientY - rect.top) * (canvas.height / rect.height) / scale;
      
      const imageAnnotation = annotations.find(a => a.id === selectedAnnotation);
      if (imageAnnotation && imageAnnotation.type === 'image') {
        const newImage = {
          id: `image-${Date.now()}`,
          page: pageNum,
          x,
          y,
          width: imageAnnotation.width || 200,
          height: imageAnnotation.height || 200,
          src: imageAnnotation.src
        };
        setImages(prev => [...prev, newImage]);
        setAnnotations(prev => prev.filter(a => a.id !== selectedAnnotation));
        setSelectedAnnotation(null);
        setActiveTool(TOOLS.PEN);
        toast.success('Image placed successfully');
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPosRef.current) return;
    
    const target = e.target;
    if (!target || target.tagName !== 'CANVAS') return;
    
    const wrapper = target.closest('[data-page]');
    if (!wrapper) return;
    
    const pageNum = parseInt(wrapper.getAttribute('data-page'));
    const canvas = target;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    if (activeTool === TOOLS.PEN && selectedAnnotation) {
      setAnnotations(prev => prev.map(ann => {
        if (ann.id === selectedAnnotation && ann.page === pageNum) {
          return {
            ...ann,
            path: [...ann.path, { x, y }]
          };
        }
        return ann;
      }));
    } else if (activeTool === TOOLS.TRASH) {
      // Erase annotations near the cursor
      setAnnotations(prev => prev.map(ann => {
        if (ann.page === pageNum && ann.path) {
          const newPath = ann.path.filter(point => {
            const distance = Math.sqrt(
              Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
            );
            return distance > eraserWidth;
          });
          return { ...ann, path: newPath };
        }
        return ann;
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    startPosRef.current = null;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const defaultWidth = 200;
        const defaultHeight = defaultWidth / aspectRatio;
        
        const newAnnotation = {
          id: `image-annotation-${Date.now()}`,
          type: 'image',
          src: event.target.result,
          width: defaultWidth,
          height: defaultHeight
        };
        
        setAnnotations(prev => [...prev, newAnnotation]);
        setSelectedAnnotation(newAnnotation.id);
        setActiveTool(TOOLS.IMAGE);
        toast.info('Click on the PDF where you want to place this image');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const deleteAnnotation = (id) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    setImages(prev => prev.filter(img => img.id !== id));
    setSelectedAnnotation(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare annotation data for backend
      const annotationData = {
        request_id: requestId,
        document_url: documentUrl,
        annotations: annotations.map(ann => ({
          id: ann.id,
          type: ann.type,
          page: ann.page,
          data: ann.type === 'drawing' 
            ? { path: ann.path, color: ann.color, width: ann.width }
            : { src: ann.src, width: ann.width, height: ann.height }
        })),
        images: images.map(img => ({
          id: img.id,
          page: img.page,
          x: img.x,
          y: img.y,
          width: img.width,
          height: img.height,
          src: img.src
        })),
        pdf_scale: scale
      };
      
      // Call onSave callback if provided
      if (onSave) {
        await onSave(annotationData);
      } else {
        // Default: log the data (backend integration point)
        console.log('Annotation data to send to backend:', JSON.stringify(annotationData, null, 2));
        toast.success('Annotations saved successfully!');
      }
      
      handleClose();
    } catch (error) {
      console.error('Error saving annotations:', error);
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg || 'Failed to save annotations');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setAnnotations([]);
    setImages([]);
    setSelectedAnnotation(null);
    setActiveTool(TOOLS.PEN);
    setCurrentPage(1);
    setScale(1.5);
    // Clear canvas refs
    Object.keys(canvasRefs.current).forEach(key => {
      const canvas = canvasRefs.current[key];
      if (canvas && canvas.parentNode) {
        canvas.parentNode.remove();
      }
    });
    canvasRefs.current = {};
    onClose();
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  if (!isOpen) return null;

  return (
    <Modal
      show={isOpen}
      onHide={handleClose}
      size="xl"
      fullscreen
      centered
      backdrop="static"
      className="pdf-annotation-modal"
    >
      <Modal.Header style={{ borderBottom: '2px solid #E5E7EB', padding: '16px 24px' }}>
        <div className="d-flex justify-content-between align-items-center w-100">
          <div>
            <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66', margin: 0 }}>
              PDF Annotation Tool - {documentName || 'Document'}
            </Modal.Title>
          </div>
          <button
            onClick={handleClose}
            className="btn-close"
            aria-label="Close"
          />
        </div>
      </Modal.Header>

      <Modal.Body style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
        {/* Toolbox */}
        <div className="annotation-toolbox" style={{
          borderBottom: '2px solid #E5E7EB',
          padding: '12px 24px',
          backgroundColor: '#F9FAFB',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          {/* Tools */}
          <div className="d-flex gap-2 align-items-center">
            <button
              onClick={() => setActiveTool(TOOLS.PEN)}
              className={`btn btn-sm ${activeTool === TOOLS.PEN ? 'btn-primary' : 'btn-outline-secondary'}`}
              title="Pen Tool"
            >
              <FiPenTool size={18} />
            </button>
            <button
              onClick={() => setActiveTool(TOOLS.TRASH)}
              className={`btn btn-sm ${activeTool === TOOLS.TRASH ? 'btn-primary' : 'btn-outline-secondary'}`}
              title="Eraser Tool"
            >
              <FiTrash size={18} />
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className={`btn btn-sm ${activeTool === TOOLS.IMAGE ? 'btn-primary' : 'btn-outline-secondary'}`}
              title="Upload Image"
            >
              <FiImage size={18} />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Pen Settings */}
          {activeTool === TOOLS.PEN && (
            <>
              <div className="d-flex align-items-center gap-2">
                <label style={{ fontSize: '14px', color: '#3B4A66', margin: 0 }}>Color:</label>
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  style={{ width: '40px', height: '32px', border: '1px solid #E5E7EB', borderRadius: '4px', cursor: 'pointer' }}
                />
              </div>
              <div className="d-flex align-items-center gap-2">
                <label style={{ fontSize: '14px', color: '#3B4A66', margin: 0 }}>Width:</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={penWidth}
                  onChange={(e) => setPenWidth(parseInt(e.target.value))}
                  style={{ width: '100px' }}
                />
                <span style={{ fontSize: '12px', color: '#6B7280', minWidth: '30px' }}>{penWidth}px</span>
              </div>
            </>
          )}

          {/* Eraser Settings */}
          {activeTool === TOOLS.TRASH && (
            <div className="d-flex align-items-center gap-2">
              <label style={{ fontSize: '14px', color: '#3B4A66', margin: 0 }}>Size:</label>
              <input
                type="range"
                min="5"
                max="50"
                value={eraserWidth}
                onChange={(e) => setEraserWidth(parseInt(e.target.value))}
                style={{ width: '100px' }}
              />
              <span style={{ fontSize: '12px', color: '#6B7280', minWidth: '30px' }}>{eraserWidth}px</span>
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button
              onClick={zoomOut}
              className="btn btn-sm btn-outline-secondary"
              title="Zoom Out"
            >
              <FiZoomOut size={18} />
            </button>
            <span style={{ 
              fontSize: '14px', 
              color: '#3B4A66', 
              display: 'flex', 
              alignItems: 'center', 
              padding: '0 8px',
              minWidth: '60px',
              justifyContent: 'center'
            }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="btn btn-sm btn-outline-secondary"
              title="Zoom In"
            >
              <FiZoomIn size={18} />
            </button>
          </div>
        </div>

        {/* PDF Viewer Area */}
        <div 
          ref={containerRef}
          className="pdf-viewer-container"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
            backgroundColor: '#F3F4F6',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {loading ? (
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '100%' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading PDF...</span>
              </div>
              <p className="mt-3" style={{ color: '#6B7280' }}>Loading PDF document...</p>
            </div>
          ) : pdfPages.length > 0 ? (
            pdfPages.map((pageNum) => (
              <div
                key={pageNum}
                data-page={pageNum}
                className="pdf-page-wrapper"
                style={{
                  position: 'relative',
                  marginBottom: '20px',
                  cursor: activeTool === TOOLS.PEN || activeTool === TOOLS.TRASH ? 'crosshair' : 'default'
                }}
              >
                {/* Canvas will be inserted here by renderPage */}
              </div>
            ))
          ) : (
            <div className="text-center py-5">
              <p style={{ color: '#6B7280' }}>No PDF pages available</p>
            </div>
          )}
        </div>

        {/* Page Navigation */}
        {pdfPages.length > 1 && (
          <div className="page-navigation" style={{
            borderTop: '2px solid #E5E7EB',
            padding: '12px 24px',
            backgroundColor: '#F9FAFB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn btn-sm btn-outline-secondary"
            >
              Previous Page
            </button>
            <span style={{ color: '#3B4A66', fontWeight: '500' }}>
              Page {currentPage} of {pdfPages.length}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(pdfPages.length, prev + 1))}
              disabled={currentPage === pdfPages.length}
              className="btn btn-sm btn-outline-secondary"
            >
              Next Page
            </button>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer style={{ borderTop: '2px solid #E5E7EB', padding: '16px 24px' }}>
        <div className="d-flex justify-content-between w-100 align-items-center">
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} • {images.length} image{images.length !== 1 ? 's' : ''}
          </div>
          <div className="d-flex gap-2">
            <button
              onClick={handleClose}
              className="btn btn-outline-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={saving}
              style={{ backgroundColor: '#00C0C6', borderColor: '#00C0C6' }}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="me-2" />
                  Save Annotations
                </>
              )}
            </button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

