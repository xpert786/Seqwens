import React, { useState } from "react";
import { FaTimes, FaEnvelopeOpen, FaFileAlt, FaBell, FaCheckDouble } from "react-icons/fa";

export default function NotificationsPanel() {
  const [selectedTab, setSelectedTab] = useState("all");

  const tabs = [
    { label: "All", key: "all" },
    { label: "Unread", key: "unread" },
    { label: "Read", key: "read" },
  ];

  const notifications = [
    {
      id: 1,
      title: "New message from Sarah Johnson",
      message: "Your tax return has been completed and is ready for review.",
      priority: "High",
      time: "2 minutes ago",
      group: "Today",
      icon: <FaEnvelopeOpen />,
    },
    {
      id: 2,
      title: "Document upload request",
      message: "Please upload your W-2 forms for 2023 tax year.",
      priority: "Medium",
      time: "1 hour ago",
      group: "Today",
      icon: <FaFileAlt />,
    },
    {
      id: 3,
      title: "Invoice payment received",
      message: "Payment of $750.00 has been processed successfully.",
      priority: "Low",
      time: "3 hours ago",
      group: "Today",
      icon: <FaBell />,
    },
    {
      id: 4,
      title: "Appointment reminder",
      message: "Tax return review scheduled for tomorrow at 10:00 AM.",
      priority: "Medium",
      time: "1 day ago",
      group: "Yesterday",
      icon: <FaBell />,
    },
    {
      id: 5,
      title: "Document ready for signature",
      message: "Your 2023 tax return is ready for electronic signature.",
      priority: "High",
      time: "2 days ago",
      group: "2 Days Ago",
      icon: <FaFileAlt />,
    },
  ];

  const groupedNotifications = notifications.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const priorityColor = {
    High: "#EF4444",
    Medium: "#FBBF24",
    Low: "#22C55E",
  };

  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div
      className="position-absolute top-0 end-0 bg-white shadow rounded-4 p-3"
      style={{
        width: "540px",
        height: "90vh",
        zIndex: 1050,
        marginTop: "80px",
        marginRight: "20px",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 px-2">
        <h5 className="mb-0" style={{ color: "#FF9D19" }}>Notifications</h5>
        <FaTimes className="cursor-pointer" onClick={() => setVisible(false)} />
      </div>

      {/* Tabs and "Make All Read" */}
      <div className="bg-white border p-3 rounded-4 mb-3 mx-2">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div className="d-flex gap-2 flex-grow-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className="btn btn-sm"
                style={{
                  backgroundColor:
                    selectedTab === tab.key ? "#00C0C6" : "transparent",
                  color: selectedTab === tab.key ? "#fff" : "#000",
                  borderRadius: "6px",
                  border: "none",
                  fontWeight: 500,
                  padding: "6px 12px",
                }}
              >
                {tab.label} (
                {
                  notifications.filter((n) =>
                    tab.key === "all" ? true : tab.key === "unread"
                  ).length
                }
                )
              </button>
            ))}
          </div>
          <button className="btn btn-sm d-flex align-items-center gap-2" style={{ fontWeight: 500 }}>
            <FaCheckDouble />
            Make All Read
          </button>
        </div>
      </div>

      {/* Notification Groups */}
      {Object.keys(groupedNotifications).map((group) => (
        <div key={group} className="mb-3">
          <h6 className="text-muted px-2">{group}</h6>
          {groupedNotifications[group].map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-4 border d-flex justify-content-between align-items-start p-3 shadow-sm mx-2 mb-3"
              style={{ width: "100%" }}
            >
              <div className="d-flex align-items-start gap-3" style={{ flex: 1 }}>
                <div className="pt-1 text-secondary">{note.icon}</div>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <strong style={{ color: "#3B4A66" }}>{note.title}</strong>
                    <span
                      style={{
                        backgroundColor: priorityColor[note.priority],
                        color: "#fff",
                        borderRadius: "10px",
                        padding: "2px 6px",
                        fontSize: "0.75rem",
                      }}
                    >
                      {note.priority}
                    </span>
                  </div>
                  <small className="text-muted d-block" style={{ color: "#4B5563" }}>{note.message}</small>
                </div>
              </div>

              <div className="d-flex flex-column align-items-end justify-content-between">
                <FaTimes className="text-muted mb-2" style={{ cursor: "pointer" }} />
                <small className="text-muted">{note.time}</small>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
