import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import FixedLayout from "./FixedLayout";
import "../styles/Login.css";
import { getStorage, isLoggedIn } from "../utils/userUtils";

// Role display names mapping
const ROLE_DISPLAY_NAMES = {
  client: "Client Dashboard",
  staff: "Tax Preparer Dashboard",
  tax_preparer: "Tax Preparer Dashboard",
  admin: "Firm Admin Dashboard",
  firm: "Firm Admin Dashboard",
  super_admin: "Super Admin Dashboard",
  support_admin: "Support Admin Dashboard",
  billing_admin: "Billing Admin Dashboard"
};

// Role descriptions
const ROLE_DESCRIPTIONS = {
  client: "Access your personal tax documents and information",
  staff: "Manage client tax preparation and documents",
  tax_preparer: "Manage client tax preparation and documents",
  admin: "Manage firm settings and users",
  firm: "Manage firm settings and users",
  super_admin: "System administration and management",
  support_admin: "Support center and customer service",
  billing_admin: "Subscription and billing management"
};

// Role icons (using simple text icons, can be replaced with actual icons)
const ROLE_ICONS = {
  client: "👤",
  staff: "📋",
  tax_preparer: "📋",
  admin: "🏢",
  firm: "🏢",
  super_admin: "⚙️",
  support_admin: "💬",
  billing_admin: "💳"
};

