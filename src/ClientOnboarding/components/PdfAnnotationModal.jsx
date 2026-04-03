import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { FiPenTool, FiTrash, FiImage, FiSave, FiX, FiZoomIn, FiZoomOut, FiMonitor, FiEdit2, FiCheck } from 'react-icons/fi';
import { handleAPIError } from '../utils/apiUtils';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
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
  onSave,
  spouseSignRequired = false,
  spouseSigned = false
}) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState(TOOLS.PEN);
  const [penColor, setPenColor] = useState('#000000');
  const [penWidth, setPenWidth] = useState(2);
  const [eraserWidth, setEraserWidth] = useState(20);
  const [annotations, setAnnotations] = useState([]);
  const [images, setImages] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const canvasRefs = useRef({});
  const containerRef = useRef(null);
  const imageInputRef = useRef(null);
  const startPosRef = useRef(null);
  const annotationIdCounter = useRef(0);
  const annotationsRef = useRef([]);
  const pdfRenderCache = useRef({});

  // Mobile check
  useEffect(() => {
    const checkRes = () => setIsMobile(window.innerWidth < 768);
    checkRes();
    window.addEventListener('resize', checkRes);
    return () => window.removeEventListener('resize', checkRes);
  }, []);

  // Load PDF
  useEffect(() => {
    if (isOpen && documentUrl) {
      loadPdf(documentUrl);
    }
  }, [isOpen, documentUrl]);

  // Sync annotationsRef
  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  const loadPdf = async (url) => {
    try {
      setLoading(true);
      let pdfUrlToFetch = url;

      // Localhost CORS proxy fix
      if (typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.port === '5177') && 
          url.includes('s3.amazonaws.com')) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://168.231.121.7/seqwens/api';
        const mediaBase = apiUrl.replace('/api', '/media');
        pdfUrlToFetch = url.replace(/https?:\/\/seqwens-s3\.s3\.amazonaws\.com\//, mediaBase + '/');
      }

      const loadingTask = getDocument({
        url: pdfUrlToFetch,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/',
      });

      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) pages.push(i);
      setPdfPages(pages);
      setLoading(false);
    } catch (error) {
      console.error('PDF Load Error:', error);
      toast.error('Failed to load document');
      setLoading(false);
    }
  };

  const renderPage = useCallback(async (pdf, pageNum) => {
    if (!pdf || !containerRef.current) return;
    const container = containerRef.current;

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale, rotation: page.rotate });

      // Find or create wrapper
      let wrapper = container.querySelector(`[data-page="${pageNum}"]`);
      if (!wrapper) return; // Should exist from React map

      // Find or create canvas
      let canvas = wrapper.querySelector('canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        wrapper.appendChild(canvas);
      }

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport }).promise;

      // Draw annotations
      allDraw(context, pageNum);
    } catch (e) {
      console.error(e);
    }
  }, [scale]);

  const allDraw = (context, pageNum) => {
    const pageAnns = annotationsRef.current.filter(a => a.page === pageNum);
    context.save();
    context.scale(scale, scale);
    pageAnns.forEach(ann => {
      if (ann.path && ann.path.length > 0) {
        context.strokeStyle = ann.color || '#000';
        context.lineWidth = ann.width || 2;
        context.lineCap = 'round';
        context.beginPath();
        ann.path.forEach((p, i) => i === 0 ? context.moveTo(p.x, p.y) : context.lineTo(p.x, p.y));
        context.stroke();
      }
    });
    
    const pageImgs = images.filter(img => img.page === pageNum);
    pageImgs.forEach(img => {
      const iObj = new Image();
      iObj.src = img.src;
      iObj.onload = () => {
        context.drawImage(iObj, img.x, img.y, img.width, img.height);
      };
    });
    context.restore();
  };

  useEffect(() => {
    if (pdfDoc && pdfPages.length > 0) {
      pdfPages.forEach(p => renderPage(pdfDoc, p));
    }
  }, [pdfDoc, pdfPages, scale, annotations, images, renderPage]);

  const handleMouseDown = (e) => {
    if (isSaved || e.target.tagName !== 'CANVAS') return;
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const pageNum = parseInt(canvas.parentElement.getAttribute('data-page'));
    
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setIsDrawing(true);
    startPosRef.current = { x, y, page: pageNum };

    if (activeTool === TOOLS.PEN) {
      const newAnn = {
        id: Date.now(),
        type: 'drawing',
        page: pageNum,
        color: penColor,
        width: penWidth,
        path: [{x, y}]
      };
      setAnnotations(prev => [...prev, newAnn]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || isSaved || !startPosRef.current) return;
    const canvas = e.target;
    if (canvas.tagName !== 'CANVAS') return;
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    const pageNum = startPosRef.current.page;

    setAnnotations(prev => prev.map(ann => {
      if (ann.id === annotations[annotations.length - 1].id) {
        return { ...ann, path: [...ann.path, {x, y}] };
      }
      return ann;
    }));
  };

  const handleMouseUp = () => setIsDrawing(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (onSave) await onSave({ annotations, images });
      setIsSaved(true);
      toast.success('Saved successfully');
    } catch (e) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60000000, 
      backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      backdropFilter: 'blur(8px)', pointerEvents: 'auto'
    }}>
      <div style={{
        width: '98vw', height: '98vh', backgroundColor: 'white',
        borderRadius: '16px', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700 }}>{documentName || 'Sign Document'}</h5>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #eee', display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#fff' }}>
          <button 
            onClick={() => setActiveTool(TOOLS.PEN)}
            className={`btn btn-sm ${activeTool === TOOLS.PEN ? 'btn-dark' : 'btn-outline-secondary'}`}
          >
            <FiEdit2 /> Pen
          </button>
          <button 
            onClick={() => setActiveTool(TOOLS.TRASH)}
            className={`btn btn-sm ${activeTool === TOOLS.TRASH ? 'btn-danger' : 'btn-outline-secondary'}`}
          >
            <FiTrash /> Eraser
          </button>
          <div style={{ width: '1px', height: '24px', backgroundColor: '#eee' }} />
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="btn btn-sm btn-light border"><FiZoomOut /></button>
          <span style={{ fontSize: '12px', fontWeight: 700 }}>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="btn btn-sm btn-light border"><FiZoomIn /></button>
          <div style={{ flex: 1 }} />
          <button onClick={handleSave} disabled={saving || isSaved} className="btn btn-primary px-4">
            {saving ? 'Saving...' : isSaved ? 'Saved' : 'Complete & Save'}
          </button>
        </div>

        {/* Viewer */}
        <div 
          ref={containerRef}
          style={{ 
            flex: 1, overflowY: 'auto', padding: '40px', backgroundColor: '#525659',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {loading ? (
            <div style={{ color: 'white', marginTop: '100px' }}>Loading document...</div>
          ) : (
            pdfPages.map(p => (
              <div key={p} data-page={p} className="shadow-lg mb-4" style={{ backgroundColor: 'white', position: 'relative' }}>
                {/* Canvas inserted by renderPage */}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
