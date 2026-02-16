import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiX, FiPlus, FiTrash2, FiShield, FiCheck, FiMinus } from 'react-icons/fi';
import { firmAdminCustomRolesAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import ConfirmationModal from '../../../components/ConfirmationModal';

const PRIVILEGE_CATEGORIES = [
  { value: 'clients', label: 'Clients' },
  { value: 'staff', label: 'Staff' },
  { value: 'documents', label: 'Documents' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'reports', label: 'Reports' },
  { value: 'settings', label: 'Settings' },
  { value: 'billing', label: 'Billing' },
  { value: 'workflows', label: 'Workflows' },
  { value: 'communications', label: 'Communications' },
  { value: 'esignature', label: 'E-Signature / SignWell' }
];

const PRIVILEGE_ACTIONS = [
  { value: 'view', label: 'View' },
  { value: 'create', label: 'Create' },
  { value: 'edit', label: 'Edit' },
  { value: 'delete', label: 'Delete' },
  { value: 'assign', label: 'Assign' },
  { value: 'approve', label: 'Approve' },
  { value: 'export', label: 'Export' },
  { value: 'manage', label: 'Manage' }
];

// Common resource examples by category
const RESOURCE_EXAMPLES = {
  clients: [
    { value: 'all_clients', label: 'All Clients', description: 'Access to all clients in the firm' },
    { value: 'assigned_clients', label: 'Assigned Clients', description: 'Only clients assigned to this user' },
    { value: 'own_clients', label: 'Own Clients', description: 'Only clients owned by this user' }
  ],
  documents: [
    { value: 'all_documents', label: 'All Documents', description: 'Access to all documents' },
    { value: 'client_documents', label: 'Client Documents', description: 'Documents for assigned clients' },
    { value: 'firm_documents', label: 'Firm Documents', description: 'Firm-wide documents' }
  ],
  tasks: [
    { value: 'all_tasks', label: 'All Tasks', description: 'Access to all tasks' },
    { value: 'assigned_tasks', label: 'Assigned Tasks', description: 'Tasks assigned to this user' },
    { value: 'own_tasks', label: 'Own Tasks', description: 'Tasks created by this user' }
  ],
  reports: [
    { value: 'all_reports', label: 'All Reports', description: 'Access to all reports' },
    { value: 'generate_reports', label: 'Generate Reports', description: 'Can generate new reports' },
  ],
  settings: [
    { value: 'firm_settings', label: 'Firm Settings', description: 'Access to firm settings' },
    { value: 'user_settings', label: 'User Settings', description: 'Access to user settings' },
    { value: 'billing_settings', label: 'Billing Settings', description: 'Access to billing settings' }
  ],
  staff: [
    { value: 'all_staff', label: 'All Staff', description: 'View all staff members' },
    { value: 'manage_staff', label: 'Manage Staff', description: 'Manage staff members' },
    { value: 'view_staff', label: 'View Staff', description: 'View staff information' }
  ],
  billing: [
    { value: 'view_billing', label: 'View Billing', description: 'View billing information' },
    { value: 'manage_billing', label: 'Manage Billing', description: 'Manage billing' },
    { value: 'approve_payments', label: 'Approve Payments', description: 'Approve payment transactions' }
  ],
  workflows: [
    { value: 'all_workflows', label: 'All Workflows', description: 'Access to all workflows' },
    { value: 'create_workflows', label: 'Create Workflows', description: 'Create new workflows' },
    { value: 'manage_workflows', label: 'Manage Workflows', description: 'Manage existing workflows' }
  ],
  communications: [
    { value: 'all_communications', label: 'All Communications', description: 'Access to all communications' },
    { value: 'send_messages', label: 'Send Messages', description: 'Send messages to clients/staff' },
    { value: 'view_messages', label: 'View Messages', description: 'View messages' }
  ],
  esignature: [
    { value: 'extract_signature_fields', label: 'Extract Signature Fields', description: 'Use OCR to automatically detect signature fields in PDF documents' },
    { value: 'apply_signwell_signature', label: 'Apply SignWell Signature', description: 'Send documents to SignWell for electronic signing' },
    { value: 'view_signwell_documents', label: 'View SignWell Documents', description: 'View documents sent via SignWell' },
    { value: 'manage_signwell_documents', label: 'Manage SignWell Documents', description: 'Manage and track SignWell document status' },
    { value: 'check_document_status', label: 'Check Document Status', description: 'Check signing status of SignWell documents' },
    { value: 'create_signature_requests', label: 'Create Signature Requests', description: 'Create new e-signature requests for clients' },
    { value: 'manage_signature_requests', label: 'Manage Signature Requests', description: 'Manage existing signature requests' },
    { value: 'view_signature_history', label: 'View Signature History', description: 'View history of all signature requests and completions' }
  ]
};

export default function RolePrivilegesManager({ show, onClose, role, onUpdate }) {
  const [privileges, setPrivileges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    selectedActions: [],
    selectedResources: [],
    description: '',
    customResource: ''
  });
  const [selectedPrivileges, setSelectedPrivileges] = useState([]); // Preview of privileges to be added
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [privilegeToDelete, setPrivilegeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (show && role) {
      loadPrivileges();
    }
  }, [show, role]);

  const loadPrivileges = async () => {
    try {
      setLoading(true);
      const response = await firmAdminCustomRolesAPI.getRolePrivileges(role.id);
      if (response.success && response.data) {
        setPrivileges(response.data.privileges || []);
      }
    } catch (err) {
      console.error('Failed to load privileges', err);
      toast.error(handleAPIError(err), {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate privilege combinations from selected category, actions, and resources
  useEffect(() => {
    if (formData.category && formData.selectedActions.length > 0 && formData.selectedResources.length > 0) {
      const combinations = [];
      formData.selectedActions.forEach(action => {
        formData.selectedResources.forEach(resource => {
          const resourceInfo = getResourceSuggestions().find(r => r.value === resource);
          combinations.push({
            category: formData.category,
            action: action,
            resource: resource,
            description: formData.description || resourceInfo?.description || `${PRIVILEGE_ACTIONS.find(a => a.value === action)?.label} ${resourceInfo?.label || resource}`
          });
        });
      });
      setSelectedPrivileges(combinations);
    } else {
      setSelectedPrivileges([]);
    }
  }, [formData.category, formData.selectedActions, formData.selectedResources, formData.description]);

  const handleAddPrivileges = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.category) errors.category = 'Category is required';
    if (formData.selectedActions.length === 0) errors.actions = 'At least one action is required';
    if (formData.selectedResources.length === 0) errors.resources = 'At least one resource is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (selectedPrivileges.length === 0) {
      toast.error('Please select at least one privilege combination', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setSaving(true);

      // Prepare privileges array for bulk API
      const privilegesArray = selectedPrivileges.map(priv => ({
        category: priv.category,
        action: priv.action,
        resource: priv.resource,
        description: priv.description || ''
      }));

      // Use bulk API to add all privileges at once
      const response = await firmAdminCustomRolesAPI.addPrivileges(role.id, privilegesArray);

      if (response.success && response.data) {
        const { created_count = 0, skipped_count = 0, error_count = 0, skipped = [], errors = [] } = response.data;

        // Show detailed success message
        if (created_count > 0 && skipped_count === 0 && error_count === 0) {
          toast.success(response.message || `${created_count} privilege${created_count > 1 ? 's' : ''} added successfully!`, {
            position: "top-right",
            autoClose: 3000,
          });
        } else if (created_count > 0 && (skipped_count > 0 || error_count > 0)) {
          let message = `${created_count} privilege${created_count > 1 ? 's' : ''} added successfully`;
          if (skipped_count > 0) {
            message += `, ${skipped_count} skipped (already exist)`;
          }
          if (error_count > 0) {
            message += `, ${error_count} error${error_count > 1 ? 's' : ''}`;
          }
          toast.warning(message, {
            position: "top-right",
            autoClose: 5000,
          });

          // Log skipped and errors for debugging
          if (skipped.length > 0) {
            console.log('Skipped privileges (already exist):', skipped);
          }
          if (errors.length > 0) {
            console.error('Privilege errors:', errors);
          }
        } else {
          toast.error(response.message || 'Failed to add privileges', {
            position: "top-right",
            autoClose: 4000,
          });
        }

        await loadPrivileges();
        setShowAddModal(false);
        setFormData({ category: '', selectedActions: [], selectedResources: [], description: '', customResource: '' });
        setSelectedPrivileges([]);
        setFormErrors({});
        if (onUpdate) onUpdate();
      } else {
        toast.error(response.message || 'Failed to add privileges', {
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

  const toggleAction = (actionValue) => {
    setFormData(prev => {
      const newActions = prev.selectedActions.includes(actionValue)
        ? prev.selectedActions.filter(a => a !== actionValue)
        : [...prev.selectedActions, actionValue];
      return { ...prev, selectedActions: newActions };
    });
    if (formErrors.actions) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.actions;
        return newErrors;
      });
    }
  };

  const toggleResource = (resourceValue) => {
    setFormData(prev => {
      const newResources = prev.selectedResources.includes(resourceValue)
        ? prev.selectedResources.filter(r => r !== resourceValue)
        : [...prev.selectedResources, resourceValue];
      return { ...prev, selectedResources: newResources };
    });
    if (formErrors.resources) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.resources;
        return newErrors;
      });
    }
  };

  const removePrivilegeFromPreview = (index) => {
    setSelectedPrivileges(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteClick = (privilege) => {
    setPrivilegeToDelete(privilege);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePrivilege = async () => {
    if (!privilegeToDelete) return;

    try {
      setDeleting(true);
      const response = await firmAdminCustomRolesAPI.deletePrivilege(role.id, privilegeToDelete.id);

      if (response.success) {
        toast.success(response.message || 'Privilege deleted successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        await loadPrivileges();
        setShowDeleteConfirm(false);
        setPrivilegeToDelete(null);
        if (onUpdate) onUpdate();
      } else {
        toast.error(response.message || 'Failed to delete privilege', {
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
      setDeleting(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Clear selections when category changes
      if (name === 'category') {
        newData.selectedActions = [];
        newData.selectedResources = [];
        newData.customResource = '';
      }
      return newData;
    });
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const getResourceSuggestions = () => {
    if (!formData.category) return [];
    return RESOURCE_EXAMPLES[formData.category] || [];
  };

  // Group privileges by category
  const groupedPrivileges = privileges.reduce((acc, privilege) => {
    const category = privilege.category_display || privilege.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(privilege);
    return acc;
  }, {});

  if (!show) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 d-flex align-items-center justify-content-center z-[1070] p-3"
        onClick={onClose}
        style={{ zIndex: 1050 }}
      >
        <div
          className="bg-white rounded-lg shadow-xl w-100"
          style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="d-flex justify-content-between align-items-center p-4 border-bottom"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div>
              <h4
                className="mb-1"
                style={{
                  color: '#1F2A55',
                  fontSize: '20px',
                  fontWeight: '600',
                  fontFamily: 'BasisGrotesquePro'
                }}
              >
                Manage Privileges
              </h4>
              <p
                className="mb-0"
                style={{
                  color: '#6B7280',
                  fontSize: '14px',
                  fontFamily: 'BasisGrotesquePro'
                }}
              >
                {role?.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="border-0 bg-transparent p-0"
              style={{
                color: '#6B7280',
                cursor: 'pointer',
                fontSize: '24px',
                lineHeight: '1'
              }}
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {/* Add Privilege Button */}
            <div className="d-flex justify-content-between align-items-center mb-4 
            ">
              <h5
                style={{
                  color: '#1F2A55',
                  fontSize: '16px',
                  fontWeight: '600',
                  fontFamily: 'BasisGrotesquePro',
                  marginBottom: '0'
                }}
              >
                Privileges ({privileges.length})
              </h5>
              <button
                onClick={() => setShowAddModal(true)}
                className="d-flex align-items-center gap-2 px-3 py-2 border-0 rounded-lg"
                style={{
                  backgroundColor: '#32B582',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2A9D6F';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#32B582';
                }}
              >
                <FiPlus size={16} />
                Add Privilege
              </button>
            </div>

            {/* Privileges List */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" style={{ color: '#32B582' }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : privileges.length === 0 ? (
              <div className="text-center py-5">
                <FiShield size={48} color="#9CA3AF" style={{ marginBottom: '16px' }} />
                <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '0' }}>
                  No privileges assigned. Click "Add Privilege" to get started.
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-4">
                {Object.entries(groupedPrivileges).map(([category, categoryPrivileges]) => (
                  <div key={category}>
                    <h6
                      style={{
                        color: '#3B4A66',
                        fontSize: '14px',
                        fontWeight: '600',
                        fontFamily: 'BasisGrotesquePro',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {category}
                    </h6>
                    <div className="d-flex flex-column gap-2">
                      {categoryPrivileges.map((privilege) => (
                        <div
                          key={privilege.id}
                          className="d-flex justify-content-between align-items-start p-3 rounded-lg border"
                          style={{
                            borderColor: '#E8F0FF',
                            backgroundColor: '#FAFBFC'
                          }}
                        >
                          <div className="d-flex align-items-start gap-2 flex-grow-1">
                            <FiCheck
                              size={16}
                              color="#32B582"
                              style={{ marginTop: '2px', flexShrink: 0 }}
                            />
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <span
                                  style={{
                                    color: '#1F2A55',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    fontFamily: 'BasisGrotesquePro'
                                  }}
                                >
                                  {privilege.action_display || privilege.action}
                                </span>
                                <span
                                  style={{
                                    color: '#6B7280',
                                    fontSize: '13px',
                                    fontFamily: 'BasisGrotesquePro'
                                  }}
                                >
                                  {privilege.resource}
                                </span>
                              </div>
                              {privilege.description && (
                                <p
                                  className="mb-0"
                                  style={{
                                    color: '#6B7280',
                                    fontSize: '12px',
                                    fontFamily: 'BasisGrotesquePro'
                                  }}
                                >
                                  {privilege.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteClick(privilege)}
                            className="px-2 py-1 border-0 rounded"
                            style={{
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FECACA';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#FEE2E2';
                            }}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Privilege Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 d-flex align-items-center justify-content-center z-[1070] p-3"
          onClick={() => !saving && setShowAddModal(false)}
          style={{ zIndex: 1060 }}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-100"
            style={{ maxWidth: '700px', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="d-flex justify-content-between align-items-center p-4 border-bottom"
              style={{ borderColor: '#E5E7EB' }}
            >
              <h5
                className="mb-0"
                style={{
                  color: '#1F2A55',
                  fontSize: '18px',
                  fontWeight: '600',
                  fontFamily: 'BasisGrotesquePro'
                }}
              >
                Add Privileges
              </h5>
              <button
                onClick={() => !saving && setShowAddModal(false)}
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

            <form onSubmit={handleAddPrivileges}>
              <div className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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
                    Category <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    disabled={saving}
                    className="w-100 px-3 py-2 rounded-lg border"
                    style={{
                      borderColor: formErrors.category ? '#DC2626' : '#E8F0FF',
                      fontSize: '14px',
                      fontFamily: 'BasisGrotesquePro',
                      color: '#1F2A55'
                    }}
                  >
                    <option value="">Select Category</option>
                    {PRIVILEGE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p className="mt-1 mb-0" style={{ color: '#DC2626', fontSize: '12px' }}>
                      {formErrors.category}
                    </p>
                  )}
                </div>

                {formData.category && (
                  <>
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
                        Actions <span style={{ color: '#DC2626' }}>*</span>
                        <span className="ml-2" style={{ color: '#6B7280', fontSize: '12px', fontWeight: '400' }}>
                          (Select multiple)
                        </span>
                      </label>
                      <div className="border rounded-lg p-3" style={{ borderColor: formErrors.actions ? '#DC2626' : '#E8F0FF', maxHeight: '200px', overflowY: 'auto' }}>
                        {PRIVILEGE_ACTIONS.map(act => (
                          <label
                            key={act.value}
                            className="d-flex align-items-center gap-2 mb-2 cursor-pointer"
                            style={{ fontFamily: 'BasisGrotesquePro' }}
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedActions.includes(act.value)}
                              onChange={() => toggleAction(act.value)}
                              disabled={saving}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ color: '#1F2A55', fontSize: '14px' }}>{act.label}</span>
                          </label>
                        ))}
                      </div>
                      {formErrors.actions && (
                        <p className="mt-1 mb-0" style={{ color: '#DC2626', fontSize: '12px' }}>
                          {formErrors.actions}
                        </p>
                      )}
                      {formData.selectedActions.length > 0 && (
                        <p className="mt-2 mb-0" style={{ color: '#6B7280', fontSize: '12px' }}>
                          {formData.selectedActions.length} action{formData.selectedActions.length > 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>

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
                        Resources <span style={{ color: '#DC2626' }}>*</span>
                        <span className="ml-2" style={{ color: '#6B7280', fontSize: '12px', fontWeight: '400' }}>
                          (Select multiple)
                        </span>
                      </label>
                      {getResourceSuggestions().length > 0 ? (
                        <>
                          <div className="border rounded-lg p-3" style={{ borderColor: formErrors.resources ? '#DC2626' : '#E8F0FF', maxHeight: '200px', overflowY: 'auto' }}>
                            {getResourceSuggestions().map(resource => (
                              <label
                                key={resource.value}
                                className="d-flex align-items-start gap-2 mb-2 cursor-pointer"
                                style={{ fontFamily: 'BasisGrotesquePro' }}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.selectedResources.includes(resource.value)}
                                  onChange={() => toggleResource(resource.value)}
                                  disabled={saving}
                                  style={{ cursor: 'pointer', marginTop: '2px' }}
                                />
                                <div className="flex-grow-1">
                                  <span style={{ color: '#1F2A55', fontSize: '14px', fontWeight: '500' }}>
                                    {resource.label}
                                  </span>
                                  <span className="ml-2" style={{ color: '#6B7280', fontSize: '12px' }}>
                                    ({resource.value})
                                  </span>
                                  {resource.description && (
                                    <p className="mb-0 mt-1" style={{ color: '#6B7280', fontSize: '12px' }}>
                                      {resource.description}
                                    </p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                          <div className="mt-2">
                            <div className="d-flex gap-2">
                              <input
                                type="text"
                                placeholder="Or enter custom resource name..."
                                value={formData.customResource || ''}
                                onChange={(e) => {
                                  setFormData(prev => ({ ...prev, customResource: e.target.value }));
                                }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const customResource = e.target.value.trim();
                                    if (customResource && !formData.selectedResources.includes(customResource)) {
                                      setFormData(prev => ({
                                        ...prev,
                                        selectedResources: [...prev.selectedResources, customResource],
                                        customResource: ''
                                      }));
                                    } else if (customResource && formData.selectedResources.includes(customResource)) {
                                      toast.info('This resource is already selected', {
                                        position: "top-right",
                                        autoClose: 2000,
                                      });
                                    }
                                  }
                                }}
                                className="flex-grow-1 px-3 py-2 rounded-lg border"
                                style={{
                                  borderColor: '#E8F0FF',
                                  fontSize: '14px',
                                  fontFamily: 'BasisGrotesquePro',
                                  color: '#1F2A55'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const customResource = formData.customResource?.trim();
                                  if (customResource && !formData.selectedResources.includes(customResource)) {
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedResources: [...prev.selectedResources, customResource],
                                      customResource: ''
                                    }));
                                  } else if (customResource && formData.selectedResources.includes(customResource)) {
                                    toast.info('This resource is already selected', {
                                      position: "top-right",
                                      autoClose: 2000,
                                    });
                                  }
                                }}
                                disabled={saving || !formData.customResource?.trim()}
                                className="px-3 py-2 border-0 rounded-lg"
                                style={{
                                  backgroundColor: formData.customResource?.trim() ? '#32B582' : '#E5E7EB',
                                  color: 'white',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: formData.customResource?.trim() ? 'pointer' : 'not-allowed',
                                  fontFamily: 'BasisGrotesquePro'
                                }}
                              >
                                <FiPlus size={16} />
                              </button>
                            </div>
                            <p className="mt-1 mb-0" style={{ color: '#6B7280', fontSize: '11px' }}>
                              Enter custom resource name and press Enter or click + to add
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="d-flex gap-2">
                            <input
                              type="text"
                              placeholder="Enter resource name (e.g., all_clients)"
                              value={formData.customResource || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, customResource: e.target.value }))}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const customResource = e.target.value.trim();
                                  if (customResource && !formData.selectedResources.includes(customResource)) {
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedResources: [...prev.selectedResources, customResource],
                                      customResource: ''
                                    }));
                                  } else if (customResource && formData.selectedResources.includes(customResource)) {
                                    toast.info('This resource is already selected', {
                                      position: "top-right",
                                      autoClose: 2000,
                                    });
                                  }
                                }
                              }}
                              disabled={saving}
                              className="flex-grow-1 px-3 py-2 rounded-lg border"
                              style={{
                                borderColor: formErrors.resources ? '#DC2626' : '#E8F0FF',
                                fontSize: '14px',
                                fontFamily: 'BasisGrotesquePro',
                                color: '#1F2A55'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const customResource = formData.customResource?.trim();
                                if (customResource && !formData.selectedResources.includes(customResource)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedResources: [...prev.selectedResources, customResource],
                                    customResource: ''
                                  }));
                                } else if (customResource && formData.selectedResources.includes(customResource)) {
                                  toast.info('This resource is already selected', {
                                    position: "top-right",
                                    autoClose: 2000,
                                  });
                                }
                              }}
                              disabled={saving || !formData.customResource?.trim()}
                              className="px-3 py-2 border-0 rounded-lg"
                              style={{
                                backgroundColor: formData.customResource?.trim() ? '#32B582' : '#E5E7EB',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: formData.customResource?.trim() ? 'pointer' : 'not-allowed',
                                fontFamily: 'BasisGrotesquePro'
                              }}
                            >
                              <FiPlus size={16} />
                            </button>
                          </div>
                          <p className="mt-1 mb-0" style={{ color: '#6B7280', fontSize: '11px' }}>
                            Enter custom resource name and press Enter or click + to add
                          </p>
                        </>
                      )}
                      {formErrors.resources && (
                        <p className="mt-1 mb-0" style={{ color: '#DC2626', fontSize: '12px' }}>
                          {formErrors.resources}
                        </p>
                      )}
                      {formData.selectedResources.length > 0 && (
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          {formData.selectedResources.map(resource => (
                            <span
                              key={resource}
                              className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded"
                              style={{
                                backgroundColor: '#E8F0FF',
                                color: '#3B4A66',
                                fontSize: '12px',
                                fontFamily: 'BasisGrotesquePro'
                              }}
                            >
                              {resource}
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedResources: prev.selectedResources.filter(r => r !== resource)
                                  }));
                                }}
                                className="border-0 bg-transparent p-0"
                                style={{ cursor: 'pointer', color: '#DC2626' }}
                              >
                                <FiX size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

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
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleFormChange}
                        disabled={saving}
                        className="w-100 px-3 py-2 rounded-lg border"
                        style={{
                          borderColor: '#E8F0FF',
                          fontSize: '14px',
                          fontFamily: 'BasisGrotesquePro',
                          color: '#1F2A55'
                        }}
                        placeholder="Optional description for all privileges"
                      />
                      <p className="mt-1 mb-0" style={{ color: '#6B7280', fontSize: '12px' }}>
                        This description will be applied to all selected privilege combinations
                      </p>
                    </div>

                    {/* Preview of Selected Privileges */}
                    {selectedPrivileges.length > 0 && (
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
                          Preview: {selectedPrivileges.length} Privilege{selectedPrivileges.length > 1 ? 's' : ''} to be Added
                        </label>
                        <div className="border rounded-lg p-3" style={{ borderColor: '#E8F0FF', backgroundColor: '#FAFBFC', maxHeight: '250px', overflowY: 'auto' }}>
                          {selectedPrivileges.map((priv, index) => (
                            <div
                              key={index}
                              className="d-flex justify-content-between align-items-start mb-2 p-2 rounded"
                              style={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E5E7EB'
                              }}
                            >
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <FiCheck size={14} color="#32B582" />
                                  <span style={{ color: '#1F2A55', fontSize: '13px', fontWeight: '500', fontFamily: 'BasisGrotesquePro' }}>
                                    {PRIVILEGE_ACTIONS.find(a => a.value === priv.action)?.label || priv.action}
                                  </span>
                                  <span style={{ color: '#6B7280', fontSize: '13px', fontFamily: 'BasisGrotesquePro' }}>
                                    {priv.resource}
                                  </span>
                                </div>
                                {priv.description && (
                                  <p className="mb-0" style={{ color: '#6B7280', fontSize: '12px', fontFamily: 'BasisGrotesquePro' }}>
                                    {priv.description}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removePrivilegeFromPreview(index)}
                                className="border-0 bg-transparent p-0"
                                style={{ cursor: 'pointer', color: '#DC2626' }}
                                disabled={saving}
                              >
                                <FiX size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div
                className="d-flex justify-content-end gap-3 p-4 border-top"
                style={{ borderColor: '#E5E7EB' }}
              >
                <button
                  type="button"
                  onClick={() => !saving && setShowAddModal(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg border-0"
                  style={{
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: 'BasisGrotesquePro',
                    cursor: saving ? 'not-allowed' : 'pointer'
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
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? `Adding ${selectedPrivileges.length} Privilege${selectedPrivileges.length > 1 ? 's' : ''}...` : `Add ${selectedPrivileges.length > 0 ? selectedPrivileges.length + ' ' : ''}Privilege${selectedPrivileges.length > 1 ? 's' : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          if (!deleting) {
            setShowDeleteConfirm(false);
            setPrivilegeToDelete(null);
          }
        }}
        onConfirm={confirmDeletePrivilege}
        title="Delete Privilege"
        message={
          privilegeToDelete
            ? `Are you sure you want to delete this privilege? This action cannot be undone.`
            : "Are you sure you want to delete this privilege?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleting}
        isDestructive={true}
      />
    </>
  );
}

