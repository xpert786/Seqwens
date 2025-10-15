import { AiOutlineCalendar } from "react-icons/ai";
import { FileIcon, BalanceIcon, MessageIcon, UpIcon, Message2Icon } from "../components/icons";
import { useState } from "react";
import UploadModal from "../upload/UploadModal";
import "../styles/Dashboard.css";


export default function TaxDashboardWidegts() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div>
     
      <div className="dashboard-header px-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          <div>
            <h2 className="dashboard-title">Dashboard</h2>
            <h5 className="dashboard-subtitle">Welcome back, Michael Brown</h5>
          </div>

          <div className="d-flex flex-wrap gap-3 mt-2 mt-md-0">
            <button className="btn dashboard-btn btn-contact d-flex align-items-center gap-2">
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
        {[
          {
            icon: <FileIcon size={26} style={{ color: "#00C0C6" }} />,
            value: "3",
            label: "Pending Documents",
            button: "Upload Now",
          },
          {
            icon: <BalanceIcon size={26} style={{ color: "#00C0C6" }} />,
            value: "$1,250",
            label: "Outstanding Balance",
            button: "Pay Now",
          },
          {
            icon: <AiOutlineCalendar size={26} style={{ color: "#00C0C6" }} />,
            value: "Mar 15",
            label: "Next Appointment",
            button: "Reschedule",
          },
          {
            icon: <MessageIcon size={26} style={{ color: "#00C0C6" }} />,
            value: "2",
            label: "New Messages",
            button: "View All",
          },
        ].map((card, index) => (
          <div className="col-sm-6 col-md-3 px-4" key={index}>
            <div className="card dashboard-card">
              <div className="d-flex justify-content-between align-items-start">
                {card.icon}
                <h5 className="dashboard-card-value">{card.value}</h5>
              </div>
              <div>
                <div className="dashboard-card-label">{card.label}</div>
                <button className="btn dashboard-card-btn">{card.button}</button>
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
