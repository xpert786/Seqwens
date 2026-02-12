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
        // Navigate to My Documents
        navigate("/dashboard/documents");
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
        // Navigate to Invoices & Payments
        navigate("/dashboard/invoices");
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
        // Navigate to Appointments
        navigate("/dashboard/appointments");
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
        // Navigate to Messages
        navigate("/dashboard/messages");
      },
    },
  ];

  return (
    <div>

      <div className="dashboard-header lg:px-4 md:px-2 px-1 dashboard-header-responsive">
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          <div>
            <h4 className="dashboard-title">Dashboard</h4>
            <h5 className="dashboard-subtitle">Welcome back, {userName}</h5>
          </div>

          <div className="d-flex flex-wrap gap-3 mt-2 mt-md-0">
            <button
              className="btn dashboard-btn btn-contact d-flex align-items-center gap-2 "
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
          <div className="col-sm-6 col-md-3 lg:px-4 md:px-2 px-1" key={index}>
            <div className="card dashboard-card">
              <div className="d-flex justify-content-start align-items-start mb-3">
                {card.icon}
              </div>
              <div className="d-flex justify-content-center align-items-center mb-3">
                <p className="dashboarder-card-value">
                  {card.value}
                </p>
              </div>
              <div>
                <div className="dashboard-card-label" style={{ textAlign: "center" }}>{card.label}</div>
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
