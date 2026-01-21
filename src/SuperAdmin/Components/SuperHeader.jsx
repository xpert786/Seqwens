import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaBell, FaSun, FaMoon } from "react-icons/fa";
import logo from "../../assets/logo.png";
import { LogoIcond } from "../../Taxpreparer/component/icons"
import { UserIconBuild } from "./icons";
import SuperAdminNotificationPanel from "./SuperAdminNotificationPanel";
import { superAdminNotificationAPI } from "../../ClientOnboarding/utils/apiUtils";
import { useTheme } from "../Context/ThemeContext";
import "../style/SuperHeader.css";

export default function SuperHeader({ onToggleSidebar = () => { }, isSidebarOpen = true }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const notificationButtonRef = useRef(null);
  const searchRef = useRef(null);

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
    // Fetch unread count on mount and periodically
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
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

  return (
    <>
      <nav className="navbar bg-white fixed-top border-bottom custom-topbar px-3">
        <div className="container-fluid d-flex justify-content-between align-items-center">

          {/* Left Section */}
          <div className="d-flex align-items-center gap-3 flex-grow-1">
            {/* Logo */}
            <Link to="/superadmin" className="navbar-brand d-flex align-items-center m-0">
              <img src={logo} alt="Logo" className="super-topbar-logo h-10 mr-[7px]" />
            </Link>

            {/* Sidebar Toggle */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex items-center justify-center p-2 rounded-md transition-transform duration-200 focus:outline-none"
              style={{ background: "transparent", border: "none" }}
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

            {/* Search Box - Desktop */}
            <div
              className="super-topbar-search d-none d-md-flex align-items-center position-relative flex-grow-1"
              style={{ maxWidth: "300px", minWidth: "180px" }}
            >
              <i className="bi bi-search position-absolute ms-2 text-muted"></i>
              <input
                type="text"
                className="form-control ps-4"
                placeholder="Search..."
                style={{
                  fontSize: "0.9rem",
                  borderRadius: "8px",
                }}
              />
            </div>

            {/* Search Icon - Mobile (Toggle) */}
            <div
              className="d-md-none d-sm-none d-flex align-items-center justify-content-center"
              onClick={() => setShowSearch(!showSearch)}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                backgroundColor: "#f3f4f6",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <i className="bi bi-search text-muted" style={{ fontSize: "16px" }}></i>
            </div>
          </div>

          {/* Right Section */}
          <div className="d-flex align-items-center gap-3" style={{ minWidth: "fit-content" }}>
            {/* Theme Toggle Switch */}
            <div
              className="d-flex align-items-center"
              style={{ marginRight: '4px' }}
            >
              <div
                className="theme-toggle-container"
                onClick={toggleTheme}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
                  borderRadius: '20px',
                  padding: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  width: '60px',
                  height: '30px',
                  position: 'relative',
                }}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: isDarkMode ? '32px' : '4px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  {isDarkMode ? (
                    <FaMoon size={12} color="#fbbf24" />
                  ) : (
                    <FaSun size={12} color="#f59e0b" />
                  )}
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
                      fontFamily: "BasisGrotesquePro",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              {showNotifications && (
                <SuperAdminNotificationPanel onClose={closeNotifications} />
              )}
            </div>
            <UserIconBuild />
          </div>
        </div>
      </nav>

      {/* Mobile Search Bar - Expandable */}
      {showSearch && (
        <div ref={searchRef} className="d-md-none w-100 px-3 pb-2">
          <div className="super-topbar-search d-flex align-items-center position-relative w-100">
            <i className="bi bi-search position-absolute ms-2 text-muted"></i>
            <input
              type="text"
              className="form-control ps-4 w-100"
              placeholder="Search..."
              style={{
                fontSize: "0.9rem",
                borderRadius: "8px",
                height: "40px",
              }}
              autoFocus
            />
            <button
              onClick={() => setShowSearch(false)}
              className="btn btn-link text-muted p-0 ms-2"
              style={{ border: "none", background: "none" }}
              aria-label="Close search"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
