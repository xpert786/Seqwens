import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import logo from "../../assets/logo.png";
import image from "../../assets/image.png";
import { LogoIcon } from "../../ClientOnboarding/components/icons";
import "../styles/FirmHeader.css";

export default function FirmHeader({ onToggleSidebar, isSidebarOpen }) {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const searchRef = useRef(null);

    // Close search on Escape key or click outside
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && showSearch) {
                setShowSearch(false);
            }
        };

        const handleClickOutside = (e) => {
            if (showSearch && searchRef.current && !searchRef.current.contains(e.target)) {
                // Don't close if clicking on the search icon
                if (!e.target.closest('.d-md-none.d-flex.align-items-center.justify-content-center')) {
                    setShowSearch(false);
                }
            }
        };

        if (showSearch) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSearch]);

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
                            className="firm-notification-bell d-flex align-items-center justify-content-center"
                            onClick={() => setShowNotifications(!showNotifications)}
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
                        </div>

                        {/* User Profile */}
                        <div
                            className="d-flex align-items-center gap-1 gap-md-2 firm-topbar-user cursor-pointer"
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
                            <FiChevronDown size={18} className="text-muted d-none d-sm-block" />
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
            {/* Static notification panel placeholder */}
        </>
    );
}
