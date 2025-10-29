import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { userAPI } from "../../ClientOnboarding/utils/apiUtils";
import { clearUserData } from "../../ClientOnboarding/utils/userUtils";
import { navigateToLogin } from "../../ClientOnboarding/utils/urlUtils";
import { 
  DashIconed, 
  AnalyticsIconed, 
  ClientManagae, 
  StaffManagementIcon, 
  TaskManagementIcon,
  DocumentManage,
  Esign,
  Msg,
  Schedule,
  Billing,
  Workflow,
  Subscription,
  Offices,
  Email,
  Integrations,
  Security,
  Firm,
  Settings,
  Out
} from "./icons";

import { UserManage, ClientIcon, DashIcon, MesIcon, AppointmentIcon, DocumentIcon, IntakeIcon, HelpsIcon, AccountIcon, LogOutIcon, AnalyticsIcon } from "./icons";

export default function FirmSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    dashboard: true,
    clientStaff: true,
    clientManagement: true,
    operations: true,
    businessOperations: true,
    systemSecurity: true
  });

  // Calculate if any sections are expanded
  const hasExpandedSections = Object.values(expandedSections).some(expanded => expanded);
  
  // Dynamic width based on expanded state
  const sidebarWidth = hasExpandedSections ? '320px' : '280px';

  const toggleSection = (section) => {
    setExpandedSections(prev => {
      const newState = {
        ...prev,
        [section]: !prev[section]
      };
      
      // Calculate new width and dispatch event
      const hasExpanded = Object.values(newState).some(expanded => expanded);
      const newWidth = hasExpanded ? '320px' : '280px';
      
      // Dispatch custom event for layout to listen
      window.dispatchEvent(new CustomEvent('sidebarWidthChange', {
        detail: { width: newWidth }
      }));
      
      return newState;
    });
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    
    try {
      await userAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearUserData();
      navigateToLogin(navigate);
      setIsLoggingOut(false);
    }
  };

  const linkClass = (path) =>
    `flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap text-left no-underline ${
      location.pathname === path 
        ? "bg-white text-black rounded-lg" 
        : "text-white hover:bg-white/10 hover:text-white rounded-lg"
    }`;

  const iconWrapperClass = (path) =>
    `inline-flex items-center justify-center mr-3 w-5 h-5 ${
      location.pathname === path ? "bg-orange-500 p-1 rounded [&>svg]:!text-white" : "[&>svg]:!text-white"
    }`;

  return (
    <div 
      className="h-[calc(100vh-70px)] fixed top-[70px] left-0 z-[1000] transition-all duration-300"
      style={{ backgroundColor: '#32B582', width: sidebarWidth }}
    >
        <div 
          className="h-full overflow-y-auto" 
          style={{ 
            width: sidebarWidth, 
            scrollbarWidth: 'thin',
            scrollbarColor: '#ffffff #32B582',
            marginRight: '0',
            paddingRight: '0',
            position: 'relative',
            boxSizing: 'border-box'
          }}
        >
        <div className="px-4 py-4 space-y-6">
          
          {/* Dashboard Section */}
          <div>
            <div 
              className="flex justify-between items-center px-1 py-2 text-xs font-semibold text-white tracking-wider mb-3 cursor-pointer hover:text-white/80"
              onClick={() => toggleSection('dashboard')}
            >
              <span>Dashboard</span>
              <svg className={`w-4 h-4 transition-transform duration-200 ${expandedSections.dashboard ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            {expandedSections.dashboard && (
              <div className="space-y-1" style={{ borderBottom: '0.6px solid #FFFFFF80', paddingBottom: '16px' }}>
                <Link to="/firmadmin" className={linkClass("/firmadmin")}>
                  <span className={iconWrapperClass("/firmadmin")}>
                    <DashIconed />
                  </span>
                  Overview
                </Link>
                <Link to="/firmadmin/analytics" className={linkClass("/firmadmin/analytics")}>
                  <span className={iconWrapperClass("/firmadmin/analytics")}>
                    <AnalyticsIconed />
                  </span>
                  Analytics & Reports
                </Link>
              </div>
            )}
            {/* {expandedSections.dashboard && (
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
            )} */}
          </div>

          {/* Client & Staff Management Section */}
          <div>
            <div 
              className="flex justify-between items-center px-1 py-2 text-xs font-semibold text-white tracking-wider mb-3 cursor-pointer hover:text-white/80"
              onClick={() => toggleSection('clientStaff')}
            >
              <span>Client & Staff Management</span>
              <svg className={`w-4 h-4 transition-transform duration-200 ${expandedSections.clientStaff ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            {expandedSections.clientStaff && (
              <div className="space-y-1" style={{ borderBottom: '0.6px solid #FFFFFF80', paddingBottom: '16px' }}>
                <Link to="/firmadmin/clients" className={linkClass("/firmadmin/clients")}>
                  <span className={iconWrapperClass("/firmadmin/clients")}>
                    <ClientManagae />
                  </span>
                  Client Management
                </Link>
                <Link to="/firmadmin/staff" className={linkClass("/firmadmin/staff")}>
                  <span className={iconWrapperClass("/firmadmin/staff")}>
                    <StaffManagementIcon />
                  </span>
                  Staff Management
                </Link>
                <Link to="/firmadmin/tasks" className={linkClass("/firmadmin/tasks")}>
                  <span className={iconWrapperClass("/firmadmin/tasks")}>
                    <TaskManagementIcon />
                  </span>
                  Task Management
                </Link>
              </div>
            )}
          </div>

          {/* Operations Section */}
          <div>
            <div 
              className="flex justify-between items-center px-1 py-2 text-xs font-semibold text-white tracking-wider mb-3 cursor-pointer hover:text-white/80"
              onClick={() => toggleSection('operations')}
            >
              <span>Operations</span>
              <svg className={`w-4 h-4 transition-transform duration-200 ${expandedSections.operations ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            {expandedSections.operations && (
              <div className="space-y-1" style={{ borderBottom: '0.6px solid #FFFFFF80', paddingBottom: '16px' }}>
                <Link to="/firmadmin/documents" className={linkClass("/firmadmin/documents")}>
                  <span className={iconWrapperClass("/firmadmin/documents")}>
                    <DocumentManage />
                  </span>
                  Document Management
                </Link>
                <Link to="/firmadmin/esignature" className={linkClass("/firmadmin/esignature")}>
                  <span className={iconWrapperClass("/firmadmin/esignature")}>
                    <Esign />
                  </span>
                  E-Signatures
                </Link>
                <Link to="/firmadmin/messages" className={linkClass("/firmadmin/messages")}>
                  <span className={iconWrapperClass("/firmadmin/messages")}>
                    <Msg />
                  </span>
                  Messaging & Notifications
                </Link>
                <Link to="/firmadmin/appointments" className={linkClass("/firmadmin/appointments")}>
                  <span className={iconWrapperClass("/firmadmin/appointments")}>
                    <Schedule />
                  </span>
                  Scheduling & Calendar
                </Link>
              </div>
            )}
          </div>

          {/* Business Operations Section */}
          <div>
            <div 
              className="flex justify-between items-center px-1 py-2 text-xs font-semibold text-white tracking-wider mb-3 cursor-pointer hover:text-white/80"
              onClick={() => toggleSection('businessOperations')}
            >
              <span>Business Operations</span>
              <svg className={`w-4 h-4 transition-transform duration-200 ${expandedSections.businessOperations ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            {expandedSections.businessOperations && (
              <div className="space-y-1" style={{ borderBottom: '0.6px solid #FFFFFF80', paddingBottom: '16px' }}>
                <Link to="/firmadmin/billing" className={linkClass("/firmadmin/billing")}>
                  <span className={iconWrapperClass("/firmadmin/billing")}>
                    <Billing />
                  </span>
                  Billing & Payments
                </Link>
                <Link to="/firmadmin/workflow" className={linkClass("/firmadmin/workflow")}>
                  <span className={iconWrapperClass("/firmadmin/workflow")}>
                    <Workflow />
                  </span>
                  Workflow Templates
                </Link>
                <Link to="/firmadmin/subscription" className={linkClass("/firmadmin/subscription")}>
                  <span className={iconWrapperClass("/firmadmin/subscription")}>
                    <Subscription />
                  </span>
                  Subscription Management
                </Link>
              </div>
            )}
          </div>

          {/* System & Security Section */}
          <div>
            <div 
              className="flex justify-between items-center px-1 py-2 text-xs font-semibold text-white tracking-wider mb-3 cursor-pointer hover:text-white/80"
              onClick={() => toggleSection('systemSecurity')}
            >
              <span>System & Security</span>
              <svg className={`w-4 h-4 transition-transform duration-200 ${expandedSections.systemSecurity ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            {expandedSections.systemSecurity && (
              <div className="space-y-1" style={{ borderBottom: '0.6px solid #FFFFFF80', paddingBottom: '16px' }}>
                <Link to="/firmadmin/offices" className={linkClass("/firmadmin/offices")}>
                  <span className={iconWrapperClass("/firmadmin/offices")}>
                    <Offices />
                  </span>
                  Offices
                </Link>
                <Link to="/firmadmin/email-templates" className={linkClass("/firmadmin/email-templates")}>
                  <span className={iconWrapperClass("/firmadmin/email-templates")}>
                    <Email />
                  </span>
                  Email Templates
                </Link>
                <Link to="/firmadmin/integrations" className={linkClass("/firmadmin/integrations")}>
                  <span className={iconWrapperClass("/firmadmin/integrations")}>
                    <Integrations />
                  </span>
                  Integrations
                </Link>
                <Link to="/firmadmin/security" className={linkClass("/firmadmin/security")}>
                  <span className={iconWrapperClass("/firmadmin/security")}>
                    <Security />
                  </span>
                  Security & Compliance
                </Link>
                <Link to="/firmadmin/settings" className={linkClass("/firmadmin/settings")}>
                  <span className={iconWrapperClass("/firmadmin/settings")}>
                    <Firm />
                  </span>
                  Firm Settings & Branding
                </Link>
              </div>
            )}
          </div>

          {/* Bottom Section - Account Settings & Log Out */}
          <div className="bg-white mx-2 mb-4 rounded-lg" style={{ width: 'calc(100% - 16px)' }}>
            <div className="px-4 py-4 space-y-2">
              <Link to="/firmadmin/account-settings" className="flex items-center px-2 py-1 text-sm font-medium text-gray-900 hover:bg-[#ffebd6] rounded transition-all duration-200">
                <span className="w-5 h-5 mr-3 text-gray-600">
                  <Settings />
                </span>
                Account Settings
              </Link>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center px-2 py-1 text-sm font-medium text-red-500 hover:bg-[#ffebd6] rounded transition-all duration-200 w-full text-left"
              >
                <span className="w-5 h-5 mr-3 text-red-500">
                  <Out />
                </span>
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
