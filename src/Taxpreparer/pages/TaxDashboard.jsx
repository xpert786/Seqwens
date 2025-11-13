import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TaxDashboardWidget from "../component/TaxDashboardWidegt";
import {
  FileIcon,
  Contacted,
  CompletedIcon,
  Building,
  Client,
  Msg,
  Clocking,
  Schedule,
  Analytics,
} from "../component/icons";
import { handleAPIError, dashboardAPI } from "../../ClientOnboarding/utils/apiUtils";
import "../styles/taxpopup.css";
import "../styles/taxdashboard.css";

// ------------------- Tasks ----------------------
const whatsDueTasks = [
  {
    title: "Review W-2 Documents",
    due: "Due: Today",
    user: (
      <span className="db-user">
        <span className="db-user-icon-wrapper"><Contacted /></span>
        John Doe
      </span>
    ),
    status: ["high", "pending"],
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
  {
    title: "Prepare Quarterly Return",
    due: "Due: Tomorrow",
    user: (
      <span className="db-user">
        <span className="db-user-icon-wrapper"><Building /></span>
        ABC Corp
      </span>
    ),
    status: ["high", "in progress"],
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
  {
    title: "Schedule Tax Review",
    due: "Due: 20/08/2025",
    user: (
      <span className="db-user">
        <span className="db-user-icon-wrapper"><Contacted /></span>
        Sarah Wilson
      </span>
    ),
    status: ["medium", "in progress"],
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
  {
    title: "Upload Tax Documents",
    due: "Due: 20/08/2025",
    user: (
      <span className="db-user">
        <span className="db-user-icon-wrapper"><Contacted /></span>
        Mike Johnson
      </span>
    ),
    status: ["low", "pending"],
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
];

const recentActivityTasks = [
  {
    title: "Quarterly Filing",
    due: "Due: 24/07/2025",
    user: (
      <span className="db-user">
        <span className="db-user-icon-wrapper"><Building /></span>
        ABC Corp
      </span>
    ),
    status: ["high"],
    value: "2 days left",
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
  {
    title: "Annual Return",
    due: "Due: 24/07/2025",
    value: "7 days left",
    user: (
      <span className="db-user">
        <span className="db-user-icon-wrapper"><Building /></span>
        XYZ LLC
      </span>
    ),
    status: ["medium"],
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
  {
    title: "Tax Review",
    due: "Due: 24/07/2025",
    value: "3 days left",
    user: (
      <span className="db-user">
        <span className="db-user-icon-wrapper"><Contacted /></span>
        Smith Family
      </span>
    ),
    status: ["low"],
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
];
const messages = [
  {
    name: "John Doe",
    role: "Client",
    content: "I uploaded my W-2 forms",
    icon: <Msg />,
    time: "1 hour ago",
    type: "client",
  },
  {
    name: "Sarah Wilson",
    role: "Client",
    content: "When can we schedule the review?",
    icon: <Msg />,
    time: "3 hours ago",
    type: "client",
  },
  {
    name: "Admin",
    role: "internal",
    content: "New client assigned to you",
    icon: <Msg />,
    time: "5 hours ago",
    type: "internal",
  },
];

// ------------------- Status Colors ----------------------
const statusColors = {
  high: "#DC2626",
  medium: "var(--color-yellow-400, #FBBF24)",
  low: "var(--color-green-500, #22C55E)",
  pending: "#854D0E",
  "in progress": "var(--color-green-500, #22C55E)",
};

// ------------------- Task Card ------------------------
const TaskCard = ({ title, due, status, user, icon, selected, onClick, singleStatus, value }) => {
  const displayStatus = singleStatus && Array.isArray(status) ? [status[0]] : status;

  return (
    <div
      className="rounded-3 p-3 car"
      onClick={onClick}
      style={{
        cursor: "pointer",
        backgroundColor: selected ? "var(--Palette2-Gold-200, #FFF4E6)" : "#fff",
        transition: "background-color 0.2s",
      }}
    >
      <div>


        <div className="d-flex justify-content-between align-items-start" style={{ gap: "1rem" }}>

          <div className="d-flex align-items-start gap-2" style={{ flex: 1 }}>
            {icon}

            <div className="task-title">{title}</div>


          </div>
          <div
            className="d-flex align-items-center"
            style={{
              gap: "0.5rem",
              flexShrink: 0,
              whiteSpace: "nowrap",
              alignSelf: "flex-start",
            }}
          >
            {displayStatus?.map((s, i) => (
              <span
                key={i}
                className="badge rounded-pill text-capitalize task-badge"
                style={{
                  backgroundColor: statusColors[s] || "#6B7280",
                  color: "#fff",
                  whiteSpace: "nowrap",
                }}
              >
                {s}
              </span>
            ))}

            {value && <h5 className="dashboard-card-value m-0">{value}</h5>}
          </div>

        </div>
        <div className="bother">
          <div className="task-due">{due}</div>
          <div className="task-usered">{user}</div>
        </div>
      </div>
      {/* <div className="d-flex justify-content-between align-items-start" style={{ gap: "1rem" }}>
      
        <div className="d-flex align-items-start gap-2" style={{ flex: 1 }}>
          {icon}
          
            <div className="task-title">{title}</div>
            
         
        </div>
        <div
          className="d-flex align-items-center"
          style={{
            gap: "0.5rem",
            flexShrink: 0,
            whiteSpace: "nowrap",
            alignSelf: "flex-start",
          }}
        >
          {displayStatus?.map((s, i) => (
            <span
              key={i}
              className="badge rounded-pill text-capitalize task-badge"
              style={{
                backgroundColor: statusColors[s] || "#6B7280",
                color: "#fff",
                whiteSpace: "nowrap",
              }}
            >
              {s}
            </span>
          ))}

          {value && <h5 className="dashboard-card-value m-0">{value}</h5>}
        </div>
       
      </div> */}


    </div>

  );
};

// ------------------- Main Dashboard --------------------
// ------------------- Main Dashboard --------------------
export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination states
  const [myTasksPage, setMyTasksPage] = useState(1);
  const [deadlinesPage, setDeadlinesPage] = useState(1);
  const [messagesPage, setMessagesPage] = useState(1);
  
  // Items per page
  const ITEMS_PER_PAGE = 3;

  useEffect(() => {
    const isFirstTime = localStorage.getItem("firstTimeUser");
    if (isFirstTime === "true") {
      navigate("/dashboard-first");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const result = await dashboardAPI.getTaxPreparerDashboard();

        if (result.success && result.data) {
          setMyTasks(result.data.my_tasks || []);
          setUpcomingDeadlines(result.data.upcoming_deadlines || []);
          setRecentMessages(result.data.recent_messages || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        handleAPIError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSelect = (taskTitle) => setSelectedTask(taskTitle);

  // Helper function to get priority color
  const getPriorityColor = (priority) => {
    const priorityLower = (priority || '').toLowerCase();
    if (priorityLower === 'high') return "#DC2626";
    if (priorityLower === 'medium') return "var(--color-yellow-400, #FBBF24)";
    if (priorityLower === 'low') return "var(--color-green-500, #22C55E)";
    return "#6B7280";
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'pending') return "#854D0E";
    if (statusLower === 'in progress' || statusLower === 'in_progress') return "var(--color-green-500, #22C55E)";
    return "#6B7280";
  };

  // Pagination helper functions
  const getPaginatedData = (data, page, itemsPerPage) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data, itemsPerPage) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  // Quick Actions data (static for now)
  const quickActions = [
    {
      icon: <Client className="action-icon" />,
      label: "View Client",
      path: '/taxdashboard/clients'
    },
    {
      icon: <FileIcon className="action-icon" />,
      label: "Documents",
      path: '/taxdashboard/documents'
    },
    {
      icon: <Schedule className="action-icon" />,
      label: "Schedule",
      path: '/taxdashboard/calendar'
    },
    {
      icon: <Analytics className="action-icon" />,
      label: "Tasks",
      path: '/taxdashboard/tasks'
    }
  ];

  // Pagination Component
  const PaginationControls = ({ currentPage, totalPages, onPageChange, sectionName }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="d-flex justify-content-center align-items-center gap-2 mt-3" style={{ paddingTop: '0.5rem', borderTop: '1px solid #E5E7EB' }}>
        <button
          className="btn btn-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            backgroundColor: currentPage === 1 ? '#E5E7EB' : '#F56D2D',
            color: currentPage === 1 ? '#9CA3AF' : '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '14px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.6 : 1
          }}
        >
          Previous
        </button>
        <span style={{ fontSize: '14px', color: '#4B5563', minWidth: '80px', textAlign: 'center' }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="btn btn-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            backgroundColor: currentPage === totalPages ? '#E5E7EB' : '#F56D2D',
            color: currentPage === totalPages ? '#9CA3AF' : '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '14px',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.6 : 1
          }}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="container-fluid px-2 px-md-2">
      <TaxDashboardWidget />

      <div className="row mt-1 g-3 px-4">
        {/* My Tasks */}
        <div className="col-12 col-md-6">
          <div className="card custom-card p-3 p-md-4 rounded-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h1 className="section-title mb-1">My Tasks</h1>
                <p className="section-subtitle m-0">Tasks assigned to you</p>
              </div>
              <button
                className="view-all-btn"
                onClick={() => navigate('/taxdashboard/tasks')}
              >
                View All
              </button>
            </div>
            <div className="d-flex flex-column gap-3">
              {loading ? (
                <div className="text-center py-3">Loading tasks...</div>
              ) : myTasks.length === 0 ? (
                <div className="text-center py-3">No tasks assigned</div>
              ) : (
                getPaginatedData(myTasks, myTasksPage, ITEMS_PER_PAGE).map((task, i) => {
                  const taskTitle = task.task_title || task.title || 'Untitled Task';
                  return (
                    <TaskCard
                      key={task.id || i}
                      title={taskTitle}
                      due={task.due_date_formatted || `Due: ${task.due_date || 'N/A'}`}
                      status={[task.priority_display || task.priority || 'medium', task.status_display || task.status || 'pending']}
                      user={(
                        <span className="db-user">
                          <span className="db-user-icon-wrapper"><Contacted /></span>
                          {task.client?.name || 'Unknown Client'}
                        </span>
                      )}
                      icon={<span className="icon-circle"><FileIcon /></span>}
                      selected={selectedTask === taskTitle}
                      onClick={() => handleSelect(taskTitle)}
                    />
                  );
                })
              )}
            </div>
            <PaginationControls
              currentPage={myTasksPage}
              totalPages={getTotalPages(myTasks, ITEMS_PER_PAGE)}
              onPageChange={setMyTasksPage}
              sectionName="myTasks"
            />
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="col-12 col-md-6">
          <div className="card custom-card upcoming-deadlines-card">
            <div className="mb-3">
              <h1 className="section-title mb-1">Upcoming Deadlines</h1>
              <p className="section-subtitle m-0">Important dates to remember</p>
            </div>
            <div className="upcoming-deadlines-container">
              {loading ? (
                <div className="text-center py-3">Loading deadlines...</div>
              ) : upcomingDeadlines.length === 0 ? (
                <div className="text-center py-3">No upcoming deadlines</div>
              ) : (
                getPaginatedData(upcomingDeadlines, deadlinesPage, ITEMS_PER_PAGE).map((deadline, i) => {
                  const deadlineTitle = deadline.title || 'Untitled';
                  return (
                    <TaskCard
                      key={deadline.id || i}
                      title={deadlineTitle}
                      due={deadline.due_date_formatted || `Due: ${deadline.due_date || 'N/A'}`}
                      status={[deadline.priority_display || deadline.priority || 'medium']}
                      value={deadline.time_left || deadline.days_left !== undefined ? `${deadline.days_left} days left` : ''}
                      user={(
                        <span className="db-user">
                          <span className="db-user-icon-wrapper"><Contacted /></span>
                          {deadline.client?.name || 'Unknown Client'}
                        </span>
                      )}
                      icon={<span className="icon-circle"><FileIcon /></span>}
                      singleStatus
                      selected={selectedTask === deadlineTitle}
                      onClick={() => handleSelect(deadlineTitle)}
                      className="upcoming-deadline-task"
                    />
                  );
                })
              )}
            </div>
            <PaginationControls
              currentPage={deadlinesPage}
              totalPages={getTotalPages(upcomingDeadlines, ITEMS_PER_PAGE)}
              onPageChange={setDeadlinesPage}
              sectionName="deadlines"
            />
          </div>

        </div>
      </div>

      {/* Bottom Section */}

      <div className="row mt-1 g-3 px-4">
        {/* Recent Messages */}

        <div className="col-12 col-md-6">
          <div className="card custom-card p-3 p-md-4 rounded-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h1 className="section-title mb-1">Recent Messages</h1>
                <p className="section-subtitle m-0">Latest client communications</p>
              </div>
              <button
                className="view-all-btn"
                onClick={() => navigate('/taxdashboard/messages')}
              >
                View All
              </button>
            </div>
            <div className="d-flex flex-column gap-2">
              {loading ? (
                <div className="text-center py-3">Loading messages...</div>
              ) : recentMessages.length === 0 ? (
                <div className="text-center py-3">No recent messages</div>
              ) : (
                getPaginatedData(recentMessages, messagesPage, ITEMS_PER_PAGE).map((msg, i) => {
                  const msgType = msg.sender?.role === 'client' || msg.sender_type === 'Client' ? 'client' : 'internal';
                  const senderName = msg.sender?.name || msg.sender_name || 'Unknown';
                  return (
                    <div
                      key={msg.id || i}
                      className={`rounded-3 p-3 car recent-msg-card ${msgType === "client" ? "client-msg" : "internal-msg"} p-2 rounded`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: msgType === "client" ? "#FFF4E6" : "#fff",
                        cursor: "pointer",
                      }}
                      onClick={() => navigate(`/taxdashboard/messages?thread=${msg.thread_id}`)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                        <div className="msg-icon-wrapper"><Msg /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span className="msg-role" style={{ fontWeight: 500 }}>{senderName}</span>
                            <span className="name-role-circle"></span>
                            <span className="role-badge">{msg.sender_type || (msg.sender?.role === 'client' ? 'Client' : 'Internal')}</span>
                          </div>
                          <div className="msg-content" style={{ fontSize: "0.875rem", color: "#4B5563" }}>
                            {msg.message_preview || msg.message_snippet || msg.content || 'No message content'}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "black", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                        <Clocking />{msg.time_ago || 'Just now'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <PaginationControls
              currentPage={messagesPage}
              totalPages={getTotalPages(recentMessages, ITEMS_PER_PAGE)}
              onPageChange={setMessagesPage}
              sectionName="messages"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-12 col-md-6">
          <div className="card custom-card p-3 p-md-4 rounded-4">
            <div className="mb-3">
              <h1 className="section-title mb-1">Quick Actions</h1>
              <p className="section-subtitle m-0">Common tasks and shortcuts</p>
            </div>
            <div className="quick-action-container">
              {quickActions.map((action, i) => (
                <div
                  key={i}
                  className="quick-action-card"
                  onClick={() => navigate(action.path)}
                  style={{ cursor: 'pointer' }}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
