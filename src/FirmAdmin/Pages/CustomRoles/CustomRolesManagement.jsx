import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiSearch, FiShield, FiUsers, FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Fixed page size
  const [pagination, setPagination] = useState({
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false
  });

  // Handle search - trigger on button click or Enter key
  const handleSearch = () => {
    setDebouncedSearchTerm(searchTerm);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
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

  // Apply client-side filtering if search term exists (fallback if API doesn't filter)
  const filteredPreparers = debouncedSearchTerm.trim() 
    ? taxPreparers.filter(preparer => {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const nameMatch = preparer.full_name?.toLowerCase().includes(searchLower);
        const emailMatch = preparer.email?.toLowerCase().includes(searchLower);
        return nameMatch || emailMatch;
      })
    : taxPreparers;

  // Calculate summary statistics
  const summary = {
    total_preparers: taxPreparers.length,
    active_preparers: taxPreparers.filter(p => p.is_active).length,
    with_permissions: taxPreparers.filter(p => p.has_permissions).length,
    total_permissions: taxPreparers.reduce((sum, p) => sum + (p.permissions_count || 0), 0)
  };

  if (loading && taxPreparers.length === 0) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#32B582]"></div>
          <p className="mt-3 text-sm text-gray-600 font-[BasisGrotesquePro]">
            Loading tax preparers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[rgb(243,247,255)] min-h-screen" style={{ fontFamily: "BasisGrotesquePro" }}>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2">
          Tax Preparer Permissions Management
        </h1>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
          Manage individual permissions for each tax preparer in your firm. Each preparer can have their own unique set of permissions.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white rounded-xl border border-[#E8F0FF] p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDFF 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Total Tax Preparers</p>
            <div className="w-10 h-10 rounded-lg bg-[#00C0C6]/10 flex items-center justify-center">
              <FiUsers size={20} color="#00C0C6" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-[BasisGrotesquePro] mb-1" style={{ color: '#3B4A66' }}>
            {loading ? '...' : summary.total_preparers}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">In your firm</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E8F0FF] p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDFF 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Active Preparers</p>
            <div className="w-10 h-10 rounded-lg bg-[#32B582]/10 flex items-center justify-center">
              <FiUsers size={20} color="#32B582" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-[BasisGrotesquePro] mb-1" style={{ color: '#3B4A66' }}>
            {loading ? '...' : summary.active_preparers}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">Currently active</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E8F0FF] p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDFF 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">With Permissions</p>
            <div className="w-10 h-10 rounded-lg bg-[#3AD6F2]/10 flex items-center justify-center">
              <FiShield size={20} color="#3AD6F2" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-[BasisGrotesquePro] mb-1" style={{ color: '#3B4A66' }}>
            {loading ? '...' : summary.with_permissions}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">Have custom permissions</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E8F0FF] p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDFF 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Total Permissions</p>
            <div className="w-10 h-10 rounded-lg bg-[#00C0C6]/10 flex items-center justify-center">
              <FiShield size={20} color="#00C0C6" />
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
        <div className="p-6 border-b border-[#E8F0FF] bg-gradient-to-r from-[#F0FDFF] to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-2xl flex gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <FiSearch className="text-[#00C0C6]" size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Search tax preparers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-10 py-2.5 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C0C6] focus:border-[#00C0C6] font-[BasisGrotesquePro] text-sm transition-all duration-200 bg-white hover:border-[#00C0C6]/50"
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
                onClick={handleSearch}
                className="px-6 py-2.5 bg-gradient-to-r from-[#00C0C6] to-[#3AD6F2] text-white rounded-lg hover:from-[#00a8b0] hover:to-[#2BC4E0] transition-all duration-200 font-[BasisGrotesquePro] text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
                title="Search"
              >
                <FiSearch size={16} />
                Search
              </button>
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2.5 bg-white border border-[#E8F0FF] text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-[BasisGrotesquePro] text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
                  title="Clear search"
                >
                  <FiX size={16} />
                  Clear
                </button>
              )}
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
              <div className="px-6 py-3 bg-gradient-to-r from-[#E8F0FF] to-[#F0FDFF] border-b border-[#E8F0FF]">
                <p className="text-xs font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                  💡 <strong>Tip:</strong> Click on any tax preparer row or use the "Manage" button to customize their individual permissions. Changes only affect the selected preparer.
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[#E8F0FF] bg-gradient-to-r from-[#F9FAFB] to-[#F0FDFF]">
                    <th className="text-left py-4 px-6 text-sm font-semibold font-[BasisGrotesquePro] uppercase tracking-wider" style={{ color: '#3B4A66' }}>
                      Name
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold font-[BasisGrotesquePro] uppercase tracking-wider" style={{ color: '#3B4A66' }}>
                      Email
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold font-[BasisGrotesquePro] uppercase tracking-wider" style={{ color: '#3B4A66' }}>
                      Role
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold font-[BasisGrotesquePro] uppercase tracking-wider" style={{ color: '#3B4A66' }}>
                      Permissions
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold font-[BasisGrotesquePro] uppercase tracking-wider" style={{ color: '#3B4A66' }}>
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold font-[BasisGrotesquePro] uppercase tracking-wider" style={{ color: '#3B4A66' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPreparers.map((preparer) => (
                    <tr
                      key={preparer.id}
                      className="border-b border-[#E8F0FF] hover:bg-gradient-to-r hover:from-[#F0FDFF] hover:to-white transition-all duration-200 cursor-pointer group"
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
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg transition-all duration-200 ${
                            preparer.is_active ? 'bg-[#32B582]/10 group-hover:bg-[#32B582]/20 shadow-sm' : 'bg-gray-100 group-hover:bg-gray-200'
                          }`}>
                            <FiUsers
                              size={18}
                              color={preparer.is_active ? "#32B582" : "#9CA3AF"}
                            />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-semibold font-[BasisGrotesquePro] block transition-colors duration-200" style={{ color: '#3B4A66' }}>
                              {preparer.full_name || 'N/A'}
                            </span>
                            <span className="text-xs font-[BasisGrotesquePro] transition-colors duration-200" style={{ color: '#6B7280' }}>
                              Click to manage permissions
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>
                          {preparer.email || '—'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-xs font-semibold rounded-lg font-[BasisGrotesquePro] capitalize border border-gray-200 shadow-sm">
                          {preparer.role || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {preparer.has_permissions ? (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-[#E8F0FF] to-[#F0FDFF] text-xs font-semibold rounded-lg font-[BasisGrotesquePro] border border-[#00C0C6]/30 shadow-sm" style={{ color: '#00C0C6' }}>
                              {preparer.permissions_count || 0} {preparer.permissions_count === 1 ? 'permission' : 'permissions'}
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg font-[BasisGrotesquePro] border border-gray-200">
                              No permissions set
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg font-[BasisGrotesquePro] border shadow-sm ${
                          preparer.is_active
                            ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {preparer.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
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
                            className="px-4 py-2 bg-gradient-to-r from-[#00C0C6] to-[#3AD6F2] text-white rounded-lg hover:from-[#00a8b0] hover:to-[#2BC4E0] transition-all duration-200 font-[BasisGrotesquePro] text-xs font-medium flex items-center gap-1.5 shadow-sm hover:shadow-md"
                            title="Manage Permissions"
                          >
                            <FiEdit2 size={14} />
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
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!pagination.has_previous || currentPage === 1}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 font-[BasisGrotesquePro] shadow-sm ${
                        !pagination.has_previous || currentPage === 1
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
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 font-[BasisGrotesquePro] shadow-sm ${
                              currentPage === pageNum
                                ? 'bg-gradient-to-r from-[#00C0C6] to-[#3AD6F2] text-white shadow-md'
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
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 font-[BasisGrotesquePro] shadow-sm ${
                        !pagination.has_next || currentPage === pagination.total_pages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                          : 'bg-white border border-[#E8F0FF] hover:border-[#00C0C6] hover:bg-[#F0FDFF] text-gray-700'
                        }`}
                    >
                      Next
                    </button>
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
