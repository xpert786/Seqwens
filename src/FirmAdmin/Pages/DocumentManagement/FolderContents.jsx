import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { DocumentUpload, DocumentBrowseFolder, DocumentPdfIcon } from '../../Components/icons';
import { firmAdminDocumentsAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { toast } from 'react-toastify';

// Search icon
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 14L11.1 11.1M12.6667 7.33333C12.6667 10.2789 10.2789 12.6667 7.33333 12.6667C4.38781 12.6667 2 10.2789 2 7.33333C2 4.38781 4.38781 2 7.33333 2C10.2789 2 12.6667 4.38781 12.6667 7.33333Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Chevron down icon
const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 10L12 6" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// File icon (light blue)
const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.83333 2.5H11.6667L15 5.83333V15.8333C15 16.2754 14.8244 16.6993 14.5118 17.0118C14.1993 17.3244 13.7754 17.5 13.3333 17.5H5.83333C5.39131 17.5 4.96738 17.3244 4.65482 17.0118C4.34226 16.6993 4.16667 16.2754 4.16667 15.8333V4.16667C4.16667 3.72464 4.34226 3.30072 4.65482 2.98816C4.96738 2.67559 5.39131 2.5 5.83333 2.5Z" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.6667 2.5V5.83333H15" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function FolderContents() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');
  const [openActionsMenu, setOpenActionsMenu] = useState(null);

  // API state
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [folderInfo, setFolderInfo] = useState(null);
  const [statistics, setStatistics] = useState({
    total_documents: 0,
    pending: 0,
    approved: 0,
    total_storage: 0
  });
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  // Check if we're viewing a document (nested route)
  const isViewingDocument = location.pathname.includes('/document/');

  // Fetch folder contents from API
  const fetchFolderContents = useCallback(async () => {
    if (!folderId) return;

    try {
      setLoading(true);
      setError(null);

      const params = {
        folder_id: folderId
      };

      if (searchQuery) {
        params.search = searchQuery;
      }
      if (selectedCategory !== 'All Categories') {
        params.category_id = selectedCategory; // This would need to be the actual category ID
      }

      const response = await firmAdminDocumentsAPI.browseDocuments(params);

      if (response.success && response.data) {
        // Set folder info
        if (response.data.current_folder) {
          setFolderInfo(response.data.current_folder);
        }

        // Set breadcrumbs
        if (response.data.breadcrumbs) {
          setBreadcrumbs(response.data.breadcrumbs);
        }

        // Transform sub-folders
        const transformedFolders = (response.data.folders || []).map(folder => ({
          id: folder.id,
          title: folder.title,
          description: folder.description || '',
          files_count: folder.files_count || 0
        }));

        setFolders(transformedFolders);

        // Transform documents
        const transformedDocuments = (response.data.documents || []).map(doc => {
          // Extract filename from URL
          const url = doc.tax_documents || '';
          const filename = url.split('/').pop() || 'document.pdf';
          
          return {
            id: doc.id,
            name: filename,
            type: filename.split('.').pop().toUpperCase() || 'PDF',
            tax_documents: doc.tax_documents,
            status: doc.status || 'pending_review',
            statusColor: getStatusColor(doc.status),
            textColor: getStatusTextColor(doc.status),
            category: doc.category?.name || 'General',
            client: doc.client?.name || doc.client_name || 'N/A',
            uploaded_by: doc.uploaded_by?.name || doc.uploaded_by_name || doc.created_by?.name || 'N/A',
            size: doc.size || doc.file_size || '—',
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            is_archived: doc.is_archived || false
          };
        });

        setDocuments(transformedDocuments);

        // Calculate statistics
        const totalDocs = transformedDocuments.length;
        const pending = transformedDocuments.filter(d => d.status === 'pending_review').length;
        const approved = transformedDocuments.filter(d => d.status === 'approved').length;

        setStatistics({
          total_documents: totalDocs,
          pending: pending,
          approved: approved,
          total_storage: 0 // Not provided by API
        });
      } else {
        throw new Error(response.message || 'Failed to fetch folder contents');
      }
    } catch (err) {
      console.error('Error fetching folder contents:', err);
      setError(handleAPIError(err));
      toast.error(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  }, [folderId, searchQuery, selectedCategory]);

  // Get status color
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-500';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('approved')) return 'bg-green-500';
    if (statusLower.includes('pending') || statusLower.includes('review')) return 'bg-amber-400';
    if (statusLower.includes('rejected')) return 'bg-red-500';
    return 'bg-gray-500';
  };

  // Get status text color
  const getStatusTextColor = (status) => {
    if (!status) return 'text-white';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('pending') || statusLower.includes('review')) return 'text-gray-900';
    return 'text-white';
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.actions-menu-container')) {
        setOpenActionsMenu(null);
      }
    };

    if (openActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionsMenu]);

  // Handle view details
  const handleViewDetails = (doc) => {
    navigate(`document/${doc.id}`);
    setOpenActionsMenu(null);
  };

  // Fetch folder contents on mount and when filters change
  useEffect(() => {
    if (folderId) {
      const timer = setTimeout(() => {
        fetchFolderContents();
      }, searchQuery ? 500 : 0); // Debounce search

      return () => clearTimeout(timer);
    }
  }, [folderId, searchQuery, selectedCategory, fetchFolderContents]);

  const folderName = folderInfo?.title || 'Folder';

  // Handle document download
  const handleDownload = async (doc) => {
    try {
      if (!doc.tax_documents) {
        toast.error('Document URL not found');
        return;
      }

      // Get the access token
      const token = getAccessToken();
      
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      // Fetch the document with authorization
      const response = await fetch(doc.tax_documents, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.statusText}`);
      }

      // Get the blob data
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error(handleAPIError(error) || 'Failed to download document');
    }
  };

  return (
    <div className="p-6 bg-[rgb(243,247,255)] min-h-screen">
      {/* Conditionally render folder contents only when NOT viewing a document */}
      {!isViewingDocument && (
        <>
          {/* Header Section */}
          {/* <div className="mb-6">
            <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                Document Management
                </h1>
                <p className="text-gray-600 text-base" style={{ fontFamily: 'BasisGrotesquePro' }}>
                Manage all firm documents and client files
                </p>
                <p className="text-sm text-blue-600 mt-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                Current Folder: {folderName} (ID: {folderId})
                </p>
            </div>
            <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium" style={{ fontFamily: 'BasisGrotesquePro' }}>
                <DocumentBrowseFolder />
                <span>Browse Folders</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium" style={{ fontFamily: 'BasisGrotesquePro' }}>
                <DocumentUpload />
                <span>Upload Documents</span>
                </button>
            </div>
            </div>
        </div> */}

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="mb-4 flex items-center gap-2 text-sm" style={{ fontFamily: 'BasisGrotesquePro' }}>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="text-gray-400">/</span>}
                  <button
                    onClick={() => {
                      if (crumb.id) {
                        navigate(`/firmadmin/documents/folder/${crumb.id}`);
                      } else {
                        navigate('/firmadmin/documents');
                      }
                    }}
                    className={`${index === breadcrumbs.length - 1 ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {crumb.title}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-[BasisGrotesquePro]">{error}</p>
              <button
                onClick={fetchFolderContents}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-[BasisGrotesquePro]"
              >
                Retry
              </button>
            </div>
          )}

          {/* Summary Cards */}
          {!loading && !error && (
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg p-5 ">
                <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>Total Documents</p>
                <p className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'BasisGrotesquePro' }}>{statistics.total_documents}</p>
              </div>
              <div className="bg-white rounded-lg p-5">
                <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>Pending Review</p>
                <p className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'BasisGrotesquePro' }}>{statistics.pending}</p>
              </div>
              <div className="bg-white rounded-lg p-5">
                <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>Approved</p>
                <p className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'BasisGrotesquePro' }}>{statistics.approved}</p>
              </div>
              <div className="bg-white rounded-lg p-5">
                <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>IRS Required</p>
                <p className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'BasisGrotesquePro' }}>—</p>
              </div>
              <div className="bg-white rounded-lg p-5">
                <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>Total Storage</p>
                <p className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'BasisGrotesquePro' }}>—</p>
              </div>
            </div>
          )}

      {/* Document List Section */}
      {!loading && !error && (
        <div className="bg-white rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
              All Documents ({documents.length})
            </h2>
            <p className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Complete list of documents with review status and metadata
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex gap-3 mb-6">
            <div className="flex relative bg-blue-50">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search documents by name, client, or uploader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[450px] pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ fontFamily: 'BasisGrotesquePro' }}
              />
            </div>
          <div className="relative">
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'All Categories' ? null : 'All Categories')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
            >
              <span>{selectedCategory}</span>
              <ChevronDown />
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'All Status' ? null : 'All Status')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
            >
              <span>{selectedStatus}</span>
              <ChevronDown />
            </button>
          </div>
        </div>

        {/* Document Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Document</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Client</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Category</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Uploaded By</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Upload Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Size</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, index) => (
                <tr key={doc.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index < documents.length - 1 ? '' : ''}`}>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <FileIcon />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'BasisGrotesquePro' }}>{doc.name}</p>
                        <p className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>{doc.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>{doc.client}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>{doc.uploaded_by}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>{formatDate(doc.created_at)}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>{formatFileSize(doc.size)}</p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="relative actions-menu-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionsMenu(openActionsMenu === doc.id ? null : doc.id);
                        }}
                        className="p-2 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                        title="Actions"
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 10.8333C10.4603 10.8333 10.8333 10.4603 10.8333 10C10.8333 9.53976 10.4603 9.16667 10 9.16667C9.53976 9.16667 9.16667 9.53976 9.16667 10C9.16667 10.4603 9.53976 10.8333 10 10.8333Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 5.00001C10.4603 5.00001 10.8333 4.62692 10.8333 4.16667C10.8333 3.70643 10.4603 3.33334 10 3.33334C9.53976 3.33334 9.16667 3.70643 9.16667 4.16667C9.16667 4.62692 9.53976 5.00001 10 5.00001Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 16.6667C10.4603 16.6667 10.8333 16.2936 10.8333 15.8333C10.8333 15.3731 10.4603 15 10 15C9.53976 15 9.16667 15.3731 9.16667 15.8333C9.16667 16.2936 9.53976 16.6667 10 16.6667Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {openActionsMenu === doc.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-10 py-1" style={{ borderRadius: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(doc);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F56D2D] transition-colors"
                            style={{ fontFamily: 'BasisGrotesquePro' }}
                          >
                            View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(doc);
                              setOpenActionsMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            style={{ fontFamily: 'BasisGrotesquePro' }}
                          >
                            Download
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionsMenu(null);
                              // TODO: Implement delete functionality
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                            style={{ fontFamily: 'BasisGrotesquePro' }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {documents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 font-[BasisGrotesquePro]">No documents found</p>
          </div>
        )}
      </div>
      )}
        </>
      )}

      {/* Always render the Outlet so nested routes can render immediately */}
      <Outlet />
    </div>
  );
}
