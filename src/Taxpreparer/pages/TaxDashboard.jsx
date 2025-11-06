import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TaxDashboardWidget from "../component/TaxDashboardWidegt";
import {
  FileIcon,
  Contacted,
  CompletedIcon,
  Building,
  Client,
  Msg,
  Clocking,
  Schedule,
  Analytics,
} from "../component/icons";
import "../styles/taxpopup.css";
import "../styles/taxdashboard.css";

// ------------------- Tasks ----------------------
const whatsDueTasks = [
  {
    title: "Review W-2 Documents",
    due: "Due: Today",
    user: (
      <span className="db-user">
        <span className="db-user-icon-wrapper"><Contacted /></span>
        John Doe
      </span>
    ),
    status: ["high", "pending"],
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
  {
    title: "Prepare Quarterly Return",
    due: "Due: Tomorrow",
    user: (
      <span className="db-user">
        <span className="db-user-icon-wrapper"><Building /></span>
        ABC Corp
      </span>
    ),
    status: ["high", "in progress"],
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
  {
    title: "Schedule Tax Review",
    due: "Due: 20/08/2025",
    user: (
      <span className="db-user">
        <span className="db-user-icon-wrapper"><Contacted /></span>
        Sarah Wilson
      </span>
    ),
    status: ["medium", "in progress"],
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
  {
    title: "Upload Tax Documents",
    due: "Due: 20/08/2025",
    user: (
      <span className="db-user">
        <span className="db-user-icon-wrapper"><Contacted /></span>
        Mike Johnson
      </span>
    ),
    status: ["low", "pending"],
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
];

const recentActivityTasks = [
  {
    title: "Quarterly Filing",
    due: "Due: 24/07/2025",
    user: (
      <span className="db-user">
        <span className="db-user-icon-wrapper"><Building /></span>
        ABC Corp
      </span>
    ),
    status: ["high"],
    value: "2 days left",
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
  {
    title: "Annual Return",
    due: "Due: 24/07/2025",
    value: "7 days left",
    user: (
      <span className="db-user">
        <span className="db-user-icon-wrapper"><Building /></span>
        XYZ LLC
      </span>
    ),
    status: ["medium"],
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
  {
    title: "Tax Review",
    due: "Due: 24/07/2025",
    value: "3 days left",
    user: (
      <span className="db-user">
        <span className="db-user-icon-wrapper"><Contacted /></span>
        Smith Family
      </span>
    ),
    status: ["low"],
    icon: <span className="icon-circle"><FileIcon /></span>,
  },
];
const messages = [
  {
    name: "John Doe",
    role: "Client",
    content: "I uploaded my W-2 forms",
    icon: <Msg />,
    time: "1 hour ago",
    type: "client",
  },
  {
    name: "Sarah Wilson",
    role: "Client",
    content: "When can we schedule the review?",
    icon: <Msg />,
    time: "3 hours ago",
    type: "client",
  },
  {
    name: "Admin",
    role: "internal",
    content: "New client assigned to you",
    icon: <Msg />,
    time: "5 hours ago",
    type: "internal",
  },
];

// ------------------- Status Colors ----------------------
const statusColors = {
  high: "#DC2626",
  medium: "var(--color-yellow-400, #FBBF24)",
  low: "var(--color-green-500, #22C55E)",
  pending: "#854D0E",
  "in progress": "var(--color-green-500, #22C55E)",
};

// ------------------- Task Card ------------------------
const TaskCard = ({ title, due, status, user, icon, selected, onClick, singleStatus, value }) => {
  const displayStatus = singleStatus && Array.isArray(status) ? [status[0]] : status;

  return (
    <div
      className="rounded-3 p-3 car"
      onClick={onClick}
      style={{
        cursor: "pointer",
        backgroundColor: selected ? "var(--Palette2-Gold-200, #FFF4E6)" : "#fff",
        transition: "background-color 0.2s",
      }}
    >
      <div>
        
        
            <div className="d-flex justify-content-between align-items-start" style={{ gap: "1rem" }}>
      
        <div className="d-flex align-items-start gap-2" style={{ flex: 1 }}>
          {icon}
          
            <div className="task-title">{title}</div>
            
         
        </div>
        <div
          className="d-flex align-items-center"
          style={{
            gap: "0.5rem",
            flexShrink: 0,
            whiteSpace: "nowrap",
            alignSelf: "flex-start",
          }}
        >
          {displayStatus?.map((s, i) => (
            <span
              key={i}
              className="badge rounded-pill text-capitalize task-badge"
              style={{
                backgroundColor: statusColors[s] || "#6B7280",
                color: "#fff",
                whiteSpace: "nowrap",
              }}
            >
              {s}
            </span>
          ))}

          {value && <h5 className="dashboard-card-value m-0">{value}</h5>}
        </div>
       
      </div>
       <div className="bother">
              <div className="task-due">{due}</div>
              <div className="task-usered">{user}</div>
            </div>
      </div>
      {/* <div className="d-flex justify-content-between align-items-start" style={{ gap: "1rem" }}>
      
        <div className="d-flex align-items-start gap-2" style={{ flex: 1 }}>
          {icon}
          
            <div className="task-title">{title}</div>
            
         
        </div>
        <div
          className="d-flex align-items-center"
          style={{
            gap: "0.5rem",
            flexShrink: 0,
            whiteSpace: "nowrap",
            alignSelf: "flex-start",
          }}
        >
          {displayStatus?.map((s, i) => (
            <span
              key={i}
              className="badge rounded-pill text-capitalize task-badge"
              style={{
                backgroundColor: statusColors[s] || "#6B7280",
                color: "#fff",
                whiteSpace: "nowrap",
              }}
            >
              {s}
            </span>
          ))}

          {value && <h5 className="dashboard-card-value m-0">{value}</h5>}
        </div>
       
      </div> */}

      
    </div>
    
  );
};

// ------------------- Main Dashboard --------------------
// ------------------- Main Dashboard --------------------
export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    const isFirstTime = localStorage.getItem("firstTimeUser");
    if (isFirstTime === "true") {
      navigate("/dashboard-first");
    }
  }, [navigate]);

  const handleSelect = (taskTitle) => setSelectedTask(taskTitle);

  return (
    <div className="container-fluid px-2 px-md-2">
      <TaxDashboardWidget />

      <div className="row mt-1 g-3 px-4">
        {/* My Tasks */}
        <div className="col-12 col-md-6">
          <div className="card custom-card p-3 p-md-4 rounded-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h1 className="section-title mb-1">My Tasks</h1>
                <p className="section-subtitle m-0">Tasks assigned to you</p>
              </div>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="d-flex flex-column gap-3">
              {whatsDueTasks.map((task, i) => (
                <TaskCard
                  key={i}
                  {...task}
                  selected={selectedTask === task.title}
                  onClick={() => handleSelect(task.title)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="col-12 col-md-6">
          <div className="card custom-card upcoming-deadlines-card">
  <div className="mb-3">
    <h1 className="section-title mb-1">Upcoming Deadlines</h1>
    <p className="section-subtitle m-0">Important dates to remember</p>
  </div>
  <div className="upcoming-deadlines-container">
    {recentActivityTasks.map((task, i) => (
      <TaskCard
        key={i}
        {...task}
        singleStatus
        value={task.value}
        selected={selectedTask === task.title}
        onClick={() => handleSelect(task.title)}
        className="upcoming-deadline-task"
      />
    ))}
  </div>
</div>

        </div>
      </div>

      {/* Bottom Section */}
      
      <div className="row mt-1 g-3 px-4">
        {/* Recent Messages */}
        
        <div className="col-12 col-md-6">
          <div className="card custom-card p-3 p-md-4 rounded-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h1 className="section-title mb-1">Recent Messages</h1>
                <p className="section-subtitle m-0">Latest client communications</p>
              </div>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="d-flex flex-column gap-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-3 p-3 car recent-msg-card ${msg.type === "client" ? "client-msg" : "internal-msg"} p-2 rounded`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: msg.type === "client" ? "#FFF4E6" : "#fff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div className="msg-icon-wrapper">{msg.icon}</div>
                    <div>
                     <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
  <span className="msg-role"style={{ fontWeight: 500 }}>{msg.name}</span>
  <span className="name-role-circle"></span> {/* small circle between name and role */}
  <span className="role-badge">{msg.role}</span>
</div>

                      <div className="msg-content" style={{ fontSize: "0.875rem", color: "#4B5563" }}>{msg.content}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "black" }}><Clocking/>{msg.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
     <div className="col-12 col-md-6">
  <div className="card custom-card p-3 p-md-4 rounded-4">
    <div className="mb-3">
      <h1 className="section-title mb-1">Quick Actions</h1>
      <p className="section-subtitle m-0">Common tasks and shortcuts</p>
    </div>
    <div className="quick-action-container">
      <div 
        className="quick-action-card"
        onClick={() => navigate('/taxdashboard/clients')}
        style={{ cursor: 'pointer' }}
      >
        <Client className="action-icon" />
        <span>View Client</span>
      </div>
      <div 
        className="quick-action-card"
        onClick={() => navigate('/taxdashboard/documents')}
        style={{ cursor: 'pointer' }}
      >
        <FileIcon className="action-icon" />
        <span>Documents</span>
      </div>
      <div 
        className="quick-action-card"
        onClick={() => navigate('/taxdashboard/calendar')}
        style={{ cursor: 'pointer' }}
      >
        <Schedule className="action-icon" />
        <span>Schedule</span>
      </div>
      <div 
        className="quick-action-card"
        onClick={() => navigate('/taxdashboard/tasks')}
        style={{ cursor: 'pointer' }}
      >
        <Analytics className="action-icon" />
        <span>Tasks</span>
      </div>
    </div>
  </div>
</div>

      </div>
    </div>
  );
}
