import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import logo from "../../assets/logo.png";
import { LogoIcond } from "../../Taxpreparer/component/icons";
import { UserIconBuild } from "./icons";

export default function SuperHeader({ onToggleSidebar, isSidebarOpen }) {
    const [showNotifications, setShowNotifications] = useState(false);

    return (
        <>
            <nav className="bg-white fixed top-0 left-0 right-0 border-b border-gray-200 h-[70px] z-[1030] px-0">
                <div className="flex justify-between items-center h-full px-4">
                    <div className="flex items-center gap-3 flex-grow">
                        <Link to="/superadmin" className="flex items-center m-0">
                            <img src={logo} alt="Logo" className="h-10 mr-[7px]" />
                        </Link>
                        <div
                            onClick={onToggleSidebar}
                            className="flex items-center justify-center cursor-pointer transition-transform duration-300"
                            style={{ transform: isSidebarOpen ? "rotate(0deg)" : "rotate(180deg)" }}
                        >
                            <LogoIcond />
                        </div>
                        <div className="flex items-center justify-between w-full h-full px-[14px] rounded-lg bg-white m-0 gap-5">
                            {/* Search */}
                            <div className="relative flex-1 max-w-[400px] xl:max-w-[500px] xl:ml-12 lg:max-w-[220px] lg:ml-2 2xl:max-w-[500px] 2xl:ml-12">
                                <i className="bi bi-search absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 text-base pointer-events-none"></i>
                                <input
                                    type="text"
                                    className="pl-[52px] rounded-md h-10 text-sm w-full border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Search..."
                                />
                            </div>

                            {/* Right side */}
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-[35px] h-[35px] rounded-md bg-[#F56D2D] flex items-center justify-center cursor-pointer"
                                    onClick={() => setShowNotifications(!showNotifications)}
                                >
                                    <FaBell size={14} color="white" />
                                </div>
                                <UserIconBuild />
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