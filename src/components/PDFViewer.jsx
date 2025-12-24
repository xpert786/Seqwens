import React from 'react';
import SimplePDFViewer from './SimplePDFViewer';

/**
 * Lightweight PDF Viewer Component using iframe
 * Uses browser's native PDF viewer - reliable and no dependencies
 */
export default function PDFViewer({ 
  pdfUrl, 
  pdfFile = null,
  height = '700px',
  showThumbnails = true,
  className = ''
}) {
  // Helper function to convert backend URL to proxy URL if needed
  const getProxyUrl = (url) => {
    if (!url) return url;
    
    // Handle relative URLs
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    
    try {
      const urlObj = new URL(url);
      // Check if URL is from the backend server (168.231.121.7)
      if (urlObj.hostname === '168.231.121.7' && urlObj.pathname.includes('/seqwens/media')) {
        // Convert to proxy URL
        const proxyPath = urlObj.pathname;
        return `${window.location.origin}${proxyPath}${urlObj.search}`;
      }
    } catch (e) {
      console.warn('Failed to parse URL:', url, e);
    }
    
    return url;
  };

  // Get the PDF source URL
  const pdfSource = pdfFile ? (pdfFile instanceof File ? URL.createObjectURL(pdfFile) : pdfFile) : getProxyUrl(pdfUrl);

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <SimplePDFViewer
        pdfUrl={pdfSource}
        pdfFile={pdfFile}
        height={height}
        className="w-full h-full"
      />
    </div>
  );
}

