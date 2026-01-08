import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { firmAdminClientsAPI, firmAdminDocumentsAPI, handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';

export default function DocumentDetailsModal({ show, handleClose, clientId, documentId, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [editForm, setEditForm] = useState({
    status: '',
    category_id: null,
    folder_id: null,
    tags: ''
  });

  // Fetch categories and folders for edit form
  useEffect(() => {
    const fetchEditOptions = async () => {
      if (!show) return;

      try {
        // Fetch categories
        const categoriesResult = await firmAdminDocumentsAPI.listCategories();
        let categoriesList = [];
        if (categoriesResult.success && categoriesResult.data && Array.isArray(categoriesResult.data)) {
          categoriesList = categoriesResult.data;
        } else if (Array.isArray(categoriesResult)) {
          categoriesList = categoriesResult;
        }
        setCategories(categoriesList.filter(cat => cat.is_active !== false));

        // Fetch folders
        const foldersResult = await firmAdminDocumentsAPI.listFoldersWithSync();
        let foldersList = [];
        if (foldersResult.folders && Array.isArray(foldersResult.folders)) {
          foldersList = foldersResult.folders;
        } else if (foldersResult.success && foldersResult.data && Array.isArray(foldersResult.data.folders)) {
          foldersList = foldersResult.data.folders;
        }
        setFolders(foldersList);
      } catch (error) {
        console.error('Error fetching edit options:', error);
      }
    };

    fetchEditOptions();
  }, [show]);

  // Fetch document details and comments
  useEffect(() => {
    const fetchData = async () => {
      if (!show || !clientId || !documentId) return;

      try {
        setLoading(true);
        
        // Fetch document details
        const docResponse = await firmAdminClientsAPI.getClientDocumentDetails(clientId, documentId);
        if (docResponse.success && docResponse.data) {
          const doc = docResponse.data;
          setDocument(doc);
          // Initialize edit form
          setEditForm({
            status: doc.status || '',
            category_id: doc.category?.id || null,
            folder_id: doc.folder?.id || null,
            tags: doc.tags ? doc.tags.join(', ') : ''
          });
        }

        // Fetch comments
        setLoadingComments(true);
        const commentsResponse = await firmAdminDocumentsAPI.getComments(documentId);
        if (commentsResponse.success && commentsResponse.data) {
          const commentsList = Array.isArray(commentsResponse.data) 
            ? commentsResponse.data 
            : (commentsResponse.data.comments || []);
          setComments(commentsList);
        }
      } catch (error) {
        console.error('Error fetching document details:', error);
        toast.error(handleAPIError(error) || 'Failed to load document details', {
          position: 'top-right',
          autoClose: 3000
        });
      } finally {
        setLoading(false);
        setLoadingComments(false);
      }
    };

    fetchData();
  }, [show, clientId, documentId]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Format comment date
  const formatCommentDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return dateString;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'reviewed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'compliant':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'need_clarification':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'pending_sign':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'processed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !documentId) return;

    try {
      setAddingComment(true);
      const commentData = {
        comment_type: 'comment',
        content: newComment.trim()
      };

      const response = await firmAdminDocumentsAPI.createComment(documentId, commentData);

      if (response.success && response.data) {
        setComments(prev => [response.data, ...prev]);
        setNewComment('');
        toast.success('Comment added successfully', {
          position: 'top-right',
          autoClose: 3000
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(handleAPIError(error) || 'Failed to add comment', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setAddingComment(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await firmAdminDocumentsAPI.deleteComment(commentId);
      if (response.success || response.status === 204) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast.success('Comment deleted successfully', {
          position: 'top-right',
          autoClose: 3000
        });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(handleAPIError(error) || 'Failed to delete comment', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  // Get user initials
  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Handle save document update
  const handleSaveUpdate = async () => {
    if (!clientId || !documentId) return;

    try {
      setSaving(true);

      const updateData = {
        status: editForm.status || null,
        category_id: editForm.category_id || null,
        folder_id: editForm.folder_id || null,
        tags: editForm.tags.trim() 
          ? editForm.tags.split(',').map(t => t.trim()).filter(t => t)
          : []
      };

      const response = await firmAdminClientsAPI.updateClientDocument(clientId, documentId, updateData);

      if (response.success && response.data) {
        setDocument(response.data);
        setIsEditMode(false);
        toast.success('Document updated successfully', {
          position: 'top-right',
          autoClose: 3000
        });
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error(handleAPIError(error) || 'Failed to update document', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setSaving(false);
    }
  };

  // Status options
  const statusOptions = [
    { value: 'pending_sign', label: 'Pending Sign' },
    { value: 'processed', label: 'Processed' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'need_clarification', label: 'Need Clarification' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'compliant', label: 'Compliant' }
  ];

  if (!show) return null;

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" className="document-details-modal">
      <Modal.Header closeButton className="border-b border-gray-200">
        <Modal.Title className="font-[BasisGrotesquePro] font-semibold text-lg">
          Document Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : document ? (
          <div className="p-6">
            {/* Document Info Section */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <path d="M14 2V8H20" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-lg font-semibold text-gray-900 mb-2 font-[BasisGrotesquePro] truncate">
                    {document.file_name}
                  </h5>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 font-[BasisGrotesquePro]">
                    <span>{document.file_size_formatted || 'N/A'}</span>
                    <span>•</span>
                    <span>{formatDate(document.created_at)}</span>
                    {document.status && (
                      <>
                        <span>•</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(document.status)}`}>
                          {document.status_display || document.status}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <a
                  href={document.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-[BasisGrotesquePro]"
                >
                  View PDF
                </a>
              </div>

              {/* Metadata / Edit Form */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h6 className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro]">
                    Document Information
                  </h6>
                  {!isEditMode && (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="px-3 py-1.5 text-sm font-medium text-[#F56D2D] bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors font-[BasisGrotesquePro] flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Edit
                    </button>
                  )}
                </div>

                {isEditMode ? (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                        Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-[BasisGrotesquePro]"
                      >
                        <option value="">Select Status</option>
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                        Category
                      </label>
                      <select
                        value={editForm.category_id || ''}
                        onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-[BasisGrotesquePro]"
                      >
                        <option value="">No Category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Folder */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                        Folder
                      </label>
                      <select
                        value={editForm.folder_id || ''}
                        onChange={(e) => setEditForm({ ...editForm, folder_id: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-[BasisGrotesquePro]"
                      >
                        <option value="">Root Folder</option>
                        {folders.map(folder => (
                          <option key={folder.id} value={folder.id}>
                            {folder.title || folder.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                        Tags
                      </label>
                      <input
                        type="text"
                        value={editForm.tags}
                        onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                        placeholder="Enter tags separated by commas (e.g., urgent, w2, tax-return-2024)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-[BasisGrotesquePro]"
                      />
                      <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
                        Separate multiple tags with commas
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => {
                          setIsEditMode(false);
                          // Reset form to original values
                          if (document) {
                            setEditForm({
                              status: document.status || '',
                              category_id: document.category?.id || null,
                              folder_id: document.folder?.id || null,
                              tags: document.tags ? document.tags.join(', ') : ''
                            });
                          }
                        }}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveUpdate}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {saving ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Category</p>
                      <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                        {document.category?.name || 'Uncategorized'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Folder</p>
                      <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                        {document.folder?.title || 'Root'}
                      </p>
                    </div>
                    {document.tags && document.tags.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {document.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded font-[BasisGrotesquePro]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {document.reviewed_at && (
                      <div>
                        <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Reviewed</p>
                        <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                          {formatDate(document.reviewed_at)}
                          {document.reviewed_by_name && ` by ${document.reviewed_by_name}`}
                        </p>
                      </div>
                    )}
                    {document.compliant_at && (
                      <div>
                        <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Compliant</p>
                        <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                          {formatDate(document.compliant_at)}
                          {document.compliant_by_name && ` by ${document.compliant_by_name}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <h6 className="text-base font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">
                Comments ({comments.length})
              </h6>

              {/* Comments List */}
              <div className="max-h-96 overflow-y-auto space-y-3 mb-4 pr-2">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500 text-sm font-[BasisGrotesquePro]">Loading comments...</div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500 text-sm font-[BasisGrotesquePro]">
                      No comments yet. Be the first to comment!
                    </div>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium text-xs flex-shrink-0 font-[BasisGrotesquePro]">
                            {getUserInitials(comment.created_by_name || comment.created_by?.full_name || 'User')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                              {comment.created_by_name || comment.created_by?.full_name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                              {formatCommentDate(comment.created_at)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete comment"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 font-[BasisGrotesquePro] whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-start gap-3">
                  <textarea
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none font-[BasisGrotesquePro]"
                    rows="3"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleAddComment();
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                    Press Ctrl+Enter or Cmd+Enter to submit
                  </p>
                  <button
                    onClick={handleAddComment}
                    disabled={addingComment || !newComment.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {addingComment ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      'Add Comment'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500 font-[BasisGrotesquePro]">Failed to load document details</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-t border-gray-200">
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
        >
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
}

