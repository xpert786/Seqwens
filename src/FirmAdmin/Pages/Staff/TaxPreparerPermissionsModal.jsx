import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiX, FiUser, FiMail, FiShield, FiInfo } from 'react-icons/fi';
import { firmAdminStaffAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';

// Permission categories mapping with icons
const PERMISSION_CATEGORIES = {
  'Client Access': {
    codes: ['view_assigned_clients_only', 'view_all_firm_clients', 'view_unlinked_taxpayers'],
    icon: '👥',
    color: 'blue'
  },
  'Client Management': {
    codes: ['create_clients', 'edit_client_data'],
    icon: '📝',
    color: 'green'
  },
  'Document Management': {
    codes: ['upload_documents', 'download_documents', 'delete_documents'],
    icon: '📄',
    color: 'purple'
  },
  'Returns & Filing': {
    codes: ['view_returns'],
    icon: '📊',
    color: 'orange'
  },
  'E-Signatures': {
    codes: ['initiate_esignature', 'track_esignature'],
    icon: '✍️',
    color: 'indigo'
  },
  'Communication': {
    codes: ['send_messages', 'receive_messages'],
    icon: '💬',
    color: 'pink'
  },
  'Billing': {
    codes: ['create_invoices'],
    icon: '💰',
    color: 'yellow'
  },
  'Reports & Analytics': {
    codes: ['access_analytics', 'export_reports'],
    icon: '📈',
    color: 'teal'
  },
  'Team Management': {
    codes: ['manage_team'],
    icon: '👔',
    color: 'red'
  }
};

export default function TaxPreparerPermissionsModal({ 
  isOpen, 
  onClose, 
  preparerId,
  preparerName,
  preparerEmail 
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [permissionChoices, setPermissionChoices] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Fetch permissions when modal opens
  useEffect(() => {
    if (isOpen && preparerId) {
      fetchPermissions();
    }
  }, [isOpen, preparerId]);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await firmAdminStaffAPI.getTaxPreparerPermissions(preparerId);
      
      if (response.success && response.data) {
        setPermissions(response.data.permissions || []);
        setPermissionChoices(response.data.permission_choices || []);
        setSelectedPermissions(response.data.permissions || []);
      } else {
        throw new Error(response.message || 'Failed to load permissions');
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg || 'Failed to load permissions', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setLoading(false);
    }
  }, [preparerId]);

  const handlePermissionToggle = (code) => {
    setSelectedPermissions(prev => {
      // Handle mutual exclusivity for view permissions
      if (code === 'view_assigned_clients_only') {
        return prev.includes('view_all_firm_clients')
          ? [...prev.filter(p => p !== 'view_all_firm_clients'), code]
          : prev.includes(code)
          ? prev.filter(p => p !== code)
          : [...prev, code];
      }
      if (code === 'view_all_firm_clients') {
        return prev.includes('view_assigned_clients_only')
          ? [...prev.filter(p => p !== 'view_assigned_clients_only'), code]
          : prev.includes(code)
          ? prev.filter(p => p !== code)
          : [...prev, code];
      }
      
      // Regular toggle
      return prev.includes(code)
        ? prev.filter(p => p !== code)
        : [...prev, code];
    });
  };

  const handleCategoryToggle = (categoryCodes, allSelected) => {
    if (allSelected) {
      // Deselect all in category
      setSelectedPermissions(prev => 
        prev.filter(p => !categoryCodes.includes(p))
      );
    } else {
      // Select all in category (handle mutual exclusivity)
      setSelectedPermissions(prev => {
        let updated = [...prev];
        categoryCodes.forEach(code => {
          if (!updated.includes(code)) {
            // Handle mutual exclusivity for view permissions
            if (code === 'view_assigned_clients_only' && updated.includes('view_all_firm_clients')) {
              updated = updated.filter(p => p !== 'view_all_firm_clients');
            }
            if (code === 'view_all_firm_clients' && updated.includes('view_assigned_clients_only')) {
              updated = updated.filter(p => p !== 'view_assigned_clients_only');
            }
            updated.push(code);
          }
        });
        return updated;
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await firmAdminStaffAPI.updateTaxPreparerPermissions(
        preparerId,
        selectedPermissions
      );

      if (response.success) {
        toast.success(response.message || 'Permissions updated successfully', {
          position: 'top-right',
          autoClose: 3000
        });
        onClose();
        // Refresh permissions
        fetchPermissions();
      } else {
        throw new Error(response.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg || 'Failed to update permissions', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setSaving(false);
    }
  };

  const getPermissionsByCategory = (category) => {
    const categoryCodes = PERMISSION_CATEGORIES[category]?.codes || [];
    return permissionChoices.filter(p => categoryCodes.includes(p.code));
  };

  const isCategoryAllSelected = (category) => {
    const categoryCodes = PERMISSION_CATEGORIES[category]?.codes || [];
    return categoryCodes.length > 0 && categoryCodes.every(code => selectedPermissions.includes(code));
  };

  const isCategorySomeSelected = (category) => {
    const categoryCodes = PERMISSION_CATEGORIES[category]?.codes || [];
    return categoryCodes.some(code => selectedPermissions.includes(code));
  };

  // Calculate summary
  const totalPermissions = permissionChoices.length;
  const allowedPermissions = selectedPermissions.length;
  const disallowedPermissions = totalPermissions - allowedPermissions;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl relative max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b-2 border-[#E8F0FF] p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-[#3AD6F2]/10 rounded-lg flex items-center justify-center">
                  <FiShield size={24} className="text-[#3AD6F2]" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                    Manage Permissions
                  </h4>
                  <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">
                    Customize access for individual tax preparer
                  </p>
                </div>
              </div>
              
              {/* User Info Card */}
              <div className="mt-4 bg-[rgb(243,247,255)] rounded-lg p-4 border border-[#E8F0FF]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#32B582]/10 rounded-lg flex items-center justify-center">
                    <FiUser size={18} className="text-[#32B582]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 font-[BasisGrotesquePro] text-lg">
                      {preparerName || 'Tax Preparer'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <FiMail size={14} className="text-gray-500" />
                      <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                        {preparerEmail}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors ml-4 flex-shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="bg-[rgb(243,247,255)] border-b border-[#E8F0FF] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#32B582] rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                  {allowedPermissions} Allowed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                  {disallowedPermissions} Disallowed
                </span>
              </div>
              <div className="text-sm text-gray-500 font-[BasisGrotesquePro]">
                {totalPermissions} Total Permissions
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#3AD6F2]/10 border border-[#3AD6F2]/30 rounded-lg">
              <FiInfo size={16} className="text-[#3AD6F2]" />
              <span className="text-xs text-[#3AD6F2] font-[BasisGrotesquePro] font-medium">
                Changes apply only to this preparer
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#32B582] border-t-transparent mb-4"></div>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Loading permissions...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(PERMISSION_CATEGORIES).map(([category, categoryData]) => {
                const categoryPermissions = getPermissionsByCategory(category);
                if (categoryPermissions.length === 0) return null;

                const allSelected = isCategoryAllSelected(category);
                const someSelected = isCategorySomeSelected(category);
                const categoryCodes = categoryData.codes;

                return (
                  <div 
                    key={category} 
                    className="bg-white border border-[#E8F0FF] rounded-lg p-5 hover:border-[#3AD6F2] transition-all shadow-sm"
                  >
                    {/* Category Header */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{categoryData.icon}</span>
                        <h5 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">
                          {category}
                        </h5>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-[BasisGrotesquePro]">
                          {categoryPermissions.length} {categoryPermissions.length === 1 ? 'permission' : 'permissions'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCategoryToggle(categoryCodes, allSelected)}
                        className={`px-4 py-1.5 rounded-lg font-[BasisGrotesquePro] text-sm font-medium transition-colors ${
                          allSelected
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                            : 'bg-[#3AD6F2]/10 text-[#3AD6F2] hover:bg-[#3AD6F2]/20 border border-[#3AD6F2]/30'
                        }`}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    {/* Permissions List */}
                    <div className="space-y-2">
                      {categoryPermissions.map((permission) => {
                        const isAllowed = selectedPermissions.includes(permission.code);
                        return (
                          <div
                            key={permission.code}
                            onClick={() => handlePermissionToggle(permission.code)}
                            className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all border ${
                              isAllowed
                                ? 'bg-[#32B582]/5 border-[#32B582] hover:bg-[#32B582]/10'
                                : 'bg-gray-50 border-[#E8F0FF] hover:bg-gray-100'
                            }`}
                          >
                            {/* Toggle Switch */}
                            <div className={`relative w-12 h-6 rounded-full transition-colors ${
                              isAllowed ? 'bg-[#32B582]' : 'bg-gray-300'
                            }`}>
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                                isAllowed ? 'translate-x-6' : 'translate-x-0'
                              }`}></div>
                            </div>

                            {/* Permission Label */}
                            <div className="flex-1">
                              <p className={`text-sm font-medium font-[BasisGrotesquePro] ${
                                isAllowed ? 'text-gray-900' : 'text-gray-600'
                              }`}>
                                {permission.label}
                              </p>
                            </div>

                            {/* Status Badge */}
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-[BasisGrotesquePro] text-xs font-semibold border ${
                              isAllowed
                                ? 'bg-[#32B582]/10 text-[#32B582] border-[#32B582]/30'
                                : 'bg-gray-100 text-gray-600 border-gray-300'
                            }`}>
                              {isAllowed ? (
                                <>
                                  <FiCheck size={14} />
                                  <span>Allowed</span>
                                </>
                              ) : (
                                <>
                                  <FiX size={14} />
                                  <span>Disallowed</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[rgb(243,247,255)] border-t border-[#E8F0FF] px-6 py-4 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2.5 border border-[#E8F0FF] bg-white text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 font-[BasisGrotesquePro]">
              <span className="font-semibold text-gray-900">{allowedPermissions}</span> of {totalPermissions} permissions allowed
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2.5 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55D1D] transition-colors font-[BasisGrotesquePro] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <FiCheck size={18} />
                  <span>Save Permissions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
