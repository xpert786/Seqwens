import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardWidgets from "../components/DashboardWidgets";
import {
  FileIcon,
  DateIcon,
  CompletedIcon,
  SignatureIcon,
} from "../components/icons";
import "../styles/Popup.css";

// -------------------- Task Data ----------------------

const whatsDueTasks = [
  {
    title: "Upload W-2 Forms",
    due: "Due Now",
    status: "high",
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
  {
    title: "Sign Tax Return",
    due: "Due Mar 15",
    status: "high",
    icon: <span className="icon-circle"><SignatureIcon /></span>,
  },
  {
    title: "Review Quarterly Estimates",
    due: "Due Mar 21",
    status: "medium",
    icon: <span className="icon-circle"><CompletedIcon /></span>,
  },
  {
    title: "Schedule Next Meeting",
    due: "Due Apr 01",
    status: "low",
    icon: <span className="icon-circle"><DateIcon /></span>,
  },
];

const recentActivityTasks = [
  {
    title: "Review Quarterly Estimates",
    due: "Due Mar 21",
    status: "medium",
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
  {
    title: "Schedule Next Meeting",
    due: "Due Apr 01",
    status: "low",
    icon: <span className="icon-circle"><SignatureIcon /></span>,
  },
  {
    title: "Review Quarterly Estimates",
    due: "Due Mar 21",
    status: "medium",
    icon: <span className="icon-circle"><CompletedIcon /></span>,
  },
  {
    title: "Schedule Next Meeting",
    due: "Due Apr 01",
    status: "low",
    icon: <span className="icon-circle"><DateIcon /></span>,
  },
];

// ------------------- Styling Map ----------------------

const priorityBadgeClass = {
  high: "danger",
  medium: "warning",
  low: "success",
};

// ------------------- Task Card ------------------------

const TaskCard = ({ title, due, status, icon }) => (
  <div className="card  rounded-3 p-3">
    <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
      <div className="d-flex align-items-start gap-2">
        {icon}
        <div>
          <div
            className="fw-medium"
            style={{
              color: "#3B4A66",
              fontFamily: "BasisGrotesquePro",
              fontSize: "14px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: "#4B5563",
              fontFamily: "BasisGrotesquePro",
              fontWeight: "400",
              fontSize: "12px",
            }}
          >
            {due}
          </div>
        </div>
      </div>
      <span
        className={`badge bg-${priorityBadgeClass[status]} rounded-pill text-capitalize`}
        style={{ fontSize: "11px" }}
      >
        {status}
      </span>
    </div>
  </div>
);

// ------------------- Main Dashboard --------------------

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const isFirstTime = localStorage.getItem("firstTimeUser");
    if (isFirstTime === "true") {
      navigate("/dashboard-first");
    }
  }, [navigate]);

  return (
    <div className="container-fluid px-2 px-md-2 ">
      <DashboardWidgets />

      <div className="row mt-1 g-3">
        {/* What's Due Section */}
        <div className="col-12 col-md-6">
         <div className="card custom-card p-3 p-md-4 rounded-4 h-100">

            <div className="mb-3">
              <h1
                className="mb-1"
                style={{
                  color: "#3B4A66",
                  fontFamily: "BasisGrotesquePro",
                  fontWeight: "500",
                  fontSize: "18px",
                }}
              >
                What's Due
              </h1>
              <p
                className="m-0"
                style={{
                  color: "#4B5563",
                  fontFamily: "BasisGrotesquePro",
                  fontWeight: "400",
                  fontSize: "14px",
                }}
              >
                Your latest interactions
              </p>
            </div>

            <div className="d-flex flex-column gap-3">
              {whatsDueTasks.map((task, i) => (
                <TaskCard key={i} {...task} />
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="col-12 col-md-6">
         <div className="card custom-card p-3 p-md-4 rounded-4 h-100">
            <div className="mb-3">
              <h1
                className="mb-1"
                style={{
                  color: "#3B4A66",
                  fontFamily: "BasisGrotesquePro",
                  fontWeight: "500",
                  fontSize: "18px",
                }}
              >
                Recent Activity
              </h1>
              <p
                className="m-0"
                style={{
                  color: "#4B5563",
                  fontFamily: "BasisGrotesquePro",
                  fontWeight: "400",
                  fontSize: "14px",
                }}
              >
                Your latest interactions
              </p>
            </div>

            <div className="d-flex flex-column gap-3">
              {recentActivityTasks.map((task, i) => (
                <TaskCard key={i} {...task} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
