import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { UploadsIcon } from '../../../../ClientOnboarding/components/icons';
import '../../../../ClientOnboarding/styles/Upload.css';
import { toast } from 'react-toastify';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminClientsAPI, firmAdminDocumentsAPI } from '../../../../ClientOnboarding/utils/apiUtils';

export default function ClientDocumentUploadModal({ show, handleClose, clientId, currentFolderId, onUploadSuccess }) {
  const fileInputRef = useRef();
  const dropzoneRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [tags, setTags] = useState('');
  const API_BASE_URL = getApiBaseUrl();

  // Fetch categories for the client
  useEffect(() => {
    const fetchCategories = async () => {
      if (!show || !clientId) return;

      try {
        setLoadingCategories(true);
        // Fetch categories - using firm admin categories API
        const result = await firmAdminDocumentsAPI.listCategories();
        
        let categoriesList = [];
        if (result.success && result.data && Array.isArray(result.data)) {
          categoriesList = result.data;
        } else if (Array.isArray(result)) {
          categoriesList = result;
        } else if (result.data && Array.isArray(result.data)) {
          categoriesList = result.data;
        }

        // Filter only active categories
        const activeCategories = categoriesList.filter(cat => cat.is_active !== false);
        setCategories(activeCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error(handleAPIError(error) || 'Failed to load categories', {
          position: 'top-right',
          autoClose: 3000
        });
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [show, clientId]);

  // Set current folder as default if provided
  useEffect(() => {
    if (currentFolderId) {
      setSelectedFolderId(currentFolderId);
    }
  }, [currentFolderId]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  // Validate file type and size
  const isValidFileType = (file) => {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    // Allowed file extensions
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
    const fileExtension = '.' + fileName.split('.').pop();
    
    // Check by extension
    if (allowedExtensions.includes(fileExtension)) {
      return true;
    }
    
    // Check by MIME type
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    return allowedMimeTypes.includes(fileType);
  };

  // Process files (from drag-drop or file input)
  const processFiles = (selectedFiles) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    // Filter valid files
    const validFiles = selectedFiles.filter(file => {
      if (!isValidFileType(file)) {
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`File ${file.name} exceeds 50MB limit and was skipped.`, {
          position: 'top-right',
          autoClose: 3000
        });
        return false;
      }
      return true;
    });

    // Show error for invalid files
    const invalidFiles = selectedFiles.filter(file => !isValidFileType(file));
    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} file(s) have unsupported formats and were ignored. Supported: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX`, {
        position: 'top-right',
        autoClose: 5000
      });
    }

    if (validFiles.length === 0) {
      return;
    }

    const newFiles = validFiles.map((file) => ({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      fileObject: file
    }));
    setFiles([...files, ...newFiles]);
  };

  const handleFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    const updated = [...files];
    updated.splice(index, 1);
    setFiles(updated);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file to upload', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      setUploading(true);

      // Prepare upload data
      const fileObjects = files.map(f => f.fileObject);
      
      const uploadData = {
        files: fileObjects,
        category_id: selectedCategoryId || null,
        folder_id: selectedFolderId || null,
        tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(t => t) : null
      };

      const response = await firmAdminClientsAPI.uploadClientDocuments(clientId, uploadData);

      if (response.success) {
        const uploadedCount = response.data?.uploaded_count || files.length;
        toast.success(`Successfully uploaded ${uploadedCount} document(s)`, {
          position: 'top-right',
          autoClose: 3000
        });
        
        resetModal();
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg || 'Failed to upload documents. Please try again.', {
        position: 'top-right',
        autoClose: 5000
      });
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setFiles([]);
    setSelectedCategoryId(null);
    setSelectedFolderId(currentFolderId || null);
    setTags('');
    setIsDragging(false);
    handleClose();
  };

  return (
    <Modal show={show} onHide={resetModal} centered backdrop="static" size="lg" className="upload-modal">
      <Modal.Body className="p-4">
        <h5 className="upload-heading">Upload Documents</h5>
        <p className="upload-subheading">Upload documents for this client</p>

        <p className="upload-section-title">Add Files</p>

        <div
          ref={dropzoneRef}
          className={`upload-dropzone mb-4 ${isDragging ? 'drag-active' : ''}`}
          onClick={handleFileSelect}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-disabled={uploading}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleFileSelect();
            }
          }}
        >
          <UploadsIcon className="upload-icon" />
          <p className="upload-text">
            <strong className="texts">Drop files here or click to browse</strong>
          </p>
          <p className="upload-hint">Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX - Max 50MB per file</p>
          <input
            type="file"
            multiple
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={uploading}
          />
        </div>

        {files.length > 0 && (
          <div className="mb-4">
            <p className="upload-section-title">Selected Files ({files.length})</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate font-[BasisGrotesquePro]">{file.name}</p>
                      <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">{file.size}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    disabled={uploading}
                    className="ml-2 p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                    type="button"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
            Category (Optional)
          </label>
          <select
            value={selectedCategoryId || ''}
            onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : null)}
            disabled={uploading || loadingCategories}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-[BasisGrotesquePro]"
          >
            <option value="">No Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Folder Selection - Show current folder if available */}
        {currentFolderId && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
              Folder
            </label>
            <input
              type="text"
              value="Current Folder"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-[BasisGrotesquePro]"
            />
            <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
              Documents will be uploaded to the current folder
            </p>
          </div>
        )}

        {/* Tags */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
            Tags (Optional)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Enter tags separated by commas (e.g., urgent, w2, tax-return-2024)"
            disabled={uploading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-[BasisGrotesquePro]"
          />
          <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
            Separate multiple tags with commas
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={resetModal}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Upload {files.length} File{files.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

