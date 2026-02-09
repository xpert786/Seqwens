import React, { useState, useCallback, useEffect, useRef } from "react";

// Simple Error Boundary for AccountSwitcher
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Silently handle AccountSwitcher errors - component will not display
        // No console logging needed
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || null;
        }
        return this.props.children;
    }
}
import { Link, useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import logo from "../../assets/logo.png";
import image from "../../assets/image.png";
import { LogoIcon } from "../../ClientOnboarding/components/icons";
import NotificationPanel from "../../ClientOnboarding/components/Notifications/NotificationPanel";
import AccountSwitcher from "../../ClientOnboarding/components/AccountSwitcher";
import { firmAdminNotificationAPI, firmAdminDashboardAPI, handleAPIError, userAPI } from "../../ClientOnboarding/utils/apiUtils";
import { clearUserData, setTokens, getImpersonationStatus, performRevertToSuperAdmin } from "../../ClientOnboarding/utils/userUtils";

import { navigateToLogin, getPathWithPrefix } from "../../ClientOnboarding/utils/urlUtils";
import { toast } from "react-toastify";
import { useFirmPortalColors } from "../Context/FirmPortalColorsContext";
import { useSubscriptionStatus } from "../Context/SubscriptionStatusContext";

export default function FirmHeader({ onToggleSidebar, isSidebarOpen, sidebarWidth = '320px' }) {
    const { logoUrl } = useFirmPortalColors();
    const { status, statusDisplay, isTrialActive, trialDaysRemaining } = useSubscriptionStatus();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [profilePicture, setProfilePicture] = useState(null);
    const [profileName, setProfileName] = useState("User");
    const [profileInitials, setProfileInitials] = useState("FA");
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [impersonationInfo, setImpersonationInfo] = useState(null);
    const [isReverting, setIsReverting] = useState(false);
    const notificationButtonRef = useRef(null);
    const profileMenuRef = useRef(null);
    const profileButtonRef = useRef(null);
    const searchRef = useRef(null);
    const logoRef = useRef(null);

    // Check if currently impersonating a firm
    const checkImpersonationStatus = useCallback(() => {
        const { isImpersonating: impersonating, info } = getImpersonationStatus();
        setIsImpersonating(impersonating);
        setImpersonationInfo(info);
    }, []);


    const menuItems = [
        { label: "Profile", action: "profile" },
        { label: "Settings", action: "settings" },
        { label: "Help", action: "help" },
        ...(isImpersonating ? [{ label: "Revert to Super Admin", action: "revert_superadmin", isPrimary: true }] : []),
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

    const handleRevertToSuperAdmin = async () => {
        if (isReverting) return;

        try {
            setIsReverting(true);
            console.log('[FIRM_HEADER] Starting revert to Super Admin');

            const success = performRevertToSuperAdmin();

            if (success) {
                toast.success("Successfully reverted to Super Admin account", {
                    position: "top-right",
                    autoClose: 2000,
                });

                // STEP 5: Force hard navigation to Super Admin dashboard
                console.log('[FIRM_HEADER] Step 5: Forcing navigation to Super Admin dashboard');
                setTimeout(() => {
                    const targetUrl = getPathWithPrefix('/superadmin');
                    console.log('[FIRM_HEADER] Navigating to:', targetUrl);
                    window.location.href = targetUrl;
                }, 500);
            } else {
                toast.error("Unable to revert: Original session data not found", {
                    position: "top-right",
                    autoClose: 3000,
                });
                setIsReverting(false);
            }

        } catch (error) {
            console.error("[FIRM_HEADER] Error during revert:", error);
            toast.error("Failed to revert to Super Admin account. Please refresh the page and try again.", {
                position: "top-right",
                autoClose: 5000,
            });
            setIsReverting(false);
        } finally {
            closeProfileMenu();
        }
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

        if (action === "revert_superadmin") {
            await handleRevertToSuperAdmin();
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
        checkImpersonationStatus();
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
    }, [fetchUnreadCount, fetchProfileData, checkImpersonationStatus]);

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
            <nav
                className={`navbar bg-white fixed-top border-bottom custom-topbar p-0 ${isImpersonating ? 'impersonating-topbar' : ''}`}
                style={{
                    top: isImpersonating ? '40px' : '0',
                    transition: 'top 0.3s ease'
                }}
            >

                <div className="container-fluid d-flex justify-content-between align-items-center h-[70px] p-0">

                    {/* Left Section */}
                    <div className="d-flex align-items-center h-full">
                        <div
                            className="d-flex align-items-center px-4 border-end"
                            style={{
                                width: sidebarWidth,
                                height: '100%',
                                transition: 'width 0.3s ease'
                            }}
                        >
                            <Link to="/firmadmin" className="navbar-brand d-flex align-items-center m-0">
                                <img
                                    ref={logoRef}
                                    src={logoUrl || logo}
                                    alt="Logo"
                                    crossOrigin="anonymous"
                                    className="firm-topbar-logo"
                                    style={{ maxHeight: "35px", width: "auto" }}
                                />
                            </Link>
                        </div>

                        {/* Sidebar Toggle */}
                        <div
                            onClick={onToggleSidebar}
                            className="d-flex align-items-center justify-content-center px-3 h-full cursor-pointer hover:bg-gray-50 transition-colors border-end"
                            style={{
                                width: '60px'
                            }}
                        >
                            <div
                                style={{
                                    transition: "transform 0.3s ease",
                                    transform: isSidebarOpen ? "rotate(0deg)" : "rotate(180deg)",
                                }}
                            >
                                <LogoIcon />
                            </div>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div
                        className="d-flex align-items-center gap-3 pe-4"
                        style={{ minWidth: "fit-content" }}
                    >
                        {/* Account Switcher - Wrapped in error boundary to prevent blocking */}
                        <React.Suspense fallback={null}>
                            <ErrorBoundary fallback={null}>
                                <AccountSwitcher />
                            </ErrorBoundary>
                        </React.Suspense>

                        {/* Subscription Status Badge */}
                        <div className="d-none d-lg-flex align-items-center me-2">
                            <Link
                                to="/firmadmin/subscription"
                                className="text-decoration-none d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill transition-all duration-200"
                                style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    backgroundColor:
                                        status === 'active' ? '#ECFDF5' :
                                            status === 'trial' ? '#EFF6FF' :
                                                status === 'developer' ? '#F0F5FF' :
                                                    status === 'pending_payment' ? '#FFFBEB' :
                                                        status === 'inactive' ? '#F3F4F6' :
                                                            '#FEF2F2',
                                    color:
                                        status === 'active' ? '#059669' :
                                            status === 'trial' ? '#2563EB' :
                                                status === 'developer' ? '#4F46E5' :
                                                    status === 'pending_payment' ? '#D97706' :
                                                        status === 'inactive' ? '#4B5563' :
                                                            '#DC2626',
                                    border: `1px solid ${status === 'active' ? '#A7F3D0' :
                                        status === 'trial' ? '#BFDBFE' :
                                            status === 'developer' ? '#C7D2FE' :
                                                status === 'pending_payment' ? '#FDE68A' :
                                                    status === 'inactive' ? '#D1D5DB' :
                                                        '#FECACA'
                                        }`

                                }}
                            >
                                <span
                                    style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor: 'currentColor'
                                    }}
                                    className={status === 'active' ? 'animate-pulse' : ''}
                                />
                                {statusDisplay}
                            </Link>
                        </div>

                        {/* Notification Bell */}
                        <div
                            ref={notificationButtonRef}
                            className="firm-notification-bell d-flex align-items-center justify-content-center position-relative notification-bell border-0 p-0"
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
                                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger text-white"
                                    style={{
                                        fontSize: "10px",
                                        minWidth: "18px",
                                        height: "18px",
                                        padding: "2px 6px",
                                        border: "2px solid white",
                                        color: "#ffffff",
                                        fontWeight: "600",
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
                                        crossOrigin="anonymous"
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
                                            {(item.action === "logout" || (item.action === "revert_superadmin" && isImpersonating)) && (
                                                <div
                                                    className="border-top border-gray-200 my-1"
                                                    aria-hidden="true"
                                                />
                                            )}
                                            <button
                                                type="button"
                                                className={`w-100 text-start px-4 py-2 text-sm font-[BasisGrotesquePro] border-0 bg-transparent ${item.isDanger
                                                    ? "text-danger"
                                                    : item.isPrimary
                                                        ? "text-primary fw-bold"
                                                        : "text-gray-700"
                                                    } hover:bg-gray-50 transition-colors`}
                                                onClick={() => handleMenuAction(item.action)}
                                                role="menuitem"
                                                style={{
                                                    cursor: "pointer",
                                                    fontSize: "14px",
                                                }}
                                                disabled={item.action === "revert_superadmin" && isReverting}
                                            >
                                                {item.action === "logout" && isLoggingOut
                                                    ? "Logging out..."
                                                    : item.action === "revert_superadmin" && isReverting
                                                        ? "Reverting..."
                                                        : item.label}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
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
