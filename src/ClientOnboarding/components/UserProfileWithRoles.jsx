import React, { useState, useEffect } from "react";
import { roleAPI, profileAPI, handleAPIError, firmAdminCustomRolesAPI } from "../utils/apiUtils";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";
import RoleRequestModal from "./RoleRequestModal";
import { FiTrash2, FiUser, FiMail, FiPhone, FiShield, FiBriefcase, FiUsers, FiPlus, FiChevronDown, FiChevronUp, FiCheck, FiRefreshCw } from "react-icons/fi";
import { setTokens, clearUserData } from "../utils/userUtils";

const ROLE_DISPLAY_NAMES = {
  super_admin: "Super Admin",
  firm: "Firm Admin",
  admin: "Firm Admin",
  staff: "Tax Preparer",
  tax_preparer: "Tax Preparer",
  client: "Client"
};

const ROLE_TYPE_COLORS = {
  user_role: {
    bg: "#E0F2FE",
    text: "#0369A1",
    border: "#7DD3FC"
  },
  firm_role: {
    bg: "#F0FDF4",
    text: "#166534",
    border: "#86EFAC"
  }
};

export default function UserProfileWithRoles() {
  const [userProfile, setUserProfile] = useState(null);
  const [allRoles, setAllRoles] = useState({
    user_roles: [],
    firm_roles: [],
    all_roles: []
  });
  const [customRoles, setCustomRoles] = useState([]); // Custom roles from API
  const [customRolesLoading, setCustomRolesLoading] = useState(false);
  const [userRoles, setUserRoles] = useState(null); // Current user's roles
  const [pendingRequests, setPendingRequests] = useState([]); // Pending role requests
  const [loading, setLoading] = useState(true);
  const [removingRole, setRemovingRole] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRoleToRequest, setSelectedRoleToRequest] = useState(null);
  const [selectedCustomRoleInfo, setSelectedCustomRoleInfo] = useState(null); // Store custom role info (name, description)
  const [expandedFirmRole, setExpandedFirmRole] = useState(null); // Track which firm role's permissions are expanded
  const [profileImageError, setProfileImageError] = useState(false); // Track if profile image failed to load
  const [switchingRole, setSwitchingRole] = useState(null); // Track which role is being switched to

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await profileAPI.getUserAccount();
      let userInfo = response;
      if (response.user) {
        userInfo = response.user;
      } else if (response.data) {
        userInfo = response.data;
      }
      setUserProfile(userInfo);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Fetch all available roles
  const fetchAllRoles = async () => {
    try {
      const response = await roleAPI.getAllRoles();
      if (response.success && response.data) {
        // Filter out duplicate roles - if both staff and tax_preparer exist, keep only tax_preparer
        const userRoles = (response.data.user_roles || []).filter((role, index, self) => {
          // If role is "staff", check if "tax_preparer" also exists
          if (role.value === "staff") {
            const hasTaxPreparer = self.some(r => r.value === "tax_preparer");
            // If tax_preparer exists, exclude staff
            return !hasTaxPreparer;
          }
          return true;
        });

        setAllRoles({
          user_roles: userRoles,
          firm_roles: response.data.firm_roles || [],
          all_roles: response.data.all_roles || []
        });
      }
    } catch (error) {
      console.error("Error fetching all roles:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Fetch current user's roles
  const fetchUserRoles = async () => {
    try {
      const response = await roleAPI.getRoles();
      if (response.success && response.data) {
        setUserRoles(response.data);
      }
    } catch (error) {
      console.error("Error fetching user roles:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Fetch pending role requests
  const fetchPendingRequests = async () => {
    try {
      const response = await roleAPI.getPendingRoleRequests();
      if (response.success && response.data) {
        // Handle both response structures: { requests: [...] } or direct array
        const requests = response.data.requests || response.data || [];
        setPendingRequests(Array.isArray(requests) ? requests : []);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      // Don't show error toast for this, just log it
      setPendingRequests([]);
    }
  };

  // Fetch custom roles (available for firm admins, tax preparers, and clients)
  const fetchCustomRoles = async () => {
    try {
      setCustomRolesLoading(true);
      const response = await firmAdminCustomRolesAPI.getCustomRoles(false); // Only active roles
      if (response.success && response.data) {
        setCustomRoles(response.data.roles || []);
      }
    } catch (error) {
      console.error("Error fetching custom roles:", error);
      // Don't show error toast - this is optional data
      setCustomRoles([]);
    } finally {
      setCustomRolesLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUserProfile(),
        fetchAllRoles(),
        fetchUserRoles(),
        fetchPendingRequests(),
        fetchCustomRoles() // Fetch custom roles for all user types
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Reset image error when profile image changes
  // This must be before any early returns to maintain hook order
  const profileImage = userProfile?.profile_picture || userProfile?.profile_image || null;
  useEffect(() => {
    setProfileImageError(false);
  }, [profileImage]);

  const handleDeleteRole = (role) => {
    setRoleToDelete(role);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      setRemovingRole(roleToDelete);
      const response = await roleAPI.removeRole(roleToDelete);

      if (response.success) {
        toast.success(
          `Role '${ROLE_DISPLAY_NAMES[roleToDelete] || roleToDelete}' removed successfully`,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
        // Refresh user roles
        await fetchUserRoles();
        setShowDeleteConfirm(false);
        setRoleToDelete(null);
      } else {
        toast.error(response.message || "Failed to remove role", {
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
      setRemovingRole(null);
    }
  };

  const handleRequestRole = (role, customRoleInfo = null) => {
    // Check if this role already has a pending request using the hasPendingRequest function
    if (hasPendingRequest(role)) {
      toast.info("You already have a pending request for this role", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setSelectedRoleToRequest(role);
    setSelectedCustomRoleInfo(customRoleInfo); // Store custom role info if provided
    setShowRequestModal(true);
  };

  // Check if a role has a pending request
  const hasPendingRequest = (roleValue) => {
    if (!roleValue || pendingRequests.length === 0) return false;

    // Extract custom role ID if it's in custom_role_{id} format
    const customRoleId = roleValue.toString().startsWith('custom_role_')
      ? roleValue.toString().replace('custom_role_', '')
      : null;

    return pendingRequests.some(
      req => {
        // Handle standard roles: check requested_role field
        const requestedRole = req.requested_role;

        // Handle custom roles: check custom_role object
        const customRole = req.custom_role;
        const customRoleIdFromRequest = customRole?.id || req.custom_role_id || null;

        // For standard roles: match requested_role
        if (!customRoleId && requestedRole) {
          return requestedRole === roleValue || requestedRole === roleValue.toString();
        }

        // For custom roles: match custom_role.id
        if (customRoleId) {
          // Match if backend returned custom_role object with id
          if (customRoleIdFromRequest && customRoleIdFromRequest.toString() === customRoleId) {
            return true;
          }
          // Match if backend returned the ID directly in requested_role (fallback)
          if (requestedRole && requestedRole.toString() === customRoleId) {
            return true;
          }
          // Match if backend returned custom_role_{id} format in requested_role (fallback)
          if (requestedRole && requestedRole.toString() === `custom_role_${customRoleId}`) {
            return true;
          }
        }

        // Fallback: Check if roleValue is a number and matches custom_role_id
        if (!customRoleId && customRoleIdFromRequest && roleValue.toString() === customRoleIdFromRequest.toString()) {
          return true;
        }

        return false;
      }
    );
  };

  const handleRequestSuccess = async () => {
    // Refresh user roles and pending requests after successful request
    await Promise.all([
      fetchUserRoles(),
      fetchPendingRequests()
    ]);
    setShowRequestModal(false);
    setSelectedRoleToRequest(null);
    setSelectedCustomRoleInfo(null);
  };

  const handleSwitchActiveRole = async (roleValue) => {
    if (switchingRole) return;

    try {
      setSwitchingRole(roleValue);
      const response = await roleAPI.switchRole(roleValue);

      if (response.success && response.access_token) {
        toast.success(`Switched role to ${ROLE_DISPLAY_NAMES[roleValue] || roleValue}`, {
          position: "top-right",
          autoClose: 2000,
        });

        // Update user tokens and role context
        const rememberMe = localStorage.getItem('rememberMe') === 'true' || sessionStorage.getItem('rememberMe') === 'true';
        setTokens(response.access_token, response.refresh_token, rememberMe);

        const storage = rememberMe ? localStorage : sessionStorage;
        if (response.user) {
          storage.setItem('userData', JSON.stringify(response.user));
          storage.setItem('userType', response.user.active_role || response.user.user_type);
        }

        // Short delay before reload to show success message
        setTimeout(() => {
          window.location.href = '/'; // Go to dashboard with new role
        }, 1500);
      } else {
        throw new Error(response.message || "Failed to switch role");
      }
    } catch (error) {
      console.error("Error switching role:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setSwitchingRole(null);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
            Loading profile data...
          </p>
        </div>
      </div>
    );
  }

  // Extract data from the new API structure
  const primaryRole = userRoles?.primary_role || "";
  const additionalRoles = userRoles?.additional_roles || [];
  const allUserRoles = userRoles?.all_roles || [];
  const activeRole = userRoles?.active_role || primaryRole;
  const rolesWithDetails = userRoles?.roles_with_details || [];

  // Get primary role details
  const primaryRoleDetails = rolesWithDetails.find(r => r.is_primary) || {
    role: primaryRole,
    display_name: ROLE_DISPLAY_NAMES[primaryRole] || primaryRole,
    is_primary: true,
    is_active: activeRole === primaryRole
  };

  // Get additional roles (non-primary)
  const additionalRolesDetails = rolesWithDetails.filter(r => !r.is_primary);

  const fullName = userProfile
    ? `${userProfile.first_name || ""} ${userProfile.middle_name || ""} ${userProfile.last_name || ""}`.trim() || "User"
    : "User";

  // Determine if user is firm admin
  const isFirmAdmin = primaryRole === 'firm' || primaryRole === 'admin' || allUserRoles.includes('firm') || allUserRoles.includes('admin');

  return (
    <div style={{ fontFamily: "BasisGrotesquePro" }} className="pb-5">
      {/* Profile Header Section */}
      <div className="bg-white border border-[#E8F0FF] rounded-4 p-3 p-md-4 mb-4 shadow-sm">
        <div className="d-flex flex-column flex-sm-row align-items-center text-center text-sm-start gap-3 gap-md-4">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            {profileImage && profileImage !== 'null' && profileImage !== 'undefined' && !profileImageError ? (
              <img
                src={profileImage}
                alt="Profile"
                style={{
                  width: '100px',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '50%',
                  border: '4px solid #F0F7FF',
                  display: 'block'
                }}
                onError={() => setProfileImageError(true)}
              />
            ) : (
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: '#E8F0FF',
                  border: '4px solid #F0F7FF',
                  color: '#3B4A66',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: '600'
                }}
              >
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-grow-1 w-100">
            <h3
              className="mb-2"
              style={{
                color: "#3B4A66",
                fontSize: "22px",
                fontWeight: "700"
              }}
            >
              {fullName}
            </h3>
            <div className="d-flex flex-column gap-2">
              {userProfile?.email && (
                <div className="d-flex align-items-center justify-content-center justify-content-sm-start gap-2">
                  <FiMail size={14} className="text-muted" />
                  <span className="text-break" style={{ color: "#6B7280", fontSize: "14px" }}>
                    {userProfile.email}
                  </span>
                </div>
              )}
              {userProfile?.phone_number && (
                <div className="d-flex align-items-center justify-content-center justify-content-sm-start gap-2">
                  <FiPhone size={14} className="text-muted" />
                  <span style={{ color: "#6B7280", fontSize: "14px" }}>
                    {userProfile.phone_number}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* My Roles Section */}
      <div className="bg-white border border-[#E8F0FF] rounded-4 p-3 p-md-4 mb-4 shadow-sm">
        <div className="d-flex align-items-center gap-2 mb-4">
          <FiShield size={20} style={{ color: "#3B4A66" }} />
          <h4
            className="m-0"
            style={{
              color: "#3B4A66",
              fontSize: "18px",
              fontWeight: "700"
            }}
          >
            Account Roles
          </h4>
        </div>

        {primaryRole && (
      <div className="mb-4">
        <p className="small fw-bold text-uppercase text-muted mb-2" style={{ letterSpacing: '0.5px' }}>
          Primary Role
        </p>
        <div className="d-flex flex-wrap gap-2">
          <div
            className="px-3 py-2 rounded-3 d-flex align-items-center gap-3 transition-all duration-200 hover:shadow-sm"
            style={{
              backgroundColor: primaryRoleDetails.is_active ? ROLE_TYPE_COLORS.user_role.bg : "#F8FAFC",
              color: primaryRoleDetails.is_active ? ROLE_TYPE_COLORS.user_role.text : "#64748B",
              border: `1px solid ${primaryRoleDetails.is_active ? ROLE_TYPE_COLORS.user_role.border : "#E2E8F0"}`,
              fontSize: "13px",
              fontWeight: "600",
              minWidth: "fit-content"
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <FiUser size={14} />
              <span className="text-truncate">
                {primaryRoleDetails.display_name || ROLE_DISPLAY_NAMES[primaryRole] || primaryRole}
              </span>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              {primaryRoleDetails.is_active ? (
                <span className="badge rounded-pill" style={{ backgroundColor: ROLE_TYPE_COLORS.user_role.text, fontSize: '9px', padding: '4px 8px' }}>
                  Active
                </span>
              ) : (
                <button
                  onClick={() => handleSwitchActiveRole(primaryRole)}
                  disabled={!!switchingRole}
                  className="btn btn-sm p-0 d-flex align-items-center gap-1 text-decoration-none"
                  style={{ 
                    fontSize: '11px', 
                    fontWeight: '700',
                    color: ROLE_TYPE_COLORS.user_role.text,
                    opacity: switchingRole ? 0.5 : 1
                  }}
                >
                  {switchingRole === primaryRole ? (
                    <div className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }} role="status" />
                  ) : (
                    <FiRefreshCw size={12} />
                  )}
                  Switch
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

        {additionalRolesDetails.length > 0 && (
          <div>
            <p className="small fw-bold text-uppercase text-muted mb-2" style={{ letterSpacing: '0.5px' }}>
              Additional Access
            </p>
            <div className="d-flex flex-wrap gap-2">
              {additionalRolesDetails.map((roleDetail, index) => {
                const roleType = roleDetail.type || "user_role";
                const colors = ROLE_TYPE_COLORS[roleType] || ROLE_TYPE_COLORS.user_role;
                const isDeletable = !roleDetail.is_primary;

                return (
                  <div
                    key={`${roleDetail.role}-${index}`}
                    className="px-3 py-2 rounded-3 d-flex align-items-center gap-3 transition-all duration-200 hover:shadow-sm"
                    style={{
                      backgroundColor: roleDetail.is_active ? colors.bg : "#F8FAFC",
                      color: roleDetail.is_active ? colors.text : "#64748B",
                      border: `1px solid ${roleDetail.is_active ? colors.border : "#E2E8F0"}`,
                      fontSize: "13px",
                      fontWeight: "600",
                      minWidth: "fit-content"
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      {roleType === "firm_role" ? <FiBriefcase size={14} /> : <FiUsers size={14} />}
                      <span>{roleDetail.display_name || ROLE_DISPLAY_NAMES[roleDetail.role] || roleDetail.role}</span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      {roleDetail.is_active ? (
                        <span className="badge rounded-pill" style={{ backgroundColor: colors.text, fontSize: '9px', padding: '4px 8px' }}>
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSwitchActiveRole(roleDetail.role)}
                          disabled={!!switchingRole}
                          className="btn btn-sm p-0 d-flex align-items-center gap-1 text-decoration-none"
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: colors.text,
                            opacity: switchingRole ? 0.5 : 1
                          }}
                        >
                          {switchingRole === roleDetail.role ? (
                            <div className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }} role="status" />
                          ) : (
                            <FiRefreshCw size={12} />
                          )}
                          Switch
                        </button>
                      )}

                      {isDeletable && !roleDetail.is_active && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(roleDetail.role)}
                          disabled={!!switchingRole}
                          className="btn-close btn-close-sm"
                          style={{ fontSize: '9px', opacity: removingRole === roleDetail.role ? 0.5 : 0.6 }}
                          aria-label="Remove role"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

