import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { firmAdminCustomRolesAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';

export default function AssignRoleToStaff({ userId, currentRole, onRoleAssigned }) {
  const [customRoles, setCustomRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(currentRole?.custom_role?.id || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCustomRoles();
    if (currentRole?.custom_role?.id) {
      setSelectedRoleId(currentRole.custom_role.id);
    }
  }, [currentRole]);

  const loadCustomRoles = async () => {
    try {
      setLoading(true);
      const response = await firmAdminCustomRolesAPI.getCustomRoles();
      if (response.success && response.data) {
        setCustomRoles(response.data.roles || []);
      }
    } catch (err) {
      console.error('Failed to load custom roles', err);
      toast.error(handleAPIError(err), {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    try {
      setSaving(true);
      const response = await firmAdminCustomRolesAPI.assignCustomRoleToStaff(
        userId,
        selectedRoleId
      );

      if (response.success) {
        toast.success(response.message || 'Custom role assigned successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        if (onRoleAssigned) {
          onRoleAssigned(response.data);
        }
      } else {
        toast.error(response.message || 'Failed to assign custom role', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      toast.error(handleAPIError(err), {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-3">
        <div className="spinner-border spinner-border-sm" style={{ color: '#32B582' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'BasisGrotesquePro' }}>
      <h6
        style={{
          color: '#1F2A55',
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '12px',
          fontFamily: 'BasisGrotesquePro'
        }}
      >
        Assign Custom Role
      </h6>
      <div className="mb-3">
        <label
          className="d-block mb-2"
          style={{
            color: '#3B4A66',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'BasisGrotesquePro'
          }}
        >
          Select Role:
        </label>
        <select
          value={selectedRoleId || ''}
          onChange={(e) => setSelectedRoleId(e.target.value ? parseInt(e.target.value) : null)}
          disabled={saving}
          className="w-100 px-3 py-2 rounded-lg border"
          style={{
            borderColor: '#E8F0FF',
            fontSize: '14px',
            fontFamily: 'BasisGrotesquePro',
            color: '#1F2A55'
          }}
        >
          <option value="">None (Use Standard Role)</option>
          {customRoles
            .filter(role => role.is_active)
            .map(role => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
        </select>
        {customRoles.filter(role => role.is_active).length === 0 && (
          <p className="mt-2 mb-0" style={{ color: '#6B7280', fontSize: '12px' }}>
            No active custom roles available. Create one in Custom Roles Management.
          </p>
        )}
      </div>
      <button
        onClick={handleAssignRole}
        disabled={saving}
        className="w-100 px-4 py-2 rounded-lg border-0"
        style={{
          backgroundColor: saving ? '#9CA3AF' : '#32B582',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          fontFamily: 'BasisGrotesquePro',
          cursor: saving ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!saving) e.currentTarget.style.backgroundColor = '#2A9D6F';
        }}
        onMouseLeave={(e) => {
          if (!saving) e.currentTarget.style.backgroundColor = '#32B582';
        }}
      >
        {saving ? 'Saving...' : 'Assign Role'}
      </button>
    </div>
  );
}

