import { AiOutlineCalendar } from "react-icons/ai";
import { FileIcon, BalanceIcon, MessageIcon, UpIcon, Message2Icon, Client, Clock, Check, Msg, Calender, Uploading } from "./icons";
import { useState, useEffect } from "react";
import { dashboardAPI, handleAPIError } from "../../ClientOnboarding/utils/apiUtils";
import { getApiBaseUrl, fetchWithCors } from "../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../ClientOnboarding/utils/userUtils";
import "../styles/taxdashboard.css";
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
          const statistics = result.data.statistics || {};

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
    <div>

      <div className="taxdashboard-header lg:px-4 ">
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          <div>
            <h4 className="taxdashboard-title mb-1">Dashboard</h4>
            <h5 className="taxdashboard-subtitle">
              Welcome back, {taxPreparerInfo
                ? `${taxPreparerInfo.first_name || ''} ${taxPreparerInfo.last_name || ''}`.trim()
                : loading
                  ? 'Loading...'
                  : 'Tax Preparer'}
            </h5>
          </div>

          <div className="d-flex flex-wrap gap-3 mt-2 mt-md-0">
            <button
              className="btn taxdashboard-btn btn-contacted d-flex align-items-center gap-2"
              onClick={() => navigate('/taxdashboard/calendar')}
            >
              <Calender />
              View Calender
            </button>

            {/* <button className="btn dashboard-btn btn-scan d-flex align-items-center gap-2">
              <UpIcon />
              Scan Document
            </button> */}

            <button
              className="btn taxdashboard-btn btn-uploaded d-flex align-items-center gap-2"
              onClick={() => setShowUploadModal(true)}
            >
              <Uploading />
              Upload Documents
            </button>

          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="row g-3">
        {[
          {
            label: "Assigned Clients",
            icon: <Client size={26} style={{ color: "#00C0C6" }} />,
            value: loading ? "..." : summaryCards.assigned_clients?.count || 0,
            content: loading ? "Loading..." : summaryCards.assigned_clients?.status || "",
            statusType: summaryCards.assigned_clients?.status_type || "",
          },
          {
            label: "Client Pending Tasks",
            icon: <Clock size={26} style={{ color: "#00C0C6" }} />,
            value: loading ? "..." : summaryCards.pending_tasks?.count || 0,
            content: loading ? "Loading..." : summaryCards.pending_tasks?.status || "",
            statusType: summaryCards.pending_tasks?.status_type || "",
            tooltip: summaryCards.pending_tasks?.status && summaryCards.pending_tasks.status.includes('behind target')
              ? `This shows tasks that are behind your daily completion target. The target is set in your firm's settings and represents the expected number of tasks to complete per day. Currently: ${summaryCards.pending_tasks.count} pending tasks.`
              : summaryCards.pending_tasks?.status || "",
          },
          {
            label: "Completed Today",
            icon: <Check size={26} style={{ color: "#00C0C6" }} />,
            value: loading ? "..." : summaryCards.completed_today?.count || 0,
            content: loading ? "Loading..." : summaryCards.completed_today?.status || "",
            statusType: summaryCards.completed_today?.status_type || "",
          },
          {
            label: "New Messages",
            icon: <Msg size={26} style={{ color: "#00C0C6" }} />,
            value: loading ? "..." : summaryCards.new_messages?.count || 0,
            content: loading ? "Loading..." : summaryCards.new_messages?.status || "",
            statusType: summaryCards.new_messages?.status_type || "",
          },
        ].map((card, index) => {
          // Hide icons when status_type is "no_change"
          const shouldShowStatusIcon = card.statusType !== "no_change";

          return (
            <div className="col-sm-6 col-md-3 lg:px-4 md:px-2 px-1" key={index}>
              <div
                className="carded dashboard-carded"
                style={{ cursor: 'default', position: 'relative' }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="dashboarded-carded-labeled">{card.label}</div>
                  {card.icon}
                </div>
                <h5 className="dashboarded-carded-valued">{card.value}</h5>
                <div style={{ position: 'relative' }}>
                  <p
                    className="card-contented"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: card.tooltip ? 'help' : 'default'
                    }}
                    title={card.tooltip || card.content}
                  >
                    {card.content}
                    {/* Only show tooltip icon if status_type is not "no_change" */}
                    {card.tooltip && shouldShowStatusIcon && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          cursor: 'help'
                        }}
                        title={card.tooltip}
                      >

                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>



      {/* Upload Modal */}
      <TaxUploadModal show={showUploadModal} handleClose={() => setShowUploadModal(false)} />
    </div>
  );
}
