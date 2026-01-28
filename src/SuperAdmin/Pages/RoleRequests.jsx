import React, { useState, useEffect } from 'react';
import { FiSearch, FiChevronDown, FiCheck, FiX, FiClock, FiUser, FiBriefcase } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { superAdminAPI, handleAPIError } from '../utils/superAdminAPI';
import { superToastOptions } from '../utils/toastConfig';

const ROLE_DISPLAY_NAMES = {
  super_admin: 'Super Admin',
  firm: 'Firm Admin',
  staff: 'Staff (Tax Preparer)',
  client: 'Client (Taxpayer)',
  admin: 'Admin'
};

export default function RoleRequests() {
  // Debug: Log when component mounts
  useEffect(() => {
    console.log('RoleRequests component mounted');
  }, []);

  const [requests, setRequests] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingRequest, setProcessingRequest] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [reviewNotes, setReviewNotes] = useState('');

  // Fetch role requests
  const fetchRoleRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await superAdminAPI.getRoleRequests(statusFilter === 'all' ? null : statusFilter);

      if (response.success && response.data) {
        // Handle new response structure with requests and counts
        if (response.data.requests && Array.isArray(response.data.requests)) {
          setRequests(response.data.requests);
        } else if (Array.isArray(response.data)) {
          // Fallback for old structure (direct array)
          setRequests(response.data);
        } else {
          setRequests([]);
        }

        // Set counts if provided
        if (response.data.counts) {
          setStatusCounts({
            total: response.data.counts.total || 0,
            pending: response.data.counts.pending || 0,
            approved: response.data.counts.approved || 0,
            rejected: response.data.counts.rejected || 0,
            cancelled: response.data.counts.cancelled || 0
          });
        }
      } else {
        throw new Error(response.message || 'Failed to load role requests');
      }
    } catch (err) {
      console.error('Error fetching role requests:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
      toast.error(errorMsg, superToastOptions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleRequests();
  }, [statusFilter]);

  // Filter requests by search term
  const filteredRequests = requests.filter(request => {
    const searchLower = searchTerm.toLowerCase();
    const userName = request.user?.full_name || request.user?.email || '';
    const firmName = request.firm?.name || request.firm_name || '';
    const roleName = request.requested_role_display || request.requested_role || '';

    return (
      userName.toLowerCase().includes(searchLower) ||
      firmName.toLowerCase().includes(searchLower) ||
      roleName.toLowerCase().includes(searchLower) ||
      request.message?.toLowerCase().includes(searchLower)
    );
  });

  // Handle approve/reject action
  const handleAction = async (requestId, action, notes = '') => {
    try {
      setProcessingRequest(requestId);
      let response;

      if (action === 'approve') {
        response = await superAdminAPI.approveRoleRequest(requestId, notes || null);
      } else {
        response = await superAdminAPI.rejectRoleRequest(requestId, notes || null);
      }

      if (response.success) {
        toast.success(
          action === 'approve'
            ? 'Role request approved successfully'
            : 'Role request rejected',
          superToastOptions
        );
        fetchRoleRequests(); // Refresh the list
        setShowReviewModal(false);
        setSelectedRequest(null);
        setReviewNotes('');
      } else {
        throw new Error(response.message || `Failed to ${action} role request`);
      }
    } catch (err) {
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg, superToastOptions);
    } finally {
      setProcessingRequest(null);
    }
  };

  // Open review modal
  const openReviewModal = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setReviewNotes(request.review_notes || '');
    setShowReviewModal(true);
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'approved') {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (statusLower === 'rejected') {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (statusLower === 'pending') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate counts from requests if API doesn't provide them (fallback)
  const displayCounts = statusCounts.total > 0 ? statusCounts : {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length
  };

  return (
    <div className="p-6 bg-[#F6F7FF] min-h-screen">
      {/* Page Title and Description */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Role Requests</h3>
        <p className="text-sm text-gray-600">Review and manage all role requests from users</p>
      </div>

      {/* Summary Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-[#E8F0FF] rounded-lg p-4">
            <p className="text-sm text-gray-500">Total Requests</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{displayCounts.total}</p>
          </div>
          <div className="bg-white border border-[#E8F0FF] rounded-lg p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-semibold text-yellow-600 mt-1">{displayCounts.pending}</p>
          </div>
          <div className="bg-white border border-[#E8F0FF] rounded-lg p-4">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-semibold text-green-600 mt-1">{displayCounts.approved}</p>
          </div>
          <div className="bg-white border border-[#E8F0FF] rounded-lg p-4">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-semibold text-red-600 mt-1">{displayCounts.rejected}</p>
          </div>
          <div className="bg-white border border-[#E8F0FF] rounded-lg p-4">
            <p className="text-sm text-gray-500">Cancelled</p>
            <p className="text-2xl font-semibold text-gray-600 mt-1">{displayCounts.cancelled}</p>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
            <input
              type="text"
              placeholder="Search by user, firm, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[300px] pl-8 bg-white pr-3 py-1.5 text-sm border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-[#E8F0FF] rounded-lg px-3 py-1.5 pr-6 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading role requests...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <div className="text-red-600 text-center">
            <p className="font-semibold">Error loading role requests</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={fetchRoleRequests}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* No Requests Message */}
      {!loading && !error && filteredRequests.length === 0 && (
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-12 text-center">
          <FiUser className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Role Requests Found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all'
              ? 'No requests match your current filters.'
              : 'There are no role requests at this time.'}
          </p>
        </div>
      )}

      {/* Requests List */}
      {!loading && !error && filteredRequests.length > 0 && (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white border border-[#E8F0FF] rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header Row */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(request.status)}`}>
                      {request.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                    <span className="text-sm text-gray-500">
                      Request #{request.id}
                    </span>
                    <span className="text-sm text-gray-500">
                      <FiClock className="inline mr-1" size={12} />
                      {formatDate(request.created_at)}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FiUser className="text-gray-400" size={16} />
                      <span className="font-semibold text-gray-900">
                        {request.user?.full_name || 'Unknown User'}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({request.user?.email})
                      </span>
                    </div>
                    <div className="ml-6 text-sm text-gray-600">
                      <span className="font-medium">Current Roles: </span>
                      {request.user?.current_roles?.length > 0
                        ? request.user.current_roles.map(role => ROLE_DISPLAY_NAMES[role] || role).join(', ')
                        : 'None'}
                    </div>
                  </div>

                  {/* Requested Role */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">Requested Role:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold">
                        {request.requested_role_display || ROLE_DISPLAY_NAMES[request.requested_role] || request.requested_role}
                      </span>
                    </div>
                  </div>

                  {/* Firm Info */}
                  {(request.firm || request.firm_name) && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <FiBriefcase className="text-gray-400" size={16} />
                        <span className="text-sm font-medium text-gray-700">Firm: </span>
                        <span className="text-sm text-gray-900">
                          {request.firm?.name || request.firm_name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  {request.message && (
                    <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Message: </span>
                        {request.message}
                      </p>
                    </div>
                  )}

                  {/* Review Notes */}
                  {request.review_notes && (
                    <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Review Notes: </span>
                        {request.review_notes}
                      </p>
                      {request.reviewed_at && (
                        <p className="text-xs text-blue-600 mt-1">
                          Reviewed on {formatDate(request.reviewed_at)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {request.status === 'pending' && (
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => openReviewModal(request, 'approve')}
                      disabled={processingRequest === request.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      <FiCheck size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => openReviewModal(request, 'reject')}
                      disabled={processingRequest === request.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      <FiX size={16} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1070]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionType === 'approve' ? 'Approve' : 'Reject'} Role Request
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">User:</span> {selectedRequest.user?.full_name || selectedRequest.user?.email}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Requested Role:</span> {selectedRequest.requested_role_display || ROLE_DISPLAY_NAMES[selectedRequest.requested_role]}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes {actionType === 'approve' ? '(Optional)' : '(Recommended)'}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={`Enter notes for ${actionType === 'approve' ? 'approval' : 'rejection'}...`}
                rows={4}
                className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedRequest(null);
                  setReviewNotes('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(selectedRequest.id, actionType, reviewNotes)}
                disabled={processingRequest === selectedRequest.id}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {processingRequest === selectedRequest.id ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

