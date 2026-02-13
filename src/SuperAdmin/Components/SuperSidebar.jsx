import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { userAPI } from "../../ClientOnboarding/utils/apiUtils";
import { clearUserData, getStorage } from "../../ClientOnboarding/utils/userUtils";
import { navigateToLogin } from "../../ClientOnboarding/utils/urlUtils";

import { UserManage, SubscriptionIcon, DashIcon, MesIcon, IntakeIcon, HelpsIcon, AccountIcon, LogOutIcon } from "./icons";

export default function SuperSidebar({ isSidebarOpen = true }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userType, setUserType] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    platformManagement: true,
    systemAdministration: true
  });

  // Get user type on component mount
  useEffect(() => {
    const storage = getStorage();
    const type = storage?.getItem("userType");
    setUserType(type);
  }, []);

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

  const isActivePath = (path, matchChildren = false) => {
    // If matchChildren is true, use simple matching
    if (matchChildren) {
      return location.pathname === path || location.pathname.startsWith(`${path}/`);
    }

    // Special handling for specific paths
    if (path === '/superadmin') {
      return location.pathname === '/superadmin' || location.pathname === '/superadmin/';
    }
    if (path === '/superadmin/users') {
      return (
        location.pathname === '/superadmin/users' ||
        location.pathname.startsWith('/superadmin/users/') ||
        location.pathname.startsWith('/superadmin/users-details/')
      );
    }

    // Default matching
    if (location.pathname === path) return true;
    return location.pathname.startsWith(`${path}/`);
  };

  const linkClass = (path, matchChildren = false) =>
    `flex items-center justify-start px-0.5 py-1.5 rounded-lg my-0 text-xs font-medium transition-all duration-200 whitespace-nowrap text-left no-underline ${isActivePath(path, matchChildren)
      ? "bg-[var(--sa-bg-active)] !text-[var(--sa-text-primary)]"
      : "!text-[var(--sa-text-secondary)] hover:bg-[var(--sa-bg-active)] hover:!text-[var(--sa-text-primary)]"
    }`;

  const iconWrapperClass = (path, matchChildren = false) =>
    `inline-flex items-center justify-center mr-3 w-6 h-6 rounded-full ${isActivePath(path, matchChildren) ? "bg-[#3AD6F2] p-1 [&>svg]:!text-white [&>svg]:!fill-[#3AD6F2]" : ""
    }`;

  const bottomLinkClass = (path) =>
    `flex items-center justify-start px-2 py-1 rounded-md text-xs font-medium text-black bg-transparent transition-all duration-200 hover:bg-gray-200 hover:text-black whitespace-nowrap text-left no-underline ${location.pathname === path ? "!bg-red-500 !text-white" : ""
    }`;

  return (
    <div
      className={`super-sidebar-container w-[265px] h-[calc(100vh-70px)] fixed top-[70px] left-0 z-[1000] font-['BasisGrotesquePro'] flex flex-col justify-between overflow-hidden xl:w-[285px] lg:w-60 md:w-60 transition-transform duration-300`}
      style={{
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        backgroundColor: 'var(--sa-bg-sidebar)',
        borderRight: '1px solid var(--sa-border-color)'
      }}
      aria-hidden={!isSidebarOpen}
    >
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
                {/* Platform Overview - Only for super_admin */}
                {userType === 'super_admin' && (
                  <li className="mb-2 text-[13px]">
                    <Link to="/superadmin" className={linkClass("/superadmin")}>
                      <span className={iconWrapperClass("/superadmin")}>
                        <DashIcon />
                      </span>
                      Platform Overview
                    </Link>
                  </li>
                )}
                {/* User Management - Only for super_admin */}
                {userType === 'super_admin' && (
                  <li className="mb-2">
                    <Link to="/superadmin/users" className={linkClass("/superadmin/users", true)}>
                      <span className={iconWrapperClass("/superadmin/users", true)}>
                        <UserManage />
                      </span>
                      User Management
                    </Link>
                  </li>
                )}
                {/* Global User Lookup - Super Admin & Support Admin */}
                {(userType === 'super_admin' || userType === 'support_admin') && (
                  <li className="mb-2">
                    <Link to="/superadmin/user-lookup" className={linkClass("/superadmin/user-lookup")}>
                      <span className={iconWrapperClass("/superadmin/user-lookup")}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      User Lookup
                    </Link>
                  </li>
                )}
                {/* Subscriptions - Only for super_admin and billing_admin */}
                {(userType === 'super_admin' || userType === 'billing_admin') && (
                  <li className="mb-2">
                    <Link to="/superadmin/subscriptions" className={linkClass("/superadmin/subscriptions")}>
                      <span className={iconWrapperClass("/superadmin/subscriptions")}>
                        <SubscriptionIcon />
                      </span>
                      Subscriptions
                    </Link>
                  </li>
                )}
                {/* Analytics - Only for super_admin */}
                {userType === 'super_admin' && (
                  <li className="mb-2">
                    <Link to="/superadmin/analytics" className={linkClass("/superadmin/analytics")}>
                      <span className={iconWrapperClass("/superadmin/analytics")}>
                        <MesIcon />
                      </span>
                      Analytics
                    </Link>
                  </li>
                )}
                {/* Firm Management - Only for super_admin */}
                {userType === 'super_admin' && (
                  <li className="mb-2">
                    <Link to="/superadmin/firms" className={linkClass("/superadmin/firms", true)}>
                      <span className={iconWrapperClass("/superadmin/firms", true)}>
                        <UserManage />
                      </span>
                      Firm Management
                    </Link>
                  </li>
                )}
                {/* Role Requests - Only for super_admin */}
                {/* {userType === 'super_admin' && (
                  <li className="mb-2">
                    <Link to="/superadmin/role-requests" className={linkClass("/superadmin/role-requests")}>
                      <span className={iconWrapperClass("/superadmin/role-requests")}>
                        <UserManage />
                      </span>
                      Role Requests
                    </Link>
                  </li>
                )} */}
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
                {/* System Settings - Only for super_admin */}
                {userType === 'super_admin' && (
                  <li className="mb-2">
                    <Link to="/superadmin/system-settings" className={linkClass("/superadmin/system-settings")}>
                      <span className={iconWrapperClass("/superadmin/system-settings")}>
                        <IntakeIcon />
                      </span>
                      System Settings
                    </Link>
                  </li>
                )}
                {/* Support Center - Only for super_admin and support_admin */}
                {(userType === 'super_admin' || userType === 'support_admin') && (
                  <li className="mb-2">
                    <Link to="/superadmin/support" className={linkClass("/superadmin/support")}>
                      <span className={iconWrapperClass("/superadmin/support")}>
                        <HelpsIcon />
                      </span>
                      Support Center
                    </Link>
                  </li>
                )}
                {/* Blocked Accounts - Only for super_admin */}
                {userType === 'super_admin' && (
                  <li className="mb-2">
                    <Link to="/superadmin/blocked-accounts" className={linkClass("/superadmin/blocked-accounts")}>
                      <span className={iconWrapperClass("/superadmin/blocked-accounts")}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.00065 1.32812L2.66602 4.32812V7.66146C2.66602 10.3281 4.66602 12.6615 8.00065 13.9948C11.3353 12.6615 13.3353 10.3281 13.3353 7.66146V4.32812L8.00065 1.32812Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M6.00065 8.66146L7.33398 9.99479L10.0007 6.66146" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      Blocked Accounts
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </li>
        </ul>
      </div>

      {/* Fixed Bottom Box */}
      <div
        className="mx-2 my-3 mb-2 p-4 rounded-lg flex flex-col gap-2 shrink-0"
        style={{ backgroundColor: 'var(--sa-bg-active)' }}
      >
        {/* <Link to="/superadmin/admin-settings" className={bottomLinkClass("/superadmin/admin-settings")}>
          <span className="inline-flex items-center justify-center mr-2 w-6 h-6">
            <AccountIcon />
          </span>
          Account Settings
        </Link> */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center justify-start px-2 py-1 rounded-md text-[10px] font-medium !text-[#EF4444] bg-transparent whitespace-nowrap text-left no-underline w-full border-none cursor-pointer no-hover-logout"
          style={{ color: '#EF4444' }}
        >
          <span className="inline-flex items-center justify-center mr-2 w-6 h-6" style={{ color: '#EF4444' }}>
            <LogOutIcon />
          </span>
          {isLoggingOut ? 'Logging out...' : 'Log Out'}
        </button>
      </div>
    </div>
  );
}