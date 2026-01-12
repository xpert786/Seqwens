import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'react-toastify';

export default function SignatureModal({ isOpen, onClose, onSubmit, loading = false }) {
  const signaturePadRef = useRef(null);
  const [signatureType, setSignatureType] = useState('draw'); // 'draw' or 'type'
  const [typedSignature, setTypedSignature] = useState('');

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const handleSubmit = () => {
    if (signatureType === 'draw') {
      if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
        const signatureData = signaturePadRef.current.toDataURL('image/png');
        onSubmit({ signature_image: signatureData });
      } else {
        toast.error('Please draw your signature before submitting', {
          position: 'top-right',
          autoClose: 3000
        });
      }
    } else {
      if (typedSignature.trim()) {
        onSubmit({ typed_text: typedSignature.trim() });
      } else {
        toast.error('Please enter your name before submitting', {
          position: 'top-right',
          autoClose: 3000
        });
      }
    }
  };

  const handleClose = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
    setTypedSignature('');
    setSignatureType('draw');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6 relative" style={{ maxHeight: '90vh', overflowY: 'auto', border: '1px solid #E8F0FF' }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h5 className="text-xl font-bold mb-1" style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>Sign Data Entry Form</h5>
            <p className="text-sm mb-0" style={{ color: '#4B5563', fontFamily: 'BasisGrotesquePro' }}>
              Please sign your data entry form to complete the process
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: '#F3F7FF', color: '#3B4A66' }}
            disabled={loading}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#E8F0FF'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#F3F7FF'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#3B4A66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Signature Type Toggle */}
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setSignatureType('draw')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors font-[BasisGrotesquePro] ${
              signatureType === 'draw'
                ? 'text-white'
                : 'text-gray-700'
            }`}
            style={{
              backgroundColor: signatureType === 'draw' ? '#F56D2D' : '#F3F7FF',
              border: signatureType === 'draw' ? '1px solid #F56D2D' : '1px solid #E8F0FF'
            }}
            disabled={loading}
            onMouseEnter={(e) => {
              if (signatureType !== 'draw') {
                e.target.style.backgroundColor = '#E8F0FF';
              }
            }}
            onMouseLeave={(e) => {
              if (signatureType !== 'draw') {
                e.target.style.backgroundColor = '#F3F7FF';
              }
            }}
          >
            Draw Signature
          </button>
          <button
            type="button"
            onClick={() => setSignatureType('type')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors font-[BasisGrotesquePro] ${
              signatureType === 'type'
                ? 'text-white'
                : 'text-gray-700'
            }`}
            style={{
              backgroundColor: signatureType === 'type' ? '#F56D2D' : '#F3F7FF',
              border: signatureType === 'type' ? '1px solid #F56D2D' : '1px solid #E8F0FF'
            }}
            disabled={loading}
            onMouseEnter={(e) => {
              if (signatureType !== 'type') {
                e.target.style.backgroundColor = '#E8F0FF';
              }
            }}
            onMouseLeave={(e) => {
              if (signatureType !== 'type') {
                e.target.style.backgroundColor = '#F3F7FF';
              }
            }}
          >
            Type Name
          </button>
        </div>

        {/* Signature Canvas */}
        {signatureType === 'draw' ? (
          <div className="mb-4">
            <div className="border-2 rounded-lg p-4 bg-white" style={{ borderColor: '#E8F0FF' }}>
              <SignatureCanvas
                ref={signaturePadRef}
                canvasProps={{
                  width: 600,
                  height: 200,
                  className: 'signature-canvas w-full border rounded',
                  style: { borderColor: '#E8F0FF' }
                }}
                backgroundColor="#ffffff"
                penColor="#3B4A66"
              />
            </div>
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handleClear}
                className="text-sm font-medium transition-colors font-[BasisGrotesquePro]"
                style={{ color: '#F56D2D' }}
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro' }}>
              Enter your full name
            </label>
            <input
              type="text"
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-lg px-4 py-2.5 text-sm font-[BasisGrotesquePro] focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: '#3B4A66',
                backgroundColor: '#ffffff',
                borderColor: '#E8F0FF',
                border: '1px solid #E8F0FF'
              }}
              disabled={loading}
              onFocus={(e) => {
                e.target.style.borderColor = '#F56D2D';
                e.target.style.boxShadow = '0 0 0 2px rgba(245, 109, 45, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E8F0FF';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors font-[BasisGrotesquePro]"
            style={{
              color: '#4B5563',
              backgroundColor: '#ffffff',
              borderColor: '#E8F0FF'
            }}
            disabled={loading}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#F3F7FF';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ffffff';
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-medium transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#F56D2D',
              color: '#ffffff',
              border: '1px solid #F56D2D'
            }}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#E67E47';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#F56D2D';
              }
            }}
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Signature'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

