import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComFirstIconed,
  UploadIconed,
  SignIconed,
  ReviewIconed,
  FileIconed,
  BalanceIconed,
  MessageIconed,
} from "../component/icons.jsx";
import { AiOutlineCalendar } from "react-icons/ai";
import "../styles/taxdashfirst.css"

export default function TaxDashboardMain() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("userStatus", "existing");
  }, []);

  const getTaskIcon = (title) => {
    switch (title) {
      case "Complete Profile Setup":
        return <ComFirstIconed width={50} height={50} />;
      case "Complete Data Intake Form":
        return <UploadIcon width={24} height={24} />;
      case "Schedule a Consultation":
        return <SignIcon width={24} height={24} />;
      case "Set Up Payment Method":
        return <ReviewIcon width={24} height={24} />;
      default:
        return null;
    }
  };

  const priorityBadgeClass = {
    complete: "success",
    incomplete: "secondary",
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
      status: "continue",
    },
    {
      title: "Set Up Payment Method",
      description: "Pick a billing method for services",
      status: "Add payment",
    },
  ];

  const quickActions = [
    {
      icon: <FileIcon size={28} />,
      title: "Upload Documents",
      button: "Upload Now",
    },
    {
      icon: <BalanceIcon size={28} />,
      title: "Outstanding Balance",
      button: "Pay Now",
    },
    {
      icon: <AiOutlineCalendar size={28} />,
      title: "Next Appointment",
      button: "Reschedule",
    },
    {
      icon: <MessageIcon size={28} />,
      title: "New Messages",
      button: "View All",
    },
  ];

  const completedCount = setupTasks.filter((task) => task.status === "complete").length;
  const completionPercentage = Math.round((completedCount / setupTasks.length) * 100);

  return (
    <div className="p-4">
      
      <div
        className="p-4 rounded mb-4 position-relative"
        style={{ backgroundColor: "#FFF3E1", border: "1px solid #FFD6A5" }}
      >
       
        <div
          className="position-absolute top-0 end-0 m-3 text-end"
          style={{ lineHeight: 1.1 }}
        >
          <div
            style={{
              color: "#3B4A66",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            {completionPercentage}%
          </div>
          <div
            style={{
              fontSize: "15px",
              color: "#6B7280",
            }}
          >
            Complete
          </div>
        </div>

        <h5
          className="mb-1"
          style={{ color: "#3B4A66", fontSize: "28px", fontWeight: 500, fontFamily: "BasisGrotesquePro" }}
        >
          Welcome, Michael Brown! 👋
        </h5>
        <p className="text-muted" style={{ fontSize: "18px", fontFamily: "BasisGrotesquePro" }}>
          Let's get your tax dashboard set up. You're making great progress!
        </p>
        <div className="progress" style={{ height: "8px" }}>
          <div
            className="progress-bar"
            role="progressbar"
            style={{
              width: `${completionPercentage}%`,
              backgroundColor: "#F56D2D",
            }}
          ></div>
        </div>

        <div
          className="mt-2 text-end"
          style={{
            color: "#3B4A66",
            fontSize: "16px",
            fontWeight: 500,
            fontFamily: "BasisGrotesquePro"
          }}
        >
          {completedCount} of {setupTasks.length} setup tasks completed
        </div>
      </div>

      {/* Setup Tasks */}
      <div className="bg-white rounded  p-4 mb-4">
        <h6
          style={{
            color: "#3B4A66",
            fontSize: "25px",
            fontWeight: 500,
            fontFamily: "BasisGrotesquePro"
          }}
        >
          Setup Tasks
        </h6>
        <p
          style={{
            color: "#4B5563",
            fontSize: "16px",
            fontWeight: 400,
            fontFamily: "BasisGrotesquePro"
          }}
        >
          Complete these steps to get the most out of your dashboard
        </p>

        <ul className="list-group">
          {setupTasks.map((task, idx) => {
            const status = task.status;
            return (
              <li
                key={idx}
                className="list-group-item border-0 px-0 py-3 d-flex align-items-start justify-content-between"
              >
                <div className="d-flex gap-3">
                  {getTaskIcon(task.title)}
                  <div>
                    <h6 className="mb-1" style={{ color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                      {task.title}
                    </h6>
                    <small className="text-muted" style={{ fontFamily: "BasisGrotesquePro", color: "#3B4A66" }}>{task.description}</small>
                  </div>
                </div>
                <span
                  className={`badge ${status === "complete"
                    ? "badge bg-success text-white"
                    : status === "incomplete"
                      ? "badge-incomplete"
                      : ""
                    }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                </li>
            );
          })}
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded  p-4 mt-4">
        <h6
          className="mb-1"
          style={{ color: "#3B4A66", fontSize: "18px", fontWeight: 600, fontFamily: "BasisGrotesquePro" }}
        >
          Quick Actions
        </h6>
        <p className="text-muted" style={{ fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
          Common tasks you can do right now
        </p>
        <div className="row">
          {quickActions.map((action, idx) => (
            <div key={idx} className="col-md-3 col-sm-6 mb-3">
              <div className="quick-card p-3 rounded border h-100">
                <div>
                  <div className="quick-icon-wrapper text-info">
                    {action.icon}
                  </div>

                  <h6 className="quick-card-title">{action.title}</h6>
                </div>

                <button className="btn btn-sm w-100 quick-card-btn">
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
