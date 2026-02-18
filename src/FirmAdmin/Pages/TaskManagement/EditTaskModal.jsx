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
    const [selectedFile, setSelectedFile] = useState(null);
    const [spouseSign, setSpouseSign] = useState(false);

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
                task_type: task.taskType || 'client_onboarding',
                task_title: task.task || '',
                tax_preparer_id: preparerId,
                client_ids: clientIds,
                folder_id: task.folder_id ? task.folder_id.toString() : '',
                due_date: task.dueDateRaw || '', // Expecting YYYY-MM-DD
                priority: task.priority ? task.priority.toLowerCase() : 'medium',
                description: task.description || ''
            });

            setSpouseSign(task.spouse_sign || false);

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

            // Use FormData to support file uploads
            const data = new FormData();
            data.append('task_type', formData.task_type);
            data.append('task_title', formData.task_title.trim());
            data.append('due_date', formData.due_date);
            data.append('priority', formData.priority);
            data.append('description', formData.description.trim());

            if (formData.tax_preparer_id) {
                data.append('tax_preparer_id', formData.tax_preparer_id);
            }

            if (formData.folder_id) {
                data.append('folder_id', formData.folder_id);
            }

            formData.client_ids.forEach(id => {
                data.append('client_ids', id);
            });

            if (formData.task_type === 'signature_request') {
                data.append('spouse_sign', spouseSign);
            }

            if (selectedFile) {
                data.append('files', selectedFile);
            }

            const response = await firmAdminTasksAPI.updateTask(task.id, data);

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
        : (task.assignedTo?.id?.toString() === formData.tax_preparer_id ? task.assignedTo.name : 'Select Tax Preparer');

    const anyClientHasSpouse = formData.client_ids.some(clientId => {
        // Find in the full fetched list
        const client = clients.find(c => c.id.toString() === clientId.toString());
        if (client) return client.has_spouse;

        // Find in the task's initial clients list (if not found in the full list yet)
        const taskClient = task?.clients?.find(c => c.id.toString() === clientId.toString());
        return taskClient?.has_spouse;
    });

    if (!isOpen) return null;

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-4 shadow-xl"
                style={{ width: '95%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: 'none' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                    <div className="d-flex align-items-center gap-2">
                        <div className="bg-orange-100 p-2 rounded-lg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="#F56D2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h4 className="mb-0" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 700, fontSize: '20px', color: '#1E293B' }}>Edit Task</h4>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover-bg-light border-0 bg-transparent transition-colors">
                        <FaTimes color="#64748B" size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="row g-4">
                        {/* Left Column */}
                        <div className="col-md-7">
                            <div className="mb-4">
                                <label className="form-label text-uppercase tracking-wider opacity-60 mb-2" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 700, fontSize: '11px', color: '#475569' }}>
                                    Task Information
                                </label>

                                <div className="mb-3">
                                    <label className="form-label small font-semibold mb-1" style={{ color: '#64748B' }}>Task Title *</label>
                                    <input
                                        type="text"
                                        className={`form-control border-slate-200 py-2 ${errors.task_title ? 'is-invalid' : ''}`}
                                        value={formData.task_title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, task_title: e.target.value }))}
                                        placeholder="E.g., Review Tax Documents"
                                        style={{ fontSize: '14px', borderRadius: '10px' }}
                                    />
                                    {errors.task_title && <div className="invalid-feedback">{errors.task_title}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small font-semibold mb-1" style={{ color: '#64748B' }}>Description</label>
                                    <textarea
                                        className="form-control border-slate-200"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={4}
                                        placeholder="Describe the task details..."
                                        style={{ fontSize: '14px', borderRadius: '10px' }}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label text-uppercase tracking-wider opacity-60 mb-2" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 700, fontSize: '11px', color: '#475569' }}>
                                    Attachments
                                </label>
                                <div className="bg-slate-50 p-4 rounded-3 border border-slate-100 mb-4">
                                    <div className="mb-3">
                                        <label className="form-label small font-semibold mb-2" style={{ color: '#64748B' }}>
                                            {task.files && task.files.length > 0 ? 'Add/Replace Document (Optional)' : 'Upload Document'}
                                        </label>
                                        <div className="d-flex flex-column gap-3">
                                            {task.files && task.files.length > 0 && (
                                                <div className="d-flex flex-column gap-2">
                                                    {task.files.map((file, idx) => (
                                                        <div key={idx} className="d-flex align-items-center gap-2 p-2 bg-white rounded border border-slate-100">
                                                            <div className="bg-orange-50 p-2 rounded">
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#F56D2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="small mb-0 text-truncate font-medium">{file.file_name || 'Document'}</p>
                                                                <a href={file.file} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none" style={{ fontSize: '11px' }}>
                                                                    View Current
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="position-relative">
                                                <input
                                                    type="file"
                                                    className="form-control form-control-sm border-slate-200"
                                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                                    style={{ borderRadius: '10px' }}
                                                />
                                                {selectedFile && (
                                                    <div className="mt-1 small text-success d-flex align-items-center gap-1">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                        New file selected
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                                                {formData.task_type === 'signature_request'
                                                    ? 'Uploading a new PDF will replace the current document and reset any existing signatures.'
                                                    : 'Upload a file to attach to this task.'}
                                            </p>
                                        </div>
                                    </div>

                                    {formData.task_type === 'signature_request' && anyClientHasSpouse && (
                                        <div className="form-check form-switch pt-2">
                                            <input
                                                className="form-check-input shadow-none"
                                                type="checkbox"
                                                role="switch"
                                                id="spouseSignSwitch"
                                                checked={spouseSign}
                                                onChange={(e) => setSpouseSign(e.target.checked)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <label className="form-check-label small font-semibold cursor-pointer ms-2" htmlFor="spouseSignSwitch" style={{ color: '#334155' }}>
                                                Require Spouse Signature
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="col-md-5">
                            <label className="form-label text-uppercase tracking-wider opacity-60 mb-2" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 700, fontSize: '11px', color: '#475569' }}>
                                Task Config
                            </label>

                            <div className="mb-3">
                                <label className="form-label small font-semibold mb-1" style={{ color: '#64748B' }}>Task Type</label>
                                <select
                                    className="form-select border-slate-200 py-2 bg-slate-50 opacity-75"
                                    value={formData.task_type}
                                    disabled
                                    style={{ fontSize: '14px', borderRadius: '10px', cursor: 'not-allowed' }}
                                >
                                    <option value="client_onboarding">Client Onboarding</option>
                                    <option value="amendment_filing">Amendment Filing</option>
                                    <option value="document_collection">Document Collection</option>
                                    <option value="document_review">Document Review</option>
                                    <option value="document_request">Document Request</option>
                                    <option value="signature_request">Signature Request</option>
                                    <option value="internal_review">Internal Review</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="row g-2 mb-3">
                                <div className="col-6">
                                    <label className="form-label small font-semibold mb-1" style={{ color: '#64748B' }}>Priority</label>
                                    <select
                                        className="form-select border-slate-200 py-2 text-capitalize"
                                        value={formData.priority}
                                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                                        style={{ fontSize: '13px', borderRadius: '10px' }}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div className="col-6">
                                    <label className="form-label small font-semibold mb-1" style={{ color: '#64748B' }}>Due Date *</label>
                                    <input
                                        type="date"
                                        className={`form-control border-slate-200 py-2 ${errors.due_date ? 'is-invalid' : ''}`}
                                        value={formData.due_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                                        style={{ fontSize: '13px', borderRadius: '10px' }}
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small font-semibold mb-1" style={{ color: '#64748B' }}>Assign To</label>
                                <div className="position-relative" ref={taxPreparerDropdownRef}>
                                    <button
                                        type="button"
                                        className="form-select border-slate-200 py-2 text-start font-medium"
                                        onClick={() => setShowTaxPreparerDropdown(!showTaxPreparerDropdown)}
                                        style={{ fontSize: '14px', borderRadius: '10px' }}
                                    >
                                        {loadingTaxPreparers ? '...' : (formData.tax_preparer_id ? selectedTaxPreparerName : 'Unassigned')}
                                    </button>
                                    {showTaxPreparerDropdown && (
                                        <div className="position-absolute w-100 bg-white border border-slate-100 rounded-3 mt-1 shadow-xl z-3 p-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            <div className="p-2 cursor-pointer rounded hover-bg-light border-bottom mb-1" onClick={() => {
                                                setFormData(prev => ({ ...prev, tax_preparer_id: '' }));
                                                setShowTaxPreparerDropdown(false);
                                            }}>Unassign</div>
                                            {taxPreparers.map(tp => (
                                                <div key={tp.id} className="p-2 cursor-pointer rounded hover-bg-light flex items-center gap-2" onClick={() => {
                                                    setFormData(prev => ({ ...prev, tax_preparer_id: tp.id.toString() }));
                                                    setShowTaxPreparerDropdown(false);
                                                }}>
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                                                        {(tp.staff_member?.name || tp.email).charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="truncate flex-1">{tp.staff_member?.name || tp.email}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label small font-semibold mb-1" style={{ color: '#64748B' }}>Clients</label>
                                <div className="position-relative" ref={clientDropdownRef}>
                                    <button
                                        type="button"
                                        className="form-select border-slate-200 py-2 text-start font-medium"
                                        onClick={() => setShowClientDropdown(!showClientDropdown)}
                                        style={{ fontSize: '14px', borderRadius: '10px' }}
                                    >
                                        {loadingClients ? '...' : (formData.client_ids.length > 0 ? `${formData.client_ids.length} Selected` : 'Select')}
                                    </button>
                                    {showClientDropdown && (
                                        <div className="position-absolute w-100 bg-white border border-slate-100 rounded-3 mt-1 shadow-xl z-3 p-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            <div className="p-2 sticky-top bg-white border-bottom small font-bold text-slate-400">SELECT CLIENTS</div>
                                            {clients.map(client => {
                                                const isSelected = formData.client_ids.includes(client.id.toString());
                                                return (
                                                    <div key={client.id} className="p-2 cursor-pointer d-flex align-items-center gap-2 rounded hover-bg-light" onClick={() => {
                                                        const newIds = isSelected
                                                            ? formData.client_ids.filter(id => id !== client.id.toString())
                                                            : [...formData.client_ids, client.id.toString()];
                                                        setFormData(prev => ({ ...prev, client_ids: newIds }));
                                                    }}>
                                                        <input type="checkbox" className="form-check-input m-0 shadow-none border-slate-300" checked={isSelected} readOnly />
                                                        <span className="truncate small font-medium">{client.first_name} {client.last_name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="col-12 d-flex justify-content-end gap-3 pt-4 border-top">
                            <button
                                type="button"
                                className="btn border-0 text-slate-500 font-bold px-4 hover-bg-slate-50"
                                onClick={onClose}
                                disabled={loading}
                                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary px-5 py-2 fw-bold text-white border-0"
                                disabled={loading}
                                style={{ backgroundColor: '#F56D2D', fontFamily: 'BasisGrotesquePro', borderRadius: '10px', boxShadow: '0 4px 12px rgba(245, 109, 45, 0.25)' }}
                            >
                                {loading ? 'Updating...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .hover-bg-light:hover {
                    background-color: #F8FAFC !important;
                }
                .hover-bg-slate-50:hover {
                    background-color: #F8FAFC !important;
                }
            `}</style>
        </div>
    );
};

export default EditTaskModal;
