import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Import required CSS for TextLayer and AnnotationLayer
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  const workerVersion = pdfjs.version || '5.3.31';
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${workerVersion}/build/pdf.worker.min.mjs`;
}

/**
 * Enhanced PDF Viewer Component with:
 * - Page thumbnails sidebar
 * - Click to navigate pages
 * - Scroll to navigate pages
 * - Auto-detection of current page while scrolling
 */
export default function PDFViewer({ 
  pdfUrl, 
  pdfFile = null,
  height = '700px',
  showThumbnails = true,
  className = ''
}) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedPage, setSelectedPage] = useState(0);
  const [pdfFileData, setPdfFileData] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [pdfPageWidth, setPdfPageWidth] = useState(800);
  const pdfContainerRef = useRef(null);
  const pageRefs = useRef({});
  
  // Memoize PDF options
  const pdfOptions = useMemo(() => ({
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
  }), []);
  
  // Helper function to convert backend URL to proxy URL if needed
  const getProxyUrl = (url) => {
    if (!url) return url;
    
    try {
      const urlObj = new URL(url);
      // Check if URL is from the backend server (168.231.121.7)
      if (urlObj.hostname === '168.231.121.7' && urlObj.pathname.includes('/seqwens/media')) {
        // Convert to proxy URL: http://localhost:5173/seqwens/media/...
        const proxyPath = urlObj.pathname; // e.g., /seqwens/media/tax_documents/...
        return `${window.location.origin}${proxyPath}${urlObj.search}`;
      }
    } catch (e) {
      // If URL parsing fails, return original URL
      console.warn('Failed to parse URL:', url, e);
    }
    
    return url;
  };

  // Load PDF file from URL or use provided file
  useEffect(() => {
    const loadPdf = async () => {
      if (pdfFile) {
        setPdfFileData(pdfFile);
        return;
      }
      
      if (!pdfUrl) return;
      
      try {
        setPdfLoading(true);
        setPdfError(null);
        
        // Convert to proxy URL if needed to avoid CORS issues
        const proxiedUrl = getProxyUrl(pdfUrl);
        
        // Fetch PDF as blob
        const response = await fetch(proxiedUrl);
        if (!response.ok) throw new Error('Failed to fetch PDF');
        const blob = await response.blob();
        const file = new File([blob], 'document.pdf', { type: 'application/pdf' });
        setPdfFileData(file);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setPdfError(error.message);
      } finally {
        setPdfLoading(false);
      }
    };
    
    loadPdf();
  }, [pdfUrl, pdfFile]);
  
  // Handle PDF document load success
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };
  
  // Handle PDF document load error
  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF document:', error);
    setPdfError(error.message || 'Failed to load PDF');
  };
  
  // Scroll to specific page
  const scrollToPage = useCallback((pageIndex) => {
    const pageElement = pageRefs.current[`page_${pageIndex + 1}`];
    if (pageElement && pdfContainerRef.current) {
      const container = pdfContainerRef.current;
      const pageTop = pageElement.offsetTop - container.offsetTop - 20; // 20px offset
      container.scrollTo({
        top: pageTop,
        behavior: 'smooth'
      });
      setSelectedPage(pageIndex);
      setPageNumber(pageIndex + 1);
    }
  }, []);
  
  // Handle thumbnail click
  const handleThumbnailClick = (pageIndex) => {
    scrollToPage(pageIndex);
  };
  
  // Handle scroll to detect current page
  const handleScroll = useCallback(() => {
    if (!pdfContainerRef.current || !numPages) return;
    
    const container = pdfContainerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const scrollPosition = scrollTop + containerHeight / 2;
    
    // Find which page is currently in view
    for (let i = 0; i < numPages; i++) {
      const pageElement = pageRefs.current[`page_${i + 1}`];
      if (pageElement) {
        const pageTop = pageElement.offsetTop - container.offsetTop;
        const pageBottom = pageTop + pageElement.offsetHeight;
        
        if (scrollPosition >= pageTop && scrollPosition <= pageBottom) {
          if (selectedPage !== i) {
            setSelectedPage(i);
            setPageNumber(i + 1);
          }
          break;
        }
      }
    }
  }, [numPages, selectedPage]);
  
  // Attach scroll listener
  useEffect(() => {
    const container = pdfContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  // Calculate PDF page width based on container
  useEffect(() => {
    const updatePageWidth = () => {
      if (pdfContainerRef.current) {
        const containerWidth = pdfContainerRef.current.clientWidth;
        // Set page width to be slightly smaller than container (with padding)
        setPdfPageWidth(Math.min(containerWidth - 64, 800));
      }
    };
    
    updatePageWidth();
    window.addEventListener('resize', updatePageWidth);
    return () => window.removeEventListener('resize', updatePageWidth);
  }, []);


  console.log(pdfFileData,'test owener is hereeeeeeee===========>>>>>>>>>>>>>>');
  
  return (
    <div className={`flex border border-gray-200 rounded-lg overflow-hidden ${className}`} style={{ height }}>
      {/* Thumbnails Sidebar */}
      {showThumbnails && pdfFileData && numPages && (
        <div className="w-32 bg-gray-50 p-2 overflow-y-auto border-r border-gray-200 flex-shrink-0" style={{ scrollbarWidth: 'thin' }}>
          <Document
            file={pdfFileData}
            options={pdfOptions}
            loading={null}
          >
            {Array.from({ length: numPages }, (_, index) => (
              <div
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`mb-2 cursor-pointer transition-all relative ${selectedPage === index ? 'opacity-100' : 'opacity-70 hover:opacity-90'}`}
              >
                <div
                  className={`aspect-[3/4] bg-white rounded flex flex-col items-center justify-center overflow-hidden relative ${
                    selectedPage === index ? 'border-2 border-blue-500' : 'border border-gray-300 hover:border-blue-300'
                  }`}
                  style={{
                    boxShadow: selectedPage === index ? '0 2px 4px rgba(59, 130, 246, 0.3)' : 'none'
                  }}
                >
                  <Page
                    pageNumber={index + 1}
                    width={80}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="pointer-events-none"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] py-0.5 text-center">
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </Document>
        </div>
      )}
      
      {/* Main PDF Viewer */}
      <div className="flex-1 bg-gray-100 overflow-hidden flex flex-col">
        {pdfLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                Loading PDF...
              </p>
            </div>
          </div>
        ) : pdfError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-red-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                {pdfError}
              </p>
              <p className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                Unable to load PDF document
              </p>
            </div>
          </div>
        ) : pdfFileData || numPages ? (
          <div
            ref={pdfContainerRef}
            className="flex-1 overflow-y-auto p-6"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E0 #F3F4F6'
            }}
          >
            <div className="bg-[#EEEEEE] shadow-sm rounded border border-gray-200 p-8 w-full pb-12">
              <Document
                file={pdfFileData}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <p className="text-sm text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Loading PDF...
                    </p>
                  </div>
                }
                options={pdfOptions}
                className="w-full"
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <div
                    key={`page_${index + 1}`}
                    ref={(el) => {
                      if (el) pageRefs.current[`page_${index + 1}`] = el;
                    }}
                    className={`w-full flex justify-center ${index === numPages - 1 ? 'mb-0' : 'mb-4'}`}
                  >
                    <div className="bg-white shadow-lg" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                      <Page
                        pageNumber={index + 1}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        width={pdfPageWidth}
                        className="max-w-full"
                      />
                    </div>
                  </div>
                ))}
              </Document>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
              No PDF document available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

