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

export default function FirmSidebar({ isSidebarOpen = true }) {
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

  const isActive = (path) => {
    const currentPath = location.pathname;
    // For exact matches (like dashboard)
    if (path === "/firmadmin") {
      return currentPath === path || currentPath === "/firmadmin/";
    }
    // For nested routes, check if current path starts with the route path
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  const linkClass = (path) =>
    `flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap text-left no-underline ${isActive(path)
      ? "bg-white text-black rounded-lg"
      : "text-white hover:bg-white/10 hover:text-white rounded-lg"
    }`;

  const iconWrapperClass = (path) =>
    `inline-flex items-center justify-center mr-3 w-5 h-5 ${isActive(path) ? "p-1 rounded [&>svg]:!text-white" : "[&>svg]:!text-white"
    }`;
  
  const getIconWrapperStyle = (path) => {
    if (isActive(path)) {
      return {
        backgroundColor: 'var(--firm-secondary-color, #F56D2D)'
      };
    }
    return {};
  };

  return (
    <div
      className="h-[calc(100vh-70px)] fixed top-[70px] left-0 z-[1000] transition-all duration-300"
      style={{
        backgroundColor: 'var(--firm-primary-color, #32B582)',
        width: sidebarWidth,
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        visibility: isSidebarOpen ? 'visible' : 'hidden'
      }}
    >
      <div
        className="h-full overflow-y-auto"
        style={{
          width: sidebarWidth,
          scrollbarWidth: 'thin',
          scrollbarColor: `#ffffff var(--firm-primary-color, #32B582)`,
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
                  <span className={iconWrapperClass("/firmadmin")} style={getIconWrapperStyle("/firmadmin")}>
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
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.61684 2.21923C9.79702 2.03138 10.0129 1.88137 10.2518 1.77801C10.4907 1.67465 10.7478 1.62001 11.0081 1.61729C11.2684 1.61458 11.5266 1.66384 11.7676 1.7622C12.0086 1.86056 12.2275 2.00603 12.4116 2.19009C12.5956 2.37415 12.7411 2.59309 12.8395 2.83409C12.9378 3.07509 12.9871 3.3333 12.9844 3.59359C12.9817 3.85387 12.927 4.111 12.8237 4.34989C12.7203 4.58879 12.5703 4.80465 12.3824 4.98483L11.3648 6.00163L11.4336 6.07043C11.5823 6.21902 11.7002 6.39543 11.7806 6.58959C11.8611 6.78375 11.9025 6.99187 11.9025 7.20203C11.9025 7.4122 11.8611 7.62031 11.7806 7.81448C11.7002 8.00864 11.5823 8.18505 11.4336 8.33363L10.2816 9.48484C10.2062 9.5577 10.1052 9.59802 10.0003 9.5971C9.8954 9.59619 9.79507 9.55413 9.72091 9.47996C9.64675 9.4058 9.60468 9.30547 9.60377 9.2006C9.60286 9.09572 9.64318 8.99468 9.71604 8.91924L10.868 7.76723C11.018 7.61721 11.1023 7.41377 11.1023 7.20163C11.1023 6.9895 11.018 6.78606 10.868 6.63603L10.7992 6.56723L5.48244 11.8848C5.43097 11.936 5.36653 11.9723 5.29604 11.9896L2.09604 12.7896C2.02655 12.8069 1.9537 12.8052 1.8851 12.7847C1.81649 12.7642 1.75465 12.7257 1.70602 12.6731C1.65739 12.6206 1.62376 12.5559 1.60863 12.4859C1.59351 12.4159 1.59745 12.3432 1.62004 12.2752L2.62004 9.27524C2.63954 9.21651 2.6724 9.16311 2.71604 9.11924L9.61684 2.21923ZM11.8168 2.78483C11.6001 2.56817 11.3061 2.44647 10.9996 2.44647C10.6932 2.44647 10.3992 2.56817 10.1824 2.78483L3.34884 9.61764L2.60884 11.8368L4.99444 11.2408L11.8168 4.41923C12.0335 4.20246 12.1552 3.90852 12.1552 3.60203C12.1552 3.29555 12.0335 3.00161 11.8168 2.78483ZM2.57284 13.4952L2.61364 13.5256C3.20804 13.9576 4.08884 14.4016 5.19924 14.4016C5.79364 14.4016 6.33844 14.1936 6.82244 13.9184C7.30484 13.6432 7.75284 13.2864 8.15124 12.9624L8.24484 12.8864C8.61604 12.584 8.93444 12.3256 9.22724 12.1528C9.54964 11.9624 9.74244 11.9384 9.87284 11.9816C10.0848 12.052 10.2056 12.216 10.416 12.9168C10.4856 13.1504 10.6104 13.4048 10.7928 13.6104C10.976 13.816 11.248 14.0024 11.5992 14.0024C11.9784 14.0024 12.3536 13.8192 12.6432 13.6488C12.8344 13.536 13.0392 13.3944 13.2056 13.2808C13.288 13.2248 13.36 13.1744 13.4168 13.1368C13.6312 12.9984 13.812 12.9088 13.936 12.8544C13.9979 12.8278 14.0443 12.8091 14.0752 12.7984L14.1072 12.7872L14.112 12.7856C14.2139 12.7558 14.2997 12.6868 14.3506 12.5937C14.4016 12.5006 14.4134 12.3911 14.3836 12.2892C14.3538 12.1874 14.2848 12.1016 14.1917 12.0506C14.0986 11.9997 13.9891 11.9878 13.8872 12.0176H13.8864L13.884 12.0192L13.8784 12.0208L13.8616 12.0264L13.8056 12.0448C13.7576 12.0608 13.6936 12.0864 13.6136 12.1216C13.3941 12.2192 13.1827 12.3342 12.9816 12.4656C12.8883 12.527 12.7971 12.5888 12.708 12.6512C12.555 12.76 12.3979 12.8628 12.2368 12.9592C11.964 13.1208 11.7488 13.2016 11.5992 13.2016C11.5512 13.2016 11.4792 13.1776 11.3912 13.0784C11.2942 12.9643 11.223 12.8306 11.1824 12.6864C10.9904 12.0464 10.7824 11.4416 10.1264 11.2224C9.65604 11.0656 9.19844 11.2408 8.82084 11.4632C8.47284 11.6688 8.10724 11.9672 7.75124 12.2568L7.64724 12.3416C7.24564 12.6672 6.84404 12.9848 6.42644 13.2232C6.01044 13.46 5.60484 13.6016 5.19924 13.6016C4.60244 13.6016 4.08244 13.4416 3.65204 13.2256L2.57284 13.4952Z" fill="white" />
                    </svg>

                  </span>
                  E-Signatures
                </Link>
                <Link to="/firmadmin/messages" className={linkClass("/firmadmin/messages")}>
                  <span className={iconWrapperClass("/firmadmin/messages")}>
                    <Msg />
                  </span>
                  Messaging & Notifications
                </Link>
                <Link to="/firmadmin/calendar" className={linkClass("/firmadmin/calendar")}>
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
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.66667 7.33333V10C4.66667 10.3536 4.80714 10.6928 5.05719 10.9428C5.30724 11.1929 5.64638 11.3333 6 11.3333H8.66667M3.33333 2H6C6.73638 2 7.33333 2.59695 7.33333 3.33333V6C7.33333 6.73638 6.73638 7.33333 6 7.33333H3.33333C2.59695 7.33333 2 6.73638 2 6V3.33333C2 2.59695 2.59695 2 3.33333 2ZM10 8.66667H12.6667C13.403 8.66667 14 9.26362 14 10V12.6667C14 13.403 13.403 14 12.6667 14H10C9.26362 14 8.66667 13.403 8.66667 12.6667V10C8.66667 9.26362 9.26362 8.66667 10 8.66667Z" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                  </span>
                  Workflow Templates
                </Link>
                <Link to="/firmadmin/subscription" className={linkClass("/firmadmin/subscription")}>
                  <span className={iconWrapperClass("/firmadmin/subscription")}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.33398 6.66146H14.6673M2.66732 3.32812H13.334C14.0704 3.32812 14.6673 3.92508 14.6673 4.66146V11.3281C14.6673 12.0645 14.0704 12.6615 13.334 12.6615H2.66732C1.93094 12.6615 1.33398 12.0645 1.33398 11.3281V4.66146C1.33398 3.92508 1.93094 3.32812 2.66732 3.32812Z" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

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
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.6673 4.67188L8.68732 8.47188C8.4815 8.60083 8.24353 8.66922 8.00065 8.66922C7.75777 8.66922 7.5198 8.60083 7.31398 8.47188L1.33398 4.67188M2.66732 2.67188H13.334C14.0704 2.67188 14.6673 3.26883 14.6673 4.00521V12.0052C14.6673 12.7416 14.0704 13.3385 13.334 13.3385H2.66732C1.93094 13.3385 1.33398 12.7416 1.33398 12.0052V4.00521C1.33398 3.26883 1.93094 2.67188 2.66732 2.67188Z" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                  </span>
                  Email Templates
                </Link>
                <Link to="/firmadmin/security" className={linkClass("/firmadmin/security")}>
                  <span className={iconWrapperClass("/firmadmin/security")}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.3327 8.66176C13.3327 11.9951 10.9993 13.6618 8.22602 14.6284C8.08079 14.6776 7.92304 14.6753 7.77935 14.6218C4.99935 13.6618 2.66602 11.9951 2.66602 8.66176V3.99509C2.66602 3.81828 2.73625 3.64871 2.86128 3.52369C2.9863 3.39866 3.15587 3.32842 3.33268 3.32842C4.66602 3.32842 6.33268 2.52842 7.49268 1.51509C7.63392 1.39442 7.81358 1.32812 7.99935 1.32812C8.18511 1.32812 8.36478 1.39442 8.50602 1.51509C9.67268 2.53509 11.3327 3.32842 12.666 3.32842C12.8428 3.32842 13.0124 3.39866 13.1374 3.52369C13.2624 3.64871 13.3327 3.81828 13.3327 3.99509V8.66176Z" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                  </span>
                  Security & Compliance
                </Link>
                <Link to="/firmadmin/settings" className={linkClass("/firmadmin/settings")}>
                  <span className={iconWrapperClass("/firmadmin/settings")}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clip-path="url(#clip0_5150_8210)">
                        <path d="M4.00065 14.6615V2.66146C4.00065 2.30784 4.14113 1.9687 4.39118 1.71865C4.64122 1.4686 4.98036 1.32813 5.33398 1.32812H10.6673C11.0209 1.32813 11.3601 1.4686 11.6101 1.71865C11.8602 1.9687 12.0007 2.30784 12.0007 2.66146V14.6615M4.00065 14.6615H12.0007M4.00065 14.6615H2.66732C2.3137 14.6615 1.97456 14.521 1.72451 14.2709C1.47446 14.0209 1.33398 13.6817 1.33398 13.3281V9.32812C1.33398 8.9745 1.47446 8.63536 1.72451 8.38532C1.97456 8.13527 2.3137 7.99479 2.66732 7.99479H4.00065M12.0007 14.6615H13.334C13.6876 14.6615 14.0267 14.521 14.2768 14.2709C14.5268 14.0209 14.6673 13.6817 14.6673 13.3281V7.32812C14.6673 6.9745 14.5268 6.63536 14.2768 6.38532C14.0267 6.13527 13.6876 5.99479 13.334 5.99479H12.0007M6.66732 3.99479H9.33398M6.66732 6.66146H9.33398M6.66732 9.32812H9.33398M6.66732 11.9948H9.33398" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
                      </g>
                      <defs>
                        <clipPath id="clip0_5150_8210">
                          <rect width="16" height="16" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>

                  </span>
                  Firm Settings & Branding
                </Link>
                <Link to="/firmadmin/custom-roles" className={linkClass("/firmadmin/custom-roles")}>
                  <span className={iconWrapperClass("/firmadmin/custom-roles")}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.00065 1.32812L2.66602 4.32812V7.66146C2.66602 10.3281 4.66602 12.6615 8.00065 13.9948C11.3353 12.6615 13.3353 10.3281 13.3353 7.66146V4.32812L8.00065 1.32812Z" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M6.00065 8.66146L7.33398 9.99479L10.0007 6.66146" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </span>
                  Custom Roles
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
