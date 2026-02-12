import React, { useState, useEffect } from 'react';
import { AssignTasked, CrossesIcon, ExportCSV, Importing, Msged } from '../../Components/icons';
import { useFirmSettings } from '../../Context/FirmSettingsContext';

const BulkAction = ({ isOpen, onClose, selectedCount }) => {
  const { advancedReportingEnabled } = useFirmSettings();
  const [message, setMessage] = useState('');
  const [task, setTask] = useState('');
  const [complianceCheck, setComplianceCheck] = useState(false);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && event.target.classList.contains('modal-overlay')) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      // Add your message sending logic here
      setMessage('');
    }
  };

  const handleAssignTask = () => {
    if (task.trim()) {
      console.log('Assigning task:', task);
      // Add your task assignment logic here
      setTask('');
    }
  };

  const handleComplianceCheck = () => {
    setComplianceCheck(!complianceCheck);
    console.log('Compliance check:', !complianceCheck);
    // Add your compliance check logic here
  };

  const handleImportCSV = () => {
    console.log('Import CSV clicked');
    // Add your CSV import logic here
  };

  const handleExportCSV = () => {
    console.log('Export CSV clicked');
    // Add your CSV export logic here
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4"
        style={{
          borderRadius: '12px',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 16px 12px 16px' }}>
          <div className="flex justify-between items-center" style={{ borderBottom: '0.5px solid #E8F0FF', paddingBottom: '8px' }}>
            <h3 className="text-xl font-bold" style={{ color: '#3B4A66', fontSize: '18px' }}>Bulk Actions</h3>
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              style={{ width: '20px', height: '20px' }}
            >
              <CrossesIcon className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Send Message Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 className="font-semibold" style={{ color: '#3B4A66', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
              Send Message to your clients:
            </h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message..."
              className="w-full resize-none focus:outline-none"
              rows={3}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '14px',
                lineHeight: '1.5',
                marginBottom: '8px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSendMessage}
                className="d-flex align-items-center gap-2"
                style={{
                  backgroundColor: '#F97316',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Msged className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>

          {/* Assign Task Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 className="font-semibold" style={{ color: '#3B4A66', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
              Assign Task
            </h3>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g. Request W 2 Document..."
              className="w-full focus:outline-none"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '14px',
                marginBottom: '8px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleAssignTask}
                className="d-flex align-items-center gap-2"
                style={{
                  backgroundColor: '#F97316',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <AssignTasked className="w-4 h-4" />
                Assign Task
              </button>
            </div>
          </div>

          {/* Run Compliance Check Section */}
          <div style={{ marginBottom: '24px' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: '#3B4A66', fontSize: '14px', fontWeight: '600' }}>
                Run Compliance Check
              </h3>
              <button
                onClick={handleComplianceCheck}
                className={`relative inline-flex items-center rounded-full transition-colors`}
                style={{
                  width: '36px',
                  height: '20px',
                  backgroundColor: complianceCheck ? '#F97316' : '#D1D5DB'
                }}
              >
                <span
                  className={`inline-block rounded-full bg-white transition-transform`}
                  style={{
                    width: '12px',
                    height: '12px',
                    transform: complianceCheck ? 'translateX(18px)' : 'translateX(4px)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </button>
            </div>
          </div>

          {/* Bottom Buttons */}
          {!advancedReportingEnabled && (
            <div className="flex justify-end" style={{ gap: '12px' }}>
              <button
                onClick={handleImportCSV}
                className="flex items-center gap-2 font-medium transition-colors"
                style={{
                  backgroundColor: '#FFF',
                  color: '#131323',
                  border: '1px solid #DBEAFE',
                  borderRadius: '8px',
                  fontSize: '14px',
                  padding: '10px 20px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Importing className="w-4 h-4" />
                Import CSV
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 font-medium transition-colors"
                style={{
                  backgroundColor: '#F97316',
                  borderRadius: '8px',
                  fontSize: '14px',
                  padding: '10px 20px',
                  fontWeight: '500',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <ExportCSV className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkAction;
