import React, { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import logo from "../../assets/logo.png";
import image from "../../assets/image.png";
import { LogoIcon } from "../../ClientOnboarding/components/icons";
import NotificationPanel from "../../ClientOnboarding/components/Notifications/NotificationPanel";
import { firmAdminNotificationAPI } from "../../ClientOnboarding/utils/apiUtils";
import "../styles/FirmHeader.css";

export default function FirmHeader({ onToggleSidebar, isSidebarOpen }) {
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const notificationButtonRef = useRef(null);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await firmAdminNotificationAPI.getUnreadCount();
            if (response.success && response.data) {
                setUnreadNotifications(response.data.unread_count || 0);
            }
        } catch (err) {
            console.error("Error fetching unread count:", err);
        }
    }, []);

    // Fetch unread count on mount and periodically
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    const toggleNotifications = () => {
        setShowNotifications((prev) => {
            const next = !prev;
            if (next) {
                fetchUnreadCount(); // Refresh when opening
            }
            return next;
        });
    };

    const closeNotifications = () => {
        setShowNotifications(false);
        if (notificationButtonRef.current) {
            notificationButtonRef.current.focus();
        }
    };

    const handleNotificationChange = useCallback((data) => {
        if (data && data.unreadCount !== undefined) {
            setUnreadNotifications(data.unreadCount);
        }
    }, []);

    return (
        <>
            <nav className="navbar bg-white fixed-top border-bottom firm-custom-topbar px-3 py-2">
                <div className="container-fluid d-flex justify-content-between align-items-center flex-wrap">

                    {/* Left Section */}
                    <div className="d-flex align-items-center gap-3 flex-grow-1 flex-wrap">
                        {/* Logo */}
                        <Link to="/firmadmin" className="navbar-brand d-flex align-items-center m-0">
                            <img
                                src={logo}
                                alt="Logo"
                                className="firm-topbar-logo"
                                style={{ maxHeight: "40px", width: "auto" }}
                            />
                        </Link>

                        {/* Sidebar Toggle */}
                        <div
                            onClick={onToggleSidebar}
                            style={{
                                cursor: "pointer",
                                transition: "transform 0.3s ease",
                                transform: isSidebarOpen ? "rotate(0deg)" : "rotate(180deg)",
                            }}
                            className="d-flex align-items-center"
                        >
                            <LogoIcon />
                        </div>

                        {/* Search Box */}
                        <div
                            className="firm-topbar-search d-flex align-items-center position-relative flex-grow-1"
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
                    </div>

                    {/* Right Section */}
                    <div
                        className="d-flex align-items-center gap-3 mt-2 mt-md-0 ms-auto flex-shrink-0 flex-nowrap"
                        style={{ minWidth: "fit-content" }}
                    >
                        {/* Notification Bell */}
                        <div
                            ref={notificationButtonRef}
                            className="firm-notification-bell d-flex align-items-center justify-content-center position-relative"
                            onClick={toggleNotifications}
                            style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "50%",
                                backgroundColor: "#3AD6F2",
                                cursor: "pointer",
                                flexShrink: 0,
                            }}
                        >
                            <FaBell size={14} color="white" />
                            {unreadNotifications > 0 && (
                                <span
                                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                    style={{
                                        fontSize: "10px",
                                        minWidth: "18px",
                                        height: "18px",
                                        padding: "2px 6px",
                                        border: "2px solid white",
                                    }}
                                >
                                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                                </span>
                            )}
                        </div>

                        {/* User Profile */}
                        <div
                            className="d-flex align-items-center gap-2 firm-topbar-user cursor-pointer"
                            style={{ flexShrink: 0 }}
                        >
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    backgroundColor: "#F56D2D",
                                    color: "white",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                }}
                            >
                                <i className="bi bi-person-fill"></i>
                            </div>
                            <FiChevronDown size={18} className="text-muted" />
                        </div>
                    </div>
                </div>
            </nav>
            
            {/* Notification Panel */}
            {showNotifications && (
                <NotificationPanel
                    onClose={closeNotifications}
                    onChange={handleNotificationChange}
                    userType="firm_admin"
                />
            )}
        </>
    );
}
