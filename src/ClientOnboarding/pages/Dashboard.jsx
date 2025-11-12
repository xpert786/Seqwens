import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardWidgets from "../components/DashboardWidgets";
import {
  FileIcon,
  DateIcon,
  CompletedIcon,
  SignatureIcon,
  MessageIcon,
} from "../components/icons";
import { dashboardAPI, handleAPIError } from "../utils/apiUtils";
import "../styles/Popup.css";
import "../styles/Dashboard.css";
import Pagination from "../components/Pagination";

// ------------------- Styling Map ----------------------
const priorityBadgeClass = {
  high: "danger",
  medium: "warning",
  low: "success",
};

// ------------------- Helper Function ------------------------
const getIconByType = (iconType, priority = "low") => {
  const iconWrapperStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%"
  };

  // Consistent icon size style for all icons
  const iconSvgStyle = {
    width: "28px",
    height: "28px",
    minWidth: "28px",
    minHeight: "28px",
    flexShrink: 0
  };

  switch (iconType) {
    case "document":
      return (
        <div style={iconWrapperStyle}>
          <FileIcon style={iconSvgStyle} />
        </div>
      );
    case "signature":
      return (
        <div style={iconWrapperStyle}>
          <SignatureIcon style={iconSvgStyle} />
        </div>
      );
    case "message":
      return (
        <div style={iconWrapperStyle}>
          <MessageIcon style={iconSvgStyle} />
        </div>
      );
    case "completed":
      return (
        <div style={iconWrapperStyle}>
          <CompletedIcon style={iconSvgStyle} />
        </div>
      );
    default:
      return (
        <div style={iconWrapperStyle}>

          <DateIcon style={iconSvgStyle} />
        </div>
      );
  }
};

// ------------------- Task Card ------------------------
const TaskCard = ({ title, due, status, icon, iconType, priority, isRecentActivity = false }) => {
  // Use provided icon or generate from iconType - same size for both sections
  const iconElement = icon || (
    <span className="icon-circle">
      {getIconByType(iconType, priority)}
    </span>
  );

  // Use priority for badge if status is not provided
  const badgeStatus = status || priority || "low";

  return (
    <div className="rounded-3 p-3 car">
      <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
        <div className="d-flex align-items-start gap-2" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ flexShrink: 0 }}>
            {iconElement}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="task-title">{title}</div>
            <div className="task-due">{due}</div>
          </div>
        </div>
        {!isRecentActivity && (
          <span
            className={`badge bg-${priorityBadgeClass[badgeStatus] || priorityBadgeClass.low} rounded-pill text-capitalize task-badge`}
          >
            {badgeStatus}
          </span>
        )}
      </div>
    </div>
  );
};

