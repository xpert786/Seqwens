import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { superAdminNotificationAPI, handleAPIError } from "../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
import { FaBell, FaTimes } from "react-icons/fa";

const TABS = [
  { label: "All", key: "all" },
  { label: "Unread", key: "unread" },
  { label: "Read", key: "read" },
];

const READ_TAB_LIMIT = 5;

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

const SuperAdminNotificationPanel = ({ onClose, onChange }) => {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [selectedTab, setSelectedTab] = useState("unread");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const lastActionTimeRef = useRef(0);

  // Limit for recent notifications
  const RECENT_NOTIFICATIONS_LIMIT = 3;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      // Don't fetch if we just had a manual update (prevents reverting to old data)
      if (Date.now() - lastActionTimeRef.current < 5000) {
        return;
      }

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
        const newUnreadCount = response.data.unread_count || 0;
        setNotifications(response.data.notifications || []);
        setUnreadCount(newUnreadCount);
        setTotal(response.data.total || 0);

        if (typeof onChange === "function") {
          onChange({ unreadCount: newUnreadCount });
        }
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
    // Don't fetch if we just had a manual update
    if (Date.now() - lastActionTimeRef.current < 5000) {
      return;
    }

    try {
      const response = await superAdminNotificationAPI.getUnreadCount();
      if (response.success && response.data) {
        const newUnreadCount = response.data.unread_count || 0;
        setUnreadCount(newUnreadCount);
        if (typeof onChange === "function") {
          onChange({ unreadCount: newUnreadCount });
        }
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, []);

  const sortByRecent = useCallback(
    (items = []) =>
      [...items].sort(
        (a, b) =>
          new Date(b.created_at || b.time_ago || 0) - new Date(a.created_at || a.time_ago || 0)
      ),
    []
  );

  const filteredNotifications = useMemo(() => {
    let filtered = [];
    if (selectedTab === "unread") {
      filtered = sortByRecent(notifications.filter((notification) => !notification.is_read));
    } else if (selectedTab === "read") {
      filtered = sortByRecent(notifications.filter((notification) => notification.is_read));
    } else {
      // All tab shows recent message notifications
      const messageNotifications = notifications.filter((notification) =>
        (notification.notification_type || "").toLowerCase().includes("message")
      );
      filtered = sortByRecent(messageNotifications);
    }

    // If not showing all, limit to 5 notifications
    if (!showAllNotifications) {
      return filtered.slice(0, RECENT_NOTIFICATIONS_LIMIT);
    }

    return filtered;
  }, [notifications, selectedTab, sortByRecent, showAllNotifications]);

  // Check if there are more notifications to show
  const hasMoreNotifications = useMemo(() => {
    let allFiltered = [];
    if (selectedTab === "unread") {
      allFiltered = notifications.filter((notification) => !notification.is_read);
    } else if (selectedTab === "read") {
      allFiltered = notifications.filter((notification) => notification.is_read);
    } else {
      allFiltered = notifications.filter((notification) =>
        (notification.notification_type || "").toLowerCase().includes("message")
      );
    }

    return allFiltered.length > RECENT_NOTIFICATIONS_LIMIT;
  }, [notifications, selectedTab]);

  useEffect(() => {
    fetchNotifications();
    setShowAllNotifications(false); // Reset to show recent when tab changes
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
      lastActionTimeRef.current = Date.now();

      await superAdminNotificationAPI.markAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );

      setUnreadCount((prev) => {
        const nextCount = Math.max(0, prev - 1);
        if (typeof onChange === "function") {
          onChange({ unreadCount: nextCount });
        }
        return nextCount;
      });

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
      lastActionTimeRef.current = Date.now();

      const response = await superAdminNotificationAPI.markAllAsRead();
      if (response.success) {
        toast.success(response.message || "All notifications marked as read");

        setNotifications((prev) => prev.map(notif => ({ ...notif, is_read: true })));
        setUnreadCount(0);

        if (typeof onChange === "function") {
          onChange({ unreadCount: 0 });
        }
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
      lastActionTimeRef.current = Date.now();

      const notificationToDelete = notifications.find(n => n.id === notificationId);
      const wasUnread = notificationToDelete && !notificationToDelete.is_read;

      await superAdminNotificationAPI.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));

      if (wasUnread) {
        setUnreadCount((prev) => {
          const nextCount = Math.max(0, prev - 1);
          if (typeof onChange === "function") {
            onChange({ unreadCount: nextCount });
          }
          return nextCount;
        });
      }

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
        const notification = response.data;

        // Mark as read when viewing details
        if (!notification.is_read) {
          await handleMarkAsRead(notificationId);
        }

        // Handle navigation based on notification type
        const type = (notification.notification_type || "").toLowerCase();

        if (type === "new_client") {
          navigate("/superadmin/firms");
          onClose();
        } else if (type === "subscription_expiring" || type === "payment_received") {
          navigate("/superadmin/subscriptions");
          onClose();
        } else {
          // Default: Navigate to full notifications page and pass ID to open modal
          navigate("/superadmin/notifications", {
            state: { notificationId: notificationId }
          });
          onClose();
        }
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
        paddingBottom: "16px",
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
              className="btn "
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
              Mark all as read
            </button>
          )}
          <button
            className="btn "
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
      {/* Tabs removed - defaulting to unread view */}

      {/* Content */}
      <div
        style={{
          overflowY: "auto",
          flex: 1,
          maxHeight: "calc(100vh - 220px)",
          paddingBottom: "16px",
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
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-5">
            <p style={{ color: "#4B5563", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
              No notifications found
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredNotifications.map((notification) => (
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
                      className="btn "
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

      {/* View All Button */}
      {/* View All Button - Toggles to show all notifications in the panel */}
      {!loading && !error && !showAllNotifications && (
        <div
          className="text-center p-2"
          style={{
            borderTop: "1px solid #E5E7EB",
          }}
        >
          <button
            className="btn "
            onClick={() => {
              setSelectedTab("all");
              setShowAllNotifications(true);
            }}
            style={{
              backgroundColor: "#F56D2D",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              padding: "8px 24px",
              fontSize: "12px",
              fontFamily: "BasisGrotesquePro",
              fontWeight: "500",
            }}
          >
            {selectedTab === "unread" ? "View All Notifications" : "Show All"}
          </button>
        </div>
      )}

      {/* Show Less Button */}
      {!loading && !error && showAllNotifications && (
        <div
          className="text-center p-2"
          style={{
            borderTop: "1px solid #E5E7EB",
          }}
        >
          <button
            className="btn "
            onClick={() => {
              setSelectedTab("unread");
              setShowAllNotifications(false);
            }}
            style={{
              backgroundColor: "#F56D2D",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              padding: "8px 24px",
              fontSize: "12px",
              fontFamily: "BasisGrotesquePro",
              fontWeight: "500",
            }}
          >
            Show Less (Unread Only)
          </button>
        </div>
      )}

      {/* Footer - View All Notifications Page */}
      {filteredNotifications.length > 0 && (
        <div
          className="text-center p-2"
          style={{
            borderTop: "1px solid #E5E7EB",
          }}
        >
          <button
            className="btn "
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
            View All Notifications Page
          </button>
        </div>
      )}
    </div>
  );
};

export default SuperAdminNotificationPanel;

