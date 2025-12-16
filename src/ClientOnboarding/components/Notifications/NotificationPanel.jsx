import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { clientNotificationAPI, firmAdminNotificationAPI, handleAPIError } from "../../utils/apiUtils";
import { useNotificationWebSocket } from "../../utils/useNotificationWebSocket";
import "../../styles/NotificationsPanel.css";

const TABS = [
  { label: "All", key: "all" },
  { label: "Unread", key: "unread" },
  { label: "Read", key: "read" },
];

const PRIORITY_COLOR = {
  high: "#EF4444",
  medium: "#FBBF24",
  low: "#22C55E",
};

// Map notification types to icons
const getNotificationIcon = (notificationType) => {
  switch (notificationType) {
    case "message_received":
    case "client_message":
    case "staff_message":
      return <Message3Icon />;
    case "task_assigned":
      return <FileIcon />;
    case "document_upload_request":
      return <FileIcon />;
    case "invoice_paid":
    case "payment_received":
      return <BalanceIcon />;
    case "esign_request":
    case "document_ready_for_signature":
      return <SignIcon />;
    case "appointment_created":
    case "appointment_approved":
    case "appointment_reminder":
      return <SignatureIcon />;
    case "new_client":
    case "client_assigned":
      return <Message3Icon />;
    default:
      return <Message3Icon />;
  }
};

// Format date to "time ago" format
const formatTimeAgo = (dateString) => {
  if (!dateString) return "Just now";

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
};

// Group notifications by date
const groupNotificationsByDate = (notifications) => {
  const groups = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  notifications.forEach((notification) => {
    const notificationDate = new Date(notification.created_at);
    const notificationDateOnly = new Date(
      notificationDate.getFullYear(),
      notificationDate.getMonth(),
      notificationDate.getDate()
    );

    let group;
    if (notificationDateOnly.getTime() === today.getTime()) {
      group = "Today";
    } else if (notificationDateOnly.getTime() === yesterday.getTime()) {
      group = "Yesterday";
    } else {
      const diffInDays = Math.floor((today - notificationDateOnly) / (1000 * 60 * 60 * 24));
      if (diffInDays < 7) {
        group = `${diffInDays} Days Ago`;
      } else {
        group = notificationDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: notificationDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
      }
    }

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(notification);
  });

  return groups;
};

// Transform API notification to component format
const transformNotification = (apiNotification) => {
  return {
    id: apiNotification.id,
    title: apiNotification.title || "Notification",
    message: apiNotification.message || "",
    priority: apiNotification.priority || "medium",
    priorityDisplay: apiNotification.priority_display || "Medium",
    time: apiNotification.time_ago || formatTimeAgo(apiNotification.created_at),
    created_at: apiNotification.created_at,
    icon: getNotificationIcon(apiNotification.notification_type),
    read: apiNotification.is_read || false,
    notification_type: apiNotification.notification_type,
    extra_data: apiNotification.extra_data || {},
  };
};

