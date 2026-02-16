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
  ConverIcon,
} from "../components/icons";
import { AiOutlineCalendar } from "react-icons/ai";
import "../styles/Dashfirst.css";
import { dashboardAPI, handleAPIError } from "../utils/apiUtils";
import { toast } from "react-toastify";
import { setUserStatus, getUserData, setUserData } from "../utils/userUtils";

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
  const [isProceeding, setIsProceeding] = useState(false);

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
    <div className="p-3 sm:p-6 lg:p-8 bg-[#FAFBFF] min-h-screen">
      {/* 1. Progress & Welcome Banner */}
      <div className="p-4 sm:p-6 rounded-2xl mb-6 relative bg-[#FFF3E1] border border-[#FFD6A5] shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
          {/* Welcome Message */}
          <div className="flex-1 text-center lg:text-left">
            <h5 className="text-[#3B4A66] text-xl sm:text-2xl lg:text-[28px] font-bold font-[BasisGrotesquePro] mb-2">
              Welcome, {dashboardData?.data?.user_info?.first_name || 'User'}! 👋
            </h5>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg font-[BasisGrotesquePro] max-w-xl mx-auto lg:mx-0">
              Let's get your tax dashboard set up. You're making great progress!
            </p>
          </div>

          {/* Progress Stats & Action */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end justify-center gap-4">
            <div className="text-center lg:text-right leading-tight">
              <div className="text-[#3B4A66] text-2xl font-bold">
                {completionPercentage}%
              </div>
              <div className="text-xs sm:text-sm uppercase tracking-wider font-semibold text-[#6B7280]">
                Complete
              </div>
            </div>

            <button
              onClick={async () => {
                if (isProceeding) return;

                // Set loading state immediately
                setIsProceeding(true);

                // Fallback navigation after 5 seconds just in case everything hangs
                const safetyTimeout = setTimeout(() => {
                  console.log("Onboarding: Safety timeout triggered, forcing navigation");
                  navigate('/dashboard');
                }, 5000);

                try {
                  // 1. Inform the user
                  toast.info("Preparing your dashboard context...", {
                    position: "top-center",
                    autoClose: 1500,
                    style: { borderRadius: '12px', fontWeight: '600' }
                  });

                  // 2. Update status on backend
                  console.log("Onboarding: Updating status on backend...");
                  try {
                    await dashboardAPI.updateOnboardingStatus(true);
                  } catch (apiErr) {
                    console.warn("Onboarding: Backend update failed, but continuing locally", apiErr);
                  }

                  // 3. Update local state
                  console.log("Onboarding: Updating local state...");
                  const userData = getUserData();
                  if (userData) {
                    userData.onboarding_completed = true;
                    setUserData(userData);
                  }
                  setUserStatus("existing");

                  // 4. Final toast and navigate
                  clearTimeout(safetyTimeout);
                  toast.success("Ready! Redirecting...", {
                    position: "top-center",
                    autoClose: 1000,
                    style: { borderRadius: '12px', fontWeight: 'bold' }
                  });

                  // Final navigation
                  setTimeout(() => {
                    window.location.href = '/dashboard'; // Using direct href for a clean context reload
                  }, 800);

                } catch (err) {
                  console.error("Onboarding: Error during finalization", err);
                  clearTimeout(safetyTimeout);
                  setIsProceeding(false);
                  // Always navigate as a last resort
                  toast.warning("Encountered an issue, entering dashboard anyway...");
                  navigate('/dashboard');
                }
              }}
              disabled={isProceeding}
              style={{ borderRadius: "12px" }}
              className={`w-full sm:w-auto px-8 py-3 bg-[#F56D2D] text-white rounded-xl font-bold shadow-lg shadow-orange-100 hover:bg-[#e05d20] transition-all active:scale-95 whitespace-nowrap flex items-center justify-center gap-3 ${isProceeding ? 'opacity-80' : 'hover:shadow-xl'}`}
            >
              {isProceeding ? (
                <>
                  <div className="spinner-border spinner-border-sm" role="status" style={{ width: '18px', height: '18px' }} />
                  <span>Finalizing...</span>
                </>
              ) : (
                'Proceed to Dashboard'
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-2">
          <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#F56D2D] h-full rounded-full transition-all duration-700 ease-out"
              role="progressbar"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <div className="text-center lg:text-right text-[#3B4A66] text-xs sm:text-sm font-medium">
            {dashboardData?.data?.profile_completion?.completed_steps || completedCount} of {dashboardData?.data?.profile_completion?.total_steps || setupTasks.length} setup tasks completed
          </div>
        </div>
      </div>

      {/* 2. Setup Tasks Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 mb-6 border border-[#E8F0FF] shadow-sm">
        <div className="mb-6">
          <h6 className="text-[#3B4A66] text-lg sm:text-xl font-bold font-[BasisGrotesquePro] mb-1">
            Setup Tasks
          </h6>
          <p className="text-[#6B7280] text-sm sm:text-base font-[BasisGrotesquePro]">
            Complete these steps to get the most out of your dashboard
          </p>
        </div>

        <div className="divide-y divide-[#F1F5F9]">
          {setupTasks.map((task, idx) => (
            <div
              key={idx}
              className={`group py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${task.status !== "complete" ? "hover:bg-gray-50/50" : ""}`}
              onClick={() => handleTaskClick(task)}
            >
              {/* Task Info */}
              <div className="flex items-center gap-4 w-full">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#F0F7FF] flex items-center justify-center text-2xl">
                  {getTaskIcon(task.title)}
                </div>
                <div className="min-w-0">
                  <h6 className="text-[#3B4A66] text-sm sm:text-base font-semibold truncate mb-0 leading-tight">
                    {task.title}
                  </h6>
                  <p className="text-[#6B7280] text-xs sm:text-sm mb-0 mt-1 line-clamp-1 opacity-90">
                    {task.description}
                  </p>
                </div>
              </div>

              {/* Task Action Button */}
              <div className="w-full sm:w-auto">
                <button
                  className={`${getButtonClass(task)} w-full sm:w-32 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-sm`}
                  onClick={(e) => handleButtonClick(e, task)}
                  disabled={task.status === "complete"}
                >
                  {getButtonText(task)}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Quick Actions Grid */}
      <div className="mt-8">
        <div className="mb-4 px-1">
          <h6 className="text-[#3B4A66] text-lg font-bold font-[BasisGrotesquePro] mb-1">
            Quick Actions
          </h6>
          <p className="text-[#6B7280] text-sm font-[BasisGrotesquePro]">
            Common tasks you can do right now
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-[#E8F0FF] bg-white hover:border-[#F56D2D]/30 transition-all shadow-sm flex flex-col justify-between h-full group"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 rounded-lg bg-[#F0FDFD] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <h6 className="text-[#3B4A66] font-semibold text-sm sm:text-base m-0 leading-tight">
                  {action.title}
                </h6>
              </div>
              <button
                className="w-full py-2.5 text-xs sm:text-sm bg-[#F9FBFF] border border-[#E0E6ED] text-[#3B4A66] font-bold rounded-lg hover:bg-[#F56D2D] hover:text-white hover:border-[#F56D2D] transition-all"
                onClick={() => navigate(action.route)}
              >
                {action.button}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
