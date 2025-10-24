import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import logo from "../../assets/logo.png";
import { LogoIcon } from "./icons";
import image from "../../assets/image.png";
import NotificationPanel from "./Notifications/NotificationPanel";
import { profileAPI } from "../utils/apiUtils";
import "../styles/Topbar.css";

export default function Topbar() {
    const [showNotifications, setShowNotifications] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

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
                        <div
                            className="notification-bell"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <FaBell size={14} color="white" />
                        </div>

                        <div className="d-flex align-items-center gap-2 topbar-user cursor-pointer">
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
                            <FiChevronDown size={18} className="text-muted" />
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

