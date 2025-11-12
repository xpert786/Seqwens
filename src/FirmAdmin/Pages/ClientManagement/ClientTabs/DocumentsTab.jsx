import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';

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

  // Get file icon based on extension
  const getFileIcon = (extension) => {
    const ext = extension?.toLowerCase() || '';
    if (['pdf'].includes(ext)) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <path d="M14 2V8H20" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M14 2V8H20" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'reviewed':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
        <div className="flex items-center gap-4 mb-2">
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
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
          )}
          <h5 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">Documents</h5>
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
                className={`text-sm font-[BasisGrotesquePro] ${
                  index === documentsData.breadcrumbs.length - 1
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
                  className={`!rounded-lg p-6 cursor-pointer transition-colors ${
                    isSelected
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
                      onClick={() => window.open(document.file_url, '_blank')}
                      className="flex items-center gap-4 p-4 bg-white !border border-[#E8F0FF] !rounded-lg hover:border-[#F49C2D] transition-colors cursor-pointer"
                    >
                      <div className="flex-shrink-0">
                        {getFileIcon(document.file_extension)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h6 className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro] truncate">
                            {document.file_name}
                          </h6>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 font-[BasisGrotesquePro]">
                          <span>{document.file_size_formatted || 'N/A'}</span>
                          <span>{document.category?.name || 'Uncategorized'}</span>
                          <span>{document.created_at_formatted || formatDate(document.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(document.file_url, '_blank');
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 !rounded-lg hover:bg-blue-100 transition-colors font-[BasisGrotesquePro]"
                        >
                          View
                        </button>
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
                                className={`px-3 py-2 text-sm font-medium rounded-lg font-[BasisGrotesquePro] ${
                                  currentPage === page
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
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">No folders or documents found</p>
        </div>
      )}
    </div>
  );
}