export default function NotificationsPanel({ onClose, onChange, userType = "client" }) {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  
  // Maximum number of notifications to show initially
  const MAX_INITIAL_NOTIFICATIONS = 5;

  // Determine which API to use based on user type
  const notificationAPI = userType === "firm_admin" ? firmAdminNotificationAPI : clientNotificationAPI;

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

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (selectedTab === "unread") {
        params.is_read = false;
      } else if (selectedTab === "read") {
        params.is_read = true;
      }

      const response = await notificationAPI.listNotifications(params);

      if (response.success && response.data) {
        const transformedNotifications = response.data.notifications.map(transformNotification);
        setNotifications(transformedNotifications);
        setUnreadCount(response.data.unread_count || 0);

        // Notify parent component
        if (typeof onChange === "function") {
          onChange({
            notifications: transformedNotifications,
            unreadCount: response.data.unread_count || 0,
          });
        }
      } else {
        throw new Error(response.message || "Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  }, [selectedTab, notificationAPI, onChange]);

  // Fetch notifications on mount and when tab changes
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]); // Only refetch when selectedTab changes

  // Fetch unread count - memoized to prevent unnecessary re-renders
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.success && response.data) {
        const newUnreadCount = response.data.unread_count || 0;
        setUnreadCount(newUnreadCount);
        if (typeof onChange === "function") {
          onChange({
            notifications,
            unreadCount: newUnreadCount,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, [notificationAPI, onChange]);

  // WebSocket connection for real-time notifications
  const handleNewNotification = useCallback((notification) => {
    const transformed = transformNotification(notification);
    setNotifications((prev) => {
      // Check if notification already exists
      const exists = prev.some((n) => n.id === transformed.id);
      if (exists) {
        return prev.map((n) => (n.id === transformed.id ? transformed : n));
      }
      return [transformed, ...prev];
    });
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const handleUnreadCountUpdate = useCallback((count) => {
    setUnreadCount(count);
    if (typeof onChange === "function") {
      onChange({
        notifications,
        unreadCount: count,
      });
    }
  }, [notifications, onChange]);

  useNotificationWebSocket(true, handleNewNotification, handleUnreadCountUpdate);

  if (!onClose) return null;

  const sortByRecent = (items = []) =>
    [...items].sort(
      (a, b) =>
        new Date(b.created_at || b.time || 0) - new Date(a.created_at || a.time || 0)
    );

  // Apply tab filter to notifications
  const filteredNotifications = useMemo(() => {
    if (selectedTab === "unread") {
      return sortByRecent(notifications.filter((notification) => !notification.read));
    } else if (selectedTab === "read") {
      return sortByRecent(
        notifications.filter((notification) => notification.read)
      );
    }
    // "all" tab shows all notifications
    return sortByRecent(notifications);
  }, [notifications, selectedTab]);

  const groupedNotifications = useMemo(() => {
    // Limit notifications if not showing all
    const notificationsToShow = showAllNotifications 
      ? filteredNotifications 
      : filteredNotifications.slice(0, MAX_INITIAL_NOTIFICATIONS);
    return groupNotificationsByDate(notificationsToShow);
  }, [filteredNotifications, showAllNotifications]);

  // Check if there are more notifications than displayed
  const hasMoreNotifications = useMemo(() => {
    return filteredNotifications.length > MAX_INITIAL_NOTIFICATIONS;
  }, [filteredNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await notificationAPI.markAsRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));
        // Notify parent component
        if (typeof onChange === "function") {
          const updatedNotifications = notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          );
          const newUnreadCount = Math.max(0, unreadCount - 1);
          onChange({
            notifications: updatedNotifications,
            unreadCount: newUnreadCount,
          });
        }
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }, [notifications, unreadCount, onChange]);

  const removeNotification = useCallback(async (notificationId) => {
    try {
      const notificationToRemove = notifications.find((n) => n.id === notificationId);
      const wasUnread = notificationToRemove && !notificationToRemove.read;
      
      const response = await notificationAPI.deleteNotification(notificationId);
      if (response.success) {
        setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
        
        // Update unread count if removed notification was unread
        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
          // Notify parent component
          if (typeof onChange === "function") {
            const updatedNotifications = notifications.filter((n) => n.id !== notificationId);
            const newUnreadCount = Math.max(0, unreadCount - 1);
            onChange({
              notifications: updatedNotifications,
              unreadCount: newUnreadCount,
            });
          }
        }
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  }, [notifications, unreadCount, onChange]);

  const markAllRead = useCallback(async () => {
    try {
      const response = await notificationAPI.markAllAsRead();
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
        if (typeof onChange === "function") {
          onChange({
            notifications: notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
          });
        }
        // Refetch notifications to get updated state
        fetchNotifications();
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, [notifications, onChange, fetchNotifications]);

  const handleNotificationAction = useCallback((notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Handle navigation based on notification type
    const notificationType = notification.notification_type;
    const extraData = notification.extra_data || {};

    // Close notification panel
    if (onClose) {
      onClose();
    }

    // Determine base path based on current location
    const currentPath = window.location.pathname;
    let basePath = '/dashboard';

    if (currentPath.includes('/taxdashboard')) {
      basePath = '/taxdashboard';
    } else if (currentPath.includes('/firmadmin')) {
      basePath = '/firmadmin';
    } else if (currentPath.includes('/superadmin')) {
      basePath = '/superadmin';
    }

    // Handle different notification types
    if (notificationType === "message_received" || notificationType === "client_message" || notificationType === "staff_message") {
      const threadId = extraData.thread_id || extraData.threadId;
      const clientId = extraData.client_id || extraData.clientId;

      // Navigate to messages page with threadId or clientId
      if (threadId) {
        navigate(`${basePath}/messages?threadId=${threadId}`);
      } else if (clientId) {
        navigate(`${basePath}/messages?clientId=${clientId}`);
      } else {
        navigate(`${basePath}/messages`);
      }
    } else if (notificationType === "new_client" || notificationType === "client_assigned") {
      const clientId = extraData.client_id || extraData.clientId;
      if (clientId && basePath === '/firmadmin') {
        navigate(`${basePath}/clients/${clientId}`);
      } else if (clientId && basePath === '/taxdashboard') {
        navigate(`${basePath}/clients/${clientId}`);
      }
    } else if (notificationType === "payment_received") {
      const paymentId = extraData.payment_id;
      const invoiceId = extraData.invoice_id;
      if (invoiceId && basePath === '/firmadmin') {
        navigate(`${basePath}/invoices/${invoiceId}`);
      }
    } else if (notificationType === "task_assigned") {
      const taskId = extraData.task_id || extraData.taskId;
      if (taskId && basePath === '/firmadmin') {
        navigate(`${basePath}/tasks/${taskId}`);
      } else if (taskId && basePath === '/taxdashboard') {
        navigate(`${basePath}/tasks`);
      }
    }
    // Add other notification type handlers here if needed
  }, [markAsRead, navigate, onClose]);

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
                onClick={() => {
                  setSelectedTab(tab.key);
                  setShowAllNotifications(false); // Reset when changing tabs
                }}
                className={`btn btn-sm ${
                  selectedTab === tab.key ? "active-tab" : "inactive-tab"
                }`}
              >
                {tab.label}
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

      {loading && (
        <div className="text-center text-muted py-4">Loading notifications...</div>
      )}

      {error && (
        <div className="text-center text-danger py-4">
          Error: {error}
          <button
            className="btn btn-sm btn-link"
            onClick={fetchNotifications}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && Object.keys(groupedNotifications).length === 0 && (
        <div className="text-center text-muted py-4">No notifications in this view.</div>
      )}

      {!loading && !error && Object.keys(groupedNotifications).map((group) => (
        <div key={group} className="mb-3">
          <h6 className="text-muted px-2">{group}</h6>
          {groupedNotifications[group].map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-2 border d-flex justify-content-between align-items-start p-3 mx-2 mb-3 notification-item ${notification.read ? "notification-read" : "notification-unread"
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
                      style={{ backgroundColor: PRIORITY_COLOR[notification.priority] || PRIORITY_COLOR.medium }}
                    >
                      {notification.priorityDisplay || notification.priority}
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
      
      {/* View All Button */}
      {!loading && !error && hasMoreNotifications && !showAllNotifications && (
        <div className="text-center mt-3 mb-2">
          <button
            className="btn btn-sm"
            style={{
              backgroundColor: "#F56D2D",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              padding: "8px 24px",
              fontFamily: "BasisGrotesquePro",
              fontWeight: "500",
              cursor: "pointer"
            }}
            onClick={() => setShowAllNotifications(true)}
          >
            View All ({filteredNotifications.length} notifications)
          </button>
        </div>
      )}
      
    </div>
  );
}
