import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiSearch, FiShield, FiUsers, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { firmAdminStaffAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import TaxPreparerPermissionsModal from '../Staff/TaxPreparerPermissionsModal';

export default function CustomRolesManagement() {
  const [taxPreparers, setTaxPreparers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedPreparer, setSelectedPreparer] = useState(null);

  useEffect(() => {
    loadTaxPreparers();
  }, []);

  const loadTaxPreparers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await firmAdminStaffAPI.listTaxPreparers();
      
      if (response.success && response.data) {
        setTaxPreparers(response.data || []);
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

  // Filter tax preparers based on search term
  const filteredPreparers = taxPreparers.filter(preparer => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      preparer.full_name?.toLowerCase().includes(search) ||
      preparer.email?.toLowerCase().includes(search) ||
      preparer.role?.toLowerCase().includes(search)
    );
  });

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
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-4 sm:p-6">
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Total Tax Preparers</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
            {loading ? '...' : summary.total_preparers}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">In your firm</p>
        </div>

        <div className="bg-white rounded-lg border border-[#E8F0FF] p-4 sm:p-6">
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Active Preparers</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
            {loading ? '...' : summary.active_preparers}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Currently active</p>
        </div>

        <div className="bg-white rounded-lg border border-[#E8F0FF] p-4 sm:p-6">
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">With Permissions</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
            {loading ? '...' : summary.with_permissions}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Have custom permissions</p>
        </div>

        <div className="bg-white rounded-lg border border-[#E8F0FF] p-4 sm:p-6">
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Total Permissions</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
            {loading ? '...' : summary.total_permissions}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Across all preparers</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg border border-[#E8F0FF] shadow-sm">
        {/* Toolbar */}
        <div className="p-6 border-b border-[#E8F0FF]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <FiSearch className="text-gray-400" size={18} />
              </div>
              <input
                type="text"
                placeholder="Search tax preparers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Refresh the list
                  loadTaxPreparers();
                  toast.success('Tax preparers list refreshed', {
                    position: "top-right",
                    autoClose: 2000,
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-[BasisGrotesquePro] text-sm font-medium"
              >
                Refresh
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
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                <p className="text-xs text-blue-700 font-[BasisGrotesquePro]">
                  💡 <strong>Tip:</strong> Click on any tax preparer row or use the "Manage" button to customize their individual permissions. Changes only affect the selected preparer.
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[#E8F0FF] bg-gray-50">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro] uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro] uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro] uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPreparers.map((preparer) => (
                    <tr
                      key={preparer.id}
                      className="border-b border-[#E8F0FF] hover:bg-blue-50 transition-colors cursor-pointer group"
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
                          <div className={`p-2 rounded-lg transition-colors ${
                            preparer.is_active ? 'bg-[#32B582]/10 group-hover:bg-[#32B582]/20' : 'bg-gray-100 group-hover:bg-gray-200'
                          }`}>
                            <FiUsers
                              size={18}
                              color={preparer.is_active ? "#32B582" : "#9CA3AF"}
                            />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro] block group-hover:text-[#3AD6F2] transition-colors">
                              {preparer.full_name || 'N/A'}
                            </span>
                            <span className="text-xs text-gray-500 font-[BasisGrotesquePro] group-hover:text-gray-600 transition-colors">
                              Click to manage permissions
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                          {preparer.email || '—'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full font-[BasisGrotesquePro] capitalize">
                          {preparer.role || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {preparer.has_permissions ? (
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full font-[BasisGrotesquePro] border border-blue-200">
                              {preparer.permissions_count || 0} {preparer.permissions_count === 1 ? 'permission' : 'permissions'}
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full font-[BasisGrotesquePro]">
                              No permissions set
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full font-[BasisGrotesquePro] ${
                          preparer.is_active
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
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
                            className="px-3 py-1.5 bg-[#3AD6F2] text-white rounded-lg hover:bg-[#2BC4E0] transition-colors font-[BasisGrotesquePro] text-xs font-medium flex items-center gap-1.5"
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
