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
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#10B981",
  pending: "#8B5CF6",
  "in progress": "#3B82F6",
};

// ------------------- Task Card ------------------------
const TaskCard = ({ title, due, status, user, icon, selected, onClick, singleStatus, value, className }) => {
  const displayStatus = singleStatus && Array.isArray(status) ? [status[0]] : status;

  return (
    <div
      className={`task-card-v2 ${selected ? 'selected' : ''} ${className || ''}`}
      onClick={onClick}
    >
      <div className="task-header-row">
        <div className="task-title-group">
          {icon && <span className="task-icon-mini">{icon}</span>}
          <span className="task-main-title">{title}</span>
        </div>
        <div className="task-status-group">
          {displayStatus?.map((s, i) => (
            <span
              key={i}
              className="badge rounded-pill text-capitalize task-badge-v2"
              style={{ backgroundColor: statusColors[s.toLowerCase()] || "#6B7280" }}
            >
              {s}
            </span>
          ))}
          {value && <span className="task-value-text">{value}</span>}
        </div>
      </div>
      <div className="task-meta-row">
        <div className="task-due-date">{due}</div>
        <div className="task-user-info">{user}</div>
      </div>
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

  // View All states - to show all items or paginated
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);

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
    if (priorityLower === 'high') return "#EF4444";
    if (priorityLower === 'medium') return "#F59E0B";
    if (priorityLower === 'low') return "#10B981";
    return "#6B7280";
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'pending') return "#8B5CF6";
    if (statusLower === 'in progress' || statusLower === 'in_progress') return "#3B82F6";
    return "#6B7280";
  };

  // Pagination helper functions
  const getPaginatedData = (data, page, itemsPerPage, showAll = false) => {
    if (showAll) {
      return data; // Return all items when showAll is true
    }
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

    const btnStyle = (isDisabled) => ({
      backgroundColor: isDisabled ? '#E5E7EB' : '#F56D2D',
      color: isDisabled ? '#9CA3AF' : '#FFFFFF',
      border: 'none',
      borderRadius: '6px',
      padding: '8px 16px',
      fontSize: '14px',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.6 : 1,
      width: '120px',
      flex: 'none',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    });

    return (
      <div className="d-flex justify-content-between align-items-center mt-3 w-100" style={{ paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ ...btnStyle(currentPage === 1), width: '100px' }}
        >
          Previous
        </button>
        <span style={{ fontSize: '13px', color: '#4B5563', fontWeight: '500', textAlign: 'center' }}>
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ ...btnStyle(currentPage === totalPages), width: '100px' }}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="dashboard-main-container">
      <TaxDashboardWidget />

      <div className="row mt-3 g-3 dashboard-sections-wrapper">
        {/* My Tasks */}
        <div className="col-12 col-md-6">
          <div className="card custom-card p-3 p-md-4 rounded-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h4 className="section-title mb-1">My Tasks</h4>
                <p className="section-subtitle m-0">Tasks assigned to you</p>
              </div>
              <button
                className="view-all-btn"
                onClick={() => {
                  if (showAllTasks) {
                    setShowAllTasks(false);
                    setMyTasksPage(1);
                  } else {
                    setShowAllTasks(true);
                  }
                }}
              >
                {showAllTasks ? 'Show Less' : 'View All'}
              </button>
            </div>
            <div className="d-flex flex-column gap-3">
              {loading ? (
                <div className="text-center py-3">Loading tasks...</div>
              ) : myTasks.length === 0 ? (
                <div className="text-center py-3">No tasks assigned</div>
              ) : (
                getPaginatedData(myTasks, myTasksPage, ITEMS_PER_PAGE, showAllTasks).map((task, i) => {
                  const taskTitle = task.task_title || task.title || 'Untitled Task';
                  return (
                    <TaskCard
                      key={task.id || i}
                      title={taskTitle}
                      due={task.due_date_formatted || `Due: ${task.due_date || 'N/A'}`}
                      status={[task.priority_display || task.priority || 'medium', task.status_display || task.status || 'pending']}
                      user={(
                        <span className="db-user d-flex align-items-center gap-2">
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
            {!showAllTasks && myTasks.length > ITEMS_PER_PAGE && (
              <PaginationControls
                currentPage={myTasksPage}
                totalPages={getTotalPages(myTasks, ITEMS_PER_PAGE)}
                onPageChange={setMyTasksPage}
                sectionName="myTasks"
              />
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="col-12 col-md-6">
          <div className="card custom-card upcoming-deadlines-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h4 className="section-title mb-1">Upcoming Deadlines</h4>
                <p className="section-subtitle m-0">Important dates to remember</p>
              </div>
              <button
                className="view-all-btn"
                onClick={() => {
                  if (showAllDeadlines) {
                    setShowAllDeadlines(false);
                    setDeadlinesPage(1);
                  } else {
                    setShowAllDeadlines(true);
                  }
                }}
              >
                {showAllDeadlines ? 'Show Less' : 'View All'}
              </button>
            </div>
            <div className="upcoming-deadlines-container">
              {loading ? (
                <div className="text-center py-3">Loading deadlines...</div>
              ) : upcomingDeadlines.length === 0 ? (
                <div className="text-center py-3">No upcoming deadlines</div>
              ) : (
                getPaginatedData(upcomingDeadlines, deadlinesPage, ITEMS_PER_PAGE, showAllDeadlines).map((deadline, i) => {
                  const deadlineTitle = deadline.title || 'Untitled';
                  return (
                    <TaskCard
                      key={deadline.id || i}
                      title={deadlineTitle}
                      due={deadline.due_date_formatted || `Due: ${deadline.due_date || 'N/A'}`}
                      status={[deadline.priority_display || deadline.priority || 'medium']}
                      value={deadline.time_left || deadline.days_left !== undefined ? `${deadline.days_left} days left` : ''}
                      user={(
                        <span className="db-user d-flex align-items-center gap-2">
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
            {!showAllDeadlines && upcomingDeadlines.length > ITEMS_PER_PAGE && (
              <PaginationControls
                currentPage={deadlinesPage}
                totalPages={getTotalPages(upcomingDeadlines, ITEMS_PER_PAGE)}
                onPageChange={setDeadlinesPage}
                sectionName="deadlines"
              />
            )}
          </div>

        </div>
      </div>

      {/* Bottom Section */}

      <div className="row mt-3 g-3 dashboard-sections-wrapper">
        {/* Recent Messages */}

        <div className="col-12 col-md-6">
          <div className="card custom-card p-3 p-md-4 rounded-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h4 className="section-title mb-1">Recent Messages</h4>
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
                      className={`recent-msg-card ${msgType === "client" ? "client-msg" : "internal-msg"}`}
                      onClick={() => navigate(`/taxdashboard/messages?thread=${msg.thread_id}`)}
                    >
                      <div className="msg-header-row">
                        <div className="msg-sender-box">
                          <span className="msg-name-text">{senderName}</span>
                          <span className="name-role-circle"></span>
                          <span className="role-badge">{msg.sender_type || (msg.sender?.role === 'client' ? 'Client' : 'Internal')}</span>
                        </div>
                        <div className="msg-time-box">
                          <Clocking />
                          <span>{msg.time_ago || 'Just now'}</span>
                        </div>
                      </div>

                      <div className="msg-body-row">
                        <div className="msg-icon-holder">
                          <Msg />
                        </div>
                        <div className="msg-preview-text">
                          {msg.message_preview || msg.message_snippet || msg.content || 'No message content'}
                        </div>
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
              <h4 className="section-title mb-1">Quick Actions</h4>
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
