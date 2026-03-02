import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronDown, FiLayers } from "react-icons/fi";
import { roleAPI, handleAPIError } from "../utils/apiUtils";
import { setTokens, getStorage } from "../utils/userUtils";
import { toast } from "react-toastify";

const ROLE_DISPLAY_NAMES = {
  super_admin: "Super Admin",
  firm: "Firm Admin",
  staff: "Staff (Tax Preparer)",
  client: "Client (Taxpayer)"
};

// Dashboard routes for each role
const DASHBOARD_ROUTES = {
  client: "/dashboard",
  staff: "/taxdashboard",
  firm: "/firmadmin",
  super_admin: "/superadmin"
};

export default function DashboardSwitcher() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Fetch user roles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleAPI.getRoles();
      if (response.success && response.data) {
        setRoles(response.data);
        // Active role from response, fallback to primary role
        setActiveRole(response.data.active_role || response.data.primary_user?.role);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Handle dashboard switch
  const handleSwitchDashboard = async (targetRole) => {
    if (switching || targetRole === activeRole) return;

    try {
      setSwitching(true);
      const response = await roleAPI.switchRole(targetRole);

      if (response.success) {
        // Update tokens for the session
        const rememberMe = localStorage.getItem("rememberMe") === "true" || sessionStorage.getItem("rememberMe") === "true";
        const accessToken = response.access_token || response.tokens?.access || response.data?.access_token;
        const refreshToken = response.refresh_token || response.tokens?.refresh || response.data?.refresh_token;

        if (accessToken && refreshToken) {
          setTokens(accessToken, refreshToken, rememberMe);
        }

        // Update storage user data if available
        const storage = getStorage();
        if (response.user && storage) {
          storage.setItem('userData', JSON.stringify(response.user));
          storage.setItem('userType', targetRole);
        } else if (response.data?.user && storage) {
          storage.setItem('userData', JSON.stringify(response.data.user));
          storage.setItem('userType', targetRole);
        }

        setActiveRole(response.data?.active_role || targetRole);
        setShowDropdown(false);

        toast.success(`Switched to ${ROLE_DISPLAY_NAMES[targetRole] || targetRole} dashboard`, {
          position: "top-right",
          autoClose: 2000,
        });

        // Navigate to the appropriate dashboard
        const dashboardRoute = DASHBOARD_ROUTES[targetRole];
        if (dashboardRoute) {
          // Delay navigation slightly to ensure tokens are set
          setTimeout(() => {
            window.location.href = dashboardRoute;
          }, 300);
        } else {
          // Fallback: reload page
          window.location.reload();
        }
      } else {
        toast.error(response.message || "Failed to switch dashboard", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setSwitching(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Don't show if loading or no roles
  if (loading || !roles || !roles.all_roles || roles.all_roles.length === 0) {
    return null;
  }

  // Don't show for super admin (they cannot have multiple roles)
  const primaryRole = roles.primary_user?.role;
  if (primaryRole === 'super_admin' || roles.all_roles.includes('super_admin')) {
    return null;
  }

  // Check if user has multiple roles
  const hasMultipleRoles = roles.all_roles && roles.all_roles.length > 1;

  // Build dashboards list from primary + linked users
  const availableDashboards = [];

  // Add primary role dashboard
  if (roles.primary_user) {
    const role = roles.primary_user.role;
    const isActive = roles.active_role === role;
    availableDashboards.push({
      role: role,
      display_name: ROLE_DISPLAY_NAMES[role] || role,
      route: DASHBOARD_ROUTES[role],
      is_primary: true,
      is_active: isActive
    });
  }

  // Add linked users dashboards
  if (roles.linked_users && Array.isArray(roles.linked_users)) {
    roles.linked_users.forEach(linkedUser => {
      const role = linkedUser.role;
      const isActive = roles.active_role === role;
      availableDashboards.push({
        role: role,
        display_name: ROLE_DISPLAY_NAMES[role] || role,
        route: DASHBOARD_ROUTES[role],
        is_primary: false,
        is_active: isActive
      });
    });
  }

  const currentDashboardDisplay = ROLE_DISPLAY_NAMES[activeRole] || activeRole;

  // If only one role, just show current role badge (non-clickable)
  if (!hasMultipleRoles) {
    return (
      <div
        className="d-flex align-items-center"
        style={{
          marginRight: "12px",
          padding: "6px 12px",
          backgroundColor: "#E0F2FE",
          borderRadius: "6px",
          fontFamily: "BasisGrotesquePro",
          fontSize: "14px",
          color: "#0369A1",
          fontWeight: "500"
        }}
      >
        <FiLayers size={16} style={{ marginRight: "6px" }} />
        <span>{currentDashboardDisplay}</span>
      </div>
    );
  }

  return (
    <div className="position-relative" style={{ marginRight: "12px" }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={switching}
        className="btn  d-flex align-items-center gap-2"
        style={{
          backgroundColor: "#00C0C6",
          border: "none",
          color: "#ffffff",
          fontFamily: "BasisGrotesquePro",
          fontSize: "14px",
          padding: "8px 16px",
          borderRadius: "6px",
          whiteSpace: "nowrap",
          fontWeight: "500"
        }}
        aria-label="Switch dashboard"
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        <FiLayers size={16} />
        <span>Switch Dashboard</span>
        <FiChevronDown
          size={16}
          className={showDropdown ? "rotate-180" : ""}
          style={{ transition: "transform 0.2s" }}
        />
      </button>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="position-absolute"
          style={{
            top: "100%",
            right: 0,
            marginTop: "8px",
            backgroundColor: "#fff",
            border: "1px solid #dee2e6",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            minWidth: "240px",
            zIndex: 1000,
            padding: "8px 0"
          }}
        >
          <div
            style={{
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: "600",
              color: "#6B7280",
              textTransform: "uppercase",
              fontFamily: "BasisGrotesquePro",
              borderBottom: "1px solid #e5e7eb",
              marginBottom: "4px"
            }}
          >
            Available Dashboards
          </div>
          {availableDashboards.map((dashboard) => (
            <button
              key={dashboard.role}
              type="button"
              onClick={() => handleSwitchDashboard(dashboard.role)}
              disabled={switching || dashboard.is_active}
              className="w-100 text-start border-0 bg-transparent"
              style={{
                padding: "10px 16px",
                fontFamily: "BasisGrotesquePro",
                fontSize: "14px",
                color: dashboard.is_active ? "#00C0C6" : "#3B4A66",
                backgroundColor: dashboard.is_active ? "#f0fdfa" : "transparent",
                cursor: dashboard.is_active ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontWeight: dashboard.is_active ? "600" : "400"
              }}
              onMouseEnter={(e) => {
                if (!dashboard.is_active) {
                  e.target.style.backgroundColor = "#f8f9fa";
                }
              }}
              onMouseLeave={(e) => {
                if (!dashboard.is_active) {
                  e.target.style.backgroundColor = "transparent";
                }
              }}
            >
              <span>
                {dashboard.display_name}
                {dashboard.is_primary && (
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "11px",
                      color: "#6B7280"
                    }}
                  >
                    (Primary)
                  </span>
                )}
              </span>
              {dashboard.is_active && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#00C0C6",
                    fontWeight: "600"
                  }}
                >
                  Current
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

