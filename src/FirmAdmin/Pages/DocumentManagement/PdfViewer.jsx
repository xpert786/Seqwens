import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { PdfCalendarIcon, PdfCheckmarkIcon, PdfDocumentIcon, PdfDocumentIconLight, PdfEditIcon, PdfPaperPlaneIcon, PdfProfileIcon } from '../../Components/icons';
import { firmAdminDocumentsAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { toast } from 'react-toastify';

// Import required CSS for TextLayer and AnnotationLayer
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  const workerVersion = pdfjs.version || '5.3.31';
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${workerVersion}/build/pdf.worker.min.mjs`;
}

// Icons
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 8C1 8 3.66667 3 8 3C12.3333 3 15 8 15 8C15 8 12.3333 13 8 13C3.66667 13 1 8 1 8Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default function PdfViewer() {
  const { folderId, documentId } = useParams();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // PDF viewer state
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedPage, setSelectedPage] = useState(0);
  const [pdfFileData, setPdfFileData] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [pdfPageWidth, setPdfPageWidth] = useState(800);
  const pdfContainerRef = useRef(null);
  const pageRefs = useRef({});
  
  // Document data state
  const [documentData, setDocumentData] = useState(null);
  const [loadingDocument, setLoadingDocument] = useState(true);
  const [documentError, setDocumentError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  
  // Default PDF URL as fallback
  const DEFAULT_PDF_URL = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
  
  // Memoize PDF options
  const pdfOptions = useMemo(() => ({
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
  }), []);
  
  // Helper function to convert backend URL to proxy URL if needed
  const getProxyUrl = (url) => {
    if (!url) return url;
    
    // Handle relative URLs (start with /)
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    
    try {
      const urlObj = new URL(url);
      // Check if URL is from the backend server (168.231.121.7)
      if (urlObj.hostname === '168.231.121.7' && urlObj.pathname.includes('/seqwens/media')) {
        // Convert to proxy URL: http://localhost:5173/seqwens/media/...
        const proxyPath = urlObj.pathname; // e.g., /seqwens/media/tax_documents/...
        return `${window.location.origin}${proxyPath}${urlObj.search}`;
      }
    } catch (e) {
      // If URL parsing fails and it's not a relative URL, return original URL
      console.warn('Failed to parse URL:', url, e);
    }
    
    return url;
  };

  // Format status display
  const formatStatus = (status) => {
    if (!status) return 'Pending';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('approved')) return 'Approved';
    if (statusLower.includes('pending_review')) return 'Pending Review';
    if (statusLower.includes('reviewed')) return 'Reviewed';
    if (statusLower.includes('rejected')) return 'Rejected';
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };

  // Format file size
  const formatFileSize = (size) => {
    if (!size || size === '—') return '—';
    if (typeof size === 'number') {
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    return size;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Fetch document data from API
  useEffect(() => {
    const fetchDocumentData = async () => {
      if (!documentId || !folderId) return;

      try {
        setLoadingDocument(true);
        setDocumentError(null);

        // Fetch documents from the folder to get the specific document
        const response = await firmAdminDocumentsAPI.browseDocuments({ folder_id: folderId });

        if (response.success && response.data) {
          const documents = response.data.documents || [];
          const document = documents.find(doc => doc.id.toString() === documentId.toString());

          if (document) {
            // Extract filename from URL
            const url = document.tax_documents || '';
            const filename = url.split('/').pop() || 'document.pdf';
            const fileExtension = filename.split('.').pop().toUpperCase() || 'PDF';

            // Transform document data
            const transformedDocument = {
              id: document.id,
              name: filename,
              type: fileExtension,
              status: document.status || 'pending_review',
              size: document.size || document.file_size || '—',
              client: document.client?.name || document.client_name || 'N/A',
              
              assignedTo: document.uploaded_by?.name || document.uploaded_by_name || document.created_by?.name || 'N/A',
              uploadDate: formatDate(document.created_at),
              version: 'v1.0', // Version not provided by API, using default
              tax_documents: document.tax_documents,
              category: document.category?.name || 'General'
            };

            setDocumentData(transformedDocument);
            setPdfUrl(document.tax_documents || null);
          } else {
            throw new Error('Document not found');
          }
        } else {
          throw new Error(response.message || 'Failed to fetch document');
        }
      } catch (error) {
        console.error('Error fetching document data:', error);
        setDocumentError(handleAPIError(error) || 'Failed to load document');
        toast.error(handleAPIError(error) || 'Failed to load document');
      } finally {
        setLoadingDocument(false);
      }
    };

    fetchDocumentData();
  }, [documentId, folderId]);

  // Load PDF file - use default PDF if document PDF is not available
  useEffect(() => {
    const loadPdf = async () => {
      // Use document PDF URL if available, otherwise use default PDF
      const urlToLoad = pdfUrl || DEFAULT_PDF_URL;
      const isDocumentPdf = !!pdfUrl;
      
      try {
        setPdfLoading(true);
        setPdfError(null);
        
        // Convert to proxy URL if needed to avoid CORS issues
        const proxiedUrl = getProxyUrl(urlToLoad);
        
        // Get access token for authenticated requests (only for document PDFs, not default)
        const token = getAccessToken();
        const headers = {};
        if (token && isDocumentPdf) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Fetch PDF as blob with authentication (if needed)
        const response = await fetch(proxiedUrl, { headers });
        if (!response.ok) throw new Error('Failed to fetch PDF');
        const blob = await response.blob();
        const file = new File([blob], isDocumentPdf ? 'document.pdf' : 'sample.pdf', { type: 'application/pdf' });
        setPdfFileData(file);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setPdfError(error.message);
        // If document PDF fails, try default PDF as fallback
        if (isDocumentPdf) {
          console.log('Document PDF failed, trying default PDF...');
          try {
            const defaultResponse = await fetch(DEFAULT_PDF_URL);
            if (defaultResponse.ok) {
              const defaultBlob = await defaultResponse.blob();
              const defaultFile = new File([defaultBlob], 'sample.pdf', { type: 'application/pdf' });
              setPdfFileData(defaultFile);
              setPdfError(null);
              toast.info('Using sample PDF (document PDF unavailable)');
            } else {
              toast.error('Failed to load PDF document');
            }
          } catch (defaultError) {
            console.error('Error loading default PDF:', defaultError);
            toast.error('Failed to load PDF document');
          }
        } else {
          toast.error('Failed to load PDF document');
        }
      } finally {
        setPdfLoading(false);
      }
    };
    
    // Always load a PDF (default or document)
    loadPdf();
  }, [pdfUrl]);
  
  // Handle PDF document load success
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };
  
  // Handle PDF document load error
  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF document:', error);
    setPdfError(error.message || 'Failed to load PDF');
    toast.error('Failed to load PDF document');
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

  // Helper function to get icon based on comment type
  const getCommentIcon = (commentType) => {
    switch (commentType) {
      case 'comment':
        return <PdfDocumentIcon />;
      case 'note':
        return <PdfCheckmarkIcon />;
      case 'annotation':
        return <PdfEditIcon />;
      default:
        return <PdfProfileIcon />;
    }
  };

  // Format date from API
  const formatCommentDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Fetch comments from API
  useEffect(() => {
    const fetchComments = async () => {
      if (!documentId) return;

      try {
        setLoadingComments(true);
        const response = await firmAdminDocumentsAPI.getComments(documentId);

        if (response.success && response.data) {
          const commentsList = Array.isArray(response.data) ? response.data :
            (response.data.comments || []);

          // Transform API comments to match component structure
          const transformedComments = commentsList.map(comment => ({
            id: comment.id,
            author: comment.created_by_name ||
              comment.created_by?.full_name ||
              comment.created_by?.username ||
              `${comment.created_by?.first_name || ''} ${comment.created_by?.last_name || ''}`.trim() ||
              'Unknown User',
            date: formatCommentDate(comment.created_at),
            content: comment.content,
            comment_type: comment.comment_type || 'comment',
            is_resolved: comment.is_resolved || false,
            page_number: comment.page_number,
            position_x: comment.position_x,
            position_y: comment.position_y,
            icon: getCommentIcon(comment.comment_type),
            created_by: comment.created_by,
            created_by_name: comment.created_by_name,
            created_by_initials: comment.created_by_initials
          }));

          setComments(transformedComments);
        } else {
          setComments([]);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast.error(handleAPIError(error) || 'Failed to load comments');
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [documentId]);

  // Create a new comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !documentId) return;

    try {
      setAddingComment(true);
      const commentData = {
        comment_type: 'comment', // Default to comment, can be changed later
        content: newComment.trim()
      };

      const response = await firmAdminDocumentsAPI.createComment(documentId, commentData);

      if (response.success && response.data) {
        const newCommentData = response.data;
        const transformedComment = {
          id: newCommentData.id,
          author: newCommentData.created_by_name ||
            newCommentData.created_by?.full_name ||
            newCommentData.created_by?.username ||
            `${newCommentData.created_by?.first_name || ''} ${newCommentData.created_by?.last_name || ''}`.trim() ||
            'You',
          date: formatCommentDate(newCommentData.created_at),
          content: newCommentData.content,
          comment_type: newCommentData.comment_type || 'comment',
          is_resolved: newCommentData.is_resolved || false,
          page_number: newCommentData.page_number,
          position_x: newCommentData.position_x,
          position_y: newCommentData.position_y,
          icon: getCommentIcon(newCommentData.comment_type),
          created_by: newCommentData.created_by,
          created_by_name: newCommentData.created_by_name,
          created_by_initials: newCommentData.created_by_initials
        };

        setComments(prev => [transformedComment, ...prev]);
        setNewComment('');
        toast.success('Comment added successfully');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(handleAPIError(error) || 'Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  // Update a comment (mark as resolved/unresolved)
  const handleUpdateComment = async (commentId, updates) => {
    try {
      const response = await firmAdminDocumentsAPI.updateComment(commentId, updates);

      if (response.success && response.data) {
        const updatedComment = response.data;
        setComments(prev => prev.map(comment =>
          comment.id === commentId
            ? {
              ...comment,
              ...updates,
              is_resolved: updatedComment.is_resolved !== undefined ? updatedComment.is_resolved : comment.is_resolved,
              content: updatedComment.content || comment.content
            }
            : comment
        ));
        toast.success('Comment updated successfully');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error(handleAPIError(error) || 'Failed to update comment');
    }
  };

  // Delete a comment
  const handleDeleteComment = async (commentId) => {
    try {
      const response = await firmAdminDocumentsAPI.deleteComment(commentId);

      if (response.success || response.status === 204) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        setDeleteConfirmId(null);
        toast.success('Comment deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(handleAPIError(error) || 'Failed to delete comment');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Back arrow icon
  const BackArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 12L6 8L10 4" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="p-6 bg-[rgb(243,247,255)] min-h-screen" style={{ fontFamily: 'BasisGrotesquePro' }}>
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
        >
          <BackArrowIcon />
          <span>Back</span>
        </button>
      </div>

      {/* Loading State */}
      {loadingDocument && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Loading document...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {documentError && !loadingDocument && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-[BasisGrotesquePro]">{documentError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-[BasisGrotesquePro]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Document Content */}
      {!loadingDocument && !documentError && documentData && (
        <>
      {/* Top Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h5 className="text-xl font-medium text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
            {documentData.name}
          </h5>
          <div className="flex items-center gap-2 text-sm" style={{ fontFamily: 'BasisGrotesquePro' }}>
            <span className="text-gray-600">{documentData.type}</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              documentData.status?.toLowerCase().includes('approved') ? 'bg-green-500 text-white' :
              documentData.status?.toLowerCase().includes('reviewed') ? 'bg-blue-800 text-white' :
              documentData.status?.toLowerCase().includes('pending') ? 'bg-amber-400 text-gray-900' :
              'bg-gray-500 text-white'
              }`} style={{ fontFamily: 'BasisGrotesquePro' }}>
              {formatStatus(documentData.status)}
            </span>
            <span className="text-gray-600">{formatFileSize(documentData.size)}</span>
          </div>
        </div>
       
      </div>

      {/* Document Metadata */}
      <div className="mb-6">
        <div className="grid grid-cols-4 gap-4">
          {/* Client Card */}
          <div className="bg-white rounded-lg p-5 relative">
            <div className="absolute top-4 right-4">
              <PdfProfileIcon />
            </div>
            <p className="text-sm text-gray-500 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Client
            </p>
            <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
              {documentData.client}
            </p>
          </div>

          {/* Assigned To Card */}
          <div className="bg-white rounded-lg p-5 relative">
            <div className="absolute top-4 right-4">
              <PdfProfileIcon />
            </div>
            <p className="text-sm text-gray-500 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Assigned To
            </p>
            <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
              {documentData.assignedTo}
            </p>
          </div>

          {/* Upload Date Card */}
          <div className="bg-white rounded-lg p-5 relative">
            <div className="absolute top-4 right-4">
              <PdfCalendarIcon />
            </div>
            <p className="text-sm text-gray-500 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Upload Date
            </p>
            <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
              {documentData.uploadDate}
            </p>
          </div>

          {/* Version Card */}
          <div className="bg-white rounded-lg p-5 relative">
            <div className="absolute top-4 right-4">
              <PdfDocumentIconLight />
            </div>
            <p className="text-sm text-gray-500 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Version
            </p>
            <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
              {documentData.version}
            </p>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Main Content Area */}
      {!loadingDocument && !documentError && documentData && (
      <div className="flex gap-6 bg-white">
        {/* Left Column - Document Preview */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h5 className="text-lg font-medium text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
              {documentData.name}
            </h5>
          </div>

          <div className="flex border border-gray-200 rounded-lg overflow-hidden" style={{ height: '700px' }}>
            {/* Thumbnails Sidebar */}
            {pdfFileData && numPages > 0 && (
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
                          borderWidth: selectedPage === index ? '2px' : '1px',
                          borderColor: selectedPage === index ? '#3B82F6' : '#D1D5DB',
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
              ) : pdfFileData ? (
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
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                          <p className="text-sm text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Loading PDF...
                          </p>
                        </div>
                      }
                      options={pdfOptions}
                      className="w-full"
                    >
                      {numPages && Array.from(new Array(numPages), (el, index) => (
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
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-sm text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Loading PDF...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Comments & Notes */}
        <div className="w-96 bg-white rounded-lg shadow-sm p-6 flex flex-col border border-blue-[#3AD6F2]">
          <h5 className="text-xl font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
            Comments & Notes
          </h5>
          <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'BasisGrotesquePro' }}>
            Communication history for this document
          </p>

          <div className="flex-1 max-h-[600px] overflow-auto space-y-4 mb-4 pr-2">
            {loadingComments ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500 text-sm" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Loading comments...
                </div>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500 text-sm" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  No comments yet. Be the first to comment!
                </div>
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`bg-gray-50 p-4 rounded-lg border ${comment.is_resolved ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="text-gray-600 flex-shrink-0">
                        {comment.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-800 text-sm" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            {comment.author}
                          </span>
                          <span className="text-gray-500 text-xs" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            {comment.date}
                          </span>
                          {comment.comment_type && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              {comment.comment_type}
                            </span>
                          )}
                          {comment.is_resolved && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {!comment.is_resolved && (
                        <button
                          onClick={() => handleUpdateComment(comment.id, { is_resolved: true })}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-green-600"
                          title="Mark as resolved"
                        >
                          <PdfCheckmarkIcon />
                        </button>
                      )}
                      {comment.is_resolved && (
                        <button
                          onClick={() => handleUpdateComment(comment.id, { is_resolved: false })}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-600"
                          title="Mark as unresolved"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 8L6 10L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                      {deleteConfirmId === comment.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            style={{ fontFamily: 'BasisGrotesquePro' }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                            style={{ fontFamily: 'BasisGrotesquePro' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(comment.id)}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-red-600"
                          title="Delete comment"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm ${comment.is_resolved ? 'text-gray-500 line-through' : 'text-gray-700'}`} style={{ fontFamily: 'BasisGrotesquePro' }}>
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Section */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm flex-shrink-0" style={{ fontFamily: 'BasisGrotesquePro' }}>
                MC
              </div>
              <textarea
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm resize-none"
                rows="3"
                placeholder="Add a comment or note..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ fontFamily: 'BasisGrotesquePro' }}
              />
            </div>
            <button
              onClick={handleAddComment}
              disabled={addingComment || !newComment.trim()}
              className="w-fit flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
            >
              {addingComment ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <PdfPaperPlaneIcon />
                  <span>Add Comment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

