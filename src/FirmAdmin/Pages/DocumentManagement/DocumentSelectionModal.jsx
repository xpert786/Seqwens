import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { firmAdminDocumentsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { FiSearch, FiX, FiCheck, FiFile } from 'react-icons/fi';

export default function DocumentSelectionModal({ show, onClose, onSelectDocuments, multiple = true }) {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [folderId, setFolderId] = useState(null);
  const [folders, setFolders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    if (show) {
      fetchFolders();
      // Reset state when modal opens
      setSelectedDocumentIds([]);
      setSearchQuery('');
      setFolderId(null);
      setCurrentPage(1);
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      fetchDocuments();
      setCurrentPage(1);
    }
  }, [show, folderId, searchQuery]);

  const fetchFolders = async () => {
    try {
      const response = await firmAdminDocumentsAPI.listFolders();
      if (response.success && response.data) {
        setFolders(response.data.folders || response.data || []);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (folderId) params.folder_id = folderId;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await firmAdminDocumentsAPI.getDocumentsByFolders(params);

      if (response.success && response.data) {
        const docs = response.data.documents || [];
        setDocuments(docs);
        // If search is done server-side, use the results directly
        // Otherwise, apply client-side filtering
        if (searchQuery.trim()) {
          // Server already filtered, but we can do additional client-side filtering if needed
          setFilteredDocuments(docs);
        } else {
          setFilteredDocuments(docs);
        }
      } else {
        setDocuments([]);
        setFilteredDocuments([]);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to load documents', {
        position: "top-right",
        autoClose: 3000,
      });
      setDocuments([]);
      setFilteredDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDocument = (docId) => {
    if (multiple) {
      setSelectedDocumentIds(prev => {
        if (prev.includes(docId)) {
          return prev.filter(id => id !== docId);
        } else {
          return [...prev, docId];
        }
      });
    } else {
      setSelectedDocumentIds([docId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedDocumentIds.length === filteredDocuments.length) {
      setSelectedDocumentIds([]);
    } else {
      setSelectedDocumentIds(filteredDocuments.map(doc => doc.id));
    }
  };

  const handleConfirm = () => {
    if (selectedDocumentIds.length === 0) {
      toast.error('Please select at least one document', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const selectedDocs = documents.filter(doc => selectedDocumentIds.includes(doc.id));
    onSelectDocuments(selectedDocs);
    onClose();
  };

  const getDocumentName = (doc) => {
    return doc.name ||
      doc.file_name ||
      (doc.tax_documents ? doc.tax_documents.split('/').pop() : '') ||
      `Document ${doc.id}`;
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-10"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full modal-600w relative modal-body-scroll"
        style={{
          maxHeight: '75vh',
          overflowY: 'auto',
          position: 'relative',
          fontFamily: 'BasisGrotesquePro'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>
          {`
            .modal-600w {
              max-width: 500px;
            }
            @media (max-width: 576px) {
              .modal-600w {
                max-width: 95%;
              }
            }
            .modal-body-scroll::-webkit-scrollbar {
              width: 8px;
            }
            .modal-body-scroll::-webkit-scrollbar-track {
              background: #f8fafc;
            }
            .modal-body-scroll::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 10px;
              border: 2px solid #f8fafc;
            }
            .modal-body-scroll::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
          `}
        </style>

        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-[#3B4A66] transition-all duration-200 z-[20]"
        >
          <FiX size={20} />
        </button>

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100">
          <h4 className="text-xl font-bold text-[#3B4A66] leading-tight">
            Select Documents to Share
          </h4>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6">
          {/* Folder Filter */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex-grow">
              <label className="block text-[11px] uppercase tracking-wider font-bold mb-1" style={{ color: '#94A3B8' }}>
                Filter by Folder
              </label>
              <select
                className="w-full max-w-[220px] border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00C0C6]/20 bg-white cursor-pointer hover:border-[#00C0C6]/50 transition-colors"
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">All Folders</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.title || folder.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <FiSearch
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C0C6]/20"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Documents List */}
          {loading ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-[#00C0C6]"></div>
              <p className="mt-2 text-sm text-gray-500">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-sm text-gray-500 mb-0">
                {searchQuery || folderId ? 'No matching documents found' : 'No documents available'}
              </p>
            </div>
          ) : (
            <>
              {multiple && (
                <div className="flex justify-between items-center mb-2 px-1">
                  <p className="text-xs text-gray-500 mb-0">
                    {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
                  </p>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-[#3B4A66] bg-white border border-gray-200 px-3 py-1 rounded-md hover:bg-gray-50 transition-colors"
                    style={{ borderRadius: "10px" }}
                    onClick={handleSelectAll}
                  >
                    {selectedDocumentIds.length === filteredDocuments.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              )}
              <div
                className="border border-gray-100 rounded-lg p-2 bg-gray-50/30"
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto'
                }}
              >
                {(() => {
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const paginatedDocs = filteredDocuments.slice(startIndex, startIndex + itemsPerPage);
                  return paginatedDocs.map((doc) => {
                    const isSelected = selectedDocumentIds.includes(doc.id);

                    return (
                      <div
                        key={doc.id}
                        onClick={() => toggleDocument(doc.id)}
                        className={`flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 ${isSelected
                          ? 'bg-[#E0F2FE] border-[#0369A1]'
                          : 'bg-white border-gray-100 hover:border-[#00C0C6]/50'
                          }`}
                        style={{ border: '1px solid' }}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div
                            className={`flex-shrink-0 w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${isSelected
                              ? 'bg-[#0369A1] border-[#0369A1]'
                              : 'bg-white border-gray-300'
                              }`}
                          >
                            {isSelected && <FiCheck size={14} color="white" />}
                          </div>
                          <FiFile size={18} className="text-[#00C0C6] flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#3B4A66] truncate mb-0.5" style={{ maxWidth: '140px' }}>
                              {getDocumentName(doc)}
                            </p>
                            <div className="flex flex-wrap gap-x-3 text-[10px] text-gray-400 font-medium">
                              {doc.category?.name && (
                                <span>Cat: <span className="text-gray-600">{doc.category.name}</span></span>
                              )}
                              {doc.folder?.title && (
                                <span>Fol: <span className="text-gray-600">{doc.folder.title}</span></span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Pagination Controls */}
              {filteredDocuments.length > itemsPerPage && (
                <div className="flex justify-between items-center mt-4 px-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}

                    style={{ borderRadius: "10px" }}
                    className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-[#3B4A66] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-medium text-gray-500">
                    Page {currentPage} of {Math.ceil(filteredDocuments.length / itemsPerPage)}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === Math.ceil(filteredDocuments.length / itemsPerPage)}
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredDocuments.length / itemsPerPage), prev + 1))}

                    style={{ borderRadius: "10px" }}
                    className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-[#3B4A66] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* Selected Count */}
          {selectedDocumentIds.length > 0 && (
            <div className="mt-4 p-3 bg-[#E0F2FE] border border-[#BAE6FD] rounded-lg flex items-center justify-between">
              <p className="text-sm font-semibold text-[#0369A1] mb-0">
                {selectedDocumentIds.length} document{selectedDocumentIds.length !== 1 ? 's' : ''} selected
              </p>
              <button
                onClick={handleConfirm}
                className="bg-[#00C0C6] text-white px-5 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#00A8AE] transition-all transform active:scale-95"
              >
                Continue
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedDocumentIds.length === 0}
            className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-sm transition-all ${selectedDocumentIds.length === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-[#00C0C6] hover:bg-[#00A8AE] active:scale-95'
              }`}
          >
            Select {selectedDocumentIds.length > 0 ? `(${selectedDocumentIds.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}


