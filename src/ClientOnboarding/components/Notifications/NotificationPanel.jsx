import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileIcon,
  BalanceIcon,
  Message3Icon,
  SignIcon,
  SignatureIcon,
  CrossIcon,
  MakeIcon,
  Cross2Icon,
} from "../../components/icons";
import "../../styles/NotificationsPanel.css";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: "New message from Sarah Johnson",
    message: "Your tax return has been completed and is ready for review.",
    priority: "High",
    time: "2 minutes ago",
    group: "Today",
    icon: <Message3Icon />,
    read: false,
  },
  {
    id: 2,
    title: "Document upload request",
    message: "Please upload your W-2 forms for the 2023 tax year.",
    priority: "Medium",
    time: "1 hour ago",
    group: "Today",
    icon: <FileIcon />,
    read: false,
  },
  {
    id: 3,
    title: "Invoice payment received",
    message: "Payment of $750.00 has been processed successfully.",
    priority: "Low",
    time: "3 hours ago",
    group: "Today",
    icon: <BalanceIcon />,
    read: true,
  },
  {
    id: 4,
    title: "Appointment reminder",
    message: "Tax return review scheduled for tomorrow at 10:00 AM.",
    priority: "Medium",
    time: "1 day ago",
    group: "Yesterday",
    icon: <SignatureIcon />,
    read: true,
  },
  {
    id: 5,
    title: "Document ready for signature",
    message: "Your 2023 tax return is ready for electronic signature.",
    priority: "High",
    time: "2 days ago",
    group: "2 Days Ago",
    icon: <SignIcon />,
    read: true,
  },
];

const TABS = [
  { label: "All", key: "all" },
  { label: "Unread", key: "unread" },
  { label: "Read", key: "read" },
];

const PRIORITY_COLOR = {
  High: "#EF4444",
  Medium: "#FBBF24",
  Low: "#22C55E",
};

export default function NotificationsPanel({ onClose, onChange }) {
  const [selectedTab, setSelectedTab] = useState("all");
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [onClose]);

  useEffect(() => {
    const initialOverflow = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = initialOverflow;
    };
  }, []);

  useEffect(() => {
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        const bellIcon = event.target.closest(".notification-bell");
        if (!bellIcon && onClose) {
          onClose();
        }
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!onClose) return null;

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    switch (selectedTab) {
      case "unread":
        return notifications.filter((notification) => !notification.read);
      case "read":
        return notifications.filter((notification) => notification.read);
      default:
        return notifications;
    }
  }, [notifications, selectedTab]);

  const groupedNotifications = useMemo(() => {
    return filteredNotifications.reduce((accumulator, notification) => {
      if (!accumulator[notification.group]) {
        accumulator[notification.group] = [];
      }
      accumulator[notification.group].push(notification);
      return accumulator;
    }, {});
  }, [filteredNotifications]);

  const emitChange = useCallback(
    (nextNotifications) => {
      if (typeof onChange === "function") {
        const nextUnread = nextNotifications.filter((notification) => !notification.read).length;
        onChange({ notifications: nextNotifications, unreadCount: nextUnread });
      }
    },
    [onChange]
  );

  useEffect(() => {
    if (typeof onChange === "function") {
      emitChange(MOCK_NOTIFICATIONS);
    }
    // only emit the initial state when the component mounts
  }, [emitChange, onChange]);

  const updateNotification = (id, updater) => {
    setNotifications((prev) => {
      const next = prev.map((notification) =>
        notification.id === id ? { ...notification, ...updater } : notification
      );
      emitChange(next);
      return next;
    });
  };

  const removeNotification = (id) => {
    setNotifications((prev) => {
      const next = prev.filter((notification) => notification.id !== id);
      emitChange(next);
      return next;
    });
  };

  const markAllRead = () => {
    setNotifications((prev) => {
      const next = prev.map((notification) => ({ ...notification, read: true }));
      emitChange(next);
      return next;
    });
  };

  const handleNotificationAction = (notification) => {
    // Placeholder for future navigation/CTA logic.
    updateNotification(notification.id, { read: true });
  };

  return (
    <div
      className="notifications-panel shadow rounded-4"
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-title"
    >
      <div className="d-flex justify-content-between align-items-center mb-3 px-2">
        <h5 id="notifications-title" className="mb-0 txts">
          Notifications
        </h5>
        <button
          ref={closeButtonRef}
          type="button"
          className="btn btn-link p-0 border-0"
          onClick={onClose}
          aria-label="Close notifications"
        >
          <CrossIcon />
        </button>
      </div>

      <div className="bg-white mb-3 mx-2">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="bg-white p-1 rounded-2 d-flex gap-3 bor">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`btn btn-sm ${
                  selectedTab === tab.key ? "active-tab" : "inactive-tab"
                }`}
              >
                {tab.label} (
                {tab.key === "all"
                  ? notifications.length
                  : tab.key === "unread"
                  ? notifications.filter((notification) => !notification.read).length
                  : notifications.filter((notification) => notification.read).length}
                )
              </button>
            ))}
          </div>

          <div className="colour4 p-1 rounded-2">
            <button
              className="btn btn-sm d-flex align-items-center gap-2"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              <MakeIcon />
              Make All read
            </button>
          </div>
        </div>
      </div>

      {Object.keys(groupedNotifications).length === 0 && (
        <div className="text-center text-muted py-4">No notifications in this view.</div>
      )}

      {Object.keys(groupedNotifications).map((group) => (
        <div key={group} className="mb-3">
          <h6 className="text-muted px-2">{group}</h6>
          {groupedNotifications[group].map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-2 border d-flex justify-content-between align-items-start p-3 mx-2 mb-3 notification-item ${
                notification.read ? "notification-read" : "notification-unread"
              }`}
              role="button"
              tabIndex={0}
              onClick={() => handleNotificationAction(notification)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleNotificationAction(notification);
                }
              }}
            >
              <div className="d-flex align-items-start gap-3 flex-fill">
                <span className="notification-icon d-flex align-items-center justify-content-center">
                  {notification.icon}
                </span>

                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <strong className="colour1">{notification.title}</strong>
                    <span
                      className="priority-badge"
                      style={{ backgroundColor: PRIORITY_COLOR[notification.priority] }}
                    >
                      {notification.priority}
                    </span>
                  </div>
                  <small className="text-colour d-block">{notification.message}</small>
                </div>
              </div>

              <div className="d-flex flex-column align-items-end justify-content-between">
                <button
                  type="button"
                  className="btn btn-link text-muted mb-2 p-0 border-0 notification-dismiss"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeNotification(notification.id);
                  }}
                  aria-label="Dismiss notification"
                >
                  <Cross2Icon />
                </button>
                <small className="txt-colour2">{notification.time}</small>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
