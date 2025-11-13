import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { superAdminNotificationAPI, handleAPIError } from "../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
import { FaBell, FaTimes } from "react-icons/fa";

const TABS = [
  { label: "All", key: "all" },
  { label: "Unread", key: "unread" },
  { label: "Read", key: "read" },
];

const PRIORITY_COLOR = {
  urgent: "#DC2626",
  high: "#EF4444",
  medium: "#FBBF24",
  low: "#22C55E",
};

// Map notification types to icons
const getNotificationIcon = (notificationType) => {
  switch (notificationType) {
    case "subscription_expiring":
      return <i className="bi bi-calendar-x" style={{ fontSize: "16px" }}></i>;
    case "payment_received":
      return <i className="bi bi-credit-card" style={{ fontSize: "16px" }}></i>;
    case "new_client":
      return <i className="bi bi-person-plus" style={{ fontSize: "16px" }}></i>;
    default:
      return <i className="bi bi-bell" style={{ fontSize: "16px" }}></i>;
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

const SuperAdminNotificationPanel = ({ onClose }) => {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [selectedTab, setSelectedTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: 20,
        offset: 0,
      };

      if (selectedTab === "unread") {
        params.is_read = false;
      } else if (selectedTab === "read") {
        params.is_read = true;
      }

      const response = await superAdminNotificationAPI.listNotifications(params);

      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unread_count || 0);
        setTotal(response.data.total || 0);
      } else {
        setError("Failed to load notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  }, [selectedTab]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await superAdminNotificationAPI.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    // Fetch unread count on mount
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId, e) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      await superAdminNotificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success("Notification marked as read");
    } catch (err) {
      console.error("Error marking notification as read:", err);
      toast.error(handleAPIError(err));
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async (e) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      const response = await superAdminNotificationAPI.markAllAsRead();
      if (response.success) {
        toast.success(response.message || "All notifications marked as read");
        fetchNotifications();
        fetchUnreadCount();
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
      toast.error(handleAPIError(err));
    }
  };

  // Delete notification
  const handleDelete = async (notificationId, e) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      await superAdminNotificationAPI.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
      toast.success("Notification deleted");
    } catch (err) {
      console.error("Error deleting notification:", err);
      toast.error(handleAPIError(err));
    }
  };

  // View notification details
  const handleViewDetails = async (notificationId) => {
    try {
      const response = await superAdminNotificationAPI.getNotificationDetails(notificationId);
      if (response.success && response.data) {
        // Mark as read when viewing details
        if (!response.data.is_read) {
          await handleMarkAsRead(notificationId);
        }
        // Navigate to full notifications page
        navigate("/superadmin/notifications");
        onClose();
      } else {
        toast.error("Failed to load notification details");
      }
    } catch (err) {
      console.error("Error fetching notification details:", err);
      toast.error(handleAPIError(err));
    }
  };

  return (
    <div
      ref={panelRef}
      className="position-fixed"
      style={{
        top: "70px",
        right: "20px",
        width: "400px",
        maxHeight: "calc(100vh - 80px)",
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        zIndex: 1050,
        display: "flex",
        flexDirection: "column",
        border: "1px solid #E5E7EB",
      }}
    >
      {/* Header */}
      <div
        className="d-flex justify-content-between align-items-center p-3"
        style={{
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div>
          <h6
            className="mb-0"
            style={{
              color: "#3B4A66",
              fontSize: "18px",
              fontWeight: "600",
              fontFamily: "BasisGrotesquePro",
            }}
          >
            Notifications
          </h6>
          {unreadCount > 0 && (
            <p
              className="mb-0 mt-1"
              style={{
                color: "#6B7280",
                fontSize: "12px",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              {unreadCount} unread
            </p>
          )}
        </div>
        <div className="d-flex gap-2 align-items-center">
          {unreadCount > 0 && (
            <button
              className="btn btn-sm"
              onClick={handleMarkAllAsRead}
              style={{
                backgroundColor: "#F56D2D",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "4px 12px",
                fontSize: "12px",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              Mark All Read
            </button>
          )}
          <button
            className="btn btn-sm"
            onClick={onClose}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "#6B7280",
              padding: "4px",
            }}
          >
            <FaTimes size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="d-flex gap-2 px-3 pt-2"
        style={{ borderBottom: "1px solid #E5E7EB" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key)}
            className="btn btn-sm"
            style={{
              backgroundColor: "transparent",
              border: "none",
              borderBottom:
                selectedTab === tab.key ? "2px solid #F56D2D" : "2px solid transparent",
              color: selectedTab === tab.key ? "#F56D2D" : "#4B5563",
              fontWeight: selectedTab === tab.key ? "500" : "400",
              fontSize: "12px",
              fontFamily: "BasisGrotesquePro",
              padding: "8px 12px",
              marginBottom: "-1px",
              borderRadius: "0",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          overflowY: "auto",
          flex: 1,
          maxHeight: "calc(100vh - 200px)",
        }}
      >
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger m-3" role="alert">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-5">
            <p style={{ color: "#4B5563", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
              No notifications found
            </p>
          </div>
        ) : (
          <div className="p-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="d-flex align-items-start gap-2 p-2 rounded mb-2"
                style={{
                  backgroundColor: notification.is_read ? "#FFFFFF" : "#FFF4E6",
                  border: notification.is_read
                    ? "1px solid #E5E7EB"
                    : "1px solid #F56D2D",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() => handleViewDetails(notification.id)}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor:
                      PRIORITY_COLOR[notification.priority] || PRIORITY_COLOR.medium,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {getNotificationIcon(notification.notification_type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div style={{ flex: 1 }}>
                      <h6
                        className="mb-1"
                        style={{
                          color: "#3B4A66",
                          fontSize: "14px",
                          fontWeight: "500",
                          fontFamily: "BasisGrotesquePro",
                        }}
                      >
                        {notification.title || "Notification"}
                      </h6>
                      <p
                        className="mb-0"
                        style={{
                          color: "#4B5563",
                          fontSize: "12px",
                          fontFamily: "BasisGrotesquePro",
                          lineHeight: "1.4",
                        }}
                      >
                        {notification.message}
                      </p>
                    </div>
                    <button
                      className="btn btn-sm"
                      onClick={(e) => handleDelete(notification.id, e)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        color: "#EF4444",
                        padding: "2px 4px",
                      }}
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <span
                      style={{
                        color: "#6B7280",
                        fontSize: "11px",
                        fontFamily: "BasisGrotesquePro",
                      }}
                    >
                      {notification.time_ago || formatTimeAgo(notification.created_at)}
                    </span>
                    {!notification.is_read && (
                      <span
                        className="badge"
                        style={{
                          backgroundColor: "#F56D2D",
                          color: "#fff",
                          fontSize: "9px",
                          padding: "2px 6px",
                        }}
                      >
                        New
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div
          className="text-center p-2"
          style={{
            borderTop: "1px solid #E5E7EB",
          }}
        >
          <button
            className="btn btn-sm"
            onClick={() => {
              navigate("/superadmin/notifications");
              onClose();
            }}
            style={{
              backgroundColor: "transparent",
              color: "#F56D2D",
              border: "1px solid #F56D2D",
              borderRadius: "6px",
              padding: "6px 16px",
              fontSize: "12px",
              fontFamily: "BasisGrotesquePro",
            }}
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default SuperAdminNotificationPanel;

