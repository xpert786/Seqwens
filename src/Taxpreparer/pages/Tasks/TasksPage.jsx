import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Task1, Clocking, Completed, Overdue, Progressing, Customize, Doc, Pendinge, Progressingg, Completeded, Overduer, MiniContact, Dot, AddTask, Cut } from "../../component/icons";
import { FaChevronDown, FaChevronRight, FaFolder, FaSearch } from "react-icons/fa";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError, taxPreparerClientAPI } from "../../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
import "../../styles/taskpage.css";
// Custom checkbox styles
const checkboxStyle = `
  input[type="checkbox"] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border: 1px solid #D1D5DB;
    border-radius: 4px;
    outline: none;
    cursor: pointer;
    position: relative;
    vertical-align: middle;
    margin-right: 8px;
  }
  
  input[type="checkbox"]:checked {
    background-color: #4B5563;
    border-color: #4B5563;
  }
  
  input[type="checkbox"]:checked::after {
    content: '✓';
    position: absolute;
    color: white;
    font-size: 12px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  
  .task-item {
    transition: background-color 0.2s ease;
    cursor: pointer;
    background-color: #fff !important;
  }
  
  .task-item:hover {
    background-color: rgb(255, 247, 234) !important;
  }
`;

export default function TasksPage() {
  const modalRef = useRef(null);
  const buttonRef = useRef(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [active, setActive] = useState("kanban");
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientDropdownRef = useRef(null);
  const [folderTree, setFolderTree] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const folderDropdownRef = useRef(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedFolderPath, setSelectedFolderPath] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolderLoading, setCreatingFolderLoading] = useState(false);
  const [parentFolderForNewFolder, setParentFolderForNewFolder] = useState(null);
  const [formData, setFormData] = useState({
    task_type: 'signature_request',
    task_title: '',
    client_ids: [],
    folder_id: '',
    due_date: '',
    priority: '',
    estimated_hours: '',
    description: '',
    files: [],
    spouse_signature_required: false
  });
  const [tasks, setTasks] = useState({
    pending: [],
    inprogress: [],
    completed: [],
    overdue: []
  });

  // Tasks API state
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState(null);
  const [tasksStatistics, setTasksStatistics] = useState({
    total_tasks: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    high_priority: 0
  });
  const [tasksPagination, setTasksPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false
  });

  // Tasks filters
  const [tasksSearchQuery, setTasksSearchQuery] = useState("");
  const [tasksStatusFilter, setTasksStatusFilter] = useState("");
  const [tasksPriorityFilter, setTasksPriorityFilter] = useState("");
  const [tasksTypeFilter, setTasksTypeFilter] = useState("");
  const [tasksStartDate, setTasksStartDate] = useState("");
  const [tasksEndDate, setTasksEndDate] = useState("");
  const [tasksSortBy, setTasksSortBy] = useState("-created_at");


  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCustomize && modalRef.current && !modalRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowCustomize(false);
      }

      // Close client dropdown if clicking outside
      if (showClientDropdown && clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setShowClientDropdown(false);
      }

      // Close folder dropdown if clicking outside
      if (showFolderDropdown && folderDropdownRef.current && !folderDropdownRef.current.contains(event.target)) {
        setShowFolderDropdown(false);
      }
    };

    // Add event listener when component mounts
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up event listener on unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomize, showClientDropdown, showFolderDropdown]);

  // Fetch clients from API
  const fetchClients = async () => {
    try {
      setLoadingClients(true);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const apiUrl = `${API_BASE_URL}/firm/staff/clients/list/`;
      const response = await fetchWithCors(apiUrl, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Handle API response structure: { success: true, data: [...] }
      if (result.success && Array.isArray(result.data)) {
        setClients(result.data);
        console.log('Clients fetched successfully:', result.data.length);
      } else if (Array.isArray(result)) {
        // Fallback: if API returns array directly
        setClients(result);
        console.log('Clients fetched successfully:', result.length);
      } else if (result.data && Array.isArray(result.data)) {
        // Another fallback: if result has data property
        setClients(result.data);
        console.log('Clients fetched successfully:', result.data.length);
      } else {
        console.warn('Unexpected API response structure:', result);
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  // Fetch clients when modal opens
  useEffect(() => {
    if (showAddTaskModal && clients.length === 0 && !loadingClients) {
      fetchClients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddTaskModal]);

  // Fetch received tasks from API
  const fetchReceivedTasks = async () => {
    try {
      setTasksLoading(true);
      setTasksError(null);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams();
      if (tasksSearchQuery) {
        params.append('search', tasksSearchQuery);
      }
      if (tasksStatusFilter) {
        params.append('status', tasksStatusFilter);
      }
      if (tasksPriorityFilter) {
        params.append('priority', tasksPriorityFilter);
      }
      if (tasksTypeFilter) {
        params.append('task_type', tasksTypeFilter);
      }
      if (tasksStartDate) {
        params.append('start_date', tasksStartDate);
      }
      if (tasksEndDate) {
        params.append('end_date', tasksEndDate);
      }
      if (tasksSortBy) {
        params.append('sort_by', tasksSortBy);
      }
      if (tasksPagination.page > 1) {
        params.append('page', tasksPagination.page);
      }
      if (tasksPagination.page_size !== 20) {
        params.append('page_size', tasksPagination.page_size);
      }

      const queryString = params.toString();
      const url = `${API_BASE_URL}/taxpayer/tax-preparer/tasks/received/${queryString ? `?${queryString}` : ''}`;

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      console.log('Fetching received tasks from:', url);

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Received tasks API response:', result);

      if (result.success && result.data) {
        const apiTasks = result.data.tasks || [];

        // Organize tasks by status
        const organizedTasks = {
          pending: [],
          inprogress: [],
          completed: [],
          overdue: []
        };

        const now = new Date();

        apiTasks.forEach(task => {
          const taskObj = {
            id: task.id,
            title: task.task_title || 'Untitled Task',
            client: task.clients_info && task.clients_info.length > 0
              ? task.clients_info.map(c => c.name).join(', ')
              : `${task.client_count || 0} client(s)`,
            due: task.due_date
              ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'No due date',
            priority: task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium',
            note: task.description || '',
            task_type: task.task_type,
            status: task.status,
            created_by: task.created_by_name || 'Admin',
            folder_info: task.folder_info,
            clients_info: task.clients_info || [],
            due_date: task.due_date,
            estimated_hours: task.estimated_hours,
            signature_requests_info: task.signature_requests_info || []
          };

          // Check if overdue
          if (task.due_date) {
            const dueDate = new Date(task.due_date);
            if (dueDate < now && task.status !== 'completed' && task.status !== 'cancelled') {
              organizedTasks.overdue.push(taskObj);
              return;
            }
          }

          // Categorize by status
          if (task.status === 'pending') {
            organizedTasks.pending.push(taskObj);
          } else if (task.status === 'in_progress') {
            organizedTasks.inprogress.push(taskObj);
          } else if (task.status === 'completed') {
            organizedTasks.completed.push(taskObj);
          } else if (task.status === 'cancelled') {
            // Cancelled tasks can go to completed or be filtered out
            organizedTasks.completed.push(taskObj);
          } else {
            // Default to pending for unknown statuses
            organizedTasks.pending.push(taskObj);
          }
        });

        setTasks(organizedTasks);

        if (result.data.statistics) {
          setTasksStatistics(result.data.statistics);
        }

        if (result.data.pagination) {
          setTasksPagination(result.data.pagination);
        }
      } else {
        throw new Error(result.message || 'Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching received tasks:', error);
      setTasksError(handleAPIError(error));
      setTasks({
        pending: [],
        inprogress: [],
        completed: [],
        overdue: []
      });
    } finally {
      setTasksLoading(false);
    }
  };

  // Fetch tasks on component mount and when filters change
  useEffect(() => {
    if (active === "kanban") {
      fetchReceivedTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, tasksSearchQuery, tasksStatusFilter, tasksPriorityFilter, tasksTypeFilter, tasksStartDate, tasksEndDate, tasksSortBy, tasksPagination.page, tasksPagination.page_size]);


  // Fetch root folders from API
  useEffect(() => {
    const fetchRootFolders = async () => {
      if (!showAddTaskModal) return; // Only fetch when modal is open

      try {
        setLoadingFolders(true);
        const API_BASE_URL = getApiBaseUrl();
        const token = getAccessToken();

        if (!token) {
          console.error('No authentication token found');
          return;
        }

        const config = {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        };

        const response = await fetchWithCors(`${API_BASE_URL}/firm/staff/documents/browse/`, config);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          // New API structure: result.data.folders
          let rootFolders = [];

          if (result.data.folders && Array.isArray(result.data.folders)) {
            rootFolders = result.data.folders;
          }

          const foldersTree = rootFolders.map(folder => ({
            id: folder.id,
            name: folder.title || folder.name,
            title: folder.title || folder.name,
            description: folder.description || '',
            children: [],
            expanded: false,
            loaded: false,
          }));
          setFolderTree(foldersTree);
        } else {
          setFolderTree([]);
        }
      } catch (error) {
        console.error('Error fetching root folders:', error);
        setFolderTree([]);
      } finally {
        setLoadingFolders(false);
      }
    };

    fetchRootFolders();
  }, [showAddTaskModal]);

  // Fetch subfolders for a specific folder
  const fetchSubfolders = async (folderId) => {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        return [];
      }

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await fetchWithCors(`${API_BASE_URL}/firm/staff/documents/browse/?folder_id=${folderId}`, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.folders) {
        return result.data.folders.map(folder => ({
          id: folder.id,
          name: folder.title || folder.name,
          title: folder.title || folder.name,
          description: folder.description || '',
          children: [],
          expanded: false,
          loaded: false,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching subfolders:', error);
      return [];
    }
  };

  // Update folder tree with subfolders
  const updateFolderWithSubfolders = (tree, targetFolderId, subfolders) => {
    return tree.map(folder => {
      if (folder.id === targetFolderId) {
        return {
          ...folder,
          children: subfolders,
          loaded: true,
        };
      }
      if (folder.children && folder.children.length > 0) {
        return {
          ...folder,
          children: updateFolderWithSubfolders(folder.children, targetFolderId, subfolders),
        };
      }
      return folder;
    });
  };

  const toggleExpand = async (folder, path = []) => {
    const isCurrentlyExpanded = expandedFolders.has(folder.id);

    const newExpandedFolders = new Set(expandedFolders);
    if (isCurrentlyExpanded) {
      newExpandedFolders.delete(folder.id);
    } else {
      newExpandedFolders.add(folder.id);
    }
    setExpandedFolders(newExpandedFolders);

    // If expanding and subfolders haven't been loaded, fetch them
    if (!isCurrentlyExpanded && !folder.loaded && folder.id) {
      const subfolders = await fetchSubfolders(folder.id);
      setFolderTree(prevTree => updateFolderWithSubfolders(prevTree, folder.id, subfolders));
    }
  };

  const handleFolderSelect = (path, folderId) => {
    setSelectedFolderPath(path);
    handleInputChange('folder_id', folderId || '');
    setShowFolderDropdown(false);
  };

  // Helper function to find folder by ID
  const findFolderById = (tree, folderId) => {
    for (const folder of tree) {
      if (folder.id === folderId) {
        return folder;
      }
      if (folder.children && folder.children.length > 0) {
        const found = findFolderById(folder.children, folderId);
        if (found) return found;
      }
    }
    return null;
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setCreatingFolderLoading(true);

    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        toast.error('No authentication token found. Please login again.', { position: "top-right", autoClose: 3000 });
        return;
      }

      // Prepare folder data
      const folderData = {
        title: newFolderName.trim(),
        description: `Documents folder: ${newFolderName.trim()}`
      };

      // Add parent_id if creating inside a folder
      if (parentFolderForNewFolder) {
        folderData.parent_id = parentFolderForNewFolder;
      }

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(folderData)
      };

      console.log('Create Folder API Request URL:', `${API_BASE_URL}/firm/staff/documents/folders/create/`);
      console.log('Create Folder API Request Data:', folderData);

      const response = await fetchWithCors(`${API_BASE_URL}/firm/staff/documents/folders/create/`, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Create Folder API Error Response:', errorData);
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing create folder response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Create Folder API Response:', result);

      // Extract folder data from response
      let folderInfo = result;
      if (result.data) {
        folderInfo = result.data;
      }

      // Create folder object with API response data
      const newFolderObj = {
        name: folderInfo.title || folderInfo.name || newFolderName.trim(),
        id: folderInfo.id,
        title: folderInfo.title || folderInfo.name || newFolderName.trim(),
        description: folderInfo.description || '',
        children: [],
        expanded: false,
        loaded: false
      };

      // Add folder to tree
      let updatedTree;
      if (parentFolderForNewFolder) {
        // Add as child to parent folder
        updatedTree = updateFolderWithSubfolders(folderTree, parentFolderForNewFolder, [
          ...(findFolderById(folderTree, parentFolderForNewFolder)?.children || []),
          newFolderObj
        ]);
      } else {
        // Add as root level folder
        updatedTree = [...folderTree, newFolderObj];
      }

      setFolderTree(updatedTree);
      setNewFolderName("");
      setCreatingFolder(false);
      setParentFolderForNewFolder(null);

      toast.success('Folder created successfully!', { position: "top-right", autoClose: 3000 });

    } catch (error) {
      console.error('Error creating folder:', error);
      const errorMessage = handleAPIError(error);
      toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to create folder. Please try again.'), { position: "top-right", autoClose: 3000 });
    } finally {
      setCreatingFolderLoading(false);
    }
  };

  // Render folder tree
  const renderFolderTree = (folders, path = []) =>
    folders.map((folder, idx) => {
      const fullPath = [...path, folder.name].join(" > ");
      const hasChildren = folder.children && folder.children.length > 0;
      const isExpanded = expandedFolders.has(folder.id);
      // Show expand icon if folder has children or might have children (not loaded yet)
      const showExpandIcon = hasChildren || (!folder.loaded && folder.id);

      return (
        <div key={folder.id || idx} style={{ paddingLeft: '8px', marginBottom: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {showExpandIcon ? (
              <span
                onClick={() => toggleExpand(folder, path)}
                style={{ cursor: 'pointer', width: '12px', display: 'inline-block' }}
              >
                {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
              </span>
            ) : <span style={{ width: '12px' }} />}
            <div
              onClick={() => handleFolderSelect(fullPath, folder.id)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flex: 1, padding: '2px 0' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FaFolder style={{ color: '#F59E0B' }} />
              <span style={{ fontSize: '14px' }}>{folder.name}</span>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div style={{ paddingLeft: '12px' }}>
              {renderFolderTree(folder.children, [...path, folder.name])}
            </div>
          )}
        </div>
      );
    });

  // Handle form input changes
  const handleInputChange = (field, value) => {
    if (field === 'client_ids') {
      // Handle multi-select for client_ids
      setFormData(prev => ({
        ...prev,
        client_ids: Array.isArray(value) ? value : [value]
      }));
    } else if (field === 'files') {
      // Handle file upload
      setFormData(prev => ({
        ...prev,
        files: Array.from(value)
      }));
    } else {
      setFormData(prev => {
        const updated = {
          ...prev,
          [field]: value
        };
        // Debug log for spouse_signature_required changes
        if (field === 'spouse_signature_required') {
          console.log('Updated spouse_signature_required in formData:', value, 'type:', typeof value);
        }
        return updated;
      });
    }
  };

  // Handle spouse signature toggle with validation
  const handleSpouseSignatureToggle = async (checked) => {
    // If unchecking, allow it
    if (!checked) {
      handleInputChange('spouse_signature_required', false);
      return;
    }

    // If checking, validate that all selected clients have spouses
    if (!formData.client_ids || formData.client_ids.length === 0) {
      toast.error('Please select at least one client first.');
      return;
    }

    try {
      // Check spouse for all selected clients
      const spouseChecks = await Promise.all(
        formData.client_ids.map(async (clientId) => {
          try {
            const response = await taxPreparerClientAPI.checkClientSpouse(clientId);
            if (response.success && response.data) {
              return {
                clientId,
                hasSpouse: response.data.has_spouse,
                clientName: response.data.client_name || `Client ${clientId}`
              };
            }
            return {
              clientId,
              hasSpouse: false,
              clientName: `Client ${clientId}`,
              error: 'Failed to check spouse information'
            };
          } catch (error) {
            console.error(`Error checking spouse for client ${clientId}:`, error);
            return {
              clientId,
              hasSpouse: false,
              clientName: `Client ${clientId}`,
              error: handleAPIError(error)
            };
          }
        })
      );

      // Check if all clients have spouses
      const clientsWithoutSpouse = spouseChecks.filter(check => !check.hasSpouse);

      if (clientsWithoutSpouse.length > 0) {
        // Some clients don't have spouses
        const clientNames = clientsWithoutSpouse.map(c => c.clientName).join(', ');
        toast.error(`The following client(s) do not have a partner/spouse: ${clientNames}. Spouse signature cannot be required.`);
        return;
      }

      // All clients have spouses, allow toggle
      handleInputChange('spouse_signature_required', true);
    } catch (error) {
      console.error('Error checking spouse:', error);
      toast.error(handleAPIError(error) || 'Failed to check spouse information. Please try again.');
    }
  };

  // Prepare form data for API
  const prepareFormData = () => {
    const formDataToSend = new FormData();

    // Required fields
    formDataToSend.append('task_type', formData.task_type || 'signature_request');
    formDataToSend.append('task_title', formData.task_title);
    // client_ids must be sent as JSON string array like: "[\"96\"]"
    formDataToSend.append('client_ids', JSON.stringify(formData.client_ids));

    // Optional fields (only append if they have values)
    if (formData.due_date) {
      formDataToSend.append('due_date', formData.due_date);
    }

    if (formData.priority) {
      formDataToSend.append('priority', formData.priority);
    }

    if (formData.folder_id) {
      formDataToSend.append('folder_id', formData.folder_id);
    }

    if (formData.estimated_hours) {
      formDataToSend.append('estimated_hours', formData.estimated_hours.toString());
    }

    if (formData.description) {
      formDataToSend.append('description', formData.description);
    }

    // Add spouse signature requirement for signature requests
    // Always send this field for signature requests, even if false
    if (formData.task_type === 'signature_request') {
      // Get the raw value from formData
      const rawValue = formData.spouse_signature_required;
      console.log('Raw spouse_signature_required value before processing:', rawValue, 'type:', typeof rawValue);

      // Convert to boolean - check multiple possible truthy values
      const spouseSignValue = !!(rawValue === true ||
        rawValue === 'true' ||
        rawValue === 'True' ||
        rawValue === 1 ||
        rawValue === '1');

      console.log('Processed spouse_signature_required value:', spouseSignValue);

      // The API expects 'spouse_sign' field name (based on API response)
      // Django FormData boolean fields often expect "1"/"0" or "True"/"False"
      // Try "1"/"0" first as it's more commonly accepted
      const spouseSignString = spouseSignValue ? '1' : '0';
      formDataToSend.append('spouse_sign', spouseSignString);
      // Also send the alternative field name for compatibility
      formDataToSend.append('spouse_signature_required', spouseSignString);

      console.log('Sending spouse_sign as:', spouseSignString, '(1 = true, 0 = false)');
      console.log('FormData entries for spouse fields:');
      for (let pair of formDataToSend.entries()) {
        if (pair[0].includes('spouse')) {
          console.log('  ', pair[0] + ':', pair[1]);
        }
      }   
    }

    // Append files (can be multiple files)
    if (formData.files && formData.files.length > 0) {
      formData.files.forEach((file) => {
        formDataToSend.append('files', file);
      });
    }

    return formDataToSend;
  };

  // Update task API call
  const updateTask = async (e) => {
    e.preventDefault();

    if (!formData.task_title || !formData.client_ids || formData.client_ids.length === 0) {
      toast.error('Please fill in all required fields', { position: "top-right", autoClose: 3000 });
      return;
    }

    if (!editingTaskId) {
      toast.error('Task ID is missing', { position: "top-right", autoClose: 3000 });
      return;
    }

    try {
      setLoading(true);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const formDataToSend = prepareFormData();

      const config = {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: formDataToSend
      };

      const apiUrl = `${API_BASE_URL}/taxpayer/tax-preparer/tasks/${editingTaskId}/`;
      console.log('Updating task at:', apiUrl);

      const response = await fetchWithCors(apiUrl, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Task updated successfully:', result);

      // Reset form and close modal
      setFormData({
        task_type: 'signature_request',
        task_title: '',
        client_ids: [],
        folder_id: '',
        due_date: '',
        priority: '',
        estimated_hours: '',
        description: '',
        files: [],
        spouse_signature_required: false
      });
      setSelectedFolderPath('');
      setCreatingFolder(false);
      setNewFolderName('');
      setParentFolderForNewFolder(null);
      setShowAddTaskModal(false);
      setIsEditMode(false);
      setEditingTaskId(null);

      // Show success message
      toast.success('Task updated successfully!', { position: "top-right", autoClose: 3000 });

      // Refresh tasks list
      fetchReceivedTasks();

    } catch (error) {
      console.error('Error updating task:', error);
      const errorMessage = handleAPIError(error);
      toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to update task. Please try again.'), { position: "top-right", autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // Create task API call
  const createTask = async (e) => {
    e.preventDefault();

    if (!formData.task_title || !formData.client_ids || formData.client_ids.length === 0) {
      toast.error('Please fill in all required fields', { position: "top-right", autoClose: 3000 });
      return;
    }

    try {
      setLoading(true);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const formDataToSend = prepareFormData();

      // Log FormData for debugging (matching curl format)
      console.log('Creating task with data:');
      console.log('task_type:', formData.task_type);
      console.log('task_title:', formData.task_title);
      console.log('client_ids:', JSON.stringify(formData.client_ids));
      console.log('folder_id:', formData.folder_id);
      console.log('due_date:', formData.due_date);
      console.log('priority:', formData.priority);
      console.log('estimated_hours:', formData.estimated_hours);
      console.log('description:', formData.description);
      console.log('spouse_signature_required:', formData.spouse_signature_required);
      console.log('files count:', formData.files.length);

      // Log FormData entries
      console.log('FormData entries:');
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ', pair[1]);
      }

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: formDataToSend
      };

      const apiUrl = `${API_BASE_URL}/taxpayer/tax-preparer/tasks/create/`;
      console.log('API URL:', apiUrl);

      const response = await fetchWithCors(apiUrl, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Task created successfully:', result);

      // Reset form and close modal
      setFormData({
        task_type: 'signature_request',
        task_title: '',
        client_ids: [],
        folder_id: '',
        due_date: '',
        priority: '',
        estimated_hours: '',
        description: '',
        files: [],
        spouse_signature_required: false
      });
      setSelectedFolderPath('');
      setCreatingFolder(false);
      setNewFolderName('');
      setParentFolderForNewFolder(null);
      setShowAddTaskModal(false);
      setIsEditMode(false);
      setEditingTaskId(null);

      // Show success message
      toast.success('Task created successfully!', { position: "top-right", autoClose: 3000 });

      // Refresh tasks list
      fetchReceivedTasks();

    } catch (error) {
      console.error('Error creating task:', error);
      const errorMessage = handleAPIError(error);
      toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to create task. Please try again.'), { position: "top-right", autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from API data
  const stats = [
    {
      label: "Total",
      count: tasksStatistics.total_tasks || 0,
      icon: <Task1 />,
      color: "#4F46E5"
    },
    {
      label: "Pending",
      count: tasksStatistics.pending || 0,
      icon: <Clocking />,
      color: "#F59E0B"
    },
    {
      label: "In Progress",
      count: tasksStatistics.in_progress || 0,
      icon: <Progressing />,
      color: "#3B82F6"
    },
    {
      label: "Completed",
      count: tasksStatistics.completed || 0,
      icon: <Completeded />,
      color: "#10B981"
    },
    {
      label: "Overdue",
      count: tasks.overdue.length || 0,
      icon: <Overduer />,
      color: "#EF4444"
    },
  ];
  // State for checkbox tick marks (only visual)
  const [checkboxes, setCheckboxes] = useState({
    pending: true,
    inprogress: true,
    completed: true,
    overdue: true
  });
  const defaultOrder = ["pending", "inprogress", "completed", "overdue"];
  const [order, setOrder] = useState(defaultOrder);


  const titleFor = (key) => ({ pending: "Pending", inprogress: "In Progress", completed: "Completed", overdue: "Overdue" }[key]);
  const iconFor = (key) => ({ pending: <Pendinge />, inprogress: <Progressingg />, completed: <Completeded />, overdue: <Overduer /> }[key]);
  const bgForCol = (key) => "#fff";

  return (
    <div className="lg:p-4 md:px-2 px-1">
      {/* Header */}
      <div className="tasks-header d-flex justify-content-between align-items-center mb-4 tasks-header-wrapper">
        <div>
          <h3 className="fw-semibold" style={{ marginBottom: 4 }}>My Tasks</h3>
          <small className="text-muted">Manage your assigned tasks and workflow</small>
        </div>
        <button
          onClick={() => {
            setIsEditMode(false);
            setEditingTaskId(null);
            setShowAddTaskModal(true);
          }}
          className="btn dashboard-btn btn-upload d-flex align-items-center gap-2"
        >
          <AddTask />
          Create New Task
        </button>
      </div>

      {/* Stat cards row (Bootstrap grid) */}
      <div className="tasks-stats-row row g-3 mb-4">
        {stats.map((s, i) => (
          <div key={i} className="col-12 col-sm-6 col-md-4 col-lg">
            <div className="card h-100 " style={{
              borderRadius: 16,
              border: "1px solid #E8F0FF",
              minHeight: '120px'
            }}>
              <div className="card-body d-flex flex-column p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="stat-icon" style={{
                    color: "#00C0C6",
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    // background: '#E8F0FF',
                    borderRadius: '10px',
                    flexShrink: 0
                  }}>
                    {s.icon}
                  </div>
                  <div className="stat-count ms-3" style={{
                    color: "#3B4A66",
                    fontWeight: 600,
                    fontSize: '24px',
                    textAlign: 'right',
                    flexGrow: 1
                  }}>
                    {s.count}
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="mb-0 text-muted fw-semibold">{s.label}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Options: Client-style two buttons */}
      <div
        className="options-wrapper inline-block mt-4 w-100 position-relative"
        style={{ border: "none" }}
      >
        <div className="d-flex align-items-center justify-content-between w-100">
          <div className="btn-group-custom d-inline-flex align-items-center gap-2 p-2 rounded-3"
            style={{ background: '#fff', border: '1px solid #E8F0FF' }}>
            {/* Kanban Board */}
            <button
              className="inline-flex align-items-center justify-content-center"
              style={{
                display: "inline-flex",
                whiteSpace: "nowrap",
                padding: "6px 14px",
                border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                backgroundColor: active === "kanban" ? "var(--Palette2-TealBlue-900, #00C0C6)" : "#fff",
                color: active === "kanban" ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                transition: "all .15s ease",
              }}
              onClick={() => setActive("kanban")}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--Palette2-TealBlue-900, #00C0C6)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = active === "kanban" ? "var(--Palette2-TealBlue-900, #00C0C6)" : "#fff";
                e.currentTarget.style.color = active === "kanban" ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)";
              }}
            >
              Kanban Board
            </button>

            {/* Calendar View */}
            <button
              className="inline-flex align-items-center justify-content-center"
              style={{
                display: "inline-flex",
                whiteSpace: "nowrap",
                padding: "6px 14px",
                border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                backgroundColor: active === "calendar" ? "var(--Palette2-TealBlue-900, #00C0C6)" : "#fff",
                color: active === "calendar" ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                transition: "all .15s ease",
              }}
              onClick={() => setActive("calendar")}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--Palette2-TealBlue-900, #00C0C6)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = active === "calendar" ? "var(--Palette2-TealBlue-900, #00C0C6)" : "#fff";
                e.currentTarget.style.color = active === "calendar" ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)";
              }}
            >
              Calendar View
            </button>

          </div>

          {/* Customize button on the right */}
          <button
            ref={buttonRef}
            className="customize-btn d-inline-flex align-items-center gap-2"
            style={{
              padding: "8px 14px",
              background: "#fff",
              color: "#3B4A66",
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              borderRadius: 12,
              // boxShadow: "0 2px 8px rgba(59,74,102,0.06)",
              fontWeight: 600,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowCustomize(v => !v);
            }}
          >
            <span className="d-inline-flex"><Customize /></span>
            Customize
          </button>
        </div>

        {showCustomize && (
          <div
            ref={modalRef}
            className="customize-modal p-3"
            style={{
              position: "fixed",
              right: 32,
              top: 100,
              width: 280,
              border: "1px solid #E8F0FF",
              borderRadius: 12,
              background: "#fff",
              // boxShadow: "0 8px 24px rgba(59,74,102,0.15)",
              zIndex: 1050,
            }}
          >
            <div className="mb-2 fw-semibold" style={{ color: "#3B4A66" }}>Layout Settings</div>
            <div className="d-flex flex-column gap-2 mb-3 small text-muted">
              <label className="d-flex align-items-center gap-2">
                <input
                  type="checkbox"
                  checked={checkboxes.pending}
                  onChange={() => setCheckboxes(prev => ({ ...prev, pending: !prev.pending }))}
                />
                Pending
              </label>
              <label className="d-flex align-items-center gap-2">
                <input
                  type="checkbox"
                  checked={checkboxes.inprogress}
                  onChange={() => setCheckboxes(prev => ({ ...prev, inprogress: !prev.inprogress }))}
                />
                In Progress
              </label>
              <label className="d-flex align-items-center gap-2">
                <input
                  type="checkbox"
                  checked={checkboxes.completed}
                  onChange={() => setCheckboxes(prev => ({ ...prev, completed: !prev.completed }))}
                />
                Completed
              </label>
              <label className="d-flex align-items-center gap-2">
                <input
                  type="checkbox"
                  checked={checkboxes.overdue}
                  onChange={() => setCheckboxes(prev => ({ ...prev, overdue: !prev.overdue }))}
                />
                Overdue
              </label>
            </div>
            <div className="mb-2 fw-semibold" style={{ color: "#3B4A66" }}>Reorder Statuses</div>
            <div className="small" style={{}}>
              {order.map((k, idx) => (
                <div key={k} className="d-flex align-items-center justify-content-between mb-1">
                  <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ cursor: 'grab', color: '#C2CCDE' }}>⋮⋮</span> {titleFor(k)}
                  </div>
                  {/* <div className="d-flex align-items-center" style={{ gap: 6 }}>
                    <button className="btn btn-sm btn-light" disabled={idx === 0} onClick={() => setOrder(o => { const n=[...o]; const t=n[idx-1]; n[idx-1]=n[idx]; n[idx]=t; return n; })}>↑</button>
                    <button className="btn btn-sm btn-light" disabled={idx === order.length-1} onClick={() => setOrder(o => { const n=[...o]; const t=n[idx+1]; n[idx+1]=n[idx]; n[idx]=t; return n; })}>↓</button>
                  </div> */}
                </div>
              ))}
            </div>
            <div className="d-flex justify-content-between mt-3">
              <button className="btn btn-light" style={{ border: "1px solid #E8F0FF", borderRadius: 8 }} onClick={() => { setVisible({ pending: true, inprogress: true, completed: true, overdue: true }); setOrder(defaultOrder); }}>Reset</button>
              <button className="btn btn-primary" style={{ background: "#FF7A2F", borderColor: "#FF7A2F", borderRadius: 8 }} onClick={() => setShowCustomize(false)}>Save</button>
            </div>
          </div>
        )}
      </div>
      {/* Kanban / Calendar sections */}
      {active === "kanban" && (
        <div className="mt-4">

          {/* Loading State */}
          {tasksLoading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading tasks...</p>
            </div>
          )}

          {/* Error State */}
          {tasksError && !tasksLoading && (
            <div className="d-flex align-items-center justify-content-between p-3 mb-3 rounded" style={{ backgroundColor: "#FEE2E2", border: "1px solid #FCA5A5" }}>
              <div>
                <strong style={{ color: "#DC2626" }}>Error:</strong> <span style={{ color: "#991B1B" }}>{tasksError}</span>
              </div>
              <button className="btn btn-sm" onClick={fetchReceivedTasks} style={{ backgroundColor: "#DC2626", color: "#fff", border: "none" }}>
                Retry
              </button>
            </div>
          )}

          {/* Kanban Board */}
          {!tasksLoading && !tasksError && (
           <div className="tasks-container d-flex justify-content-center">
           <div className="tasks-grid mt-3 w-100">
             {order.map((k) => (
               <div key={k} className="task-column">
                 <div className="task-column-card" style={{ background: bgForCol(k) }}>
                   <div className="task-column-body">
                     <h6 className="fw-semibold d-flex align-items-center task-column-title">
                       {iconFor(k)} {titleFor(k)} ({tasks[k].length})
                     </h6>
                     {tasks[k].length > 0 ? (
                       tasks[k].map((t) => (
                         <div key={t.id} className="card task-item" onClick={() => setSelectedTask(t)}>
                           <div className="card-body position-relative">
                             <div className="priority-badge">
                               {t.priority.toUpperCase()}
                             </div>
                             <div className="task-item-content d-flex align-items-start">
                               <span className="icon-circle"><Doc /></span>
                               <div className="task-text">
                                 <div className="task-title">{t.title}</div>
                                 <div className="task-meta d-flex align-items-center justify-content-between">
                                   <span className="client-info d-flex align-items-center">
                                     <MiniContact /> <span className="client-name">{t.client}</span>
                                     <span className="ms-3 due-date">{t.due}</span>
                                   </span>
                                   <button className="btn btn-sm btn-light more-btn" onClick={(e) => { e.stopPropagation(); setSelectedTask(t); }}>
                                     <Dot />
                                   </button>
                                 </div>
                                 <div className="task-note">{t.note}</div>
                               </div>
                             </div>
                           </div>
                         </div>
                       ))
                     ) : (
                       <div className="text-center text-muted small no-tasks">
                         No {titleFor(k).toLowerCase()} tasks
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             ))}
           </div>
         </div>
         
          )}

          {/* Pagination */}
          {!tasksLoading && !tasksError && tasksPagination.total_pages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="text-muted small">
                Showing {((tasksPagination.page - 1) * tasksPagination.page_size) + 1} to {Math.min(tasksPagination.page * tasksPagination.page_size, tasksPagination.total_count)} of {tasksPagination.total_count} tasks
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setTasksPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={!tasksPagination.has_previous}
                >
                  Previous
                </button>
                <span className="d-flex align-items-center px-3">
                  Page {tasksPagination.page} of {tasksPagination.total_pages}
                </span>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setTasksPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={!tasksPagination.has_next}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {active === "calendar" && (
        <div className="text-muted mt-3">Calendar view coming soon.</div>
      )}


      {/* Task Details Modal */}
      {selectedTask && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px' }}>
              <div className="modal-header">
                <h5 className="modal-title fw-semibold" style={{ color: '#3B4A66' }}>{selectedTask.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedTask(null)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <span className="me-2 fw-medium" style={{ color: '#6B7280' }}>Client:</span>
                    <span>{selectedTask.client}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <span className="me-2 fw-medium" style={{ color: '#6B7280' }}>Due:</span>
                    <span>{selectedTask.due}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <span className="me-2 fw-medium" style={{ color: '#6B7280' }}>Priority:</span>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: selectedTask.priority.toLowerCase() === 'high' ? '#FEE2E2' :
                          selectedTask.priority.toLowerCase() === 'medium' ? '#FEF3C7' :
                            selectedTask.priority.toLowerCase() === 'low' ? '#D1FAE5' : '#F3F4F6',
                        color: selectedTask.priority.toLowerCase() === 'high' ? '#B91C1C' :
                          selectedTask.priority.toLowerCase() === 'medium' ? '#92400E' :
                            selectedTask.priority.toLowerCase() === 'low' ? '#065F46' : '#4B5563',
                        borderRadius: '12px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {selectedTask.priority}
                    </span>
                  </div>
                  <div className="mt-3">
                    <h6 className="fw-medium mb-2" style={{ color: '#4B5563' }}>Notes:</h6>
                    <div className="p-3" style={{ backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                      {selectedTask.note}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light"
                  style={{ border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  onClick={() => setSelectedTask(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#FF7A2F', borderColor: '#FF7A2F', borderRadius: '8px' }}
                  onClick={() => {
                    // Populate form with selected task data
                    if (selectedTask) {
                      const taskClientIds = selectedTask.clients_info && selectedTask.clients_info.length > 0
                        ? selectedTask.clients_info.map(c => c.id.toString())
                        : [];
                      
                      setFormData({
                        task_type: selectedTask.task_type || 'signature_request',
                        task_title: selectedTask.title || '',
                        client_ids: taskClientIds,
                        folder_id: selectedTask.folder_info?.id || '',
                        due_date: selectedTask.due_date ? selectedTask.due_date.split('T')[0] : '',
                        priority: selectedTask.priority?.toLowerCase() || '',
                        estimated_hours: selectedTask.estimated_hours || '',
                        description: selectedTask.note || '',
                        files: [],
                        spouse_signature_required: selectedTask.signature_requests_info?.some(sr => sr.spouse_signature_required) || false
                      });
                      
                      setSelectedFolderPath(selectedTask.folder_info?.title || selectedTask.folder_info?.name || '');
                      setEditingTaskId(selectedTask.id);
                      setIsEditMode(true);
                      setShowAddTaskModal(true);
                      setSelectedTask(null); // Close the details modal
                    }
                  }}
                >
                  Edit Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="modal" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1050,
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E8F0FF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              zIndex: 10,
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px'
            }}>
              <div>
                <h5 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#3B4A66',
                  lineHeight: '24px'
                }}>{isEditMode ? 'Edit Task' : 'Create New Task'}</h5>
                <p style={{
                  margin: '4px 0 0',
                  fontSize: '12px',
                  color: '#6B7280',
                  lineHeight: '16px'
                }}>{isEditMode ? 'Update task details' : 'Add a new task to your workflow'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddTaskModal(false);
                  setFormData({
                    task_type: 'signature_request',
                    task_title: '',
                    client_ids: [],
                    folder_id: '',
                    due_date: '',
                    priority: '',
                    estimated_hours: '',
                    description: '',
                    files: [],
                    spouse_signature_required: false
                  });
                  setSelectedFolderPath('');
                  setCreatingFolder(false);
                  setNewFolderName('');
                  setParentFolderForNewFolder(null);
                  setIsEditMode(false);
                  setEditingTaskId(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6B7280',
                  fontSize: '20px',
                  padding: '4px'
                }}
              >
                <Cut />
              </button>
            </div>

            {/* Form */}
            <div style={{ padding: '24px' }}>
              <form onSubmit={isEditMode ? updateTask : createTask}>
                {/* Task Type */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#4B5563'
                  }}>
                    Task Type <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    value={formData.task_type}
                    onChange={(e) => handleInputChange('task_type', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#111827',
                      backgroundColor: 'white',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239CA3AF\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '36px',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  >
                    <option value="signature_request">Signature Request</option>
                    <option value="review_request">Review Request</option>
                    <option value="document_request">Document Request</option>
                  </select>
                </div>

                {/* Spouse Signature Required Toggle - Only show for signature_request */}
                {formData.task_type === 'signature_request' && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#4B5563'
                    }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <input
                          type="checkbox"
                          checked={formData.spouse_signature_required || false}
                          onChange={(e) => handleSpouseSignatureToggle(e.target.checked)}
                          style={{
                            width: '44px',
                            height: '24px',
                            appearance: 'none',
                            backgroundColor: formData.spouse_signature_required ? '#00C0C6' : '#D1D5DB',
                            borderRadius: '12px',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            outline: 'none'
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            top: '2px',
                            left: formData.spouse_signature_required ? '22px' : '2px',
                            width: '20px',
                            height: '20px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        />
                      </div>
                      <span>Spouse's signature required</span>
                    </label>
                    <p style={{
                      margin: '4px 0 0 56px',
                      fontSize: '12px',
                      color: '#6B7280'
                    }}>
                      Enable this if the spouse also needs to sign the document
                    </p>
                  </div>
                )}

                {/* Task Title */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#4B5563'
                  }}>
                    Task Title <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.task_title}
                    onChange={(e) => handleInputChange('task_title', e.target.value)}
                    placeholder="Enter task title"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#4B5563'
                  }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter Description"
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#111827',
                      resize: 'vertical',
                      minHeight: '100px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      fontFamily: 'inherit',
                      lineHeight: '1.5'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  ></textarea>
                </div>

                {/* Client Multi-Select Dropdown */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#4B5563'
                  }}>
                    Clients <span style={{ color: 'red' }}>*</span>
                  </label>

                  {loadingClients ? (
                    <div style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#6B7280',
                      textAlign: 'center'
                    }}>
                      Loading clients...
                    </div>
                  ) : (
                    <div ref={clientDropdownRef} style={{ position: 'relative' }}>
                      <div
                        style={{
                          width: '100%',
                          minHeight: '44px',
                          padding: '8px 12px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: 'white',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s',
                          alignItems: 'center'
                        }}
                        onClick={() => setShowClientDropdown(!showClientDropdown)}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                      >
                        {/* Display selected client chips */}
                        {formData.client_ids.length > 0 ? (
                          formData.client_ids.map((clientId) => {
                            const client = clients.find(c => c.id.toString() === clientId.toString());
                            if (!client) return null;
                            return (
                              <span
                                key={clientId}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  backgroundColor: '#E0F2FE',
                                  color: '#0369A1',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInputChange('client_ids', formData.client_ids.filter(id => id !== clientId));
                                }}
                              >
                                {client.initials || `${client.first_name?.[0] || ''}${client.last_name?.[0] || ''}`} - {client.first_name} {client.last_name}
                                <span style={{ cursor: 'pointer', fontSize: '14px', marginLeft: '2px' }}>×</span>
                              </span>
                            );
                          })
                        ) : (
                          <span style={{ color: '#9CA3AF', fontSize: '14px' }}>
                            Select one or more clients
                          </span>
                        )}

                        <span style={{ color: '#9CA3AF', fontSize: '14px', marginLeft: 'auto' }}>
                          <i className={`bi bi-chevron-${showClientDropdown ? 'up' : 'down'}`}></i>
                        </span>
                      </div>

                      {/* Dropdown menu */}
                      {showClientDropdown && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 1000
                        }}>
                          {clients.length === 0 ? (
                            <div style={{ padding: '12px', color: '#6B7280', fontSize: '14px', textAlign: 'center' }}>
                              No clients available
                            </div>
                          ) : (
                            clients.map((client) => {
                              const isSelected = formData.client_ids.includes(client.id.toString());
                              return (
                                <div
                                  key={client.id}
                                  onClick={() => {
                                    if (isSelected) {
                                      handleInputChange('client_ids', formData.client_ids.filter(id => id !== client.id.toString()));
                                    } else {
                                      handleInputChange('client_ids', [...formData.client_ids, client.id.toString()]);
                                    }
                                  }}
                                  style={{
                                    padding: '10px 12px',
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? '#E0F2FE' : 'white',
                                    borderBottom: '1px solid #F3F4F6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.backgroundColor = 'white';
                                    }
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => { }}
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      cursor: 'pointer'
                                    }}
                                  />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                                      {client.first_name} {client.last_name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                      {client.email} {client.initials && `(${client.initials})`}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                      {formData.client_ids.length === 0 && (
                        <small style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                          Please select at least one client
                        </small>
                      )}

                      {formData.client_ids.length > 0 && (
                        <small style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                          {formData.client_ids.length} client(s) selected. Click to add or remove clients.
                        </small>
                      )}
                    </div>
                  )}
                </div>

                {/* Folder Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#4B5563'
                    }}>
                      Folder (Optional)
                    </label>
                    {!creatingFolder ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreatingFolder(true);
                          setParentFolderForNewFolder(formData.folder_id || null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3B82F6',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          padding: '4px 8px',
                          textDecoration: 'underline'
                        }}
                      >
                        Create New Folder
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Enter folder name"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          disabled={creatingFolderLoading}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newFolderName.trim() && !creatingFolderLoading) {
                              handleCreateFolder();
                            }
                            if (e.key === 'Escape') {
                              setCreatingFolder(false);
                              setNewFolderName('');
                              setParentFolderForNewFolder(null);
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            fontSize: '12px',
                            width: '120px',
                            outline: 'none'
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateFolder();
                          }}
                          disabled={creatingFolderLoading || !newFolderName.trim()}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: creatingFolderLoading || !newFolderName.trim() ? '#9CA3AF' : '#3B82F6',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: creatingFolderLoading || !newFolderName.trim() ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {creatingFolderLoading ? 'Creating...' : 'Add'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCreatingFolder(false);
                            setNewFolderName("");
                            setParentFolderForNewFolder(null);
                          }}
                          disabled={creatingFolderLoading}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            color: '#4B5563',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <div ref={folderDropdownRef} style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: '100%',
                        minHeight: '44px',
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                      }}
                      onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                    >
                      <span style={{ color: selectedFolderPath ? '#111827' : '#9CA3AF', fontSize: '14px' }}>
                        {selectedFolderPath || 'Select a folder (optional)'}
                      </span>
                      {selectedFolderPath && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFolderPath('');
                            handleInputChange('folder_id', '');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#6B7280',
                            cursor: 'pointer',
                            padding: '4px',
                            fontSize: '16px',
                            marginLeft: '8px'
                          }}
                        >
                          ×
                        </button>
                      )}
                      <FaChevronDown
                        size={12}
                        style={{
                          color: '#9CA3AF',
                          marginLeft: '8px',
                          transform: showFolderDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}
                      />
                    </div>

                    {/* Folder dropdown menu */}
                    {showFolderDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        padding: '8px'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          marginBottom: '8px',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Folders
                        </div>
                        {loadingFolders ? (
                          <div style={{ padding: '12px', color: '#6B7280', fontSize: '14px', textAlign: 'center' }}>
                            Loading folders...
                          </div>
                        ) : folderTree.length === 0 ? (
                          <div style={{ padding: '12px', color: '#6B7280', fontSize: '14px', textAlign: 'center' }}>
                            No folders available
                          </div>
                        ) : (
                          renderFolderTree(folderTree)
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority, Due Date, and Estimated Hours in one row */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  {/* Priority */}
                  <div style={{ flex: 1 }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#4B5563'
                    }}>
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#111827',
                        backgroundColor: 'white',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239CA3AF\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '36px',
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    >
                      <option value="">Select Priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* Due Date */}
                  <div style={{ flex: 1 }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#4B5563'
                    }}>
                      Due Date
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => handleInputChange('due_date', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#111827',
                          backgroundColor: 'white',
                          appearance: 'none',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                        onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                      />
                    </div>
                  </div>

                  {/* Estimated Hours */}
                  <div style={{ flex: 1 }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#4B5563'
                    }}>
                      Est. Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.estimated_hours}
                      onChange={(e) => handleInputChange('estimated_hours', e.target.value)}
                      placeholder="0.0"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#111827',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    />
                  </div>
                </div>

                {/* File Upload - Hidden for document_request */}
                {formData.task_type !== 'document_request' && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#4B5563'
                    }}>
                      Files
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleInputChange('files', e.target.files)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        cursor: 'pointer',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    />
                    {formData.files.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>
                        {formData.files.length} file(s) selected
                      </div>
                    )}
                  </div>
                )}


              </form>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #E8F0FF',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              position: 'sticky',
              bottom: 0,
              backgroundColor: 'white',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddTaskModal(false);
                  setFormData({
                    task_type: 'signature_request',
                    task_title: '',
                    client_ids: [],
                    folder_id: '',
                    due_date: '',
                    priority: '',
                    estimated_hours: '',
                    description: '',
                    files: [],
                    spouse_signature_required: false
                  });
                  setSelectedFolderPath('');
                  setCreatingFolder(false);
                  setNewFolderName('');
                  setParentFolderForNewFolder(null);
                  setIsEditMode(false);
                  setEditingTaskId(null);
                }}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  color: '#4B5563',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
                }}
                onMouseOver={(e) => {
                  e.target.backgroundColor = '#F9FAFB';
                  e.target.borderColor = '#D1D5DB';
                }}
                onMouseOut={(e) => {
                  e.target.backgroundColor = 'white';
                  e.target.borderColor = '#E5E7EB';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={isEditMode ? updateTask : createTask}
                disabled={loading}
                style={{
                  padding: '10px 16px',
                  backgroundColor: loading ? '#9CA3AF' : '#FF7A2F',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s, transform 0.1s',
                  opacity: loading ? 0.7 : 1,
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#E56D28';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#FF7A2F';
                  }
                }}
                onMouseDown={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'scale(0.98)';
                  }
                }}
                onMouseUp={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
              >
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Task' : 'Create Task')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
