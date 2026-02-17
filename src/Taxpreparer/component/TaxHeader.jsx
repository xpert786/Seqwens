import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import logo from "../../assets/logo.png";
import { LogoIcond, DashIconed, Clients, FileIconed, Task, MesIconed, MonthIconed, SignatureIcon, AccountIcon } from "./icons";
import NotificationPanel from "../../ClientOnboarding/components/Notifications/NotificationPanel";
import AccountSwitcher from "../../ClientOnboarding/components/AccountSwitcher";
import { userAPI, taxPreparerSettingsAPI } from "../../ClientOnboarding/utils/apiUtils";
import { clearUserData, getImpersonationStatus, performRevertToSuperAdmin } from "../../ClientOnboarding/utils/userUtils";
import { getPathWithPrefix } from "../../ClientOnboarding/utils/urlUtils";
import { toast } from "react-toastify";

import { useFirmPortalColors } from "../../FirmAdmin/Context/FirmPortalColorsContext";
import { useNotificationWebSocket } from "../../ClientOnboarding/utils/useNotificationWebSocket";
import { firmAdminNotificationAPI } from "../../ClientOnboarding/utils/apiUtils";
import "../styles/topbar.css";

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

export default function Topbar({
  onToggleSidebar = () => { },
  isSidebarOpen = true,
}) {
  const { logoUrl } = useFirmPortalColors();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profileName, setProfileName] = useState("User");
  const [profileInitials, setProfileInitials] = useState("TP");
  const [menuOpenedViaKeyboard, setMenuOpenedViaKeyboard] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const searchRef = useRef(null);

  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const menuItemRefs = useRef([]);
  const navigate = useNavigate();

  const navigationItems = [
    { title: "Dashboard", path: "/taxdashboard", icon: <DashIconed /> },
    { title: "My Clients", path: "/taxdashboard/clients", icon: <Clients /> },
    { title: "Documents", path: "/taxdashboard/documents", icon: <FileIconed /> },
    { title: "Tasks / To-Dos", path: "/taxdashboard/tasks", icon: <Task /> },
    { title: "Messages", path: "/taxdashboard/messages", icon: <MesIconed /> },
    { title: "Calendar / Appointments", path: "/taxdashboard/calendar", icon: <MonthIconed /> },
    { title: "E-Signatures", path: "/taxdashboard/e-signatures", icon: <SignatureIcon /> },
    { title: "Workflows", path: "/taxdashboard/workflows", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 3H5C3.89543 3 3 3.89543 3 5V9C3 10.1046 3.89543 11 5 11H9C10.1046 11 11 10.1046 11 9V5C11 3.89543 10.1046 3 9 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 11V15C7 15.5304 7.21071 16.0391 7.58579 16.4142C7.96086 16.7893 8.46957 17 9 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M19 13H15C13.8954 13 13 13.8954 13 15V19C13 20.1046 13.8954 21 15 21H19C20.1046 21 21 20.1046 21 19V15C21 13.8954 20.1046 13 19 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    { title: "Billing & Invoices", path: "/taxdashboard/billing", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    { title: "Account Settings", path: "/taxdashboard/account", icon: <AccountIcon /> },
  ];

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      const filtered = navigationItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (path) => {
    navigate(path);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const menuItems = [
    { label: "Profile", action: "profile" },
    { label: "Settings", action: "settings" },
    { label: "Help", action: "help" },
    ...(isImpersonating ? [{ label: "Revert to Super Admin", action: "revert_superadmin", isPrimary: true }] : []),
    { label: "Log Out", action: "logout", isDanger: true },
  ];


  const toggleNotifications = () => {
    setShowNotifications((prev) => {
      const next = !prev;
      if (next) {
        setShowProfileMenu(false);
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

  const applyProfileData = useCallback((profileData) => {
    if (!profileData) return;

    const extractedName =
      profileData.name ||
      [profileData.first_name, profileData.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      "User";

    const picture =
      profileData.profile_picture_url ||
      profileData.profile_picture ||
      profileData.avatar_url ||
      profileData.avatar ||
      null;

    const initialsSource =
      profileData.initials ||
      extractedName ||
      `${profileData.first_name || ""}${profileData.last_name || ""}`;

    const initials = initialsSource
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TP";

    setProfilePicture(picture);
    setProfileName(extractedName);
    setProfileInitials(initials);
  }, []);

  const refreshProfileData = useCallback(async () => {
    try {
      const result = await taxPreparerSettingsAPI.getSettings();
      if (result?.success && result?.data?.profile_information) {
        applyProfileData(result.data.profile_information);
      }
    } catch (error) {
      console.error("Failed to load tax preparer profile:", error);
    }
  }, [applyProfileData]);

  const closeProfileMenu = useCallback(
    (focusButton = true) => {
      setShowProfileMenu(false);
      setMenuOpenedViaKeyboard(false);
      if (focusButton && profileButtonRef.current) {
        profileButtonRef.current.focus();
      }
    },
    []
  );

  const openProfileMenu = useCallback(
    (openedViaKeyboard = false) => {
      setShowNotifications(false);
      setMenuOpenedViaKeyboard(openedViaKeyboard);
      setShowProfileMenu(true);
    },
    []
  );

  const handleProfileButtonClick = () => {
    if (showProfileMenu) {
      closeProfileMenu(false);
    } else {
      openProfileMenu(false);
    }
  };

  const handleProfileButtonKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      if (!showProfileMenu) {
        openProfileMenu(true);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!showProfileMenu) {
        openProfileMenu(true);
      }
    } else if (event.key === "Escape") {
      if (showProfileMenu) {
        event.preventDefault();
        closeProfileMenu(true);
      }
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
        closeProfileMenu(false);
        navigate("/login");
      }
      return;
    }

    if (action === "revert_superadmin") {
      await handleRevertToSuperAdmin();
      return;
    }


    const routes = {
      profile: "/taxdashboard/account",
      settings: "/taxdashboard/settings",
      help: "/taxdashboard/messages",
    };

    const path = routes[action];
    if (path) {
      navigate(path);
    }
    closeProfileMenu(false);
  };

  const handleRevertToSuperAdmin = async () => {
    if (isReverting) return;

    try {
      setIsReverting(true);
      toast.info("Reverting to Super Admin session...", { autoClose: 2000 });

      const success = performRevertToSuperAdmin();

      if (success) {
        toast.success("Successfully reverted to Super Admin account");
        setTimeout(() => {
          window.location.href = getPathWithPrefix('/superadmin');
        }, 500);
      } else {
        toast.error("Failed to revert. Original session data not found.");
        setIsReverting(false);
      }
    } catch (error) {
      console.error("Error during revert:", error);
      toast.error("An error occurred while reverting.");
      setIsReverting(false);
    }
  };


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

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (showNotifications) {
          event.stopPropagation();
          closeNotifications();
        } else if (showProfileMenu) {
          closeProfileMenu();
        }
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [showNotifications, showProfileMenu, closeProfileMenu]);

  useEffect(() => {
    refreshProfileData();
    // Initial notification count fetch
    const fetchInitialUnreadCount = async () => {
      try {
        const response = await firmAdminNotificationAPI.getUnreadCount();
        if (response.success && response.data) {
          setUnreadNotifications(response.data.unread_count || 0);
        }
      } catch (err) {
        console.error("Error fetching initial unread count:", err);
      }
    };
    fetchInitialUnreadCount();

    // Check impersonation status
    const checkStatus = () => {
      const { isImpersonating: impersonating } = getImpersonationStatus();
      setIsImpersonating(impersonating);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);

    if (typeof window !== "undefined") {
      window.refreshTaxHeaderProfile = refreshProfileData;
      window.setTaxHeaderProfile = applyProfileData;
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        delete window.refreshTaxHeaderProfile;
        delete window.setTaxHeaderProfile;
      }
    };

  }, [refreshProfileData, applyProfileData]);

  // WebSocket connection for real-time notifications
  const handleUnreadCountUpdate = useCallback((count) => {
    setUnreadNotifications(count);
  }, []);

  useNotificationWebSocket(true, null, handleUnreadCountUpdate);


  useEffect(() => {
    if (showProfileMenu && menuOpenedViaKeyboard) {
      requestAnimationFrame(() => {
        menuItemRefs.current[0]?.focus();
      });
    } else if (!showProfileMenu) {
      menuItemRefs.current = [];
    }
  }, [showProfileMenu, menuOpenedViaKeyboard]);

  const focusMenuItem = (index) => {
    const item = menuItemRefs.current[index];
    if (item) {
      item.focus();
    }
  };

  const handleMenuItemKeyDown = (event, index, action) => {
    const totalItems = menuItems.length;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusMenuItem((index + 1) % totalItems);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusMenuItem((index - 1 + totalItems) % totalItems);
        break;
      case "Home":
        event.preventDefault();
        focusMenuItem(0);
        break;
      case "End":
        event.preventDefault();
        focusMenuItem(totalItems - 1);
        break;
      case "Escape":
        event.preventDefault();
        closeProfileMenu();
        break;
      case "Tab":
        closeProfileMenu(false);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        handleMenuAction(action);
        break;
      default:
        break;
    }
  };

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
          <div className="d-flex align-items-center h-full flex-grow-1">
            <div
              className={`d-flex align-items-center topbar-logo-wrapper ${isSidebarOpen ? 'px-4 sidebar-open justify-content-between' : 'px-0 sidebar-closed justify-content-center'}`}
              style={{
                height: '100%',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}
            >
              {isSidebarOpen && (
                <Link to="/" className="navbar-brand d-flex align-items-center m-0">
                  <img src={logoUrl || logo} alt="Logo" crossOrigin="anonymous" className="topbar-logo" />
                </Link>
              )}

              <button
                type="button"
                onClick={onToggleSidebar}
                className="sidebar-toggle-btn d-flex align-items-center justify-content-center px-3 h-full cursor-pointer hover:bg-gray-50 transition-colors"
                aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                style={{ background: "transparent", border: "none", width: '40px', flexShrink: 0 }}
              >
                <span
                  className={`sidebar-toggle-icon ${isSidebarOpen ? "" : "collapsed"
                    }`}
                  style={{
                    transition: "transform 0.3s ease",
                    transform: isSidebarOpen ? "rotate(0deg)" : "rotate(180deg)",
                  }}
                >
                  <LogoIcond />
                </span>
              </button>
            </div>

            <div className="topbar-search position-relative ms-4" ref={searchRef}>
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setShowSuggestions(true);
                }}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="position-absolute bg-white shadow-lg rounded-3 w-100 mt-2 overflow-hidden" style={{ zIndex: 1050, top: "100%", left: 0 }}>
                  <ul className="list-unstyled m-0 p-0">
                    {filteredSuggestions.map((item, index) => (
                      <li key={index}>
                        <button
                          className="d-flex align-items-center gap-2 w-100 px-3 py-2 border-0 bg-transparent text-start text-dark hover:bg-light transition-colors"
                          onClick={() => handleSuggestionClick(item.path)}
                          style={{ cursor: "pointer" }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                          onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                        >
                          <span className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: "28px", height: "28px", backgroundColor: "#00C0C6", color: "white" }}>
                            <span className="d-flex align-items-center justify-content-center" style={{ filter: "brightness(0) invert(1)", scale: "0.8" }}>
                              {item.icon}
                            </span>
                          </span>
                          <span style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", color: '#3B4A66' }}>
                            {item.title}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="ms-auto pe-4">
              {/* Right side */}
              <div className="d-flex align-items-center gap-3">
                {/* Account Switcher - Wrapped in error boundary to prevent blocking */}
                <React.Suspense fallback={null}>
                  <ErrorBoundary fallback={null}>
                    <AccountSwitcher />
                  </ErrorBoundary>
                </React.Suspense>

                <button
                  ref={notificationButtonRef}
                  type="button"
                  className="notification-belling border-0 p-0"
                  onClick={toggleNotifications}
                  aria-label="View notifications"
                  aria-expanded={showNotifications}
                >
                  <FaBell size={14} color="white" />
                  {unreadNotifications > 0 && (
                    <span className="notification-badge">{Math.min(unreadNotifications, 99)}</span>
                  )}
                </button>
                <div className="position-relative" ref={profileMenuRef}>
                  <button
                    ref={profileButtonRef}
                    type="button"
                    className="d-flex align-items-center lg:gap-2 md:gap-1 sm:gap-0 topbar-user border-0 bg-transparent p-0"
                    onClick={handleProfileButtonClick}
                    onKeyDown={handleProfileButtonKeyDown}
                    aria-label={`User menu for ${profileName}`}
                    aria-expanded={showProfileMenu}
                    aria-haspopup="menu"
                    aria-controls="tax-header-profile-menu"
                  >
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt={`${profileName} avatar`}
                        crossOrigin="anonymous"
                        className="topbar-user-avatar"
                        key={profilePicture}
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="topbar-user-initials" aria-hidden="true">
                        {profileInitials}
                      </div>
                    )}
                    <FiChevronDown
                      size={18}
                      className={`text-muted ${showProfileMenu ? "rotate-180" : ""}`}
                    />
                  </button>
                  {showProfileMenu && (
                    <div
                      id="tax-header-profile-menu"
                      className="topbar-profile-menu"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      {menuItems.map((item, index) => (
                        <React.Fragment key={item.action}>
                          {item.action === "logout" && <div className="profile-menu-divider" aria-hidden="true" />}
                          <button
                            type="button"
                            ref={(el) => {
                              menuItemRefs.current[index] = el;
                            }}
                            className={`profile-menu-item${item.isDanger ? " text-danger" : ""}`}
                            onClick={() => handleMenuAction(item.action)}
                            onKeyDown={(event) => handleMenuItemKeyDown(event, index, item.action)}
                            role="menuitem"
                          >
                            {item.action === "logout" && isLoggingOut ? "Logging out..." : item.label}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Notification Panel */}
      {showNotifications && (
        <>
          <div className="notifications-overlay" onClick={closeNotifications} />
          <NotificationPanel
            onClose={closeNotifications}
            onChange={({ unreadCount }) => setUnreadNotifications(unreadCount)}
          />
        </>
      )}
    </>
  );

}

