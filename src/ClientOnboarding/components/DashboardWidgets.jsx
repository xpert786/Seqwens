import { AiOutlineCalendar } from "react-icons/ai";
import { FileIcon, BalanceIcon, MessageIcon, UpIcon, Message2Icon } from "../components/icons";
import { useState } from "react";
import UploadModal from "../upload/UploadModal";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";


export default function TaxDashboardWidegts({ dashboardData, loading }) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const navigate = useNavigate();

  // Get user name from dashboard data - use first name and last name
  const firstName = dashboardData?.taxpayer_info?.first_name || "";
  const lastName = dashboardData?.taxpayer_info?.last_name || "";
  const userName = firstName && lastName
    ? `${firstName} ${lastName}`.trim()
    : firstName || lastName || "User";

  // Prepare summary cards data from API
  const summaryCards = [
    {
      icon: <FileIcon size={26} style={{ color: "#00C0C6" }} />,
      value: loading
        ? "..."
        : (dashboardData?.summary_cards?.pending_documents?.count?.toString() || "0"),
      label: "Pending Documents",
      button: dashboardData?.summary_cards?.pending_documents?.action || "Upload Now",
      onClick: () => {
        // Navigate to My Documents with Document Requests tab
        navigate("/my-documents?tab=requests");
      },
    },
    {
      icon: <BalanceIcon size={26} style={{ color: "#00C0C6" }} />,
      value: loading
        ? "..."
        : (dashboardData?.summary_cards?.outstanding_balance?.amount_formatted || "$0.00"),
      label: "Outstanding Balance",
      button: dashboardData?.summary_cards?.outstanding_balance?.action || "Pay Now",
      onClick: () => {
        // Navigate to billing/payment page if available
        // navigate("/billing");
      },
    },
    {
      icon: <AiOutlineCalendar size={26} style={{ color: "#00C0C6" }} />,
      value: loading
        ? "..."
        : (dashboardData?.summary_cards?.next_appointment?.date_formatted || "No appointment"),
      label: "Next Appointment",
      button: dashboardData?.summary_cards?.next_appointment ? "Reschedule" : "Schedule",
      onClick: () => {
        // Navigate to appointments page if available
        // navigate("/appointments");
      },
    },
    {
      icon: <MessageIcon size={26} style={{ color: "#00C0C6" }} />,
      value: loading
        ? "..."
        : (dashboardData?.summary_cards?.new_messages?.count?.toString() || "0"),
      label: "New Messages",
      button: dashboardData?.summary_cards?.new_messages?.action || "View All",
      onClick: () => {
        // Navigate to messages page
        navigate("/messages");
      },
    },
  ];

  return (
    <div>

      <div className="dashboard-header px-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          <div>
            <h2 className="dashboard-title">Dashboard</h2>
            <h5 className="dashboard-subtitle">Welcome back, {userName}</h5>
          </div>

          <div className="d-flex flex-wrap gap-3 mt-2 mt-md-0">
            <button
              className="btn dashboard-btn btn-contact d-flex align-items-center gap-2"
              onClick={() => navigate("/messages")}
            >
              <Message2Icon />
              Contact Firm
            </button>

            {/* <button className="btn dashboard-btn btn-scan d-flex align-items-center gap-2">
              <UpIcon />
              Scan Document
            </button> */}

            <button
              className="btn dashboard-btn btn-upload d-flex align-items-center gap-2"
              onClick={() => setShowUploadModal(true)}
            >
              <UpIcon />
              Upload Documents
            </button>

          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="row g-3">
        {summaryCards.map((card, index) => (
          <div className="col-sm-6 col-md-3 px-4" key={index}>
            <div className="card dashboard-card">
              <div className="d-flex justify-content-between align-items-start">
                {card.icon}
                <h5 className="dashboard-card-value">{card.value}</h5>
              </div>
              <div>
                <div className="dashboard-card-label">{card.label}</div>
                <button
                  className="btn dashboard-card-btn"
                  onClick={card.onClick}
                >
                  {card.button}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      <UploadModal show={showUploadModal} handleClose={() => setShowUploadModal(false)} />
    </div>
  );
}
