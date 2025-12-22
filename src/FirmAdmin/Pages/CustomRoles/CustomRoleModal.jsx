import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

// Permission categories mapping - same as Tax Preparer Permissions
const PERMISSION_CATEGORIES = {
  'Client Access': [
    'view_assigned_clients_only',
    'view_all_firm_clients'
  ],
  'Client Management': [
    'create_clients',
    'edit_client_data'
  ],
  'Document Management': [
    'upload_documents',
    'download_documents',
    'delete_documents'
  ],
  'Returns & Filing': [
    'view_returns'
  ],
  'E-Signatures': [
    'initiate_esignature',
    'track_esignature'
  ],
  'Communication': [
    'send_messages',
    'receive_messages'
  ],
  'Billing': [
    'create_invoices'
  ],
  'Reports & Analytics': [
    'access_analytics',
    'export_reports'
  ],
  'Team Management': [
    'manage_team'
  ]
};

// All available permissions with labels
const ALL_PERMISSIONS = [
  { code: 'view_assigned_clients_only', label: 'View assigned clients only' },
  { code: 'view_all_firm_clients', label: 'View all firm clients' },
  { code: 'create_clients', label: 'Create new clients' },
  { code: 'edit_client_data', label: 'Edit client personal and tax data' },
  { code: 'upload_documents', label: 'Upload client documents' },
  { code: 'download_documents', label: 'Download client documents' },
  { code: 'delete_documents', label: 'Delete client documents' },
  { code: 'view_returns', label: 'View completed returns and filing status' },
  { code: 'initiate_esignature', label: 'Initiate e-signature requests' },
  { code: 'track_esignature', label: 'Track e-signature requests' },
  { code: 'send_messages', label: 'Send client communications (messages)' },
  { code: 'receive_messages', label: 'Receive client communications (messages)' },
  { code: 'create_invoices', label: 'Create invoices' },
  { code: 'access_analytics', label: 'Access reporting and analytics' },
  { code: 'export_reports', label: 'Export client or firm reports' },
  { code: 'manage_team', label: 'Invite, deactivate, or manage other team members' }
];