// ------------------- Main Dashboard --------------------
export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasksCurrentPage, setTasksCurrentPage] = useState(1);
  const [activityCurrentPage, setActivityCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    // Check if user is completed from stored user data
    const userData = JSON.parse(localStorage.getItem("userData") || sessionStorage.getItem("userData") || "{}");

    // If user is not completed, redirect to dashboard-first
    if (userData && userData.is_completed === false) {
      navigate("/dashboard-first");
      return;
    }

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dashboardAPI.getDashboard();

        if (response.success && response.data) {
          setDashboardData(response.data);
        } else {
          setError("Failed to load dashboard data");
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(handleAPIError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // Transform whats_due data for TaskCard
  const whatsDueTasks = dashboardData?.whats_due?.map((task) => ({
    id: task.id,
    title: task.title,
    due: task.due_date_formatted || `Due: ${task.due_date}`,
    status: task.priority || "low",
    iconType: task.icon_type || "document",
    priority: task.priority,
  })) || [];

  // Pagination for Tasks
  const tasksTotalPages = Math.ceil(whatsDueTasks.length / itemsPerPage);
  const tasksStartIndex = (tasksCurrentPage - 1) * itemsPerPage;
  const tasksEndIndex = Math.min(tasksStartIndex + itemsPerPage, whatsDueTasks.length);
  const paginatedTasks = whatsDueTasks.slice(tasksStartIndex, tasksEndIndex);

  // Helper function to replace full name with first name + last name in titles
  const formatActivityTitle = (title) => {
    if (!title || !dashboardData?.taxpayer_info) return title;

    const fullName = dashboardData.taxpayer_info.full_name;
    const firstName = dashboardData.taxpayer_info.first_name;
    const lastName = dashboardData.taxpayer_info.last_name;

    // If we have first and last name, replace full name in title
    if (fullName && firstName && lastName) {
      const fullNamePattern = new RegExp(fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const firstLastName = `${firstName} ${lastName}`.trim();
      return title.replace(fullNamePattern, firstLastName);
    }

    return title;
  };

  // Transform recent_activity data for TaskCard
  const recentActivityTasks = dashboardData?.recent_activity
    ?.map((activity) => ({
      id: activity.id,
      title: formatActivityTitle(activity.title),
      due: activity.timestamp_formatted || activity.timestamp,
      status: activity.priority || "low",
      iconType: activity.icon_type || "document",
      priority: activity.priority,
    })) || [];

  // Pagination for Recent Activity
  const activityTotalPages = Math.ceil(recentActivityTasks.length / itemsPerPage);
  const activityStartIndex = (activityCurrentPage - 1) * itemsPerPage;
  const activityEndIndex = Math.min(activityStartIndex + itemsPerPage, recentActivityTasks.length);
  const paginatedActivity = recentActivityTasks.slice(activityStartIndex, activityEndIndex);

  return (
    <div className="container-fluid px-2 px-md-2">
      <DashboardWidgets dashboardData={dashboardData} loading={loading} />

      <div className="row mt-1 g-3 px-4">
        {/* What's Due Section */}
        <div className="col-12 col-md-6 ">
          <div className="card custom-card p-3 p-md-4 rounded-3">
            <div className="mb-3">
              <h1 className="section-title mb-1">Tasks</h1>
              <p className="section-subtitle m-0">Your latest interactions</p>
            </div>
            {loading ? (
              <div className="text-center py-4">
                <p>Loading...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-danger">{error}</p>
              </div>
            ) : whatsDueTasks.length > 0 ? (
              <>
                <div className="d-flex flex-column gap-3">
                  {paginatedTasks.map((task, i) => (
                    <TaskCard key={task.id || i} {...task} />
                  ))}
                </div>
                {whatsDueTasks.length > itemsPerPage && (
                  <Pagination
                    currentPage={tasksCurrentPage}
                    totalPages={tasksTotalPages}
                    onPageChange={setTasksCurrentPage}
                    totalItems={whatsDueTasks.length}
                    itemsPerPage={itemsPerPage}
                    startIndex={tasksStartIndex}
                    endIndex={tasksEndIndex}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted">No tasks due at this time</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="col-12 col-md-6">
          <div className="card custom-card p-3 p-md-4 rounded-4">
            <div className="mb-3">
              <h1 className="section-title mb-1">Recent Activity</h1>
              <p className="section-subtitle m-0">Your latest interactions</p>
            </div>
            {loading ? (
              <div className="text-center py-4">
                <p>Loading...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-danger">{error}</p>
              </div>
            ) : recentActivityTasks.length > 0 ? (
              <>
                <div className="d-flex flex-column gap-3">
                  {paginatedActivity.map((activity, i) => (
                    <TaskCard key={activity.id || i} {...activity} isRecentActivity={true} />
                  ))}
                </div>
                {recentActivityTasks.length > itemsPerPage && (
                  <Pagination
                    currentPage={activityCurrentPage}
                    totalPages={activityTotalPages}
                    onPageChange={setActivityCurrentPage}
                    totalItems={recentActivityTasks.length}
                    itemsPerPage={itemsPerPage}
                    startIndex={activityStartIndex}
                    endIndex={activityEndIndex}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
