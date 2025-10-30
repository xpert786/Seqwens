import React, { useState, useEffect } from 'react';
import { FaTimes, FaComment, FaClipboard, FaDownload, FaUpload } from 'react-icons/fa';
import {  AssignTasked, CrossesIcon, ExportCSV, Importing, Msged } from '../../Components/icons';

const BulkAction = ({ isOpen, onClose, selectedCount }) => {
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
        className="bg-white rounded-lg shadow-lg p-3 max-w-2xl w-full mx-4"
        style={{ 
          borderRadius: '12px',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-3">
          <div className="flex justify-between items-center pb-2" style={{ borderBottom: '0.5px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
            <h2 className="taxdashboardr-titler text-base font-bold text-gray-900" style={{ color: '#3B4A66' }}>Bulk Actions</h2>
            <button
              onClick={onClose}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <CrossesIcon className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        </div>

        {/* Send Message Section */}
        <div className="mb-4">
          <h3 className="taxdashboardr-titler font-semibold text-gray-800 mb-2" style={{ color: '#374151' }}>
            Send Message to Yours clients:
          </h3>
          <div className="flex flex-col gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message..."
              className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              style={{ 
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                fontSize: '12px'
              }}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSendMessage}
                className="btn taxdashboard-btn btn-uploaded d-flex align-items-center gap-2" 
                style={{ 
                  backgroundColor: '#F97316',
                  minWidth: '100px',
                  height: 'fit-content',
                  fontSize: '15px'
                }}
              >
                <Msged className="w-3 h-3" />
                Send Message
              </button>
            </div>
          </div>
        </div>

        {/* Assign Task Section */}
        <div className="mb-4">
          <h3 className="taxdashboardr-titler font-semibold text-gray-800 mb-2" style={{ color: '#374151' }}>
            Assign Task
          </h3>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g. Request W 2 Document..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ 
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                fontSize: '12px'
              }}
            />
            <div className="flex justify-end">
              <button
                onClick={handleAssignTask}
                className="btn taxdashboard-btn btn-uploaded d-flex align-items-center gap-2"
                style={{ 
                  backgroundColor: '#F97316',
                  minWidth: '100px',
                  height: 'fit-content',
                  fontSize: '15px'
                }}
              >
                <AssignTasked className="w-3 h-3" />
                Assign Task
              </button>
            </div>
          </div>
        </div>

        {/* Run Compliance Check Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className="taxdashboardr-titler font-semibold text-gray-800" style={{ color: '#374151' }}>
              Run Compliance Check
            </h3>
            <button
              onClick={handleComplianceCheck}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                complianceCheck ? 'bg-orange-500' : 'bg-gray-300'
              }`}
              style={{ 
                backgroundColor: complianceCheck ? '#F97316' : '#D1D5DB'
              }}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  complianceCheck ? 'translate-x-5' : 'translate-x-1'
                }`}
                style={{
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              />
            </button>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex gap-3 justify-end">
           <button
             onClick={handleImportCSV}
             className="px-4 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-2 font-medium border"
             style={{ 
               backgroundColor: '#FFF',
               color: 'var(--Color-blue-900, #131323)',
               border: '1px solid #DBEAFE',
               borderRadius: '8px',
               fontSize: '14px',
               minWidth: '140px',
               height: '40px'
             }}
           >
            <Importing className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-3 bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center gap-2 font-medium"
            style={{ 
              backgroundColor: '#F97316',
              borderRadius: '8px',
              fontSize: '14px',
              minWidth: '140px',
              height: '40px'
            }}
          >
            <ExportCSV className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkAction;
