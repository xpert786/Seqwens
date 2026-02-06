import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/TaxSidebar.css";
import {
  DashIconed,
  FileIconed,
  MesIconed,
  MonthIconed,
  AccountIcon,
  LogOutIcon,
} from "./icons";
import { Clients, Task, SignatureIcon } from "./icons";
import { userAPI } from "../../ClientOnboarding/utils/apiUtils";
import { clearUserData } from "../../ClientOnboarding/utils/userUtils";
import { navigateToLogin } from "../../ClientOnboarding/utils/urlUtils";
import { isFeatureVisible, hasTaxPreparerPermission } from "../../ClientOnboarding/utils/privilegeUtils";

export default function TaxSidebar({ isSidebarOpen = true }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (path) => {
    const p = location.pathname;
    // Dashboard should be active only on exact path
    if (path === "/taxdashboard") {
      return p === "/taxdashboard";
    }
    // Keep My Clients active on internal client routes
    if (path === "/taxdashboard/clients") {
      return p.startsWith("/taxdashboard/clients");
    }
    // Generic: active if exact or nested under the path
    return p === path || p.startsWith(path + "/");
  };

  const linkClass = (path) =>
    `tsb-nav-link d-flex align-items-center px-2 py-2 rounded ${isActive(path) ? "tsb-active-link" : "tsb-inactive-link"}`;

  const iconWrapperClass = (path) =>
    `tsb-icon-wrapper ${isActive(path) ? "tsb-icon-active" : "tsb-icon-inactive"}`;

  const bottomLinkClass = (path) =>
    `tsb-bottom-link ${isActive(path) ? "tsb-bottom-active" : ""}`;

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

  return (
    <div
      className={`tsb-container ${isSidebarOpen ? "" : "collapsed"}`}
      aria-hidden={!isSidebarOpen}
    >
      <div className="tsb-top">
        <ul className="nav flex-column px-3">
          {isFeatureVisible('dashboard') && (
            <Link to="/taxdashboard" className={linkClass("/taxdashboard")}>
              <span className={iconWrapperClass("/taxdashboard")}><DashIconed /></span>
              Dashboard
            </Link>
          )}

          {isFeatureVisible('clients') && (
            <Link to="/taxdashboard/clients" className={linkClass("/taxdashboard/clients")}>
              <span className={iconWrapperClass("/taxdashboard/clients")}><Clients /></span>
              My Clients
            </Link>
          )}

          {isFeatureVisible('documents') && (
            <Link to="/taxdashboard/documents" className={linkClass("/taxdashboard/documents")}>
              <span className={iconWrapperClass("/taxdashboard/documents")}><FileIconed /></span>
              Documents
            </Link>
          )}

          {isFeatureVisible('tasks') && (
            <li className="mb-2">
              <Link to="/taxdashboard/tasks" className={linkClass("/taxdashboard/tasks")}>
                <span className={iconWrapperClass("/taxdashboard/tasks")}>
                  <Task />
                </span>
                Tasks / To-Dos
              </Link>
            </li>
          )}

          {isFeatureVisible('messages') && (
            <li className="mb-2">
              <Link to="/taxdashboard/messages" className={linkClass("/taxdashboard/messages")}>
                <span className={iconWrapperClass("/taxdashboard/messages")}>
                  <MesIconed />
                </span>
                Messages
              </Link>
            </li>
          )}

          {isFeatureVisible('calendar') && (
            <li className="mb-2">
              <Link to="/taxdashboard/calendar" className={linkClass("/taxdashboard/calendar")}>
                <span className={iconWrapperClass("/taxdashboard/calendar")}>
                  <MonthIconed />
                </span>
                Calendar / Appointments
              </Link>
            </li>
          )}

          {isFeatureVisible('eSignatures') && (
            <li className="mb-2">
              <Link to="/taxdashboard/e-signatures" className={linkClass("/taxdashboard/e-signatures")}>
                <span className={iconWrapperClass("/taxdashboard/e-signatures")}>
                  <SignatureIcon />
                </span>
                E-Signatures
              </Link>
            </li>
          )}

          {isFeatureVisible('workflow') && (
            <li className="mb-2">
              <Link to="/taxdashboard/workflows" className={linkClass("/taxdashboard/workflows")}>
                <span className={iconWrapperClass("/taxdashboard/workflows")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3H5C3.89543 3 3 3.89543 3 5V9C3 10.1046 3.89543 11 5 11H9C10.1046 11 11 10.1046 11 9V5C11 3.89543 10.1046 3 9 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 11V15C7 15.5304 7.21071 16.0391 7.58579 16.4142C7.96086 16.7893 8.46957 17 9 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 13H15C13.8954 13 13 13.8954 13 15V19C13 20.1046 13.8954 21 15 21H19C20.1046 21 21 20.1046 21 19V15C21 13.8954 20.1046 13 19 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Workflows
              </Link>
            </li>
          )}

          {hasTaxPreparerPermission('create_invoices') && (
            <li className="mb-2">
              <Link to="/taxdashboard/billing" className={linkClass("/taxdashboard/billing")}>
                <span className={iconWrapperClass("/taxdashboard/billing")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Billing & Invoices
              </Link>
            </li>
          )}

        </ul>
      </div>

      {/* Fixed Bottom Box */}
      <div className="tsb-bottom-box">
        <Link to="/taxdashboard/account" className={bottomLinkClass("/taxdashboard/account")}>
          <span className={`tsb-bottom-icon ${isActive("/taxdashboard/account") ? "active" : ""}`}>
            <AccountIcon />
          </span>
          Account Settings
        </Link>

        <div
          onClick={handleLogout}
          className={bottomLinkClass("/logout")}
          style={{ cursor: "pointer" }}
        >
          <span className={`tsb-bottom-icon ${isActive("/logout") ? "active" : ""}`}>
            <LogOutIcon />
          </span>
          Log Out
        </div>
      </div>
    </div>
  );
}
