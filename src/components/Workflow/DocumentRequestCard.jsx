import React from 'react';
import { formatDateForDisplay } from '../../ClientOnboarding/utils/dateUtils';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  User,
  ArrowRight,
  Upload,
  ShieldCheck
} from 'lucide-react';

/**
 * DocumentRequestCard Component
 * Display a single document request with a premium redesign
 */
const DocumentRequestCard = ({
  request,
  userRole = 'taxpayer',
  onUpload,
  onVerify,
  onViewDetails,
}) => {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return {
          color: '#92400E',
          bg: '#FEF3C7',
          icon: <Clock size={14} className="mr-1.5" />,
          label: 'Pending'
        };
      case 'submitted':
        return {
          color: '#1E40AF',
          bg: '#DBEAFE',
          icon: <FileText size={14} className="mr-1.5" />,
          label: 'Submitted'
        };
      case 'verified':
        return {
          color: '#065F46',
          bg: '#D1FAE5',
          icon: <ShieldCheck size={14} className="mr-1.5" />,
          label: 'Verified'
        };
      case 'needs_revision':
        return {
          color: '#991B1B',
          bg: '#FEE2E2',
          icon: <AlertCircle size={14} className="mr-1.5" />,
          label: 'Needs Revision'
        };
      default:
        return {
          color: '#374151',
          bg: '#F3F4F6',
          icon: <Clock size={14} className="mr-1.5" />,
          label: status || 'Unknown'
        };
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
  const status = getStatusConfig(request.status);

  return (
    <div className="bg-white border border-[#E8F0FF] rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {status.icon}
              {status.label}
            </span>
            {isOverdue && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white flex items-center">
                <AlertCircle size={12} className="mr-1.5" />
                Overdue
              </span>
            )}
          </div>
          <h5 className="text-base font-bold text-gray-900 mb-1 group-hover:text-[#3AD6F2] transition-colors leading-tight">
            {request.title || 'Document Request'}
          </h5>
          {request.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
              {request.description}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2.5 mb-5">
        {/* Due Date */}
        {request.due_date && (
          <div className="flex items-center gap-2 text-xs">
            <Calendar size={14} className="text-gray-400" />
            <span className={isOverdue ? 'text-red-600 font-bold' : 'text-gray-600 font-medium'}>
              Due {formatDateForDisplay(request.due_date)}
              {daysRemaining !== null && !isOverdue && (
                <span className="ml-1 text-gray-400 font-normal">
                  ({daysRemaining}d left)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Categories */}
        {request.requested_categories && request.requested_categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {request.requested_categories.slice(0, 2).map((category, index) => (
              <span key={index} className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded border border-gray-100 font-semibold">
                {typeof category === 'object' ? category.name : category}
              </span>
            ))}
            {request.requested_categories.length > 2 && (
              <span className="text-[10px] text-gray-400 font-medium">+{request.requested_categories.length - 2} more</span>
            )}
          </div>
        )}

        {/* Person Info */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <User size={14} className="text-gray-400" />
          <span className="truncate">
            {userRole === 'preparer' ? (request.taxpayer_name || 'Assigned Client') : (request.tax_preparer_name || 'Tax Preparer')}
          </span>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
        {userRole === 'preparer' && request.status === 'submitted' && onVerify ? (
          <button
            onClick={() => onVerify(request)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-sm shadow-green-100"
          >
            <ShieldCheck size={14} />
            Verify Now
          </button>
        ) : userRole === 'taxpayer' && request.status === 'pending' && onUpload ? (
          <button
            onClick={() => onUpload(request)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#3AD6F2] text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-all shadow-sm shadow-blue-100"
          >
            <Upload size={14} />
            Upload
          </button>
        ) : (
          <button
            onClick={() => onViewDetails && onViewDetails(request)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all border border-transparent"
          >
            Details
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentRequestCard;

