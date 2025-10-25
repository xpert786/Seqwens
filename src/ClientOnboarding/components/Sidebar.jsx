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

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const linkClass = (path) =>
    `nav-link d-flex align-items-center px-2 py-2 rounded ${location.pathname === path ? "active-link" : "inactive-link"
    }`;

  const iconWrapperClass = (path) =>
    `icon-wrapper ${location.pathname === path ? "icon-active" : "icon-inactive"}`;

  const bottomLinkClass = (path) =>
    `sidebar-bottom-link ${location.pathname === path ? "bottom-active" : ""}`;

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
    <div className="client-sidebar-container">
    
      <div className="sidebar-top">
        <ul className="nav flex-column px-3">
          <li className="nav-item mb-2">
            <Link to="/dashboard" className={linkClass("/dashboard")}>
              <span className={iconWrapperClass("/dashboard")}>
                <DashIcon />
              </span>
              Dashboard
            </Link>
          </li>

          <li className="mb-2">
            <Link to="/documents" className={linkClass("/documents")}>
              <span className={iconWrapperClass("/documents")}>
                <FileIcon />
              </span>
              My Documents
            </Link>
          </li>

          <li className="mb-2">
            <Link to="/dataintake" className={linkClass("/dataintake")}>
              <span className={iconWrapperClass("/dataintake")}>
                <IntakeIcon />
              </span>
              Data Intake Form
            </Link>
          </li>

          <li className="mb-2">
            <Link to="/invoices" className={linkClass("/invoices")}>
              <span className={iconWrapperClass("/invoices")}>
                <BalanceIcon />
              </span>
              Invoices & Payments
            </Link>
          </li>

          <li className="mb-2">
            <Link to="/messages" className={linkClass("/messages")}>
              <span className={iconWrapperClass("/messages")}>
                <MesIcon />
              </span>
              Messages
            </Link>
          </li>

          <li>
            <Link to="/appointments" className={linkClass("/appointments")}>
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
        <Link to="/accounts" className={bottomLinkClass("/accounts")}>
          <span className={`bottom-icon-wrapper ${location.pathname === "/accounts" ? "active" : ""}`}>
            <AccountIcon />
          </span>
          Account Settings
        </Link>

        <Link to="/helpers" className={bottomLinkClass("/helpers")}>
          <span className={`bottom-icon-wrapper ${location.pathname === "/helpers" ? "active" : ""}`}>
            <HelpsIcon />
          </span>
          Help & Support
        </Link>

        <button 
          onClick={handleLogout}
          className={`sidebar-bottom-link ${isLoggingOut ? 'logging-out' : ''}`}
          disabled={isLoggingOut}
        >
          <span className="bottom-icon-wrapper">
            <LogOutIcon />
          </span>
          {isLoggingOut ? 'Logging out...' : 'Log Out'}
        </button>
      </div>
    </div>
  );
}

