import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiSearch, FiShield, FiUsers, FiEdit2, FiTrash2, FiPlus, FiX, FiUserCheck, FiKey } from 'react-icons/fi';
import { firmAdminStaffAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import TaxPreparerPermissionsModal from '../Staff/TaxPreparerPermissionsModal';

export default function CustomRolesManagement() {
  const [taxPreparers, setTaxPreparers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedPreparer, setSelectedPreparer] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'active', 'permissions'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isViewAll, setIsViewAll] = useState(false);
  const [pagination, setPagination] = useState({
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false
  });

  // Handle live search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
    setTypeFilter('all');
  };

  // Also allow Enter key to trigger search
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    loadTaxPreparers();
  }, [currentPage, pageSize, debouncedSearchTerm]);

  const loadTaxPreparers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        page_size: pageSize
      };

      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }

      const response = await firmAdminStaffAPI.listTaxPreparers(params);

      if (response.success) {
        // Handle different response structures
        if (response.data && Array.isArray(response.data)) {
          // Response with data as array and total_count at root level
          const totalCount = response.total_count !== undefined ? response.total_count : response.data.length;
          const totalPages = Math.ceil(totalCount / pageSize);

          setTaxPreparers(response.data);
          setPagination({
            total_count: totalCount,
            total_pages: totalPages,
            has_next: currentPage < totalPages,
            has_previous: currentPage > 1,
            page: currentPage,
            page_size: pageSize
          });
        } else if (response.data && response.data.tax_preparers) {
          // Paginated response with tax_preparers array
          setTaxPreparers(response.data.tax_preparers || []);
          setPagination({
            total_count: response.data.total_count || 0,
            total_pages: response.data.total_pages || 1,
            has_next: response.data.has_next || false,
            has_previous: response.data.has_previous || false,
            page: response.data.page || currentPage,
            page_size: response.data.page_size || pageSize
          });
        } else if (response.data && response.data.results) {
          // Paginated response with results array
          setTaxPreparers(response.data.results || []);
          setPagination({
            total_count: response.data.count || response.data.total_count || 0,
            total_pages: response.data.total_pages || Math.ceil((response.data.count || 0) / pageSize),
            has_next: response.data.next !== null,
            has_previous: response.data.previous !== null,
            page: currentPage,
            page_size: pageSize
          });
        } else {
          setTaxPreparers([]);
          setPagination({
            total_count: 0,
            total_pages: 1,
            has_next: false,
            has_previous: false
          });
        }
      } else {
        setError(response.message || 'Failed to load tax preparers');
        toast.error(response.message || 'Failed to load tax preparers', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error('Error loading tax preparers:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Switch to view all mode
  const handleViewAll = () => {
    setIsViewAll(true);
    setPageSize(1000); // Set to a large enough number
    setCurrentPage(1);
  };

  const handleResetPagination = (size = 5) => {
    setIsViewAll(false);
    setPageSize(size);
    setCurrentPage(1);
  };

  // Apply client-side filtering
  const filteredPreparers = taxPreparers.filter(preparer => {
    // Search filter
    let searchMatch = true;
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      const name = (preparer.full_name || preparer.name || preparer.staff_member?.name || '').toLowerCase();
      const email = (preparer.email || preparer.staff_member?.email || '').toLowerCase();
      searchMatch = name.includes(searchLower) || email.includes(searchLower);
    }

    // Type filter (from metric cards)
    let typeMatch = true;
    if (typeFilter === 'active') {
      typeMatch = !!preparer.is_active;
    } else if (typeFilter === 'permissions') {
      typeMatch = !!preparer.has_permissions;
    }

    return searchMatch && typeMatch;
  });

  // Calculate summary statistics
  const summary = {
    total_preparers: pagination.total_count || taxPreparers.length,
    active_preparers: taxPreparers.filter(p => !!p.is_active).length,
    with_permissions: taxPreparers.filter(p => !!p.has_permissions).length,
    total_permissions: taxPreparers.reduce((sum, p) => sum + (p.permissions_count || 0), 0)
  };

  // Only show the full-page loader on initial load if no data exists
  if (loading && taxPreparers.length === 0) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '100vh', background: '#F3F7FF' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#32B582] border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">
            Initializing firm data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen" style={{ fontFamily: "BasisGrotesquePro" }}>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2">
          Tax Preparer Permissions Management
        </h1>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
          Manage individual permissions for each tax preparer in your firm. Each preparer can have their own unique set of permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div
          onClick={() => setTypeFilter('all')}
          className={`cursor-pointer bg-white rounded-xl border p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 ${typeFilter === 'all' ? 'border-[#00C0C6] ring-1 ring-[#00C0C6]' : 'border-[#E8F0FF]'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Total Tax Preparers</p>
            <div className="w-10 h-10 rounded-lg bg-[#00C0C6]/10 flex items-center justify-center">
              <FiUsers size={20} color="#00C0C6" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-[BasisGrotesquePro] mb-1" style={{ color: '#3B4A66' }}>
            {summary.total_preparers}
          </p>
          <p className="text-xs sm:text-sm text-blue-600 font-medium font-[BasisGrotesquePro] hover:underline">View All Firm</p>
        </div>

        <div
          onClick={() => setTypeFilter('active')}
          className={`cursor-pointer bg-white rounded-xl border p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 ${typeFilter === 'active' ? 'border-[#32B582] ring-1 ring-[#32B582]' : 'border-[#E8F0FF]'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Active Preparers</p>
            <div className="w-10 h-10 rounded-lg bg-[#32B582]/10 flex items-center justify-center">
              <FiUsers size={20} color="#32B582" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-[BasisGrotesquePro] mb-1" style={{ color: '#3B4A66' }}>
            {summary.active_preparers}
          </p>
          <p className="text-xs sm:text-sm text-green-600 font-medium font-[BasisGrotesquePro] hover:underline">View Currently active</p>
        </div>

        <div
          onClick={() => setTypeFilter('permissions')}
          className={`cursor-pointer bg-white rounded-xl border p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 ${typeFilter === 'permissions' ? 'border-[#3AD6F2] ring-1 ring-[#3AD6F2]' : 'border-[#E8F0FF]'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">With Permissions</p>
            <div className="w-10 h-10 rounded-lg bg-[#3AD6F2]/10 flex items-center justify-center">
              <FiUserCheck size={20} color="#3AD6F2" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-[BasisGrotesquePro] mb-1" style={{ color: '#3B4A66' }}>
            {loading ? '...' : summary.with_permissions}
          </p>
          <p className="text-xs sm:text-sm text-cyan-600 font-medium font-[BasisGrotesquePro] hover:underline">View Custom permissions</p>
        </div>

        <div
          className="bg-white rounded-xl border border-[#E8F0FF] p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Total Permissions</p>
            <div className="w-10 h-10 rounded-lg bg-[#00C0C6]/10 flex items-center justify-center">
              <FiKey size={20} color="#00C0C6" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-[BasisGrotesquePro] mb-1" style={{ color: '#3B4A66' }}>
            {loading ? '...' : summary.total_permissions}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">Across all preparers</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl border border-[#E8F0FF] shadow-md overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-[#E8F0FF] bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-2xl flex gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <FiSearch className="text-[#00C0C6]" size={18} />
                </div>
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search tax preparers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C0C6] focus:border-[#00C0C6] font-[BasisGrotesquePro] text-sm transition-all duration-200 bg-white hover:border-[#00C0C6]/50"
                  style={{ backgroundColor: '#FFFFFF' }}
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear search"
                  >
                    <FiX size={18} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setDebouncedSearchTerm(searchTerm)}
                className="px-6 py-2.5 text-white !rounded-lg hover:shadow-md transition-all duration-200 font-[BasisGrotesquePro] text-sm font-medium flex items-center gap-2 shadow-sm"
                style={{ backgroundColor: 'var(--firm-primary-color)' }}
                title="Search"
              >
                <FiSearch size={16} />
                Search
              </button>
            </div>

          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-[BasisGrotesquePro]">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {loading && taxPreparers.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#32B582]"></div>
              <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading tax preparers...</p>
            </div>
          ) : filteredPreparers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <FiUsers size={32} color="#9CA3AF" />
              </div>
              <h5 className="text-lg font-semibold text-[#3B4A66] mb-2 font-[BasisGrotesquePro]">
                {searchTerm ? 'No tax preparers found' : 'No Tax Preparers Found'}
              </h5>
              <p className="text-sm text-[#6B7280] mb-6 font-[BasisGrotesquePro] max-w-md mx-auto">
                {searchTerm
                  ? 'Try adjusting your search terms to find what you\'re looking for.'
                  : 'No tax preparers have been added to your firm yet.'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="px-6 py-3 bg-[#F3F7FF] border-b border-[#E8F0FF]">
                <p className="text-xs font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                  💡 <strong>Tip:</strong> Click on any tax preparer row or use the "Manage" button to customize their individual permissions. Changes only affect the selected preparer.
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[#E8F0FF] bg-[#F9FAFB]">
                    <th className="text-left py-2 px-3 text-[10px] font-semibold font-[BasisGrotesquePro] uppercase tracking-wider" style={{ color: '#3B4A66' }}>
                      Name
                    </th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold font-[BasisGrotesquePro] uppercase tracking-wider" style={{ color: '#3B4A66' }}>
                      Email
                    </th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold font-[BasisGrotesquePro] uppercase tracking-wider" style={{ color: '#3B4A66' }}>
                      Role
                    </th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold font-[BasisGrotesquePro] uppercase tracking-wider" style={{ color: '#3B4A66' }}>
                      Permissions
                    </th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold font-[BasisGrotesquePro] uppercase tracking-wider" style={{ color: '#3B4A66' }}>
                      Status
                    </th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold font-[BasisGrotesquePro] uppercase tracking-wider" style={{ color: '#3B4A66' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPreparers.map((preparer) => (
                    <tr
                      key={preparer.id}
                      className="border-b border-[#E8F0FF] hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                      onClick={() => {
                        setSelectedPreparer({
                          id: preparer.id,
                          name: preparer.full_name,
                          email: preparer.email,
                          role: preparer.role
                        });
                        setShowPermissionsModal(true);
                      }}
                    >
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg transition-all duration-200 ${preparer.is_active ? 'bg-[#32B582]/10 group-hover:bg-[#32B582]/20 shadow-sm' : 'bg-gray-100 group-hover:bg-gray-200'
                            }`}>
                            <FiUsers
                              size={14}
                              color={preparer.is_active ? "#32B582" : "#9CA3AF"}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-semibold font-[BasisGrotesquePro] block truncate transition-colors duration-200" style={{ color: '#3B4A66' }}>
                              {preparer.full_name || 'N/A'}
                            </span>
                            <span className="text-[9px] font-[BasisGrotesquePro] block truncate transition-colors duration-200" style={{ color: '#6B7280' }}>
                              Click to manage
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-[BasisGrotesquePro] truncate block" style={{ color: '#6B7280' }}>
                          {preparer.email || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-[10px] font-semibold rounded-md font-[BasisGrotesquePro] capitalize border border-gray-200 shadow-sm">
                          {preparer.role || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {preparer.has_permissions ? (
                            <span className="px-2 py-1 bg-gradient-to-r from-[#E8F0FF] to-[#F0FDFF] text-[10px] font-semibold rounded-md font-[BasisGrotesquePro] border border-[#00C0C6]/30 shadow-sm" style={{ color: '#00C0C6' }}>
                              {preparer.permissions_count || 0} {preparer.permissions_count === 1 ? 'permission' : 'permissions'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded-md font-[BasisGrotesquePro] border border-gray-200">
                              No permissions
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-[10px] font-semibold rounded-md font-[BasisGrotesquePro] border shadow-sm ${preparer.is_active
                          ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                          {preparer.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPreparer({
                                id: preparer.id,
                                name: preparer.full_name,
                                email: preparer.email,
                                role: preparer.role
                              });
                              setShowPermissionsModal(true);
                            }}
                            className="px-3 py-1.5 text-white !rounded-md hover:shadow-md transition-all duration-200 font-[BasisGrotesquePro] text-[10px] font-medium flex items-center gap-1 shadow-sm"
                            style={{ backgroundColor: 'var(--firm-primary-color)' }}
                            title="Manage Permissions"
                          >
                            <FiEdit2 size={12} />
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.total_count > 0 && (
                <div className="p-6 border-t border-[#E8F0FF] bg-gradient-to-r from-[#F9FAFB] to-[#F0FDFF] flex items-center justify-between">
                  <div className="text-sm font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>
                    Showing <span className="font-semibold" style={{ color: '#3B4A66' }}>{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-semibold" style={{ color: '#3B4A66' }}>{Math.min(currentPage * pageSize, pagination.total_count)}</span> of <span className="font-semibold" style={{ color: '#3B4A66' }}>{pagination.total_count}</span> tax preparer{pagination.total_count !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={isViewAll ? () => handleResetPagination(5) : handleViewAll}
                      className="px-4 py-2 text-sm font-semibold !rounded-lg transition-all duration-200 font-[BasisGrotesquePro] bg-[#F0FDFF] border border-[#00C0C6]/30 text-[#00C0C6] hover:bg-[#00C0C6] hover:text-white shadow-sm"
                    >
                      {isViewAll ? 'Paginate' : 'View All'}
                    </button>
                    {!isViewAll && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={!pagination.has_previous || currentPage === 1}
                          className={`px-4 py-2 text-sm font-medium !rounded-lg transition-all duration-200 font-[BasisGrotesquePro] shadow-sm ${!pagination.has_previous || currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            : 'bg-white border border-[#E8F0FF] hover:border-[#00C0C6] hover:bg-[#F0FDFF] text-gray-700'
                            }`}
                        >
                          Previous
                        </button>
                        <div className="flex items-center gap-1">
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
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-4 py-2 text-sm font-medium !rounded-lg transition-all duration-200 font-[BasisGrotesquePro] shadow-sm ${currentPage === pageNum
                                  ? 'bg-[#F56D2D] text-white shadow-md'
                                  : 'bg-white border border-[#E8F0FF] hover:border-[#00C0C6] hover:bg-[#F0FDFF] text-gray-700'
                                  }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
                          disabled={!pagination.has_next || currentPage === pagination.total_pages}
                          className={`px-4 py-2 text-sm font-medium !rounded-lg transition-all duration-200 font-[BasisGrotesquePro] shadow-sm ${!pagination.has_next || currentPage === pagination.total_pages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            : 'bg-white border border-[#E8F0FF] hover:border-[#00C0C6] hover:bg-[#F0FDFF] text-gray-700'
                            }`}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tax Preparer Permissions Modal */}
      {showPermissionsModal && selectedPreparer && (
        <TaxPreparerPermissionsModal
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedPreparer(null);
            // Refresh the list to show updated permission counts
            loadTaxPreparers();
          }}
          preparerId={selectedPreparer.id}
          preparerName={selectedPreparer.name}
          preparerEmail={selectedPreparer.email}
        />
      )}
    </div>
  );
}
