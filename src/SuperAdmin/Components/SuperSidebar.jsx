import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { userAPI } from "../../ClientOnboarding/utils/apiUtils";
import { clearUserData } from "../../ClientOnboarding/utils/userUtils";
import { navigateToLogin } from "../../ClientOnboarding/utils/urlUtils";

import { UserManage, SubscriptionIcon, DashIcon, MesIcon, IntakeIcon, HelpsIcon, AccountIcon, LogOutIcon } from "./icons";

export default function SuperSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    platformManagement: true,
    systemAdministration: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    setIsLoggingOut(true);
    
    try {
      // Call logout API
      await userAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with logout even if API fails
    } finally {
      // Clear local data regardless of API response
      clearUserData();
      
      // Navigate to login page using conditional URL
      navigateToLogin(navigate);
      
      setIsLoggingOut(false);
    }
  };

  const linkClass = (path) =>
    `flex items-center justify-start px-0.5 py-1.5 rounded-lg my-0 text-xs font-medium transition-all duration-200 whitespace-nowrap text-left no-underline ${
      location.pathname === path 
        ? "bg-[#F6F7FF] !text-[#3B4A66]" 
        : "!text-[#3B4A66] hover:bg-slate-50 hover:!text-[#3B4A66]"
    }`;

  const iconWrapperClass = (path) =>
    `inline-flex items-center justify-center mr-3 w-6 h-6 rounded-full ${
      location.pathname === path ? "bg-[#3AD6F2] p-1 [&>svg]:!text-white [&>svg]:!fill-[#3AD6F2]" : ""
    }`;

  const bottomLinkClass = (path) =>
    `flex items-center justify-start px-2 py-1 rounded-md text-xs font-medium text-black bg-transparent transition-all duration-200 hover:bg-gray-200 hover:text-black whitespace-nowrap text-left no-underline ${
      location.pathname === path ? "!bg-red-500 !text-white" : ""
    }`;

  return (
    <div className="super-sidebar-container w-[265px] h-[calc(100vh-70px)] fixed top-[70px] left-0 bg-white border-r border-gray-200 z-[1000] font-['BasisGrotesquePro'] flex flex-col justify-between overflow-hidden xl:w-[285px] lg:w-60 md:w-60">
      <div className="flex-1 pt-1 pb-1 overflow-y-auto overflow-x-hidden mr-1 ml-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-#3B4A66/10 [&::-webkit-scrollbar-thumb]:rounded">
        <ul className="flex flex-col">
          {/* Platform Management Section */}
          <li className="mb-3">
            <div 
              className="flex justify-between items-center px-1 py-1 text-[12px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 m-0 mb-2 cursor-pointer transition-colors duration-200 hover:text-gray-700 whitespace-nowrap"
              onClick={() => toggleSection('platformManagement')}
            >
              <span className="text-left">Platform Management</span>
              <span className={`transition-transform duration-200 ${expandedSections.platformManagement ? '' : ''}`}>
                <span className={`inline-block ${expandedSections.platformManagement ? 'border-t-[4px] border-t-gray-400 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent mr-1' : 'border-l-[4px] border-l-gray-400 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent mr-1'}`}></span>
              </span>
            </div>
            {expandedSections.platformManagement && (
              <ul className="flex flex-col px-0 mt-2">
                <li className="mb-2 text-[13px]">
                  <Link  to="/superadmin" className={linkClass("/superadmin")}>
                    <span className={iconWrapperClass("/superadmin")}>
                      <DashIcon />
                    </span>
                    Platform Overview
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/superadmin/users" className={linkClass("/superadmin/users")}>
                    <span className={iconWrapperClass("/superadmin/users")}>
                      <UserManage />
                    </span>
                    User Management  
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/superadmin/subscriptions" className={linkClass("/superadmin/subscriptions")}>
                    <span className={iconWrapperClass("/superadmin/subscriptions")}>
                      <SubscriptionIcon />
                    </span>
                    Subscriptions
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/superadmin/analytics" className={linkClass("/superadmin/analytics")}>
                    <span className={iconWrapperClass("/superadmin/analytics")}>
                      <MesIcon />
                    </span>
                    Analytics
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* System Administration Section */}
          <li className="mb-3">
            <div 
              className="flex justify-between items-center px-1 py-3 text-[13px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 m-0 mb-2 cursor-pointer transition-colors duration-200 hover:text-gray-700 whitespace-nowrap"
              onClick={() => toggleSection('systemAdministration')}
            >
              <span className="text-left">System Administration</span>
              <span className={`transition-transform duration-200 ${expandedSections.systemAdministration ? '' : ''}`}>
                <span className={`inline-block ${expandedSections.systemAdministration ? 'border-t-[4px] border-t-gray-400 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent mr-1' : 'border-l-[4px] border-l-gray-400 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent mr-1'}`}></span>
              </span>
            </div>
            {expandedSections.systemAdministration && (
              <ul className="flex flex-col px-0 mt-2">
                <li className="mb-2">
                  <Link to="/superadmin/settings" className={linkClass("/superadmin/settings")}>
                    <span className={iconWrapperClass("/superadmin/settings")}>
                      <IntakeIcon />
                    </span>
                    System Settings
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/superadmin/support" className={linkClass("/superadmin/support")}>
                    <span className={iconWrapperClass("/superadmin/support")}>
                      <HelpsIcon />
                    </span>
                    Support Center
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </div>

      {/* Fixed Bottom Box */}
      <div className="bg-[#F6F7FF] mx-2 my-3 mb-2 p-4 rounded-lg flex flex-col gap-2 shrink-0 ">
        <Link to="/superadmin/admin-settings" className={bottomLinkClass("/superadmin/admin-settings")}>
          <span className="inline-flex items-center justify-center mr-2 w-6 h-6">
            <AccountIcon />
          </span>
          Account Settings
        </Link>
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center justify-start px-2 py-1 rounded-md text-[10px] font-medium !text-[#EF4444] bg-transparent transition-all duration-200 hover:bg-gray-200 hover:!text-[#EF4444] whitespace-nowrap text-left no-underline w-full border-none cursor-pointer"
        >
          <span className="inline-flex items-center justify-center mr-2 w-6 h-6" style={{color: '#EF4444'}}>
            <LogOutIcon />
          </span>
          {isLoggingOut ? 'Logging out...' : 'Log Out'}
        </button>
      </div>
    </div>
  );
}