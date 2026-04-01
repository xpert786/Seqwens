import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComFirstIconed,
  UploadIconed,
  SignIconed,
  ReviewIconed,
  FileIcon,
  BalanceIcon,
  MessageIcon,
  Analytics,
} from "../component/icons.jsx";
import { AiOutlineCalendar } from "react-icons/ai";

export default function TaxDashboardFirst() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("userStatus", "existing");
  }, []);

  const getTaskIcon = (title) => {
    const iconSize = 40;
    switch (title) {
      case "Complete Profile Setup":
        return <div className="p-3 bg-blue-50 rounded-xl text-[#3AD6F2]"><ComFirstIconed width={iconSize} height={iconSize} /></div>;
      case "Complete Data Intake Form":
        return <div className="p-3 bg-orange-50 rounded-xl text-[#F56D2D]"><UploadIconed width={iconSize} height={iconSize} /></div>;
      case "Schedule a Consultation":
        return <div className="p-3 bg-purple-50 rounded-xl text-purple-500"><SignIconed width={iconSize} height={iconSize} /></div>;
      case "Set Up Payment Method":
        return <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500"><ReviewIconed width={iconSize} height={iconSize} /></div>;
      default:
        return <div className="p-3 bg-gray-50 rounded-xl text-gray-400"><Analytics size={iconSize} /></div>;
    }
  };

  const setupTasks = [
    {
      title: "Complete Profile Setup",
      description: "Add your personal information and preferences",
      status: "complete",
    },
    {
      title: "Complete Data Intake Form",
      description: "Add personal details and upload documents",
      status: "complete",
    },
    {
      title: "Schedule a Consultation",
      description: "Book a meeting from the Dashboard",
      status: "pending",
    },
    {
      title: "Set Up Payment Method",
      description: "Pick a billing method for services",
      status: "action required",
    },
  ];

  const quickActions = [
    {
      icon: <FileIcon size={24} />,
      title: "Documents",
      button: "Upload Now",
      color: "bg-blue-50 text-[#3AD6F2]",
    },
    {
      icon: <BalanceIcon size={24} />,
      title: "Billing",
      button: "Pay Now",
      color: "bg-orange-50 text-[#F56D2D]",
    },
    {
      icon: <AiOutlineCalendar size={24} />,
      title: "Meetings",
      button: "Reschedule",
      color: "bg-purple-50 text-purple-500",
    },
    {
      icon: <MessageIcon size={24} />,
      title: "Messages",
      button: "View All",
      color: "bg-emerald-50 text-emerald-500",
    },
  ];

  const completedCount = setupTasks.filter((task) => task.status === "complete").length;
  const completionPercentage = Math.round((completedCount / setupTasks.length) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-[#FFF3E1] rounded-3xl p-6 sm:p-10 border border-[#FFD6A5]">
        <div className="relative z-10 sm:max-w-2xl">
          <h2 className="text-2xl sm:text-4xl font-bold text-[#3B4A66] font-[BasisGrotesquePro] mb-3">
            Welcome to Seqwens! 👋
          </h2>
          <p className="text-[#64748B] text-base sm:text-xl font-medium font-[BasisGrotesquePro] leading-relaxed mb-6">
            Let's get your tax dashboard set up. You're {completionPercentage}% of the way there!
          </p>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm font-bold text-[#3B4A66] font-[BasisGrotesquePro]">
              <span>Onboarding Progress</span>
              <span className="text-[#F56D2D]">{completedCount} of {setupTasks.length} Done</span>
            </div>
            <div className="h-3 w-full bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F56D2D] transition-all duration-1000 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-[#F56D2D]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-[#3AD6F2]/5 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Setup Tasks List */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-[#E8F0FF]">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-50">
            <div>
              <h3 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">Onboarding Tasks</h3>
              <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">Follow these steps to complete your profile</p>
            </div>
          </div>

          <div className="space-y-6">
            {setupTasks.map((task, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getTaskIcon(task.title)}
                  <div>
                    <h4 className="text-base font-bold text-[#3B4A66] font-[BasisGrotesquePro] mb-0.5">
                      {task.title}
                    </h4>
                    <p className="text-sm text-[#94A3B8] font-[BasisGrotesquePro] m-0">
                      {task.description}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider font-[BasisGrotesquePro] ${
                    task.status === "complete"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-[#FFF4EC] text-[#F56D2D]"
                  }`}
                >
                  {task.status}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/taxdashboard')}
            className="w-full mt-8 py-4 bg-[#F56D2D] text-white font-bold rounded-2xl shadow-lg shadow-[#F56D2D]/20 hover:scale-[1.01] active:scale-[0.98] transition-all font-[BasisGrotesquePro]"
          >
            Go to Dashboard
          </button>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8F0FF]">
            <h3 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro] mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  className="group flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:border-[#F56D2D]/30 bg-white transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${action.color} group-hover:bg-[#F56D2D] group-hover:text-white`}>
                      {action.icon}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-800 m-0 font-[BasisGrotesquePro]">{action.title}</p>
                      <p className="text-[11px] text-gray-400 m-0 font-[BasisGrotesquePro]">{action.button}</p>
                    </div>
                  </div>
                  <div className="text-[#94A3B8] group-hover:text-[#F56D2D] transform translate-x-0 group-hover:translate-x-1 transition-all">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-gradient-to-br from-[#3AD6F2] to-[#3B82F6] rounded-3xl p-8 text-white">
            <div className="mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <Analytics size={24} />
              </div>
              <h4 className="text-xl font-bold font-[BasisGrotesquePro] mb-2 text-white">Need Any Help?</h4>
              <p className="text-white/80 text-sm font-[BasisGrotesquePro] leading-relaxed">
                Our support team is available 24/7 to assist you with any questions.
              </p>
            </div>
            <button className="w-full py-3 bg-white text-[#3B82F6] font-bold rounded-xl hover:bg-blue-50 transition-colors font-[BasisGrotesquePro]">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
