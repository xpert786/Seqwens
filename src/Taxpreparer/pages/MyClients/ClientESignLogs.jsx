import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { taxPreparerClientAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { FaFilePdf, FaDownload, FaEye, FaComment, FaCheckCircle, FaClock, FaExclamationTriangle, FaSignature, FaCalendarAlt, FaUser, FaInfoCircle } from 'react-icons/fa';

export default function ClientESignLogs() {
  const { clientId } = useParams();
  const [esignActivities, setEsignActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedItems, setExpandedItems] = useState(new Set());

  useEffect(() => {
    if (clientId) {
      fetchESignLogs();
    }
  }, [clientId, statusFilter]);

  const fetchESignLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        limit: 50
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await taxPreparerClientAPI.getESignLogs(clientId, params);
      
      if (response.success && response.data) {
        setEsignActivities(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch eSign logs');
      }
    } catch (err) {
      console.error('Error fetching eSign logs:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
      toast.error(errorMsg || 'Failed to load eSign activity logs');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'signed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'viewed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending':
      case 'sent':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getFieldTypeIcon = (fieldType) => {
    switch (fieldType?.toLowerCase()) {
      case 'signature':
        return <FaSignature className="text-blue-600" />;
      case 'date':
        return <FaCalendarAlt className="text-green-600" />;
      case 'initials':
        return <FaUser className="text-purple-600" />;
      default:
        return <FaInfoCircle className="text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const openDocumentPreview = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const downloadDocument = (url, filename) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="p-4 font-['BasisGrotesquePro']">
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C0C6]"></div>
            <span className="ml-3 text-gray-600">Loading eSign activity logs...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 font-['BasisGrotesquePro']">
        <div className="bg-white rounded-xl p-6">
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={fetchESignLogs}
              className="px-4 py-2 bg-[#00C0C6] text-white rounded-lg hover:bg-[#00a8b0] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 font-['BasisGrotesquePro']">
      <div className="bg-white rounded-xl p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: '#3B4A66' }}>
                E-Signature Activity Logs
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Comprehensive view of e-signature requests with document previews, signature fields, and comments
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00C0C6] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="signed">Signed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {esignActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <p className="text-gray-500 text-lg">No eSign activity logs found</p>
            <p className="text-gray-400 text-sm mt-2">
              Activity logs will appear here when e-signature requests are made
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {esignActivities.map((activity, index) => {
              const isExpanded = expandedItems.has(index);
              const signatureRequest = activity.signature_request || {};
              const document = activity.document || {};
              const signatureFields = activity.signature_fields || [];
              const comments = activity.comments || [];
              const activityLogs = activity.activity_logs || [];
              const metadata = activity.metadata || {};
              const signatureFieldsSummary = activity.signature_fields_summary || {};
              const commentsSummary = activity.comments_summary || {};

              return (
                <div
                  key={signatureRequest.id || index}
                  className="border border-[#E8F0FF] rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Header Section */}
                  <div className="p-4 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-[#3B4A66] text-lg">
                            {signatureRequest.title || 'E-Signature Request'}
                          </h4>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(signatureRequest.status)}`}
                          >
                            {signatureRequest.status_display || signatureRequest.status || 'Unknown'}
                          </span>
                          {metadata.is_expired && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                              Expired
                            </span>
                          )}
                          {metadata.days_until_expiry !== null && metadata.days_until_expiry !== undefined && metadata.days_until_expiry <= 3 && !metadata.is_expired && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                              Expires in {metadata.days_until_expiry} day{metadata.days_until_expiry !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {signatureRequest.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {signatureRequest.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FaFilePdf className="w-3 h-3" />
                            {document.name || signatureRequest.document_name || 'Document'}
                          </span>
                          {signatureRequest.requested_by_name && (
                            <span className="flex items-center gap-1">
                              <FaUser className="w-3 h-3" />
                              Requested by: {signatureRequest.requested_by_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <FaClock className="w-3 h-3" />
                            Created: {formatDate(signatureRequest.created_at)}
                          </span>
                          {signatureRequest.expires_at && (
                            <span className="flex items-center gap-1">
                              <FaExclamationTriangle className="w-3 h-3" />
                              Expires: {formatDate(signatureRequest.expires_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {document.preview_url && (
                          <button
                            onClick={() => openDocumentPreview(document.preview_url)}
                            className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm"
                            title="Preview Document"
                          >
                            <FaEye className="w-4 h-4" />
                            Preview
                          </button>
                        )}
                        {document.download_url && (
                          <button
                            onClick={() => downloadDocument(document.download_url, document.name)}
                            className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 text-sm"
                            title="Download Document"
                          >
                            <FaDownload className="w-4 h-4" />
                            Download
                          </button>
                        )}
                        <button
                          onClick={() => toggleExpanded(index)}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          {isExpanded ? 'Hide Details' : 'Show Details'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details Section */}
                  {isExpanded && (
                    <div className="p-4 border-t border-[#E8F0FF] space-y-4">
                      {/* Document Metadata */}
                      {document && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h5 className="font-semibold text-[#3B4A66] mb-3 flex items-center gap-2">
                            <FaFilePdf className="w-4 h-4" />
                            Document Information
                          </h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            {document.file_size_formatted && (
                              <div>
                                <span className="text-gray-500">Size:</span>
                                <span className="ml-2 font-medium">{document.file_size_formatted}</span>
                              </div>
                            )}
                            {document.file_type && (
                              <div>
                                <span className="text-gray-500">Type:</span>
                                <span className="ml-2 font-medium">{document.file_type}</span>
                              </div>
                            )}
                            {document.category && (
                              <div>
                                <span className="text-gray-500">Category:</span>
                                <span className="ml-2 font-medium">{document.category}</span>
                              </div>
                            )}
                            {document.folder && (
                              <div>
                                <span className="text-gray-500">Folder:</span>
                                <span className="ml-2 font-medium">{document.folder}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Signature Fields Summary */}
                      {signatureFieldsSummary.total > 0 && (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h5 className="font-semibold text-[#3B4A66] mb-3 flex items-center gap-2">
                            <FaSignature className="w-4 h-4" />
                            Signature Fields Progress
                          </h5>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="text-sm">
                              <span className="text-gray-600">Total Fields:</span>
                              <span className="ml-2 font-semibold">{signatureFieldsSummary.total}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-green-600">Completed:</span>
                              <span className="ml-2 font-semibold">{signatureFieldsSummary.completed || 0}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-yellow-600">Pending:</span>
                              <span className="ml-2 font-semibold">{signatureFieldsSummary.pending || 0}</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${signatureFieldsSummary.total > 0 ? ((signatureFieldsSummary.completed || 0) / signatureFieldsSummary.total) * 100 : 0}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Signature Fields Details */}
                      {signatureFields.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-[#3B4A66] mb-3 flex items-center gap-2">
                            <FaSignature className="w-4 h-4" />
                            Signature Fields Details
                          </h5>
                          <div className="space-y-2">
                            {signatureFields.map((field) => (
                              <div
                                key={field.id}
                                className={`border rounded-lg p-3 ${field.is_signed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="mt-1">
                                      {getFieldTypeIcon(field.field_type)}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-[#3B4A66]">
                                          {field.field_type_display || field.field_type}
                                        </span>
                                        {field.is_required && (
                                          <span className="text-xs text-red-600">Required</span>
                                        )}
                                        {field.is_signed && (
                                          <span className="text-xs text-green-600 flex items-center gap-1">
                                            <FaCheckCircle className="w-3 h-3" />
                                            Signed
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-600 space-y-1">
                                        <div>
                                          Page {field.page_number} • Position: ({field.position_x?.toFixed(1)}%, {field.position_y?.toFixed(1)}%)
                                        </div>
                                        {field.assigned_to && (
                                          <div>
                                            Assigned to: {field.assigned_to.name} ({field.assigned_to.email})
                                          </div>
                                        )}
                                        {field.is_signed && field.signed_at && (
                                          <div className="text-green-600">
                                            Signed on: {formatDate(field.signed_at)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comments Section */}
                      {comments.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-[#3B4A66] mb-3 flex items-center gap-2">
                            <FaComment className="w-4 h-4" />
                            Comments & Concerns
                            {commentsSummary.total && (
                              <span className="text-sm font-normal text-gray-500">
                                ({commentsSummary.total} total)
                              </span>
                            )}
                          </h5>
                          <div className="space-y-3">
                            {comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <FaComment className="w-3 h-3 text-yellow-600" />
                                    <span className="text-xs font-medium text-yellow-800">
                                      {comment.comment_type === 'comment' ? 'Comment' : comment.comment_type === 'note' ? 'Note' : 'Annotation'}
                                    </span>
                                    {comment.created_by && (
                                      <span className="text-xs text-gray-600">
                                        by {comment.created_by.name}
                                        {comment.created_by.role && ` (${comment.created_by.role})`}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(comment.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                                {comment.page_number && (
                                  <div className="text-xs text-gray-500">
                                    Page {comment.page_number}
                                    {comment.position_x !== null && comment.position_y !== null && (
                                      <span> • Position: ({comment.position_x?.toFixed(1)}%, {comment.position_y?.toFixed(1)}%)</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Activity Logs */}
                      {activityLogs.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-[#3B4A66] mb-3">Activity History</h5>
                          <div className="space-y-2">
                            {activityLogs.map((log) => (
                              <div
                                key={log.id}
                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <div className="mt-1">
                                  {log.activity_type === 'esign_request' && '📥'}
                                  {log.activity_type === 'esign_viewed' && '👁️'}
                                  {log.activity_type === 'esign_signed' && '✍️'}
                                  {log.activity_type === 'esign_completed' && '✅'}
                                  {log.activity_type === 'esign_declined' && '❌'}
                                  {!['esign_request', 'esign_viewed', 'esign_signed', 'esign_completed', 'esign_declined'].includes(log.activity_type) && '📄'}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-[#3B4A66] mb-1">
                                    {log.title}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-1">{log.description}</p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>{formatDate(log.timestamp)}</span>
                                    {log.status && (
                                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(log.status)}`}>
                                        {log.status}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Metadata */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-semibold text-[#3B4A66] mb-2">Additional Information</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          {signatureRequest.total_fields !== undefined && (
                            <div>
                              <span className="text-gray-500">Total Fields:</span>
                              <span className="ml-2 font-medium">{signatureRequest.total_fields}</span>
                            </div>
                          )}
                          {signatureRequest.completed_fields !== undefined && (
                            <div>
                              <span className="text-gray-500">Completed:</span>
                              <span className="ml-2 font-medium">{signatureRequest.completed_fields}</span>
                            </div>
                          )}
                          {signatureRequest.spouse_sign !== undefined && (
                            <div>
                              <span className="text-gray-500">Spouse Sign:</span>
                              <span className="ml-2 font-medium">{signatureRequest.spouse_sign ? 'Yes' : 'No'}</span>
                            </div>
                          )}
                          {signatureRequest.completed_at && (
                            <div>
                              <span className="text-gray-500">Completed:</span>
                              <span className="ml-2 font-medium">{formatDate(signatureRequest.completed_at)}</span>
                            </div>
                          )}
                          {metadata.can_be_signed !== undefined && (
                            <div>
                              <span className="text-gray-500">Can Be Signed:</span>
                              <span className={`ml-2 font-medium ${metadata.can_be_signed ? 'text-green-600' : 'text-red-600'}`}>
                                {metadata.can_be_signed ? 'Yes' : 'No'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {esignActivities.length > 0 && (
          <div className="mt-6 text-sm text-gray-500 text-center">
            Showing {esignActivities.length} e-signature request{esignActivities.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
