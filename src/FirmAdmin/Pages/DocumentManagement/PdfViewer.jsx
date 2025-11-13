import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PdfCalendarIcon, PdfCheckmarkIcon, PdfDocumentIcon, PdfDocumentIconLight, PdfEditIcon, PdfPaperPlaneIcon, PdfProfileIcon } from '../../Components/icons';
import { firmAdminDocumentsAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

// Icons
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 8C1 8 3.66667 3 8 3C12.3333 3 15 8 15 8C15 8 12.3333 13 8 13C3.66667 13 1 8 1 8Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10M5.33333 6.66667L8 10M8 10L10.6667 6.66667M8 10V2" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.3333 13.6667C13.3333 11.3131 11.3536 9.33333 8.99996 9.33333C6.6463 9.33333 4.66663 11.3131 4.66663 13.6667M11.6666 4.66667C11.6666 6.13893 10.4389 7.33333 8.99996 7.33333C7.56109 7.33333 6.33329 6.13893 6.33329 4.66667C6.33329 3.1944 7.56109 2 8.99996 2C10.4389 2 11.6666 3.1944 11.6666 4.66667Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function PdfViewer() {
  const { folderId, documentId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Details');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Document data mapping based on documentId - matching FolderContents documents
  const documentDataMap = {
    '1': {
      name: '2023_Tax_Return_John_Smith.Pdf',
      type: 'Tax Return',
      status: 'Reviewed',
      size: '2.4MB',
      client: 'John Smith',
      assignedTo: 'Michael Chen',
      uploadDate: '2024-03-15',
      version: 'v1.2',
    },
    '2': {
      name: 'W2_Smith_Corp_2023.Pdf',
      type: 'W-2 Form',
      status: 'Reviewed',
      size: '1.2 MB',
      client: 'Smith Corporation',
      assignedTo: 'Sarah Martinez',
      uploadDate: '2024-03-15',
      version: 'v1.0',
    },
    '3': {
      name: 'Receipt_Office_Supplies.Jpg',
      type: 'Receipt',
      status: 'Pending',
      size: '856 KB',
      client: 'Wilson Enterprises',
      assignedTo: 'David Rodriguez',
      uploadDate: '2024-03-15',
      version: 'v1.0',
    },
    '4': {
      name: '1099_Davis_Inc_2023.Pdf',
      type: '1099 Form',
      status: 'Approved',
      size: '945 KB',
      client: 'Davis Inc',
      assignedTo: 'Lisa Thompson',
      uploadDate: '2024-03-15',
      version: 'v1.1',
    },
  };

  const documentData = documentDataMap[documentId] || {
    name: 'Document.pdf',
    type: 'Document',
    status: 'Pending',
    size: '1.0MB',
    client: 'Client',
    assignedTo: 'User',
    uploadDate: '2024-03-15',
    version: 'v1.0',
  };

  // Dummy PDF URL - using a sample PDF that can be displayed
  const pdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

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
      <path d="M10 12L6 8L10 4" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

      {/* Top Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h5 className="text-xl font-medium text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
            {documentData.name}
          </h5>
          <div className="flex items-center gap-2 text-sm" style={{ fontFamily: 'BasisGrotesquePro' }}>
            <span className="text-gray-600">{documentData.type}</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              documentData.status === 'Reviewed' ? 'bg-blue-800 text-white' : 
              documentData.status === 'Approved' ? 'bg-green-500 text-white' : 
              'bg-amber-400 text-gray-900'
            }`} style={{ fontFamily: 'BasisGrotesquePro' }}>
              {documentData.status}
            </span>
            <span className="text-gray-600">{documentData.size}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
            <EyeIcon />
            <span>Preview</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
            <DownloadIcon />
            <span>Download</span>
        </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm text-sm font-medium" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
            <PdfEditIcon />
            <span>Edit</span>
          </button>
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

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex gap-1 bg-white rounded-lg p-1 w-fit border border-blue-50">
          <button
            onClick={() => setActiveTab('Details')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'Details'
                ? 'text-white bg-[#3AD6F2] rounded-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('Versions')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'Versions'
                ? 'text-white bg-[#3AD6F2] rounded-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
          >
            Versions
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'Details' ? (
        <div className="flex gap-6 bg-white">
          {/* Left Column - Document Preview */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-lg font-medium text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                {documentData.name}
              </h5>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  <EyeIcon />
                  <span>Preview</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  <DownloadIcon />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="flex border border-gray-200 rounded-lg overflow-hidden" style={{ height: '700px' }}>
              {/* Thumbnails Sidebar */}
              {/* <div className="w-20 bg-gray-50 p-2 overflow-y-auto border-r border-gray-200">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-full h-24 mb-2 bg-white border ${i === 0 ? 'border-blue-500' : 'border-gray-200'} rounded flex items-center justify-center text-gray-400 text-xs cursor-pointer hover:border-blue-300 transition-colors`}
                    style={{ fontFamily: 'BasisGrotesquePro' }}
                  >
                  </div>
                ))}
              </div> */}
              {/* Main PDF Viewer */}
              <div className="flex-1 bg-gray-100">
                <iframe
                  src={pdfUrl}
                  width="100%"
                  height="100%"
                  className="border-none"
                  title="Document Preview"
                />
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
                              <path d="M4 8L6 10L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
      ) : (
        /* Versions Tab Content */
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h5 className="text-2xl font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
            Version History
          </h5>
          <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: 'BasisGrotesquePro' }}>
            Track all changes and versions of this document
          </p>

          <div className="space-y-4">
            {/* Version 1.2 */}
            <div className="flex items-start gap-4 p-4  rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex-shrink-0 bg-gray-100 rounded-lg p-2">
                <PdfDocumentIconLight />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h6 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Version 1.2
                  </h6>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Current
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Final review and corrections applied
                </p>
                <p className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  2024-03-16 - Uploaded by Michael Chen
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 hover:border-blue-300 rounded transition-colors border border-blue-300">
                  <EyeIcon />
                </button>
                <button className="p-2 hover:border-blue-300 rounded transition-colors border border-blue-300">
                  <DownloadIcon />
                </button>
              </div>
            </div>

            {/* Version 1.1 */}
            <div className="flex items-start gap-4 p-4  rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex-shrink-0 bg-gray-100 rounded-lg p-2">
                <PdfDocumentIconLight />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h6 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Version 1.1
                  </h6>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Archived
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Added missing Schedule C information
                </p>
                <p className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  2024-03-15 - Uploaded by John Smith
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 rounded transition-colors border border-blue-300">
                  <EyeIcon />
                </button>
                <button className="p-2  rounded transition-colors border border-blue-300">
                  <DownloadIcon />
                </button>
              </div>
            </div>

            {/* Version 1.0 */}
            <div className="flex items-start gap-4 p-4 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex-shrink-0 bg-gray-100 rounded-lg p-2">
                <PdfDocumentIconLight />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h6 className="text-sm font-semibold text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Version 1.0
                  </h6>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Archived
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Initial document upload
                </p>
                <p className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  2024-03-10 - Uploaded by John Smith
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded transition-colors border border-blue-300">
                  <EyeIcon />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded transition-colors border border-blue-300">
                  <DownloadIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

