import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaBell, FaSun, FaMoon } from "react-icons/fa";
import logo from "../../assets/logo.png";
import { LogoIcond } from "../../Taxpreparer/component/icons"
import { UserIconBuild } from "./icons";
import SuperAdminNotificationPanel from "./SuperAdminNotificationPanel";
import { superAdminNotificationAPI } from "../../ClientOnboarding/utils/apiUtils";
import { useTheme } from "../Context/ThemeContext";
import { useNotificationWebSocket } from "../../ClientOnboarding/utils/useNotificationWebSocket";
import "../style/SuperHeader.css";

export default function SuperHeader({ onToggleSidebar = () => { }, isSidebarOpen = true }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const notificationButtonRef = useRef(null);
  const searchRef = useRef(null);
  const lastActionTimeRef = useRef(0);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    // Don't poll if we just had a manual update (prevents reverting to old count)
    if (Date.now() - lastActionTimeRef.current < 5000) {
      return;
    }

    try {
      const response = await superAdminNotificationAPI.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, []);

  // WebSocket connection for real-time notifications
  const handleUnreadCountUpdate = useCallback((count) => {
    setUnreadCount(count);
  }, []);

  useNotificationWebSocket(true, null, handleUnreadCountUpdate);

  useEffect(() => {
    // Fetch unread count on mount and periodically as fallback
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Every 60 seconds (less frequent with WS)
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  const closeNotifications = () => {
    setShowNotifications(false);
    if (notificationButtonRef.current) {
      notificationButtonRef.current.focus();
    }
    // Refresh unread count when closing
    fetchUnreadCount();
  };

  const handleNotificationChange = (data) => {
    if (data && typeof data.unreadCount !== 'undefined') {
      setUnreadCount(data.unreadCount);
      lastActionTimeRef.current = Date.now();
    }
  };

  return (
    <>
      <nav
        className="navbar fixed-top custom-topbar p-0"
        style={{
          backgroundColor: 'var(--sa-bg-primary)',
          borderBottom: '1px solid var(--sa-border-color)',
          color: 'var(--sa-text-primary)'
        }}
      >
        <div className="container-fluid d-flex justify-content-between align-items-center h-[70px] p-0">

          {/* Left Section */}
          <div className="d-flex align-items-center h-full">
            {/* Logo area matching sidebar width */}
            <div
              className="d-flex align-items-center justify-content-between ps-4 pe-0 border-end"
              style={{
                width: 'var(--sa-sidebar-width, 265px)',
                height: '100%',
                transition: 'width 0.3s ease'
              }}
            >
              <Link to="/superadmin" className="navbar-brand d-flex align-items-center m-0">
                <img src={logo} alt="Logo" className="super-topbar-logo" style={{ maxHeight: '35px', width: 'auto' }} />
              </Link>

              {/* Sidebar Toggle */}
              <button
                type="button"
                onClick={onToggleSidebar}
                className="d-flex align-items-center justify-content-center px-3 h-full cursor-pointer hover:bg-black/5 transition-colors focus:outline-none"
                style={{ background: "transparent", border: "none", width: '50px' }}
                aria-label={isSidebarOpen ? "Collapse navigation" : "Expand navigation"}
              >
                <span
                  style={{
                    display: "inline-flex",
                    transition: "transform 0.3s ease",
                    transform: isSidebarOpen ? "rotate(0deg)" : "rotate(180deg)"
                  }}
                >
                  <LogoIcond />
                </span>
              </button>
            </div>
          </div>

          {/* Right Section */}
          <div className="d-flex align-items-center gap-3 pe-4" style={{ minWidth: "fit-content" }}>
            {/* Theme Toggle Switch */}
            <div
              className="d-flex align-items-center"
              style={{ marginRight: '4px' }}
            >
              <div
                className="theme-toggle-container"
                onClick={toggleTheme}
                // ... (keyboard and effect handlers stay the same for UX)
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleTheme();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
                  background: isDarkMode
                    ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
                    : 'linear-gradient(135deg, #e5e7eb 0%, #f3f4f6 100%)',
                  borderRadius: '24px',
                  padding: '3px',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  width: '64px',
                  height: '32px',
                  position: 'relative',
                  boxShadow: isDarkMode
                    ? '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
                  border: '1px solid transparent',
                }}
                tabIndex={0}
                role="button"
                aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: isDarkMode ? '36px' : '4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isDarkMode
                      ? '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.1)'
                      : '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.8)',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    {isDarkMode ? (
                      <FaMoon size={11} color="#fbbf24" />
                    ) : (
                      <FaSun size={11} color="#f59e0b" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div
                ref={notificationButtonRef}
                className="w-[35px] h-[35px] rounded-md bg-[#F56D2D] flex items-center justify-center cursor-pointer hover:bg-[#E55A1D] transition-colors relative"
                onClick={toggleNotifications}
                title="Notifications"
              >
                <FaBell size={14} color="white" />
                {unreadCount > 0 && (
                  <span
                    className="position-absolute"
                    style={{
                      top: "-4px",
                      right: "-4px",
                      backgroundColor: "#EF4444",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      fontSize: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "600",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              {showNotifications && (
                <SuperAdminNotificationPanel
                  onClose={closeNotifications}
                  onChange={handleNotificationChange}
                />
              )}
            </div>
            <UserIconBuild />
          </div>
        </div>
      </nav>
    </>
  );

}
