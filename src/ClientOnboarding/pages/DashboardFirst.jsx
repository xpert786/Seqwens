import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComFirstIcon,
  UploadIcon,
  SignIcon,
  ReviewIcon,
  FileTaskIcon,
  BalanceIcon,
  MessageIcon,
} from "../components/icons";
import { AiOutlineCalendar } from "react-icons/ai";
import "../styles/Dashfirst.css";
import { dashboardAPI, handleAPIError } from "../utils/apiUtils";
import { toast } from "react-toastify";

export default function DashboardFirst() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startedTasks, setStartedTasks] = useState(() => {
    // Load started tasks from localStorage
    const saved = localStorage.getItem('dashboardStartedTasks');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await dashboardAPI.getInitialDashboard();
        console.log('Fetched initial dashboard data:', data);
        setDashboardData(data);

        // check completion immediately after fetching
        const apiData = data.data || data;
        const pct = apiData.profile_completion?.percentage;

        if (pct === 100) {
          // We no longer auto-redirect even if 100% complete, 
          // as per requirement "dont go to dashboard first even everything is fine"
          console.log('Profile is 100% complete. User can now proceed to main dashboard.');
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(handleAPIError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Save started tasks to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboardStartedTasks', JSON.stringify(startedTasks));
  }, [startedTasks]);

  // Get navigation route for each task
  const getTaskRoute = (title) => {
    switch (title) {
      case "Complete Profile Setup":
        return "/dashboard/accounts";
      case "Complete Data Intake Form":
        return "/dashboard/dataintake";
      case "Upload Tax Documents":
        return "/dashboard/documents";
      case "Schedule a Consultation":
        return "/dashboard/appointments";
      default:
        return "#";
    }
  };

  // Handle task click - navigate to relevant flow
  const handleTaskClick = (task) => {
    const route = getTaskRoute(task.title);
    // Mark task as started if not already started
    if (!startedTasks[task.title] && task.status !== "complete") {
      setStartedTasks(prev => ({
        ...prev,
        [task.title]: true
      }));
    }
    navigate(route);
  };

  // Handle button click - same as task click
  const handleButtonClick = (e, task) => {
    e.stopPropagation(); // Prevent double navigation
    handleTaskClick(task);
  };

  // Get button text based on task status
  const getButtonText = (task) => {
    if (task.status === "complete") {
      return "Completed";
    } else if (startedTasks[task.title]) {
      return "Incomplete";
    } else {
      return "Start";
    }
  };

  // Get button class based on status
  const getButtonClass = (task) => {
    if (task.status === "complete") {
      return "btn btn-success ";
    } else if (startedTasks[task.title]) {
      return "btn btn-warning ";
    } else {
      return "btn btn-primary ";
    }
  };

  const getTaskIcon = (title) => {
    const iconProps = { width: 34, height: 34 };
    switch (title) {
      case "Complete Profile Setup":
        return <ComFirstIcon {...iconProps} />;
      case "Complete Data Intake Form":
        return <UploadIcon {...iconProps} />;
      case "Upload Tax Documents":
        return <ConverIcon {...iconProps} />;
      case "Schedule a Consultation":
        return <SignIcon {...iconProps} />;
      default:
        return null;
    }
  };


  const priorityBadgeClass = {
    complete: "success",
    incomplete: "secondary",
  };

  // Get setup tasks from API data or use defaults
  const getSetupTasks = () => {
    if (!dashboardData) {
      return [
        {
          title: "Complete Profile Setup",
          description: "Complete your personal profile details and upload profile picture",
          status: "incomplete",
        },
        {
          title: "Complete Data Intake Form",
          description: "Complete data intake form",
          status: "incomplete",
        },
        {
          title: "Upload Tax Documents",
          description: "Upload your tax documents",
          status: "incomplete",
        },
        {
          title: "Schedule a Consultation",
          description: "Schedule your first consultation",
          status: "incomplete",
        },
      ];
    }

    // Map API response to setup tasks using the actual API structure
    const apiData = dashboardData.data || dashboardData;
    const steps = apiData.steps || {};

    return [
      {
        title: "Complete Profile Setup",
        description:
          steps.profile_setup?.description ||
          "Complete your personal profile details and upload profile picture",
        status: steps.profile_setup?.completed ? "complete" : "incomplete",
      },
      {
        title: "Complete Data Intake Form",
        description:
          steps.data_intake_form?.description || "Complete data intake form",
        status: steps.data_intake_form?.completed ? "complete" : "incomplete",
      },
      {
        title: "Upload Tax Documents",
        description:
          steps.tax_documents?.description || "Upload your tax documents",
        status: steps.tax_documents?.completed ? "complete" : "incomplete",
      },
      {
        title: "Schedule a Consultation",
        description:
          steps.schedule_consultation?.description ||
          "Schedule your first consultation",
        status: steps.schedule_consultation?.completed ? "complete" : "incomplete",
      },
    ];
  };

  const setupTasks = getSetupTasks();

  const quickActions = [
    {
      icon: <BalanceIcon size={28} />,
      title: "Upload Documents",
      button: "Upload Now",
      route: "/dashboard/documents",
    },
    {
      icon: <AiOutlineCalendar size={28} />,
      title: "Next Appointment",
      button: "Reschedule",
      route: "/dashboard/appointments",
    },
    {
      icon: <MessageIcon size={28} />,
      title: "New Messages",
      button: "View All",
      route: "/dashboard/messages",
    },
  ];

  const completedCount = setupTasks.filter((task) => task.status === "complete").length;
  const completionPercentage = dashboardData?.data?.profile_completion?.percentage
    ? Math.round(dashboardData.data.profile_completion.percentage)
    : Math.round((completedCount / setupTasks.length) * 100);

  // Show loading state
  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex justify-center items-center min-h-[400px]">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
          <h5 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h5>
          <p className="text-red-700 mb-3">{error}</p>
          <button
            className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      <div className="p-4 sm:p-6 rounded-lg mb-4 sm:mb-6 relative bg-[#FFF3E1] border border-[#FFD6A5]">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          {/* Left Section: Welcome Message */}
          <div className="flex-1">
            <h5 className="text-[#3B4A66] text-xl sm:text-2xl lg:text-[28px] font-medium font-[BasisGrotesquePro] mb-2">
              Welcome, {dashboardData?.data?.user_info?.first_name || 'User'}! 👋
            </h5>
            <p className="text-gray-600 text-base sm:text-lg font-[BasisGrotesquePro]">
              Let's get your tax dashboard set up. You're making great progress!
            </p>
          </div>

          {/* Right Section: Progress & Action */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 flex-shrink-0">
            {/* Completion Percentage */}
            <div className="text-right leading-tight">
              <div className="text-[#3B4A66] text-base sm:text-lg font-semibold">
                {completionPercentage}%
              </div>
              <div className="text-sm sm:text-base text-[#6B7280]">
                Complete
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={async () => {
                try {
                  await dashboardAPI.updateOnboardingStatus(true);
                  const { setUserStatus, getStorage, getUserData, setUserData } = await import('../utils/userUtils');

                  // Update local user data to reflect completion
                  const userData = getUserData();
                  if (userData) {
                    userData.onboarding_completed = true;
                    setUserData(userData);
                  }

                  setUserStatus("existing");
                  navigate('/dashboard');
                } catch (e) {
                  console.error("Failed to update status", e);
                  navigate('/dashboard');
                }
              }}
              className="px-6 py-2 bg-[#F56D2D] text-white rounded-lg font-medium hover:bg-[#e05d20] transition-colors whitespace-nowrap"
              style={{ borderRadius: "6px" }}
            >
              Proceed to Dashboard
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2 sm:mb-3">
          <div
            className="bg-[#F56D2D] h-2 rounded-full transition-all duration-300"
            role="progressbar"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>

        <div className="mt-2 text-right text-[#3B4A66] text-sm sm:text-base font-medium font-[BasisGrotesquePro]">
          {dashboardData?.data?.profile_completion?.completed_steps || completedCount} of {dashboardData?.data?.profile_completion?.total_steps || setupTasks.length} setup tasks completed
        </div>
      </div>

      {/* Setup Tasks */}
      <div className="bg-white rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <h6 className="text-[#3B4A66] text-xl sm:text-2xl font-medium font-[BasisGrotesquePro] mb-2">
          Setup Tasks
        </h6>
        <p className="text-[#4B5563] text-sm sm:text-base font-normal font-[BasisGrotesquePro] mb-4">
          Complete these steps to get the most out of your dashboard
        </p>

        <ul className="space-y-0">
          {setupTasks.map((task, idx) => {
            const status = task.status;
            const buttonText = getButtonText(task);
            const buttonClass = getButtonClass(task);
            return (
              <div
                key={idx}
                className={`border-0 px-0 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between cursor-pointer transition-colors ${status !== "complete" ? "hover:bg-gray-50" : ""
                  } ${idx !== setupTasks.length - 1 ? "border-b border-gray-200" : ""}`}
                onClick={() => handleTaskClick(task)}
              >
                {/* LEFT SIDE */}
                <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12">
                    {getTaskIcon(task.title)}
                  </div>

                  <div className="min-w-0 flex flex-col justify-center">
                    <h6 className="mb-0 text-[#3B4A66] text-sm sm:text-base font-medium font-[BasisGrotesquePro] leading-tight">
                      {task.title}
                    </h6>
                    <p className="text-[#3B4A66] text-xs sm:text-sm font-[BasisGrotesquePro] mb-0 mt-1 opacity-80">
                      {task.description}
                    </p>
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex justify-end w-full sm:w-auto mt-3 sm:mt-0">
                  <button
                    className={`${buttonClass} w-24 sm:w-32 py-2 text-xs sm:text-sm font-medium transition-all duration-200`}
                    onClick={(e) => handleButtonClick(e, task)}
                    disabled={status === "complete"}
                    style={{ borderRadius: '6px' }}
                  >
                    {buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-4 sm:p-6 mt-4 sm:mt-6">
        <h6 className="mb-1 text-[#3B4A66] text-base sm:text-lg font-semibold font-[BasisGrotesquePro]">
          Quick Actions
        </h6>
        <p className="text-gray-600 text-xs sm:text-sm font-[BasisGrotesquePro] mb-4">
          Common tasks you can do right now
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {quickActions.map((action, idx) => (
            <div key={idx} className="mb-3 sm:mb-0">
              <div className="p-3 sm:p-4 rounded-lg border border-[#E0E6ED] bg-[#F9FBFF] h-full flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4 sm:mb-6 h-10">
                  <div className="text-[28px] sm:text-[32px] text-cyan-500 font-[BasisGrotesquePro] flex-shrink-0 flex items-center justify-center w-8 sm:w-10">
                    {action.icon}
                  </div>
                  <h6 className="text-sm sm:text-base text-[#3B4A66] font-medium font-[BasisGrotesquePro] mb-0 leading-tight">
                    {action.title}
                  </h6>
                </div>
                <button
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E0E6ED] text-[#3B4A66] font-medium font-[BasisGrotesquePro] rounded hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(action.route)}
                >
                  {action.button}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
