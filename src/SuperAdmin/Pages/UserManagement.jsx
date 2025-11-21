import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiChevronDown, FiUpload, FiDownload, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { superAdminAPI, handleAPIError } from '../utils/superAdminAPI';
import { superToastOptions } from '../utils/toastConfig';

export default function UserManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    total_internal_staff: 0,
    active: 0,
    suspended: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total_count: 0,
    total_pages: 1,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [createAdminError, setCreateAdminError] = useState(null);
  const [newAdmin, setNewAdmin] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'support_admin',
    sendWelcomeEmail: true,
  });

  const pageSize = 10;
  const getStatusBadgeClass = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('active')) return 'bg-green-500';
    if (normalized.includes('suspend')) return 'bg-red-500';
    return 'bg-gray-400';
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= (pagination.total_pages || 1)) {
      setCurrentPage(page);
    }
  };

  const startItem = pagination.total_count
    ? (pagination.page - 1) * pagination.page_size + 1
    : 0;
  const endItem = pagination.total_count
    ? Math.min(pagination.page * pagination.page_size, pagination.total_count)
    : 0;

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const statusParam = statusFilter !== 'All Status' ? statusFilter.toLowerCase() : '';
        const roleParam =
          roleFilter !== 'All Roles' ? roleFilter.toLowerCase().replace(/\s+/g, '_') : '';

        const response = await superAdminAPI.getPlatformUsers({
          status: statusParam,
          role: roleParam,
          search: searchTerm.trim(),
          page: currentPage,
          pageSize,
        });

        if (response.success && response.data) {
          setSummary(
            response.data.summary || {
              total_internal_staff: 0,
              active: 0,
              suspended: 0,
            }
          );
          setUsers(response.data.users || []);
          const incomingPagination =
            response.data.pagination || {
              page: currentPage,
              page_size: pageSize,
              total_count: response.data.users?.length || 0,
              total_pages: 1,
            };
          setPagination(incomingPagination);
          if (
            incomingPagination.page &&
            incomingPagination.page !== currentPage
          ) {
            setCurrentPage(incomingPagination.page);
          }
        } else {
          throw new Error(response.message || 'Failed to fetch platform users');
        }
      } catch (err) {
        console.error('Error fetching platform users:', err);
        setError(handleAPIError(err));
        setUsers([]);
        setSummary({
          total_internal_staff: 0,
          active: 0,
          suspended: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchTerm, statusFilter, roleFilter, currentPage, refreshKey]);

  const resetAddAdminForm = () => {
    setNewAdmin({
      fullName: '',
      email: '',
      phoneNumber: '',
      role: 'support_admin',
      sendWelcomeEmail: true,
    });
    setCreateAdminError(null);
  };

  const closeAddAdminModal = () => {
    setShowAddAdminModal(false);
    resetAddAdminForm();
  };

  const handleCreateSuperAdmin = async () => {
    if (
      !newAdmin.fullName.trim() ||
      !newAdmin.email.trim() ||
      !newAdmin.phoneNumber.trim() ||
      !newAdmin.role
    ) {
      setCreateAdminError('Please fill in all required fields.');
      return;
    }

    if (newAdmin.phoneNumber.replace(/\D/g, '').length !== 10) {
      setCreateAdminError('Phone number must be exactly 10 digits.');
      return;
    }

    const trimmedFullName = newAdmin.fullName.trim();
    const [firstNamePart, ...restParts] = trimmedFullName.split(/\s+/);
    const lastNamePart = restParts.join(' ');

    const payload = {
      first_name: firstNamePart || '',
      last_name: lastNamePart || '',
      email: newAdmin.email.trim(),
      phone_number: newAdmin.phoneNumber.trim(),
      role: newAdmin.role,
      send_welcome_email: newAdmin.sendWelcomeEmail,
    };

    try {
      setCreatingAdmin(true);
      setCreateAdminError(null);
      const response = await superAdminAPI.createSuperAdminUser(payload);

      if (response.success) {
        toast.success('Super admin user created successfully!', superToastOptions);
        closeAddAdminModal();
        setCurrentPage(1);
        setRefreshKey((key) => key + 1);
      } else {
        throw new Error(response.message || 'Failed to create super admin user');
      }
    } catch (err) {
      const message = handleAPIError(err);
      setCreateAdminError(message);
      toast.error(message, superToastOptions);
    } finally {
      setCreatingAdmin(false);
    }
  };

  return (
    <div className="p-6 bg-[#F6F7FF]">
      {/* Page Title and Description */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        <p className="text-sm text-gray-600">Manage internal platform administrators and support staff</p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mb-6">

        <button
          onClick={() => setShowAddAdminModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#F56D2D] text-white hover:bg-[#e45622] transition-colors"
          style={{ borderRadius: '7px' }}
        >
          + Add Super Admin
        </button>
      </div>



      {/* Summary Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-[#E8F0FF] rounded-lg p-4">
            <p className="text-sm text-gray-500">Internal Staff</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{summary.total_internal_staff ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Total users with platform access</p>
          </div>
          <div className="bg-white border border-[#E8F0FF] rounded-lg p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{summary.active ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Currently active accounts</p>
          </div>
          <div className="bg-white border border-[#E8F0FF] rounded-lg p-4">
            <p className="text-sm text-gray-500">Suspended</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{summary.suspended ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Accounts requiring review</p>
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
              placeholder="Search platform users"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-[220px] pl-8 bg-white pr-3 py-1.5 text-sm border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-[#E8F0FF] rounded-lg px-3 py-1.5 pr-6 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
            <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>

          {/* Role Dropdown */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-[#E8F0FF] rounded-lg px-3 py-1.5 pr-6 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
            >
              <option value="All Roles">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Billing Admin">Billing Admin</option>
              <option value="Support Admin">Support Admin</option>
            </select>
            <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
        </div>
      </div>
      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-12 text-center">
          <div className="spinner-border text-primary mx-auto" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-gray-600">Loading users...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <div className="text-red-600 text-center">
            <p className="font-semibold">Error loading users</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* No Users Message */}
      {!loading && !error && users.length === 0 && (
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-12 text-center">
          <FiUsers className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Users Found</h3>
          <p className="text-gray-600">No platform users match your current filters.</p>
        </div>
      )}

      {/* Users Table */}
      {!loading && !error && users.length > 0 && (
        <div className="bg-white rounded-lg border border-[#E8F0FF]">
          {/* Section Header */}
          <div className="p-2  border-[#E8F0FF]">
            <h6 className="text-xs font-semibold text-gray-800 mb-0 uppercase tracking-wide">
              Platform Users ({pagination.total_count})
            </h6>
            <p className="text-xs text-gray-600" style={{ fontSize: '11px' }}>
              Internal administrators and support staff with access to the Seqwens platform.
            </p>
          </div>

          {/* Table Headers */}
          <div className="px-4 py-2 border-[#E8F0FF]">
            <div className="flex items-center text-[#4B5563] uppercase tracking-wider text-[11px]">
              <div className="flex-1 text-left pr-4">User</div>
              <div className="w-48 text-left">Email</div>
              <div className="w-36 text-left">Role</div>
              <div className="w-28 text-left">Status</div>
              <div className="w-40 text-left">Last Login</div>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2 p-2">
            {users.map((user) => (
              <div
                key={user.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/superadmin/users-details/${user.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/superadmin/users-details/${user.id}`);
                  }
                }}
                className="border border-[#E8F0FF] rounded-lg p-2 transition-colors cursor-pointer hover:border-[#3B4A66] focus:outline-none focus:ring-2 focus:ring-[#3B4A66]"
              >
                <div className="flex items-center gap-3">
                  {/* Name Column */}
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="text-sm font-semibold text-gray-900 truncate hover:underline">
                      {user.full_name || 'Unnamed User'}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">User ID: {user.id}</p>
                  </div>

                  {/* Email Column */}
                  <div className="w-48 text-sm text-gray-700 truncate">
                    {user.email || '—'}
                  </div>

                  {/* Role Column */}
                  <div className="w-36 text-sm text-gray-700">
                    {user.role_display_name || user.role || '—'}
                  </div>

                  {/* Status Column */}
                  <div className="w-28">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getStatusBadgeClass(user.status_display || user.status)}`}
                    >
                      {user.status_display || user.status || 'Unknown'}
                    </span>
                  </div>

                  {/* Last Login Column */}
                  <div className="w-40 text-sm text-gray-600">
                    {user.last_login_display || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-t border-[#E8F0FF]">
            <p className="text-xs text-gray-500">
              Showing {startItem} to {endItem} of {pagination.total_count ?? users.length} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1 text-sm border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page || currentPage} of {pagination.total_pages || 1}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= (pagination.total_pages || 1)}
                className="px-3 py-1 text-sm border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddAdminModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-6 py-8">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'var(--Color-overlay, #00000099)' }}
            onClick={closeAddAdminModal}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-auto">
            <div className="flex justify-between items-start p-6 border-b border-[#E8F0FF]">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add Super Admin User</h3>
                <p className="text-sm text-gray-500 mt-1">Create a new super admin, billing admin, or support admin account.</p>
              </div>
              <button
                onClick={closeAddAdminModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                  <path d="M15.7793 8.21899C16.0723 8.51196 16.0723 8.98682 15.7793 9.27979L12.9976 12.0615L15.777 14.8408C16.07 15.1338 16.07 15.6086 15.777 15.9016C15.484 16.1946 15.0092 16.1946 14.7162 15.9016L11.9369 13.1223L9.15759 15.9016C8.86462 16.1946 8.38976 16.1946 8.0968 15.9016C7.80383 15.6086 7.80383 15.1338 8.0968 14.8408L10.8761 12.0615L8.09444 9.27979C7.80147 8.98682 7.80147 8.51196 8.09444 8.21899C8.3874 7.92603 8.86227 7.92603 9.15523 8.21899L11.9369 10.9993L14.7186 8.21899C15.0115 7.92603 15.4864 7.92603 15.7793 8.21899Z" fill="#3B4A66" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {createAdminError && (
                <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-3 py-2 rounded-lg">
                  {createAdminError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAdmin.fullName}
                    onChange={(e) => setNewAdmin((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Alex Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="alex.doe@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={newAdmin.phoneNumber}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setNewAdmin((prev) => ({ ...prev, phoneNumber: digitsOnly }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="5551234567"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a 10 digit phone number without country code.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) => setNewAdmin((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="billing_admin">Billing Admin</option>
                    <option value="support_admin">Support Admin</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Send welcome email with login details
                      </p>

                    </div>
                    <button
                      id="sendWelcomeEmail"
                      type="button"
                      onClick={() =>
                        setNewAdmin((prev) => ({ ...prev, sendWelcomeEmail: !prev.sendWelcomeEmail }))
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${newAdmin.sendWelcomeEmail ? 'bg-[#F56D2D]' : 'bg-gray-200'
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${newAdmin.sendWelcomeEmail ? 'translate-x-5' : 'translate-x-0'
                          }`}
                      />
                    </button>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={closeAddAdminModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 border border-[#E8F0FF] hover:bg-gray-50 transition-colors"
                      style={{ borderRadius: '8px' }}
                      disabled={creatingAdmin}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateSuperAdmin}
                      disabled={creatingAdmin}
                      className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] hover:bg-[#e45622] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ borderRadius: '8px' }}
                    >
                      {creatingAdmin ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      )}
    </div>
  );
}
