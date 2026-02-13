import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/Sidebar.css";
import {
  DashIcon,
  FileIcon,
  BalanceIcon,
  MesIcon,
  IntakeIcon,
  MonthIcon,
  AccountIcon,
  LogOutIcon,
  HelpsIcon,
} from "../components/icons";
import { userAPI } from "../utils/apiUtils";
import { clearUserData } from "../utils/userUtils";
import { navigateToLogin } from "../utils/urlUtils";

export default function Sidebar({ isSidebarOpen = true, onLinkClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle link click - close sidebar on mobile if needed
  const handleLinkClick = () => {
    if (onLinkClick && window.innerWidth < 768) {
      onLinkClick();
    }
  };

  // Check if a path is active - handles both top-level and nested dashboard routes
  const isActive = (path) => {
    const currentPath = location.pathname;

    // Special handling for dashboard - match /dashboard, /dashboard/, and /dashboard-first
    if (path === "/dashboard") {
      return currentPath === "/dashboard" ||
        currentPath === "/dashboard/" ||
        currentPath === "/dashboard-first";
    }

    // Exact match
    if (currentPath === path) return true;

    // Check if current path is a nested route under the path
    // e.g., /documents/123 should match /documents
    if (currentPath.startsWith(path + "/")) return true;

    // Check if current path is under /dashboard with the same suffix
    // e.g., /dashboard/documents should match /documents
    if (currentPath === `/dashboard${path}`) return true;
    if (currentPath.startsWith(`/dashboard${path}/`)) return true;

    return false;
  };

  const linkClass = (path) =>
    `nav-link d-flex align-items-center px-2 py-2 rounded ${isActive(path) ? "active-link" : "inactive-link"
    }`;

  const iconWrapperClass = (path) =>
    `icon-wrapper ${isActive(path) ? "icon-active" : "icon-inactive"}`;

  const bottomLinkClass = (path) =>
    `sidebar-bottom-link ${isActive(path) ? "bottom-active" : ""}`;

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
      className={`client-sidebar-container ${isSidebarOpen ? "" : "collapsed"}`}
      aria-hidden={!isSidebarOpen}
    >

      <div className="sidebar-top">
        <ul className="nav flex-column px-3">
          <li className="nav-item mb-2">
            <Link to="/dashboard" className={linkClass("/dashboard")} onClick={handleLinkClick}>
              <span className={iconWrapperClass("/dashboard")}>
                <DashIcon />
              </span>
              Dashboard
            </Link>
          </li>

          <li className="mb-2">
            <Link to="/documents" className={linkClass("/documents")} onClick={handleLinkClick}>
              <span className={iconWrapperClass("/documents")}>
                <FileIcon />
              </span>
              My Documents
            </Link>
          </li>

          <li className="mb-2">
            <Link to="/dataintake" className={linkClass("/dataintake")} onClick={handleLinkClick}>
              <span className={iconWrapperClass("/dataintake")}>
                <IntakeIcon />
              </span>
              Data Intake Form
            </Link>
          </li>

          <li className="mb-2">
            <Link to="/invoices" className={linkClass("/invoices")} onClick={handleLinkClick}>
              <span className={iconWrapperClass("/invoices")}>
                <BalanceIcon />
              </span>
              Invoices & Billing
            </Link>
          </li>


          <li className="mb-2">
            <Link to="/messages" className={linkClass("/messages")} onClick={handleLinkClick}>
              <span className={iconWrapperClass("/messages")}>
                <MesIcon />
              </span>
              Messages
            </Link>
          </li>

          <li>
            <Link to="/appointments" className={linkClass("/appointments")} onClick={handleLinkClick}>
              <span className={iconWrapperClass("/appointments")}>
                <MonthIcon />
              </span>
              Appointments
            </Link>
          </li>
        </ul>
      </div>

      {/* Fixed Bottom Box */}
      <div className="sidebar-bottom-boxs">
        <Link to="/accounts" className={bottomLinkClass("/accounts")} onClick={handleLinkClick}>
          <span className={`bottom-icon-wrapper ${isActive("/accounts") ? "active" : ""}`}>
            <AccountIcon />
          </span>
          Account Settings
        </Link>

        <Link to="/helpers" className={bottomLinkClass("/helpers")} onClick={handleLinkClick}>
          <span className={`bottom-icon-wrapper ${isActive("/helpers") ? "active" : ""}`}>
            <HelpsIcon />
          </span>
          Help & Support
        </Link>

        <button
          onClick={handleLogout}
          className={`sidebar-bottom-link ${isLoggingOut ? 'logging-out' : ''} no-hover-logout`}
          disabled={isLoggingOut}
          style={{ backgroundColor: 'white', color: '#EF4444' }}
        >
          <span className="bottom-icon-wrapper" style={{ color: '#EF4444' }}>
            <LogOutIcon />
          </span>
          {isLoggingOut ? 'Logging out...' : 'Log Out'}
        </button>
      </div>
    </div>
  );
}

