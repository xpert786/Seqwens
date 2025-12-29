import React, { useState } from 'react';
import { workflowAPI, handleAPIError } from '../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { FaCheck, FaTimes, FaDownload, FaEye } from 'react-icons/fa';
import { formatDateForDisplay } from '../../ClientOnboarding/utils/dateUtils';

/**
 * DocumentVerificationComponent
 * Allow tax preparers to verify submitted documents
 */
const DocumentVerificationComponent = ({
  request,
  documents = [],
  onVerify,
  onCancel,
}) => {
  const [verifiedDocuments, setVerifiedDocuments] = useState(new Set());
  const [notes, setNotes] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);

  const handleDocumentToggle = (docId) => {
    setVerifiedDocuments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleVerify = async (verified) => {
    if (!request || !request.id) {
      toast.error('Invalid document request');
      return;
    }

    try {
      setVerifying(true);
      const response = await workflowAPI.verifyDocuments(request.id, verified, notes);
      
      if (response.success) {
        toast.success(verified ? 'Documents verified successfully' : 'Documents rejected');
        if (onVerify) {
          onVerify(response.data);
        }
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(handleAPIError(error) || 'Failed to verify documents');
    } finally {
      setVerifying(false);
    }
  };

  const handleViewDocument = (doc) => {
    if (doc.tax_documents) {
      setViewingDocument(doc.tax_documents);
      window.open(doc.tax_documents, '_blank');
    }
  };

  const handleDownloadDocument = (doc) => {
    if (doc.tax_documents) {
      const link = document.createElement('a');
      link.href = doc.tax_documents;
      link.download = doc.tax_documents.split('/').pop() || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="document-verification-component">
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-2 font-[BasisGrotesquePro]">
          Verify Documents
        </h4>
        {request && (
          <div className="text-sm text-gray-600 space-y-1 font-[BasisGrotesquePro]">
            <p>
              <span className="font-medium">Request:</span> {request.title}
            </p>
            {request.taxpayer_name && (
              <p>
                <span className="font-medium">Client:</span> {request.taxpayer_name}
              </p>
            )}
            {request.submitted_at && (
              <p>
                <span className="font-medium">Submitted:</span>{' '}
                {formatDateForDisplay(request.submitted_at)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500 font-[BasisGrotesquePro]">
          No documents submitted yet
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-4 flex-1">
                <input
                  type="checkbox"
                  checked={verifiedDocuments.has(doc.id)}
                  onChange={() => handleDocumentToggle(doc.id)}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                    {doc.tax_documents?.split('/').pop() || 'Document'}
                  </p>
                  {doc.category && (
                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                      Category: {typeof doc.category === 'object' ? doc.category.name : doc.category}
                    </p>
                  )}
                  {doc.created_at && (
                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                      Uploaded: {formatDateForDisplay(doc.created_at)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewDocument(doc)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                  title="View Document"
                >
                  <FaEye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownloadDocument(doc)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition"
                  title="Download Document"
                >
                  <FaDownload className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
          Verification Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
          placeholder="Add any notes or feedback about the documents..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
            disabled={verifying}
          >
            Cancel
          </button>
        )}
        <button
          onClick={() => handleVerify(false)}
          disabled={verifying}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro] flex items-center gap-2"
        >
          <FaTimes className="w-4 h-4" />
          Reject & Request Revision
        </button>
        <button
          onClick={() => handleVerify(true)}
          disabled={verifying || documents.length === 0}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro] flex items-center gap-2"
        >
          <FaCheck className="w-4 h-4" />
          {verifying ? 'Verifying...' : 'Verify & Continue'}
        </button>
      </div>
    </div>
  );
};

export default DocumentVerificationComponent;

