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
  const [markForEsign, setMarkForEsign] = useState(false);
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
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

  // Fetch folders for the client
  useEffect(() => {
    const fetchFolders = async () => {
      if (!show || !clientId) return;

      try {
        setLoadingFolders(true);
        const token = getAccessToken();
        // Use the browse endpoint to get folders (at root)
        const url = `${API_BASE_URL}/taxpayer/firm-admin/clients/${clientId}/documents/browse/`;
        const response = await fetchWithCors(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.folders) {
            setFolders(result.data.folders);
          }
        }
      } catch (error) {
        console.error('Error fetching folders:', error);
      } finally {
        setLoadingFolders(false);
      }
    };

    fetchFolders();
  }, [show, clientId, API_BASE_URL]);

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
        tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(t => t) : null,
        mark_for_esign: markForEsign
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
    setMarkForEsign(false);
    setIsDragging(false);
    handleClose();
  };

  return (
    <Modal show={show} onHide={resetModal} centered backdrop="static" size="lg" className="client-upload-premium-modal">
      <Modal.Body className="p-0 overflow-hidden !rounded-2xl">
        <div className="flex flex-col md:flex-row min-h-[500px]">
          {/* Left Side - Info & Tips */}
          <div className="md:w-1/3 bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-8 text-white flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                <UploadsIcon className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="text-xl font-bold mb-2 font-[BasisGrotesquePro]">Document Manager</h4>
              <p className="text-slate-400 text-sm leading-relaxed font-[BasisGrotesquePro]">
                Upload documents directly to your client's portal. Organize them into folders and categories for better tracking.
              </p>

              <div className="mt-10 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-300 font-[BasisGrotesquePro]">Supports PDFs, Word, Excel & Images</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-300 font-[BasisGrotesquePro]">Maximum file size: 50MB per document</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-700/50 mt-auto">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Security</p>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-[11px] text-slate-400">AES-256 Encrypted Upload</span>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="md:w-2/3 p-8 bg-white overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h5 className="text-xl font-bold text-slate-900 font-[BasisGrotesquePro]">Upload Documents</h5>
                <p className="text-sm text-slate-500 font-[BasisGrotesquePro]">Define destination and file properties</p>
              </div>
              <button onClick={resetModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Dropzone */}
            <div
              ref={dropzoneRef}
              className={`relative overflow-hidden group border-2 border-dashed transition-all duration-300 !rounded-2xl p-8 text-center mb-6 ${isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : files.length > 0
                    ? 'border-slate-200 bg-slate-50/50'
                    : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                }`}
              onClick={handleFileSelect}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={uploading}
              />

              <div className="flex flex-col items-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${isDragging ? 'bg-blue-100' : 'bg-slate-100 group-hover:bg-blue-50'
                  }`}>
                  <svg className={`w-7 h-7 transition-colors ${isDragging ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-700 font-[BasisGrotesquePro]">
                  {isDragging ? 'Drop files now' : 'Select files to upload'}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-[BasisGrotesquePro]">
                  or drag and drop them here
                </p>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-[BasisGrotesquePro]">
                    Selected Files ({files.length})
                  </p>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white border border-slate-100 !rounded-xl shadow-sm group hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate font-[BasisGrotesquePro]">{file.name}</p>
                          <p className="text-[10px] text-slate-400 font-[BasisGrotesquePro]">{file.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        disabled={uploading}
                        className="ml-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 !rounded-lg transition-colors"
                        type="button"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">
                  Categorization
                </label>
                <select
                  value={selectedCategoryId || ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={uploading || loadingCategories}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 !rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-[BasisGrotesquePro]"
                >
                  <option value="">General / Tax Documents</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Folder */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">
                  Target Folder
                </label>
                <select
                  value={selectedFolderId || ''}
                  onChange={(e) => setSelectedFolderId(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={uploading || loadingFolders}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 !rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-[BasisGrotesquePro]"
                >
                  <option value="">Main Folder (Root)</option>
                  {currentFolderId && (
                    <option value={currentFolderId}>Current Folder</option>
                  )}
                  {folders.map((folder) => (
                    folder.id !== currentFolderId && (
                      <option key={folder.id} value={folder.id}>
                        {folder.title}
                      </option>
                    )
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">
                Meta Tags
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. w2, urgent, 2024 (comma separated)"
                  disabled={uploading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 !rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-[BasisGrotesquePro]"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>

            {/* Options */}
            <div className="bg-blue-50/50 border border-blue-100 !rounded-2xl p-4 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 font-[BasisGrotesquePro]">Mark for eSign</p>
                    <p className="text-[11px] text-slate-500 font-[BasisGrotesquePro]">Notify client to sign these documents</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={markForEsign}
                    onChange={(e) => setMarkForEsign(e.target.checked)}
                    disabled={uploading}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={resetModal}
                disabled={uploading}
                className="flex-1 px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 !rounded-xl transition-all font-[BasisGrotesquePro] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                className="flex-[2] relative px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 !rounded-xl transition-all shadow-lg shadow-blue-500/25 font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Confirm & Upload {files.length} Item{files.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}

