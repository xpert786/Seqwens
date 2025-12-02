import React, { useState, useEffect, useRef } from "react";
import { FiChevronDown } from "react-icons/fi";
import { roleAPI, handleAPIError } from "../utils/apiUtils";
import { toast } from "react-toastify";

const ROLE_DISPLAY_NAMES = {
  super_admin: "Super Admin",
  firm: "Firm Admin",
  staff: "Staff (Tax Preparer)",
  client: "Client (Taxpayer)"
};

export default function RoleSwitcher() {
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

  // Handle role switch
  const handleSwitchRole = async (targetRole) => {
    if (switching || targetRole === activeRole) return;

    try {
      setSwitching(true);
      const response = await roleAPI.switchRole(targetRole);
      
      if (response.success) {
        setActiveRole(response.data.active_role);
        // Update roles with new data
        const updatedRoles = await roleAPI.getRoles();
        if (updatedRoles.success && updatedRoles.data) {
          setRoles(updatedRoles.data);
        }
        setShowDropdown(false);
        
        toast.success(`Switched to ${ROLE_DISPLAY_NAMES[targetRole] || targetRole} view`, {
          position: "top-right",
          autoClose: 2000,
        });

        // Reload page to update UI with new role
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error(response.message || "Failed to switch role", {
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

  // Don't show if user has only one role or no roles
  if (loading || !roles || !roles.all_roles || roles.all_roles.length <= 1) {
    return null;
  }

  // Don't show for super admin (they cannot have multiple roles)
  const primaryRole = roles.primary_user?.role;
  if (primaryRole === 'super_admin' || roles.all_roles.includes('super_admin')) {
    return null;
  }

  // Build roles list from primary + linked users
  const rolesWithDetails = [];
  
  // Add primary role
  if (roles.primary_user) {
    rolesWithDetails.push({
      role: roles.primary_user.role,
      display_name: ROLE_DISPLAY_NAMES[roles.primary_user.role] || roles.primary_user.role,
      is_primary: true,
      is_active: roles.active_role === roles.primary_user.role
    });
  }
  
  // Add linked users
  if (roles.linked_users && Array.isArray(roles.linked_users)) {
    roles.linked_users.forEach(linkedUser => {
      rolesWithDetails.push({
        role: linkedUser.role,
        display_name: ROLE_DISPLAY_NAMES[linkedUser.role] || linkedUser.role,
        is_primary: false,
        is_active: roles.active_role === linkedUser.role
      });
    });
  }

  const currentRoleDisplay = ROLE_DISPLAY_NAMES[activeRole] || activeRole;

  return (
    <div className="position-relative" style={{ marginRight: "12px" }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={switching}
        className="btn btn-sm d-flex align-items-center gap-2"
        style={{
          backgroundColor: "#f8f9fa",
          border: "1px solid #dee2e6",
          color: "#3B4A66",
          fontFamily: "BasisGrotesquePro",
          fontSize: "14px",
          padding: "6px 12px",
          borderRadius: "6px",
          whiteSpace: "nowrap"
        }}
        aria-label="Switch role"
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        <span>Viewing as: <strong>{currentRoleDisplay}</strong></span>
        <FiChevronDown
          size={16}
          className={`text-muted ${showDropdown ? "rotate-180" : ""}`}
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
            minWidth: "220px",
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
            Switch Role
          </div>
          {rolesWithDetails.map((roleInfo) => (
            <button
              key={roleInfo.role}
              type="button"
              onClick={() => handleSwitchRole(roleInfo.role)}
              disabled={switching || roleInfo.is_active}
              className="w-100 text-start border-0 bg-transparent"
              style={{
                padding: "10px 16px",
                fontFamily: "BasisGrotesquePro",
                fontSize: "14px",
                color: roleInfo.is_active ? "#00C0C6" : "#3B4A66",
                backgroundColor: roleInfo.is_active ? "#f0fdfa" : "transparent",
                cursor: roleInfo.is_active ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontWeight: roleInfo.is_active ? "600" : "400"
              }}
              onMouseEnter={(e) => {
                if (!roleInfo.is_active) {
                  e.target.style.backgroundColor = "#f8f9fa";
                }
              }}
              onMouseLeave={(e) => {
                if (!roleInfo.is_active) {
                  e.target.style.backgroundColor = "transparent";
                }
              }}
            >
              <span>
                {roleInfo.display_name || ROLE_DISPLAY_NAMES[roleInfo.role]}
                {roleInfo.is_primary && (
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
              {roleInfo.is_active && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#00C0C6",
                    fontWeight: "600"
                  }}
                >
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

