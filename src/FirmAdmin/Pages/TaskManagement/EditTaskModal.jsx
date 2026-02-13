import React, { useState, useEffect, useRef } from 'react';
import { firmAdminTasksAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { toast } from 'react-toastify';
import { FaTimes, FaChevronDown, FaChevronRight, FaFolder } from 'react-icons/fa';

const EditTaskModal = ({ isOpen, onClose, onTaskUpdated, task }) => {
    const [loading, setLoading] = useState(false);
    const [loadingTaxPreparers, setLoadingTaxPreparers] = useState(false);
    const [loadingClients, setLoadingClients] = useState(false);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [taxPreparers, setTaxPreparers] = useState([]);
    const [clients, setClients] = useState([]);
    const [folderTree, setFolderTree] = useState([]);
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const folderDropdownRef = useRef(null);
    const clientDropdownRef = useRef(null);
    const taxPreparerDropdownRef = useRef(null);

    const [formData, setFormData] = useState({
        task_type: 'client_onboarding',
        task_title: '',
        tax_preparer_id: '',
        client_ids: [],
        folder_id: '',
        due_date: '',
        priority: 'medium',
        description: ''
    });

    const [errors, setErrors] = useState({});
    const [showTaxPreparerDropdown, setShowTaxPreparerDropdown] = useState(false);
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [showFolderDropdown, setShowFolderDropdown] = useState(false);

    // Initialize form with task data when modal opens
    useEffect(() => {
        if (isOpen && task) {
            // Parse IDs from task object
            const preparerId = task.assignedTo?.id ? task.assignedTo.id.toString() : '';
            const clientIds = task.client_ids ? task.client_ids.map(id => id.toString()) : [];

            setFormData({
                task_type: task.task_type || 'client_onboarding',
                task_title: task.task || '',
                tax_preparer_id: preparerId,
                client_ids: clientIds,
                folder_id: task.folder_id ? task.folder_id.toString() : '',
                due_date: task.dueDateRaw || '', // Expecting YYYY-MM-DD
                priority: task.priority ? task.priority.toLowerCase() : 'medium',
                description: task.description || ''
            });

            fetchTaxPreparers();
            fetchClients();
            fetchRootFolders();
            setErrors({});
        }
    }, [isOpen, task]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (taxPreparerDropdownRef.current && !taxPreparerDropdownRef.current.contains(event.target)) {
                setShowTaxPreparerDropdown(false);
            }
            if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
                setShowClientDropdown(false);
            }
            if (folderDropdownRef.current && !folderDropdownRef.current.contains(event.target)) {
                setShowFolderDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch tax preparers
    const fetchTaxPreparers = async () => {
        try {
            setLoadingTaxPreparers(true);
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            const response = await fetchWithCors(`${API_BASE_URL}/user/firm-admin/staff/tax-preparers/?status=active&role=all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    const preparers = result.data.staff_members || [];
                    const filteredPreparers = preparers.filter(staff => {
                        const role = staff.role?.primary?.toLowerCase() || staff.role?.toLowerCase() || '';
                        const isActive = staff.status?.value === 'active' || staff.status?.is_active === true;
                        return isActive; // Simplified filter
                    });
                    setTaxPreparers(filteredPreparers);
                }
            }
        } catch (error) {
            console.error('Error fetching tax preparers:', error);
            toast.error('Failed to load tax preparers');
        } finally {
            setLoadingTaxPreparers(false);
        }
    };

    // Fetch clients
    const fetchClients = async () => {
        try {
            setLoadingClients(true);
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            const response = await fetchWithCors(`${API_BASE_URL}/firm/clients/list/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setClients(result.data.clients || []);
                }
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
            toast.error('Failed to load clients');
        } finally {
            setLoadingClients(false);
        }
    };

    // Fetch root folders
    const fetchRootFolders = async () => {
        try {
            setLoadingFolders(true);
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            const response = await fetchWithCors(`${API_BASE_URL}/firm/document-folders/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && result.data.folders) {
                    const activeFolders = result.data.folders.filter(folder => !folder.is_trashed);
                    const foldersTree = activeFolders.map(folder => ({
                        id: folder.id,
                        name: folder.title || folder.name,
                        children: [],
                        loaded: false,
                    }));
                    setFolderTree(foldersTree);
                }
            }
        } catch (error) {
            console.error('Error fetching folders:', error);
            toast.error('Failed to load folders');
        } finally {
            setLoadingFolders(false);
        }
    };

    // Validate form (Enforcement)
    const validateForm = () => {
        const newErrors = {};

        if (!formData.task_title.trim()) newErrors.task_title = 'Task title is required';
        if (!formData.due_date) newErrors.due_date = 'Due date is required';

        // Enforce folder for specific task types
        const folderRequiredTypes = ['document_collection', 'document_review', 'document_request', 'signature_request'];
        if (folderRequiredTypes.includes(formData.task_type) && !formData.folder_id) {
            newErrors.folder_id = 'Folder is required for this task type';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        try {
            setLoading(true);

            const taskData = {
                task_type: formData.task_type,
                task_title: formData.task_title.trim(),
                tax_preparer_id: formData.tax_preparer_id ? parseInt(formData.tax_preparer_id) : null,
                client_ids: formData.client_ids.map(id => parseInt(id)),
                folder_id: formData.folder_id ? parseInt(formData.folder_id) : null,
                due_date: formData.due_date,
                priority: formData.priority,
                description: formData.description.trim()
            };

            const response = await firmAdminTasksAPI.updateTask(task.id, taskData);

            if (response.success) {
                toast.success('Task updated successfully!');
                onTaskUpdated();
                onClose();
            } else {
                throw new Error(response.message || 'Failed to update task');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            const errorMessage = handleAPIError(error);
            toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to update task'));

            if (error.fieldErrors) {
                setErrors(error.fieldErrors);
            }
        } finally {
            setLoading(false);
        }
    };

    // Helper renderers
    const selectedTaxPreparer = taxPreparers.find(tp => tp.id === parseInt(formData.tax_preparer_id));
    const selectedTaxPreparerName = selectedTaxPreparer
        ? (selectedTaxPreparer.staff_member?.name || selectedTaxPreparer.email || 'Unknown')
        : 'Select Tax Preparer';

    if (!isOpen) return null;

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-4"
                style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{ borderColor: '#E8F0FF' }}>
                    <h4 className="mb-0" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 600, fontSize: '20px', color: '#3B4A66' }}>Edit Task</h4>
                    <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        <FaTimes color="#64748B" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit}>
                        {/* Task Type */}
                        <div className="mb-3">
                            <label className="form-label mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                                Task Type <span className="text-danger">*</span>
                            </label>
                            <select
                                className={`form-select form-select-sm ${errors.task_type ? 'is-invalid' : ''}`}
                                value={formData.task_type}
                                onChange={(e) => setFormData(prev => ({ ...prev, task_type: e.target.value }))}
                                style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
                            >
                                <option value="client_onboarding">Client Onboarding</option>
                                <option value="amendment_filing">Amendment Filing</option>
                                <option value="document_collection">Document Collection</option>
                                <option value="document_review">Document Review</option>
                                <option value="document_request">Document Request</option>
                                <option value="signature_request">Signature Request</option>
                                <option value="internal_review">Internal Review</option>
                                <option value="general_inquiry">General Inquiry</option>
                                <option value="compliance_check">Compliance Check</option>
                                <option value="payment_followup">Payment Follow-up</option>
                                <option value="meeting_scheduled">Meeting Scheduled</option>
                                <option value="missing_information">Missing Information</option>
                                <option value="tax_plan_analysis">Tax Plan Analysis</option>
                                <option value="final_review">Final Review</option>
                                <option value="archive_documents">Archive Documents</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Title */}
                        <div className="mb-3">
                            <label className="form-label mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                                Task Title <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className={`form-control form-control-sm ${errors.task_title ? 'is-invalid' : ''}`}
                                value={formData.task_title}
                                onChange={(e) => setFormData(prev => ({ ...prev, task_title: e.target.value }))}
                                style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
                            />
                            {errors.task_title && <div className="invalid-feedback">{errors.task_title}</div>}
                        </div>

                        {/* Description */}
                        <div className="mb-3">
                            <label className="form-label mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                                Description
                            </label>
                            <textarea
                                className={`form-control form-control-sm ${errors.description ? 'is-invalid' : ''}`}
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
                            />
                        </div>

                        {/* Priority & Due Date */}
                        <div className="row g-2 mb-3">
                            <div className="col-md-6">
                                <label className="form-label mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                                    Priority
                                </label>
                                <select
                                    className="form-select form-select-sm"
                                    value={formData.priority}
                                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                                    style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                                    Due Date <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="date"
                                    className={`form-control form-control-sm ${errors.due_date ? 'is-invalid' : ''}`}
                                    value={formData.due_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                                    style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
                                />
                                {errors.due_date && <div className="invalid-feedback">{errors.due_date}</div>}
                            </div>
                        </div>

                        {/* Tax Preparer */}
                        <div className="mb-3">
                            <label className="form-label mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                                Tax Preparer
                            </label>
                            <div className="position-relative" ref={taxPreparerDropdownRef}>
                                <button
                                    type="button"
                                    className={`form-select form-select-sm text-start`}
                                    onClick={() => setShowTaxPreparerDropdown(!showTaxPreparerDropdown)}
                                >
                                    {loadingTaxPreparers ? 'Loading...' : (formData.tax_preparer_id ? selectedTaxPreparerName : 'Select Tax Preparer')}
                                </button>
                                {showTaxPreparerDropdown && (
                                    <div className="position-absolute w-100 bg-white border rounded mt-1 shadow-lg" style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}>
                                        <div className="p-2 cursor-pointer border-bottom" onClick={() => {
                                            setFormData(prev => ({ ...prev, tax_preparer_id: '' }));
                                            setShowTaxPreparerDropdown(false);
                                        }}>Unassign / Self</div>
                                        {taxPreparers.map(tp => (
                                            <div key={tp.id} className="p-2 cursor-pointer hover-bg-light" onClick={() => {
                                                setFormData(prev => ({ ...prev, tax_preparer_id: tp.id.toString() }));
                                                setShowTaxPreparerDropdown(false);
                                            }}>
                                                {tp.staff_member?.name || tp.email}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Clients (Multi-select) */}
                        <div className="mb-3">
                            <label className="form-label mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                                Clients
                            </label>
                            <div className="position-relative" ref={clientDropdownRef}>
                                <button
                                    type="button"
                                    className={`form-select form-select-sm text-start`}
                                    onClick={() => setShowClientDropdown(!showClientDropdown)}
                                >
                                    {loadingClients ? 'Loading...' : (formData.client_ids.length > 0 ? `${formData.client_ids.length} Clients Selected` : 'Select Clients')}
                                </button>
                                {showClientDropdown && (
                                    <div className="position-absolute w-100 bg-white border rounded mt-1 shadow-lg" style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}>
                                        {clients.map(client => {
                                            const isSelected = formData.client_ids.includes(client.id.toString());
                                            return (
                                                <div key={client.id} className="p-2 cursor-pointer d-flex align-items-center gap-2" onClick={() => {
                                                    const newIds = isSelected
                                                        ? formData.client_ids.filter(id => id !== client.id.toString())
                                                        : [...formData.client_ids, client.id.toString()];
                                                    setFormData(prev => ({ ...prev, client_ids: newIds }));
                                                }}>
                                                    <input type="checkbox" checked={isSelected} readOnly />
                                                    {client.first_name} {client.last_name} ({client.email})
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <button
                                type="button"
                                className="btn btn-light"
                                onClick={onClose}
                                disabled={loading}
                                style={{ fontFamily: 'BasisGrotesquePro' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                                style={{ backgroundColor: '#F56D2D', borderColor: '#F56D2D', fontFamily: 'BasisGrotesquePro' }}
                            >
                                {loading ? 'Updating...' : 'Update Task'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditTaskModal;
