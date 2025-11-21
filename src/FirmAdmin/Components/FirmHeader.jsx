import React, { useState, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import logo from "../../assets/logo.png";
import image from "../../assets/image.png";
import { LogoIcon } from "../../ClientOnboarding/components/icons";
import NotificationPanel from "../../ClientOnboarding/components/Notifications/NotificationPanel";
import { firmAdminNotificationAPI, firmAdminDashboardAPI, handleAPIError, userAPI } from "../../ClientOnboarding/utils/apiUtils";
import { clearUserData } from "../../ClientOnboarding/utils/userUtils";
import { navigateToLogin } from "../../ClientOnboarding/utils/urlUtils";
import "../styles/FirmHeader.css";

export default function FirmHeader({ onToggleSidebar, isSidebarOpen }) {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [showSearch, setShowSearch] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [profileName, setProfileName] = useState("User");
    const [profileInitials, setProfileInitials] = useState("FA");
    const notificationButtonRef = useRef(null);
    const profileMenuRef = useRef(null);
    const profileButtonRef = useRef(null);
    const searchRef = useRef(null);
    
    const menuItems = [
        { label: "Profile", action: "profile" },
        { label: "Settings", action: "settings" },
        { label: "Help", action: "help" },
        { label: "Log Out", action: "logout", isDanger: true },
    ];

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

    // Fetch profile data from account settings
    const fetchProfileData = useCallback(async () => {
        try {
            const response = await firmAdminDashboardAPI.getAccountSettings();
            const data = response?.data || response;
            
            if (data?.profile_picture) {
                setProfilePicture(data.profile_picture);
            } else {
                setProfilePicture(null);
            }

            // Extract name
            const extractedName =
                [data?.first_name, data?.last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim() || "User";
            setProfileName(extractedName);

            // Generate initials
            const initials = extractedName
                .split(" ")
                .map((part) => part.charAt(0))
                .join("")
                .slice(0, 2)
                .toUpperCase() || "FA";
            setProfileInitials(initials);
        } catch (err) {
            console.error("Error fetching profile data:", err);
            setProfilePicture(null);
        }
    }, []);

    const closeProfileMenu = useCallback(() => {
        setShowProfileMenu(false);
        if (profileButtonRef.current) {
            profileButtonRef.current.focus();
        }
    }, []);

    const toggleProfileMenu = () => {
        setShowProfileMenu((prev) => {
            const next = !prev;
            if (next) {
                setShowNotifications(false);
            }
            return next;
        });
    };

    const handleMenuAction = async (action) => {
        if (action === "logout") {
            if (isLoggingOut) return;
            setIsLoggingOut(true);
            try {
                await userAPI.logout();
            } catch (error) {
                console.error("Failed to log out:", error);
            } finally {
                clearUserData();
                setIsLoggingOut(false);
                closeProfileMenu();
                navigateToLogin(navigate);
            }
            return;
        }

        const routes = {
            profile: "/firmadmin/account-settings",
            settings: "/firmadmin/settings",
            help: "/firmadmin/support",
        };

        const path = routes[action];
        if (path) {
            navigate(path);
        }
        closeProfileMenu();
    };

    // Fetch unread count on mount and periodically
    useEffect(() => {
        fetchUnreadCount();
        fetchProfileData();
        const interval = setInterval(fetchUnreadCount, 30000); // Refresh every 30 seconds
        
        // Listen for profile picture updates from localStorage
        const handleStorageChange = (e) => {
            if (e.key === 'profilePictureUpdated') {
                fetchProfileData();
                localStorage.removeItem('profilePictureUpdated');
            }
        };
        window.addEventListener('storage', handleStorageChange);
        
        // Also listen for custom event for same-tab updates
        const handleProfileUpdate = () => {
            fetchProfileData();
        };
        window.addEventListener('profilePictureUpdated', handleProfileUpdate);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('profilePictureUpdated', handleProfileUpdate);
        };
    }, [fetchUnreadCount, fetchProfileData]);

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target) &&
                profileButtonRef.current &&
                !profileButtonRef.current.contains(event.target)
            ) {
                closeProfileMenu();
            }
        };

        if (showProfileMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showProfileMenu, closeProfileMenu]);

    // Handle Escape key to close menus
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === "Escape") {
                if (showNotifications) {
                    event.stopPropagation();
                    setShowNotifications(false);
                } else if (showProfileMenu) {
                    closeProfileMenu();
                }
            }
        };

        document.addEventListener("keydown", handleEscKey);
        return () => document.removeEventListener("keydown", handleEscKey);
    }, [showNotifications, showProfileMenu, closeProfileMenu]);

    const toggleNotifications = () => {
        setShowNotifications((prev) => {
            const next = !prev;
            if (next) {
                setShowProfileMenu(false);
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
            <nav className="navbar bg-white fixed-top border-bottom firm-custom-topbar px-2 px-md-3 py-2">
                <div className="container-fluid d-flex justify-content-between align-items-center flex-wrap w-100">

                    {/* Left Section */}
                    <div className="d-flex align-items-center gap-2 gap-md-3 flex-grow-1 flex-wrap">
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

                        {/* Search Box - Desktop */}
                        <div
                            className="firm-topbar-search d-none d-md-flex align-items-center position-relative flex-grow-1"
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
                            className="d-md-none d-flex align-items-center justify-content-center"
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
                    <div
                        className="d-flex align-items-center gap-2 gap-md-3 ms-auto flex-shrink-0 flex-nowrap"
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
                            className="position-relative"
                            ref={profileMenuRef}
                            style={{ flexShrink: 0 }}
                        >
                            <button
                                ref={profileButtonRef}
                                type="button"
                                className="d-flex align-items-center gap-1 gap-md-2 firm-topbar-user border-0 bg-transparent p-0"
                                onClick={toggleProfileMenu}
                                style={{ cursor: "pointer" }}
                                aria-label={`User menu for ${profileName}`}
                                aria-expanded={showProfileMenu}
                                aria-haspopup="menu"
                            >
                                {profilePicture ? (
                                    <img
                                        src={profilePicture}
                                        alt={`${profileName} avatar`}
                                        className="rounded-circle"
                                        style={{
                                            width: "32px",
                                            height: "32px",
                                            objectFit: "cover",
                                            border: "2px solid #E5E7EB"
                                        }}
                                    />
                                ) : (
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center"
                                        style={{
                                            width: "32px",
                                            height: "32px",
                                            backgroundColor: "#F56D2D",
                                            color: "white",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        {profileInitials}
                                    </div>
                                )}
                                <FiChevronDown 
                                    size={18} 
                                    className={`text-muted d-none d-sm-block ${showProfileMenu ? "rotate-180" : ""}`}
                                    style={{ transition: "transform 0.2s ease" }}
                                />
                            </button>
                            {showProfileMenu && (
                                <div
                                    className="position-absolute end-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200"
                                    style={{
                                        minWidth: "180px",
                                        zIndex: 1000,
                                        top: "100%",
                                    }}
                                    role="menu"
                                >
                                    {menuItems.map((item, index) => (
                                        <React.Fragment key={item.action}>
                                            {item.action === "logout" && (
                                                <div 
                                                    className="border-top border-gray-200 my-1" 
                                                    aria-hidden="true"
                                                />
                                            )}
                                            <button
                                                type="button"
                                                className={`w-100 text-start px-4 py-2 text-sm font-[BasisGrotesquePro] border-0 bg-transparent ${
                                                    item.isDanger 
                                                        ? "text-danger" 
                                                        : "text-gray-700"
                                                } hover:bg-gray-50 transition-colors`}
                                                onClick={() => handleMenuAction(item.action)}
                                                role="menuitem"
                                                style={{
                                                    cursor: "pointer",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                {item.action === "logout" && isLoggingOut 
                                                    ? "Logging out..." 
                                                    : item.label}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Search Bar - Expandable */}
                {showSearch && (
                    <div ref={searchRef} className="d-md-none w-100 px-2 pb-2">
                        <div className="firm-topbar-search d-flex align-items-center position-relative w-100">
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
