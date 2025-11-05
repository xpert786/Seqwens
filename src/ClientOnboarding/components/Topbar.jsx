import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import logo from "../../assets/logo.png";
import { LogoIcon } from "./icons";
import image from "../../assets/image.png";
import NotificationPanel from "./Notifications/NotificationPanel";
import { profileAPI, userAPI } from "../utils/apiUtils";
import { clearUserData } from "../utils/userUtils";
import "../styles/Topbar.css";

export default function Topbar() {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const profileMenuRef = useRef(null);
    const profileButtonRef = useRef(null);
    const navigate = useNavigate();

    // Function to refresh profile picture (can be called from other components)
    const refreshProfilePicture = async () => {
        try {
            console.log('🔄 Refreshing topbar profile picture...');
            const response = await profileAPI.getProfilePicture();
            console.log('📋 Topbar refresh profile picture API response:', response);
            
            if (response.success && response.data) {
                if (response.data.has_profile_picture && response.data.profile_picture_url) {
                    console.log('🖼️ Topbar profile picture refreshed:', response.data.profile_picture_url);
                    setProfilePicture(response.data.profile_picture_url);
                } else {
                    console.log('❌ No profile picture found in topbar after refresh');
                    setProfilePicture(null);
                }
            }
        } catch (err) {
            console.error('💥 Error refreshing topbar profile picture:', err);
        }
    };

    // Expose refresh function to window for global access
    useEffect(() => {
        window.refreshTopbarProfilePicture = refreshProfilePicture;
        return () => {
            delete window.refreshTopbarProfilePicture;
        };
    }, []);

    // Fetch profile picture and user info on component mount
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                console.log('🔄 Starting to fetch topbar profile data...');
                
                // Fetch profile picture
                const profileResponse = await profileAPI.getProfilePicture();
                console.log('📋 Topbar profile picture API response:', profileResponse);
                
                if (profileResponse.success && profileResponse.data) {
                    if (profileResponse.data.has_profile_picture && profileResponse.data.profile_picture_url) {
                        console.log('🖼️ Topbar profile picture found:', profileResponse.data.profile_picture_url);
                        setProfilePicture(profileResponse.data.profile_picture_url);
                    } else {
                        console.log('❌ No profile picture found in topbar response');
                        setProfilePicture(null);
                    }
                }

                // Fetch user account info for name display
                const userResponse = await profileAPI.getUserAccount();
                console.log('📋 Topbar user account API response:', userResponse);
                
                if (userResponse.success && userResponse.data) {
                    console.log('✅ Topbar user info set');
                    setUserInfo(userResponse.data);
                }
            } catch (err) {
                console.error('💥 Error fetching topbar profile data:', err);
            } finally {
                setLoading(false);
                console.log('🏁 Finished fetching topbar profile data');
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
                        <LogoIcon />

                   
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
                                aria-label="User menu"
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
                                    <>
                                        {console.log('🖼️ Rendering topbar profile picture:', profilePicture)}
                                        <img 
                                            src={profilePicture} 
                                            alt="User" 
                                            className="rounded-circle"
                                            style={{ width: "32px", height: "32px", objectFit: "cover" }}
                                            onLoad={() => console.log('✅ Topbar profile picture loaded successfully')}
                                            onError={() => console.log('❌ Topbar profile picture failed to load')}
                                        />
                                    </>
                                ) : (
                                    <>
                                        {console.log('👤 Rendering topbar default avatar - no profile picture')}
                                        <div 
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ 
                                                width: "32px", 
                                                height: "32px", 
                                                backgroundColor: "#F56D2D",
                                                color: "white",
                                                fontSize: "14px",
                                                fontWeight: "600"
                                            }}
                                        >
                                            <i className="bi bi-person-fill"></i>
                                        </div>
                                    </>
                                )}
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
                <NotificationPanel onClose={() => setShowNotifications(false)} />
            )}
        </>
    );
}

