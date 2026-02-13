import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminClientsAPI } from '../../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { Modal } from 'react-bootstrap';
import { FaDownload, FaEdit, FaTrash, FaEllipsisV } from 'react-icons/fa';
import ClientDocumentUploadModal from './ClientDocumentUploadModal';
import DocumentDetailsModal from './DocumentDetailsModal';

export default function DocumentsTab({ client }) {
  const navigate = useNavigate();
  const API_BASE_URL = getApiBaseUrl();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState(null); // null means root
  const [documentsData, setDocumentsData] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [viewingPDF, setViewingPDF] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToRename, setDocumentToRename] = useState(null);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch documents from API
  const fetchDocuments = useCallback(async (folderId = null) => {
    if (!client?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = getAccessToken();
      const url = `${API_BASE_URL}/taxpayer/firm-admin/clients/${client.id}/documents/browse/${folderId ? `?folder_id=${folderId}` : ''}`;

      const response = await fetchWithCors(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setDocumentsData(result.data);
      } else {
        setDocumentsData(null);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load documents. Please try again.');
      setDocumentsData(null);
    } finally {
      setLoading(false);
    }
  }, [client?.id, API_BASE_URL]);

  // Fetch documents on mount and when folder changes
  useEffect(() => {
    fetchDocuments(currentFolderId);
  }, [fetchDocuments, currentFolderId]);

  // Handle folder click - navigate to folder
  const handleFolderClick = (folderId) => {
    setCurrentFolderId(folderId);
    setSelectedCard(folderId);
  };

  // Handle breadcrumb click
  const handleBreadcrumbClick = (breadcrumb) => {
    if (breadcrumb.id === null) {
      setCurrentFolderId(null);
    } else {
      setCurrentFolderId(breadcrumb.id);
    }
    setSelectedCard(null);
    setCurrentPage(1); // Reset to page 1 when navigating
  };

  // Reset to page 1 when folder changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentFolderId]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuIndex !== null && !event.target.closest('.position-relative')) {
        setOpenMenuIndex(null);
      }
    };

    if (openMenuIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuIndex]);

  const handleDownload = (doc) => {
    const fileUrl = doc.file_url || '';
    if (!fileUrl) {
      toast.error("Download link unavailable for this document.", {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = doc.file_name || 'document';
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRename = (doc) => {
    setDocumentToRename(doc);
    setNewDocumentName(doc.file_name || '');
    setShowRenameModal(true);
    setOpenMenuIndex(null);
  };

  const handleDelete = (doc) => {
    setDocumentToDelete(doc);
    setShowDeleteModal(true);
    setOpenMenuIndex(null);
  };

  const confirmRename = async () => {
    if (!documentToRename || !newDocumentName.trim() || !client?.id) {
      toast.error("Please enter a valid document name", {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    setRenaming(true);
    try {
      const documentId = documentToRename.id;
      const response = await firmAdminClientsAPI.updateClientDocument(client.id, documentId, {
        file_name: newDocumentName.trim()
      });

      if (response.success) {
        toast.success('Document renamed successfully!', {
          position: 'top-right',
          autoClose: 3000
        });
        setShowRenameModal(false);
        setDocumentToRename(null);
        setNewDocumentName("");
        fetchDocuments(currentFolderId);
      } else {
        throw new Error(response.message || 'Failed to rename document');
      }
    } catch (error) {
      console.error('Error renaming document:', error);
      toast.error(handleAPIError(error) || 'Failed to rename document', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setRenaming(false);
    }
  };

  const confirmDelete = async () => {
    if (!documentToDelete || !client?.id) return;

    setDeleting(true);
    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const documentId = documentToDelete.id;
      const url = `${API_BASE_URL}/firm/clients/${client.id}/documents/${documentId}/`;

      const config = {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      };

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      toast.success('Document deleted successfully!', {
        position: 'top-right',
        autoClose: 3000
      });
      setShowDeleteModal(false);
      setDocumentToDelete(null);
      fetchDocuments(currentFolderId);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(handleAPIError(error) || 'Failed to delete document', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setDeleting(false);
    }
  };

  // Get file icon based on extension
  const getFileIcon = (extension) => {
    const ext = extension?.toLowerCase() || '';
    if (['pdf'].includes(ext)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M14 2V8H20" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M14 2V8H20" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
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
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Quick update document status
  const handleQuickStatusUpdate = async (documentId, status) => {
    if (!client?.id) return;

    try {
      const response = await firmAdminClientsAPI.updateClientDocument(client.id, documentId, { status });
      if (response.success) {
        toast.success(`Document marked as ${status.replace('_', ' ')}`, {
          position: 'top-right',
          autoClose: 3000
        });
        fetchDocuments(currentFolderId);
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error(handleAPIError(error) || 'Failed to update document status', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!client?.id) {
      toast.error('Client ID is required', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      setDownloadingPDF(true);
      const blob = await firmAdminClientsAPI.getClientDataEntryFormPDF(client.id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `client_data_entry_form_${client.id}_${client.name || 'client'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully', {
        position: 'top-right',
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg || 'Failed to download PDF. Please try again.', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Handle PDF view in new tab
  const handleViewPDF = async () => {
    if (!client?.id) {
      toast.error('Client ID is required', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      setViewingPDF(true);
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get PDF URL with authentication
      const pdfUrl = `${API_BASE_URL}/firm/clients/${client.id}/data-entry-form-pdf/`;

      // Fetch PDF with authentication headers
      const response = await fetchWithCors(pdfUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      // Create blob URL and open in new tab
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');

      if (newWindow) {
        // Clean up URL after a delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      } else {
        // If popup blocked, fallback to download
        const link = document.createElement('a');
        link.href = url;
        link.download = `client_data_entry_form_${client.id}_${client.name || 'client'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.info('Popup blocked. PDF downloaded instead.', {
          position: 'top-right',
          autoClose: 3000
        });
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg || 'Failed to view PDF. Please try again.', {
        position: 'top-right',
        autoClose: 5000
      });
    } finally {
      setViewingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!documentsData) {
    return (
      <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
        <div className="text-center py-12">
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">No documents found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            {currentFolderId && (
              <button
                onClick={() => {
                  if (documentsData?.parent_folder?.id === null) {
                    setCurrentFolderId(null);
                  } else if (documentsData?.current_folder?.parent_id) {
                    setCurrentFolderId(documentsData.current_folder.parent_id);
                  } else {
                    setCurrentFolderId(null);
                  }
                  setSelectedCard(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
                style={{ borderRadius: "10px" }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </button>
            )}
            <h5 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">Documents</h5>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors font-[BasisGrotesquePro]"
              style={{ borderRadius: '12px' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Upload Documents
            </button>
            <button
              onClick={handleViewPDF}
              disabled={viewingPDF || downloadingPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#3AD6F2] bg-white border border-[#3AD6F2] rounded-lg hover:bg-blue-50 transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: '12px' }}
            >
              {viewingPDF ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#3AD6F2]"></div>
                  Opening...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V12C4 12.5304 4.21071 13.0391 4.58579 13.4142C4.96086 13.7893 5.46957 14 6 14H14C14.5304 14 15.0391 13.7893 15.4142 13.4142C15.7893 13.0391 16 12.5304 16 12V4C16 3.46957 15.7893 2.96086 15.4142 2.58579C15.0391 2.21071 14.5304 2 14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <path d="M6 6H10M6 8H10M6 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  View Signed Form PDF
                </>
              )}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF || viewingPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: '12px' }}
            >
              {downloadingPDF ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V12C4 12.5304 4.21071 13.0391 4.58579 13.4142C4.96086 13.7893 5.46957 14 6 14H14C14.5304 14 15.0391 13.7893 15.4142 13.4142C15.7893 13.0391 16 12.5304 16 12V4C16 3.46957 15.7893 2.96086 15.4142 2.58579C15.0391 2.21071 14.5304 2 14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <path d="M10 6V10M8 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Client documents and supporting materials</p>
      </div>

      {/* Breadcrumbs */}
      {documentsData.breadcrumbs && documentsData.breadcrumbs.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          {documentsData.breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.id || 'root'}>
              {index > 0 && <span className="text-gray-400">/</span>}
              <button
                onClick={() => handleBreadcrumbClick(breadcrumb)}
                className={`text-sm font-[BasisGrotesquePro] ${index === documentsData.breadcrumbs.length - 1
                  ? 'text-gray-900 font-semibold'
                  : 'text-blue-600 hover:text-blue-800 cursor-pointer'
                  }`}
              >
                {breadcrumb.title}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Folders Grid */}
      {documentsData.folders && documentsData.folders.length > 0 && (
        <div className="mb-6">
          <h6 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-4">Folders</h6>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentsData.folders.map((folder) => {
              const isSelected = selectedCard === folder.id;
              return (
                <div
                  key={folder.id}
                  onClick={() => handleFolderClick(folder.id)}
                  className={`!rounded-lg p-6 cursor-pointer transition-colors ${isSelected
                    ? 'bg-[#FFF4E6] !border border-[#F49C2D]'
                    : 'bg-white !border border-[#E8F0FF] hover:border-[#F49C2D]'
                    }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {/* Folder Icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M3 7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L12.7071 7.70711C12.8946 7.89464 13.149 8 13.4142 8H19C20.1046 8 21 8.89543 21 10V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z"
                        fill="#FBBF24"
                        stroke="#FBBF24"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-nowrap">
                        <h6 className="text-base font-bold text-gray-900 font-[BasisGrotesquePro] whitespace-nowrap">{folder.title}</h6>
                        {folder.is_template && (
                          <span className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-[#FFFFFF] !border border-[#E8F0FF] !rounded-lg font-[BasisGrotesquePro] whitespace-nowrap flex-shrink-0">
                            Template
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">{folder.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                      {folder.document_count || 0} Documents
                      {folder.subfolder_count > 0 && `, ${folder.subfolder_count} Folders`}
                    </span>
                    <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                      {folder.last_modified ? formatDate(folder.last_modified) : 'N/A'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Documents List */}
      {documentsData.documents && documentsData.documents.length > 0 && (
        <div>
          <h6 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-4">Documents</h6>
          {(() => {
            const totalPages = Math.ceil(documentsData.documents.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedDocuments = documentsData.documents.slice(startIndex, endIndex);
            const showPagination = documentsData.documents.length > itemsPerPage;

            return (
              <>
                <div className="space-y-3">
                  {paginatedDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center gap-4 p-4 bg-white !border border-[#E8F0FF] !rounded-lg hover:border-[#F49C2D] transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {getFileIcon(document.file_extension)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h6 className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro] truncate">
                            {document.file_name}
                          </h6>
                          {document.status && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(document.status)}`}>
                              {document.status_display || document.status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 font-[BasisGrotesquePro] flex-wrap">
                          <span>{document.file_size_formatted || 'N/A'}</span>
                          <span>{document.category?.name || 'Uncategorized'}</span>
                          <span>{document.created_at_formatted || formatDate(document.created_at)}</span>
                        </div>
                        {document.tags && document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {document.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded font-[BasisGrotesquePro]"
                              >
                                {tag}
                              </span>
                            ))}
                            {document.tags.length > 3 && (
                              <span className="px-1.5 py-0.5 text-xs font-medium text-gray-500 font-[BasisGrotesquePro]">
                                +{document.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
                        {/* Quick Actions - Show only if not already reviewed/compliant */}
                        {document.status !== 'reviewed' && document.status !== 'compliant' && (
                          <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickStatusUpdate(document.id, 'reviewed');
                              }}
                              className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors font-[BasisGrotesquePro]"
                              title="Mark as Reviewed"
                            >
                              ✓ Reviewed
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickStatusUpdate(document.id, 'compliant');
                              }}
                              className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors font-[BasisGrotesquePro]"
                              title="Mark as Compliant"
                            >
                              ✓ Compliant
                            </button>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocumentId(document.id);
                            setShowDetailsModal(true);
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-[#F56D2D] bg-orange-50 border border-orange-200 !rounded-lg hover:bg-orange-100 transition-colors font-[BasisGrotesquePro]"
                          title="View details and comments"
                        >
                          Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(document.file_url, '_blank');
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 !rounded-lg hover:bg-blue-100 transition-colors font-[BasisGrotesquePro]"
                        >
                          View PDF
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(document);
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 !rounded-lg hover:bg-gray-100 transition-colors font-[BasisGrotesquePro]"
                          title="Download"
                        >
                          <FaDownload size={14} />
                        </button>
                        <div className="position-relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuIndex(openMenuIndex === document.id ? null : document.id);
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 !rounded-lg hover:bg-gray-100 transition-colors font-[BasisGrotesquePro]"
                            title="More options"
                          >
                            <FaEllipsisV size={14} />
                          </button>
                          {openMenuIndex === document.id && (
                            <div
                              className="position-absolute bg-white border rounded shadow-lg"
                              style={{
                                right: 0,
                                top: '100%',
                                zIndex: 1000,
                                minWidth: '150px',
                                marginTop: '4px'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="btn  w-100 text-start d-flex align-items-center gap-2"
                                style={{ border: 'none', borderRadius: 0 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRename(document);
                                }}
                              >
                                <FaEdit /> Rename
                              </button>
                              <button
                                className="btn  w-100 text-start d-flex align-items-center gap-2 text-danger"
                                style={{ border: 'none', borderRadius: 0 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(document);
                                }}
                              >
                                <FaTrash /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {showPagination && (
                  <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                      Showing {startIndex + 1} to {Math.min(endIndex, documentsData.documents.length)} of {documentsData.documents.length} documents
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg font-[BasisGrotesquePro] ${currentPage === page
                                  ? 'bg-[#F56D2D] text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                  }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <span key={page} className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Empty State */}
      {(!documentsData.folders || documentsData.folders.length === 0) &&
        (!documentsData.documents || documentsData.documents.length === 0) && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-4">No folders or documents found</p>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{ borderRadius: '10px' }}
              className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors font-[BasisGrotesquePro]"
            >
              Upload Documents
            </button>
          </div>
        )}

      {/* Upload Modal */}
      <ClientDocumentUploadModal
        show={showUploadModal}
        handleClose={() => setShowUploadModal(false)}
        clientId={client?.id}
        currentFolderId={currentFolderId}
        onUploadSuccess={() => {
          fetchDocuments(currentFolderId);
        }}
      />

      {/* Document Details Modal */}
      <DocumentDetailsModal
        show={showDetailsModal}
        handleClose={() => {
          setShowDetailsModal(false);
          setSelectedDocumentId(null);
        }}
        clientId={client?.id}
        documentId={selectedDocumentId}
        onUpdate={() => {
          fetchDocuments(currentFolderId);
        }}
      />

      {/* Rename Modal */}
      <Modal show={showRenameModal} onHide={() => {
        setShowRenameModal(false);
        setDocumentToRename(null);
        setNewDocumentName("");
      }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Rename Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Document Name</label>
            <input
              type="text"
              className="form-control"
              value={newDocumentName}
              onChange={(e) => setNewDocumentName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  confirmRename();
                }
              }}
              autoFocus
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowRenameModal(false);
              setDocumentToRename(null);
              setNewDocumentName("");
            }}
            disabled={renaming}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={confirmRename}
            disabled={renaming || !newDocumentName.trim()}
            style={{ backgroundColor: "#F56D2D", border: "none" }}
          >
            {renaming ? 'Renaming...' : 'Rename'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => {
        setShowDeleteModal(false);
        setDocumentToDelete(null);
      }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete "{documentToDelete ? (documentToDelete.file_name || 'this document') : ''}"? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setDocumentToDelete(null);
            }}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
