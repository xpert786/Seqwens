import React, { useState } from 'react';

/**
 * Lightweight PDF Viewer using iframe
 * Uses browser's native PDF viewer - reliable and no dependencies
 */
export default function SimplePDFViewer({ 
  pdfUrl, 
  pdfFile = null,
  height = '700px',
  className = '',
  onLoadError = null
}) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get the PDF URL - prefer pdfFile (blob) over pdfUrl
  const getPdfSource = () => {
    let source = null;
    
    if (pdfFile) {
      // If it's a File object, create object URL
      if (pdfFile instanceof File) {
        source = URL.createObjectURL(pdfFile);
      }
      // If it's already a blob URL or data URL
      else {
        source = pdfFile;
      }
    } else {
      source = pdfUrl;
    }
    
    // Add zoom parameter to make PDF smaller
    if (source && !source.includes('#')) {
      source += '#zoom=auto-fit';
    }
    
    return source;
  };

  const pdfSource = getPdfSource();

  const handleLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleError = (e) => {
    setLoading(false);
    setError('Failed to load PDF. Please try downloading the file instead.');
    if (onLoadError) {
      onLoadError(e);
    }
  };

  if (!pdfSource) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-500">No PDF source provided</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-sm text-gray-500">Loading PDF...</p>
          </div>
        </div>
      )}
      
      {error ? (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center p-8">
            <p className="text-red-500 mb-4">{error}</p>
            <a
              href={pdfSource}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
              download
            >
              Download PDF
            </a>
          </div>
        </div>
      ) : (
        <iframe
          src={pdfSource}
          className="w-full h-full border-0"
          title="PDF Viewer"
          onLoad={handleLoad}
          onError={handleError}
          style={{ minHeight: height }}
        />
      )}
    </div>
  );
}

