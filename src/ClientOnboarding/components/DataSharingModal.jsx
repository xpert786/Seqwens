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
  const [selectedScope, setSelectedScope] = useState('All');
  const [selectedCategories, setSelectedCategories] = useState([]);

  const handleScopeChange = (scope) => {
    setSelectedScope(scope);
    if (scope !== 'Selected') {
      setSelectedCategories([]);
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedScope === 'Selected' && selectedCategories.length === 0) {
      // Could show error here, but for now we'll just prevent submission
      return;
    }
    
    onConfirm({
      scope: selectedScope,
      selectedCategories: selectedScope === 'Selected' ? selectedCategories : null
    });
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg" className="data-sharing-modal">
      <Modal.Header closeButton className="data-sharing-modal-header">
        <Modal.Title>Data Sharing Decision Required</Modal.Title>
      </Modal.Header>
      <Modal.Body className="data-sharing-modal-body">
        <div className="warning-section">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <h5 className="warning-title">Important Notice</h5>
            <p className="warning-message">
              {warningMessage || 
                `Accepting this invite from ${newFirm?.name || 'the new firm'} will disable active servicing access for your current tax office ${currentFirm?.name || ''}.`}
            </p>
          </div>
        </div>

        <div className="firm-info-section">
          <div className="firm-info-item">
            <span className="firm-label">Current Firm:</span>
            <span className="firm-name">{currentFirm?.name || 'N/A'}</span>
          </div>
          <div className="firm-info-item">
            <span className="firm-label">New Firm:</span>
            <span className="firm-name">{newFirm?.name || 'N/A'}</span>
          </div>
        </div>

        <div className="data-sharing-section">
          <h6 className="section-title">
            {dataSharingOptions?.description || 'Please select how you would like to share your existing data with the new firm:'}
          </h6>
          
          <div className="scope-options">
            {dataSharingOptions?.options?.map((option) => (
              <div 
                key={option.value}
                className={`scope-option ${selectedScope === option.value ? 'selected' : ''}`}
                onClick={() => handleScopeChange(option.value)}
              >
                <div className="scope-option-header">
                  <input
                    type="radio"
                    name="data-sharing-scope"
                    value={option.value}
                    checked={selectedScope === option.value}
                    onChange={() => handleScopeChange(option.value)}
                    className="scope-radio"
                  />
                  <label className="scope-label">{option.label}</label>
                </div>
                <p className="scope-description">{option.description}</p>
              </div>
            ))}
          </div>

          {/* Category Selection */}
          {selectedScope === 'Selected' && dataSharingOptions?.categories && (
            <div className="categories-section">
              <div className="categories-header">
                <h6 className="categories-title">Select Data Categories to Share</h6>
                <div className="categories-actions">
                  <button
                    type="button"
                    className="btn-link categories-action-btn"
                    onClick={() => {
                      const allCategoryIds = dataSharingOptions.categories.map(cat => cat.id);
                      setSelectedCategories(allCategoryIds);
                    }}
                  >
                    Select All
                  </button>
                  <span className="categories-separator">|</span>
                  <button
                    type="button"
                    className="btn-link categories-action-btn"
                    onClick={() => setSelectedCategories([])}
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="categories-list">
                {dataSharingOptions.categories.map((category) => (
                  <div
                    key={category.id}
                    className={`category-item ${selectedCategories.includes(category.id) ? 'selected' : ''}`}
                    onClick={() => handleCategoryToggle(category.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="category-checkbox"
                    />
                    <div className="category-content">
                      <label className="category-label">{category.name}</label>
                      {category.description && (
                        <p className="category-description">{category.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {selectedCategories.length === 0 && (
                <p className="categories-error">Please select at least one category to share.</p>
              )}
            </div>
          )}
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

