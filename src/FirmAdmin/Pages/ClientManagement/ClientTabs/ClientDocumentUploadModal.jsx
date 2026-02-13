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
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [markForEsign, setMarkForEsign] = useState(false);
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const API_BASE_URL = getApiBaseUrl();

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
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.csv'];
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
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
      toast.error(`${invalidFiles.length} file(s) have unsupported formats and were ignored. Supported: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, CSV`, {
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
        folder_id: selectedFolderId || null,
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
    setSelectedFolderId(currentFolderId || null);
    setMarkForEsign(false);
    setIsDragging(false);
    handleClose();
  };

  return (
    <Modal show={show} onHide={resetModal} centered backdrop="static" size="lg" className="upload-modal">
      <style>
        {`
          .modal-body-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .modal-body-scroll::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          .modal-body-scroll::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 10px;
          }
        `}
      </style>
      <Modal.Body className="p-4 modal-body-scroll" style={{
        overflowY: 'auto',
        maxHeight: '85vh',
        fontSize: '13px'
      }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h5 className="upload-heading" style={{ fontSize: '18px', fontWeight: '600' }}>Upload Documents</h5>
            <p className="upload-subheading" style={{ fontSize: '13px' }}>Upload documents directly to the client's portal</p>
          </div>
          <button onClick={resetModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="upload-section-title" style={{ fontSize: '14px', fontWeight: '500' }}>Add Files</p>

        {/* Dropzone */}
        <div
          ref={dropzoneRef}
          className={`upload-dropzone mb-4 bg-white border rounded p-4 cursor-pointer text-center ${isDragging ? 'border-primary' : ''}`}
          onClick={handleFileSelect}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            borderColor: isDragging ? '#3AD6F2' : '#d3d3d3',
            borderWidth: isDragging ? '3px' : '2px',
            backgroundColor: isDragging ? '#F0F9FF' : '#fafafa',
          }}
        >
          <input
            type="file"
            multiple
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            disabled={uploading}
          />
          <UploadsIcon className="upload-icon mb-2" />
          <p className="upload-text" style={{ fontSize: '13px' }}>
            <strong className="texts">Drop files here or click to browse</strong>
          </p>
          <p className="upload-hint" style={{ fontSize: '11px' }}>
            Supports PDFs, Word, Excel, CSV & Images - Max 50MB per file
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h6 className="m-0 text-sm font-semibold text-slate-700 font-[BasisGrotesquePro]">Selected Files ({files.length})</h6>
              <button
                className="p-0 text-xs text-red-500 hover:text-red-700 bg-transparent border-0 font-[BasisGrotesquePro]"
                onClick={() => setFiles([])}
              >
                Clear All
              </button>
            </div>
            <div className="border rounded bg-slate-50 overflow-y-auto custom-scrollbar" style={{ maxHeight: '180px' }}>
              {files.map((file, index) => (
                <div key={index} className="flex justify-between items-center p-2 border-b bg-white m-1 rounded shadow-sm">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-8 h-8 rounded bg-orange-50 flex items-center justify-center text-orange-500 mr-2 flex-shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate font-[BasisGrotesquePro]">{file.name}</div>
                      <div className="text-[10px] text-slate-400 font-[BasisGrotesquePro]">{file.size}</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    disabled={uploading}
                    className="ml-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">
                Target Folder
              </label>
              <select
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value ? parseInt(e.target.value) : null)}
                disabled={uploading || loadingFolders}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all font-[BasisGrotesquePro]"
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

          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center text-orange-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 font-[BasisGrotesquePro] m-0">Mark for eSign</p>
                <p className="text-[10px] text-slate-500 font-[BasisGrotesquePro] m-0">Notify client to sign these documents</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mb-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={markForEsign}
                onChange={(e) => setMarkForEsign(e.target.checked)}
                disabled={uploading}
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={resetModal}
            disabled={uploading}
            className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-all font-[BasisGrotesquePro] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="btn-upload-custom px-6 py-2 text-sm font-bold text-white rounded-md transition-all shadow-sm font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <span>Upload {files.length > 0 ? files.length : ''} Document{files.length !== 1 ? 's' : ''}</span>
            )}
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

