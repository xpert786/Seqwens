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
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6 relative" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h5 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">Sign Data Entry Form</h5>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
              Please sign your data entry form to complete the process
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center !rounded-full bg-blue-50 hover:bg-blue-100 text-gray-600 transition-colors"
            disabled={loading}
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
                ? 'bg-[#3AD6F2] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={loading}
          >
            Draw Signature
          </button>
          <button
            type="button"
            onClick={() => setSignatureType('type')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors font-[BasisGrotesquePro] ${
              signatureType === 'type'
                ? 'bg-[#3AD6F2] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={loading}
          >
            Type Name
          </button>
        </div>

        {/* Signature Canvas */}
        {signatureType === 'draw' ? (
          <div className="mb-4">
            <div className="border-2 border-[#E8F0FF] rounded-lg p-4 bg-white">
              <SignatureCanvas
                ref={signaturePadRef}
                canvasProps={{
                  width: 600,
                  height: 200,
                  className: 'signature-canvas w-full border border-gray-200 rounded'
                }}
                backgroundColor="#ffffff"
                penColor="#3B4A66"
              />
            </div>
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handleClear}
                className="text-sm text-[#3AD6F2] hover:text-[#2BA5C0] font-medium font-[BasisGrotesquePro]"
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
              Enter your full name
            </label>
            <input
              type="text"
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-lg border border-[#E8F0FF] px-4 py-2.5 text-gray-900 placeholder-gray-400 font-[BasisGrotesquePro] text-sm focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
              disabled={loading}
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-lg border border-[#E4ECFF] bg-white px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-[#F8FAFC] font-[BasisGrotesquePro]"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center rounded-lg bg-[#F56D2D] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
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

