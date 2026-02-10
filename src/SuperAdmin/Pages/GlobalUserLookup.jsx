import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown, FiUsers } from 'react-icons/fi';
import { superAdminAPI, handleAPIError } from '../utils/superAdminAPI';
import { useTheme } from '../Context/ThemeContext';
import { getUserData } from '../../ClientOnboarding/utils/userUtils';

export default function GlobalUserLookup() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    total_count: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('global_user_lookup_page_size');
    return saved ? parseInt(saved) : 25;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);

  const loggedInUser = getUserData();
  const isSuperAdmin = loggedInUser?.user_type === 'super_admin';



  const getStatusBadgeClass = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('inactive')) return 'bg-gray-400';
    if (normalized.includes('active')) return 'bg-green-500';
    if (normalized.includes('suspend')) return 'bg-red-500';
    return 'bg-gray-400';
  };


  const startItem = pagination.total_count ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, pagination.total_count);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const statusParam = statusFilter !== 'All Status' ? statusFilter.toLowerCase() : '';
        const roleParam =
          roleFilter !== 'All Roles' ? roleFilter.toLowerCase().replace(/\s+/g, '_') : '';

        // If no search term and no specific filters, we might want to avoid loading *everyone* or just load recent?
        // For now, let's load default page 1 of "All Users" which the backend supports.

        const response = await superAdminAPI.getPlatformUsers({
          status: statusParam,
          role: roleParam, // Backend now handles "all roles" properly
          search: searchTerm.trim(),
          page: currentPage,
          limit: pageSize,
          lookup: true,
        });

        if (response.success && response.data) {
          setUsers(response.data.users || []);
          setPagination({
            total_count: response.data.total_count || 0,
            total_pages: response.data.total_pages || 1,
          });
        } else {
          throw new Error(response.message || 'Failed to fetch users');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(handleAPIError(err));
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchTerm, statusFilter, roleFilter, currentPage, pageSize]);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    localStorage.setItem('global_user_lookup_page_size', newSize.toString());
  };

  return (
    <div className="p-6 bg-[#F6F7FF] dark:bg-gray-900 transition-colors duration-200">
      {/* Page Title and Description */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Global User Lookup</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Search and manage credentials for any user in the system (Clients, Firms, Admin Staff)</p>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg border border-[#E8F0FF] dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
          {/* Search Input */}
          <div className="relative w-full md:w-[450px] md:mr-auto">
            <input
              type="text"
              placeholder="Search by name, email, or firm..."
              className="w-full pl-10 pr-4 py-2 border border-[#E8F0FF] dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 21L16.65 16.65"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Status Dropdown */}
          <div className="relative w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white dark:bg-gray-700 border border-[#E8F0FF] dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px] transition-colors"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
            <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>

          {/* Role Dropdown */}
          <div className="relative w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white dark:bg-gray-700 border border-[#E8F0FF] dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px] transition-colors"
            >
              <option value="All Roles">All Roles</option>
              <option value="client">Client</option>
              <option value="firm">Firm Admin</option>
              <option value="tax_preparer">Tax Preparer</option>
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
          <p className="text-red-600 text-center font-medium">Error loading users: {error}</p>
        </div>
      )}

      {/* No Users Message */}
      {!loading && !error && users.length === 0 && (
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-12 text-center">
          <FiUsers className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Users Found</h3>
          <p className="text-gray-600">Try adjusting your search terms or filters.</p>
        </div>
      )}

      {/* Users Table */}
      {!loading && !error && users.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-[#E8F0FF] dark:border-gray-700 transition-all">
          <div className="p-4 border-b border-[#E8F0FF] dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h6 className="text-sm font-semibold text-gray-800 dark:text-white mb-0 uppercase tracking-wide">
                  Search Results ({pagination.total_count})
                </h6>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                  className="text-xs border border-[#E8F0FF] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#F56D2D]"
                >
                  {[25, 50, 100, 250].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="px-4 py-2 border-[#E8F0FF]">
            <div className="flex items-center text-[#4B5563] dark:text-gray-400 uppercase tracking-wider text-[11px]">
              <div className="flex-1 text-left pr-4">User</div>
              <div className="w-48 text-left">Email</div>
              <div className="w-40 text-left">Firm/Organization</div>
              <div className="w-36 text-left">Role</div>
              <div className="w-28 text-left">Status</div>
            </div>
          </div>

          <div className="space-y-2 p-2">
            {users.map((user) => (
              <div
                key={user.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/superadmin/users-details/${user.id}?mode=lookup`)}
                className="border border-[#E8F0FF] dark:border-gray-700 rounded-lg p-2 transition-colors cursor-pointer hover:border-[#3B4A66] dark:hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B4A66] bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate hover:underline">
                      {user.full_name || 'Unnamed User'}
                    </span>
                  </div>

                  <div className="w-48 text-sm text-gray-700 dark:text-gray-300 truncate">
                    {user.email || '—'}
                  </div>

                  <div className="w-40 text-sm text-gray-700 dark:text-gray-300 truncate">
                    {user.firm_name || user.firm_id ? (user.firm_name || 'Firm #' + user.firm_id) : '—'}
                  </div>

                  <div className="w-36 text-sm text-gray-700 dark:text-gray-300">
                    {user.role_display_name || user.role || '—'}
                  </div>

                  <div className="w-28">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getStatusBadgeClass(user.status_display || user.status)}`}
                    >
                      {user.status_display || user.status || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8F0FF] dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-lg">
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-medium text-gray-900 dark:text-white">{startItem}-{endItem}</span> of <span className="font-medium text-gray-900 dark:text-white">{pagination.total_count}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.total_pages))}
                disabled={currentPage === pagination.total_pages || loading}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
