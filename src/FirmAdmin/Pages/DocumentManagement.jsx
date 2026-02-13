import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { DocumentUpload, DocumentDownload, DocumentMoreIcon, DocumentCriticalIssuesIcon, DocumentWarningIcon, DocumentSuccessIcon, DocumentOverdueIcon, PdfDocumentIconLight, DocumentWarningIconCompliance, DocumentTextIcon, DocumentPostion, DocumentOpacity, DocumentRotation, DocumentEye } from '../Components/icons';
import { firmAdminDocumentsAPI, firmAdminSettingsAPI, handleAPIError, watermarkToolAPI } from '../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import FirmAdminUploadModal from './DocumentManagement/FirmAdminUploadModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import ShareDocumentsModal from './DocumentManagement/ShareDocumentsModal';
import SharedDocumentsList from './DocumentManagement/SharedDocumentsList';
import '../styles/DocumentManagement.css';

// Search icon
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 14L11.1 11.1M12.6667 7.33333C12.6667 10.2789 10.2789 12.6667 7.33333 12.6667C4.38781 12.6667 2 10.2789 2 7.33333C2 4.38781 4.38781 2 7.33333 2C10.2789 2 12.6667 4.38781 12.6667 7.33333Z" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function DocumentManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('Folder');
  const [complianceSubTab, setComplianceSubTab] = useState('Overview');
  const [openActionsMenu, setOpenActionsMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [enableWatermarking, setEnableWatermarking] = useState(true);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkPosition, setWatermarkPosition] = useState('Center');
  const [watermarkOpacity, setWatermarkOpacity] = useState('30%');
  const [watermarkTextSize, setWatermarkTextSize] = useState('22px');
  const [watermarkRotation, setWatermarkRotation] = useState('-40°');
  const [watermarkColor, setWatermarkColor] = useState('#FF0000');
  const [includeUserInfo, setIncludeUserInfo] = useState(true);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [includeDocumentInfo, setIncludeDocumentInfo] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [loadingWatermark, setLoadingWatermark] = useState(false);
  const [savingWatermark, setSavingWatermark] = useState(false);
  const [wmToolFile, setWmToolFile] = useState(null);
  const [wmToolPreviewUrl, setWmToolPreviewUrl] = useState(null);
  const [wmToolLoading, setWmToolLoading] = useState(false);
  const [wmToolSettings, setWmToolSettings] = useState({
    watermark_text: '',
    opacity: 30,
    color: '#FF0000',
    rotation: -45,
    text_size: 20,
    include_user_info: false,
    include_timestamp: false,
    include_document_info: false,
    position: 'center'
  });

  const handleWmToolFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setWmToolFile(e.target.files[0]);
      setWmToolPreviewUrl(null); // Clear old preview
    }
  };

  const handleWmToolPreview = async () => {
    if (!wmToolFile) return toast.error("Please upload a file first");

    try {
      setWmToolLoading(true);
      const formData = new FormData();
      formData.append('file', wmToolFile);
      Object.keys(wmToolSettings).forEach(key => {
        formData.append(key, wmToolSettings[key]);
      });

      const blob = await watermarkToolAPI.previewWatermark(formData);
      const url = URL.createObjectURL(blob);
      setWmToolPreviewUrl(url);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to generate preview");
    } finally {
      setWmToolLoading(false);
    }
  };

  const handleWmToolDownload = async () => {
    if (!wmToolFile) return toast.error("Please upload a file first");

    try {
      setWmToolLoading(true);
      const formData = new FormData();
      formData.append('file', wmToolFile);
      Object.keys(wmToolSettings).forEach(key => {
        formData.append(key, wmToolSettings[key]);
      });

      const blob = await watermarkToolAPI.applyWatermark(formData);

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watermarked_${wmToolFile.name}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Document downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to download document");
    } finally {
      setWmToolLoading(false);
    }
  };

  // API state
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    total_folders: 0,
    total_documents: 0,
    archived_documents: 0,
    is_root: true
  });
  const [firmInfo, setFirmInfo] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [parentFolder, setParentFolder] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDocumentsForShare, setSelectedDocumentsForShare] = useState([]);

  // Check if we're in a nested route (folder contents)
  const isNestedRoute = location.pathname.includes('/folder/');
  const isViewingDocument = location.pathname.includes('/document/');

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.actions-menu-container') && !event.target.closest('.docmanage-actions-menu')) {
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


  // Fetch folders and documents from API (without search - filtering done on frontend)
  const fetchDocuments = useCallback(async (folderId = null) => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (folderId) {
        params.folder_id = folderId;
      }
      // Note: NOT passing search parameter - we filter on the frontend for instant results

      const response = await firmAdminDocumentsAPI.browseDocuments(params);

      if (response.success && response.data) {
        // Set firm info
        if (response.data.firm) {
          setFirmInfo(response.data.firm);
        }

        // Set current folder and parent
        setCurrentFolder(response.data.current_folder || null);
        setParentFolder(response.data.parent_folder || null);

        // Set breadcrumbs
        if (response.data.breadcrumbs) {
          setBreadcrumbs(response.data.breadcrumbs);
        }

        // Transform folders
        const transformedFolders = (response.data.folders || []).map(folder => ({
          id: folder.id,
          name: folder.title,
          description: folder.description || '',
          documentCount: folder.files_count || 0,
          modified: folder.updated_at ? `Modified ${formatDate(folder.updated_at)}` : '',
          date: folder.created_at ? formatDateShort(folder.created_at) : '',
          size: '—', // Size not provided in API
          badges: ['System'], // Default badge
          files: folder.files || [],
          // Store additional fields for search filtering
          client_name: folder.client_name || '',
          client_email: folder.client_email || ''
        }));

        setFolders(transformedFolders);

        // Transform documents
        const transformedDocuments = (response.data.documents || []).map(doc => ({
          id: doc.id,
          tax_documents: doc.tax_documents,
          status: doc.status,
          is_archived: doc.is_archived || false,
          folder: doc.folder,
          category: doc.category,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          // Store additional fields for search filtering
          client_name: doc.client?.name || doc.client_name || '',
          client_email: doc.client?.email || doc.client_email || ''
        }));

        setDocuments(transformedDocuments);

        // Set statistics
        if (response.data.statistics) {
          setStatistics(response.data.statistics);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(handleAPIError(err));
      toast.error(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format date short helper
  const formatDateShort = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  // Fetch documents on mount only (search filtering is done client-side)
  useEffect(() => {
    if (!isNestedRoute) {
      fetchDocuments(null);
    }
  }, [isNestedRoute, fetchDocuments]);

  // Helper functions to map position values between display and API format
  const mapPositionToAPI = (displayPosition) => {
    const positionMap = {
      'Top Left': 'top_left',
      'Top Center': 'top_center',
      'Top Right': 'top_right',
      'Center': 'center',
      'Bottom Left': 'bottom_left',
      'Bottom Center': 'bottom_center',
      'Bottom Right': 'bottom_right',
    };
    return positionMap[displayPosition] || 'center';
  };

  const mapPositionFromAPI = (apiPosition) => {
    const positionMap = {
      'top_left': 'Top Left',
      'top_center': 'Top Center',
      'top_right': 'Top Right',
      'center': 'Center',
      'bottom_left': 'Bottom Left',
      'bottom_center': 'Bottom Center',
      'bottom_right': 'Bottom Right',
    };
    return positionMap[apiPosition] || 'Center';
  };

  // Fetch watermark settings
  const fetchWatermarkSettings = useCallback(async () => {
    try {
      setLoadingWatermark(true);
      const response = await firmAdminSettingsAPI.getWatermarkSettings();

      if (response.success && response.data) {
        const settings = response.data;
        setEnableWatermarking(settings.enabled || false);
        setWatermarkText(settings.watermark_text || 'CONFIDENTIAL');
        setWatermarkPosition(mapPositionFromAPI(settings.position || 'center'));
        setWatermarkOpacity(`${settings.opacity || 30}%`);
        setWatermarkTextSize(`${settings.text_size || 22}px`);
        setWatermarkRotation(`${settings.rotation || -45}°`);
        setWatermarkColor(settings.color || '#FF0000');
        setIncludeUserInfo(settings.include_user_info !== undefined ? settings.include_user_info : true);
        setIncludeTimestamp(settings.include_timestamp !== undefined ? settings.include_timestamp : true);
        setIncludeDocumentInfo(settings.include_document_info !== undefined ? settings.include_document_info : true);

        // Initialize Manual Tool Settings with Firm Defaults
        setWmToolSettings(prev => ({
          ...prev,
          watermark_text: settings.watermark_text || '',
          opacity: settings.opacity || 30,
          text_size: settings.text_size || 20,
          rotation: settings.rotation || -45,
          color: settings.color || '#FF0000',
          position: settings.position || 'center',
          include_user_info: settings.include_user_info !== undefined ? settings.include_user_info : false,
          include_timestamp: settings.include_timestamp !== undefined ? settings.include_timestamp : false,
          include_document_info: settings.include_document_info !== undefined ? settings.include_document_info : false
        }));
      }
    } catch (err) {
      console.error('Error fetching watermark settings:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to load watermark settings');
    } finally {
      setLoadingWatermark(false);
    }
  }, []);

  // Fetch watermark settings when Security tab is active
  useEffect(() => {
    if (!isNestedRoute && activeTab === 'Security') {
      fetchWatermarkSettings();
    }
  }, [activeTab, isNestedRoute, fetchWatermarkSettings]);

  // Save watermark settings
  const handleSaveWatermarkSettings = async () => {
    try {
      setSavingWatermark(true);

      // Parse values from display format to API format
      const opacityValue = parseInt(watermarkOpacity.replace('%', ''));
      const textSizeValue = parseInt(watermarkTextSize.replace('px', ''));
      const rotationValue = parseInt(watermarkRotation.replace('°', ''));

      const watermarkData = {
        enabled: enableWatermarking,
        watermark_text: watermarkText,
        position: mapPositionToAPI(watermarkPosition),
        opacity: opacityValue,
        text_size: textSizeValue,
        rotation: rotationValue,
        color: watermarkColor,
        include_user_info: includeUserInfo,
        include_timestamp: includeTimestamp,
        include_document_info: includeDocumentInfo,
      };

      const response = await firmAdminSettingsAPI.updateWatermarkSettings(watermarkData);

      if (response.success) {
        toast.success('Watermark settings saved successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        throw new Error(response.message || 'Failed to save watermark settings');
      }
    } catch (err) {
      console.error('Error saving watermark settings:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to save watermark settings', {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setSavingWatermark(false);
    }
  };

  const handleFolderClick = (folderId) => {
    navigate(`/firmadmin/documents/folder/${folderId}`);
  };

  const toggleActionsMenu = (folderId, event) => {
    event.stopPropagation();
    if (openActionsMenu === folderId) {
      setOpenActionsMenu(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - 160,
      });
      setOpenActionsMenu(folderId);
    }
  };

  const handleOpenFolder = (folderId) => {
    setOpenActionsMenu(null);
    handleFolderClick(folderId);
  };

  const [showDeleteFolderConfirm, setShowDeleteFolderConfirm] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);

  // Handle delete folder
  const handleDeleteFolder = async (folderId, folderName) => {
    setFolderToDelete({ id: folderId, name: folderName });
    setShowDeleteFolderConfirm(true);
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;

    try {
      setLoading(true);
      const response = await firmAdminDocumentsAPI.deleteFolder(folderToDelete.id);

      if (response.success) {
        toast.success(response.message || 'Folder deleted successfully', {
          position: 'top-right',
          autoClose: 3000,
          pauseOnHover: false
        });

        // Refresh the folders list
        await fetchDocuments(null);
      } else {
        throw new Error(response.message || 'Failed to delete folder');
      }
    } catch (err) {
      console.error('Error deleting folder:', err);

      // Extract specific error messages from errors object if available
      let errorMessage = handleAPIError(err);

      // Try to extract errors from response if available
      if (err.response) {
        try {
          const errorData = await err.response.json().catch(() => ({}));
          if (errorData.errors && typeof errorData.errors === 'object') {
            const errorMessages = [];
            Object.entries(errorData.errors).forEach(([field, messages]) => {
              const fieldMessages = Array.isArray(messages) ? messages : [messages];
              errorMessages.push(...fieldMessages);
            });

            if (errorMessages.length > 0) {
              errorMessage = errorMessages.join('. ');
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
      }

      toast.error(errorMessage || 'Failed to delete folder. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
        pauseOnHover: false
      });
    } finally {
      setLoading(false);
      setShowDeleteFolderConfirm(false);
      setFolderToDelete(null);
    }
  };

  // Filter folders based on search (client-side filtering for instant results)
  const filteredFolders = folders.filter(folder => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      folder.name.toLowerCase().includes(query) ||
      folder.description.toLowerCase().includes(query) ||
      folder.client_name.toLowerCase().includes(query) ||
      folder.client_email.toLowerCase().includes(query)
    );
  });

  // Filter documents based on search (client-side filtering)
  const filteredDocuments = documents.filter(doc => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fileName = (doc.tax_documents || '').toLowerCase();
    return (
      fileName.includes(query) ||
      doc.client_name.toLowerCase().includes(query) ||
      doc.client_email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="lg:p-6 md:p-4 sm:p-2 px-1 bg-[rgb(243,247,255)] min-h-screen docmanage-main-container">
      {/* Header Section */}
      {!isViewingDocument && (
        <div className="mb-6 docmanage-header">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6 docmanage-header-content">
            {/* Text Section */}
            <div className="flex-1 docmanage-header-text">
              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800 mb-2 docmanage-header-title" style={{ fontFamily: 'BasisGrotesquePro' }}>
                Document {isNestedRoute ? 'Management' : 'Center'}
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 docmanage-header-subtitle" style={{ fontFamily: 'BasisGrotesquePro' }}>
                {isNestedRoute
                  ? 'Manage all firm documents and client files'
                  : 'Comprehensive document management with OCR, auto-tagging, AI-powered search, and compliance tracking'}
              </p>
            </div>

            {/* Buttons Section */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-3 lg:mt-0 w-full sm:w-auto">
              <button
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-firm-primary text-white hover:brightness-90 transition-all text-sm font-medium docmanage-upload-button"
                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
                onClick={() => setShowUploadModal(true)}
              >
                <DocumentUpload />
                <span>Upload Documents</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Navigation Tabs - Show tabs when NOT in nested route */}
      {!isNestedRoute && (
        <div className="mb-6 w-fit docmanage-tabs-container">
          <div className="flex flex-wrap gap-2 sm:gap-3 bg-white rounded-lg p-1 border border-blue-50 w-full docmanage-tabs-wrapper">
            {['Folder', 'Shared Documents', 'Security'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors relative docmanage-tab-button ${activeTab === tab
                  ? 'text-white bg-firm-primary'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

      )}

      {/* Document Folders Section - Only show if NOT in nested route */}
      {!isNestedRoute && activeTab === 'Folder' && (
        <div className='bg-white rounded-lg lg:p-5 md:p-3 sm:p-1 border border-gray-100 docmanage-folders-section'>
          <div className="mb-6 docmanage-folders-header">
            <h5 className="text-xl font-semibold text-gray-800 mb-1 docmanage-folders-title" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Document Folders
            </h5>
            <p className="text-sm text-gray-600 docmanage-folders-subtitle" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Organize documents by category and access level
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-2xl docmanage-search-container">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 docmanage-search-icon">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search Folder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full lg:w-1/2 lg:pl-10 lg:pr-4 lg:py-2.5 sm:p-2 sm:text-center md:w-1/3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--firm-primary-color)] bg-blue-50 search-folder-document-management docmanage-search-input"
                style={{ fontFamily: 'BasisGrotesquePro' }}
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12 docmanage-loading">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 docmanage-error">
              <p className="text-red-800 font-[BasisGrotesquePro]">{error}</p>
              <button
                onClick={() => fetchDocuments(null)}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-[BasisGrotesquePro]"
              >
                Retry
              </button>
            </div>
          )}

          {/* Folder Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 docmanage-folder-grid">
              {filteredFolders.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-600 font-[BasisGrotesquePro]">No folders found</p>
                </div>
              ) : (
                filteredFolders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => handleFolderClick(folder.id)}
                    className="bg-white rounded-lg p-2 transition-all cursor-pointer relative docmanage-folder-card"
                    style={{
                      border: '1px solid #E8F0FF',
                      borderRadius: '10px',
                      padding: '6px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      relative: 'true',
                    }}
                  >
                    {/* Header with icon, title, and menu */}
                    <div className="flex items-start justify-between mb-3 docmanage-folder-header">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Orange Folder Icon */}
                        <div className="flex-shrink-0 mt-0.5 docmanage-folder-icon">
                          <DocumentDownload width={20} height={20} />
                        </div>
                        {/* Folder Title */}
                        <div className="flex-1 min-w-0">
                          <h6 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 docmanage-folder-title" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            {folder.name}
                          </h6>
                          {/* Badges */}
                          <div className="flex flex-wrap gap-1.5 mb-2 docmanage-folder-badges">
                            {folder.badges.map((badge, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 text-xs font-medium rounded-full docmanage-folder-badge ${idx === 0
                                  ? 'bg-firm-primary text-white'
                                  : 'bg-white text-gray-800 border border-gray-300'
                                  }`}
                                style={{ fontFamily: 'BasisGrotesquePro' }}
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Three-dot Menu */}
                      <div className="relative actions-menu-container flex-shrink-0">
                        <button
                          onClick={(e) => toggleActionsMenu(folder.id, e)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          aria-label="More options"
                        >
                          <DocumentMoreIcon />
                        </button>
                        {openActionsMenu === folder.id && createPortal(
                          <div
                            className="absolute w-40 bg-white rounded-lg border border-gray-200 shadow-lg z-[9999] py-1 docmanage-actions-menu"
                            style={{
                              top: `${menuPosition.top}px`,
                              left: `${menuPosition.left}px`,
                              position: 'absolute'
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFolder(folder.id);
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              style={{ fontFamily: 'BasisGrotesquePro' }}
                            >
                              Open Folder
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id, folder.name);
                                setOpenActionsMenu(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                              style={{ fontFamily: 'BasisGrotesquePro' }}
                            >
                              Delete
                            </button>
                          </div>,
                          document.body
                        )}
                      </div>
                    </div>

                    {/* Folder Description */}
                    <p className="text-sm font-medium text-gray-600 mb-4 leading-relaxed docmanage-folder-description" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      {folder.description}
                    </p>

                    {/* Footer with document count, size, and date */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 docmanage-folder-footer">
                      {/* Left side: Documents and Modified */}
                      <div className="flex flex-col docmanage-folder-footer-left" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        <span>{folder.documentCount} documents</span>
                        <span>{folder.modified}</span>
                      </div>

                      {/* Right side: Date */}
                      <div className="flex flex-col items-end text-right docmanage-folder-footer-right" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        <span>{folder.date}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Compliance Tab Content - COMMENTED OUT */}
      {false && !isNestedRoute && activeTab === 'Compliance' && (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h5 className="text-3xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Compliance & Security Dashboard
                </h5>
                <p className="text-gray-600 text-base" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Monitor IRS requirements, document expiration, and security compliance
                </p>
              </div>
              {/* Global Fi lter Dropdown */}
              <div className="relative">
                <select className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm font-medium" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  <option>Next 30 Days</option>
                  <option>Next 60 Days</option>
                  <option>Next 90 Days</option>
                </select>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-6 w-fit">
              <div className="flex flex-wrap gap-2 sm:gap-3 bg-white rounded-lg p-1 border border-blue-50 w-full">
                {['Overview', 'IRS Tracking', 'Security', 'Alerts'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setComplianceSubTab(tab)}
                    className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors relative ${complianceSubTab === tab
                      ? 'text-white bg-firm-primary'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                    style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>


          </div>

          {/* Overview Tab Content */}
          {complianceSubTab === 'Overview' && (
            <>
              {/* Overall Compliance Score Section */}
              <div className="bg-white rounded-lg p-4">
                <h5 className="text-xl font-semibold text-gray-800 mb-3" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Overall Compliance Score
                </h5>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Compliance Level</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>30%</span>
                      <span className="text-sm text-green-600 font-medium" style={{ fontFamily: 'BasisGrotesquePro' }}>+5% this month</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-firm-primary h-3 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>

                <p className="text-sm text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Critical issues require attention
                </p>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ">
                {/* Critical Issues Card */}
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="text-sm font-medium text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Critical Issues</h6>
                    <div className="w-8 h-8  rounded-full flex items-center justify-center">
                      {/* <span className="text-white text-xs font-bold">i</span> */}
                      <DocumentCriticalIssuesIcon width={20} height={20} />
                    </div>
                  </div>
                  <p className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>2</p>
                </div>

                {/* Warning Card */}
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="text-sm font-medium text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Warning</h6>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      <DocumentWarningIcon width={20} height={20} />
                    </div>
                  </div>
                  <p className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>3</p>
                </div>

                {/* Complaints Card */}
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="text-sm font-medium text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Complaints</h6>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      <DocumentSuccessIcon width={20} height={20} />
                    </div>
                  </div>
                  <p className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>0</p>
                </div>

                {/* Overdue Card */}
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="text-sm font-medium text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Overdue</h6>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      <DocumentOverdueIcon width={20} height={20} />
                    </div>
                  </div>
                  <p className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>0</p>
                </div>
              </div>

              {/* Recent Compliance Issues Section */}
              <div className="bg-white rounded-lg p-4">
                <div className="mb-3">
                  <h5 className="text-xl font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Recent Compliance Issues
                  </h5>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Items requiring immediate attention
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Issue 1: Missing W-2 Forms */}
                  <div className="flex items-start gap-4 p-4  rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      <PdfDocumentIconLight />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Missing W-2 Forms
                        </h5>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Critical
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        3 clients missing required W-2 documentation for 2023 tax year
                      </p>
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Due: Apr 15, 2024
                      </p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                      Resolve
                    </button>
                  </div>

                  {/* Issue 2: Driver License Expiring */}
                  <div className="flex items-start gap-4 p-4 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      <PdfDocumentIconLight />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Driver License Expiring
                        </h5>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-400 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          High
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Robert Davis - Driver license expires in 16 days
                      </p>
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Due: Apr 01, 2024
                      </p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                      Resolve
                    </button>
                  </div>

                  {/* Issue 3: Quarterly Compliance Review */}
                  <div className="flex items-start gap-4 p-4 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      <PdfDocumentIconLight />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Quarterly Compliance Review
                        </h5>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#8655ff] text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Medium
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Q1 2024 compliance audit due for completion
                      </p>
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Due: Apr 30, 2024
                      </p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* IRS Tracking Tab Content */}
          {complianceSubTab === 'IRS Tracking' && (
            <div className="space-y-6">
              {/* IRS Required Documents Tracking Section */}
              <div className="bg-white rounded-lg p-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                  <div>
                    <h5 className="text-2xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      IRS Required Documents Tracking
                    </h5>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Monitor completion status of mandatory tax documents.
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <select className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm font-medium" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      <option>Next 30 Days</option>
                      <option>Next 60 Days</option>
                      <option>Next 90 Days</option>
                    </select>
                    <button className="px-4 py-2.5 bg-firm-primary text-white rounded-lg hover:brightness-90 transition-all text-sm font-medium" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                      Configure
                    </button>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-3">
                    <h6 className="text-sm font-medium text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Total Required
                    </h6>
                    <p className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>16</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <h6 className="text-sm font-medium text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Completed
                    </h6>
                    <p className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>12</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <h6 className="text-sm font-medium text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Missing
                    </h6>
                    <p className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>9</p>
                  </div>
                </div>
              </div>

              {/* All Documents Table Section */}
              <div className="bg-white rounded-lg p-3">
                <div className="mb-4">
                  <h5 className="text-xl font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    All Documents (4)
                  </h5>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Complete list of documents with review status and metadata
                  </p>
                </div>

                {/* Table - Responsive Design */}
                <div className="overflow-x-auto">
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Document Type
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Client
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Status
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Due Date
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Assigned To
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Row 1: W-2 Forms */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              W-2 Forms
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Johnson & Associates LLC
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Completed
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Mar 1, 2024
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Michael Chen
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                              Resolve
                            </button>
                          </td>
                        </tr>

                        {/* Row 2: 1099-MISC */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              1099-MISC
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Smith Corp
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Pending Review
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Mar 23, 2024
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Jason Roy
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                              Resolve
                            </button>
                          </td>
                        </tr>

                        {/* Row 3: Schedule K-1 */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Schedule K-1
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Wilson Enterprises
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Missing
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Apr 13, 2024
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Stuart Vince
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                              Resolve
                            </button>
                          </td>
                        </tr>

                        {/* Row 4: Form 1040 */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Form 1040
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Anderson Tax Services
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Completed
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Mar 15, 2024
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Sarah Johnson
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                              Resolve
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {/* Card 1: W-2 Forms */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            W-2 Forms
                          </h3>
                          <p className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Johnson & Associates LLC
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Completed
                        </span>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Due Date:</span>
                          <span className="text-xs text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Mar 1, 2024</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Assigned To:</span>
                          <span className="text-xs text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Michael Chen</span>
                        </div>
                      </div>
                      <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                        Resolve
                      </button>
                    </div>

                    {/* Card 2: 1099-MISC */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            1099-MISC
                          </h3>
                          <p className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Smith Corp
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Pending Review
                        </span>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Due Date:</span>
                          <span className="text-xs text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Mar 23, 2024</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Assigned To:</span>
                          <span className="text-xs text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Jason Roy</span>
                        </div>
                      </div>
                      <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                        Resolve
                      </button>
                    </div>

                    {/* Card 3: Schedule K-1 */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Schedule K-1
                          </h3>
                          <p className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Wilson Enterprises
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Missing
                        </span>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Due Date:</span>
                          <span className="text-xs text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Apr 13, 2024</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Assigned To:</span>
                          <span className="text-xs text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Stuart Vince</span>
                        </div>
                      </div>
                      <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                        Resolve
                      </button>
                    </div>

                    {/* Card 4: Form 1040 */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Form 1040
                          </h3>
                          <p className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Anderson Tax Services
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Completed
                        </span>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Due Date:</span>
                          <span className="text-xs text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Mar 15, 2024</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Assigned To:</span>
                          <span className="text-xs text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Sarah Johnson</span>
                        </div>
                      </div>
                      <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab Content */}
          {complianceSubTab === 'Security' && (
            <div className="space-y-6">
              {/* Security Rules & Access Control Section */}
              <div className="bg-white rounded-lg p-6">
                <div className="mb-6">
                  <h5 className="text-2xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Security Rules & Access Control
                  </h5>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Configure security policies and role-based access
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Row 1: Document Watermarking */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4 p-4  rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <PdfDocumentIconLight />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-base font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Document Watermarking
                        </h5>
                        <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Automatically add watermarks to downloaded documents
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Standard
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            preparer
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            viewer
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 md:flex-shrink-0">
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                        Configure
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                        Disable
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Role-Based Access Control */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4 p-4  rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <PdfDocumentIconLight />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-base font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Role-Based Access Control
                        </h5>
                        <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Restrict document access based on user roles and assignments
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Strict
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            preparer
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            viewer
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 md:flex-shrink-0">
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                        Configure
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                        Disable
                      </button>
                    </div>
                  </div>

                  {/* Row 3: Download Tracking */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4 p-4  rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <PdfDocumentIconLight />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-base font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Download Tracking
                        </h5>
                        <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Log all document downloads with user and timestamp
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Standard
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Admin
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            preparer
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            viewer
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 md:flex-shrink-0">
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                        Configure
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                        Disable
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role-Based Access Matrix Section */}
              <div className="bg-white rounded-lg p-6">
                <div className="mb-6">
                  <h5 className="text-2xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Role-Based Access Matrix
                  </h5>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Define what each role can access and modify
                  </p>
                </div>

                {/* Table - Responsive Design */}
                <div className="overflow-x-auto">
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Permission
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Admin
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Preparer
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Viewer
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Row 1: W-2 Forms */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              W-2 Forms
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center">
                              <DocumentSuccessIcon width={20} height={20} />
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center">
                              <DocumentWarningIconCompliance width={20} height={20} />
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center">
                              <DocumentCriticalIssuesIcon width={20} height={20} />
                            </div>
                          </td>
                        </tr>

                        {/* Row 2: Upload Documents */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Upload Documents
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center">
                              <DocumentSuccessIcon width={20} height={20} />
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center">
                              <DocumentSuccessIcon width={20} height={20} />
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center">
                              <DocumentCriticalIssuesIcon width={20} height={20} />
                            </div>
                          </td>
                        </tr>

                        {/* Row 3: Delete Documents */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Delete Documents
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center">
                              <DocumentSuccessIcon width={20} height={20} />
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center">
                              <DocumentCriticalIssuesIcon width={20} height={20} />
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center">
                              <DocumentCriticalIssuesIcon width={20} height={20} />
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {/* Card 1: W-2 Forms */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-4" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        W-2 Forms
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Admin</span>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="9" fill="#22C55E" stroke="white" strokeWidth="2" />
                            <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Preparer</span>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="9" fill="#EAB308" stroke="white" strokeWidth="2" />
                            <text x="10" y="14" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">i</text>
                          </svg>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Viewer</span>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="9" fill="#EF4444" stroke="white" strokeWidth="2" />
                            <text x="10" y="14" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">i</text>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Upload Documents */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-4" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Upload Documents
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Admin</span>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="9" fill="#22C55E" stroke="white" strokeWidth="2" />
                            <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Preparer</span>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="9" fill="#22C55E" stroke="white" strokeWidth="2" />
                            <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Viewer</span>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="9" fill="#EF4444" stroke="white" strokeWidth="2" />
                            <text x="10" y="14" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">i</text>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Delete Documents */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-4" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Delete Documents
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Admin</span>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="9" fill="#22C55E" stroke="white" strokeWidth="2" />
                            <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Preparer</span>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="9" fill="#EF4444" stroke="white" strokeWidth="2" />
                            <text x="10" y="14" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">i</text>
                          </svg>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>Viewer</span>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="9" fill="#EF4444" stroke="white" strokeWidth="2" />
                            <text x="10" y="14" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">i</text>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Tab Content */}
          {complianceSubTab === 'Alerts' && (
            <div className="space-y-6">
              {/* Summary Cards */}


              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="bg-white p-5">
                  <h6 className="text-sm font-medium text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Expiring This Week
                  </h6>
                  <p className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>16</p>
                </div>
                <div className="bg-white p-5">
                  <h6 className="text-sm font-medium text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Expiring This Month
                  </h6>
                  <p className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>12</p>
                </div>
                <div className="bg-white p-5">
                  <h6 className="text-sm font-medium text-gray-600 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Total Tracked
                  </h6>
                  <p className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>9</p>
                </div>
              </div>

              {/* Document Alerts Table */}
              <div className="bg-white rounded-lg p-6">

                {/* Table - Responsive Design */}
                <div className="overflow-x-auto">
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Document Type
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Client
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Expiration Date
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Status
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Days Remaining
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Row 1: Driver License */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Driver License
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Johnson & Associates LLC
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Mar 1, 2024
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Critical
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              15 Days
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                              Notify Client
                            </button>
                          </td>
                        </tr>

                        {/* Row 2: Business License */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Business License
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Wilson Enterprises
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Sep 13, 2024
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Warning
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              55 Days
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                              Notify Client
                            </button>
                          </td>
                        </tr>

                        {/* Row 3: Tax ID */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Tax ID
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Smith Corp
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Apr 20, 2024
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Critical
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              8 Days
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                              Notify Client
                            </button>
                          </td>
                        </tr>

                        {/* Row 4: Professional License */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Professional License
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Anderson Tax Services
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Oct 5, 2024
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              Warning
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              77 Days
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                              Notify Client
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {/* Card 1: Driver License */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Driver License
                          </h3>
                          <p className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Johnson & Associates LLC
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Critical
                        </span>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Expiration Date:</span>
                          <span className="text-xs text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Mar 1, 2024</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Days Remaining:</span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            15 Days
                          </span>
                        </div>
                      </div>
                      <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Notify Client
                      </button>
                    </div>

                    {/* Card 2: Business License */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Business License
                          </h3>
                          <p className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Wilson Enterprises
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Warning
                        </span>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Expiration Date:</span>
                          <span className="text-xs text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Sep 13, 2024</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Days Remaining:</span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            55 Days
                          </span>
                        </div>
                      </div>
                      <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Notify Client
                      </button>
                    </div>

                    {/* Card 3: Tax ID */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Tax ID
                          </h3>
                          <p className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Smith Corp
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Critical
                        </span>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Expiration Date:</span>
                          <span className="text-xs text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Apr 20, 2024</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Days Remaining:</span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            8 Days
                          </span>
                        </div>
                      </div>
                      <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Notify Client
                      </button>
                    </div>

                    {/* Card 4: Professional License */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Professional License
                          </h3>
                          <p className="text-xs text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Anderson Tax Services
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          Warning
                        </span>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Expiration Date:</span>
                          <span className="text-xs text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>Oct 5, 2024</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>Days Remaining:</span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500 text-white" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            77 Days
                          </span>
                        </div>
                      </div>
                      <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Notify Client
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Tab Content */}
      {!isNestedRoute && activeTab === 'Security' && (
        <div className="bg-white rounded-lg lg:p-5 md:p-3 sm:p-1 border border-gray-100 docmanage-security-section">
          {/* Header */}


          {/* Enable Watermarking Section */}



          {/* Watermark Preview Section */}
          {showPreview && (
            <div className="border-t pt-6 docmanage-preview-section" style={{ borderColor: '#E8F0FF' }}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1 docmanage-preview-title" style={{ fontFamily: 'BasisGrotesquePro', color: '#3B4A66' }}>
                  Watermark Preview
                </h3>
                <p className="text-sm docmanage-preview-subtitle" style={{ fontFamily: 'BasisGrotesquePro', color: '#6B7280' }}>
                  How the watermark will appear on the document
                </p>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column: Settings */}
                <div className="w-full lg:w-1/2 space-y-6">
                  {/* File Upload */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Document (PDF)</label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-[#E5E7EB] border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center py-6">
                          <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                          </svg>
                          <p className="mb-4 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                          <p className="text-xs text-gray-500">{wmToolFile ? wmToolFile.name : 'PDF only'}</p>
                        </div>
                        <input type="file" className="hidden" accept=".pdf" onChange={handleWmToolFileChange} />
                      </label>
                    </div>
                  </div>

                  {/* Controls Grid */}
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Watermark Text</label>
                      <input
                        type="text"
                        value={wmToolSettings.watermark_text}
                        onChange={(e) => setWmToolSettings({ ...wmToolSettings, watermark_text: e.target.value })}
                        className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:ring-2 focus:ring-[#3AD6F2]"
                        placeholder="Confidential"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Position</label>
                        <select
                          value={wmToolSettings.position}
                          onChange={(e) => setWmToolSettings({ ...wmToolSettings, position: e.target.value })}
                          className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
                        >
                          <option value="top_left">Top Left</option>
                          <option value="top_center">Top Center</option>
                          <option value="top_right">Top Right</option>
                          <option value="center">Center</option>
                          <option value="bottom_left">Bottom Left</option>
                          <option value="bottom_center">Bottom Center</option>
                          <option value="bottom_right">Bottom Right</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={wmToolSettings.color}
                            onChange={(e) => setWmToolSettings({ ...wmToolSettings, color: e.target.value })}
                            className="h-10 w-full rounded-lg border border-[#E5E7EB] p-1 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Opacity ({wmToolSettings.opacity}%)</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={wmToolSettings.opacity}
                          onChange={(e) => setWmToolSettings({ ...wmToolSettings, opacity: Number(e.target.value) })}
                          className="w-full accent-[#3AD6F2]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Rotation ({wmToolSettings.rotation}°)</label>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={wmToolSettings.rotation}
                          onChange={(e) => setWmToolSettings({ ...wmToolSettings, rotation: Number(e.target.value) })}
                          className="w-full accent-[#3AD6F2]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Size ({wmToolSettings.text_size}px)</label>
                      <input
                        type="range"
                        min="10"
                        max="200"
                        value={wmToolSettings.text_size}
                        onChange={(e) => setWmToolSettings({ ...wmToolSettings, text_size: Number(e.target.value) })}
                        className="w-full accent-[#3AD6F2]"
                      />
                    </div>


                    <div className="flex flex-wrap gap-4 pt-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wmToolSettings.include_user_info}
                          onChange={(e) => setWmToolSettings({ ...wmToolSettings, include_user_info: e.target.checked })}
                          className="rounded border-gray-300 text-[#3AD6F2] focus:ring-[#3AD6F2]"
                        />
                        <span className="text-sm text-gray-700">Include User</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wmToolSettings.include_timestamp}
                          onChange={(e) => setWmToolSettings({ ...wmToolSettings, include_timestamp: e.target.checked })}
                          className="rounded border-gray-300 text-[#3AD6F2] focus:ring-[#3AD6F2]"
                        />
                        <span className="text-sm text-gray-700">Include Date</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wmToolSettings.include_document_info}
                          onChange={(e) => setWmToolSettings({ ...wmToolSettings, include_document_info: e.target.checked })}
                          className="rounded border-gray-300 text-[#3AD6F2] focus:ring-[#3AD6F2]"
                        />
                        <span className="text-sm text-gray-700">Include Doc Name</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleWmToolPreview}
                      disabled={wmToolLoading || !wmToolFile}
                      className="flex-1 rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-semibold text-[#374151] hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      style={{ borderRadius: '8px' }}
                    >
                      Generate Preview
                    </button>
                    <button
                      onClick={handleWmToolDownload}
                      disabled={wmToolLoading || !wmToolFile}
                      className="flex-1 rounded-lg bg-[#3AD6F2] px-3 py-2 text-sm font-semibold text-white hover:bg-[#34c3db] disabled:opacity-50 transition-colors shadow-sm"
                      style={{ borderRadius: '8px' }}
                    >
                      Download Watermarked File
                    </button>
                  </div>

                </div>

                {/* Right Column: Preview */}
                <div className="w-full lg:w-1/2">
                  <div className="flex flex-col h-full bg-gray-50 rounded-xl p-4 border border-[#E5E7EB]">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 block">Live Preview</h4>
                    <div className="flex-1 w-full bg-white rounded-lg border border-[#E5E7EB] overflow-hidden flex items-center justify-center min-h-[500px] shadow-inner relative">
                      {wmToolLoading ? (
                        <div className="flex flex-col items-center">
                          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3AD6F2] border-t-transparent"></div>
                          <p className="mt-3 text-sm text-gray-500 font-medium">Processing...</p>
                        </div>
                      ) : wmToolPreviewUrl ? (
                        <iframe src={wmToolPreviewUrl + "#toolbar=0"} className="w-full h-full absolute inset-0" title="Watermark Preview" />
                      ) : (
                        <div className="text-center p-6">
                          <div className="mx-auto h-12 w-12 text-gray-300 mb-3 flex justify-center">
                            <DocumentEye width={48} height={48} />
                          </div>
                          <p className="text-gray-400 text-sm">Upload a PDF and click 'Generate Preview' to see the result here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shared Documents Tab */}
      {!isNestedRoute && activeTab === 'Shared Documents' && (
        <SharedDocumentsList />
      )}

      {/* Other tabs content (Audit Trail) */}
      {!isNestedRoute && activeTab !== 'Folder' && activeTab !== 'Compliance' && activeTab !== 'Security' && activeTab !== 'Shared Documents' && (
        <div className="bg-white rounded-lg p-6">
          <p className="text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
            {activeTab} content coming soon...
          </p>
        </div>
      )}

      {/* Render nested routes - Always render Outlet, it will show FolderContents when route matches */}
      <Outlet />

      {/* Share Documents Modal */}
      <ShareDocumentsModal
        show={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setSelectedDocumentsForShare([]);
        }}
        selectedDocuments={selectedDocumentsForShare}
        onSuccess={() => {
          // Refresh shared documents list if on that tab
          if (activeTab === 'Shared Documents') {

            // The SharedDocumentsList component will handle its own refresh
          }
        }}
      />

      {/* Upload Document Modal */}
      <FirmAdminUploadModal
        show={showUploadModal}
        handleClose={() => setShowUploadModal(false)}
        onUploadSuccess={() => {
          // Refresh folders and documents after successful upload
          if (!isNestedRoute) {
            fetchDocuments(null);
          }
        }}
      />

      {/* Delete Folder Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteFolderConfirm}
        onClose={() => {
          if (!loading) {
            setShowDeleteFolderConfirm(false);
            setFolderToDelete(null);
          }
        }}
        onConfirm={confirmDeleteFolder}
        title="Delete Folder"
        message={folderToDelete ? `Are you sure you want to delete the folder "${folderToDelete.name}"? This action cannot be undone.` : "Are you sure you want to delete this folder? This action cannot be undone."}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={loading}
        isDestructive={true}
      />
    </div>
  );
}
