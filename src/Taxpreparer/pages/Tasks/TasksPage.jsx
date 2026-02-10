import React, { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Task1, Clocking, Completed, Overdue, Progressing, Customize, Doc, Pendinge, Progressingg, Completeded, Overduer, MiniContact, Dot, AddTask, Cut, Msg } from "../../component/icons";
import { FaChevronDown, FaChevronRight, FaChevronLeft, FaFolder, FaSearch, FaUpload, FaTimes, FaCheckCircle, FaEye, FaCheck, FaRedo, FaFilePdf } from "react-icons/fa";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError, taxPreparerClientAPI, taskDetailAPI } from "../../../ClientOnboarding/utils/apiUtils";
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
  .calendar-grid {
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
  }
  
  .calendar-day {
    transition: background-color 0.1s ease;
  }
  
  .calendar-day:hover {
    background-color: #F8FAFC;
  }
  
  .calendar-task-item {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
  }
`;

const CalendarView = ({ tasksList, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const days = [];
    const prevMonthLastDate = new Date(year, month, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDate - i, current: false, date: new Date(year, month - 1, prevMonthLastDate - i) });
    }
    for (let i = 1; i <= lastDate; i++) {
      days.push({ day: i, current: true, date: new Date(year, month, i) });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, current: false, date: new Date(year, month + 1, i) });
    }
    return days;
  };

  const navigateMonth = (step) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + step, 1));
  };

  const days = getDaysInMonth(currentDate);

  const tasksByDate = tasksList.reduce((acc, task) => {
    if (task.due_date || task.due) {
      const dueStr = task.due_date || task.due;
      const d = new Date(dueStr);
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
      }
    }
    return acc;
  }, {});

  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'high':
        return { bg: '#EF4444', text: '#FFFFFF', border: '#B91C1C' };
      case 'medium':
        return { bg: '#F59E0B', text: '#FFFFFF', border: '#B45309' };
      case 'low':
      default:
        return { bg: '#10B981', text: '#FFFFFF', border: '#059669' };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans">
      {/* Calendar Header */}
      <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <h3 className="m-0 fw-bold text-dark" style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>
            {monthNames[currentDate.getMonth()]}
          </h3>
          <span className="text-secondary" style={{ fontSize: '1.5rem', fontWeight: '300' }}>
            {currentDate.getFullYear()}
          </span>
        </div>
        <div className="d-flex align-items-center gap-2 bg-light rounded-pill p-1 border">
          <button
            className="btn  btn-link text-dark text-decoration-none rounded-circle d-flex align-items-center justify-content-center p-0"
            style={{ width: '32px', height: '32px' }}
            onClick={() => navigateMonth(-1)}
          >
            <FaChevronDown style={{ transform: 'rotate(90deg)', fontSize: '12px' }} />
          </button>
          <button
            className="btn  btn-white text-dark fw-bold px-3 py-1 shadow-sm rounded-pill"
            style={{ fontSize: '0.85rem' }}
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </button>
          <button
            className="btn  btn-link text-dark text-decoration-none rounded-circle d-flex align-items-center justify-content-center p-0"
            style={{ width: '32px', height: '32px' }}
            onClick={() => navigateMonth(1)}
          >
            <FaChevronDown style={{ transform: 'rotate(-90deg)', fontSize: '12px' }} />
          </button>
        </div>
      </div>

      {/* Days Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB'
        }}
      >
        {dayNames.map(d => (
          <div key={d} className="py-3 text-center text-secondary small fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
            {d.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          backgroundColor: '#E5E7EB', // Grid lines color
          gap: '1px', // Create grid lines
          borderBottom: '1px solid #E5E7EB'
        }}
      >
        {days.map((d, i) => {
          const key = `${d.date.getFullYear()}-${d.date.getMonth()}-${d.date.getDate()}`;
          const dayTasks = tasksByDate[key] || [];
          const isToday = d.date.toDateString() === new Date().toDateString();
          const isWeekend = d.date.getDay() === 0 || d.date.getDay() === 6;

          return (
            <div
              key={i}
              className={`bg-white p-2 d-flex flex-column transition-all`}
              style={{
                minHeight: '130px',
                backgroundColor: !d.current ? '#F9FAFB' : '#FFFFFF', // Lighter background for non-current days
                opacity: !d.current ? 0.7 : 1,
              }}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div
                  className={`d-flex align-items-center justify-content-center fw-semibold ${isToday ? 'shadow-sm' : ''}`}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: isToday ? '#00C0C6' : 'transparent', // Using brand color
                    color: isToday ? '#FFFFFF' : (d.current ? '#1F2937' : '#9CA3AF'),
                    fontSize: '0.85rem'
                  }}
                >
                  {d.day}
                </div>
                {dayTasks.length > 0 && (
                  <span className="badge bg-light text-secondary border rounded-pill" style={{ fontSize: '0.65rem' }}>
                    {dayTasks.length}
                  </span>
                )}
              </div>

              <div className="d-flex flex-column gap-1 overflow-auto custom-scrollbar" style={{ flex: 1, maxHeight: '90px' }}>
                {dayTasks.map(t => {
                  const style = getPriorityInfo(t.priority);
                  return (
                    <div
                      key={t.id}
                      className="px-2 py-1 rounded"
                      style={{
                        backgroundColor: style.bg,
                        color: style.text,
                        borderLeft: `3px solid ${style.text}`, // Cleaner border indicator
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '2px',
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      onClick={(e) => { e.stopPropagation(); onTaskClick(t); }}
                      title={t.title || t.task_title}
                    >
                      {t.title || t.task_title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function TasksPage() {
  const [searchParams] = useSearchParams();
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
    description: '',
    files: [],
    spouse_signature_required: false
  });

  // Document upload state for document requests
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [documentCategories, setDocumentCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);

  // Preview, approve, re-request state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showReRequestModal, setShowReRequestModal] = useState(false);
  const [reRequestComments, setReRequestComments] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const [tasks, setTasks] = useState({
    pending: [],
    inprogress: [],
    completed: [],
    overdue: []
  });

  // Kanban localized pagination
  const [kanbanPages, setKanbanPages] = useState({
    pending: 1,
    inprogress: 1,
    completed: 1,
    overdue: 1
  });
  const KANBAN_PAGE_SIZE = 2;

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
            description: task.description || '',
            task_type: task.task_type,
            status: task.status,
            created_by: task.created_by_name || 'Admin',
            folder_info: task.folder_info,
            clients_info: task.clients_info || [],
            due_date: task.due_date,
            estimated_hours: task.estimated_hours,
            signature_requests_info: task.signature_requests_info || [],
            files: task.files || [],
            submission_info: task.submission_info || null,
            completed_at: task.completed_at || null,
            comments: task.comments || []
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

        // Reset kanban pagination when fetching new data
        setKanbanPages({
          pending: 1,
          inprogress: 1,
          completed: 1,
          overdue: 1
        });

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

  // Handle auto-scroll to specific section from query params
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && active === 'kanban' && !tasksLoading) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // Optional: Add a brief highlight effect
          element.style.transition = 'background-color 0.5s ease';
          const originalBg = element.style.background;
          element.style.background = '#FFF4E6'; // Light gold highlight
          setTimeout(() => {
            element.style.background = originalBg;
          }, 2000);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, active, tasksLoading]);


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

      const result = await response.json();

      // Check if API returned success: false with errors
      if (!response.ok || (result.success === false && result.errors)) {
        // Extract all error messages from the errors object
        const errorMessages = [];

        if (result.errors && typeof result.errors === 'object') {
          Object.keys(result.errors).forEach(field => {
            const fieldErrors = result.errors[field];
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach(err => errorMessages.push(err));
            } else if (typeof fieldErrors === 'string') {
              errorMessages.push(fieldErrors);
            }
          });
        }

        // Show all error messages in toast notifications
        if (errorMessages.length > 0) {
          errorMessages.forEach(msg => {
            toast.error(msg, { position: "top-right", autoClose: 5000 });
          });
        } else {
          // Fallback to general error message
          toast.error(result.message || result.detail || 'Failed to update task. Please try again.', { position: "top-right", autoClose: 5000 });
        }

        // Mark that errors have been shown and throw
        const error = new Error(result.message || result.detail || `HTTP error! status: ${response.status}`);
        error.errorsShown = true;
        throw error;
      }

      console.log('Task updated successfully:', result);

      // Reset form and close modal
      setFormData({
        task_type: 'signature_request',
        task_title: '',
        client_ids: [],
        folder_id: '',
        due_date: '',
        priority: '',
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
      // Only show generic error if we haven't already shown specific errors
      if (!error.errorsShown) {
        const errorMessage = handleAPIError(error);
        toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to update task. Please try again.'), { position: "top-right", autoClose: 5000 });
      }
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

      const result = await response.json();

      // Check if API returned success: false with errors
      if (!response.ok || (result.success === false && result.errors)) {
        // Extract all error messages from the errors object
        const errorMessages = [];

        if (result.errors && typeof result.errors === 'object') {
          Object.keys(result.errors).forEach(field => {
            const fieldErrors = result.errors[field];
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach(err => errorMessages.push(err));
            } else if (typeof fieldErrors === 'string') {
              errorMessages.push(fieldErrors);
            }
          });
        }

        // Show all error messages in toast notifications
        if (errorMessages.length > 0) {
          errorMessages.forEach(msg => {
            toast.error(msg, { position: "top-right", autoClose: 5000 });
          });
        } else {
          // Fallback to general error message
          toast.error(result.message || result.detail || 'Failed to create task. Please try again.', { position: "top-right", autoClose: 5000 });
        }

        // Mark that errors have been shown and throw
        const error = new Error(result.message || result.detail || `HTTP error! status: ${response.status}`);
        error.errorsShown = true;
        throw error;
      }

      console.log('Task created successfully:', result);

      // Reset form and close modal
      setFormData({
        task_type: 'signature_request',
        task_title: '',
        client_ids: [],
        folder_id: '',
        due_date: '',
        priority: '',
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
      // Only show generic error if we haven't already shown specific errors
      if (!error.errorsShown) {
        const errorMessage = handleAPIError(error);
        toast.error(typeof errorMessage === 'string' ? errorMessage : (errorMessage?.message || 'Failed to create task. Please try again.'), { position: "top-right", autoClose: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection for document upload
  const handleDocumentFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setUploadFiles(prev => [...prev, ...selectedFiles]);
    e.target.value = ''; // Reset input
  };

  // Remove file from upload list
  const removeUploadFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Submit/Complete document request
  const handleSubmitDocumentRequest = async () => {
    if (!selectedTask) {
      toast.error('No task selected', { position: "top-right", autoClose: 3000 });
      return;
    }

    try {
      setLoading(true);
      const response = await taskDetailAPI.updateTaskStatus(selectedTask.id, 'completed');

      if (response.success) {
        toast.success(response.message || 'Document request submitted successfully!', { position: "top-right", autoClose: 3000 });
        setSelectedTask(null);
        // Refresh tasks list
        fetchReceivedTasks();
      } else {
        throw new Error(response.message || 'Failed to submit document request');
      }
    } catch (error) {
      console.error('Error submitting document request:', error);
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg || 'Failed to submit document request', { position: "top-right", autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  // Upload documents for document request task
  const handleUploadDocumentsForRequest = async () => {
    if (uploadFiles.length === 0) {
      toast.error('Please select at least one file to upload', { position: "top-right", autoClose: 3000 });
      return;
    }

    if (!selectedTask || !selectedTask.clients_info || selectedTask.clients_info.length === 0) {
      toast.error('Client information is missing', { position: "top-right", autoClose: 3000 });
      return;
    }

    try {
      setUploadingDocuments(true);
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();

      // Get client ID from task
      const clientId = selectedTask.clients_info[0]?.id;
      if (!clientId) {
        throw new Error('Client ID is missing');
      }

      formData.append('client_id', clientId.toString());

      // Add all files
      uploadFiles.forEach(file => {
        formData.append('files', file);
      });

      // Create documents_metadata array - one entry per file
      // Using folder_id from task if available, otherwise null
      const folderId = selectedTask.folder_info?.id || null;
      const documentsMetadata = uploadFiles.map(() => ({
        category_id: selectedCategory || null,
        folder_id: folderId || selectedFolder || null
      }));

      formData.append('documents_metadata', JSON.stringify(documentsMetadata));

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: formData
      };

      const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/tax-preparer/documents/upload/`, config);
      const result = await response.json();

      if (!response.ok || (result.success === false && result.errors)) {
        // Extract all error messages from the errors object
        const errorMessages = [];

        if (result.errors && typeof result.errors === 'object') {
          Object.keys(result.errors).forEach(field => {
            const fieldErrors = result.errors[field];
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach(err => errorMessages.push(err));
            } else if (typeof fieldErrors === 'string') {
              errorMessages.push(fieldErrors);
            }
          });
        }

        // Show all error messages in toast notifications
        if (errorMessages.length > 0) {
          errorMessages.forEach(msg => {
            toast.error(msg, { position: "top-right", autoClose: 5000 });
          });
        } else {
          toast.error(result.message || result.detail || 'Failed to upload documents. Please try again.', { position: "top-right", autoClose: 5000 });
        }
        return;
      }

      if (result.success) {
        toast.success(result.message || 'Documents uploaded successfully!', { position: "top-right", autoClose: 3000 });
        setShowDocumentUploadModal(false);
        setUploadFiles([]);
        setSelectedCategory(null);
        setSelectedFolder(null);
        setSelectedTask(null);
        // Refresh tasks list
        fetchReceivedTasks();
      } else {
        throw new Error(result.message || 'Failed to upload documents');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error(handleAPIError(error) || 'Failed to upload documents', { position: "top-right", autoClose: 5000 });
    } finally {
      setUploadingDocuments(false);
    }
  };

  // Handle approve task
  const handleApproveTask = async () => {
    if (!selectedTask || !selectedTask.id) {
      toast.error('No task selected', { position: "top-right", autoClose: 3000 });
      return;
    }

    try {
      setProcessingAction(true);
      const response = await taskDetailAPI.updateTaskStatus(selectedTask.id, 'completed');

      if (response.success) {
        toast.success(response.message || 'Task approved successfully!', { position: "top-right", autoClose: 3000 });
        setShowApproveModal(false);
        setSelectedTask(null);
        // Refresh tasks list
        fetchReceivedTasks();
      } else {
        throw new Error(response.message || 'Failed to approve task');
      }
    } catch (error) {
      console.error('Error approving task:', error);
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg || 'Failed to approve task', { position: "top-right", autoClose: 5000 });
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle re-request document
  const handleReRequestDocument = async () => {
    if (!selectedTask || !selectedTask.id) {
      toast.error('No task selected', { position: "top-right", autoClose: 3000 });
      return;
    }

    if (!reRequestComments.trim()) {
      toast.error('Please provide comments for the re-request', { position: "top-right", autoClose: 3000 });
      return;
    }

    try {
      setProcessingAction(true);
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Step 1: Update task status to pending
      const statusResponse = await taskDetailAPI.updateTaskStatus(selectedTask.id, 'pending');

      if (!statusResponse.success) {
        throw new Error(statusResponse.message || 'Failed to update task status');
      }

      // Step 2: Add comment with re-request reason
      const commentConfig = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: reRequestComments,
          mentioned_user_ids: []
        })
      };

      const commentResponse = await fetchWithCors(`${API_BASE_URL}/firm/tasks/${selectedTask.id}/comments/`, commentConfig);
      const commentResult = await commentResponse.json();

      if (!commentResponse.ok || !commentResult.success) {
        // Status was updated but comment failed - still show success but warn about comment
        console.warn('Status updated but comment failed:', commentResult);
        toast.warning('Task status updated but comment may not have been added', { position: "top-right", autoClose: 5000 });
      }

      toast.success('Document re-requested successfully!', { position: "top-right", autoClose: 3000 });
      setShowReRequestModal(false);
      setReRequestComments('');
      setSelectedTask(null);
      // Refresh tasks list
      fetchReceivedTasks();
    } catch (error) {
      console.error('Error re-requesting document:', error);
      const errorMsg = handleAPIError(error);
      toast.error(errorMsg || 'Failed to re-request document', { position: "top-right", autoClose: 5000 });
    } finally {
      setProcessingAction(false);
    }
  };

  // Open preview modal
  const handlePreviewFile = (file) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };

  // Calculate stats from API data
  const stats = [
    {
      label: "Total",
      count: tasksStatistics.total_tasks || 0,
      icon: <Task1 />,
      color: "#4F46E5",
      key: "all"
    },
    {
      label: "Pending",
      count: tasksStatistics.pending || 0,
      icon: <Clocking />,
      color: "#F59E0B",
      key: "pending"
    },
    {
      label: "In Progress",
      count: tasksStatistics.in_progress || 0,
      icon: <Progressing />,
      color: "#3B82F6",
      key: "inprogress"
    },
    {
      label: "Completed",
      count: tasksStatistics.completed || 0,
      icon: <Completeded />,
      color: "#10B981",
      key: "completed"
    },
    {
      label: "Overdue",
      count: tasks.overdue.length || 0,
      icon: <Overduer />,
      color: "#EF4444",
      key: "overdue"
    },
  ];

  const handleStatClick = (key) => {
    if (key === 'all') return;

    if (active !== 'kanban') {
      setActive('kanban');
      // Wait for state update and render
      setTimeout(() => {
        const element = document.getElementById(key);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          // Add momentary highlight
          const card = element.querySelector('.task-column-card');
          if (card) {
            card.style.transition = 'box-shadow 0.3s ease';
            const originalShadow = card.style.boxShadow;
            card.style.boxShadow = `0 0 0 4px ${stats.find(s => s.key === key)?.color}40`;
            setTimeout(() => {
              card.style.boxShadow = originalShadow;
            }, 1500);
          }
        }
      }, 100);
    } else {
      const element = document.getElementById(key);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        // Add momentary highlight
        const card = element.querySelector('.task-column-card');
        if (card) {
          card.style.transition = 'box-shadow 0.3s ease';
          const originalShadow = card.style.boxShadow;
          card.style.boxShadow = `0 0 0 4px ${stats.find(s => s.key === key)?.color}40`;
          setTimeout(() => {
            card.style.boxShadow = originalShadow;
          }, 1500);
        }
      }
    }
  };
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
          <h4 className="fw-semibold" style={{ marginBottom: 4 }}>My Tasks</h4>
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
        {stats.filter(s => s.key === 'all' || checkboxes[s.key]).map((s, i) => (
          <div key={i} className="col-12 col-sm-6 col-md-4 col-lg-2-4" style={{ flex: '0 0 auto', width: '20%' }}>
            <div
              className="card h-100 border-0 shadow-sm"
              onClick={() => handleStatClick(s.key)}
              style={{
                borderRadius: 12,
                backgroundColor: "#fff",
                border: "1px solid #E8F0FF !important",
                cursor: s.key !== 'all' ? 'pointer' : 'default',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (s.key !== 'all') {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (s.key !== 'all') {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }
              }}
            >
              <div className="card-body p-3 d-flex align-items-center">
                <div className="stat-icon-wrapper rounded-3 d-flex align-items-center justify-content-center" style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: `${s.color}15`,
                  color: s.color,
                  flexShrink: 0
                }}>
                  {s.icon}
                </div>
                <div className="ms-3 overflow-hidden">
                  <div className="text-muted small fw-medium text-uppercase mb-0" style={{ letterSpacing: '0.025em' }}>{s.label}</div>
                  <div className="h4 mb-0 fw-bold" style={{ color: '#1E293B' }}>{s.count}</div>
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
                    <button className="btn  btn-light" disabled={idx === 0} onClick={() => setOrder(o => { const n=[...o]; const t=n[idx-1]; n[idx-1]=n[idx]; n[idx]=t; return n; })}>↑</button>
                    <button className="btn  btn-light" disabled={idx === order.length-1} onClick={() => setOrder(o => { const n=[...o]; const t=n[idx+1]; n[idx+1]=n[idx]; n[idx]=t; return n; })}>↓</button>
                  </div> */}
                </div>
              ))}
            </div>
            <div className="d-flex justify-content-between mt-3">
              <button className="btn btn-light" style={{ border: "1px solid #E8F0FF", borderRadius: 8 }} onClick={() => { setCheckboxes({ pending: true, inprogress: true, completed: true, overdue: true }); setOrder(defaultOrder); }}>Reset</button>
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
              <button className="btn " onClick={fetchReceivedTasks} style={{ backgroundColor: "#DC2626", color: "#fff", border: "none" }}>
                Retry
              </button>
            </div>
          )}

          {/* Kanban Board */}
          {!tasksLoading && !tasksError && (
            <div className="tasks-container d-flex justify-content-center">
              <div className="tasks-grid mt-3 w-100">
                {order.filter(k => checkboxes[k]).map((k) => (
                  <div key={k} id={k} className="task-column">
                    <div className="task-column-card" style={{ background: bgForCol(k) }}>
                      <div className="task-column-body">
                        <h6 className="fw-semibold d-flex align-items-center justify-content-between task-column-title">
                          <div className="d-flex align-items-center gap-2">
                            {iconFor(k)} {titleFor(k)} ({tasks[k].length})
                          </div>

                          {tasks[k].length > KANBAN_PAGE_SIZE && (
                            <div className="d-flex align-items-center gap-1">
                              <button
                                className="btn p-0 border-0 d-flex align-items-center justify-content-center"
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: '#E8F0FF',
                                  borderRadius: '4px',
                                  color: kanbanPages[k] > 1 ? '#00C0C6' : '#9CA3AF',
                                  cursor: kanbanPages[k] > 1 ? 'pointer' : 'not-allowed'
                                }}
                                onClick={() => kanbanPages[k] > 1 && setKanbanPages(prev => ({ ...prev, [k]: prev[k] - 1 }))}
                                disabled={kanbanPages[k] <= 1}
                              >
                                <FaChevronLeft size={12} />
                              </button>
                              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', minWidth: '30px', textAlign: 'center' }}>
                                {kanbanPages[k]}/{Math.ceil(tasks[k].length / KANBAN_PAGE_SIZE)}
                              </span>
                              <button
                                className="btn p-0 border-0 d-flex align-items-center justify-content-center"
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: '#E8F0FF',
                                  borderRadius: '4px',
                                  color: kanbanPages[k] < Math.ceil(tasks[k].length / KANBAN_PAGE_SIZE) ? '#00C0C6' : '#9CA3AF',
                                  cursor: kanbanPages[k] < Math.ceil(tasks[k].length / KANBAN_PAGE_SIZE) ? 'pointer' : 'not-allowed'
                                }}
                                onClick={() => kanbanPages[k] < Math.ceil(tasks[k].length / KANBAN_PAGE_SIZE) && setKanbanPages(prev => ({ ...prev, [k]: prev[k] + 1 }))}
                                disabled={kanbanPages[k] >= Math.ceil(tasks[k].length / KANBAN_PAGE_SIZE)}
                              >
                                <FaChevronRight size={12} />
                              </button>
                            </div>
                          )}
                        </h6>
                        {tasks[k].length > 0 ? (
                          tasks[k].slice((kanbanPages[k] - 1) * KANBAN_PAGE_SIZE, kanbanPages[k] * KANBAN_PAGE_SIZE).map((t) => (
                            <div key={t.id} className="task-item" onClick={() => setSelectedTask(t)}>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <span className={`priority-badge ${t.priority.toLowerCase()}`}>
                                  {t.priority}
                                </span>
                                <button className="btn p-0 border-0" onClick={(e) => { e.stopPropagation(); setSelectedTask(t); }}>
                                  <Dot />
                                </button>
                              </div>

                              <div className="task-title mb-2">{t.title}</div>

                              <div className="d-flex align-items-center gap-2 mb-2">
                                <span className="icon-circle" style={{ width: '24px', height: '24px' }}><Doc /></span>
                                <span className="text-muted small truncate" style={{ maxWidth: '150px' }}>{t.client}</span>
                              </div>

                              <div className="task-meta d-flex align-items-center justify-content-between pt-2 border-top">
                                <div className="d-flex align-items-center gap-1 text-muted small">
                                  <Clocking size={12} />
                                  <span>{t.due}</span>
                                </div>
                                {t.note && (
                                  <div className="text-muted small">
                                    <Msg size={12} />
                                  </div>
                                )}
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
                  className="btn  btn-outline-secondary"
                  onClick={() => setTasksPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={!tasksPagination.has_previous}
                >
                  Previous
                </button>
                <span className="d-flex align-items-center px-3">
                  Page {tasksPagination.page} of {tasksPagination.total_pages}
                </span>
                <button
                  className="btn  btn-outline-secondary"
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
        <div className="mt-4">
          <CalendarView
            tasksList={Object.entries(tasks)
              .filter(([key]) => checkboxes[key])
              .map(([, taskList]) => taskList)
              .flat()}
            onTaskClick={(t) => setSelectedTask(t)}
          />
        </div>
      )}


      {/* Task Details Modal */}
      {selectedTask && (
        <div
          className="modal"
          style={{
            display: 'block',
            backgroundColor: 'rgba(0,0,0,0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050,
            overflow: 'auto',
            padding: '1rem'
          }}
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{
              maxWidth: '600px',
              width: '100%',
              margin: '0 auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content" style={{ borderRadius: '16px', maxHeight: '90vh', overflow: 'auto' }}>
              <div className="modal-header" style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10, borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                <h5 className="modal-title fw-semibold" style={{ color: '#3B4A66', fontSize: '1.125rem' }}>{selectedTask.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedTask(null)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2 flex-wrap" style={{ gap: '0.5rem' }}>
                    <span className="fw-medium" style={{ color: '#6B7280', fontSize: '0.875rem', minWidth: '80px' }}>Client:</span>
                    <span style={{ fontSize: '0.875rem', color: '#3B4A66', wordBreak: 'break-word' }}>{selectedTask.client}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2 flex-wrap" style={{ gap: '0.5rem' }}>
                    <span className="fw-medium" style={{ color: '#6B7280', fontSize: '0.875rem', minWidth: '80px' }}>Due:</span>
                    <span style={{ fontSize: '0.875rem', color: '#3B4A66' }}>{selectedTask.due}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2 flex-wrap" style={{ gap: '0.5rem' }}>
                    <span className="fw-medium" style={{ color: '#6B7280', fontSize: '0.875rem', minWidth: '80px' }}>Priority:</span>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: selectedTask.priority.toLowerCase() === 'high' ? '#EF4444' :
                          selectedTask.priority.toLowerCase() === 'medium' ? '#F59E0B' :
                            selectedTask.priority.toLowerCase() === 'low' ? '#10B981' : '#6B7280',
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '4px 12px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      {selectedTask.priority}
                    </span>
                  </div>
                  <div className="mt-3">
                    <h6 className="fw-medium mb-2" style={{ color: '#4B5563', fontSize: '0.875rem' }}>Description:</h6>
                    <div className="p-3" style={{ backgroundColor: '#F9FAFB', borderRadius: '8px', fontSize: '0.875rem', color: '#3B4A66', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {selectedTask.note || selectedTask.description || 'No description provided'}
                    </div>
                  </div>

                  {/* Task Instructions */}
                  <div className="mt-3">
                    <h6 className="fw-medium mb-2" style={{ color: '#4B5563', fontSize: '0.875rem' }}>Instructions:</h6>
                    <div className="p-3" style={{ backgroundColor: '#EEF2FF', borderRadius: '8px', fontSize: '0.875rem', color: '#3B4A66', border: '1px solid #C7D2FE' }}>
                      {selectedTask.instructions || (() => {
                        const instructionsMap = {
                          'client_onboarding': "Verify client personal information and review the completed questionnaire.",
                          'amendment_filing': "Review the original tax return and collect necessary amendment documents.",
                          'document_collection': "Upload or request all required documents from the client.",
                          'document_review': "Review submitted documents for accuracy and completeness.",
                          'document_request': "Wait for the client to upload the requested documents or follow up.",
                          'signature_request': "Ensure the document is signed by the client (and spouse if applicable).",
                        };
                        return instructionsMap[selectedTask.task_type] || "Complete the task requirements.";
                      })()}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-3">
                    <div className="d-flex align-items-center mb-2 flex-wrap" style={{ gap: '0.5rem' }}>
                      <span className="fw-medium" style={{ color: '#6B7280', fontSize: '0.875rem', minWidth: '80px' }}>Status:</span>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: selectedTask.status === 'completed' ? '#10B981' :
                            selectedTask.status === 'submitted' ? '#3B82F6' :
                              selectedTask.status === 'in_progress' ? '#F59E0B' :
                                selectedTask.status === 'pending' ? '#EF4444' : '#6B7280',
                          color: '#FFFFFF',
                          borderRadius: '12px',
                          padding: '4px 12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}
                      >
                        {selectedTask.status || 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Completed Task Details Section - Show for all completed tasks */}
                  {selectedTask.status === 'completed' && (
                    <div className="mt-4">
                      {/* Show documents if available (for document request tasks) */}
                      {selectedTask.task_type === 'document_request' && selectedTask.files && selectedTask.files.length > 0 && (
                        <>
                          <h6 className="fw-medium mb-3" style={{ color: '#4B5563', fontSize: '0.875rem' }}>Submitted Documents:</h6>
                          <div className="d-flex flex-column gap-2" style={{ maxWidth: '100%' }}>
                            {selectedTask.files.map((file, index) => (
                              <div
                                key={file.id || index}
                                className="d-flex align-items-center justify-content-between p-3"
                                style={{
                                  backgroundColor: '#F9FAFB',
                                  borderRadius: '8px',
                                  border: '1px solid #E5E7EB',
                                  flexWrap: 'wrap',
                                  gap: '0.75rem'
                                }}
                              >
                                <div className="d-flex align-items-center gap-2" style={{ flex: 1, minWidth: 0 }}>
                                  <FaFilePdf style={{ color: '#EF4444', fontSize: '20px', flexShrink: 0 }} />
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{
                                      fontWeight: '500',
                                      color: '#3B4A66',
                                      fontSize: '0.875rem',
                                      wordBreak: 'break-word',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}>
                                      {file.file_name || file.name || `Document ${index + 1}`}
                                    </div>
                                    {file.file_size && (
                                      <small style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                        {(file.file_size / 1024).toFixed(2)} KB
                                      </small>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="btn  btn-outline-primary d-flex align-items-center gap-2"
                                  onClick={() => handlePreviewFile(file)}
                                  style={{
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    padding: '0.375rem 0.75rem',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                  }}
                                >
                                  <FaEye />
                                  Preview
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Submission Info */}
                          {selectedTask.submission_info && (
                            <div className="mt-3 p-3" style={{ backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                              <div className="d-flex flex-column gap-2" style={{ fontSize: '0.875rem' }}>
                                {selectedTask.submission_info.submitted_by && (
                                  <div>
                                    <span style={{ color: '#6B7280', fontWeight: '500' }}>Submitted by: </span>
                                    <span style={{ color: '#3B4A66' }}>
                                      {selectedTask.submission_info.submitted_by.name || selectedTask.submission_info.submitted_by.email}
                                    </span>
                                  </div>
                                )}
                                {selectedTask.submission_info.submitted_at && (
                                  <div>
                                    <span style={{ color: '#6B7280', fontWeight: '500' }}>Submitted at: </span>
                                    <span style={{ color: '#3B4A66' }}>
                                      {new Date(selectedTask.submission_info.submitted_at).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                )}
                                {selectedTask.submission_info.file_count !== undefined && (
                                  <div>
                                    <span style={{ color: '#6B7280', fontWeight: '500' }}>Files submitted: </span>
                                    <span style={{ color: '#3B4A66' }}>{selectedTask.submission_info.file_count}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        </>
                      )}

                      {/* Show completed at info for all completed tasks */}
                      {selectedTask.completed_at && (
                        <div className="mt-3 p-3" style={{ backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                          <div style={{ fontSize: '0.875rem' }}>
                            <span style={{ color: '#6B7280', fontWeight: '500' }}>Completed at: </span>
                            <span style={{ color: '#3B4A66' }}>
                              {new Date(selectedTask.completed_at).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Show comments if available */}
                      {selectedTask.comments && selectedTask.comments.length > 0 && (
                        <div className="mt-4">
                          <h6 className="fw-medium mb-3" style={{ color: '#4B5563', fontSize: '0.875rem' }}>Comments:</h6>
                          <div className="d-flex flex-column gap-2">
                            {selectedTask.comments.map((comment, index) => (
                              <div
                                key={comment.id || index}
                                className="p-3"
                                style={{
                                  backgroundColor: '#F9FAFB',
                                  borderRadius: '8px',
                                  border: '1px solid #E5E7EB',
                                  fontSize: '0.875rem'
                                }}
                              >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <span style={{ fontWeight: '500', color: '#3B4A66' }}>
                                      {comment.created_by_name || comment.created_by || 'Unknown'}
                                    </span>
                                    {comment.created_at && (
                                      <small style={{ color: '#6B7280', marginLeft: '0.5rem' }}>
                                        {new Date(comment.created_at).toLocaleString('en-US', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </small>
                                    )}
                                  </div>
                                </div>
                                <div style={{ color: '#3B4A66', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                  {comment.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submitted Documents Section for Submitted Document Request Tasks */}
                  {selectedTask.task_type === 'document_request' && selectedTask.status === 'submitted' && selectedTask.files && selectedTask.files.length > 0 && (
                    <div className="mt-4">
                      <h6 className="fw-medium mb-3" style={{ color: '#4B5563' }}>Submitted Documents:</h6>
                      <div className="d-flex flex-column gap-2">
                        {selectedTask.files.map((file, index) => (
                          <div
                            key={file.id || index}
                            className="d-flex align-items-center justify-content-between p-3"
                            style={{ backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <FaFilePdf style={{ color: '#EF4444', fontSize: '20px' }} />
                              <div>
                                <div style={{ fontWeight: '500', color: '#3B4A66' }}>
                                  {file.file_name || file.name || `Document ${index + 1}`}
                                </div>
                                {file.file_size && (
                                  <small style={{ color: '#6B7280' }}>
                                    {(file.file_size / 1024).toFixed(2)} KB
                                  </small>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn  btn-outline-primary d-flex align-items-center gap-2"
                              onClick={() => handlePreviewFile(file)}
                              style={{ borderRadius: '6px' }}
                            >
                              <FaEye />
                              Preview
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 d-flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-success d-flex align-items-center gap-2"
                          style={{ backgroundColor: '#32B582', borderColor: '#32B582', borderRadius: '8px' }}
                          onClick={() => setShowApproveModal(true)}
                          disabled={processingAction}
                        >
                          <FaCheck />
                          Approve Task
                        </button>
                        <button
                          type="button"
                          className="btn btn-warning d-flex align-items-center gap-2"
                          style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: 'white', borderRadius: '8px' }}
                          onClick={() => setShowReRequestModal(true)}
                          disabled={processingAction}
                        >
                          <FaRedo />
                          Re-request Document
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Documents Section for Document Request Tasks (non-submitted, non-completed) */}
                  {selectedTask.task_type === 'document_request' && selectedTask.status !== 'submitted' && selectedTask.status !== 'completed' && (
                    <div className="mt-4 d-flex gap-2 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-primary d-flex align-items-center gap-2"
                        style={{ backgroundColor: '#00C0C6', borderColor: '#00C0C6', borderRadius: '8px' }}
                        onClick={() => {
                          setShowDocumentUploadModal(true);
                          setUploadFiles([]);
                          setSelectedCategory(null);
                          setSelectedFolder(selectedTask.folder_info?.id || null);
                        }}
                      >
                        <FaUpload />
                        Upload Documents
                      </button>
                      <button
                        type="button"
                        className="btn btn-success d-flex align-items-center gap-2"
                        style={{ backgroundColor: '#32B582', borderColor: '#32B582', borderRadius: '8px' }}
                        onClick={handleSubmitDocumentRequest}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <FaCheckCircle />
                            Submit Document Request
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div
                className="modal-footer border-0"
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}
              >
                <button
                  type="button"
                  className="btn btn-light"
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    padding: '0.5rem 1rem',
                    fontWeight: '500'
                  }}
                  onClick={() => {
                    setSelectedTask(null);
                    setShowDocumentUploadModal(false);
                    setUploadFiles([]);
                  }}
                >
                  Close
                </button>
                {selectedTask?.task_type !== 'document_request' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      backgroundColor: '#FF7A2F',
                      borderColor: '#FF7A2F',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      padding: '0.5rem 1rem',
                      fontWeight: '500'
                    }}
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="modal task-modal-mobile" style={{
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

                {/* Priority and Due Date in one row */}
                <div className="task-modal-row" style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
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
            <div className="task-modal-footer" style={{
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

      {/* Document Upload Modal for Document Request Tasks */}
      {showDocumentUploadModal && selectedTask && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: '16px' }}>
              <div className="modal-header">
                <h5 className="modal-title fw-semibold" style={{ color: '#3B4A66' }}>
                  Upload Documents for {selectedTask.title}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDocumentUploadModal(false);
                    setUploadFiles([]);
                    setSelectedCategory(null);
                    setSelectedFolder(null);
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <p className="text-muted small mb-3">
                    Upload documents for this document request. Files will be associated with the client and folder from the task.
                  </p>

                  {/* File Upload Area */}
                  <div className="mb-3">
                    <label className="form-label fw-medium mb-2" style={{ color: '#4B5563' }}>
                      Select Files <span className="text-danger">*</span>
                    </label>
                    <div
                      className="border border-dashed rounded p-4 text-center"
                      style={{
                        borderColor: '#E8F0FF',
                        cursor: 'pointer',
                        backgroundColor: '#F9FAFB',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#00C0C6';
                        e.currentTarget.style.backgroundColor = '#F0FDFF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#E8F0FF';
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onClick={() => document.getElementById('document-upload-input').click()}
                    >
                      <FaUpload size={32} style={{ color: '#00C0C6', marginBottom: '8px' }} />
                      <div style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px', color: '#3B4A66', fontWeight: '500' }}>
                        Click to upload files
                      </div>
                      <div style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                        PDF, XLSX, XLS, DOCX, JPG, JPEG, PNG (Max 10MB each)
                      </div>
                      <input
                        id="document-upload-input"
                        type="file"
                        className="d-none"
                        onChange={handleDocumentFileSelect}
                        multiple
                        accept=".pdf,.xlsx,.xls,.docx,.jpg,.jpeg,.png"
                      />
                    </div>
                  </div>

                  {/* Selected Files List */}
                  {uploadFiles.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label fw-medium mb-2" style={{ color: '#4B5563' }}>
                        Selected Files ({uploadFiles.length})
                      </label>
                      <div className="list-group">
                        {uploadFiles.map((file, index) => (
                          <div
                            key={index}
                            className="list-group-item d-flex justify-content-between align-items-center"
                            style={{ borderColor: '#E8F0FF' }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <Doc />
                              <div>
                                <div style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px', color: '#3B4A66' }}>
                                  {file.name}
                                </div>
                                <div style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px', color: '#6B7280' }}>
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn  btn-link text-danger p-0"
                              onClick={() => removeUploadFile(index)}
                              style={{ textDecoration: 'none' }}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Task Info */}
                  <div className="alert alert-info mb-0" style={{ backgroundColor: '#F0FDFF', borderColor: '#E8F0FF', color: '#3B4A66' }}>
                    <small>
                      <strong>Client:</strong> {selectedTask.clients_info?.[0]?.name || selectedTask.client || 'N/A'}<br />
                      <strong>Folder:</strong> {selectedTask.folder_info?.title || selectedTask.folder_info?.name || 'Default'}
                    </small>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light"
                  style={{ border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  onClick={() => {
                    setShowDocumentUploadModal(false);
                    setUploadFiles([]);
                    setSelectedCategory(null);
                    setSelectedFolder(null);
                  }}
                  disabled={uploadingDocuments}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#00C0C6', borderColor: '#00C0C6', borderRadius: '8px' }}
                  onClick={handleUploadDocumentsForRequest}
                  disabled={uploadingDocuments || uploadFiles.length === 0}
                >
                  {uploadingDocuments ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaUpload className="me-2" />
                      Upload Documents
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewFile && (
        <div
          className="modal"
          style={{
            display: 'block',
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 1060,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'auto'
          }}
          onClick={() => {
            setShowPreviewModal(false);
            setPreviewFile(null);
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{
              maxWidth: '95vw',
              width: '100%',
              margin: '1rem auto',
              height: 'calc(100vh - 2rem)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content"
              style={{
                borderRadius: '16px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '100%'
              }}
            >
              <div
                className="modal-header"
                style={{
                  flexShrink: 0,
                  borderBottom: '1px solid #E5E7EB',
                  padding: '1rem 1.5rem'
                }}
              >
                <h5 className="modal-title fw-semibold" style={{ color: '#3B4A66', fontSize: '1.125rem' }}>
                  {previewFile.file_name || previewFile.name || 'Document Preview'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewFile(null);
                  }}
                  aria-label="Close"
                  style={{ fontSize: '1.25rem' }}
                ></button>
              </div>
              <div
                className="modal-body"
                style={{
                  padding: 0,
                  flex: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <iframe
                  src={previewFile.preview_url || previewFile.file_url || previewFile.file}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    flex: 1,
                    minHeight: 0
                  }}
                  title="Document Preview"
                />
              </div>
              <div
                className="modal-footer border-0"
                style={{
                  flexShrink: 0,
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}
              >
                <button
                  type="button"
                  className="btn btn-light"
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewFile(null);
                  }}
                >
                  Close
                </button>
                <a
                  href={previewFile.file_url || previewFile.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: '#FF7A2F',
                    borderColor: '#FF7A2F',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FaFilePdf />
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedTask && (
        <div
          className="modal"
          style={{
            display: 'block',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1060,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'auto',
            padding: '1rem'
          }}
          onClick={() => setShowApproveModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{
              maxWidth: '500px',
              width: '100%',
              margin: '0 auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content" style={{ borderRadius: '16px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #E5E7EB', padding: '1rem 1.5rem' }}>
                <h5 className="modal-title fw-semibold" style={{ color: '#3B4A66', fontSize: '1.125rem' }}>
                  Approve Task
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowApproveModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#3B4A66', marginBottom: '0.5rem' }}>Are you sure you want to approve this document request task?</p>
                <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>This will mark the task as completed.</p>
              </div>
              <div
                className="modal-footer border-0"
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}
              >
                <button
                  type="button"
                  className="btn btn-light"
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    padding: '0.5rem 1rem',
                    fontWeight: '500'
                  }}
                  onClick={() => setShowApproveModal(false)}
                  disabled={processingAction}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  style={{
                    backgroundColor: '#32B582',
                    borderColor: '#32B582',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    padding: '0.5rem 1rem',
                    fontWeight: '500'
                  }}
                  onClick={handleApproveTask}
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Approving...
                    </>
                  ) : (
                    <>
                      <FaCheck className="me-2" />
                      Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Re-request Modal */}
      {showReRequestModal && selectedTask && (
        <div
          className="modal"
          style={{
            display: 'block',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1060,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'auto',
            padding: '1rem'
          }}
          onClick={() => {
            setShowReRequestModal(false);
            setReRequestComments('');
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{
              maxWidth: '500px',
              width: '100%',
              margin: '0 auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content" style={{ borderRadius: '16px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #E5E7EB', padding: '1rem 1.5rem' }}>
                <h5 className="modal-title fw-semibold" style={{ color: '#3B4A66', fontSize: '1.125rem' }}>
                  Re-request Document
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowReRequestModal(false);
                    setReRequestComments('');
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <p className="mb-3" style={{ fontSize: '0.875rem', color: '#3B4A66' }}>Please provide comments explaining why the document needs to be re-requested:</p>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Enter your comments here..."
                  value={reRequestComments}
                  onChange={(e) => setReRequestComments(e.target.value)}
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    width: '100%',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div
                className="modal-footer border-0"
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}
              >
                <button
                  type="button"
                  className="btn btn-light"
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    padding: '0.5rem 1rem',
                    fontWeight: '500'
                  }}
                  onClick={() => {
                    setShowReRequestModal(false);
                    setReRequestComments('');
                  }}
                  disabled={processingAction}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  style={{
                    backgroundColor: '#F59E0B',
                    borderColor: '#F59E0B',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    padding: '0.5rem 1rem',
                    fontWeight: '500'
                  }}
                  onClick={handleReRequestDocument}
                  disabled={processingAction || !reRequestComments.trim()}
                >
                  {processingAction ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaRedo className="me-2" />
                      Re-request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
