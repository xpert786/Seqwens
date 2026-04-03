import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { firmAdminTasksAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { toast } from 'react-toastify';
import { FaTimes, FaChevronDown, FaChevronRight, FaFolder, FaFileUpload } from 'react-icons/fa';

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated, prefillData }) => {
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
    description: ''
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
      task_type: prefillData?.task_type || 'client_onboarding',
      task_title: prefillData?.task_title || '',
      tax_preparer_id: prefillData?.tax_preparer_id?.toString() || '',
      client_ids: prefillData?.client_ids || [],
      folder_id: prefillData?.folder_id || '',
      due_date: prefillData?.due_date || '',
      priority: prefillData?.priority || 'medium',
      description: prefillData?.description || ''
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

      // Dynamic allowed types based on task type
      const isSignatureRequest = formData.task_type === 'signature_request';
      const allowedTypes = isSignatureRequest
        ? ['.pdf']
        : ['.pdf', '.xlsx', '.xls', '.docx', '.jpg', '.jpeg', '.png'];

      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

      if (file.size > maxSize) {
        toast.error(`File ${file.name} exceeds 10MB limit`);
        return false;
      }
      if (!allowedTypes.includes(fileExtension)) {
        const allowedMsg = isSignatureRequest ? 'PDF only' : 'PDF, Excel, Word, Images';
        toast.error(`File ${file.name} has invalid type. Allowed: ${allowedMsg}`);
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
    if (!formData.task_title.trim()) newErrors.task_title = 'Task title is required';

    // Assignment fields are now optional in backend, so we reflect that here.
    // However, we can add a check if needed, but per requirements, they are optional.

    // Folder validation conditional based on task type
    const folderRequiredTypes = ['document_collection', 'document_review', 'document_request', 'signature_request'];
    if (folderRequiredTypes.includes(formData.task_type) && !formData.folder_id) {
      newErrors.folder_id = 'Folder is required for this task type';
    }

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
        task_preparer_id: formData.tax_preparer_id ? parseInt(formData.tax_preparer_id) : null,
        client_ids: formData.client_ids.map(id => parseInt(id)),
        folder_id: formData.folder_id ? parseInt(formData.folder_id) : null,
        due_date: formData.due_date,
        priority: formData.priority || 'medium',
        description: formData.description.trim() || '',
      };

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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-h-[90vh] w-full max-w-[650px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 shadow-[#3AD6F2]/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <h4 className="text-xl font-bold text-[#3B4A66] font-[BasisGrotesquePro] leading-tight">Create New Task</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-[#3B4A66] transition-all duration-200"
            style={{ borderRadius: "50%" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
          <form id="create-task-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Task Type */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                Task Type <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#3AD6F2] transition-all ${errors.task_type ? 'border-red-500' : 'border-gray-300'}`}
                value={formData.task_type}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, task_type: e.target.value }));
                  setErrors(prev => ({ ...prev, task_type: null }));
                }}
                style={{ fontFamily: 'BasisGrotesquePro' }}
              >
                <option value="client_onboarding">Client Onboarding</option>
                <option value="document_collection">Document Collection</option>
                <option value="document_request">Document Request</option>
                <option value="document_review">Document Review</option>
                <option value="signature_request">Signature Request</option>
              </select>
              {errors.task_type && <p className="text-[10px] text-red-500 mt-1">{errors.task_type}</p>}
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#3AD6F2] transition-all ${errors.task_title ? 'border-red-500' : 'border-gray-300'}`}
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
                style={{ fontFamily: 'BasisGrotesquePro' }}
              />
              {errors.task_title && <p className="text-[10px] text-red-500 mt-1">{errors.task_title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                Description
              </label>
              <textarea
                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#3AD6F2] transition-all min-h-[80px] resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
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
                placeholder="Describe the task details..."
                rows={3}
                style={{ fontFamily: 'BasisGrotesquePro' }}
              />
              {errors.description && <p className="text-[10px] text-red-500 mt-1">{errors.description}</p>}
            </div>

            {/* Tax Preparer and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1" ref={taxPreparerDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                  Tax Preparer <span className="text-[10px] font-normal text-gray-500">(optional)</span>
                </label>

                <div className="relative">
                  <button
                    type="button"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-gray-900 text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#3AD6F2] transition-all ${errors.tax_preparer_id ? 'border-red-500' : 'border-gray-300'
                     }`}
                    onClick={() => setShowTaxPreparerDropdown(!showTaxPreparerDropdown)}
                  >
                    <span className="truncate">
                      {loadingTaxPreparers
                        ? 'Loading...'
                        : formData.tax_preparer_id
                          ? selectedTaxPreparerName
                          : 'Assign to Self'}
                    </span>

                    <FaChevronDown
                      size={10}
                      className={`text-gray-400 transition-transform duration-200 ${showTaxPreparerDropdown ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {showTaxPreparerDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8F0FF] rounded-xl shadow-xl z-[100] max-h-[200px] overflow-y-auto custom-scrollbar overflow-x-hidden">

                      {/* Assign to Self */}
                      <div
                        className="px-3 py-0.5 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            tax_preparer_id: ''
                          }));
                          setShowTaxPreparerDropdown(false);
                        }}
                      >
                        <p className="text-xs font-black text-gray-900 leading-tight font-[BasisGrotesquePro]">
                          Assign to Self (Admin)
                        </p>
                      </div>

                      {/* Tax Preparers List */}
                      {taxPreparers.map((tp) => {
                        const displayName =
                          tp.staff_member?.name ||
                          `${tp.first_name || ''} ${tp.last_name || ''}`.trim() ||
                          tp.email;

                        return (
                          <div
                            key={tp.id}
                            className="px-3 py-0.5 cursor-pointer hover:bg-[#3AD6F2]/5 transition-colors last:border-0"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                tax_preparer_id: tp.id.toString()
                              }));
                              setShowTaxPreparerDropdown(false);
                            }}
                          >
                            <p className="text-xs font-bold text-gray-700 leading-tight font-[BasisGrotesquePro]">
                              {displayName}
                            </p>
                          </div>
                        );
                      })}

                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                  Priority
                </label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#3AD6F2] transition-all"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  style={{ fontFamily: 'BasisGrotesquePro' }}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>

            {/* Clients Selection */}
            {formData.task_type !== 'signature_request' && (
              <div className="space-y-1" ref={clientDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                  Assign Client(s)
                  <span className="text-[10px] font-normal text-gray-500">
                    (optional)
                  </span>
                </label>

                <div className="relative">
                  <button
                    type="button"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#3AD6F2] transition-all"
                    onClick={() => setShowClientDropdown(!showClientDropdown)}
                  >
                    <span className="truncate">
                      {loadingClients
                        ? 'Loading...'
                        : formData.client_ids.length > 0
                          ? `${formData.client_ids.length} Client(s) Selected`
                          : 'Internal / No Client'}
                    </span>

                    <FaChevronDown
                      size={10}
                      className={`transition-transform duration-200 ${showClientDropdown ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {showClientDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8F0FF] rounded-xl shadow-xl z-[100] max-h-[250px] overflow-y-auto custom-scrollbar overflow-x-hidden">

                      {/* No Client Assigned */}
                      <div
                        className="px-3 py-0.5 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            client_ids: []
                          }));
                          setShowClientDropdown(false);
                        }}
                      >
                        <p className="text-xs font-black text-gray-900 leading-tight font-[BasisGrotesquePro]">
                          No Client Assigned
                        </p>
                      </div>

                      {/* Clients List */}
                      {clients.map((client) => {
                        const isSelected =
                          formData.client_ids.includes(
                            client.id.toString()
                          );

                        return (
                          <div
                            key={client.id}
                            className="px-3 py-0.5 cursor-pointer hover:bg-[#3AD6F2]/5 transition-colors last:border-0 flex items-center gap-2"
                            onClick={() => {
                              const newClientIds = isSelected
                                ? formData.client_ids.filter(
                                  id => id !== client.id.toString()
                                )
                                : [
                                  ...formData.client_ids,
                                  client.id.toString()
                                ];

                              setFormData(prev => ({
                                ...prev,
                                client_ids: newClientIds
                              }));
                            }}
                          >

                            {/* Checkbox */}
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected
                                  ? 'bg-[#3AD6F2] border-[#3AD6F2]'
                                  : 'border-gray-200 bg-white'
                                }`}
                            >
                              {isSelected && (
                                <svg
                                  className="w-2.5 h-2.5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="4"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>

                            {/* Client Name */}
                            <p className="text-xs font-bold text-gray-700 leading-tight font-[BasisGrotesquePro]">
                              {`${client.first_name || ''} ${client.last_name || ''}`.trim() ||
                                client.email}
                            </p>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Clients Chips */}
                {formData.client_ids.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.client_ids.map(id => {
                      const client = clients.find(
                        c => c.id.toString() === id
                      );

                      if (!client) return null;

                      return (
                        <div
                          key={id}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-100 group animate-in slide-in-from-left-2 duration-200"
                        >
                          <span className="text-[10px] font-black text-blue-600 font-[BasisGrotesquePro]">
                            {`${client.first_name || ''} ${client.last_name || ''}`.trim() ||
                              client.email}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setFormData(prev => ({
                                ...prev,
                                client_ids: prev.client_ids.filter(
                                  cid => cid !== id
                                )
                              }))
                            }
                            className="text-blue-300 hover:text-blue-500 transition-colors"
                          >
                            <FaTimes size={8} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Folder and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1" ref={folderDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                  Target Folder {['document_collection', 'document_review', 'document_request', 'signature_request'].includes(formData.task_type) && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-gray-900 text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#3AD6F2] transition-all ${errors.folder_id ? 'border-red-500' : 'border-gray-300'}`}
                    onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                  >
                    <span className="truncate">{loadingFolders ? 'Loading...' : selectedFolderName}</span>
                    <FaChevronDown size={10} className={`transition-transform duration-200 ${showFolderDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showFolderDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8F0FF] !rounded-xl shadow-xl z-[100] max-h-[250px] overflow-y-auto custom-scrollbar overflow-x-hidden">
                      {folderTree.length > 0 ? renderFolderTree(folderTree) : <div className="p-4 text-center text-xs text-gray-400">No folders found</div>}
                    </div>
                  )}
                </div>
                {errors.folder_id && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.folder_id}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#3AD6F2] transition-all ${errors.due_date ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.due_date}
                  min={new Date().toISOString().split('T')[0]}
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
                  style={{ fontFamily: 'BasisGrotesquePro' }}
                />
                {errors.due_date && <p className="text-[10px] text-red-500 mt-1">{errors.due_date}</p>}
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                Attachments <span className="text-[10px] font-normal text-gray-500">(optional)</span>
              </label>
              <div
                className="border-2 border-dashed border-[#E8F0FF] hover:border-[#3AD6F2] !rounded-2xl p-6 transition-all cursor-pointer bg-gray-50/50 group"
                onClick={() => document.getElementById('file-input').click()}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-white !rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FaFileUpload className="text-[#3AD6F2] w-6 h-6" />
                  </div>
                  <p className="text-sm font-black text-gray-900 font-[BasisGrotesquePro] mb-1">Upload Files</p>
                  <p className="text-[10px] font-bold text-gray-400 font-[BasisGrotesquePro]">
                    {formData.task_type === 'signature_request' ? 'Limited to PDF format' : 'PDF, Word, Excel or Images (Max 10MB)'}
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                    accept={formData.task_type === 'signature_request' ? ".pdf" : ".pdf,.xlsx,.xls,.docx,.jpg,.jpeg,.png"}
                  />
                </div>
              </div>
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 bg-white border border-[#E8F0FF] !rounded-xl group hover:border-[#3AD6F2] transition-all">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FaFolder className="text-amber-400 flex-shrink-0" />
                        <span className="text-[11px] font-bold text-gray-700 truncate font-[BasisGrotesquePro]">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white font-medium font-[BasisGrotesquePro] text-sm transition-all"
            style={{ borderRadius: "10px" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-task-form"
            disabled={loading}
            className="px-8 py-2 bg-[#F56D2D] text-white rounded-lg font-medium font-[BasisGrotesquePro] text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ borderRadius: "10px" }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              'Create Task'
            )}
          </button>
        </div>
        <style>
          {`
            .custom-scrollbar::-webkit-scrollbar {
              width: 5px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #F8FAFF;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #E2E8F0;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #CBD5E1;
            }
          `}
        </style>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CreateTaskModal;

