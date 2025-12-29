import React from 'react';
import { formatDateForDisplay } from '../../ClientOnboarding/utils/dateUtils';

/**
 * DocumentRequestCard Component
 * Display a single document request with details
 */
const DocumentRequestCard = ({
  request,
  userRole = 'taxpayer',
  onUpload,
  onVerify,
  onViewDetails,
}) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'needs_revision':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'submitted':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'verified':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'needs_revision':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = request.due_date ? getDaysRemaining(request.due_date) : null;
  const isOverdue = daysRemaining !== null && daysRemaining < 0;

  return (
    <div className="bg-white border border-[#E8F0FF] rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">
              {request.title || 'Document Request'}
            </h5>
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                request.status
              )} font-[BasisGrotesquePro]`}
            >
              {getStatusIcon(request.status)}
              {request.status?.replace('_', ' ') || 'Pending'}
            </span>
          </div>

          {request.description && (
            <p className="text-sm text-gray-600 mb-3 font-[BasisGrotesquePro]">
              {request.description}
            </p>
          )}

          {/* Document Categories */}
          {request.requested_categories && request.requested_categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {request.requested_categories.map((category, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-[BasisGrotesquePro]"
                >
                  {typeof category === 'object' ? category.name : category}
                </span>
              ))}
            </div>
          )}

          {/* Due Date */}
          {request.due_date && (
            <div className="flex items-center gap-2 text-sm mb-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className={`font-[BasisGrotesquePro] ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                Due: {formatDateForDisplay(request.due_date)}
                {daysRemaining !== null && (
                  <span className={`ml-2 ${isOverdue ? 'text-red-600' : daysRemaining <= 7 ? 'text-orange-600' : 'text-gray-500'}`}>
                    ({isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`})
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Assigned Preparer (for taxpayers) */}
          {userRole === 'taxpayer' && request.tax_preparer_name && (
            <div className="text-sm text-gray-600 mb-2 font-[BasisGrotesquePro]">
              Assigned Preparer: <span className="font-medium">{request.tax_preparer_name}</span>
            </div>
          )}

          {/* Client Name (for preparers) */}
          {userRole === 'preparer' && request.taxpayer_name && (
            <div className="text-sm text-gray-600 mb-2 font-[BasisGrotesquePro]">
              Client: <span className="font-medium">{request.taxpayer_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(request)}
            className="px-4 py-2 text-sm bg-white border border-[#E8F0FF] text-gray-700 rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
          >
            View Details
          </button>
        )}

        {userRole === 'taxpayer' && request.status === 'pending' && onUpload && (
          <button
            onClick={() => onUpload(request)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-[BasisGrotesquePro]"
          >
            Upload Documents
          </button>
        )}

        {userRole === 'preparer' && request.status === 'submitted' && onVerify && (
          <button
            onClick={() => onVerify(request)}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-[BasisGrotesquePro]"
          >
            Verify Documents
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentRequestCard;

