import React, { useState, useRef } from 'react';
import { workflowAPI, handleAPIError } from '../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { FaTimes, FaFilePdf, FaSpinner, FaUpload } from 'react-icons/fa';

/**
 * DocumentUploadComponent
 * Handle file uploads for document requests
 */
const DocumentUploadComponent = ({
  requestId,
  categories = [],
  onUploadComplete,
  onError,
  onCancel,
  storageUsage = null,
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Check storage before upload
  const checkStorage = (fileSize) => {
    if (!storageUsage) return true;
    
    const fileSizeGB = fileSize / (1024 ** 3);
    const newTotal = storageUsage.total_gb + fileSizeGB;
    
    if (newTotal > storageUsage.limit_gb) {
      toast.error(`Storage limit exceeded! Cannot upload file. (${storageUsage.total_gb.toFixed(2)} GB / ${storageUsage.limit_gb} GB)`);
      return false;
    }
    
    if (storageUsage.percentage_used >= 80) {
      toast.warning(`Storage usage is high: ${storageUsage.percentage_used.toFixed(0)}%`);
    }
    
    return true;
  };

  // Validate file
  const validateFile = (file) => {
    // Check file type (PDF only)
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return { valid: false, error: 'Only PDF files are allowed' };
    }

    // Check file size (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check storage
    if (!checkStorage(file.size)) {
      return { valid: false, error: 'Storage limit exceeded' };
    }

    return { valid: true };
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = [];

    selectedFiles.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push({
          file,
          id: Date.now() + Math.random(),
          status: 'pending',
          progress: 0,
        });
      } else {
        toast.error(`${file.name}: ${validation.error}`);
      }
    });

    setFiles((prev) => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    const validFiles = [];

    droppedFiles.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push({
          file,
          id: Date.now() + Math.random(),
          status: 'pending',
          progress: 0,
        });
      } else {
        toast.error(`${file.name}: ${validation.error}`);
      }
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  const uploadFile = async (fileItem) => {
    try {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileItem.id ? { ...f, status: 'uploading' } : f))
      );

      const response = await workflowAPI.uploadDocumentForRequest(
        requestId,
        fileItem.file,
        (progress) => {
          setUploadProgress((prev) => ({
            ...prev,
            [fileItem.id]: progress,
          }));
        }
      );

      if (response.success) {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileItem.id ? { ...f, status: 'success' } : f))
        );
        if (onUploadComplete) {
          onUploadComplete(response.data);
        }
        toast.success(`${fileItem.file.name} uploaded successfully`);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFiles((prev) =>
        prev.map((f) => (f.id === fileItem.id ? { ...f, status: 'error', error: error.message } : f))
      );
      const errorMsg = handleAPIError(error) || error.message || 'Failed to upload file';
      toast.error(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    }
  };

  const handleUploadAll = async () => {
    if (files.length === 0) {
      toast.warning('Please select files to upload');
      return;
    }

    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) {
      toast.info('All files have been uploaded');
      return;
    }

    setUploading(true);
    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const fileItem of pendingFiles) {
        await uploadFile(fileItem);
      }
      toast.success('All files uploaded successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="document-upload-component">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-2 font-[BasisGrotesquePro]">
          Upload Documents
        </h4>
        {categories.length > 0 && (
          <p className="text-sm text-gray-600 mb-2 font-[BasisGrotesquePro]">
            Requested categories: {categories.map((c) => (typeof c === 'object' ? c.name : c)).join(', ')}
          </p>
        )}
        <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">
          Supported: PDF only (max 10MB per file)
        </p>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <FaFilePdf className="mx-auto text-4xl text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2 font-[BasisGrotesquePro]">
          {isDragActive ? 'Drop files here' : 'Drag and drop files here, or click to browse'}
        </p>
        <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">
          PDF files only, maximum 10MB per file
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h5 className="text-sm font-semibold text-gray-700 mb-2 font-[BasisGrotesquePro]">
            Selected Files ({files.length})
          </h5>
          {files.map((fileItem) => (
            <div
              key={fileItem.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FaFilePdf className="text-red-500 text-xl flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate font-[BasisGrotesquePro]">
                    {fileItem.file.name}
                  </p>
                  <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                    {formatFileSize(fileItem.file.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Progress Bar */}
                {fileItem.status === 'uploading' && (
                  <div className="w-32">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress[fileItem.id] || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center font-[BasisGrotesquePro]">
                      {uploadProgress[fileItem.id] || 0}%
                    </p>
                  </div>
                )}

                {/* Status Icons */}
                {fileItem.status === 'success' && (
                  <div className="flex items-center text-green-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {fileItem.status === 'error' && (
                  <div className="flex items-center text-red-600" title={fileItem.error}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}

                {/* Remove Button */}
                {fileItem.status !== 'uploading' && (
                  <button
                    onClick={() => removeFile(fileItem.id)}
                    className="text-gray-400 hover:text-red-600 transition"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
            disabled={uploading}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleUploadAll}
          disabled={uploading || files.filter((f) => f.status === 'pending').length === 0}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro] flex items-center gap-2"
        >
          {uploading ? (
            <>
              <FaSpinner className="animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload All'
          )}
        </button>
      </div>
    </div>
  );
};

export default DocumentUploadComponent;

