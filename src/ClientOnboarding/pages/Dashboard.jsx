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
  const iconClasses = "flex items-center justify-center w-full h-full";
  const iconSvgClasses = "w-7 h-7 min-w-[28px] min-h-[28px] flex-shrink-0";

  switch (iconType) {
    case "document":
      return (
        <div className={iconClasses}>
          <FileIcon className={iconSvgClasses} />
        </div>
      );
    case "signature":
      return (
        <div className={iconClasses}>
          <SignatureIcon className={iconSvgClasses} />
        </div>
      );
    case "message":
      return (
        <div className={iconClasses}>
          <MessageIcon className={iconSvgClasses} />
        </div>
      );
    case "completed":
      return (
        <div className={iconClasses}>
          <CompletedIcon className={iconSvgClasses} />
        </div>
      );
    default:
      return (
        <div className={iconClasses}>
          <DateIcon className={iconSvgClasses} />
        </div>
      );
  }
};

// ------------------- Task Card ------------------------
const TaskCard = ({ title, due, status, icon, iconType, priority, isRecentActivity = false }) => {
  // Use provided icon or generate from iconType - same size for both sections
  const iconElement = icon || (
    <span className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
      {getIconByType(iconType, priority)}
    </span>
  );

  // Use priority for badge if status is not provided
  const badgeStatus = status || priority || "low";
  const badgeColorMap = {
    high: "bg-red-500",
    medium: "bg-yellow-400",
    low: "bg-green-500"
  };

  return (
    <div className="rounded-xl p-3 border border-[#E8F0FF] bg-white">
      <div className="flex justify-between items-start gap-2 flex-wrap">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {iconElement}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm sm:text-base font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-1">{title}</div>
            <div className="text-xs sm:text-sm text-[#4B5563] font-[BasisGrotesquePro]">{due}</div>
          </div>
        </div>
        {!isRecentActivity && (
          <span
            className={`px-2 py-1 text-xs rounded-full text-white capitalize ${badgeColorMap[badgeStatus] || badgeColorMap.low}`}
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
    // User must stay on dashboard-first until all information is complete
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
    <div className="w-full px-2 sm:px-4 lg:px-6">
      <DashboardWidgets dashboardData={dashboardData} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mt-2 px-2 sm:px-4">
        {/* What's Due Section */}
        <div className="w-full">
          <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm">
            <div className="mb-3 sm:mb-4">
              <h3 className="text-[#3B4A66] text-sm sm:text-base font-medium font-[BasisGrotesquePro] mb-1">Tasks</h3>
              <p className="text-[#4B5563] text-xs sm:text-sm font-normal font-[BasisGrotesquePro] m-0">Your latest interactions</p>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
              </div>
            ) : whatsDueTasks.length > 0 ? (
              <>
                <div className="flex flex-col gap-3">
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
              <div className="text-center py-8">
                <p className="text-gray-500">No tasks due at this time</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="w-full">
          <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm">
            <div className="mb-3 sm:mb-4">
              <h3 className="text-[#3B4A66] text-sm sm:text-base font-medium font-[BasisGrotesquePro] mb-1">Recent Activity</h3>
              <p className="text-[#4B5563] text-xs sm:text-sm font-normal font-[BasisGrotesquePro] m-0">Your latest interactions</p>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
              </div>
            ) : recentActivityTasks.length > 0 ? (
              <>
                <div className="flex flex-col gap-3">
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
              <div className="text-center py-8">
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}
