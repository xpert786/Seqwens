import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import logo from "../../assets/logo.png";
import image from "../../assets/image.png";
import { LogoIcon } from "../../ClientOnboarding/components/icons";
import "../styles/FirmHeader.css";

export default function FirmHeader({ onToggleSidebar, isSidebarOpen }) {
    const [showNotifications, setShowNotifications] = useState(false);

    return (
        <>
            <nav className="navbar bg-white fixed-top border-bottom firm-custom-topbar px-3">
                <div className="container-fluid d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                        <Link to="/firmadmin" className="navbar-brand d-flex align-items-center m-0">
                            <img src={logo} alt="Logo" className="firm-topbar-logo" />
                        </Link>
                        <div 
                            onClick={onToggleSidebar}
                            style={{ 
                                cursor: 'pointer', 
                                transition: 'transform 0.3s ease',
                                transform: isSidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)'
                            }}
                        >
                            <LogoIcon />
                        </div>
                        <div className="firm-topbar-search">
                            <i className="bi bi-search"></i>
                            <input type="text" className="form-control" placeholder="Search..." />
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <div
                            className="firm-notification-bell"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <FaBell size={14} color="white" />
                        </div>

                        <div className="d-flex align-items-center gap-2 firm-topbar-user cursor-pointer">
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
                            <FiChevronDown size={18} className="text-muted" />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Static notification panel placeholder */}
        </>
    );
}
