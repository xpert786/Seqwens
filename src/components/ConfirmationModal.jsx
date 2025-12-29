import React from 'react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonStyle = { backgroundColor: '#F56D2D', color: '#FFFFFF' },
  cancelButtonStyle = { border: '1px solid #E8F0FF', color: '#3B4A66' },
  isLoading = false,
  isDestructive = false
}) => {
  if (!isOpen) return null;

  const defaultConfirmStyle = isDestructive
    ? { backgroundColor: '#EF4444', color: '#FFFFFF' }
    : confirmButtonStyle;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        style={{
          borderRadius: '12px',
          border: '1px solid #E8F0FF'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#E8F0FF]">
          <h2 className="text-xl font-bold font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            disabled={isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {typeof message === 'string' ? (
          <p className="text-sm text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#4B5563', fontSize: '14px' }}>
            {message}
          </p>
          ) : (
            <div className="text-sm text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#4B5563', fontSize: '14px' }}>
              {message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-[#E8F0FF]">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg font-medium font-[BasisGrotesquePro] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={cancelButtonStyle}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg font-medium font-[BasisGrotesquePro] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={defaultConfirmStyle}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