export default function CustomRoleModal({ show, onClose, onSave, role = null }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role) {
      // Handle both old format (permission_groups) and new format (permissions)
      const permissions = role.permissions || [];
      setFormData({
        name: role.name || '',
        description: role.description || '',
        permissions: permissions,
        is_active: role.is_active !== undefined ? role.is_active : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: [],
        is_active: true
      });
    }
    setErrors({});
  }, [role, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePermissionToggle = (code) => {
    setFormData(prev => {
      let newPermissions = [...prev.permissions];
      
      // Handle mutual exclusivity for view permissions
      if (code === 'view_assigned_clients_only') {
        if (newPermissions.includes('view_all_firm_clients')) {
          newPermissions = newPermissions.filter(p => p !== 'view_all_firm_clients');
        }
        if (newPermissions.includes(code)) {
          newPermissions = newPermissions.filter(p => p !== code);
        } else {
          newPermissions.push(code);
        }
      } else if (code === 'view_all_firm_clients') {
        if (newPermissions.includes('view_assigned_clients_only')) {
          newPermissions = newPermissions.filter(p => p !== 'view_assigned_clients_only');
        }
        if (newPermissions.includes(code)) {
          newPermissions = newPermissions.filter(p => p !== code);
        } else {
          newPermissions.push(code);
        }
      } else {
        // Regular toggle
        if (newPermissions.includes(code)) {
          newPermissions = newPermissions.filter(p => p !== code);
        } else {
          newPermissions.push(code);
        }
      }
      
      return { ...prev, permissions: newPermissions };
    });
    
    // Clear permissions error
    if (errors.permissions) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.permissions;
        return newErrors;
      });
    }
  };

  const handleCategoryToggle = (categoryPermissions, allSelected) => {
    if (allSelected) {
      // Deselect all in category
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !categoryPermissions.includes(p))
      }));
    } else {
      // Select all in category (handle mutual exclusivity)
      setFormData(prev => {
        let updated = [...prev.permissions];
        categoryPermissions.forEach(code => {
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
        return { ...prev, permissions: updated };
      });
    }
  };

  const getPermissionsByCategory = (category) => {
    const categoryCodes = PERMISSION_CATEGORIES[category] || [];
    return ALL_PERMISSIONS.filter(p => categoryCodes.includes(p.code));
  };

  const isCategoryAllSelected = (category) => {
    const categoryCodes = PERMISSION_CATEGORIES[category] || [];
    return categoryCodes.length > 0 && categoryCodes.every(code => formData.permissions.includes(code));
  };

  const isCategorySomeSelected = (category) => {
    const categoryCodes = PERMISSION_CATEGORIES[category] || [];
    return categoryCodes.some(code => formData.permissions.includes(code));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    }
    if (formData.name.trim().length > 100) {
      newErrors.name = 'Role name must be 100 characters or less';
    }
    if (formData.permissions.length === 0) {
      newErrors.permissions = 'At least one permission is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      if (role) {
        await onSave(formData.name.trim(), formData.description.trim(), formData.permissions, formData.is_active);
      } else {
        await onSave(formData.name.trim(), formData.description.trim(), formData.permissions);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-4xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-[#E8F0FF]">
          <div>
            <h4 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
              {role ? 'Edit Custom Role' : 'Create Custom Role'}
            </h4>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
              Configure role permissions for staff members
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-50"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {/* Role Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={saving}
                className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm disabled:bg-gray-100"
                style={{
                  borderColor: errors.name ? '#DC2626' : '#E8F0FF'
                }}
                placeholder="e.g., Senior Tax Preparer"
                maxLength={100}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.name ? (
                  <p className="text-red-600 text-xs font-[BasisGrotesquePro]">{errors.name}</p>
                ) : (
                  <div></div>
                )}
                <p className="text-gray-500 text-xs font-[BasisGrotesquePro]">
                  {formData.name.length}/100
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={saving}
                rows={3}
                className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm disabled:bg-gray-100 resize-vertical"
                placeholder="Describe the role and its responsibilities..."
              />
            </div>

            {/* Permissions */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3 font-[BasisGrotesquePro]">
                Permissions <span className="text-red-500">*</span>
              </label>
              <div
                className="p-4 rounded-lg border"
                style={{
                  borderColor: errors.permissions ? '#DC2626' : '#E8F0FF',
                  backgroundColor: '#FAFBFC'
                }}
              >
                <div className="space-y-4">
                  {Object.keys(PERMISSION_CATEGORIES).map((category) => {
                    const categoryPermissions = getPermissionsByCategory(category);
                    if (categoryPermissions.length === 0) return null;

                    const allSelected = isCategoryAllSelected(category);
                    const someSelected = isCategorySomeSelected(category);

                    return (
                      <div key={category} className="border border-[#E8F0FF] rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro]">
                            {category}
                          </h5>
                          <button
                            type="button"
                            onClick={() => handleCategoryToggle(
                              PERMISSION_CATEGORIES[category],
                              allSelected
                            )}
                            disabled={saving}
                            className="text-sm text-[#3AD6F2] hover:text-[#2BC5E0] font-[BasisGrotesquePro] font-medium disabled:opacity-50"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="space-y-2">
                          {categoryPermissions.map((permission) => (
                            <label
                              key={permission.code}
                              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(permission.code)}
                                onChange={() => handlePermissionToggle(permission.code)}
                                disabled={saving}
                                className="w-4 h-4 text-[#3AD6F2] border-gray-300 rounded focus:ring-[#3AD6F2] disabled:opacity-50"
                              />
                              <span className="text-sm text-gray-700 font-[BasisGrotesquePro] flex-1">
                                {permission.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {errors.permissions && (
                <p className="mt-2 text-red-600 text-xs font-[BasisGrotesquePro]">
                  {errors.permissions}
                </p>
              )}
              <p className="mt-2 text-gray-600 text-xs font-[BasisGrotesquePro]">
                Select permissions to grant to users with this role. "View assigned clients only" and "View all firm clients" are mutually exclusive.
              </p>
            </div>

            {/* Active Status (only for edit) */}
            {role && (
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    disabled={saving}
                    className="w-4 h-4 text-[#3AD6F2] border-gray-300 rounded focus:ring-[#3AD6F2] disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                    Active
                  </span>
                </label>
                <p className="mt-1 text-gray-600 text-xs font-[BasisGrotesquePro]">
                  Inactive roles cannot be assigned to new users
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-[#E8F0FF]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-[#E8F0FF] bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#32B582] text-white rounded-lg hover:bg-[#2A9D6F] transition-colors font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                role ? 'Update Role' : 'Create Role'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