export default function RoleSelectionScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    if (!isLoggedIn()) {
      navigate("/login", { replace: true });
      return;
    }

    // Get user data from location state or storage
    const stateUserData = location.state?.userData;
    const storage = getStorage();
    const storedUserData = storage?.getItem("userData");

    let user = null;
    if (stateUserData) {
      user = stateUserData;
    } else if (storedUserData) {
      try {
        user = JSON.parse(storedUserData);
      } catch (e) {
        console.error("Error parsing user data:", e);
        navigate("/login", { replace: true });
        return;
      }
    } else {
      // No user data found, redirect to login
      navigate("/login", { replace: true });
      return;
    }

    // Check if user has multiple roles
    const roles = user.role;
    console.log('RoleSelectionScreen - User roles:', roles);
    console.log('RoleSelectionScreen - User data:', user);
    if (!roles || !Array.isArray(roles) || roles.length <= 1) {
      // User doesn't have multiple roles, redirect based on user_type
      const userType = user.user_type;
      const storage = getStorage();
      if (storage) {
        storage.setItem("userType", userType);
      }

      // Navigate based on user type (same logic as Login.jsx)
      if (userType === 'super_admin') {
        navigate("/superadmin", { replace: true });
      } else if (userType === 'support_admin' || userType === 'billing_admin') {
        navigate("/superadmin", { replace: true });
      } else if (userType === 'admin') {
        navigate("/seqwens-frontend/firmadmin", { replace: true });
      } else if (userType === 'tax_preparer') {
        navigate("/taxdashboard", { replace: true });
      } else if (userType === 'client' || !userType) {
        const isEmailVerified = user.is_email_verified;
        const isPhoneVerified = user.is_phone_verified;
        const isCompleted = user.is_completed;

        if (!isEmailVerified && !isPhoneVerified) {
          navigate("/two-auth", { replace: true });
        } else if (isCompleted) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/dashboard-first", { replace: true });
        }
      } else {
        navigate("/dashboard", { replace: true });
      }
      return;
    }

    setUserData(user);
  }, [location, navigate]);

  const handleRoleSelection = (role) => {
    if (isNavigating) return;

    setSelectedRole(role);
    setIsNavigating(true);

    const storage = getStorage();
    const user = userData;

    // Map role to user_type and route
    let userType = role;
    let route = "";

    // Map 'staff' role to 'tax_preparer' for routing
    if (role === 'staff') {
      userType = 'tax_preparer';
    }

    // Map 'firm' role to 'admin' for routing
    if (role === 'firm') {
      userType = 'admin';
    }

    // Check if user has custom role and selected role is tax_preparer
    const customRole = user?.custom_role;
    if (customRole && (role === 'staff' || role === 'tax_preparer')) {
      // Store custom role data
      if (storage) {
        storage.setItem("customRole", JSON.stringify(customRole));
      }
    }

    // Determine route based on role
    if (role === 'super_admin' || role === 'support_admin' || role === 'billing_admin') {
      route = "/superadmin";
    } else if (role === 'admin' || role === 'firm') {
      route = "/firmadmin";
    } else if (role === 'staff' || role === 'tax_preparer') {
      userType = 'tax_preparer';
      route = "/taxdashboard";
    } else if (role === 'client') {
      // Client routing - check verification status
      const isEmailVerified = user.is_email_verified;
      const isPhoneVerified = user.is_phone_verified;
      const isCompleted = user.is_completed;

      // If neither email nor phone is verified, go to two-factor authentication
      if (!isEmailVerified && !isPhoneVerified) {
        route = "/two-auth";
      } else {
        // If either email or phone is verified, check completion status
        if (isCompleted) {
          route = "/dashboard";
        } else {
          route = "/dashboard-first";
        }
      }
    } else {
      // Fallback
      route = "/dashboard";
    }

    // Store selected user type
    if (storage) {
      storage.setItem("userType", userType);
    }

    // Navigate to selected route
    setTimeout(() => {
      navigate(route, { replace: true });
    }, 300);
  };

  if (!userData || !userData.role || !Array.isArray(userData.role)) {
    return null;
  }

  // Filter roles that have display names, but also include all roles as fallback
  const availableRoles = userData.role.filter(role => {
    const hasMapping = ROLE_DISPLAY_NAMES[role] !== undefined;
    if (!hasMapping) {
      console.warn(`RoleSelectionScreen - Role "${role}" not found in ROLE_DISPLAY_NAMES`);
    }
    return hasMapping;
  });

  console.log('RoleSelectionScreen - Available roles after filtering:', availableRoles);
  console.log('RoleSelectionScreen - All roles:', userData.role);
  console.log('RoleSelectionScreen - ROLE_DISPLAY_NAMES keys:', Object.keys(ROLE_DISPLAY_NAMES));
  console.log('RoleSelectionScreen - tax_preparer in mappings?', 'tax_preparer' in ROLE_DISPLAY_NAMES);

  if (availableRoles.length === 0) {
    // No valid roles, redirect to login
    console.error('RoleSelectionScreen - No available roles found, redirecting to login');
    navigate("/login");
    return null;
  }

  // If we have multiple roles but only one is showing, log a warning
  if (userData.role.length > 1 && availableRoles.length === 1) {
    console.warn('RoleSelectionScreen - User has multiple roles but only one is available after filtering', {
      allRoles: userData.role,
      availableRoles: availableRoles
    });
  }

  return (
    <FixedLayout>
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <h5 className="login-title">SELECT PANEL</h5>
            <p className="login-subtitle">
              You have access to multiple panels. Please select which one you'd like to access.
            </p>
          </div>

          <div className="role-selection-container" style={{ marginTop: "30px" }}>
            {availableRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelection(role)}
                disabled={isNavigating}
                className="role-selection-btn"
                style={{
                  width: "100%",
                  padding: "20px",
                  marginBottom: "15px",
                  backgroundColor: selectedRole === role ? "#f56d2d" : "#ffffff",
                  color: selectedRole === role ? "#ffffff" : "#3b4a66",
                  border: "2px solid #ffffff",
                  borderRadius: "12px",
                  cursor: isNavigating ? "not-allowed" : "pointer",
                  fontFamily: "BasisGrotesquePro",
                  fontSize: "16px",
                  fontWeight: "500",
                  textAlign: "left",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                }}
                onMouseEnter={(e) => {
                  if (!isNavigating && selectedRole !== role) {
                    e.target.style.backgroundColor = "#f8f9fa";
                    e.target.style.borderColor = "#f56d2d";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isNavigating && selectedRole !== role) {
                    e.target.style.backgroundColor = "#ffffff";
                    e.target.style.borderColor = "#ffffff";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <span style={{ fontSize: "24px" }}>{ROLE_ICONS[role] || "📊"}</span>
                  <div>
                    <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                      {ROLE_DISPLAY_NAMES[role] || role}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        opacity: 0.8,
                        fontWeight: "400"
                      }}
                    >
                      {ROLE_DESCRIPTIONS[role] || "Access this panel"}
                    </div>
                  </div>
                </div>
                {selectedRole === role && (
                  <span style={{ fontSize: "20px" }}>✓</span>
                )}
              </button>
            ))}
          </div>

          {isNavigating && (
            <div
              style={{
                textAlign: "center",
                color: "#ffffff",
                marginTop: "20px",
                fontFamily: "BasisGrotesquePro",
                fontSize: "14px"
              }}
            >
              Navigating...
            </div>
          )}
        </div>
      </div>
    </FixedLayout>
  );
}

