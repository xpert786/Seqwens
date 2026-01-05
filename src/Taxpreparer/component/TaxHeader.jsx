import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import logo from "../../assets/logo.png";
import { LogoIcond } from "./icons";
import NotificationPanel from "../../ClientOnboarding/components/Notifications/NotificationPanel";
import AccountSwitcher from "../../ClientOnboarding/components/AccountSwitcher";
import { userAPI, taxPreparerSettingsAPI } from "../../ClientOnboarding/utils/apiUtils";
import { clearUserData } from "../../ClientOnboarding/utils/userUtils";
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
  onToggleSidebar = () => {},
  isSidebarOpen = true,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profileName, setProfileName] = useState("User");
  const [profileInitials, setProfileInitials] = useState("TP");
  const [menuOpenedViaKeyboard, setMenuOpenedViaKeyboard] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const menuItemRefs = useRef([]);
  const navigate = useNavigate();
  const menuItems = [
    { label: "Profile", action: "profile" },
    { label: "Settings", action: "settings" },
    { label: "Help", action: "help" },
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
    if (typeof window !== "undefined") {
      window.refreshTaxHeaderProfile = refreshProfileData;
      window.setTaxHeaderProfile = applyProfileData;
    }

    return () => {
      if (typeof window !== "undefined") {
        delete window.refreshTaxHeaderProfile;
        delete window.setTaxHeaderProfile;
      }
    };
  }, [refreshProfileData, applyProfileData]);

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
      <nav className="navbar bg-white fixed-top border-bottom custom-topbar px-0">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3 flex-grow-1">
            <Link to="/" className="navbar-brand d-flex align-items-center m-0">
              <img src={logo} alt="Logo" className="topbar-logo" />
            </Link>
            <button
              type="button"
              onClick={onToggleSidebar}
              className="sidebar-toggle-btn"
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              style={{ background: "transparent", border: "none" }}
            >
              <span
                className={`sidebar-toggle-icon ${
                  isSidebarOpen ? "" : "collapsed"
                }`}
              >
                <LogoIcond />
              </span>
            </button>
            <div className="sd">
              {/* Search */}
              <div className="topbar-search">
                <i className="bi bi-search"></i>
                <input type="text" className="form-control" placeholder="Search..." />
              </div>

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

