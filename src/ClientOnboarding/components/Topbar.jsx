import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import logo from "../../assets/logo.png";
import { LogoIcon } from "./icons";
import image from "../../assets/image.png";
import NotificationPanel from "./Notifications/NotificationPanel";
import { profileAPI, userAPI, clientNotificationAPI } from "../utils/apiUtils";
import { clearUserData, getUserData } from "../utils/userUtils";
import { useNotificationWebSocket } from "../utils/useNotificationWebSocket";
import { getApiBaseUrl } from "../utils/corsConfig";
import "../styles/Topbar.css";

const CLIENT_AVATAR_KEY = "clientProfileImageUrl";

export default function Topbar({
    onToggleSidebar = () => {},
    isSidebarOpen = true,
}) {
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [profilePicture, setProfilePicture] = useState(() => localStorage.getItem(CLIENT_AVATAR_KEY));
    const [userInfo, setUserInfo] = useState(null);
    const [profileInitials, setProfileInitials] = useState("CL");
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const profileMenuRef = useRef(null);
    const profileButtonRef = useRef(null);
    const navigate = useNavigate();

    const setClientAvatar = (value) => {
        if (value) {
            localStorage.setItem(CLIENT_AVATAR_KEY, value);
            setProfilePicture(value);
        } else {
            localStorage.removeItem(CLIENT_AVATAR_KEY);
            setProfilePicture(null);
        }
    };

    // Helper function to normalize profile picture URL
    const normalizeProfilePictureUrl = (url) => {
        if (!url || url === 'null' || url === 'undefined') {
            return null;
        }

        // If URL already starts with http:// or https://, return as is
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        // If URL contains a malformed concatenation (base URL + https://), extract the correct part
        const httpsIndex = url.indexOf('https://');
        const httpIndex = url.indexOf('http://');
        if (httpsIndex > 0) {
            // Extract the part starting from https://
            return url.substring(httpsIndex);
        }
        if (httpIndex > 0 && !url.startsWith('http://')) {
            // Extract the part starting from http://
            return url.substring(httpIndex);
        }

        // If URL starts with /, it's a relative path - prepend API base URL
        if (url.startsWith('/')) {
            const API_BASE_URL = getApiBaseUrl();
            const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
            return `${baseUrl}${url}`;
        }

        // Otherwise, return as is (might be a data URL or other format)
        return url;
    };

    const deriveInitials = (data) => {
        if (!data) return "CL";

        const nameSources = [
            data.full_name,
            data.display_name,
            data.name,
            `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        ].filter(Boolean);

        const base = nameSources.find((value) => value && value.length > 0) || data.email || "CL";
        const initials = base
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

        return initials || "CL";
    };

    // Function to refresh profile picture (can be called from other components)
    const refreshProfilePicture = async () => {
        try {
            console.log('🔄 Refreshing topbar profile picture...');

            // Always fetch from API first to get the latest picture
            const response = await profileAPI.getProfilePicture();
            console.log('📋 Refresh topbar profile picture API response:', response);
            
            if (response.success && response.data && response.data.has_profile_picture && response.data.profile_picture_url) {
                const normalizedUrl = normalizeProfilePictureUrl(response.data.profile_picture_url);
                console.log('🖼️ Topbar profile picture refreshed:', normalizedUrl);
                setClientAvatar(normalizedUrl);
                
                // Update user info and initials
                const accountResponse = await profileAPI.getUserAccount();
                if (accountResponse?.success && accountResponse?.data) {
                    setUserInfo(accountResponse.data);
                    setProfileInitials(deriveInitials(accountResponse.data));
                }
                return;
            }

            // Fallback: check userData if API doesn't return a picture
            const userData = getUserData();
            if (userData) {
                // Check both profile_picture and profile_image fields
                const pictureUrl = userData.profile_picture || userData.profile_image;
                if (pictureUrl && pictureUrl !== 'null' && pictureUrl !== 'undefined') {
                    const normalizedUrl = normalizeProfilePictureUrl(pictureUrl);
                    console.log('🖼️ Topbar profile picture from user data (fallback):', normalizedUrl);
                    setClientAvatar(normalizedUrl);
                    setProfileInitials(deriveInitials(userData));
                    return;
                }
            }
            
            // Check localStorage cache as last resort
            const stored = localStorage.getItem(CLIENT_AVATAR_KEY);
            if (stored && stored !== 'null' && stored !== 'undefined') {
                const normalizedUrl = normalizeProfilePictureUrl(stored);
                console.log('🖼️ Topbar profile picture from localStorage cache:', normalizedUrl);
                setProfilePicture(normalizedUrl);
                return;
            }

            // If no picture found anywhere, clear it
            console.log('❌ No profile picture found, clearing topbar avatar');
            setClientAvatar(null);
            
            // Update user info and initials even if no picture
            const accountResponse = await profileAPI.getUserAccount();
            if (accountResponse?.success && accountResponse?.data) {
                setUserInfo(accountResponse.data);
                setProfileInitials(deriveInitials(accountResponse.data));
            }
        } catch (err) {
            console.error('💥 Error refreshing topbar profile picture:', err);
            
            // On error, fallback to userData
            const userData = getUserData();
            if (userData) {
                const pictureUrl = userData.profile_picture || userData.profile_image;
                if (pictureUrl && pictureUrl !== 'null' && pictureUrl !== 'undefined') {
                    const normalizedUrl = normalizeProfilePictureUrl(pictureUrl);
                    console.log('🖼️ Topbar profile picture from user data (error fallback):', normalizedUrl);
                    setClientAvatar(normalizedUrl);
                    setProfileInitials(deriveInitials(userData));
                    return;
                }
            }
            
            setClientAvatar(null);
        }
    };

    // Expose refresh function to window for global access
    useEffect(() => {
        window.refreshClientTopbarAvatar = refreshProfilePicture;
        return () => {
            delete window.refreshClientTopbarAvatar;
        };
    }, []);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await clientNotificationAPI.getUnreadCount();
            if (response.success && response.data) {
                setUnreadNotifications(response.data.unread_count || 0);
            }
        } catch (err) {
            console.error('💥 Error fetching unread count:', err);
        }
    }, []);

    // Handle new notification from WebSocket
    const handleNewNotification = useCallback(() => {
        // Refresh unread count when a new notification is received
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    // Handle unread count update from WebSocket
    const handleUnreadCountUpdate = useCallback((count) => {
        setUnreadNotifications(count);
    }, []);

    // Connect to WebSocket for real-time notifications
    useNotificationWebSocket(true, handleNewNotification, handleUnreadCountUpdate);

    // Fetch unread count only once on component mount
    useEffect(() => {
        fetchUnreadCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - only run once on mount

    // Fetch profile picture and user info on component mount
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // First, check userData from login response
                const userData = getUserData();
                if (userData) {
                    setUserInfo(userData);
                    setProfileInitials(deriveInitials(userData));
                    
                    // Check both profile_picture and profile_image fields
                    const pictureUrl = userData.profile_picture || userData.profile_image;
                    if (pictureUrl && pictureUrl !== 'null' && pictureUrl !== 'undefined') {
                        // Use profile picture from userData if available
                        const normalizedUrl = normalizeProfilePictureUrl(pictureUrl);
                        console.log('🖼️ Topbar profile picture from user data:', normalizedUrl);
                        setClientAvatar(normalizedUrl);
                        setLoading(false);
                        return;
                    } else {
                        console.log('❌ No profile picture in user data, will fetch from API');
                    }
                }
                
                const storedAvatar = localStorage.getItem(CLIENT_AVATAR_KEY);
                if (storedAvatar) {
                    const normalizedStored = normalizeProfilePictureUrl(storedAvatar);
                    setProfilePicture(normalizedStored);
                }

                const profileResponse = await profileAPI.getProfilePicture();
                
                if (!storedAvatar && profileResponse.success && profileResponse.data) {
                    if (profileResponse.data.has_profile_picture && profileResponse.data.profile_picture_url) {
                        const normalizedUrl = normalizeProfilePictureUrl(profileResponse.data.profile_picture_url);
                        setClientAvatar(normalizedUrl);
                    } else {
                        setClientAvatar(null);
                    }
                } else if (!storedAvatar) {
                    setClientAvatar(null);
                }

                // Fetch user account info for name display if not already set
                if (!userData) {
                    const userResponse = await profileAPI.getUserAccount();
                    
                    if (userResponse.success && userResponse.data) {
                        setUserInfo(userResponse.data);
                        setProfileInitials(deriveInitials(userResponse.data));
                    }
                }
            } catch (err) {
                console.error('💥 Error fetching topbar profile data:', err);
                setClientAvatar(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    // Monitor profile picture state changes
    useEffect(() => {
        console.log('🔄 Topbar profile picture state changed:', profilePicture);
    }, [profilePicture]);

    // Handle profile menu outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target) &&
                profileButtonRef.current &&
                !profileButtonRef.current.contains(event.target)
            ) {
                setShowProfileMenu(false);
            }
        };

        if (showProfileMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showProfileMenu]);

    // Handle Esc key for profile menu
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === "Escape" && showProfileMenu) {
                setShowProfileMenu(false);
                if (profileButtonRef.current) {
                    profileButtonRef.current.focus();
                }
            }
        };

        document.addEventListener("keydown", handleEscKey);
        return () => {
            document.removeEventListener("keydown", handleEscKey);
        };
    }, [showProfileMenu]);

    // Handle logout
    const handleLogout = async () => {
        if (isLoggingOut) return;
        
        setIsLoggingOut(true);
        try {
            await userAPI.logout();
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            clearUserData();
            setIsLoggingOut(false);
            setShowProfileMenu(false);
            navigate("/login");
        }
    };

    // Handle profile menu keyboard navigation
    const handleProfileMenuKeyDown = (event, action) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (action === "profile") {
                navigate("/accounts");
                setShowProfileMenu(false);
            } else if (action === "logout") {
                handleLogout();
            } else if (action === "help") {
                navigate("/helpers");
                setShowProfileMenu(false);
            }
        }
    };

    return (
        <>
            <nav className="navbar bg-white fixed-top border-bottom custom-topbar px-3">
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
                                className={`sidebar-toggle-icon ${isSidebarOpen ? "" : "collapsed"}`}
                            >
                                <LogoIcon />
                            </span>
                        </button>

                   
                        <div className="topbar-search">
                            <i className="bi bi-search"></i>
                            <input type="text" className="form-control" placeholder="Search..." />
                        </div>


                    </div>


                    <div className="d-flex align-items-center gap-3">
                        <button
                            type="button"
                            className="notification-bell border-0 p-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowNotifications(!showNotifications);
                            }}
                            aria-label="View notifications"
                            aria-expanded={showNotifications}
                            style={{
                                cursor: "pointer"
                            }}
                        >
                            <FaBell size={14} color="white" />
                            {unreadNotifications > 0 && (
                                <span className="notification-badge">{Math.min(unreadNotifications, 99)}</span>
                            )}
                        </button>

                        <div 
                            className="position-relative"
                            ref={profileMenuRef}
                        >
                            <button
                                ref={profileButtonRef}
                                type="button"
                                className="d-flex align-items-center gap-2 topbar-user border-0 bg-transparent p-0"
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setShowProfileMenu(!showProfileMenu);
                                    }
                                }}
                                aria-label={profilePicture ? "User menu" : `User menu${profileInitials ? ` for ${profileInitials}` : ''}`}
                                aria-expanded={showProfileMenu}
                                aria-haspopup="true"
                                style={{
                                    cursor: "pointer",
                                    outline: "none"
                                }}
                                onFocus={(e) => {
                                    e.target.style.outline = "2px solid #00C0C6";
                                    e.target.style.outlineOffset = "2px";
                                    e.target.style.borderRadius = "4px";
                                }}
                                onBlur={(e) => {
                                    e.target.style.outline = "none";
                                }}
                            >
                                {profilePicture ? (
                                    <img 
                                        src={profilePicture} 
                                        alt="User" 
                                        className="rounded-circle"
                                        style={{ width: "32px", height: "32px", objectFit: "cover" }}
                                        onLoad={() => console.log('✅ Topbar profile picture loaded successfully')}
                                        onError={() => console.log('❌ Topbar profile picture failed to load')}
                                    />
                                ) : null}
                                <FiChevronDown 
                                    size={18} 
                                    className="text-muted"
                                    style={{
                                        transform: showProfileMenu ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s ease"
                                    }}
                                />
                            </button>

                            {/* Profile Dropdown Menu */}
                            {showProfileMenu && (
                                <div
                                    className="bg-white shadow-lg border rounded-3 position-absolute"
                                    style={{
                                        top: "calc(100% + 8px)",
                                        right: 0,
                                        minWidth: "200px",
                                        zIndex: 1050,
                                        padding: "8px 0",
                                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                                    }}
                                    role="menu"
                                    aria-orientation="vertical"
                                >
                                    <Link
                                        to="/accounts"
                                        className="d-block px-3 py-2 text-decoration-none text-dark"
                                        onClick={() => setShowProfileMenu(false)}
                                        onKeyDown={(e) => handleProfileMenuKeyDown(e, "profile")}
                                        role="menuitem"
                                        tabIndex={0}
                                        style={{
                                            fontFamily: "BasisGrotesquePro",
                                            fontSize: "14px",
                                            transition: "background-color 0.2s ease"
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                                        onFocus={(e) => {
                                            e.target.style.backgroundColor = "#f8f9fa";
                                            e.target.style.outline = "2px solid #00C0C6";
                                            e.target.style.outlineOffset = "-2px";
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.backgroundColor = "transparent";
                                            e.target.style.outline = "none";
                                        }}
                                    >
                                        <i className="bi bi-gear me-2"></i>
                                        Account Settings
                                    </Link>
                                    <Link
                                        to="/helpers"
                                        className="d-block px-3 py-2 text-decoration-none text-dark"
                                        onClick={() => setShowProfileMenu(false)}
                                        onKeyDown={(e) => handleProfileMenuKeyDown(e, "help")}
                                        role="menuitem"
                                        tabIndex={0}
                                        style={{
                                            fontFamily: "BasisGrotesquePro",
                                            fontSize: "14px",
                                            transition: "background-color 0.2s ease"
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                                        onFocus={(e) => {
                                            e.target.style.backgroundColor = "#f8f9fa";
                                            e.target.style.outline = "2px solid #00C0C6";
                                            e.target.style.outlineOffset = "-2px";
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.backgroundColor = "transparent";
                                            e.target.style.outline = "none";
                                        }}
                                    >
                                        <i className="bi bi-question-circle me-2"></i>
                                        Help & Support
                                    </Link>
                                    <div
                                        className="border-top my-1"
                                        style={{ borderColor: "#E8F0FF" }}
                                    ></div>
                                    <button
                                        type="button"
                                        className="d-block w-100 px-3 py-2 text-start text-dark border-0 bg-transparent"
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                handleLogout();
                                            }
                                        }}
                                        role="menuitem"
                                        tabIndex={0}
                                        style={{
                                            fontFamily: "BasisGrotesquePro",
                                            fontSize: "14px",
                                            cursor: isLoggingOut ? "not-allowed" : "pointer",
                                            transition: "background-color 0.2s ease",
                                            color: isLoggingOut ? "#999" : "#131323"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isLoggingOut) e.target.style.backgroundColor = "#f8f9fa";
                                        }}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                                        onFocus={(e) => {
                                            if (!isLoggingOut) {
                                                e.target.style.backgroundColor = "#f8f9fa";
                                                e.target.style.outline = "2px solid #00C0C6";
                                                e.target.style.outlineOffset = "-2px";
                                            }
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.backgroundColor = "transparent";
                                            e.target.style.outline = "none";
                                        }}
                                    >
                                        <i className="bi bi-box-arrow-right me-2"></i>
                                        {isLoggingOut ? "Logging out..." : "Log Out"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Notification Panel */}
            {showNotifications && (
                <NotificationPanel
                    onClose={() => setShowNotifications(false)}
                    onChange={({ unreadCount }) => {
                        setUnreadNotifications(unreadCount);
                        // Don't call fetchUnreadCount here - the unreadCount is already updated from onChange
                    }}
                />
            )}
        </>
    );
}

