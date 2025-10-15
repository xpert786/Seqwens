import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import logo from "../../assets/logo.png"
import { LogoIcond } from "./icons"
import image from "../../assets/image.png";
import "../styles/topbar.css";

export default function Topbar() {
    const [showNotifications, setShowNotifications] = useState(false);
    return (
        <>
            <nav className="navbar bg-white fixed-top border-bottom custom-topbar px-0">
                <div className="container-fluid d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                        <Link to="/" className="navbar-brand d-flex align-items-center m-0">
                            <img src={logo} alt="Logo" className="topbar-logo" />
                        </Link>
                        <LogoIcond />
                       <div className="sd">
  {/* Search */}
  <div className="topbar-search">
    <i className="bi bi-search"></i>
    <input type="text" className="form-control" placeholder="Search..." />
  </div>

  {/* Right side */}
  <div className="d-flex align-items-center gap-3">
    <div
      className="notification-belled"
      onClick={() => setShowNotifications(!showNotifications)}
    >
      <FaBell size={14} color="white" />
    </div>
    <div className="d-flex align-items-center gap-2 topbar-user cursor-pointer">
      <img src={image} alt="User" />
      <FiChevronDown size={18} className="text-muted" />
    </div>
  </div>
</div>


                    </div>
                    
                </div>
            </nav>

            {/* Notification Panel */}
            {/* {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
            )} */}
        </>
    );
}

