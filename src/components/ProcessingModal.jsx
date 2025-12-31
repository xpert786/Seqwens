import React from 'react';
import { Modal } from 'react-bootstrap';
import './styles/ProcessingModal.css';

/**
 * ProcessingModal component for showing async e-sign document processing status
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {string} processingStatus - Current processing status (pending, processing_ocr, processing_signwell, completed, failed)
 * @param {string} processingError - Error message if processing failed
 * @param {function} onClose - Callback when modal is closed (only allowed if processing is complete or failed)
 */
export default function ProcessingModal({ 
  show, 
  processingStatus, 
  processingError, 
  onClose 
}) {
  const getProcessingMessage = () => {
    if (!processingStatus) return 'Processing...';
    
    switch (processingStatus) {
      case 'pending':
        return 'Queuing document for processing...';
      case 'processing_ocr':
        return 'Extracting signature fields from document...';
      case 'processing_signwell':
        return 'Setting up document for signing...';
      case 'completed':
        return 'Processing complete!';
      case 'failed':
        return `Processing failed: ${processingError || 'Unknown error'}`;
      default:
        return 'Processing...';
    }
  };

  const isProcessing = processingStatus && 
    processingStatus !== 'completed' && 
    processingStatus !== 'failed';

  const canClose = !isProcessing;

  return (
    <Modal 
      show={show} 
      onHide={canClose ? onClose : undefined}
      backdrop={canClose ? true : 'static'}
      keyboard={canClose}
      centered
      className="processing-modal"
    >
      <Modal.Body className="processing-modal-body">
        <div className="processing-content">
          {isProcessing && (
            <div className="loader"></div>
          )}
          
          {processingStatus === 'completed' && (
            <div className="success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
          
          {processingStatus === 'failed' && (
            <div className="error-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round"/>
              </svg>
            </div>
          )}

          <h3 className="processing-title">Processing Document</h3>
          
          <p className="processing-message">{getProcessingMessage()}</p>
          
          {isProcessing && (
            <p className="text-muted">This may take a few moments...</p>
          )}

          {canClose && (
            <button 
              className="btn btn-primary mt-3"
              onClick={onClose}
              style={{
                backgroundColor: '#00C0C6',
                border: 'none',
                fontFamily: 'BasisGrotesquePro'
              }}
            >
              {processingStatus === 'completed' ? 'Continue' : 'Close'}
            </button>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
}

