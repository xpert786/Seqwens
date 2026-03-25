import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import '../styles/DataSharingModal.css';

const DataSharingModal = ({ 
  show, 
  onClose, 
  onConfirm, 
  currentFirm, 
  newFirm,
  warningMessage,
  dataSharingOptions,
  loading = false 
}) => {
  const [selectedScope, setSelectedScope] = useState('all');

  const handleScopeChange = (scope) => {
    setSelectedScope(scope);
  };

  const handleConfirm = () => {
    onConfirm({
      scope: selectedScope,
      selectedCategories: null
    });
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg" className="data-sharing-modal">
      <Modal.Header closeButton className="data-sharing-modal-header">
        <Modal.Title style={{ color: '#3B4A66', fontWeight: '700' }}>Data Sharing Choice Required</Modal.Title>
      </Modal.Header>
      <Modal.Body className="data-sharing-modal-body">
        <div className="warning-section" style={{
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px dashed #FFC107',
          marginBottom: '25px'
        }}>
          <div className="warning-content">
            <h5 className="warning-title" style={{ color: '#856404', fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>⚠️ Important Notice</h5>
            <p className="warning-message" style={{ color: '#664d03', fontSize: '15px', margin: 0 }}>
              By accepting this invitation, your account will be connected to <strong>{newFirm?.name || 'the new firm'}</strong>. 
              Please choose how you would like to share your information before continuing.
            </p>
          </div>
        </div>

        <div className="data-sharing-section">
          <h6 className="section-title" style={{ color: '#3B4A66', fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
            How would you like to share your information with this tax office?
          </h6>
          
          <div className="scope-options" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Option 1: Share History */}
            <div 
              className={`scope-option ${selectedScope === 'all' ? 'selected' : ''}`}
              onClick={() => handleScopeChange('all')}
              style={{
                padding: '20px',
                border: selectedScope === 'all' ? '2px solid #00c0c6' : '1px solid #E2E8F0',
                borderRadius: '16px',
                cursor: 'pointer',
                backgroundColor: selectedScope === 'all' ? 'rgba(0, 192, 198, 0.05)' : '#fff',
                transition: 'all 0.3s ease'
              }}
            >
              <div className="scope-option-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <input
                  type="radio"
                  name="data-sharing-scope"
                  value="all"
                  checked={selectedScope === 'all'}
                  onChange={() => handleScopeChange('all')}
                  className="scope-radio"
                  style={{ width: '20px', height: '20px', accentColor: '#00c0c6' }}
                />
                <label className="scope-label" style={{ fontWeight: '700', fontSize: '17px', color: '#3B4A66', cursor: 'pointer' }}>
                  Share my existing documents with the new tax office
                </label>
              </div>
              <p className="scope-description" style={{ fontSize: '14px', color: '#64748B', margin: 0, paddingLeft: '32px' }}>
                Your current tax office will still have access to documents you’ve already shared with them. 
                The new tax office will be able to view your existing documents and any new documents you upload moving forward.
              </p>
            </div>

            {/* Option 2: Share Future Only */}
            <div 
              className={`scope-option ${selectedScope === 'none' ? 'selected' : ''}`}
              onClick={() => handleScopeChange('none')}
              style={{
                padding: '20px',
                border: selectedScope === 'none' ? '2px solid #00c0c6' : '1px solid #E2E8F0',
                borderRadius: '16px',
                cursor: 'pointer',
                backgroundColor: selectedScope === 'none' ? 'rgba(0, 192, 198, 0.05)' : '#fff',
                transition: 'all 0.3s ease'
              }}
            >
              <div className="scope-option-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <input
                  type="radio"
                  name="data-sharing-scope"
                  value="none"
                  checked={selectedScope === 'none'}
                  onChange={() => handleScopeChange('none')}
                  className="scope-radio"
                  style={{ width: '20px', height: '20px', accentColor: '#00c0c6' }}
                />
                <label className="scope-label" style={{ fontWeight: '700', fontSize: '17px', color: '#3B4A66', cursor: 'pointer' }}>
                  Share only future documents with the new tax office
                </label>
              </div>
              <p className="scope-description" style={{ fontSize: '14px', color: '#64748B', margin: 0, paddingLeft: '32px' }}>
                Your current tax office will keep access to previously shared documents. 
                The new tax office will only have access to documents you upload after connecting.
              </p>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="data-sharing-modal-footer">
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="button" 
          className="btn btn-primary" 
          onClick={handleConfirm}
          disabled={loading || (selectedScope === 'Selected' && selectedCategories.length === 0)}
        >
          {loading ? 'Processing...' : 'Continue'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default DataSharingModal;

