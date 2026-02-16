import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiX, FiUser, FiMail, FiShield, FiInfo, FiUsers, FiFileText, FiBarChart2, FiEdit3, FiMessageSquare, FiDollarSign, FiPieChart, FiGrid, FiList } from 'react-icons/fi';
import { firmAdminStaffAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';

// Permission categories mapping with icons
const PERMISSION_CATEGORIES = {
  'Client Access': {
    codes: ['view_assigned_clients_only', 'view_all_firm_clients', 'view_unlinked_taxpayers'],
    icon: <FiUser className="w-5 h-5 text-[#3AD6F2]" />,
    color: 'blue'
  },
  'Client Management': {
    codes: ['create_clients', 'edit_client_data'],
    icon: <FiUsers className="w-5 h-5 text-[#32B582]" />,
    color: 'green'
  },
  'Document Management': {
    codes: ['upload_documents', 'download_documents', 'delete_documents'],
    icon: <FiFileText className="w-5 h-5 text-[#3AD6F2]" />,
    color: 'purple'
  },
  'Returns & Filing': {
    codes: ['view_returns'],
    icon: <FiBarChart2 className="w-5 h-5 text-[#F56D2D]" />,
    color: 'orange'
  },
  'E-Signatures': {
    codes: ['initiate_esignature', 'track_esignature'],
    icon: <FiEdit3 className="w-5 h-5 text-[#32B582]" />,
    color: 'indigo'
  },
  'Communication': {
    codes: ['send_messages', 'receive_messages'],
    icon: <FiMessageSquare className="w-5 h-5 text-[#3AD6F2]" />,
    color: 'pink'
  },
  'Billing': {
    codes: ['create_invoices'],
    icon: <FiDollarSign className="w-5 h-5 text-[#F56D2D]" />,
    color: 'yellow'
  },
  'Task Management': {
    codes: ['assign_tasks_to_assigned_taxpayers', 'assign_tasks_to_unassigned_taxpayers'],
    icon: <FiGrid className="w-5 h-5 text-[#3AD6F2]" />,
    color: 'cyan'
  },
  'Reporting & Team': {
    codes: ['manage_team'],
    icon: <FiPieChart className="w-5 h-5 text-[#F56D2D]" />,
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
  const [userInfo, setUserInfo] = useState({ name: null, email: null });

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
        // Handle new API response structure
        const permissionsList = response.data.permissions || [];
        const choicesList = response.data.permission_choices || [];

        // Debug: Check if task management permissions are in the response
        const taskPermissions = choicesList.filter(p => {
          const code = typeof p === 'string' ? p : p.code;
          return code === 'assign_tasks_to_assigned_taxpayers' || code === 'assign_tasks_to_unassigned_taxpayers';
        });
        if (taskPermissions.length > 0) {
          console.log('Task Management permissions found:', taskPermissions);
        } else {
          console.warn('Task Management permissions NOT found in permission_choices');
          console.log('Available permission codes:', choicesList.map(p => typeof p === 'string' ? p : p.code));
        }

        // Filter out any permissions that are no longer valid choices
        const validCodes = choicesList.map(p => typeof p === 'string' ? p : p.code);
        const filteredPermissions = permissionsList.filter(p => validCodes.includes(p));

        setPermissions(filteredPermissions);
        setPermissionChoices(choicesList);
        setSelectedPermissions(filteredPermissions);

        // Update user info from API response if available
        if (response.data.user_name || response.data.user_email) {
          setUserInfo({
            name: response.data.user_name || preparerName,
            email: response.data.user_email || preparerEmail
          });
        } else {
          setUserInfo({
            name: preparerName,
            email: preparerEmail
          });
        }
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
  }, [preparerId, preparerName, preparerEmail]);

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
    // Handle both old format (strings) and new format (objects with code and label)
    return permissionChoices.filter(p => {
      const code = typeof p === 'string' ? p : p.code;
      return categoryCodes.includes(code);
    });
  };

  // Get permission label - handle both formats
  const getPermissionLabel = (permission) => {
    if (typeof permission === 'string') {
      // Old format - find label from permissionChoices
      const choice = permissionChoices.find(p => p.code === permission);
      return choice?.label || permission;
    }
    return permission.label || permission.code;
  };

  // Get permission code - handle both formats
  const getPermissionCode = (permission) => {
    return typeof permission === 'string' ? permission : permission.code;
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1070] p-4"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {/* Header */}
        <div className="bg-white border-b-2 border-[#E8F0FF] p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <FiShield className="text-[#3AD6F2] w-5 h-5" />
                  <h4 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                    Manage Permissions
                  </h4>
                </div>
                <p className="text-xs text-gray-600 font-[BasisGrotesquePro] mt-1 ml-7">
                  Customize access for individual tax preparer
                </p>
              </div>

              {/* User Info Card */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <FiUser className="text-[#32B582] w-5 h-5 flex-shrink-0" />
                  <p className="font-semibold text-gray-900 font-[BasisGrotesquePro] text-base m-0">
                    {userInfo.name || preparerName || 'Tax Preparer'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <FiMail className="text-gray-500 w-5 h-5 flex-shrink-0" />
                  <p className="text-sm text-gray-600 font-[BasisGrotesquePro] m-0">
                    {userInfo.email || preparerEmail}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center !rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors ml-4 flex-shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="bg-white border-b border-[#E8F0FF] px-6 py-3">
          <div className="flex items-center justify-between flex-nowrap">
            <div className="flex items-center gap-3 whitespace-nowrap overflow-hidden">
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
            <div className="flex items-center gap-2 px-3 py-1 bg-[#3AD6F2] rounded-full whitespace-nowrap flex-shrink-0">
              <FiInfo size={14} className="text-white" />
              <span className="text-xs text-white font-[BasisGrotesquePro] font-medium">
                Changes apply only to this preparer
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#32B582] border-t-transparent mb-4"></div>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Loading permissions...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Categorized Permissions */}
              {Object.entries(PERMISSION_CATEGORIES).map(([category, categoryData]) => {
                const categoryPermissions = getPermissionsByCategory(category);
                // Don't hide empty categories - they might have permissions that aren't loaded yet
                // But we'll still filter them out to keep UI clean
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
                        <div className="flex-shrink-0 flex items-center text-gray-500">
                          {React.isValidElement(categoryData.icon) ?
                            React.cloneElement(categoryData.icon, { className: "w-5 h-5" }) :
                            categoryData.icon}
                        </div>
                        <h5 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro] m-0 leading-none">
                          {category}
                        </h5>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-[BasisGrotesquePro] flex-shrink-0">
                          {categoryPermissions.length} {categoryPermissions.length === 1 ? 'permission' : 'permissions'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCategoryToggle(categoryCodes, allSelected)}
                        className={`px-4 py-1.5 !rounded-lg font-[BasisGrotesquePro] text-sm font-medium
    hover:bg-[inherit] hover:text-[inherit] active:bg-[inherit] active:text-[inherit]
    !text-white`}
                        style={{
                          backgroundColor: allSelected ? '#9CA3AF' : '#3AD6F2', // gray-400 or primary
                          border: allSelected
                            ? '1px solid #9CA3AF'
                            : '1px solid rgba(58,214,242,0.4)',
                          transition: 'none'
                        }}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>

                    </div>

                    {/* Permissions List */}
                    <div className="space-y-2">
                      {categoryPermissions.map((permission) => {
                        const permissionCode = getPermissionCode(permission);
                        const permissionLabel = getPermissionLabel(permission);
                        const isAllowed = selectedPermissions.includes(permissionCode);
                        return (
                          <div
                            key={permissionCode}
                            onClick={() => handlePermissionToggle(permissionCode)}
                            className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all border ${isAllowed
                              ? 'bg-[#32B582]/5 border-[#32B582] hover:bg-[#32B582]/10'
                              : 'bg-gray-50 border-[#E8F0FF] hover:bg-gray-100'
                              }`}
                          >
                            {/* Toggle Switch */}
                            <div className={`relative w-12 h-6 rounded-full transition-colors ${isAllowed ? 'bg-[#32B582]' : 'bg-gray-300'
                              }`}>
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${isAllowed ? 'translate-x-6' : 'translate-x-0'
                                }`}></div>
                            </div>

                            {/* Permission Label */}
                            <div className="flex-1">
                              <p className={`text-sm font-medium font-[BasisGrotesquePro] ${isAllowed ? 'text-gray-900' : 'text-gray-600'
                                }`}>
                                {permissionLabel}
                              </p>
                            </div>

                            {/* Status Badge */}
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-[BasisGrotesquePro] text-xs font-semibold border ${isAllowed
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

              {/* Uncategorized Permissions (if any) */}
              {(() => {
                const allCategorizedCodes = Object.values(PERMISSION_CATEGORIES).flatMap(cat => cat.codes);
                const uncategorizedPermissions = permissionChoices.filter(p => {
                  const code = getPermissionCode(p);
                  return !allCategorizedCodes.includes(code);
                });

                if (uncategorizedPermissions.length === 0) return null;

                return (
                  <div className="bg-white border border-[#E8F0FF] rounded-lg p-5 hover:border-[#3AD6F2] transition-all shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <FiList className="text-gray-500 w-5 h-5 flex-shrink-0" />
                        <h5 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro] m-0 leading-none">
                          Other Permissions
                        </h5>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-[BasisGrotesquePro] flex-shrink-0">
                          {uncategorizedPermissions.length} {uncategorizedPermissions.length === 1 ? 'permission' : 'permissions'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {uncategorizedPermissions.map((permission) => {
                        const permissionCode = getPermissionCode(permission);
                        const permissionLabel = getPermissionLabel(permission);
                        const isAllowed = selectedPermissions.includes(permissionCode);
                        return (
                          <div
                            key={permissionCode}
                            onClick={() => handlePermissionToggle(permissionCode)}
                            className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all border ${isAllowed
                              ? 'bg-[#32B582]/5 border-[#32B582] hover:bg-[#32B582]/10'
                              : 'bg-gray-50 border-[#E8F0FF] hover:bg-gray-100'
                              }`}
                          >
                            <div className={`relative w-12 h-6 rounded-full transition-colors ${isAllowed ? 'bg-[#32B582]' : 'bg-gray-300'
                              }`}>
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${isAllowed ? 'translate-x-6' : 'translate-x-0'
                                }`}></div>
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium font-[BasisGrotesquePro] ${isAllowed ? 'text-gray-900' : 'text-gray-600'
                                }`}>
                                {permissionLabel}
                              </p>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-[BasisGrotesquePro] text-xs font-semibold border ${isAllowed
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
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-[#E8F0FF] px-6 py-4 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2.5 border border-[#E8F0FF] bg-white text-gray-700 !rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="px-6 py-2.5 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55D1D] transition-colors font-[BasisGrotesquePro] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
