import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiShield, FiUsers } from 'react-icons/fi';
import { firmAdminCustomRolesAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import CustomRoleModal from './CustomRoleModal';
import ConfirmationModal from '../../../components/ConfirmationModal';

export default function CustomRolesManagement() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);

  useEffect(() => {
    loadRoles();
  }, [includeInactive]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await firmAdminCustomRolesAPI.getCustomRoles(includeInactive);

      if (response.success && response.data) {
        setRoles(response.data.roles || []);
      } else {
        setError(response.message || 'Failed to load custom roles');
      }
    } catch (err) {
      console.error('Error loading custom roles:', err);
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

  const handleCreateRole = async (name, description, permission_groups) => {
    try {
      const response = await firmAdminCustomRolesAPI.createCustomRole(name, description, permission_groups);
      if (response.success) {
        toast.success(response.message || 'Custom role created successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        await loadRoles();
        setShowCreateModal(false);
      } else {
        toast.error(response.message || 'Failed to create custom role', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleUpdateRole = async (roleId, name, description, permission_groups, isActive) => {
    try {
      const response = await firmAdminCustomRolesAPI.updateCustomRole(roleId, {
        name,
        description,
        permission_groups,
        is_active: isActive
      });
      if (response.success) {
        toast.success(response.message || 'Custom role updated successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        await loadRoles();
        setEditingRole(null);
      } else {
        toast.error(response.message || 'Failed to update custom role', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleDeleteClick = (role) => {
    setRoleToDelete(role);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      setDeleting(true);
      const response = await firmAdminCustomRolesAPI.deleteCustomRole(roleToDelete.id);

      if (response.success) {
        toast.success(response.message || 'Custom role deleted successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        await loadRoles();
        setShowDeleteConfirm(false);
        setRoleToDelete(null);
      } else {
        toast.error(response.message || 'Failed to delete custom role', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setDeleting(false);
    }
  };


  const handleEditRole = (role) => {
    setEditingRole(role);
  };

  // Calculate summary statistics
  const summary = {
    total_roles: roles.length,
    active_roles: roles.filter(r => r.is_active).length,
    total_privileges: roles.reduce((sum, r) => sum + (r.privileges_count || 0), 0),
    total_assigned_users: roles.reduce((sum, r) => sum + (r.assigned_users_count || 0), 0)
  };

  if (loading && roles.length === 0) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#32B582]"></div>
          <p className="mt-3 text-sm text-gray-600 font-[BasisGrotesquePro]">
            Loading custom roles...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6" style={{ fontFamily: "BasisGrotesquePro" }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-[#1F2A55] mb-2 font-[BasisGrotesquePro]">
              Custom Roles Management
            </h3>
            <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
              Create and manage custom roles with specific permission sets for your staff
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#32B582] text-white rounded-lg hover:bg-[#2A9D6F] transition-colors font-[BasisGrotesquePro] text-sm font-medium"
          >
            <FiPlus size={18} />
            Create Custom Role
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <div className="bg-white rounded-lg border border-[#E8F0FF] p-4 sm:p-6">
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Total Roles</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
              {loading ? '...' : summary.total_roles}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Custom roles created</p>
          </div>

          <div className="bg-white rounded-lg border border-[#E8F0FF] p-4 sm:p-6">
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Active Roles</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
              {loading ? '...' : summary.active_roles}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Currently active</p>
          </div>

          <div className="bg-white rounded-lg border border-[#E8F0FF] p-4 sm:p-6">
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Total Privileges</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
              {loading ? '...' : summary.total_privileges}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Across all roles</p>
          </div>

          <div className="bg-white rounded-lg border border-[#E8F0FF] p-4 sm:p-6">
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Assigned Users</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
              {loading ? '...' : summary.total_assigned_users}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Staff with custom roles</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-[BasisGrotesquePro]">
          {error}
        </div>
      )}

      {/* Filter Toggle */}
      <div className="mb-6 flex items-center gap-2">
        <input
          type="checkbox"
          id="includeInactive"
          checked={includeInactive}
          onChange={(e) => setIncludeInactive(e.target.checked)}
          className="w-4 h-4 text-[#32B582] border-gray-300 rounded focus:ring-[#32B582] cursor-pointer"
        />
        <label htmlFor="includeInactive" className="text-sm text-[#6B7280] font-[BasisGrotesquePro] cursor-pointer">
          Include inactive roles
        </label>
      </div>

      {/* Roles List */}
      <div>
        <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">
          Custom Roles
        </h6>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">
          Manage custom roles and their permission sets
        </p>

        {loading && roles.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#32B582]"></div>
            <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading custom roles...</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="bg-white border border-[#E8F0FF] rounded-lg p-8 sm:p-12 text-center">
            <FiShield size={48} color="#9CA3AF" className="mx-auto mb-4" />
            <h5 className="text-lg font-semibold text-[#3B4A66] mb-2 font-[BasisGrotesquePro]">
              No Custom Roles Found
            </h5>
            <p className="text-sm text-[#6B7280] mb-6 font-[BasisGrotesquePro]">
              Get started by creating your first custom role
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#32B582] text-white rounded-lg hover:bg-[#2A9D6F] transition-colors font-[BasisGrotesquePro] text-sm font-medium"
            >
              Create Custom Role
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`bg-white border rounded-lg p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
                  role.is_active ? 'border-[#E8F0FF]' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-grow-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FiShield
                        size={20}
                        color={role.is_active ? "#32B582" : "#9CA3AF"}
                      />
                      <h5 className={`text-base sm:text-lg font-semibold mb-0 font-[BasisGrotesquePro] ${
                        role.is_active ? 'text-[#1F2A55]' : 'text-[#6B7280]'
                      }`}>
                        {role.name}
                      </h5>
                      {!role.is_active && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full font-[BasisGrotesquePro]">
                          Inactive
                        </span>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-sm text-[#6B7280] mb-3 font-[BasisGrotesquePro]">
                        {role.description}
                      </p>
                    )}
                    {/* Permission Groups Display */}
                    {role.permission_groups && role.permission_groups.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {role.permission_groups_display ? (
                            role.permission_groups_display.map((group, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full font-[BasisGrotesquePro]"
                              >
                                {group}
                              </span>
                            ))
                          ) : (
                            role.permission_groups.map((group, idx) => {
                              const groupLabels = {
                                'client': 'Client',
                                'todo': 'Todo',
                                'appointment': 'Appointment',
                                'document': 'Document',
                                'esign': 'E-Sign',
                                'messages': 'Messages',
                                'full_control': 'Full Control'
                              };
                              return (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full font-[BasisGrotesquePro]"
                                >
                                  {groupLabels[group] || group}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <div className="flex items-center gap-2">
                        <FiUsers size={14} color="#6B7280" />
                        <span className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                          {role.assigned_users_count || 0} {role.assigned_users_count === 1 ? 'user' : 'users'}
                        </span>
                      </div>
                      {role.created_by && (
                        <span className="text-xs text-[#9CA3AF] font-[BasisGrotesquePro]">
                          Created by {role.created_by}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => handleEditRole(role)}
                      className="flex items-center gap-1 px-3 py-2 bg-white border border-[#3B4A66] text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm font-medium"
                    >
                      <FiEdit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(role)}
                      className="flex items-center gap-1 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-[BasisGrotesquePro] text-sm font-medium"
                    >
                      <FiTrash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <CustomRoleModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateRole}
        />
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <CustomRoleModal
          show={!!editingRole}
          onClose={() => setEditingRole(null)}
          onSave={(name, description, permission_groups, isActive) => handleUpdateRole(editingRole.id, name, description, permission_groups, isActive)}
          role={editingRole}
        />
      )}


      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          if (!deleting) {
            setShowDeleteConfirm(false);
            setRoleToDelete(null);
          }
        }}
        onConfirm={confirmDeleteRole}
        title="Delete Custom Role"
        message={
          roleToDelete
            ? `Are you sure you want to delete the "${roleToDelete.name}" role? This action cannot be undone.`
            : "Are you sure you want to delete this role? This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleting}
        isDestructive={true}
      />
    </div>
  );
}

