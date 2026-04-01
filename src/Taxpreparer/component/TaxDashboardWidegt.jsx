import { AiOutlineCalendar } from "react-icons/ai";
import { FileIcon, BalanceIcon, MessageIcon, UpIcon, Message2Icon, Client, Clock, Check, Msg, Calender, Uploading, Analytics } from "./icons";
import { useState, useEffect } from "react";
import { dashboardAPI, handleAPIError } from "../../ClientOnboarding/utils/apiUtils";
import { getApiBaseUrl, fetchWithCors } from "../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../ClientOnboarding/utils/userUtils";
import TaxUploadModal from "../upload/TaxUploadModal";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [summaryCards, setSummaryCards] = useState({
    assigned_clients: { count: 0, status: "", status_type: "" },
    pending_tasks: { count: 0, status: "", status_type: "" },
    completed_today: { count: 0, status: "", status_type: "" },
    new_messages: { count: 0, status: "", status_type: "" }
  });
  const [taxPreparerInfo, setTaxPreparerInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch pending tasks count from the same API as Tasks page
  const fetchPendingTasksCount = async () => {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        return;
      }

      // Use the same endpoint as Tasks page with status=pending filter
      const url = `${API_BASE_URL}/taxpayer/tax-preparer/tasks/received/?status=pending&page_size=1`;

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await fetchWithCors(url, config);

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const pendingCount = result.data.pagination?.total_count || result.data.tasks?.length || 0;

          // Update pending tasks count
          setSummaryCards(prev => ({
            ...prev,
            pending_tasks: {
              count: pendingCount,
              status: prev.pending_tasks?.status || `${pendingCount} pending tasks`,
              status_type: prev.pending_tasks?.status_type || ""
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching pending tasks count:', error);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const result = await dashboardAPI.getTaxPreparerDashboard();

        if (result.success && result.data) {
          if (result.data.summary_cards) {
            setSummaryCards(result.data.summary_cards);
          }
          if (result.data.tax_preparer_info) {
            setTaxPreparerInfo(result.data.tax_preparer_info);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        handleAPIError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // Also fetch pending tasks from the unified API
    fetchPendingTasksCount();
  }, []);

  return (
    <div className="py-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[20px] bg-[#3AD6F2] flex items-center justify-center text-white">
              <Analytics size={28} color="white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-0.5">
                Staff Dashboard
              </h3>
              <p className="text-gray-500 text-sm font-medium font-[BasisGrotesquePro]">
                Welcome back, {taxPreparerInfo
                  ? `${taxPreparerInfo.first_name || ''} ${taxPreparerInfo.last_name || ''}`.trim()
                  : loading
                    ? 'Loading...'
                    : 'Tax Preparer'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[#E8F0FF] text-[#3B4A66] font-bold text-sm transition-all !rounded-2xl hover:bg-emerald-50 hover:text-[#3AD6F2] hover:border-[#3AD6F2]/30 active:scale-95 font-[BasisGrotesquePro]"
            onClick={() => navigate('/taxdashboard/calendar')}
          >
            <AiOutlineCalendar size={18} className="text-[#3AD6F2]" />
            <span>Schedule</span>
          </button>

          <button
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#F56D2D] text-white font-bold text-sm transition-all !rounded-2xl hover:brightness-110 active:scale-95 font-[BasisGrotesquePro]"
            onClick={() => setShowUploadModal(true)}
          >
            <Uploading size={18} />
            <span>Upload Now</span>
          </button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          {
            label: "Assigned Clients",
            labelIcon: <Client size={22} className="text-[#3AD6F2]" />,
            value: loading ? "..." : summaryCards.assigned_clients?.count || 0,
            content: summaryCards.assigned_clients?.status || "Total assigned",
            path: "/taxdashboard/clients"
          },
          {
            label: "Pending Tasks",
            labelIcon: <Clock size={22} className="text-[#3AD6F2]" />,
            value: loading ? "..." : summaryCards.pending_tasks?.count || 0,
            content: summaryCards.pending_tasks?.status || "Tasks to complete",
            path: "/taxdashboard/tasks"
          },
          {
            label: "Completed Today",
            labelIcon: <Check size={22} className="text-[#3AD6F2]" />,
            value: loading ? "..." : summaryCards.completed_today?.count || 0,
            content: summaryCards.completed_today?.status || "Successful actions",
            path: "/taxdashboard/tasks?section=completed"
          },
          {
            label: "New Messages",
            labelIcon: <Msg size={22} className="text-[#3AD6F2]" />,
            value: loading ? "..." : summaryCards.new_messages?.count || 0,
            content: summaryCards.new_messages?.status || "Unread chats",
            path: "/taxdashboard/messages"
          },
        ].map((card, index) => (
          <div
            key={index}
            className={`group bg-white !rounded-2xl p-6 border border-[#E8F0FF] transition-all flex flex-col justify-between min-h-[160px] ${card.path ? 'cursor-pointer hover:border-[#3AD6F2]/30 hover:bg-[#F9FAFB] hover:-translate-y-0.5' : ''}`}
            onClick={() => card.path && navigate(card.path)}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs sm:text-sm font-medium text-gray-500 font-[BasisGrotesquePro]">{card.label}</span>
              <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-[#F3F7FF] transition-colors">
                {card.labelIcon}
              </div>
            </div>
            <div>
              <h5 className="text-2xl sm:text-3xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1 leading-none">{card.value}</h5>
              <p className="text-[11px] sm:text-xs font-medium text-[#F56D2D] font-[BasisGrotesquePro] truncate m-0">
                {loading ? 'Updating...' : card.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      <TaxUploadModal show={showUploadModal} handleClose={() => setShowUploadModal(false)} />
    </div>
  );
}
