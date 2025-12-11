import React, { useState, useEffect } from 'react';
import { FiSearch, FiUnlock, FiClock, FiUser, FiMail, FiShield, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { superAdminAPI, handleAPIError } from '../utils/superAdminAPI';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function BlockedAccounts() {
  const [blockedAccounts, setBlockedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 1,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [accountToUnblock, setAccountToUnblock] = useState(null);
  const [unblocking, setUnblocking] = useState(false);

  useEffect(() => {
    fetchBlockedAccounts();
  }, [currentPage, searchTerm]);

  const fetchBlockedAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await superAdminAPI.getBlockedAccounts({
        search: searchTerm.trim(),
        page: currentPage,
        pageSize: pagination.page_size,
      });

      if (response.success && response.data) {
        setBlockedAccounts(response.data.blocked_accounts || []);
        setPagination(response.data.pagination || {
          page: currentPage,
          page_size: 20,
          total_count: 0,
          total_pages: 1,
        });
      } else {
        throw new Error(response.message || 'Failed to fetch blocked accounts');
      }
    } catch (err) {
      console.error('Error fetching blocked accounts:', err);
      setError(handleAPIError(err));
      setBlockedAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockClick = (account) => {
    setAccountToUnblock(account);
    setShowUnblockConfirm(true);
  };

  const confirmUnblock = async () => {
    if (!accountToUnblock) return;

    try {
      setUnblocking(true);
      const response = await superAdminAPI.unblockAccount(accountToUnblock.id);

      if (response.success) {
        toast.success(response.message || 'Account unblocked successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        await fetchBlockedAccounts();
        setShowUnblockConfirm(false);
        setAccountToUnblock(null);
      } else {
        toast.error(response.message || 'Failed to unblock account', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      toast.error(handleAPIError(err), {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setUnblocking(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBlockedAccounts();
  };

  const formatTimeRemaining = (hours, minutes) => {
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    }
    return 'Expired';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeColor = (role) => {
    const roleColors = {
      client: 'bg-blue-100 text-blue-800',
      staff: 'bg-purple-100 text-purple-800',
      admin: 'bg-green-100 text-green-800',
      super_admin: 'bg-red-100 text-red-800',
      support_admin: 'bg-yellow-100 text-yellow-800',
      billing_admin: 'bg-indigo-100 text-indigo-800',
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.total_pages) {
      setCurrentPage(page);
    }
  };

  const startItem = pagination.total_count
    ? (pagination.page - 1) * pagination.page_size + 1
    : 0;
  const endItem = pagination.total_count
    ? Math.min(pagination.page * pagination.page_size, pagination.total_count)
    : 0;

  return (
    <div className="p-6" style={{ fontFamily: 'BasisGrotesquePro' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FiShield className="text-[#3B4A66]" size={28} />
          <h2 className="text-2xl font-semibold text-[#1F2A55]" style={{ fontFamily: 'BasisGrotesquePro' }}>
            Blocked Accounts
          </h2>
        </div>
        <p className="text-sm text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>
          View and manage blocked user accounts
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or username..."
              className="w-full pl-10 pr-4 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-[#1F2A55]"
              style={{ fontFamily: 'BasisGrotesquePro' }}
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-[#3AD6F2] text-white rounded-lg hover:bg-[#2BC4E0] transition-colors font-medium"
            style={{ fontFamily: 'BasisGrotesquePro' }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="text-red-600" size={20} />
            <p className="text-red-700 text-sm" style={{ fontFamily: 'BasisGrotesquePro' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && blockedAccounts.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AD6F2]"></div>
            <p className="mt-3 text-[#6B7280] text-sm" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Loading blocked accounts...
            </p>
          </div>
        </div>
      ) : blockedAccounts.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-[#E8F0FF] rounded-lg p-12 text-center">
          <FiShield className="mx-auto text-[#9CA3AF]" size={48} />
          <h3 className="mt-4 text-lg font-semibold text-[#3B4A66]" style={{ fontFamily: 'BasisGrotesquePro' }}>
            No Blocked Accounts Found
          </h3>
          <p className="mt-2 text-sm text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>
            {searchTerm ? 'No accounts match your search criteria.' : 'There are currently no blocked accounts.'}
          </p>
        </div>
      ) : (
        <>
          {/* Accounts List */}
          <div className="bg-white border border-[#E8F0FF] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F6F7FF]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#3B4A66] uppercase tracking-wider" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#3B4A66] uppercase tracking-wider" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#3B4A66] uppercase tracking-wider" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Blocked Until
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#3B4A66] uppercase tracking-wider" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Time Remaining
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#3B4A66] uppercase tracking-wider" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Failed Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#3B4A66] uppercase tracking-wider" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8F0FF]">
                  {blockedAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#E8F0FF] flex items-center justify-center">
                            <FiUser className="text-[#3B4A66]" size={20} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-[#1F2A55]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              {account.full_name || `${account.first_name} ${account.last_name}`.trim() || 'N/A'}
                            </div>
                            <div className="text-sm text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                              {account.email}
                            </div>
                            {account.username && (
                              <div className="text-xs text-[#9CA3AF]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                @{account.username}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(account.role)}`} style={{ fontFamily: 'BasisGrotesquePro' }}>
                          {account.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#1F2A55]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          {formatDate(account.blocked_until)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FiClock className="text-[#F59E0B]" size={16} />
                          <span className="text-sm font-medium text-[#F59E0B]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            {formatTimeRemaining(account.time_remaining_hours || 0, account.time_remaining_minutes || 0)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#1F2A55]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                          {account.failed_login_attempts || 0}
                        </div>
                        {account.last_failed_login_at && (
                          <div className="text-xs text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            {formatDate(account.last_failed_login_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleUnblockClick(account)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#10B981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] transition-colors"
                          style={{ fontFamily: 'BasisGrotesquePro' }}
                        >
                          <FiUnlock size={16} />
                          Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                Showing {startItem} to {endItem} of {pagination.total_count} blocked accounts
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-[#E8F0FF] rounded-lg text-sm font-medium text-[#3B4A66] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ fontFamily: 'BasisGrotesquePro' }}
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.total_pages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.total_pages - 2) {
                      pageNum = pagination.total_pages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#3AD6F2] text-white'
                            : 'border border-[#E8F0FF] text-[#3B4A66] hover:bg-gray-50'
                        }`}
                        style={{ fontFamily: 'BasisGrotesquePro' }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === pagination.total_pages}
                  className="px-4 py-2 border border-[#E8F0FF] rounded-lg text-sm font-medium text-[#3B4A66] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ fontFamily: 'BasisGrotesquePro' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Unblock Confirmation Modal */}
      <ConfirmationModal
        isOpen={showUnblockConfirm}
        onClose={() => {
          if (!unblocking) {
            setShowUnblockConfirm(false);
            setAccountToUnblock(null);
          }
        }}
        onConfirm={confirmUnblock}
        title="Unblock Account"
        message={
          accountToUnblock
            ? `Are you sure you want to unblock the account for "${accountToUnblock.full_name || accountToUnblock.email}"? This will allow them to log in immediately.`
            : "Are you sure you want to unblock this account?"
        }
        confirmText="Unblock"
        cancelText="Cancel"
        isLoading={unblocking}
        isDestructive={false}
      />
    </div>
  );
}

