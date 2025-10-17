import React, { useState } from "react";
import { FileIcon, BalanceIcon, Message3Icon, SignIcon, SignatureIcon, CrossIcon, MakeIcon, Cross2Icon } from "../../components/icons"
import "../../styles/NotificationsPanel.css";

export default function NotificationsPanel() {
  const [selectedTab, setSelectedTab] = useState("all");
 const [visible, setVisible] = useState(true);

  if (!visible) return null;
  const tabs = [
    { label: "All", key: "all" },
    { label: "Unread", key: "unread" },
    { label: "Read", key: "read" },
  ];

  const notifications = [
    {
      id: 1,
      title: "New message from Sarah Johnson",
      message: "Your tax return has been completed andfor review.",
      priority: "High",
      time: "2 minutes ago",
      group: "Today",
      icon: <Message3Icon />,
    },
    {
      id: 2,
      title: "Document upload request",
      message: "Please upload your W-2 forms for 2023 tax year.",
      priority: "Medium",
      time: "1 hour ago",
      group: "Today",
      icon: <FileIcon />,
    },
    {
      id: 3,
      title: "Invoice payment received",
      message: "Payment of $750.00 has been processed successfully.",
      priority: "Low",
      time: "3 hours ago",
      group: "Today",
      icon: <BalanceIcon />,
    },
    {
      id: 4,
      title: "Appointment reminder",
      message: "Tax return review scheduled for tomorrow at 10:00 AM.",
      priority: "Medium",
      time: "1 day ago",
      group: "Yesterday",
      icon: <SignatureIcon />,
    },
    {
      id: 5,
      title: "Document ready for signature",
      message: "Your 2023 tax return is ready for electronic signature.",
      priority: "High",
      time: "2 days ago",
      group: "2 Days Ago",
      icon: <SignIcon />,
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



  return (
    <div className="notifications-panel shadow rounded-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 px-2">
        <h5 className="mb-0 txts">Notifications</h5>
        <CrossIcon
          className="cursor-pointer"
          onClick={() => setVisible(false)}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white mb-3 mx-2">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

          {/* Tabs Box */}
          <div className="bg-white p-1 rounded-2 d-flex gap-3 bor">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`btn btn-sm ${selectedTab === tab.key ? "active-tab" : "inactive-tab"
                  }`}
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

          {/* Make All Read Box */}
          <div className="colour4 p-1 rounded-2">
            <button className="btn btn-sm d-flex align-items-center gap-2 ">
              <MakeIcon />
              Make All read
            </button>
          </div>

        </div>
      </div>



      {Object.keys(groupedNotifications).map((group) => (
        <div key={group} className="mb-3">
          <h6 className="text-muted px-2">{group}</h6>
          {groupedNotifications[group].map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-2 border d-flex justify-content-between align-items-start p-3 mx-2 mb-3"
            >
              <div className="d-flex align-items-start gap-3 flex-fill">
               
                <span className="notification-icon d-flex align-items-center justify-content-center">
                  {note.icon}
                </span>

                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <strong className="colour1">{note.title}</strong>
                    <span
                      className="priority-badge"
                      style={{ backgroundColor: priorityColor[note.priority] }}
                    >
                      {note.priority}
                    </span>
                  </div>
                  <small className="text-colour d-block">{note.message}</small>
                </div>
              </div>

              <div className="d-flex flex-column align-items-end justify-content-between">
                <Cross2Icon className="text-muted mb-2 cursor-pointer" />
                <small className="txt-colour2">{note.time}</small>
              </div>
            </div>
          ))}
        </div>
      ))}

    </div>
  );
}
