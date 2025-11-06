import { AiOutlineCalendar } from "react-icons/ai";
import { FileIcon, BalanceIcon, MessageIcon, UpIcon, Message2Icon, Client, Clock, Check, Msg, Calender, Uploading } from "./icons";
import { useState, useEffect } from "react";
import { getApiBaseUrl, fetchWithCors } from "../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../ClientOnboarding/utils/apiUtils";
import "../styles/taxdashboard.css";
import TaxUploadModal from "../upload/TaxUploadModal";
export default function Dashboard() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [summaryCards, setSummaryCards] = useState({
    assigned_clients: { count: 0, status: "", status_type: "" },
    pending_tasks: { count: 0, status: "", status_type: "" },
    completed_today: { count: 0, status: "", status_type: "" },
    new_messages: { count: 0, status: "", status_type: "" }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = getApiBaseUrl();
        const token = getAccessToken();

        if (!token) {
          console.error('No authentication token found');
          setLoading(false);
          return;
        }

        const config = {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        };

        const url = `${API_BASE_URL}/taxpayer/tax-preparer/dashboard/`;
        const response = await fetchWithCors(url, config);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Dashboard API response:', result);

        if (result.success && result.data && result.data.summary_cards) {
          setSummaryCards(result.data.summary_cards);
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

  return (
    <div>
     
      <div className="taxdashboard-header px-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          <div>
            <h2 className="taxdashboard-title">Dashboard</h2>
            <h5 className="taxdashboard-subtitle">Welcome back, Michael Brown</h5>
          </div>

          <div className="d-flex flex-wrap gap-3 mt-2 mt-md-0">
            <button className="btn taxdashboard-btn btn-contacted d-flex align-items-center gap-2">
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
               My Tasks
            </button>

          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="row g-3">
        {[
          {
            label:"Assigned Clients",
            icon: <Client size={26} style={{ color: "#00C0C6" }} />,
            value: loading ? "..." : summaryCards.assigned_clients?.count || 0,
            content: loading ? "Loading..." : summaryCards.assigned_clients?.status || "",
          },
          {
             label:"Pending Tasks",
            icon: <Clock size={26} style={{ color: "#00C0C6" }} />,
            value: loading ? "..." : summaryCards.pending_tasks?.count || 0,
            content: loading ? "Loading..." : summaryCards.pending_tasks?.status || "",
          },
          {
             label:"Completed Today",
            icon: <Check size={26} style={{ color: "#00C0C6" }} />,
            value: loading ? "..." : summaryCards.completed_today?.count || 0,
            content: loading ? "Loading..." : summaryCards.completed_today?.status || "",
          },
          {
           label:"New Messages",
            icon: <Msg size={26} style={{ color: "#00C0C6" }} />,
            value: loading ? "..." : summaryCards.new_messages?.count || 0,
            content: loading ? "Loading..." : summaryCards.new_messages?.status || "",
          },
        ].map((card, index) => (
          <div className="col-sm-6 col-md-3 px-4" key={index}>
            <div className="carded dashboard-carded">
              <div className="d-flex justify-content-between align-items-start">
              <div className="dashboarded-carded-labeled">{card.label}</div>
                  {card.icon}
               
              </div>
               <h5 className="dashboarded-carded-valued">{card.value}</h5>
              <div>

                <p className="card-contented">{card.content}</p>
              </div>
            </div>
          </div>

        ))}
      </div>



      {/* Upload Modal */}
      <TaxUploadModal show={showUploadModal} handleClose={() => setShowUploadModal(false)} />
    </div>
  );
}
