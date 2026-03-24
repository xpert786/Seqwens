import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { firmAdminDocumentsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { FiSearch, FiX, FiCheck, FiFile, FiFolder, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { IoMdClose } from 'react-icons/io';

/**
 * DocumentSelectionModal
 * A premium document selector refactored to use React Portals and Tailwind CSS.
 */
export default function DocumentSelectionModal({ show, onClose, onSelectDocuments, multiple = true }) {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [folderId, setFolderId] = useState(null);
  const [folders, setFolders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Balance between viewable items and scrolling

  useEffect(() => {
    if (show) {
      fetchFolders();
      // Reset state when modal opens
      setSelectedDocumentIds([]);
      setSearchQuery('');
      setFolderId(null);
      setCurrentPage(1);
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
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
        setFilteredDocuments(docs);
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

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocs = filteredDocuments.slice(startIndex, startIndex + itemsPerPage);

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6"
      style={{ fontFamily: 'BasisGrotesquePro' }}
    >
      {/* Backdrop with premium blur */}
      <div 
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-[#1E293B]">Select Documents</h3>
            <p className="text-sm text-slate-500 mt-0.5">Choose files to share or attach</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        {/* Filters & Search - Glass Effect */}
        <div className="p-6 pb-2 space-y-4 flex-shrink-0 bg-slate-50/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative group">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00C0C6] transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00C0C6]/20 focus:border-[#00C0C6] transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Folder Select */}
            <div className="relative">
              <FiFolder className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00C0C6]/20 focus:border-[#00C0C6] appearance-none cursor-pointer transition-all"
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

          {multiple && filteredDocuments.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {filteredDocuments.length} Documents Found
              </span>
              <button
                onClick={handleSelectAll}
                className="text-xs font-semibold text-[#00C0C6] hover:underline"
              >
                {selectedDocumentIds.length === filteredDocuments.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Document List */}
        <div className="flex-grow overflow-y-auto px-6 py-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-[#00C0C6] rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-slate-500 font-medium font-basis tracking-wide">Fetching documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <FiFile size={28} className="text-slate-200" />
              </div>
              <p className="text-slate-600 font-bold mb-1">No Documents Found</p>
              <p className="text-slate-400 text-sm">Try using different keywords or folder filters</p>
            </div>
          ) : (
            <div className="space-y-2.5 pb-2">
              {paginatedDocs.map((doc) => {
                const isSelected = selectedDocumentIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocument(doc.id)}
                    className={`group relative flex items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? 'bg-[#00C0C6]/5 border-[#00C0C6] shadow-[0_0_15px_rgba(0,192,198,0.1)]' 
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'bg-[#00C0C6] border-[#00C0C6]' 
                        : 'bg-white border-slate-200 group-hover:border-[#00C0C6]'
                    }`}>
                      {isSelected && <FiCheck className="text-white" size={14} strokeWidth={3} />}
                    </div>

                    <div className="ml-4 flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        <FiFile className={isSelected ? 'text-[#00C0C6]' : 'text-slate-400'} size={18} />
                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-[#1E293B]' : 'text-slate-600'}`}>
                          {getDocumentName(doc)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-medium text-slate-400 overflow-hidden">
                        {doc.folder?.title && (
                          <span className="flex items-center gap-1 truncate">
                            <FiFolder size={12} /> {doc.folder.title}
                          </span>
                        )}
                        {doc.category?.name && (
                          <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-100 text-slate-500 truncate">
                            {doc.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Pagination and Actions */}
        <div className="px-6 py-5 border-t border-slate-100 bg-white flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Pagination Controls */}
            {totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-[#00C0C6] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <FiChevronLeft size={20} />
                </button>
                <div className="flex items-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-900">{currentPage}</span>
                  <span className="mx-1.5 text-[10px] text-slate-300 font-bold">/</span>
                  <span className="text-xs font-bold text-slate-500">{totalPages}</span>
                </div>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-[#00C0C6] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <FiChevronRight size={20} />
                </button>
              </div>
            ) : (
              <div className="hidden sm:block"></div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedDocumentIds.length === 0}
                className={`flex-1 sm:flex-none px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-[#00C0C6]/20 transition-all transform active:scale-95 ${
                  selectedDocumentIds.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-[#00C0C6] to-[#01AFB5] hover:brightness-105 select-none'
                }`}
              >
                Continue {selectedDocumentIds.length > 0 ? `(${selectedDocumentIds.length})` : ''}
              </button>
            </div>
          </div>
        </div>

        <style>
          {`
            .custom-scrollbar::-webkit-scrollbar {
              width: 5px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #F1F5F9;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #E2E8F0;
            }
          `}
        </style>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
