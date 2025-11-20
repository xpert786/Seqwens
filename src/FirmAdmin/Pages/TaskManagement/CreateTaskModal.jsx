import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { firmAdminTasksAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { toast } from 'react-toastify';
import { FaTimes, FaChevronDown, FaChevronRight, FaFolder, FaFileUpload } from 'react-icons/fa';

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated }) => {
  const [loading, setLoading] = useState(false);
  const [loadingTaxPreparers, setLoadingTaxPreparers] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [taxPreparers, setTaxPreparers] = useState([]);
  const [clients, setClients] = useState([]);
  const [folderTree, setFolderTree] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedFiles, setSelectedFiles] = useState([]);
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
    description: '',
    estimated_hours: ''
  });

  const [errors, setErrors] = useState({});
  const [showTaxPreparerDropdown, setShowTaxPreparerDropdown] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchTaxPreparers();
      fetchClients();
      fetchRootFolders();
    }
  }, [isOpen]);

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

  const resetForm = () => {
    setFormData({
      task_type: 'client_onboarding',
      task_title: '',
      tax_preparer_id: '',
      client_ids: [],
      folder_id: '',
      due_date: '',
      priority: 'medium',
      description: '',
      estimated_hours: ''
    });
    setSelectedFiles([]);
    setErrors({});
    setExpandedFolders(new Set());
  };

  // Fetch tax preparers
  const fetchTaxPreparers = async () => {
    try {
      setLoadingTaxPreparers(true);
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      // Try the tax preparers specific endpoint first
      const response = await fetchWithCors(`${API_BASE_URL}/user/firm-admin/staff/tax-preparers/?status=active&role=all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Tax preparers API response:', result);
        if (result.success && result.data) {
          const preparers = result.data.staff_members || [];
          // Filter for active tax preparers with valid roles
          const filteredPreparers = preparers.filter(staff => {
            const rolePrimary = staff.role?.primary?.toLowerCase() || '';
            const roleType = staff.role?.role_type?.toLowerCase() || '';
            const role = rolePrimary || roleType || staff.role?.toLowerCase() || staff.user_role?.toLowerCase() || '';
            const isActive = staff.status?.value === 'active' || staff.status?.is_active === true || staff.is_active === true;
            const validRoles = ['staff', 'accountant', 'bookkeeper', 'assistant', 'tax_preparer'];
            // Check if role matches or role_type is tax_preparer
            const isValidRole = validRoles.includes(role) || roleType === 'tax_preparer';
            return isActive && isValidRole;
          });
          console.log('Filtered tax preparers:', filteredPreparers);
          setTaxPreparers(filteredPreparers);
        } else {
          console.error('API response not successful:', result);
          toast.error(result.message || 'Failed to load tax preparers');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching tax preparers:', error);
      const errorMessage = error.message || 'Failed to load tax preparers';
      toast.error(errorMessage);
      setTaxPreparers([]);
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

  // Fetch root folders (firm folders)
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
          // Filter out trashed folders
          const activeFolders = result.data.folders.filter(folder => !folder.is_trashed);
          const foldersTree = activeFolders.map(folder => ({
            id: folder.id,
            name: folder.title || folder.name,
            title: folder.title || folder.name,
            full_path: folder.full_path || folder.title || folder.name,
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

  // Fetch subfolders (not needed for firm folders as they're flat, but keeping for future use)
  const fetchSubfolders = async (folderId) => {
    // Firm folders API returns flat structure, so subfolders are not needed
    // This function is kept for potential future use with nested folders
    return [];
  };

  // Toggle folder expansion
  const toggleExpand = async (folder) => {
    const isExpanded = expandedFolders.has(folder.id);
    const newExpanded = new Set(expandedFolders);

    if (isExpanded) {
      newExpanded.delete(folder.id);
    } else {
      newExpanded.add(folder.id);
      if (!folder.loaded && folder.id) {
        const subfolders = await fetchSubfolders(folder.id);
        updateFolderTree(folder.id, subfolders);
      }
    }
    setExpandedFolders(newExpanded);
  };

  // Update folder tree with subfolders
  const updateFolderTree = (folderId, subfolders) => {
    const updateTree = (tree) => {
      return tree.map(folder => {
        if (folder.id === folderId) {
          return { ...folder, children: subfolders, loaded: true };
        }
        if (folder.children && folder.children.length > 0) {
          return { ...folder, children: updateTree(folder.children) };
        }
        return folder;
      });
    };
    setFolderTree(updateTree(folderTree));
  };

  // Render folder tree
  const renderFolderTree = (folders, level = 0) => {
    return folders.map((folder) => {
      const isExpanded = expandedFolders.has(folder.id);
      const hasChildren = folder.children && folder.children.length > 0;

      return (
        <div key={folder.id} style={{ paddingLeft: `${level * 16}px` }}>
          <div
            className="d-flex align-items-center gap-2 p-2 cursor-pointer hover-bg-light"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setFormData(prev => ({ ...prev, folder_id: folder.id }));
              setShowFolderDropdown(false);
              if (errors.folder_id) {
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.folder_id;
                  return newErrors;
                });
              }
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {hasChildren || !folder.loaded ? (
              <span onClick={(e) => { e.stopPropagation(); toggleExpand(folder); }} style={{ cursor: 'pointer' }}>
                {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
              </span>
            ) : (
              <span style={{ width: '12px' }} />
            )}
            <FaFolder style={{ color: '#F59E0B' }} />
            <span>{folder.name}</span>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderFolderTree(folder.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['.pdf', '.xlsx', '.xls', '.docx', '.jpg', '.jpeg', '.png'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

      if (file.size > maxSize) {
        toast.error(`File ${file.name} exceeds 10MB limit`);
        return false;
      }
      if (!allowedTypes.includes(fileExtension)) {
        toast.error(`File ${file.name} has invalid type. Allowed: PDF, Excel, Word, Images`);
        return false;
      }
      return true;
    });

    if (validFiles.length + selectedFiles.length > 20) {
      toast.error('Maximum 20 files allowed');
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  // Remove file
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.task_title.trim()) newErrors.task_title = 'Task title is required';
    if (!formData.tax_preparer_id) newErrors.tax_preparer_id = 'Tax preparer is required';
    if (!formData.client_ids || formData.client_ids.length === 0) newErrors.client_ids = 'At least one client is required';
    if (!formData.folder_id) newErrors.folder_id = 'Folder is required';
    if (!formData.due_date) newErrors.due_date = 'Due date is required';
    else {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate <= today) {
        newErrors.due_date = 'Due date must be in the future';
      }
    }
    // Description is optional according to API, but we'll keep it as required for UX
    // Description is optional according to API

    // Files are optional for all task types, no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Form submitted, validating...');
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      console.log('Creating task with data:', {
        task_type: formData.task_type,
        task_title: formData.task_title,
        tax_preparer_id: formData.tax_preparer_id,
        client_ids: formData.client_ids,
        folder_id: formData.folder_id,
        due_date: formData.due_date,
        files_count: selectedFiles.length
      });

      const taskData = {
        task_type: formData.task_type,
        task_title: formData.task_title.trim(),
        tax_preparer_id: parseInt(formData.tax_preparer_id),
        client_ids: formData.client_ids.map(id => parseInt(id)),
        folder_id: parseInt(formData.folder_id),
        due_date: formData.due_date,
        priority: formData.priority || 'medium',
        description: formData.description.trim() || '',
      };

      // Add optional fields only if they have values
      if (formData.estimated_hours && formData.estimated_hours !== '') {
        taskData.estimated_hours = parseFloat(formData.estimated_hours);
      }

      console.log('Calling API with taskData:', taskData);
      const response = await firmAdminTasksAPI.createTask(taskData, selectedFiles);
      console.log('API Response:', response);

      if (response.success) {
        toast.success('Task created successfully!');
        resetForm();
        onClose();
        if (onTaskCreated) {
          onTaskCreated();
        }
      } else {
        throw new Error(response.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      
      // Parse API validation errors
      let apiErrors = {};
      
      // Check if error has fieldErrors property (from API utility)
      if (error.fieldErrors && typeof error.fieldErrors === 'object') {
        // Convert API errors object to our errors format
        Object.keys(error.fieldErrors).forEach(field => {
          const fieldErrors = error.fieldErrors[field];
          if (Array.isArray(fieldErrors)) {
            apiErrors[field] = fieldErrors.join(', ');
          } else if (typeof fieldErrors === 'string') {
            apiErrors[field] = fieldErrors;
          }
        });
      } else if (error.message && error.message.includes(':')) {
        // Fallback: Try to extract error details from the error message
        // Error format: "field: error message; field2: error message"
        const errorParts = error.message.split(';');
        errorParts.forEach(part => {
          const [field, ...messageParts] = part.split(':');
          if (field && messageParts.length > 0) {
            const fieldName = field.trim();
            const errorMsg = messageParts.join(':').trim();
            apiErrors[fieldName] = errorMsg;
          }
        });
      }

      // If we have field-specific errors, set them in the errors state
      if (Object.keys(apiErrors).length > 0) {
        setErrors(apiErrors);
        toast.error('Please fix the errors in the form');
      } else {
        // Fallback to general error message
        const errorMessage = handleAPIError(error);
        toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to create task'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Get selected tax preparer name
  const selectedTaxPreparer = taxPreparers.find(tp => tp.id === parseInt(formData.tax_preparer_id));
  const selectedTaxPreparerName = selectedTaxPreparer
    ? (selectedTaxPreparer.staff_member?.name ||
      `${selectedTaxPreparer.first_name || ''} ${selectedTaxPreparer.last_name || ''}`.trim() ||
      selectedTaxPreparer.contact?.email ||
      selectedTaxPreparer.email ||
      'Unknown')
    : 'Select Tax Preparer';

  // Get selected clients names
  const selectedClients = clients.filter(c => formData.client_ids.includes(c.id.toString()));
  const selectedClientsNames = selectedClients.length > 0
    ? selectedClients.map(c => `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email).join(', ')
    : 'Select Clients';

  // Get selected folder name
  const findFolderName = (tree, folderId) => {
    for (const folder of tree) {
      if (folder.id === folderId) return folder.name;
      if (folder.children && folder.children.length > 0) {
        const found = findFolderName(folder.children, folderId);
        if (found) return found;
      }
    }
    return null;
  };
  const selectedFolderName = findFolderName(folderTree, parseInt(formData.folder_id)) || 'Select Folder';

  if (!isOpen) return null;

  const modalContent = (
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
        {/* Modal Header */}
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{ borderColor: '#E8F0FF' }}>
          <h4 className="mb-0" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 600, fontSize: '20px', color: '#3B4A66' }}>Create New Task</h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" rx="12" fill="#E8F0FF" />
              <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto flex-1" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-lg border p-4" style={{ borderColor: '#E8F0FF' }}>
              {/* Task Type */}
              <div className="mb-3">
                <label className="form-label mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                  Task Type <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select form-select-sm ${errors.task_type ? 'is-invalid' : ''}`}
                  value={formData.task_type}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, task_type: e.target.value }));
                    setErrors(prev => ({ ...prev, task_type: null }));
                  }}
                  style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
                >
                  <option value="client_onboarding">Client Onboarding</option>
                  <option value="amendment_filing">Amendment Filing</option>
                  <option value="document_collection">Document Collection</option>
                  <option value="document_review">Document Review</option>
                </select>
                {errors.task_type && <div className="invalid-feedback">{errors.task_type}</div>}
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
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, task_title: e.target.value }));
                    if (errors.task_title) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.task_title;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Enter task title"
                  maxLength={255}
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
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, description: e.target.value }));
                    if (errors.description) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.description;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Enter task description"
                  rows={3}
                  style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
                />
                {errors.description && <div className="invalid-feedback">{errors.description}</div>}
              </div>

              {/* Tax Preparer and Priority - Same Row */}
              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label className="form-label mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                    Tax Preparer <span className="text-danger">*</span>
                  </label>
                  <div className="position-relative" ref={taxPreparerDropdownRef}>
                    <button
                      type="button"
                      className={`form-select form-select-sm text-start ${errors.tax_preparer_id ? 'is-invalid' : ''}`}
                      onClick={() => setShowTaxPreparerDropdown(!showTaxPreparerDropdown)}
                      style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px', cursor: 'pointer' }}
                    >
                      {loadingTaxPreparers ? 'Loading...' : selectedTaxPreparerName}
                    </button>
                    {showTaxPreparerDropdown && (
                      <div
                        className="position-absolute w-100 bg-white border rounded mt-1 shadow-lg"
                        style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}
                      >
                        {taxPreparers.length > 0 ? (
                          taxPreparers.map((tp) => {
                            const displayName = tp.staff_member?.name ||
                              `${tp.first_name || ''} ${tp.last_name || ''}`.trim() ||
                              tp.contact?.email ||
                              tp.email ||
                              `Staff #${tp.id}`;
                            return (
                              <div
                                key={tp.id}
                                className="p-2 cursor-pointer hover-bg-light"
                      onClick={() => {
                                    setFormData(prev => ({ ...prev, tax_preparer_id: tp.id.toString() }));
                                    setShowTaxPreparerDropdown(false);
                                    if (errors.tax_preparer_id) {
                                      setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.tax_preparer_id;
                                        return newErrors;
                                      });
                                    }
                                  }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                {displayName}
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-2 text-muted">No tax preparers available</div>
                        )}
                      </div>
                    )}
                    {errors.tax_preparer_id && <div className="invalid-feedback d-block">{errors.tax_preparer_id}</div>}
                  </div>
                </div>
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
              </div>

              {/* Client */}
              <div className="mb-3">
                <label className="form-label mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                  Client(s) <span className="text-danger">*</span>
                </label>
                <div className="position-relative" ref={clientDropdownRef}>
                  <button
                    type="button"
                    className={`form-select form-select-sm text-start ${errors.client_ids ? 'is-invalid' : ''}`}
                    onClick={() => setShowClientDropdown(!showClientDropdown)}
                    style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px', cursor: 'pointer' }}
                  >
                    {loadingClients ? 'Loading...' : selectedClientsNames || 'Select Client(s)'}
                  </button>
                  {showClientDropdown && (
                    <div
                      className="position-absolute w-100 bg-white border rounded mt-1 shadow-lg"
                      style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}
                    >
                      {clients.map((client) => {
                        const isSelected = formData.client_ids.includes(client.id.toString());
                        return (
                          <div
                            key={client.id}
                            className="p-2 cursor-pointer d-flex align-items-center gap-2"
                                  onClick={() => {
                                    const newClientIds = isSelected
                                      ? formData.client_ids.filter(id => id !== client.id.toString())
                                      : [...formData.client_ids, client.id.toString()];
                                    setFormData(prev => ({ ...prev, client_ids: newClientIds }));
                                    if (errors.client_ids) {
                                      setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.client_ids;
                                        return newErrors;
                                      });
                                    }
                                  }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => { }}
                              style={{ cursor: 'pointer' }}
                            />
                            {`${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {errors.client_ids && <div className="invalid-feedback d-block">{errors.client_ids}</div>}
                  {formData.client_ids.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {formData.client_ids.map(id => {
                        const client = clients.find(c => c.id.toString() === id);
                        if (!client) return null;
                        const displayName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email;
                        return (
                          <span
                            key={id}
                            className="badge"
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#3B4A66',
                              border: '1px solid #E8F0FF',
                              fontSize: '12px',
                              padding: '4px 10px',
                              fontFamily: 'BasisGrotesquePro'
                            }}
                          >
                            {displayName}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Folder and Due Date - Same Row */}
              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label className="form-label mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                    Folder <span className="text-danger">*</span>
                  </label>
                  <div className="position-relative" ref={folderDropdownRef}>
                    <button
                      type="button"
                      className={`form-select form-select-sm text-start ${errors.folder_id ? 'is-invalid' : ''}`}
                      onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                      style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px', cursor: 'pointer' }}
                    >
                      {loadingFolders ? 'Loading...' : selectedFolderName}
                    </button>
                    {showFolderDropdown && (
                      <div
                        className="position-absolute w-100 bg-white border rounded mt-1 shadow-lg"
                        style={{ maxHeight: '300px', overflowY: 'auto', zIndex: 1000 }}
                      >
                        {folderTree.length > 0 ? (
                          renderFolderTree(folderTree)
                        ) : (
                          <div className="p-3 text-muted">No folders available</div>
                        )}
                      </div>
                    )}
                    {errors.folder_id && <div className="invalid-feedback d-block">{errors.folder_id}</div>}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                    Due Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control form-control-sm ${errors.due_date ? 'is-invalid' : ''}`}
                    value={formData.due_date}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, due_date: e.target.value }));
                      if (errors.due_date) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.due_date;
                          return newErrors;
                        });
                      }
                    }}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
                  />
                  {errors.due_date && <div className="invalid-feedback">{errors.due_date}</div>}
                </div>
              </div>

              {/* Estimated Hours */}
              <div className="mb-3">
                <label className="form-label mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                  Estimated Hours
                </label>
                <input
                  type="number"
                  className={`form-control form-control-sm ${errors.estimated_hours ? 'is-invalid' : ''}`}
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}
                />
                {errors.estimated_hours && <div className="invalid-feedback">{errors.estimated_hours}</div>}
              </div>

              {/* Files/Attachments */}
              <div className="mb-3">
                <label className="form-label mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 500, fontSize: '14px', color: '#3B4A66' }}>
                  Files (Optional)
                </label>
                <div
                  className="border border-dashed rounded p-3 text-center"
                  style={{ borderColor: '#E8F0FF', cursor: 'pointer' }}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <FaFileUpload size={20} style={{ color: '#3AD6F2', marginBottom: '8px' }} />
                  <div style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px', color: '#3B4A66' }}>Click to upload files</div>
                  <div style={{ fontFamily: 'BasisGrotesquePro', fontSize: '11px', color: '#7B8AB2', marginTop: '4px' }}>
                    PDF, XLSX, XLS, DOCX, JPG, JPEG, PNG (Max 10MB each)
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    className="d-none"
                    onChange={handleFileChange}
                    multiple
                    accept=".pdf,.xlsx,.xls,.docx,.jpg,.jpeg,.png"
                  />
                </div>
                {errors.files && <div className="invalid-feedback d-block">{errors.files}</div>}
                {selectedFiles.length > 0 && (
                  <div className="mt-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="d-flex align-items-center justify-content-between p-2 bg-light rounded mb-1">
                        <span style={{ fontSize: '12px', fontFamily: 'BasisGrotesquePro' }}>
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger p-0"
                          onClick={() => removeFile(index)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="d-flex justify-content-end align-items-center gap-2 p-3 border-top mt-3" style={{ borderColor: '#E8F0FF' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn btn-sm"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#3B4A66',
                  border: '1px solid #E8F0FF',
                  fontFamily: 'BasisGrotesquePro',
                  fontSize: '14px',
                  padding: '8px 16px'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-sm"
                style={{
                  backgroundColor: '#F56D2D',
                  color: '#FFFFFF',
                  border: 'none',
                  fontFamily: 'BasisGrotesquePro',
                  fontSize: '14px',
                  padding: '8px 16px'
                }}
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CreateTaskModal;

