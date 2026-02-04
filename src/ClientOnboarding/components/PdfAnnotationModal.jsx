import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { FiPenTool, FiTrash, FiImage, FiSave, FiX, FiRotateCw, FiDownload, FiTrash2, FiCornerUpLeft, FiCornerUpRight, FiMove } from 'react-icons/fi';
import { handleAPIError } from '../utils/apiUtils';
import '../styles/PdfAnnotationModal.css';

// Configure PDF.js worker - use CDN for production builds
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
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0); // Fixed at 100% zoom
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
  const [history, setHistory] = useState([]); // History of annotation states for undo
  const [historyIndex, setHistoryIndex] = useState(-1); // Current position in history
  const [draggingImage, setDraggingImage] = useState(null); // Currently dragging image
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Offset for smooth dragging
  const [activeSigner, setActiveSigner] = useState('primary'); // 'primary' or 'spouse'
  const [isSaved, setIsSaved] = useState(false); // Track if annotations have been saved

  const canvasRefs = useRef({});
  const containerRef = useRef(null);
  const imageInputRef = useRef(null);
  const startPosRef = useRef(null);
  const annotationIdCounter = useRef(0);
  const eraserRemovedIdsRef = useRef(new Set()); // Track IDs removed in current erase session
  const lastEraseTimeRef = useRef(0); // Throttle eraser re-renders
  const annotationsRef = useRef([]); // Store current annotations to avoid stale closures
  const pdfRenderCache = useRef({}); // Cache for rendered PDF pages: { [pageScaleKey]: { canvas: OffscreenCanvas, width, height } }

  // Initialize history when modal opens
  useEffect(() => {
    if (isOpen) {
      setHistory([{ annotations: [], images: [] }]);
      setHistoryIndex(0);
    }
  }, [isOpen]);

  // Load PDF
  useEffect(() => {
    if (isOpen && documentUrl) {
      loadPdf(documentUrl);
    }
  }, [isOpen, documentUrl]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z or Cmd+Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl+Y for Redo
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, historyIndex, history]);

  // Debug: Log when draggingImage changes
  useEffect(() => {
    console.log('draggingImage state changed:', draggingImage ? draggingImage.id : 'null');
  }, [draggingImage]);

  // Update cursor for all page wrappers and canvases when tool changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wrappers = container.querySelectorAll('.pdf-page-wrapper');
    const canvases = container.querySelectorAll('canvas');

    wrappers.forEach(wrapper => {
      if (activeTool === TOOLS.PEN) {
        wrapper.style.cursor = 'crosshair';
      } else if (activeTool === TOOLS.TRASH) {
        wrapper.style.cursor = 'not-allowed';
      } else if (activeTool === TOOLS.IMAGE) {
        wrapper.style.cursor = 'copy';
      } else if (activeTool === TOOLS.SELECT) {
        wrapper.style.cursor = draggingImage ? 'grabbing' : 'grab';
      } else {
        wrapper.style.cursor = 'default';
      }
    });

    // Also update canvas cursors
    // For SELECT mode, we don't set it here because it's dynamic based on hover
    canvases.forEach(canvas => {
      if (activeTool === TOOLS.PEN) {
        canvas.style.cursor = 'crosshair';
      } else if (activeTool === TOOLS.TRASH) {
        canvas.style.cursor = 'not-allowed';
      } else if (activeTool === TOOLS.IMAGE) {
        canvas.style.cursor = 'copy';
      } else if (activeTool === TOOLS.SELECT) {
        // Don't set cursor here - it's handled dynamically in handleMouseMove
        canvas.style.cursor = draggingImage ? 'grabbing' : 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
    });
  }, [activeTool, draggingImage]);

  // Keep annotationsRef in sync with annotations state
  // This allows renderPage to access latest annotations without them being in dependency array
  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  const loadPdf = async (url) => {
    try {
      setLoading(true);

      let pdfBlobUrl = url;

      // Try to fetch PDF as blob to avoid CORS issues, with fallback to direct URL
      try {
        const response = await fetch(url, {
          mode: 'cors',
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          pdfBlobUrl = URL.createObjectURL(blob);
          console.log('PDF loaded as blob successfully');
        } else {
          console.warn('Failed to fetch PDF as blob, using direct URL:', response.status, response.statusText);
        }
      } catch (fetchError) {
        console.warn('Could not fetch PDF as blob, using direct URL:', fetchError.message);
        // Fall back to direct URL
      }

      // Load PDF document with error handling
      const loadingTask = getDocument({
        url: pdfBlobUrl,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/'
      });

      loadingTask.onProgress = (progress) => {
        console.log('PDF loading progress:', progress);
      };

      const pdf = await loadingTask.promise;

      setPdfDoc(pdf);

      // Get page count
      const numPages = pdf.numPages;
      const pages = [];
      for (let i = 1; i <= numPages; i++) {
        pages.push(i);
      }
      setPdfPages(pages);

      // Clear cache when new PDF loads
      pdfRenderCache.current = {};

      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to load PDF document';

      if (error.name === 'UnexpectedResponseException') {
        errorMessage = 'PDF file not found or access denied';
      } else if (error.name === 'InvalidPDFException') {
        errorMessage = 'The file is not a valid PDF';
      } else if (error.name === 'MissingPDFException') {
        errorMessage = 'PDF file is missing or corrupted';
      } else if (error.message && error.message.includes('fetch')) {
        errorMessage = 'Network error: Could not download PDF. Please check your internet connection.';
      }

      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const renderPage = useCallback(async (pdf, pageNum) => {
    if (!pdf || !pageNum || isNaN(pageNum)) return;

    const canvasId = `page-${pageNum}`;
    const container = containerRef.current;
    if (!container) return;

    try {
      const page = await pdf.getPage(pageNum);
      if (!page) return;

      // Use page.rotate to respect native PDF rotation (handles landscape pages correctly)
      const viewport = page.getViewport({
        scale: scale,
        rotation: page.rotate, // Use native rotation
        offsetX: 0,
        offsetY: 0
      });

      // Find or create wrapper
      let wrapper = container.querySelector(`[data-page="${pageNum}"]`);
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'pdf-page-wrapper';
        wrapper.setAttribute('data-page', pageNum);
        container.appendChild(wrapper);
      }

      // Base styles for wrapper
      wrapper.style.position = 'relative';
      wrapper.style.marginBottom = '20px';
      wrapper.style.display = 'flex';
      wrapper.style.justifyContent = 'center';

      // Update cursor based on active tool
      const getCursorStyle = () => {
        if (activeTool === TOOLS.PEN) return 'crosshair';
        if (activeTool === TOOLS.TRASH) return 'not-allowed';
        if (activeTool === TOOLS.IMAGE) return 'copy';
        if (activeTool === TOOLS.SELECT) return draggingImage ? 'grabbing' : 'grab';
        return 'default';
      };

      wrapper.style.cursor = getCursorStyle();

      // Find or create canvas
      let canvas = wrapper.querySelector('canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = canvasId;
        canvasRefs.current[canvasId] = canvas;
        wrapper.appendChild(canvas);
      }

      // Set canvas internal dimensions
      // Use standard rounding to avoid subpixel blurring
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      // Set canvas display size
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      const context = canvas.getContext('2d');
      if (!context) return;

      // Clear canvas (synchronous)
      context.clearRect(0, 0, canvas.width, canvas.height);

      // --- Render PDF Content (Cached vs Fresh) ---

      // Create a cache key based on page number, scale, and rotation
      // limiting scale precision to avoid cache misses on tiny float diffs
      const cacheKey = `${pageNum}-${scale.toFixed(3)}-${page.rotate}`;

      if (pdfRenderCache.current[cacheKey]) {
        // HIT: Draw cached offscreen canvas synchronously
        const cached = pdfRenderCache.current[cacheKey];
        context.drawImage(cached.canvas, 0, 0);
      } else {
        // MISS: Render to offscreen canvas and cache it
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = canvas.width;
        offscreenCanvas.height = canvas.height;
        const offscreenContext = offscreenCanvas.getContext('2d');

        const renderContext = {
          canvasContext: offscreenContext,
          viewport: viewport
        };

        // This is the async part - we wait for it
        await page.render(renderContext).promise;

        // Save to cache
        pdfRenderCache.current[cacheKey] = {
          canvas: offscreenCanvas,
          width: canvas.width,
          height: canvas.height
        };

        // Draw to visible canvas
        context.drawImage(offscreenCanvas, 0, 0);
      }

      // --- Match Context Transform to PDF Rotation ---
      // This ensures subsequent draws (lines, images) align with the rotated coordinate system
      // For 90/270 degree rotations, we need to swap coordinates or rotate context
      // However, since we're drawing on a canvas that is already sized to the rotated viewport,
      // and our annotations are stored in viewport coordinates (0..width, 0..height relative to the VIEWPORT),
      // we usually don't need to rotate the context itself if line coordinates match visual coordinates.

      // Reset context transform to identity for drawing annotations
      context.setTransform(1, 0, 0, 1, 0, 0);

      // Draw annotations for this page (Synchronous)
      drawAnnotations(context, pageNum, viewport, annotationsRef.current);

      // Draw images for this page (Synchronous if loaded)
      drawImages(context, pageNum, viewport);

    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }, [scale, activeTool, images, draggingImage]); // Removed 'annotations' to prevent re-renders during drawing

  // Render all pages when PDF loads or scale changes (but NOT during active drawing)
  useEffect(() => {
    if (pdfDoc && pdfPages.length > 0 && !isDrawing) {
      // Render all pages, not just current page
      const renderAllPages = async () => {
        for (const pageNum of pdfPages) {
          await renderPage(pdfDoc, pageNum);
        }
      };
      renderAllPages();
    }
  }, [pdfDoc, pdfPages, scale, activeTool, renderPage, isDrawing]);

  // Re-render all pages when images change (but NOT during active drawing)
  useEffect(() => {
    if (pdfDoc && pdfPages.length > 0 && !isDrawing) {
      const renderAllPages = async () => {
        for (const pageNum of pdfPages) {
          await renderPage(pdfDoc, pageNum);
        }
      };
      renderAllPages();
    }
  }, [images, pdfDoc, pdfPages, renderPage, isDrawing]);

  const drawAnnotations = (context, pageNum, viewport, annotationsToDraw = null) => {
    // Use provided annotations, or ref (latest), or fall back to state
    const allAnnotations = annotationsToDraw !== null
      ? annotationsToDraw
      : (annotationsRef.current.length > 0 ? annotationsRef.current : annotations);
    const pageAnnotations = allAnnotations.filter(a => a.page === pageNum);

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
          img.x,
          img.y,
          img.width,
          img.height
        );

        // Draw border if this image is being dragged
        if (draggingImage && draggingImage.id === img.id) {
          context.strokeStyle = '#00C0C6';
          context.lineWidth = 2;
          context.strokeRect(img.x, img.y, img.width, img.height);
        }
      };
    });
  };

  // Helper to check if click is on an image
  const getImageAtPosition = useCallback((x, y, pageNum) => {
    const pageImages = images.filter(img => img.page === pageNum);
    console.log(`Checking position (${x.toFixed(0)}, ${y.toFixed(0)}) on page ${pageNum}`);
    console.log('Page images:', pageImages.map(img => ({
      id: img.id,
      x: img.x.toFixed(0),
      y: img.y.toFixed(0),
      width: img.width,
      height: img.height
    })));

    // Check from top to bottom (last drawn = on top)
    for (let i = pageImages.length - 1; i >= 0; i--) {
      const img = pageImages[i];
      const inBounds = x >= img.x && x <= img.x + img.width &&
        y >= img.y && y <= img.y + img.height;
      console.log(`Image ${img.id}: inBounds=${inBounds}`);
      if (inBounds) {
        console.log('Found image at position!', img.id);
        return img;
      }
    }
    return null;
  }, [images]);

  // Helper function to check if point is near eraser
  const isPointNearEraser = useCallback((point, eraserX, eraserY, eraserRadius) => {
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') return false;
    const dx = point.x - eraserX;
    const dy = point.y - eraserY;
    return (dx * dx + dy * dy) <= (eraserRadius * eraserRadius);
  }, []);

  // Optimized function to find annotations to erase
  const findAnnotationsToErase = useCallback((x, y, pageNum, currentAnnotations) => {
    if (!Array.isArray(currentAnnotations) || currentAnnotations.length === 0) return [];

    const annotationsToRemove = new Set();
    const eraserRadiusSquared = eraserWidth * eraserWidth;

    for (const ann of currentAnnotations) {
      // Skip invalid annotations
      if (!ann || ann.page !== pageNum || !ann.path || !Array.isArray(ann.path) || ann.path.length === 0) {
        continue;
      }

      // Check if eraser intersects with any point in the annotation path
      for (const point of ann.path) {
        if (point && typeof point.x === 'number' && typeof point.y === 'number') {
          const dx = point.x - x;
          const dy = point.y - y;
          if ((dx * dx + dy * dy) <= eraserRadiusSquared) {
            annotationsToRemove.add(ann.id);
            break; // Found a hit, no need to check other points
          }
        }
      }
    }

    return Array.from(annotationsToRemove);
  }, [eraserWidth]);

  const handleMouseDown = (e) => {
    // Disable editing if annotations have been saved
    if (isSaved) return;

    const target = e.target;
    if (!target || target.tagName !== 'CANVAS') return;

    const wrapper = target.closest('[data-page]');
    if (!wrapper) return;

    const pageNum = parseInt(wrapper.getAttribute('data-page'));
    if (isNaN(pageNum)) return;

    const canvas = target;
    const rect = canvas.getBoundingClientRect();

    // Validate rect dimensions
    if (rect.width <= 0 || rect.height <= 0 || canvas.width <= 0 || canvas.height <= 0) return;

    // Calculate coordinates accounting for actual canvas display size
    // Use the ratio of canvas internal dimensions to displayed dimensions
    // This handles cases where canvas is scaled via CSS or browser zoom
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Validate coordinates
    if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) return;

    // Check if clicking on an existing image (for dragging)
    const clickedImage = getImageAtPosition(x, y, pageNum);
    console.log('Mouse down - Active tool:', activeTool, 'Clicked image:', clickedImage ? clickedImage.id : 'none');
    console.log('Images on this page:', images.filter(img => img.page === pageNum).length);

    if (clickedImage && activeTool === TOOLS.SELECT) {
      console.log('Starting drag for image:', clickedImage.id);
      canvas.style.cursor = 'grabbing';
      setDraggingImage(clickedImage);
      setDragOffset({
        x: x - clickedImage.x,
        y: y - clickedImage.y
      });
      return;
    }

    if (activeTool === TOOLS.PEN || activeTool === TOOLS.TRASH) {
      setIsDrawing(true);
      startPosRef.current = { x, y, page: pageNum };

      if (activeTool === TOOLS.PEN) {
        const newAnnotation = {
          id: `annotation-${annotationIdCounter.current++}`,
          type: 'drawing',
          page: pageNum,
          color: penColor,
          width: penWidth,
          path: [{ x, y }],
          signer: activeSigner
        };
        setAnnotations(prev => [...prev, newAnnotation]);
        setSelectedAnnotation(newAnnotation.id);
      } else if (activeTool === TOOLS.TRASH) {
        // Reset eraser session tracking
        eraserRemovedIdsRef.current = new Set();

        console.log('Eraser clicked at:', { x, y, pageNum, eraserWidth });
        console.log('Current annotations count:', annotations.length);
        console.log('Current images count:', images.length);

        // Erase on click - check both annotations and images
        const annotationsToRemove = findAnnotationsToErase(x, y, pageNum, annotations);
        console.log('Annotations to remove:', annotationsToRemove);

        // Also check if eraser is over any image
        const imagesToRemove = images.filter(img => {
          if (img.page !== pageNum) return false;
          const imgCenterX = img.x + img.width / 2;
          const imgCenterY = img.y + img.height / 2;
          const dx = imgCenterX - x;
          const dy = imgCenterY - y;
          return (dx * dx + dy * dy) <= (eraserWidth * eraserWidth);
        }).map(img => img.id);
        console.log('Images to remove:', imagesToRemove);

        if (annotationsToRemove.length > 0 || imagesToRemove.length > 0) {
          annotationsToRemove.forEach(id => eraserRemovedIdsRef.current.add(id));
          const removedAnnotationSet = new Set(annotationsToRemove);
          const removedImageSet = new Set(imagesToRemove);

          setAnnotations(prev => {
            const updated = prev.filter(ann => !removedAnnotationSet.has(ann.id));
            console.log('Updated annotations count:', updated.length);
            return updated;
          });
          setImages(prev => {
            const updated = prev.filter(img => !removedImageSet.has(img.id));
            console.log('Updated images count:', updated.length);
            return updated;
          });

          // Re-render after state update - use a slightly longer delay
          setTimeout(() => {
            if (pdfDoc) {
              console.log('Re-rendering page:', pageNum);
              renderPage(pdfDoc, pageNum);
            }
          }, 50);
        } else {
          console.log('No annotations or images found to erase');
        }
      }
    } else if (activeTool === TOOLS.IMAGE && selectedAnnotation) {
      // Place image at clicked position (center the image on the click point)
      const imageAnnotation = annotations.find(a => a.id === selectedAnnotation);
      if (imageAnnotation && imageAnnotation.type === 'image') {
        const imageWidth = imageAnnotation.width || 200;
        const imageHeight = imageAnnotation.height || 200;

        // Center the image on the click point
        const centerX = x - (imageWidth / 2);
        const centerY = y - (imageHeight / 2);

        const newImage = {
          id: `image-${Date.now()}`,
          page: pageNum,
          x: centerX,
          y: centerY,
          width: imageWidth,
          height: imageHeight,
          src: imageAnnotation.src,
          signer: activeSigner
        };
        const newImages = [...images, newImage];
        const newAnnotations = annotations.filter(a => a.id !== selectedAnnotation);

        setImages(newImages);
        setAnnotations(newAnnotations);
        setSelectedAnnotation(null);
        setActiveTool(TOOLS.PEN);

        // Save to history
        saveToHistory(newAnnotations, newImages);

        toast.success('Image placed successfully');
      }
    }
  };

  const handleMouseMove = (e) => {
    // Disable editing if annotations have been saved
    if (isSaved) return;

    const target = e.target;
    if (!target || target.tagName !== 'CANVAS') return;

    const wrapper = target.closest('[data-page]');
    if (!wrapper) return;

    const pageNum = parseInt(wrapper.getAttribute('data-page'));
    if (isNaN(pageNum)) return;

    const canvas = target;
    const rect = canvas.getBoundingClientRect();

    // Validate rect dimensions
    if (rect.width <= 0 || rect.height <= 0 || canvas.width <= 0 || canvas.height <= 0) return;

    // Calculate coordinates accounting for actual canvas display size
    // Use the ratio of canvas internal dimensions to displayed dimensions
    // This handles cases where canvas is scaled via CSS or browser zoom
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Validate coordinates
    if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) return;

    // Handle image dragging
    if (draggingImage) {
      console.log('Dragging image:', draggingImage.id, 'to position:', x.toFixed(0), y.toFixed(0));
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      setImages(prev => prev.map(img => {
        if (img.id === draggingImage.id) {
          console.log('Updating image position to:', newX.toFixed(0), newY.toFixed(0));
          return { ...img, x: newX, y: newY };
        }
        return img;
      }));

      // Re-render for smooth dragging
      requestAnimationFrame(() => {
        if (pdfDoc) {
          renderPage(pdfDoc, pageNum);
        }
      });
      return;
    } else if (activeTool === TOOLS.SELECT) {
      console.log('In SELECT mode but draggingImage is null');
    }

    // Change cursor when hovering over images in SELECT mode
    if (activeTool === TOOLS.SELECT && !isDrawing && !draggingImage) {
      const hoveredImage = getImageAtPosition(x, y, pageNum);
      if (hoveredImage) {
        console.log('Hovering over image:', hoveredImage.id);
        canvas.style.cursor = 'grab';
      } else {
        canvas.style.cursor = 'pointer';
      }
    }

    if (!isDrawing || !startPosRef.current) return;

    if (activeTool === TOOLS.PEN && selectedAnnotation) {
      // Draw directly on canvas without re-rendering
      const context = canvas.getContext('2d');
      if (!context) return;

      context.strokeStyle = penColor;
      context.lineWidth = penWidth;
      context.lineCap = 'round';
      context.lineJoin = 'round';

      const lastPoint = startPosRef.current;
      if (lastPoint && typeof lastPoint.x === 'number' && typeof lastPoint.y === 'number') {
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(x, y);
        context.stroke();
      }

      startPosRef.current = { x, y, page: pageNum };

      // Update annotation data in state - batch updates for performance
      setAnnotations(prev => {
        return prev.map(ann => {
          if (ann.id === selectedAnnotation && ann.page === pageNum) {
            return {
              ...ann,
              path: [...ann.path, { x, y }]
            };
          }
          return ann;
        });
      });
    } else if (activeTool === TOOLS.TRASH) {
      // Erase entire annotations when the eraser crosses any part of them
      const annotationsToRemove = findAnnotationsToErase(x, y, pageNum, annotations);

      // Filter out already removed annotations in this session
      const newRemovalsOnly = annotationsToRemove.filter(id => !eraserRemovedIdsRef.current.has(id));

      // Remove annotations and trigger re-render (throttled)
      if (newRemovalsOnly.length > 0) {
        console.log('Erasing during drag:', newRemovalsOnly);
        // Track removed IDs
        newRemovalsOnly.forEach(id => eraserRemovedIdsRef.current.add(id));

        const allRemovedSet = eraserRemovedIdsRef.current;
        setAnnotations(prev => prev.filter(ann => !allRemovedSet.has(ann.id)));

        // Throttle re-renders to max 60fps (16ms)
        const now = Date.now();
        if (now - lastEraseTimeRef.current >= 50) { // Increased from 16ms to 50ms
          lastEraseTimeRef.current = now;
          setTimeout(() => {
            if (pdfDoc) {
              console.log('Re-rendering during drag, page:', pageNum);
              renderPage(pdfDoc, pageNum);
            }
          }, 10);
        }
      }

      startPosRef.current = { x, y, page: pageNum };
    }
  };

  const handleMouseUp = () => {
    // Disable editing if annotations have been saved
    if (isSaved) return;
    // Handle end of image dragging
    if (draggingImage) {
      setDraggingImage(null);
      setDragOffset({ x: 0, y: 0 });
      // Save to history after drag
      saveToHistory(annotations, images);
      return;
    }

    if (isDrawing) {
      const pageNum = startPosRef.current?.page;

      // If erasing, ensure final re-render happens
      if (activeTool === TOOLS.TRASH && startPosRef.current && eraserRemovedIdsRef.current.size > 0) {
        if (pdfDoc && pageNum) {
          // Final re-render to clean up
          console.log('Final eraser re-render for page:', pageNum);
          setTimeout(() => {
            renderPage(pdfDoc, pageNum);
          }, 100); // Longer delay for final render
        }
        // Clear eraser session tracking
        eraserRemovedIdsRef.current.clear();
      } else if (activeTool === TOOLS.PEN && pdfDoc && pageNum) {
        // Re-render the page when pen drawing completes to finalize the annotation
        setTimeout(() => {
          renderPage(pdfDoc, pageNum);
        }, 50);
      }

      // Save to history when drawing/erasing is complete
      setTimeout(() => {
        saveToHistory(annotations, images);
      }, 150); // Save after final render
    }
    setIsDrawing(false);
    startPosRef.current = null;
  };

  const handleImageUpload = (e) => {
    // Disable editing if annotations have been saved
    if (isSaved) return;

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
          height: defaultHeight,
          signer: activeSigner
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

  // History management helper
  const saveToHistory = useCallback((newAnnotations, newImages) => {
    // Don't save if nothing changed
    if (history.length > 0 && historyIndex >= 0) {
      const currentState = history[historyIndex];
      if (JSON.stringify(currentState.annotations) === JSON.stringify(newAnnotations) &&
        JSON.stringify(currentState.images) === JSON.stringify(newImages)) {
        console.log('No changes detected, skipping history save');
        return;
      }
    }

    const newState = {
      annotations: JSON.parse(JSON.stringify(newAnnotations)),
      images: JSON.parse(JSON.stringify(newImages)),
      timestamp: Date.now()
    };

    console.log('Saving to history:', {
      annotationsCount: newAnnotations.length,
      imagesCount: newImages.length,
      currentIndex: historyIndex
    });

    setHistory(prev => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add new state
      newHistory.push(newState);
      // Limit history to last 50 states
      const trimmedHistory = newHistory.slice(-50);
      console.log('New history length:', trimmedHistory.length);
      return trimmedHistory;
    });

    setHistoryIndex(prev => {
      const newIndex = Math.min(prev + 1, 49);
      console.log('New history index:', newIndex);
      return newIndex;
    });
  }, [historyIndex, history]);

  // Undo function
  const handleUndo = () => {
    if (historyIndex <= 0) {
      toast.info('Nothing to undo');
      return;
    }

    const newIndex = historyIndex - 1;
    const previousState = history[newIndex];

    console.log('Undo - Going from index', historyIndex, 'to', newIndex);
    console.log('Previous state:', {
      annotations: previousState.annotations.length,
      images: previousState.images.length
    });

    setAnnotations(JSON.parse(JSON.stringify(previousState.annotations)));
    setImages(JSON.parse(JSON.stringify(previousState.images)));
    setHistoryIndex(newIndex);

    // Re-render all pages to ensure consistency
    if (pdfDoc) {
      setTimeout(() => {
        pdfPages.forEach(pageNum => {
          renderPage(pdfDoc, pageNum);
        });
      }, 50);
    }

    toast.success(`Undone (${history.length - newIndex - 1} more available)`);
  };

  // Redo function
  const handleRedo = () => {
    if (historyIndex >= history.length - 1) {
      toast.info('Nothing to redo');
      return;
    }

    const newIndex = historyIndex + 1;
    const nextState = history[newIndex];

    console.log('Redo - Going from index', historyIndex, 'to', newIndex);
    console.log('Next state:', {
      annotations: nextState.annotations.length,
      images: nextState.images.length
    });

    setAnnotations(JSON.parse(JSON.stringify(nextState.annotations)));
    setImages(JSON.parse(JSON.stringify(nextState.images)));
    setHistoryIndex(newIndex);

    // Re-render all pages to ensure consistency
    if (pdfDoc) {
      setTimeout(() => {
        pdfPages.forEach(pageNum => {
          renderPage(pdfDoc, pageNum);
        });
      }, 50);
    }

    toast.success(`Redone (${newIndex} of ${history.length - 1})`);
  };

  // Clear all annotations
  const handleClearAll = () => {
    // Disable editing if annotations have been saved
    if (isSaved) return;
    if (annotations.length === 0 && images.length === 0) {
      toast.info('Nothing to clear');
      return;
    }

    // Save current state before clearing
    saveToHistory([], []);
    setAnnotations([]);
    setImages([]);

    // Re-render all pages
    if (pdfDoc) {
      pdfPages.forEach(pageNum => {
        renderPage(pdfDoc, pageNum);
      });
    }

    toast.success('All annotations cleared');
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Separate primary and spouse annotations
      const primaryAnnotations = annotations.filter(ann => !ann.signer || ann.signer === 'primary');
      const spouseAnnotations = annotations.filter(ann => ann.signer === 'spouse');
      const primaryImages = images.filter(img => !img.signer || img.signer === 'primary');
      const spouseImages = images.filter(img => img.signer === 'spouse');

      // Validate spouse signature requirement
      if (spouseSignRequired && !spouseSigned) {
        const spouseHasAnnotations = spouseAnnotations.length > 0 || spouseImages.length > 0;
        if (!spouseHasAnnotations) {
          toast.error('Spouse signature is required. Please switch to "Spouse" mode and add a signature using the pen or image tool.', {
            position: 'top-right',
            autoClose: 5000
          });
          setSaving(false);
          return;
        }
      }

      // Get canvas dimensions from the first page (assuming all pages have same dimensions)
      let canvasWidth = 0;
      let canvasHeight = 0;
      if (pdfPages.length > 0) {
        const firstCanvasId = `page-${pdfPages[0]}`;
        const firstCanvas = canvasRefs.current[firstCanvasId];
        if (firstCanvas) {
          canvasWidth = firstCanvas.width;
          canvasHeight = firstCanvas.height;
        }
      }

      // Prepare annotation data for backend
      const annotationData = {
        request_id: requestId,
        document_url: documentUrl,
        annotations: primaryAnnotations.map(ann => ({
          id: ann.id,
          type: ann.type,
          page: ann.page,
          signer: 'primary',
          data: ann.type === 'drawing'
            ? { path: ann.path, color: ann.color, width: ann.width }
            : { src: ann.src, width: ann.width, height: ann.height }
        })),
        images: primaryImages.map(img => ({
          id: img.id,
          page: img.page,
          x: img.x,
          y: img.y,
          width: img.width,
          height: img.height,
          src: img.src,
          signer: 'primary'
        })),
        // Include spouse annotations and images if they exist
        spouse_annotations: spouseAnnotations.length > 0 ? spouseAnnotations.map(ann => ({
          id: ann.id,
          type: ann.type,
          page: ann.page,
          signer: 'spouse',
          data: ann.type === 'drawing'
            ? { path: ann.path, color: ann.color, width: ann.width }
            : { src: ann.src, width: ann.width, height: ann.height }
        })) : [],
        spouse_images: spouseImages.length > 0 ? spouseImages.map(img => ({
          id: img.id,
          page: img.page,
          x: img.x,
          y: img.y,
          width: img.width,
          height: img.height,
          src: img.src,
          signer: 'spouse'
        })) : [],
        pdf_scale: scale,
        zoom_percentage: Math.round(scale * 100), // Zoom percentage (e.g., 150 for 150%)
        canvas_info: {
          width: canvasWidth,
          height: canvasHeight
        }
      };

      // Call onSave callback if provided
      if (onSave) {
        await onSave(annotationData);
      } else {
        // Default: log the data (backend integration point)
        console.log('Annotation data to send to backend:', JSON.stringify(annotationData, null, 2));
        toast.success('Annotations saved successfully!');
      }

      // Disable editing after successful save
      setIsSaved(true);
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
    setScale(1.0); // Fixed at 100% zoom
    setHistory([]);
    setHistoryIndex(-1);
    setIsSaved(false); // Reset saved state

    // Clear refs
    eraserRemovedIdsRef.current.clear();
    lastEraseTimeRef.current = 0;

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

  // Zoom is fixed at 100% - no zoom functions needed

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
      <Modal.Header style={{ borderBottom: '2px solid #E5E7EB', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'white' }}>
        <div className="d-flex justify-content-between align-items-center w-100">
          <div>
            <Modal.Title style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66', margin: 0, textAlign: 'center' }}>
              PDF Annotation Tool
            </Modal.Title>
          </div>
          <button
            onClick={handleClose}
            className="btn-close"
            aria-label="Close"
          />
        </div>
      </Modal.Header>

      <Modal.Body style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
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
          {/* Signer Toggle - Show only if spouse signature is required */}
          {spouseSignRequired && (
            <>
              <div className="d-flex align-items-center gap-2" style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F3F4F6' }}>
                <button
                  onClick={() => setActiveSigner('primary')}
                  className={`btn  ${activeSigner === 'primary' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{
                    fontSize: '12px',
                    padding: '4px 12px',
                    minWidth: '80px'
                  }}
                  title="Sign as Primary Taxpayer"
                >
                  Primary
                </button>
                <button
                  onClick={() => setActiveSigner('spouse')}
                  className={`btn  ${activeSigner === 'spouse' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{
                    fontSize: '12px',
                    padding: '4px 12px',
                    minWidth: '80px',
                    backgroundColor: activeSigner === 'spouse' ? '#F56D2D' : undefined,
                    borderColor: activeSigner === 'spouse' ? '#F56D2D' : undefined
                  }}
                  title="Sign as Spouse"
                >
                  Spouse
                </button>
              </div>
              <div style={{ height: '32px', width: '1px', backgroundColor: '#D1D5DB' }} />
            </>
          )}

          {/* Tools */}
          <div className="d-flex gap-2 align-items-center">
            <button
              onClick={() => !isSaved && setActiveTool(TOOLS.PEN)}
              disabled={isSaved}
              className={`btn  ${activeTool === TOOLS.PEN ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{ opacity: isSaved ? 0.6 : 1, cursor: isSaved ? 'not-allowed' : 'pointer' }}
              title="Pen Tool"
            >
              <FiPenTool size={18} />
            </button>
            <button
              onClick={() => !isSaved && setActiveTool(TOOLS.TRASH)}
              disabled={isSaved}
              className={`btn  ${activeTool === TOOLS.TRASH ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{ opacity: isSaved ? 0.6 : 1, cursor: isSaved ? 'not-allowed' : 'pointer' }}
              title="Eraser Tool"
            >
              <FiTrash size={18} />
            </button>
            <button
              onClick={() => !isSaved && imageInputRef.current?.click()}
              disabled={isSaved}
              className={`btn  ${activeTool === TOOLS.IMAGE ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{ opacity: isSaved ? 0.6 : 1, cursor: isSaved ? 'not-allowed' : 'pointer' }}
              title="Upload Image"
            >
              <FiImage size={18} />
            </button>
            <button
              onClick={() => {
                if (!isSaved) {
                  console.log('Select/Move tool clicked');
                  setActiveTool(TOOLS.SELECT);
                }
              }}
              disabled={isSaved}
              className={`btn  ${activeTool === TOOLS.SELECT ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{ opacity: isSaved ? 0.6 : 1, cursor: isSaved ? 'not-allowed' : 'pointer' }}
              title="Select/Move Tool - Click and drag images to move them"
            >
              <FiMove size={18} />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />

            {/* Divider */}
            <div style={{ height: '32px', width: '1px', backgroundColor: '#D1D5DB' }} />

            {/* Clear All button */}
            <button
              onClick={handleClearAll}
              disabled={isSaved || (annotations.length === 0 && images.length === 0)}
              className="btn  btn-outline-danger"
              style={{ opacity: isSaved ? 0.6 : 1, cursor: isSaved ? 'not-allowed' : 'pointer' }}
              title="Clear All Annotations"
            >
              <FiTrash2 size={18} />
            </button>
          </div>

          {/* Pen Settings */}
          {activeTool === TOOLS.PEN && !isSaved && (
            <>
              <div className="d-flex align-items-center gap-2">
                <label style={{ fontSize: '14px', color: '#3B4A66', margin: 0 }}>Color:</label>
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  disabled={isSaved}
                  style={{ width: '40px', height: '32px', border: '1px solid #E5E7EB', borderRadius: '4px', cursor: isSaved ? 'not-allowed' : 'pointer', opacity: isSaved ? 0.6 : 1 }}
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
                  disabled={isSaved}
                  style={{ width: '100px', opacity: isSaved ? 0.6 : 1 }}
                />
                <span style={{ fontSize: '12px', color: '#6B7280', minWidth: '30px' }}>{penWidth}px</span>
              </div>
            </>
          )}

          {/* Eraser Settings */}
          {activeTool === TOOLS.TRASH && !isSaved && (
            <div className="d-flex align-items-center gap-2">
              <label style={{ fontSize: '14px', color: '#3B4A66', margin: 0 }}>Size:</label>
              <input
                type="range"
                min="5"
                max="50"
                value={eraserWidth}
                onChange={(e) => setEraserWidth(parseInt(e.target.value))}
                disabled={isSaved}
                style={{ width: '100px', opacity: isSaved ? 0.6 : 1 }}
              />
              <span style={{ fontSize: '12px', color: '#6B7280', minWidth: '30px' }}>{eraserWidth}px</span>
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                  cursor: activeTool === TOOLS.PEN ? 'crosshair'
                    : activeTool === TOOLS.TRASH ? 'not-allowed'
                      : activeTool === TOOLS.IMAGE ? 'copy'
                        : activeTool === TOOLS.SELECT ? (draggingImage ? 'grabbing' : 'grab')
                          : 'default'
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
              className="btn  btn-outline-secondary"
            >
              Previous Page
            </button>
            <span style={{ color: '#3B4A66', fontWeight: '500' }}>
              Page {currentPage} of {pdfPages.length}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(pdfPages.length, prev + 1))}
              disabled={currentPage === pdfPages.length}
              className="btn  btn-outline-secondary"
            >
              Next Page
            </button>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer style={{
        borderTop: '2px solid #E5E7EB',
        padding: '16px 24px',
        position: 'sticky',
        bottom: 0,
        zIndex: 1000,
        backgroundColor: 'white',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
      }}>
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

