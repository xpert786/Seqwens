import React, { useState, useEffect } from 'react';
import { firmAdminDocumentsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { FiSearch, FiTrash2, FiRefreshCw, FiFile, FiUser, FiCalendar, FiShare2 } from 'react-icons/fi';
import ConfirmationModal from '../../../components/ConfirmationModal';
import ShareDocumentsModal from './ShareDocumentsModal';
import DocumentSelectionModal from './DocumentSelectionModal';

export default function SharedDocumentsList() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [documentFilter, setDocumentFilter] = useState('');
  const [taxPreparerFilter, setTaxPreparerFilter] = useState('');
  const [showUnshareModal, setShowUnshareModal] = useState(false);
  const [shareToUnshare, setShareToUnshare] = useState(null);
  const [unsharing, setUnsharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDocumentSelectionModal, setShowDocumentSelectionModal] = useState(false);
  const [selectedDocumentsForShare, setSelectedDocumentsForShare] = useState([]);

  useEffect(() => {
    fetchShares();
  }, [documentFilter, taxPreparerFilter]);

  const fetchShares = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (documentFilter) params.document_id = parseInt(documentFilter);
      if (taxPreparerFilter) params.tax_preparer_id = parseInt(taxPreparerFilter);
      
      const response = await firmAdminDocumentsAPI.listSharedDocuments(params);
      
      if (response.success && response.data) {
        setShares(response.data.shares || []);
      } else {
        throw new Error(response.message || 'Failed to fetch shared documents');
      }
    } catch (err) {
      console.error('Error fetching shared documents:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
      toast.error(errorMsg || 'Failed to load shared documents', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnshareClick = (share) => {
    setShareToUnshare(share);
    setShowUnshareModal(true);
  };

  const confirmUnshare = async () => {
    if (!shareToUnshare) return;

    try {
      setUnsharing(true);
      const response = await firmAdminDocumentsAPI.unshareDocuments(
        [shareToUnshare.document.id],
        [shareToUnshare.shared_with.id]
      );

      if (response.success) {
        toast.success(response.message || 'Document unshared successfully', {
          position: "top-right",
          autoClose: 3000,
        });
        fetchShares();
        setShowUnshareModal(false);
        setShareToUnshare(null);
      } else {
        throw new Error(response.message || 'Failed to unshare document');
      }
    } catch (err) {
      console.error('Error unsharing document:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to unshare document', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setUnsharing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const filteredShares = shares.filter(share => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const docName = (share.document?.name || '').toLowerCase();
    const preparerName = (share.shared_with?.name || '').toLowerCase();
    const preparerEmail = (share.shared_with?.email || '').toLowerCase();
    const notes = (share.notes || '').toLowerCase();
    
    return docName.includes(query) || 
           preparerName.includes(query) || 
           preparerEmail.includes(query) ||
           notes.includes(query);
  });

  return (
    <div style={{ fontFamily: 'BasisGrotesquePro' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 style={{ color: '#3B4A66', fontWeight: '600', marginBottom: '4px' }}>
            Shared Documents
          </h4>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
            Manage documents shared with tax preparers
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn d-flex align-items-center gap-2"
            onClick={() => setShowDocumentSelectionModal(true)}
            style={{
              backgroundColor: '#00C0C6',
              border: 'none',
              color: 'white',
              fontFamily: 'BasisGrotesquePro',
              fontWeight: '500'
            }}
          >
            <FiShare2 size={16} />
            Share Documents
          </button>
          <button
            className="btn d-flex align-items-center gap-2"
            onClick={fetchShares}
            style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              color: '#3B4A66',
              fontFamily: 'BasisGrotesquePro'
            }}
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-3 mb-4" style={{ border: '1px solid #E5E7EB' }}>
        <div className="row g-3">
          <div className="col-md-4">
            <div className="position-relative">
              <FiSearch
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6B7280'
                }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Search by document, preparer, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: '40px',
                  borderColor: '#E5E7EB'
                }}
              />
            </div>
          </div>
          <div className="col-md-4">
            <input
              type="number"
              className="form-control"
              placeholder="Filter by Document ID"
              value={documentFilter}
              onChange={(e) => setDocumentFilter(e.target.value)}
              style={{ borderColor: '#E5E7EB' }}
            />
          </div>
          <div className="col-md-4">
            <input
              type="number"
              className="form-control"
              placeholder="Filter by Tax Preparer ID"
              value={taxPreparerFilter}
              onChange={(e) => setTaxPreparerFilter(e.target.value)}
              style={{ borderColor: '#E5E7EB' }}
            />
          </div>
        </div>
      </div>

      {/* Shares List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: '#6B7280' }}>Loading shared documents...</p>
        </div>
      ) : error && shares.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-danger mb-3">{error}</p>
          <button
            onClick={fetchShares}
            className="btn"
            style={{
              backgroundColor: '#00C0C6',
              color: 'white',
              border: 'none',
              fontFamily: 'BasisGrotesquePro'
            }}
          >
            Retry
          </button>
        </div>
      ) : filteredShares.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-lg p-4" style={{ border: '1px solid #E5E7EB' }}>
          <FiFile size={48} style={{ color: '#D1D5DB', marginBottom: '16px' }} />
          <p style={{ color: '#6B7280', fontSize: '16px', marginBottom: '8px' }}>
            No shared documents found
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
            {searchQuery || documentFilter || taxPreparerFilter
              ? 'Try adjusting your filters'
              : 'Share documents with tax preparers to see them here'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4" style={{ border: '1px solid #E5E7EB' }}>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Document</th>
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Shared With</th>
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Shared By</th>
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Notes</th>
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Shared At</th>
                  <th style={{ fontFamily: 'BasisGrotesquePro', fontWeight: '600', color: '#3B4A66' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShares.map((share) => (
                  <tr key={share.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <FiFile size={18} style={{ color: '#00C0C6' }} />
                        <div>
                          <div style={{ color: '#3B4A66', fontWeight: '500', fontSize: '14px' }}>
                            {share.document?.name || 'Unknown Document'}
                          </div>
                          {share.document?.category && (
                            <div style={{ color: '#6B7280', fontSize: '12px' }}>
                              {share.document.category}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <FiUser size={16} style={{ color: '#6B7280' }} />
                        <div>
                          <div style={{ color: '#3B4A66', fontSize: '14px' }}>
                            {share.shared_with?.name || 'Unknown'}
                          </div>
                          <div style={{ color: '#6B7280', fontSize: '12px' }}>
                            {share.shared_with?.email || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: '#6B7280', fontSize: '14px' }}>
                        {share.shared_by?.name || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#6B7280', fontSize: '14px' }}>
                        {share.notes || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <FiCalendar size={14} style={{ color: '#6B7280' }} />
                        <span style={{ color: '#6B7280', fontSize: '14px' }}>
                          {formatDate(share.created_at)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleUnshareClick(share)}
                        style={{
                          backgroundColor: '#FEE2E2',
                          border: '1px solid #FCA5A5',
                          color: '#DC2626',
                          padding: '4px 8px'
                        }}
                        title="Unshare"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {filteredShares.length > 0 && (
        <div className="mt-4 text-center" style={{ color: '#6B7280', fontSize: '14px' }}>
          Showing {filteredShares.length} of {shares.length} shared document{shares.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Document Selection Modal */}
      <DocumentSelectionModal
        show={showDocumentSelectionModal}
        onClose={() => {
          setShowDocumentSelectionModal(false);
          setSelectedDocumentsForShare([]);
        }}
        onSelectDocuments={(docs) => {
          setSelectedDocumentsForShare(docs);
          setShowDocumentSelectionModal(false);
          setShowShareModal(true);
        }}
        multiple={true}
      />

      {/* Share Documents Modal */}
      <ShareDocumentsModal
        show={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          // Don't clear selectedDocumentsForShare here - let user retry if needed
        }}
        selectedDocuments={selectedDocumentsForShare}
        onSuccess={() => {
          fetchShares();
          setShowShareModal(false);
          setSelectedDocumentsForShare([]); // Clear only on success
        }}
      />

      {/* Unshare Confirmation Modal */}
      <ConfirmationModal
        show={showUnshareModal}
        onHide={() => {
          setShowUnshareModal(false);
          setShareToUnshare(null);
        }}
        onConfirm={confirmUnshare}
        title="Unshare Document"
        message={
          shareToUnshare
            ? `Are you sure you want to unshare "${shareToUnshare.document?.name || 'this document'}" with ${shareToUnshare.shared_with?.name || 'this tax preparer'}?`
            : ''
        }
        confirmText="Unshare"
        confirmButtonStyle={{ backgroundColor: '#DC2626', border: 'none' }}
        loading={unsharing}
      />
    </div>
  );
}

