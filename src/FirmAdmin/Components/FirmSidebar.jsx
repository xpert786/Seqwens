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
  Msg,
  Schedule,
  Billing,
  Offices,
  Settings,
  Out,
  ToggleArrow,
  ESignatureIcon,
  WorkflowIconSidebar,
  SubscriptionIconSidebar,
  EmailTemplatesIconSidebarListItem,
  SecurityIconSidebarListItem,
  SettingsBrandingIconSidebarListItem,
  CustomRolesIconSidebarListItem
} from "./icons";

export default function FirmSidebar({ isSidebarOpen = true, isImpersonating = false, onNavItemClick }) {
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

  // Dynamic width based on expanded state - matching TaxPreparer panel
  const sidebarWidth = hasExpandedSections ? '280px' : '240px';

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Dispatch event whenever sidebarWidth changes
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('sidebarWidthChange', {
      detail: { width: sidebarWidth }
    }));
  }, [sidebarWidth]);

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

  const isActive = (path) => {
    const currentPath = location.pathname;
    // For exact matches (like dashboard)
    if (path === "/firmadmin") {
      return currentPath === path || currentPath === "/firmadmin/";
    }
    // For nested routes, check if current path starts with the route path
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  const linkClass = (path) => {
    const active = isActive(path);
    const isExactMatch = location.pathname === path || location.pathname === path + "/";
    return `flex items-center gap-2 px-3 py-2 text-[12px] font-medium whitespace-nowrap text-left no-underline group ${active
      ? `bg-white/20 text-white rounded-lg font-medium ${isExactMatch ? "pointer-events-none" : ""}`
      : "text-white rounded-lg transition-all duration-200"
      }`;
  };

  const iconWrapperClass = (path) =>
    ``;

  return (
    <div
      className={`firm-sidebar fixed left-0 z-[1000] transition-all duration-300 bg-[var(--firm-primary-color,#32B582)] ${isSidebarOpen ? 'translate-x-0 visible' : '-translate-x-full invisible'
        } ${sidebarWidth === '280px' ? 'w-[280px]' : 'w-[240px]'
        }`}
    >
      <div
        className={`h-full overflow-y-auto relative box-border [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.5)_transparent] ${sidebarWidth === '280px' ? 'w-[280px]' : 'w-[240px]'
          }`}
      >
        <div className="px-4 py-4 space-y-6">
          {/* Dashboard Section */}
          <div>
            <div
              className="flex justify-between items-center px-1 py-2 text-sm font-semibold text-white tracking-wider cursor-pointer"
              onClick={() => toggleSection('dashboard')}
            >
              <span>Dashboard</span>
              <ToggleArrow isOpen={expandedSections.dashboard} />
            </div>
            {expandedSections.dashboard && (
              <div className="space-y-1 border-b-[0.6px] border-white/50 pb-4">
                <Link to="/firmadmin" className={linkClass("/firmadmin")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin")}>
                    <DashIconed />
                  </span>
                  <span className="text-left">Overview</span>
                </Link>
                <Link to="/firmadmin/analytics" className={linkClass("/firmadmin/analytics")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/analytics")}>
                    <AnalyticsIconed />
                  </span>
                  <span className="text-left">Analytics & Reports</span>
                </Link>
              </div>
            )}
          </div>

          {/* Client & Staff Management Section */}
          <div>
            <div
              className="flex justify-between items-center px-1 py-2 text-sm font-semibold text-white tracking-wider cursor-pointer"
              onClick={() => toggleSection('clientStaff')}
            >
              <span>Client & Staff Management</span>
              <ToggleArrow isOpen={expandedSections.clientStaff} />
            </div>
            {expandedSections.clientStaff && (
              <div className="space-y-1 border-b-[0.6px] border-white/50 pb-4">
                <Link to="/firmadmin/clients" className={linkClass("/firmadmin/clients")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/clients")}>
                    <ClientManagae />
                  </span>
                  <span className="text-left">Client Management</span>
                </Link>
                <Link to="/firmadmin/staff" className={linkClass("/firmadmin/staff")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/staff")}>
                    <StaffManagementIcon />
                  </span>
                  <span className="text-left">Staff Management</span>
                </Link>
                <Link to="/firmadmin/tasks" className={linkClass("/firmadmin/tasks")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/tasks")}>
                    <TaskManagementIcon />
                  </span>
                  <span className="text-left">Task Management</span>
                </Link>
              </div>
            )}
          </div>

          {/* Operations Section */}
          <div>
            <div
              className="flex justify-between items-center px-1 py-2 text-sm font-semibold text-white tracking-wider cursor-pointer"
              onClick={() => toggleSection('operations')}
            >
              <span>Operations</span>
              <ToggleArrow isOpen={expandedSections.operations} />
            </div>
            {expandedSections.operations && (
              <div className="space-y-1 border-b-[0.6px] border-white/50 pb-4">
                <Link to="/firmadmin/documents" className={linkClass("/firmadmin/documents")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/documents")}>
                    <DocumentManage />
                  </span>
                  Document Management
                </Link>
                <Link to="/firmadmin/esignature" className={linkClass("/firmadmin/esignature")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/esignature")}>
                    <ESignatureIcon />
                  </span>
                  <span className="text-left">E-Signatures</span>
                </Link>
                <Link to="/firmadmin/messages" className={linkClass("/firmadmin/messages")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/messages")}>
                    <Msg />
                  </span>
                  Messaging & Notifications
                </Link>
                <Link to="/firmadmin/calendar" className={linkClass("/firmadmin/calendar")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/calendar")}>
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
              className="flex justify-between items-center px-1 py-2 text-sm font-semibold text-white tracking-wider cursor-pointer"
              onClick={() => toggleSection('businessOperations')}
            >
              <span>Business Operations</span>
              <ToggleArrow isOpen={expandedSections.businessOperations} />
            </div>
            {expandedSections.businessOperations && (
              <div className="space-y-1 border-b-[0.6px] border-white/50 pb-4">
                <Link to="/firmadmin/billing" className={linkClass("/firmadmin/billing")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/billing")}>
                    <Billing />
                  </span>
                  Billing & Payments
                </Link>
                <Link to="/firmadmin/workflow" className={linkClass("/firmadmin/workflow")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/workflow")}>
                    <WorkflowIconSidebar />
                  </span>
                  Workflow Templates
                </Link>
                <Link to="/firmadmin/subscription" className={linkClass("/firmadmin/subscription")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/subscription")}>
                    <SubscriptionIconSidebar />
                  </span>
                  Subscription Management
                </Link>
              </div>
            )}
          </div>

          {/* System & Security Section */}
          <div>
            <div
              className="flex justify-between items-center px-1 py-2 text-sm font-semibold text-white tracking-wider cursor-pointer"
              onClick={() => toggleSection('systemSecurity')}
            >
              <span>System & Security</span>
              <ToggleArrow isOpen={expandedSections.systemSecurity} />
            </div>
            {expandedSections.systemSecurity && (
              <div className="space-y-1 border-b-[0.6px] border-white/50 pb-4">
                <Link to="/firmadmin/offices" className={linkClass("/firmadmin/offices")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/offices")}>
                    <Offices />
                  </span>
                  Offices
                </Link>
                <Link to="/firmadmin/email-templates" className={linkClass("/firmadmin/email-templates")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/email-templates")}>
                    <EmailTemplatesIconSidebarListItem />
                  </span>
                  Email Templates
                </Link>
                <Link to="/firmadmin/security" className={linkClass("/firmadmin/security")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/security")}>
                    <SecurityIconSidebarListItem />
                  </span>
                  Security & Compliance
                </Link>
                <Link to="/firmadmin/settings" className={linkClass("/firmadmin/settings")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/settings")}>
                    <SettingsBrandingIconSidebarListItem />
                  </span>
                  Settings & Branding
                </Link>
                <Link to="/firmadmin/custom-roles" className={linkClass("/firmadmin/custom-roles")} onClick={onNavItemClick}>
                  <span className={iconWrapperClass("/firmadmin/custom-roles")}>
                    <CustomRolesIconSidebarListItem />
                  </span>
                  Custom Roles
                </Link>
              </div>
            )}
          </div>

          {/* Bottom Section - Account Settings & Log Out */}
          <div className="bg-white rounded-lg">
            <div className="flex flex-col gap-3 p-4">
              <Link to="/firmadmin/account-settings" className="flex items-center gap-2 !text-sm font-medium text-gray-900 rounded transition-all duration-200 whitespace-nowrap decoration-0" onClick={onNavItemClick}>
                <span className="w-6 h-6 text-blue-600">
                  <Settings />
                </span>
                <span className="leading-none text-blue-500 hover:!text-blue-500/70">Account Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 !text-sm font-medium rounded w-full text-left whitespace-nowrap border-none cursor-pointer text-[#EF4444] bg-transparent" >
               <span className="w-6 h-6 text-[#EF4444]">
                  <Out />
                </span>
                <span>
                  {isLoggingOut ? 'Logging out...' : 'Log Out'}
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
