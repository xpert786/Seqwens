import React, { useState, useEffect, useCallback } from "react";
import { superAdminNotificationAPI, handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
import ConfirmationModal from "../../../components/ConfirmationModal";

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
      return <i className="bi bi-calendar-x" style={{ fontSize: "20px" }}></i>;
    case "payment_received":
      return <i className="bi bi-credit-card" style={{ fontSize: "20px" }}></i>;
    case "new_client":
      return <i className="bi bi-person-plus" style={{ fontSize: "20px" }}></i>;
    default:
      return <i className="bi bi-bell" style={{ fontSize: "20px" }}></i>;
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

const Notifications = () => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit,
        offset: (page - 1) * limit,
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
  }, [selectedTab, page, limit]);

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
    // Fetch unread count on mount and periodically
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Handle tab change
  const handleTabChange = (tabKey) => {
    setSelectedTab(tabKey);
    setPage(1); // Reset to first page when changing tabs
  };

  // View notification details
  const handleViewDetails = async (notificationId) => {
    try {
      setLoadingDetails(true);
      const response = await superAdminNotificationAPI.getNotificationDetails(notificationId);
      if (response.success && response.data) {
        setSelectedNotification(response.data);
        setShowDetailsModal(true);
        // Mark as read when viewing details
        if (!response.data.is_read) {
          await handleMarkAsRead(notificationId);
        }
      } else {
        toast.error("Failed to load notification details");
      }
    } catch (err) {
      console.error("Error fetching notification details:", err);
      toast.error(handleAPIError(err));
    } finally {
      setLoadingDetails(false);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await superAdminNotificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (selectedNotification && selectedNotification.id === notificationId) {
        setSelectedNotification(prev => prev ? { ...prev, is_read: true } : null);
      }
      toast.success("Notification marked as read");
    } catch (err) {
      console.error("Error marking notification as read:", err);
      toast.error(handleAPIError(err));
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
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

  const [showDeleteNotificationConfirm, setShowDeleteNotificationConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  // Delete notification
  const handleDelete = async (notificationId) => {
    setNotificationToDelete(notificationId);
    setShowDeleteNotificationConfirm(true);
  };

  const confirmDeleteNotification = async () => {
    if (!notificationToDelete) return;

    try {
      await superAdminNotificationAPI.deleteNotification(notificationToDelete);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationToDelete));
      toast.success("Notification deleted");
      setShowDeleteNotificationConfirm(false);
      setNotificationToDelete(null);
    } catch (err) {
      console.error("Error deleting notification:", err);
      toast.error(handleAPIError(err));
    }
  };

  // Get filtered notifications
  const filteredNotifications = notifications;

  // Group notifications by date
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);

  return (
    <>
    <div className="card">
      <div className="card-body" style={{
        padding: "28px",
        backgroundColor: "white",
        borderRadius: "12px",
      }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5
              className="mb-1"
              style={{
                color: "#3B4A66",
                fontSize: "24px",
                fontWeight: "500",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              Notifications
            </h5>
            <p
              className="mb-0"
              style={{
                color: "#4B5563",
                fontSize: "14px",
                fontWeight: "400",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              className="btn btn-sm"
              onClick={handleMarkAllAsRead}
              style={{
                backgroundColor: "#F56D2D",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "14px",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="d-flex gap-2 mb-4" style={{ borderBottom: "2px solid #E5E7EB" }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className="btn"
              style={{
                backgroundColor: "transparent",
                border: "none",
                borderBottom: selectedTab === tab.key ? "2px solid #F56D2D" : "2px solid transparent",
                color: selectedTab === tab.key ? "#F56D2D" : "#4B5563",
                fontWeight: selectedTab === tab.key ? "500" : "400",
                fontSize: "14px",
                fontFamily: "BasisGrotesquePro",
                padding: "8px 16px",
                marginBottom: "-2px",
                borderRadius: "0",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {!loading && !error && (
          <>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-5">
                <p style={{ color: "#4B5563", fontSize: "16px" }}>No notifications found</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {Object.entries(groupedNotifications).map(([dateGroup, dateNotifications]) => (
                  <div key={dateGroup}>
                    <h6
                      style={{
                        color: "#6B7280",
                        fontSize: "12px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        marginBottom: "12px",
                        fontFamily: "BasisGrotesquePro",
                      }}
                    >
                      {dateGroup}
                    </h6>
                    {dateNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="d-flex align-items-start gap-3 p-3 rounded-3 mb-2"
                        style={{
                          backgroundColor: notification.is_read ? "#FFFFFF" : "#FFF4E6",
                          border: notification.is_read ? "1px solid #E5E7EB" : "1px solid #F56D2D",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onClick={() => handleViewDetails(notification.id)}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: PRIORITY_COLOR[notification.priority] || PRIORITY_COLOR.medium,
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
                            <div>
                              <h6
                                className="mb-1"
                                style={{
                                  color: "#3B4A66",
                                  fontSize: "16px",
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
                                  fontSize: "14px",
                                  fontFamily: "BasisGrotesquePro",
                                }}
                              >
                                {notification.message}
                              </p>
                            </div>
                            <div className="d-flex gap-2">
                              {notification.priority && (
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: PRIORITY_COLOR[notification.priority] || PRIORITY_COLOR.medium,
                                    color: "#fff",
                                    fontSize: "10px",
                                    padding: "4px 8px",
                                  }}
                                >
                                  {notification.priority_display || notification.priority}
                                </span>
                              )}
                              <button
                                className="btn btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(notification.id);
                                }}
                                style={{
                                  backgroundColor: "transparent",
                                  border: "none",
                                  color: "#EF4444",
                                  padding: "4px 8px",
                                }}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <span
                              style={{
                                color: "#6B7280",
                                fontSize: "12px",
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
                                  fontSize: "10px",
                                  padding: "4px 8px",
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
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
                <button
                  className="btn btn-sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  style={{
                    backgroundColor: page === 1 ? "#E5E7EB" : "#F56D2D",
                    color: page === 1 ? "#9CA3AF" : "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "14px",
                  }}
                >
                  Previous
                </button>
                <span style={{ fontSize: "14px", color: "#4B5563", minWidth: "100px", textAlign: "center" }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  style={{
                    backgroundColor: page === totalPages ? "#E5E7EB" : "#F56D2D",
                    color: page === totalPages ? "#9CA3AF" : "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "14px",
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notification Details Modal */}
      {showDetailsModal && selectedNotification && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white rounded-4 p-4"
            style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 600, color: '#3B4A66' }}>
                Notification Details
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowDetailsModal(false)}
                aria-label="Close"
              />
            </div>

            {loadingDetails ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div>
                {/* Notification Icon and Priority */}
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      backgroundColor: PRIORITY_COLOR[selectedNotification.priority] || PRIORITY_COLOR.medium,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {getNotificationIcon(selectedNotification.notification_type)}
                  </div>
                  <div>
                    <h6 className="mb-1" style={{ fontFamily: 'BasisGrotesquePro', fontWeight: 600, color: '#3B4A66' }}>
                      {selectedNotification.title || "Notification"}
                    </h6>
                    {selectedNotification.priority && (
                      <span
                        className="badge"
                        style={{
                          backgroundColor: PRIORITY_COLOR[selectedNotification.priority] || PRIORITY_COLOR.medium,
                          color: "#fff",
                          fontSize: "12px",
                          padding: "4px 12px",
                        }}
                      >
                        {selectedNotification.priority_display || selectedNotification.priority}
                      </span>
                    )}
                  </div>
                </div>

                {/* Notification Type */}
                {selectedNotification.notification_type_display && (
                  <div className="mb-3">
                    <label style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                      TYPE
                    </label>
                    <p className="mb-0" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px', color: '#3B4A66' }}>
                      {selectedNotification.notification_type_display}
                    </p>
                  </div>
                )}

                {/* Message */}
                <div className="mb-3">
                  <label style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                    MESSAGE
                  </label>
                  <p className="mb-0" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px', color: '#3B4A66', lineHeight: '1.6' }}>
                    {selectedNotification.message}
                  </p>
                </div>

                {/* Extra Data */}
                {selectedNotification.extra_data && Object.keys(selectedNotification.extra_data).length > 0 && (
                  <div className="mb-3">
                    <label style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                      DETAILS
                    </label>
                    <div className="bg-light rounded p-3" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px' }}>
                      {Object.entries(selectedNotification.extra_data).map(([key, value]) => (
                        <div key={key} className="d-flex justify-content-between mb-2">
                          <span style={{ color: '#6B7280', textTransform: 'capitalize' }}>
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span style={{ color: '#3B4A66', fontWeight: 500 }}>
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Object */}
                {selectedNotification.related_object_type && (
                  <div className="mb-3">
                    <label style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                      RELATED OBJECT
                    </label>
                    <p className="mb-0" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px', color: '#3B4A66' }}>
                      {selectedNotification.related_object_type}
                      {selectedNotification.related_object_id && ` (ID: ${selectedNotification.related_object_id})`}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="mb-3">
                  <label style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                    TIMESTAMP
                  </label>
                  <div className="d-flex flex-column gap-1">
                    <p className="mb-0" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px', color: '#3B4A66' }}>
                      Created: {selectedNotification.created_at ? new Date(selectedNotification.created_at).toLocaleString() : 'N/A'}
                    </p>
                    {selectedNotification.read_at && (
                      <p className="mb-0" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '14px', color: '#3B4A66' }}>
                        Read: {new Date(selectedNotification.read_at).toLocaleString()}
                      </p>
                    )}
                    {selectedNotification.time_ago && (
                      <p className="mb-0" style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px', color: '#6B7280' }}>
                        {selectedNotification.time_ago}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="mb-4">
                  <label style={{ fontFamily: 'BasisGrotesquePro', fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                    STATUS
                  </label>
                  <div>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: selectedNotification.is_read ? '#22C55E' : '#F56D2D',
                        color: "#fff",
                        fontSize: "12px",
                        padding: "6px 12px",
                      }}
                    >
                      {selectedNotification.is_read ? 'Read' : 'Unread'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex gap-2 justify-content-end">
                  {!selectedNotification.is_read && (
                    <button
                      className="btn btn-sm"
                      onClick={() => {
                        handleMarkAsRead(selectedNotification.id);
                      }}
                      style={{
                        backgroundColor: "#F56D2D",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        fontSize: "14px",
                        fontFamily: "BasisGrotesquePro",
                      }}
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      handleDelete(selectedNotification.id);
                      setShowDetailsModal(false);
                    }}
                    style={{
                      backgroundColor: "#EF4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 16px",
                      fontSize: "14px",
                      fontFamily: "BasisGrotesquePro",
                    }}
                  >
                    Delete
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => setShowDetailsModal(false)}
                    style={{
                      backgroundColor: "#FFFFFF",
                      color: "#3B4A66",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                      padding: "8px 16px",
                      fontSize: "14px",
                      fontFamily: "BasisGrotesquePro",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Delete Notification Confirmation Modal */}
    <ConfirmationModal
      isOpen={showDeleteNotificationConfirm}
      onClose={() => {
        setShowDeleteNotificationConfirm(false);
        setNotificationToDelete(null);
      }}
      onConfirm={confirmDeleteNotification}
      title="Delete Notification"
      message="Are you sure you want to delete this notification?"
      confirmText="Delete"
      cancelText="Cancel"
      isDestructive={true}
    />
    </>
  );
};

export default Notifications;
