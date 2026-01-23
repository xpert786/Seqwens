import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown, FiUpload, FiDownload, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { superAdminAPI, handleAPIError } from '../utils/superAdminAPI';
import { superToastOptions } from '../utils/toastConfig';
import { useTheme } from '../Context/ThemeContext';

export default function UserManagement() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
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
  const [phoneCountry, setPhoneCountry] = useState('us');

  // Client-side pagination for displaying user cards
  const [userCardsCurrentPage, setUserCardsCurrentPage] = useState(1);
  const [showAllUserCards, setShowAllUserCards] = useState(false);
  const USER_CARDS_PER_PAGE = 3;

  const getStatusBadgeClass = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('active')) return 'bg-green-500';
    if (normalized.includes('suspend')) return 'bg-red-500';
    return 'bg-gray-400';
  };


  const startItem = pagination.total_count ? 1 : 0;
  const endItem = pagination.total_count || 0;

  // Client-side pagination logic for user cards
  const totalUserCards = users.length;
  const totalUserCardsPages = Math.ceil(totalUserCards / USER_CARDS_PER_PAGE);
  const shouldShowUserCardsPagination = totalUserCards > USER_CARDS_PER_PAGE && !showAllUserCards;
  const displayedUserCards = showAllUserCards
    ? users
    : users.slice((userCardsCurrentPage - 1) * USER_CARDS_PER_PAGE, userCardsCurrentPage * USER_CARDS_PER_PAGE);

  const handleViewAllUserCards = (e) => {
    e.preventDefault();
    setShowAllUserCards(!showAllUserCards);
    if (showAllUserCards) {
      setUserCardsCurrentPage(1);
    }
  };

  const handleUserCardsPageChange = (newPage) => {
    setUserCardsCurrentPage(newPage);
  };

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
          // No pagination - set total count directly
          setPagination({
            page: 1,
            page_size: response.data.total_count || response.data.users?.length || 0,
            total_count: response.data.total_count || response.data.users?.length || 0,
            total_pages: 1,
          });
          // Reset client-side pagination when data changes
          setUserCardsCurrentPage(1);
          setShowAllUserCards(false);
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
  }, [searchTerm, statusFilter, roleFilter, refreshKey]);

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

    const phoneDigits = newAdmin.phoneNumber.replace(/\D/g, '').length;
    if (phoneDigits < 10 || phoneDigits > 15) {
      setCreateAdminError('Phone number must be between 10 and 15 digits.');
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
    <div className="p-6 bg-[#F6F7FF] dark:bg-gray-900 transition-colors duration-200">
      {/* Page Title and Description */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Manage internal platform administrators and support staff</p>
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
          <div className="bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 rounded-lg p-4 transition-all">
            <p className="text-sm text-gray-500 dark:text-gray-400">Internal Staff</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{summary.total_internal_staff ?? 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Total users with platform access</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 rounded-lg p-4 transition-all">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{summary.active ?? 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Currently active accounts</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 rounded-lg p-4 transition-all">
            <p className="text-sm text-gray-500 dark:text-gray-400">Suspended</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{summary.suspended ?? 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Accounts requiring review</p>
          </div>
        </div>
      )}
      {/* Filters Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
              }}
              className="appearance-none bg-white dark:bg-gray-700 border border-[#E8F0FF] dark:border-gray-600 rounded-lg px-3 py-1.5 pr-6 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px] transition-colors"
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
              }}
              className="appearance-none bg-white dark:bg-gray-700 border border-[#E8F0FF] dark:border-gray-600 rounded-lg px-3 py-1.5 pr-6 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px] transition-colors"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-[#E8F0FF] dark:border-gray-700 transition-all">
          {/* Section Header */}
          <div className="p-2 border-[#E8F0FF]">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h6 className="text-xs font-semibold text-gray-800 dark:text-white mb-0 uppercase tracking-wide">
                  Platform Users ({pagination.total_count})
                </h6>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1" style={{ fontSize: '11px' }}>
                  Internal administrators and support staff with access to the Seqwens platform.
                </p>
              </div>
              {totalUserCards > USER_CARDS_PER_PAGE && (
                <button
                  onClick={handleViewAllUserCards}
                  className="text-black text-sm font-medium hover:underline cursor-pointer px-3 py-2 transition-colors"
                  style={{ border: '1px solid #E8F0FF', borderRadius: '8px' }}
                >
                  {showAllUserCards ? 'Show Less' : 'View All'}
                </button>
              )}
            </div>
          </div>

          {/* Table Headers */}
          <div className="px-4 py-2 border-[#E8F0FF]">
            <div className="flex items-center text-[#4B5563] dark:text-gray-400 uppercase tracking-wider text-[11px]">
              <div className="flex-1 text-left pr-4">User</div>
              <div className="w-48 text-left">Email</div>
              <div className="w-36 text-left">Role</div>
              <div className="w-28 text-left">Status</div>
              <div className="w-40 text-left">Last Login</div>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2 p-2">
            {displayedUserCards.map((user) => (
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
                className="border border-[#E8F0FF] dark:border-gray-700 rounded-lg p-2 transition-colors cursor-pointer hover:border-[#3B4A66] dark:hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B4A66] bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center gap-3">
                  {/* Name Column */}
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate hover:underline">
                      {user.full_name || 'Unnamed User'}
                    </span>
                  </div>

                  {/* Email Column */}
                  <div className="w-48 text-sm text-gray-700 dark:text-gray-300 truncate">
                    {user.email || '—'}
                  </div>

                  {/* Role Column */}
                  <div className="w-36 text-sm text-gray-700 dark:text-gray-300">
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
                  <div className="w-40 text-sm text-gray-600 dark:text-gray-400">
                    {user.last_login_display || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Client-side Pagination Controls */}
          {shouldShowUserCardsPagination && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8F0FF] dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-lg">
              <button
                onClick={() => handleUserCardsPageChange(userCardsCurrentPage - 1)}
                disabled={userCardsCurrentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {userCardsCurrentPage} of {totalUserCardsPages}
                </span>
              </div>
              <button
                onClick={() => handleUserCardsPageChange(userCardsCurrentPage + 1)}
                disabled={userCardsCurrentPage === totalUserCardsPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {showAddAdminModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-6 py-8">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'var(--Color-overlay, #00000099)' }}
            onClick={closeAddAdminModal}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl mx-auto transition-all">
            <div className="flex justify-between items-start p-6 border-b border-[#E8F0FF] dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Super Admin User</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new super admin, billing admin, or support admin account.</p>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAdmin.fullName}
                    onChange={(e) => setNewAdmin((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E8F0FF] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Alex Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E8F0FF] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="alex.doe@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number<span className="text-red-500">*</span>
                  </label>
                  <PhoneInput
                    country={phoneCountry}
                    value={newAdmin.phoneNumber || ''}
                    onChange={(phone) => {
                      setNewAdmin((prev) => ({ ...prev, phoneNumber: phone }));
                    }}
                    onCountryChange={(countryCode) => {
                      setPhoneCountry(countryCode.toLowerCase());
                    }}
                    inputStyle={{
                      width: '100%',
                      paddingLeft: '48px',
                      height: '38px',
                      fontSize: '14px',
                      border: '1px solid #E8F0FF',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: '#374151'
                    }}
                    buttonStyle={{
                      border: '1px solid #E8F0FF',
                      borderRadius: '8px 0 0 8px',
                      backgroundColor: 'white'
                    }}
                    inputClass="dark:!bg-gray-700 dark:!border-gray-600 dark:!text-white"
                    buttonClass="dark:!bg-gray-700 dark:!border-gray-600"
                    containerClass="w-full"
                    enableSearch={true}
                    countryCodeEditable={false}
                    disableDropdown={false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) => setNewAdmin((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E8F0FF] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="billing_admin">Billing Admin</option>
                    <option value="support_admin">Support Admin</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Send welcome email with login details
                      </p>

                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={newAdmin.sendWelcomeEmail}
                      onClick={() =>
                        setNewAdmin((prev) => ({
                          ...prev,
                          sendWelcomeEmail: !prev.sendWelcomeEmail,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
    ${newAdmin.sendWelcomeEmail ? 'bg-[#F56D2D]' : 'bg-gray-200 dark:bg-gray-600'}`}
                      style={{ borderRadius: '13px', padding: '0px'}}
                    >
                      <span
                        className={`absolute left-0.5 inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out
      ${newAdmin.sendWelcomeEmail ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>


                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={closeAddAdminModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 border border-[#E8F0FF] dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
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
