import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Button, ButtonGroup } from 'react-bootstrap';
import { FaUpload, FaEraser, FaMousePointer, FaImage, FaFont, FaSave, FaTimes, FaUndo, FaRedo } from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.js?url";

// Configure PDF.js worker for Vite with legacy imports
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Advanced PDF Viewer with Annotation Toolbox
 * Supports image uploads, text annotations, and backend integration for Python script processing
 */
export default function AdvancedPDFViewer({ 
  show, 
  onHide, 
  pdfUrl, 
  onSaveAnnotations,
  initialAnnotations = []
}) {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [pdfPage, setPdfPage] = useState(null);
  const [annotations, setAnnotations] = useState(initialAnnotations);
  const [currentTool, setCurrentTool] = useState('select'); // select, image, text, eraser
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([initialAnnotations]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Load PDF page
  useEffect(() => {
    if (show && pdfUrl) {
      loadPDF();
    }
  }, [show, pdfUrl]);

  const loadPDF = async () => {
    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      setPdfPage(page);
      await renderPDF(page);
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Failed to load PDF');
    }
  };

  const renderPDF = async (page) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    const viewport = page.getViewport({ scale: 1.5 });
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;
    await renderAnnotations();
  };

  const renderAnnotations = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear and re-render PDF first
    if (pdfPage) {
      const viewport = pdfPage.getViewport({ scale: 1.5 });
      await pdfPage.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;
    }

    // Render annotations
    annotations.forEach(annotation => {
      if (annotation.type === 'image' && annotation.image) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, annotation.x, annotation.y, annotation.width, annotation.height);
        };
        img.src = annotation.image;
      } else if (annotation.type === 'text') {
        ctx.font = `${annotation.fontSize || 16}px Arial`;
        ctx.fillStyle = annotation.color || '#000000';
        ctx.fillText(annotation.text, annotation.x, annotation.y);
      }
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const newAnnotation = {
            id: Date.now(),
            type: 'image',
            image: e.target.result,
            x: 50,
            y: 50,
            width: 150,
            height: 100,
            originalWidth: img.width,
            originalHeight: img.height
          };
          addAnnotation(newAnnotation);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const addAnnotation = (annotation) => {
    const newAnnotations = [...annotations, annotation];
    setAnnotations(newAnnotations);
    addToHistory(newAnnotations);
  };

  const deleteAnnotation = (id) => {
    const newAnnotations = annotations.filter(a => a.id !== id);
    setAnnotations(newAnnotations);
    addToHistory(newAnnotations);
  };

  const addToHistory = (newAnnotations) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
    }
  };

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on an annotation
    const clickedAnnotation = annotations.find(annotation => {
      if (annotation.type === 'image') {
        return x >= annotation.x && x <= annotation.x + annotation.width &&
               y >= annotation.y && y <= annotation.y + annotation.height;
      }
      return false;
    });

    if (clickedAnnotation && currentTool === 'select') {
      setIsDragging(true);
      setDraggedItem(clickedAnnotation);
      setDragOffset({ x: x - clickedAnnotation.x, y: y - clickedAnnotation.y });
    } else if (currentTool === 'eraser' && clickedAnnotation) {
      deleteAnnotation(clickedAnnotation.id);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDragging || !draggedItem) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const updatedAnnotations = annotations.map(annotation => {
      if (annotation.id === draggedItem.id) {
        return {
          ...annotation,
          x: x - dragOffset.x,
          y: y - dragOffset.y
        };
      }
      return annotation;
    });

    setAnnotations(updatedAnnotations);
  };

  const handleCanvasMouseUp = () => {
    if (isDragging) {
      addToHistory(annotations);
    }
    setIsDragging(false);
    setDraggedItem(null);
  };

  const saveAnnotations = () => {
    const annotationData = {
      pdfUrl,
      annotations: annotations.map(annotation => ({
        type: annotation.type,
        x: annotation.x,
        y: annotation.y,
        width: annotation.width,
        height: annotation.height,
        // For images, send relative position data for Python processing
        ...(annotation.type === 'image' && {
          imageType: 'signature', // or 'logo', 'stamp', etc.
          relativeX: annotation.x / canvasRef.current.width,
          relativeY: annotation.y / canvasRef.current.height,
          relativeWidth: annotation.width / canvasRef.current.width,
          relativeHeight: annotation.height / canvasRef.current.height
        }),
        ...(annotation.type === 'text' && {
          text: annotation.text,
          fontSize: annotation.fontSize,
          color: annotation.color
        })
      })),
      metadata: {
        canvasWidth: canvasRef.current?.width,
        canvasHeight: canvasRef.current?.height,
        timestamp: new Date().toISOString()
      }
    };

    if (onSaveAnnotations) {
      onSaveAnnotations(annotationData);
    }
    
    toast.success('Annotations saved successfully!');
  };

  const clearAll = () => {
    setAnnotations([]);
    addToHistory([]);
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="fullscreen"
      centered
      className="pdf-annotation-modal"
    >
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title className="d-flex align-items-center gap-2">
          <FaImage />
          PDF Annotation Tool
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0 bg-dark">
        {/* Toolbox */}
        <div className="toolbox bg-secondary p-3 border-bottom">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <ButtonGroup>
              <Button
                variant={currentTool === 'select' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setCurrentTool('select')}
                title="Select & Move"
              >
                <FaMousePointer />
              </Button>
              <Button
                variant={currentTool === 'image' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                title="Add Image"
              >
                <FaUpload />
              </Button>
              <Button
                variant={currentTool === 'eraser' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setCurrentTool('eraser')}
                title="Eraser"
              >
                <FaEraser />
              </Button>
            </ButtonGroup>

            <div className="vr"></div>

            <ButtonGroup>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                title="Undo"
              >
                <FaUndo />
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                title="Redo"
              >
                <FaRedo />
              </Button>
            </ButtonGroup>

            <div className="vr"></div>

            <Button
              variant="danger"
              size="sm"
              onClick={clearAll}
              title="Clear All"
            >
              <FaTimes /> Clear
            </Button>

            <Button
              variant="success"
              size="sm"
              onClick={saveAnnotations}
              title="Save Annotations"
            >
              <FaSave /> Save
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Canvas Container */}
        <div className="canvas-container d-flex justify-content-center align-items-center p-3" style={{ minHeight: '500px' }}>
          <div className="position-relative">
            <canvas
              ref={canvasRef}
              className="border border-light"
              style={{
                cursor: currentTool === 'select' ? 'move' : currentTool === 'eraser' ? 'pointer' : 'default',
                maxWidth: '100%',
                height: 'auto'
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
            
            {/* Annotations overlay info */}
            {annotations.length > 0 && (
              <div className="position-absolute top-0 start-0 mt-2 ms-2 bg-dark text-white p-2 rounded" style={{ fontSize: '12px' }}>
                {annotations.length} annotation(s)
              </div>
            )}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="bg-dark text-white">
        <div className="d-flex justify-content-between w-full">
          <div className="text-muted small">
            Current Tool: <strong>{currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}</strong>
          </div>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
