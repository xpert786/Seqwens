import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { userAPI } from "../../ClientOnboarding/utils/apiUtils";
import { clearUserData } from "../../ClientOnboarding/utils/userUtils";
import { navigateToLogin } from "../../ClientOnboarding/utils/urlUtils";

import { UserManage, ClientIcon, DashIcon, MesIcon, AppointmentIcon, DocumentIcon, IntakeIcon, HelpsIcon, AccountIcon, LogOutIcon, AnalyticsIcon } from "./icons";

export default function FirmSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    dashboard: true,
    clientManagement: true,
    operations: true,
    businessOperations: true,
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
    `flex items-center justify-start px-3 py-2 rounded-lg my-1 text-sm font-medium transition-all duration-200 whitespace-nowrap text-left no-underline ${
      location.pathname === path 
        ? "bg-white text-gray-900" 
        : "text-white hover:bg-white/10 hover:text-white"
    }`;

  const iconWrapperClass = (path) =>
    `inline-flex items-center justify-center mr-3 w-6 h-6 ${
      location.pathname === path ? "bg-orange-500 p-1 rounded [&>svg]:!text-white" : "[&>svg]:!text-white"
    }`;

  const bottomLinkClass = (path) =>
    `flex items-center justify-start px-2 py-1 rounded-md text-xs font-medium text-black bg-transparent transition-all duration-200 hover:bg-gray-200 hover:text-black whitespace-nowrap text-left no-underline ${
      location.pathname === path ? "!bg-red-500 !text-white" : ""
    }`;

  return (
    <div className="firm-sidebar-container w-[265px] h-[calc(100vh-70px)] fixed top-[70px] left-0 z-[1000] font-['BasisGrotesquePro'] flex flex-col justify-between overflow-hidden xl:w-[285px] lg:w-60 md:w-60" style={{backgroundColor: '#32B582'}}>
      <div className="flex-1 pt-1 pb-1 overflow-y-auto overflow-x-hidden mr-1 ml-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-#3B4A66/10 [&::-webkit-scrollbar-thumb]:rounded">
        <ul className="flex flex-col px-4 py-4">
          {/* Dashboard Section */}
          <li className="mb-4">
            <div 
              className="flex justify-between items-center px-1 py-2 text-[12px] font-semibold text-white uppercase tracking-wider border-b border-white/20 m-0 mb-3 cursor-pointer transition-colors duration-200 hover:text-white/80 whitespace-nowrap"
              onClick={() => toggleSection('dashboard')}
            >
              <span className="text-left">Dashboard</span>
              <span className={`transition-transform duration-200 ${expandedSections.dashboard ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
            {expandedSections.dashboard && (
              <ul className="flex flex-col space-y-1">
                <li>
                  <Link to="/firmadmin/overview" className={linkClass("/firmadmin/overview")}>
                    <span className={iconWrapperClass("/firmadmin/overview")}>
                      <DashIcon />
                    </span>
                    Overview
                  </Link>
                </li>
                <li>
                  <Link to="/firmadmin/analytics" className={linkClass("/firmadmin/analytics")}>
                    <span className={iconWrapperClass("/firmadmin/analytics")}>
                      <AnalyticsIcon />
                    </span>
                    Analytics & Reports
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Client & Staff Management Section */}
          <li className="mb-4">
            <div 
              className="flex justify-between items-center px-1 py-2 text-[12px] font-semibold text-white uppercase tracking-wider border-b border-white/20 m-0 mb-3 cursor-pointer transition-colors duration-200 hover:text-white/80 whitespace-nowrap"
              onClick={() => toggleSection('clientManagement')}
            >
              <span className="text-left">Client & Staff Management</span>
              <span className={`transition-transform duration-200 ${expandedSections.clientManagement ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
            {expandedSections.clientManagement && (
              <ul className="flex flex-col space-y-1">
                <li>
                  <Link to="/firmadmin/clients" className={linkClass("/firmadmin/clients")}>
                    <span className={iconWrapperClass("/firmadmin/clients")}>
                      <ClientIcon />
                    </span>
                    Client Management
                  </Link>
                </li>
                <li>
                  <Link to="/firmadmin/staff" className={linkClass("/firmadmin/staff")}>
                    <span className={iconWrapperClass("/firmadmin/staff")}>
                      <UserManage />
                    </span>
                    Staff Management
                  </Link>
                </li>
                <li>
                  <Link to="/firmadmin/tasks" className={linkClass("/firmadmin/tasks")}>
                    <span className={iconWrapperClass("/firmadmin/tasks")}>
                      <DocumentIcon />
                    </span>
                    Task Management
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Operations Section */}
          <li className="mb-4">
            <div 
              className="flex justify-between items-center px-1 py-2 text-[12px] font-semibold text-white uppercase tracking-wider border-b border-white/20 m-0 mb-3 cursor-pointer transition-colors duration-200 hover:text-white/80 whitespace-nowrap"
              onClick={() => toggleSection('operations')}
            >
              <span className="text-left">Operations</span>
              <span className={`transition-transform duration-200 ${expandedSections.operations ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
            {expandedSections.operations && (
              <ul className="flex flex-col space-y-1">
                <li>
                  <Link to="/firmadmin/documents" className={linkClass("/firmadmin/documents")}>
                    <span className={iconWrapperClass("/firmadmin/documents")}>
                      <DocumentIcon />
                    </span>
                    Document Management
                  </Link>
                </li>
                <li>
                  <Link to="/firmadmin/esignature" className={linkClass("/firmadmin/esignature")}>
                    <span className={iconWrapperClass("/firmadmin/esignature")}>
                      <IntakeIcon />
                    </span>
                    E-Signatures
                  </Link>
                </li>
                <li>
                  <Link to="/firmadmin/messages" className={linkClass("/firmadmin/messages")}>
                    <span className={iconWrapperClass("/firmadmin/messages")}>
                      <MesIcon />
                    </span>
                    Messaging & Notifications
                  </Link>
                </li>
                <li>
                  <Link to="/firmadmin/appointments" className={linkClass("/firmadmin/appointments")}>
                    <span className={iconWrapperClass("/firmadmin/appointments")}>
                      <AppointmentIcon />
                    </span>
                    Scheduling & Calendar
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Business Operations Section */}
          <li className="mb-4">
            <div 
              className="flex justify-between items-center px-1 py-2 text-[12px] font-semibold text-white uppercase tracking-wider border-b border-white/20 m-0 mb-3 cursor-pointer transition-colors duration-200 hover:text-white/80 whitespace-nowrap"
              onClick={() => toggleSection('businessOperations')}
            >
              <span className="text-left">Business Operations</span>
              <span className={`transition-transform duration-200 ${expandedSections.businessOperations ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
            {expandedSections.businessOperations && (
              <ul className="flex flex-col space-y-1">
                <li>
                  <Link to="/firmadmin/billing" className={linkClass("/firmadmin/billing")}>
                    <span className={iconWrapperClass("/firmadmin/billing")}>
                      <IntakeIcon />
                    </span>
                    Billing & Payments
                  </Link>
                </li>
                <li>
                  <Link to="/firmadmin/workflow" className={linkClass("/firmadmin/workflow")}>
                    <span className={iconWrapperClass("/firmadmin/workflow")}>
                      <DocumentIcon />
                    </span>
                    Workflow Templates
                  </Link>
                </li>
                <li>
                  <Link to="/firmadmin/subscription" className={linkClass("/firmadmin/subscription")}>
                    <span className={iconWrapperClass("/firmadmin/subscription")}>
                      <ClientIcon />
                    </span>
                    Subscription Management
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* System & Security Section */}
          <li className="mb-4">
            <div 
              className="flex justify-between items-center px-1 py-2 text-[12px] font-semibold text-white uppercase tracking-wider border-b border-white/20 m-0 mb-3 cursor-pointer transition-colors duration-200 hover:text-white/80 whitespace-nowrap"
              onClick={() => toggleSection('systemAdministration')}
            >
              <span className="text-left">System & Security</span>
              <span className={`transition-transform duration-200 ${expandedSections.systemAdministration ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
            {expandedSections.systemAdministration && (
              <ul className="flex flex-col space-y-1">
                <li>
                  <Link to="/firmadmin/offices" className={linkClass("/firmadmin/offices")}>
                    <span className={iconWrapperClass("/firmadmin/offices")}>
                      <IntakeIcon />
                    </span>
                    Offices
                  </Link>
                </li>
                <li>
                  <Link to="/firmadmin/email-templates" className={linkClass("/firmadmin/email-templates")}>
                    <span className={iconWrapperClass("/firmadmin/email-templates")}>
                      <MesIcon />
                    </span>
                    Email Templates
                  </Link>
                </li>
                <li>
                  <Link to="/firmadmin/integrations" className={linkClass("/firmadmin/integrations")}>
                    <span className={iconWrapperClass("/firmadmin/integrations")}>
                      <DocumentIcon />
                    </span>
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link to="/firmadmin/security" className={linkClass("/firmadmin/security")}>
                    <span className={iconWrapperClass("/firmadmin/security")}>
                      <HelpsIcon />
                    </span>
                    Security & Compliance
                  </Link>
                </li>
                <li>
                  <Link to="/firmadmin/settings" className={linkClass("/firmadmin/settings")}>
                    <span className={iconWrapperClass("/firmadmin/settings")}>
                      <IntakeIcon />
                    </span>
                    Firm Settings & Branding
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </div>

      {/* Fixed Bottom Box */}
      <div className="px-4 py-4 border-t border-white/20">
        <div className="space-y-2">
          <Link to="/firmadmin/account-settings" className="flex items-center justify-start px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-all duration-200 whitespace-nowrap text-left no-underline">
            <span className="inline-flex items-center justify-center mr-3 w-6 h-6">
              <AccountIcon />
            </span>
            Account Settings
          </Link>
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center justify-start px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-white/10 hover:text-red-300 transition-all duration-200 whitespace-nowrap text-left no-underline w-full border-none cursor-pointer"
          >
            <span className="inline-flex items-center justify-center mr-3 w-6 h-6">
              <LogOutIcon />
            </span>
            {isLoggingOut ? 'Logging out...' : 'Log Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
