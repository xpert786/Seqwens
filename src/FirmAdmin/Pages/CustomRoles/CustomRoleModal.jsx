import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

export default function CustomRoleModal({ show, onClose, onSave, role = null }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        is_active: role.is_active !== undefined ? role.is_active : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
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

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
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
        await onSave(formData.name.trim(), formData.description.trim(), formData.is_active);
      } else {
        await onSave(formData.name.trim(), formData.description.trim());
      }
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 d-flex align-items-center justify-content-center z-50 p-3"
      onClick={onClose}
      style={{ zIndex: 1050 }}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-100"
        style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="d-flex justify-content-between align-items-center p-4 border-bottom"
          style={{ borderColor: '#E5E7EB' }}
        >
          <h4
            className="mb-0"
            style={{
              color: '#1F2A55',
              fontSize: '20px',
              fontWeight: '600',
              fontFamily: 'BasisGrotesquePro'
            }}
          >
            {role ? 'Edit Custom Role' : 'Create Custom Role'}
          </h4>
          <button
            onClick={onClose}
            disabled={saving}
            className="border-0 bg-transparent p-0"
            style={{
              color: '#6B7280',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '24px',
              lineHeight: '1'
            }}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            {/* Role Name */}
            <div className="mb-4">
              <label
                className="d-block mb-2"
                style={{
                  color: '#3B4A66',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: 'BasisGrotesquePro'
                }}
              >
                Role Name <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={saving}
                className="w-100 px-3 py-2 rounded-lg border"
                style={{
                  borderColor: errors.name ? '#DC2626' : '#E8F0FF',
                  fontSize: '14px',
                  fontFamily: 'BasisGrotesquePro',
                  color: '#1F2A55'
                }}
                placeholder="e.g., Senior Tax Preparer"
              />
              {errors.name && (
                <p className="mt-1 mb-0" style={{ color: '#DC2626', fontSize: '12px' }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="mb-4">
              <label
                className="d-block mb-2"
                style={{
                  color: '#3B4A66',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: 'BasisGrotesquePro'
                }}
              >
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={saving}
                rows={4}
                className="w-100 px-3 py-2 rounded-lg border"
                style={{
                  borderColor: '#E8F0FF',
                  fontSize: '14px',
                  fontFamily: 'BasisGrotesquePro',
                  color: '#1F2A55',
                  resize: 'vertical'
                }}
                placeholder="Describe the role and its responsibilities..."
              />
            </div>

            {/* Active Status (only for edit) */}
            {role && (
              <div className="mb-4">
                <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    disabled={saving}
                    style={{ cursor: 'pointer' }}
                  />
                  <span
                    style={{
                      color: '#3B4A66',
                      fontSize: '14px',
                      fontWeight: '500',
                      fontFamily: 'BasisGrotesquePro'
                    }}
                  >
                    Active
                  </span>
                </label>
                <p
                  className="mt-1 mb-0"
                  style={{ color: '#6B7280', fontSize: '12px' }}
                >
                  Inactive roles cannot be assigned to new users
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="d-flex justify-content-end gap-3 p-4 border-top"
            style={{ borderColor: '#E5E7EB' }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg border-0"
              style={{
                backgroundColor: '#F3F4F6',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'BasisGrotesquePro',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.backgroundColor = '#E5E7EB';
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.backgroundColor = '#F3F4F6';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg border-0"
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
              {saving ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

