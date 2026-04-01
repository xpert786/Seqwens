import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import SignatureBuilder from '../../../../components/SignatureBuilder';
import { UploadsIcon } from '../../../../ClientOnboarding/components/icons';
import '../../../../ClientOnboarding/styles/Upload.css';
import '../../../styles/ClientManage.css';
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
  const [showBuilder, setShowBuilder] = useState(false);
  const [esignFields, setEsignFields] = useState([]);
  const [fileToSign, setFileToSign] = useState(null);
  const [clientInfo, setClientInfo] = useState({
    status: null,
    permissions: { can_upload: true, can_esign: true },
    autoAssigned: false
  });
  const [loadingInfo, setLoadingInfo] = useState(false);
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

  // Fetch client status and permissions
  useEffect(() => {
    const fetchClientInfo = async () => {
      if (!show || !clientId) return;

      try {
        setLoadingInfo(true);
        const result = await firmAdminClientsAPI.getClientDetails(clientId);
        if (result.success && result.data) {
          setClientInfo({
            status: result.data.client_status || result.data.status || 'ACTIVE',
            permissions: result.data.permissions || { can_upload: true, can_esign: true },
            autoAssigned: result.data.auto_assigned || false
          });
        }
      } catch (error) {
        console.error('Error fetching client info:', error);
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchClientInfo();
  }, [show, clientId]);

  // Helper to get status badge style
  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' };
      case 'FORMER': return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Former' };
      case 'SHARED': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Shared' };
      case 'MULTI_FIRM': return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Multi-Firm' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-700', label: status || 'Unknown' };
    }
  };

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
    if (selectedFiles.length > 1) {
      toast.warning('Only one document can be uploaded at a time. Using the first file selected.', {
        position: 'top-right',
        autoClose: 4000
      });
      selectedFiles = [selectedFiles[0]];
    }

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
      toast.error(`${invalidFiles[0].name} has an unsupported format and was ignored. Supported: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, CSV`, {
        position: 'top-right',
        autoClose: 5000
      });
    }

    // Filter non-PDF files if markForEsign is enabled
    if (markForEsign) {
      const nonPdfFiles = validFiles.filter(file => file.type.toLowerCase() !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'));
      if (nonPdfFiles.length > 0) {
        toast.warning('Only PDF files can be used for eSignature. Non-PDF files were filtered.', {
          position: 'top-right',
          autoClose: 4000
        });
        // Only keep PDFs
        const pdfOnlyFiles = validFiles.filter(file => file.type.toLowerCase() === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
        if (pdfOnlyFiles.length === 0) return;

        const file = pdfOnlyFiles[0];
        const newFile = {
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          fileObject: file
        };
        setFiles([newFile]);
        return;
      }
    }

    if (validFiles.length === 0) {
      return;
    }

    const file = validFiles[0];
    const newFile = {
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      fileObject: file
    };
    setFiles([newFile]);
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

      // If marked for eSign, we need to show the builder first if not already done
      if (markForEsign && !showBuilder && esignFields.length === 0) {
        // Find the first PDF to sign
        const pdfFile = fileObjects.find(f => f.type === 'application/pdf');
        if (pdfFile) {
          setFileToSign(pdfFile);
          setShowBuilder(true);
          return;
        } else {
          toast.warning('Mark for eSign is enabled but no PDF file was found. Proceeding with regular upload.');
        }
      }

      const uploadData = {
        files: fileObjects,
        folder_id: selectedFolderId || null,
        mark_for_esign: markForEsign,
        esign_fields: esignFields.length > 0 ? esignFields : null
      };

      const response = await firmAdminClientsAPI.uploadClientDocuments(clientId, uploadData);

      if (response.success) {
        const uploadedCount = response.data?.uploaded_count || files.length;
        const wasAutoAssigned = response.data?.auto_assigned || false;

        if (wasAutoAssigned) {
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-bold text-sm">Upload Successful & Client Assigned</span>
              <span className="text-[11px] leading-tight">This client has been automatically assigned to your portfolio during the upload process.</span>
            </div>,
            { 
              position: 'top-right', 
              autoClose: 6000, 
              icon: '🏷️',
              style: { backgroundColor: '#F0FDFF', border: '1px solid #3AD6F2' }
            }
          );
        } else {
          toast.success(`Successfully uploaded ${uploadedCount} document(s)`, {
            position: 'top-right',
            autoClose: 3000
          });
        }

        resetModal();
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      
      // Get contextual error information from the response data if available
      const errorData = error.responseData || error.response?.data;
      const errorType = errorData?.error_type || error.error_type;

      if (errorType) {
        switch (errorType) {
          case 'ASSIGNMENT_MISSING':
            toast.error(errorData.message || 'This client needs to be assigned before you can continue. Assign them to yourself now.', {
              autoClose: 5000,
              icon: '🚨'
            });
            break;
          case 'MULTI_FIRM_CONFLICT':
            toast.warning(errorData.message || 'This client belongs to multiple firms. Please verify your permissions.', {
              autoClose: 5000
            });
            break;
          case 'NO_PERMISSION':
            toast.error(errorData.message || 'You do not have permission to upload documents for this client.', {
              autoClose: 3000
            });
            break;
          default:
            toast.error(errorData.message || error.message || 'Upload failed');
        }
      } else {
        const errorMsg = handleAPIError(error);
        toast.error(errorMsg || 'Failed to upload documents. Please try again.', {
          position: 'top-right',
          autoClose: 5000
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setFiles([]);
    setSelectedFolderId(currentFolderId || null);
    setMarkForEsign(false);
    setIsDragging(false);
    setShowBuilder(false);
    setEsignFields([]);
    setFileToSign(null);
    handleClose();
  };

  return (
    <Modal
      show={show}
      onHide={resetModal}
      backdrop="static"
      className="upload-modal"
      dialogClassName="upload-dialog-custom"
      contentClassName="upload-content-custom"
    >
      <Modal.Body className="p-4 modal-body-scroll" style={{
        overflowY: 'auto',
        maxHeight: '70vh',
        fontSize: '13px'
      }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h5 className="upload-heading mb-0" style={{ fontSize: '18px', fontWeight: '600' }}>Upload Documents</h5>
              {clientInfo.status && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(clientInfo.status).bg} ${getStatusBadge(clientInfo.status).text}`}>
                  {getStatusBadge(clientInfo.status).label}
                </span>
              )}
              {clientInfo.autoAssigned && (
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wider">
                  Auto-Assigned
                </span>
              )}
            </div>
            <p className="upload-subheading mb-0" style={{ fontSize: '13px' }}>Upload documents directly to the client's portal</p>
          </div>
          <button onClick={resetModal} className="p-2 rounded-full transition-colors text-slate-400">
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
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={markForEsign ? ".pdf,application/pdf" : ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"}
            disabled={uploading}
          />
          <UploadsIcon className="upload-icon mb-2" />
          <p className="upload-text" style={{ fontSize: '13px' }}>
            <strong className="texts">Drop {markForEsign ? 'PDF' : 'file'} here or click to browse</strong>
          </p>
          <p className={`upload-hint ${markForEsign ? 'text-red-500 font-medium' : ''}`} style={{ fontSize: '11px' }}>
            {markForEsign ? 'Only PDF files can be used for eSignature' : 'Supports PDFs, Word, Excel, CSV & Images'} - Max 50MB per file
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h6 className="m-0 text-sm font-semibold text-slate-700 font-[BasisGrotesquePro]">Selected File</h6>
              <button
                className="p-0 text-xs text-red-500 bg-transparent border-0 font-[BasisGrotesquePro]"
                onClick={() => setFiles([])}
              >
                Clear
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
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (!clientInfo.permissions.can_esign && checked) {
                    toast.warning("You do not have permission to request e-signatures for this client.", {
                      position: 'top-right',
                      autoClose: 3000
                    });
                    return;
                  }
                  if (checked && files.length > 0) {
                    const hasNonPdf = files.some(f => {
                      const file = f.fileObject;
                      return file.type.toLowerCase() !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf');
                    });
                    if (hasNonPdf) {
                      toast.warning('Only PDF files can be used for eSignature. Non-PDF files will be removed.', {
                        position: 'top-right',
                        autoClose: 4000
                      });
                      setFiles(prev => prev.filter(f => {
                        const file = f.fileObject;
                        return file.type.toLowerCase() === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                      }));
                    }
                  }
                  setMarkForEsign(checked);
                }}
                disabled={uploading || !clientInfo.permissions.can_esign}
              />
              <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${!clientInfo.permissions.can_esign ? 'opacity-50 grayscale' : ''}`}></div>
            </label>
          </div>
          {!clientInfo.permissions.can_upload && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-[11px] font-medium text-red-700 m-0">You don't have permission to upload documents for this client.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={resetModal}
            disabled={uploading}
            className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-md transition-all font-[BasisGrotesquePro] disabled:opacity-50"
            style={{ borderRadius: "10px" }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0 || !clientInfo.permissions.can_upload}
            className="btn-upload-custom px-6 py-2 text-sm font-bold text-white rounded-md transition-all shadow-sm font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
            style={{ borderRadius: "10px" }}
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <span>{markForEsign ? 'Prepare & Upload' : `Upload Document`}</span>
            )}
          </button>
        </div>

        {/* Signature Builder Modal */}
        <Modal
          show={showBuilder && !!fileToSign}
          onHide={() => {
            setShowBuilder(false);
            setFileToSign(null);
          }}
          backdrop="static"
          className="signature-builder-modal"
          dialogClassName="esign-builder-dialog"
          contentClassName="esign-builder-content"
        >
          <Modal.Header closeButton className="border-b-0 pb-2">
            <Modal.Title className="text-lg font-bold text-slate-700">Prepare Document for eSign</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0 bg-white overflow-hidden" style={{ height: '82vh' }}>
            {fileToSign && (
              <SignatureBuilder
                pdfFile={fileToSign}
                onSave={(fields) => {
                  setEsignFields(fields);
                  setShowBuilder(false);
                  setTimeout(() => handleUpload(), 100);
                }}
                onCancel={() => {
                  setShowBuilder(false);
                  setFileToSign(null);
                }}
              />
            )}
          </Modal.Body>
        </Modal>
      </Modal.Body>
    </Modal>
  );
}

