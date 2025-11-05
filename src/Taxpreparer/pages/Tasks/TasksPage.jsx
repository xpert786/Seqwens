import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Task1, Clocking, Completed, Overdue, Progressing, Customize, Doc, Pendinge, Progressingg, Completeded, Overduer, MiniContact, Dot, AddTask, Cut } from "../../component/icons";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";

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
  const [active, setActive] = useState("kanban");
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientDropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    task_type: 'signature_request',
    task_title: '',
    client_ids: [],
    folder_id: '',
    due_date: '',
    priority: '',
    estimated_hours: '',
    description: '',
    signature_fields: [],
    files: []
  });
  const [tasks, setTasks] = useState({
    pending: [
      { id: 1, title: "Review W-2 Documents", client: "John Doe", due: "Due Today", priority: "High", note: "Please upload all W-2 forms for 2023 tax year" },
      { id: 2, title: "Schedule Tax Review Meeting", client: "Sarah Wilson", due: "Due Today", priority: "Medium", note: "Please upload all W-2 forms for 2023 tax year" },
    ],
    inprogress: [
      { id: 3, title: "Review W-2 Documents", client: "John Doe", due: "Due Today", priority: "High", note: "Please upload all W-2 forms for 2023 tax year" },
    ],
    completed: [
      { id: 4, title: "Review W-2 Documents", client: "John Doe", due: "Due Today", priority: "High", note: "Please upload all W-2 forms for 2023 tax year" },
    ],
    overdue: [
      { id: 5, title: "Review W-2 Documents", client: "John Doe", due: "Due Today", priority: "High", note: "Please upload all W-2 forms for 2023 tax year" },
    ]
  });

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
    };

    // Add event listener when component mounts
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up event listener on unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomize, showClientDropdown]);

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

      const apiUrl = `${API_BASE_URL}/taxpayer/tax-preparer/clients/`;
      const response = await fetchWithCors(apiUrl, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.clients) {
        setClients(result.data.clients);
        console.log('Clients fetched successfully:', result.data.clients.length);
      } else {
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
    } else if (field === 'signature_fields') {
      // Handle signature fields - this would typically be built from a form
      try {
        const fields = typeof value === 'string' ? JSON.parse(value) : value;
        setFormData(prev => ({
          ...prev,
          signature_fields: Array.isArray(fields) ? fields : []
        }));
      } catch (e) {
        console.error('Invalid signature_fields JSON:', e);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Create task API call
  const createTask = async (e) => {
    e.preventDefault();

    if (!formData.task_title || !formData.client_ids || formData.client_ids.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create FormData for multipart/form-data request
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

      if (formData.signature_fields && formData.signature_fields.length > 0) {
        formDataToSend.append('signature_fields', JSON.stringify(formData.signature_fields));
      }

      // Append files (can be multiple files)
      if (formData.files && formData.files.length > 0) {
        formData.files.forEach((file) => {
          formDataToSend.append('files', file);
        });
      }

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
        signature_fields: [],
        files: []
      });
      setShowAddTaskModal(false);

      // Show success message
      alert('Task created successfully!');

      // Optionally refresh tasks list here
      // fetchTasks();

    } catch (error) {
      console.error('Error creating task:', error);
      alert(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: "Total",
      count: 5, // Sum of all tasks (2 pending + 1 in progress + 1 completed + 1 overdue)
      icon: <Task1 />,
      color: "#4F46E5" // Purple color for total
    },
    {
      label: "Pending",
      count: 2,
      icon: <Clocking />,
      color: "#F59E0B" // Amber color for pending
    },
    {
      label: "In Progress",
      count: 1,
      icon: <Progressing />,
      color: "#3B82F6" // Blue color for in progress
    },
    {
      label: "Completed",
      count: 1,
      icon: <Completeded />,
      color: "#10B981" // Green color for completed
    },
    {
      label: "Overdue",
      count: 1,
      icon: <Overduer />,
      color: "#EF4444" // Red color for overdue
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
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-semibold" style={{ marginBottom: 4 }}>My Tasks</h3>
          <small className="text-muted">Manage your assigned tasks and workflow</small>
        </div>
        <button
          onClick={() => setShowAddTaskModal(true)}
          className="btn dashboard-btn btn-upload d-flex align-items-center gap-2"
        >
          <AddTask />
          Create New Task
        </button>
      </div>

      {/* Stat cards row (Bootstrap grid) */}
      <div className="row g-3 mb-4">
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
        className="inline-block mt-4 w-100 position-relative"
        style={{ border: "none" }}
      >
        <div className="d-flex align-items-center justify-content-between w-100">
          <div className="d-inline-flex align-items-center gap-2 p-2 rounded-3"
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
            className="d-inline-flex align-items-center gap-2"
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
            className="p-3"
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
        <div className="d-flex justify-content-center">
          <div className="d-flex flex-wrap gap-3 mt-3" style={{ maxWidth: 'fit-content' }}>
            {order.map((k) => (
              <div key={k} className="col-auto">
                <div className="card" style={{ background: bgForCol(k), borderRadius: 18, border: "1px solid #E8F0FF", width: 'fit-content', minWidth: 280 }}>
                  <div className="card-body">
                    <h6 className="fw-semibold d-flex align-items-center mb-3" style={{ color: "#3B4A66", gap: 8 }}>
                      {iconFor(k)} {titleFor(k)} ({tasks[k].length})
                    </h6>
                    {tasks[k].map((t) => (
                      <div
                        key={t.id}
                        className="card mb-3 task-item"
                        style={{ border: "1px solid #E8F0FF", borderRadius: 14 }}
                        onClick={() => setSelectedTask(t)}
                      >
                        <div className="card-body position-relative p-3">
                          <div className="position-absolute" style={{ top: 10, right: 10, zIndex: 1 }}>
                            <span
                              className="badge text-white"
                              style={{
                                background: t.priority.toLowerCase() === 'high' ? '#EF4444' :
                                  t.priority.toLowerCase() === 'medium' ? '#F59E0B' :
                                    t.priority.toLowerCase() === 'low' ? '#10B981' : '#6B7280',
                                color: '#FFFFFF !important',
                                borderRadius: '20px',
                                padding: '3px 9px',
                                fontSize: '10px',
                                fontWeight: 700,
                                lineHeight: '14px',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                height: '20px',
                                border: 'none',
                                textTransform: 'uppercase',
                                WebkitFontSmoothing: 'antialiased',
                                // MozOsxFontSmoothing: 'grayscale'
                              }}
                            >
                              {t.priority}
                            </span>
                          </div>
                          <div className="d-flex align-items-start">
                            <span className="icon-circle" style={{ width: 28, height: 28, borderRadius: 8, background: "#EAF7FF", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#00C0C6" }}><Doc /></span>
                            <div style={{ minWidth: 0, flex: 1, marginLeft: 10 }}>
                              <div className="fw-semibold" style={{ color: "#3B4A66", whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere', fontSize: 14, lineHeight: '20px', paddingRight: 60 }}>{t.title}</div>
                              <div className="text-muted small d-flex align-items-center justify-content-between w-100 flex-wrap" style={{ gap: 12, marginTop: 6, marginBottom: 4 }}>
                                <span className="d-inline-flex align-items-center" style={{ gap: 6 }}>
                                  <MiniContact /> {t.client}
                                  <span className="ms-3">{t.due}</span>
                                </span>
                                <button className="btn btn-sm btn-light" style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #E8F0FF' }} aria-label="More options">
                                  <Dot />
                                </button>
                              </div>
                              <div className="text-muted small" style={{ whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{t.note}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                }}>Create New Task</h5>
                <p style={{
                  margin: '4px 0 0',
                  fontSize: '12px',
                  color: '#6B7280',
                  lineHeight: '16px'
                }}>Add a new task to your workflow</p>
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
                    signature_fields: [],
                    files: []
                  });
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
              <form onSubmit={createTask}>
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

                {/* Folder ID */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#4B5563'
                  }}>
                    Folder ID
                  </label>
                  <input
                    type="text"
                    value={formData.folder_id}
                    onChange={(e) => handleInputChange('folder_id', e.target.value)}
                    placeholder="Enter folder ID (optional)"
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

                {/* File Upload */}
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

                {/* Signature Fields (JSON input for advanced users) */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#4B5563'
                  }}>
                    Signature Fields (JSON - Optional)
                  </label>
                  <textarea
                    value={formData.signature_fields.length > 0 ? JSON.stringify(formData.signature_fields, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        if (e.target.value.trim()) {
                          const parsed = JSON.parse(e.target.value);
                          handleInputChange('signature_fields', parsed);
                        } else {
                          handleInputChange('signature_fields', []);
                        }
                      } catch (err) {
                        // Invalid JSON, but allow user to keep typing
                        console.warn('Invalid JSON:', err);
                      }
                    }}
                    placeholder='[{"field_type": "signature", "page_number": 1, "position_x": 10, "position_y": 80, "width": 200, "height": 50, "is_required": true, "label": "Taxpayer Signature"}]'
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#111827',
                      resize: 'vertical',
                      minHeight: '100px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      fontFamily: 'monospace',
                      lineHeight: '1.5'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  ></textarea>
                  <small style={{ color: '#6B7280', fontSize: '11px' }}>
                    Enter signature fields as JSON array (optional)
                  </small>
                </div>

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
                    signature_fields: [],
                    files: []
                  });
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
                onClick={createTask}
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
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
