import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/TaxSidebar.css";
import { DashIconed, FileIconed, MesIconed, MonthIconed, AccountIcon, LogOutIcon } from "./icons";
import { Clients, Task } from "./icons";
import { userAPI } from "../../ClientOnboarding/utils/apiUtils";
import { clearUserData } from "../../ClientOnboarding/utils/userUtils";

export default function TaxSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
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
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await userAPI.logout();
    } catch (error) {
      console.error("Sidebar logout failed:", error);
    } finally {
      clearUserData();
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="tsb-container">
      <div className="tsb-top">
        <ul className="nav flex-column px-3">
          <Link to="/taxdashboard" className={linkClass("/taxdashboard")}>
            <span className={iconWrapperClass("/taxdashboard")}><DashIconed /></span>
            Dashboard
          </Link>

          <Link to="/taxdashboard/clients" className={linkClass("/taxdashboard/clients")}>
            <span className={iconWrapperClass("/taxdashboard/clients")}><Clients /></span>
            My Clients
          </Link>

          <Link to="/taxdashboard/documents" className={linkClass("/taxdashboard/documents")}>
            <span className={iconWrapperClass("/taxdashboard/documents")}><FileIconed /></span>
            Documents
          </Link>

          <li className="mb-2">
            <Link to="/taxdashboard/tasks" className={linkClass("/taxdashboard/tasks")}>
              <span className={iconWrapperClass("/taxdashboard/tasks")}>
                <Task />
              </span>
              Tasks / To-Dos
            </Link>
          </li>

          <li className="mb-2">
            <Link to="/taxdashboard/messages" className={linkClass("/taxdashboard/messages")}>
              <span className={iconWrapperClass("/taxdashboard/messages")}>
                <MesIconed />
              </span>
              Messages
            </Link>
          </li>

          <li className="mb-2">
            <Link to="/taxdashboard/calendar" className={linkClass("/taxdashboard/calendar")}>
              <span className={iconWrapperClass("/taxdashboard/calendar")}>
                <MonthIconed />
              </span>
              Calendar / Appointments
            </Link>
          </li>


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

        <button
          type="button"
          className={bottomLinkClass("/logout")}
          onClick={handleLogout}
          disabled={loggingOut}
          style={{ border: "none", width: "100%", textAlign: "left", background: "inherit" }}
        >
          <span className="tsb-bottom-icon">
            <LogOutIcon />
          </span>
          {loggingOut ? "Logging out..." : "Log Out"}
        </button>
      </div>
    </div>
  );
}
