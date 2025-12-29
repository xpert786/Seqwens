import React, { useState, useEffect } from "react";
import { roleAPI, profileAPI, handleAPIError, firmAdminCustomRolesAPI } from "../utils/apiUtils";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";
import RoleRequestModal from "./RoleRequestModal";
import { FiTrash2, FiUser, FiMail, FiPhone, FiShield, FiBriefcase, FiUsers, FiPlus, FiChevronDown, FiChevronUp, FiCheck } from "react-icons/fi";

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
    <div style={{ fontFamily: "BasisGrotesquePro" }}>
      {/* Profile Header Section */}
      <div className="bg-white border border-[#E8F0FF] rounded-lg p-6 mb-6">
        <div className="d-flex align-items-center gap-4">
          {/* Profile Picture */}
          <div>
            {profileImage && profileImage !== 'null' && profileImage !== 'undefined' && !profileImageError ? (
              <img
                src={profileImage}
                alt="Profile"
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '50%',
                  border: '4px solid #E8F0FF',
                  display: 'block'
                }}
                onError={() => {
                  // Hide image and show initials instead of random avatar
                  setProfileImageError(true);
                }}
              />
            ) : (
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: '#E8F0FF',
                  border: '4px solid #E8F0FF',
                  color: '#3B4A66',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: '600'
                }}
              >
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-grow-1">
            <h3
              style={{
                color: "#3B4A66",
                fontSize: "24px",
                fontWeight: "600",
                marginBottom: "8px"
              }}
            >
              {fullName}
            </h3>
            <div className="d-flex flex-column gap-2">
              {userProfile?.email && (
                <div className="d-flex align-items-center gap-2">
                  <FiMail size={16} color="#6B7280" />
                  <span style={{ color: "#6B7280", fontSize: "14px" }}>
                    {userProfile.email}
                  </span>
                </div>
              )}
              {userProfile?.phone_number && (
                <div className="d-flex align-items-center gap-2">
                  <FiPhone size={16} color="#6B7280" />
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
      <div className="bg-white border border-[#E8F0FF] rounded-lg p-6 mb-6">
        <div className="d-flex align-items-center gap-2 mb-4">
          <FiShield size={20} color="#3B4A66" />
          <h4
            style={{
              color: "#3B4A66",
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "0"
            }}
          >
            My Roles
          </h4>
        </div>

        {primaryRole && (
          <div className="mb-3">
            <p
              style={{
                color: "#6B7280",
                fontSize: "14px",
                fontWeight: "500",
                marginBottom: "8px"
              }}
            >
              Primary Role
            </p>
            <div className="d-flex flex-wrap gap-2">
              <span
                className="px-3 py-2 rounded d-flex align-items-center gap-2"
                style={{
                  backgroundColor: primaryRoleDetails.is_active 
                    ? ROLE_TYPE_COLORS.user_role.bg 
                    : "#F9FAFB",
                  color: primaryRoleDetails.is_active 
                    ? ROLE_TYPE_COLORS.user_role.text 
                    : "#6B7280",
                  border: `1px solid ${primaryRoleDetails.is_active 
                    ? ROLE_TYPE_COLORS.user_role.border 
                    : "#E5E7EB"}`,
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                <FiUser size={14} />
                {primaryRoleDetails.display_name || ROLE_DISPLAY_NAMES[primaryRole] || primaryRole} (Primary)
                {primaryRoleDetails.is_active && (
                  <span
                    style={{
                      fontSize: "10px",
                      backgroundColor: ROLE_TYPE_COLORS.user_role.text,
                      color: "white",
                      padding: "2px 6px",
                      borderRadius: "10px",
                      marginLeft: "4px"
                    }}
                  >
                    Active
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {additionalRolesDetails.length > 0 && (
          <div className="mb-3">
            <p
              style={{
                color: "#6B7280",
                fontSize: "14px",
                fontWeight: "500",
                marginBottom: "8px"
              }}
            >
              Additional Roles
            </p>
            <div className="d-flex flex-wrap gap-2">
              {additionalRolesDetails.map((roleDetail, index) => {
                const roleType = roleDetail.type || "user_role";
                const colors = ROLE_TYPE_COLORS[roleType] || ROLE_TYPE_COLORS.user_role;
                const isDeletable = !roleDetail.is_primary;

                return (
                  <span
                    key={`${roleDetail.role}-${index}`}
                    className="px-3 py-2 rounded d-flex align-items-center gap-2"
                    style={{
                      backgroundColor: roleDetail.is_active ? colors.bg : "#F9FAFB",
                      color: roleDetail.is_active ? colors.text : "#6B7280",
                      border: `1px solid ${roleDetail.is_active ? colors.border : "#E5E7EB"}`,
                      fontSize: "14px",
                      fontWeight: "500"
                    }}
                  >
                    {roleType === "firm_role" ? (
                      <FiBriefcase size={14} />
                    ) : (
                      <FiUsers size={14} />
                    )}
                    {roleDetail.display_name || ROLE_DISPLAY_NAMES[roleDetail.role] || roleDetail.role}
                    {roleDetail.is_active && (
                      <span
                        style={{
                          fontSize: "10px",
                          backgroundColor: colors.text,
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "10px",
                          marginLeft: "4px"
                        }}
                      >
                        Active
                      </span>
                    )}
                    {isDeletable && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(roleDetail.role)}
                        disabled={removingRole === roleDetail.role}
                        className="btn-close btn-close-sm"
                        style={{
                          fontSize: "10px",
                          opacity: removingRole === roleDetail.role ? 0.5 : 1,
                          cursor: removingRole === roleDetail.role ? "not-allowed" : "pointer",
                          marginLeft: "4px"
                        }}
                        aria-label={`Remove ${roleDetail.role} role`}
                      />
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {additionalRolesDetails.length === 0 && primaryRole && (
          <p style={{ color: "#6B7280", fontSize: "14px", fontStyle: "italic" }}>
            You currently have only your primary role.
          </p>
        )}
      </div>

      {/* Available Roles Section */}
      <div className="bg-white border border-[#E8F0FF] rounded-lg p-6">
        <div className="d-flex align-items-center gap-2 mb-4">
          <FiShield size={20} color="#3B4A66" />
          <h4
            style={{
              color: "#3B4A66",
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "0"
            }}
          >
            Available Roles
          </h4>
        </div>

        {/* User Roles */}
        {allRoles.user_roles.length > 0 && (
          <div className="mb-4">
            <p
              style={{
                color: "#6B7280",
                fontSize: "14px",
                fontWeight: "500",
                marginBottom: "12px"
              }}
            >
              User Roles
            </p>
            <div className="d-flex flex-wrap gap-2">
              {allRoles.user_roles.map((role, index) => {
                const hasRole = allUserRoles.includes(role.value);
                const roleDetail = rolesWithDetails.find(r => r.role === role.value);
                const isActive = roleDetail?.is_active || false;
                const pendingRequest = hasPendingRequest(role.value);
                
                if (hasRole) {
                  // User already has this role - show as badge
                  return (
                    <span
                      key={index}
                      className="px-3 py-2 rounded d-flex align-items-center gap-2"
                      style={{
                        backgroundColor: isActive ? ROLE_TYPE_COLORS.user_role.bg : "#F9FAFB",
                        color: isActive ? ROLE_TYPE_COLORS.user_role.text : "#6B7280",
                        border: `1px solid ${isActive ? ROLE_TYPE_COLORS.user_role.border : "#E5E7EB"}`,
                        fontSize: "14px",
                        fontWeight: "500"
                      }}
                    >
                      <FiUser size={14} />
                      {role.display_name || role.label || role.value}
                      {isActive && (
                        <span
                          style={{
                            fontSize: "10px",
                            backgroundColor: ROLE_TYPE_COLORS.user_role.text,
                            color: "white",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            marginLeft: "4px"
                          }}
                        >
                          Active
                        </span>
                      )}
                    </span>
                  );
                } else if (pendingRequest) {
                  // User has pending request for this role - show as highlighted badge (not clickable)
                  return (
                    <span
                      key={index}
                      className="px-3 py-2 rounded d-flex align-items-center gap-2"
                      style={{
                        backgroundColor: "#FEF3C7",
                        color: "#92400E",
                        border: "1px solid #FCD34D",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: "default"
                      }}
                    >
                      <FiUser size={14} />
                      {role.display_name || role.label || role.value}
                      <span
                        style={{
                          fontSize: "10px",
                          backgroundColor: "#F59E0B",
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "10px",
                          marginLeft: "4px"
                        }}
                      >
                        Pending
                      </span>
                    </span>
                  );
                } else {
                  // User doesn't have this role - show as clickable button
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleRequestRole(role.value)}
                      className="px-3 py-2 rounded d-flex align-items-center gap-2 border-0"
                      style={{
                        backgroundColor: "#F9FAFB",
                        color: "#3B4A66",
                        border: "1px solid #E5E7EB",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#F3F4F6";
                        e.currentTarget.style.borderColor = "#00C0C6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#F9FAFB";
                        e.currentTarget.style.borderColor = "#E5E7EB";
                      }}
                    >
                      <FiUser size={14} />
                      {role.display_name || role.label || role.value}
                      <FiPlus size={12} style={{ marginLeft: "4px", opacity: 0.7 }} />
                    </button>
                  );
                }
              })}
            </div>
          </div>
        )}

        {/* Firm Roles (Custom Roles) */}
        {(customRoles.length > 0 || customRolesLoading) && (
          <div className="mb-4">
            <p
              style={{
                color: "#6B7280",
                fontSize: "14px",
                fontWeight: "500",
                marginBottom: "12px"
              }}
            >
              Firm Roles (Custom Roles)
            </p>
            {customRolesLoading ? (
              <div className="d-flex justify-content-center align-items-center py-4">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span className="ms-2" style={{ color: "#6B7280", fontSize: "14px" }}>Loading custom roles...</span>
              </div>
            ) : customRoles.length === 0 ? (
              <p style={{ color: "#6B7280", fontSize: "14px", fontStyle: "italic" }}>
                No custom roles available.
              </p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {customRoles.map((role, index) => {
                  const roleId = role.id || `custom_role_${index}`;
                  const roleName = role.name || "Custom Role";
                  const roleDescription = role.description || "";
                  const privilegesCount = role.privileges_count || 0;
                  const assignedUsersCount = role.assigned_users_count || 0;
                  const assignedUsers = role.assigned_users || [];
                  const createdBy = role.created_by || null;
                  const isActive = role.is_active !== false; // Default to true if not specified
                  
                  // Check if current user has this custom role
                  // Note: This would need to be determined from userRoles if available
                  const hasRole = false; // Will be determined from user's custom role assignment
                  
                  // Check if there's a pending request for this custom role
                  // Custom roles are requested using their ID as the role value
                  const customRoleRequestValue = `custom_role_${role.id}`;
                  const pendingRequest = hasPendingRequest(customRoleRequestValue) || hasPendingRequest(role.id.toString());
                  
                  const isExpanded = expandedFirmRole === roleId;

                return (
                  <div
                    key={roleId}
                    className="border rounded-lg"
                    style={{
                      borderColor: pendingRequest 
                        ? "#FCD34D" // Yellow border for pending requests
                        : hasRole && isActive 
                        ? ROLE_TYPE_COLORS.firm_role.border 
                        : "#E5E7EB",
                      borderWidth: pendingRequest ? "2px" : "1px",
                      backgroundColor: pendingRequest
                        ? "#FEF3C715" // Light yellow background for pending requests
                        : hasRole && isActive 
                        ? `${ROLE_TYPE_COLORS.firm_role.bg}15` 
                        : "#FFFFFF",
                      transition: "all 0.2s ease",
                      boxShadow: pendingRequest ? "0 0 0 2px rgba(252, 211, 77, 0.2)" : "none"
                    }}
                  >
                    {/* Role Header */}
                    <div
                      className="d-flex align-items-center justify-content-between p-3"
                      style={{
                        cursor: privilegesCount > 0 ? "pointer" : "default"
                      }}
                      onClick={() => {
                        if (privilegesCount > 0) {
                          setExpandedFirmRole(isExpanded ? null : roleId);
                        }
                      }}
                    >
                      <div className="d-flex align-items-center gap-2 flex-grow-1">
                        <FiBriefcase 
                          size={16} 
                          color={hasRole && isActive 
                            ? ROLE_TYPE_COLORS.firm_role.text 
                            : "#6B7280"} 
                        />
                        <span
                          style={{
                            color: hasRole && isActive 
                              ? ROLE_TYPE_COLORS.firm_role.text 
                              : "#3B4A66",
                            fontSize: "14px",
                            fontWeight: "600"
                          }}
                        >
                          {roleName}
                        </span>
                        {hasRole && isActive && (
                          <span
                            style={{
                              fontSize: "10px",
                              backgroundColor: ROLE_TYPE_COLORS.firm_role.text,
                              color: "white",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              marginLeft: "4px"
                            }}
                          >
                            Active
                          </span>
                        )}
                        {pendingRequest && !hasRole && (
                          <span
                            style={{
                              fontSize: "10px",
                              backgroundColor: "#F59E0B",
                              color: "white",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              marginLeft: "4px"
                            }}
                          >
                            Pending
                          </span>
                        )}
                        {privilegesCount > 0 && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#6B7280",
                              marginLeft: "8px"
                            }}
                          >
                            ({privilegesCount} {privilegesCount === 1 ? "privilege" : "privileges"})
                          </span>
                        )}
                        {assignedUsersCount > 0 && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#6B7280",
                              marginLeft: "8px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <FiUsers size={12} />
                            {assignedUsersCount} {assignedUsersCount === 1 ? "user" : "users"}
                          </span>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {!hasRole && !pendingRequest && !isFirmAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestRole(`custom_role_${role.id}`, {
                                name: roleName,
                                description: roleDescription
                              });
                            }}
                            className="px-3 py-1 rounded border-0 d-flex align-items-center gap-1"
                            style={{
                              backgroundColor: "#F9FAFB",
                              color: "#3B4A66",
                              border: "1px solid #E5E7EB",
                              fontSize: "12px",
                              fontWeight: "500",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#F3F4F6";
                              e.currentTarget.style.borderColor = "#00C0C6";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#F9FAFB";
                              e.currentTarget.style.borderColor = "#E5E7EB";
                            }}
                          >
                            <FiPlus size={12} />
                            Request
                          </button>
                        )}
                        {privilegesCount > 0 && (
                          <div 
                            style={{ color: "#6B7280", cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedFirmRole(isExpanded ? null : roleId);
                            }}
                          >
                            {isExpanded ? (
                              <FiChevronUp size={18} />
                            ) : (
                              <FiChevronDown size={18} />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role Description */}
                    {roleDescription && (
                      <div className="px-3 pb-2">
                        <p
                          style={{
                            color: "#6B7280",
                            fontSize: "13px",
                            marginBottom: "0"
                          }}
                        >
                          {roleDescription}
                        </p>
                      </div>
                    )}

                    {/* Creator Info (Only for Firm Admins) */}
                    {isFirmAdmin && createdBy && (
                      <div className="px-3 pb-2">
                        <p
                          style={{
                            color: "#9CA3AF",
                            fontSize: "12px",
                            marginBottom: "0"
                          }}
                        >
                          Created by: {createdBy}
                        </p>
                      </div>
                    )}

                    {/* Assigned Users (Only for Firm Admins) */}
                    {isFirmAdmin && assignedUsers.length > 0 && (
                      <div className="px-3 pb-2">
                        <p
                          style={{
                            color: "#6B7280",
                            fontSize: "12px",
                            fontWeight: "600",
                            marginBottom: "8px"
                          }}
                        >
                          Assigned Users:
                        </p>
                        <div className="d-flex flex-column gap-1">
                          {assignedUsers.map((user, userIndex) => (
                            <div
                              key={userIndex}
                              className="d-flex align-items-center gap-2"
                              style={{
                                fontSize: "12px",
                                color: "#3B4A66"
                              }}
                            >
                              <FiUser size={12} />
                              <span>{user.full_name || user.email || user.username || 'Unknown User'}</span>
                              {user.email && user.full_name && (
                                <span style={{ color: "#9CA3AF" }}>({user.email})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Privileges Summary (Expandable) */}
                    {isExpanded && privilegesCount > 0 && (
                      <div
                        className="px-3 pb-3"
                        style={{
                          borderTop: "1px solid #E5E7EB",
                          backgroundColor: "#FAFBFC"
                        }}
                      >
                        <p
                          style={{
                            color: "#6B7280",
                            fontSize: "12px",
                            fontWeight: "600",
                            marginTop: "12px",
                            marginBottom: "8px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                          }}
                        >
                          Privileges Summary
                        </p>
                        <p
                          style={{
                            color: "#6B7280",
                            fontSize: "12px",
                            marginBottom: "0"
                          }}
                        >
                          This role has {privilegesCount} {privilegesCount === 1 ? "privilege" : "privileges"} configured.
                          {!isFirmAdmin && " Contact your firm admin for details."}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}

        {allRoles.user_roles.length === 0 && allRoles.firm_roles.length === 0 && (
          <p style={{ color: "#6B7280", fontSize: "14px", fontStyle: "italic" }}>
            No roles available.
          </p>
        )}
      </div>

      {/* Delete Role Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          if (!removingRole) {
            setShowDeleteConfirm(false);
            setRoleToDelete(null);
          }
        }}
        onConfirm={confirmDeleteRole}
        title="Remove Role"
        message={
          roleToDelete
            ? `Are you sure you want to remove the "${ROLE_DISPLAY_NAMES[roleToDelete] || roleToDelete}" role? This action cannot be undone.`
            : "Are you sure you want to remove this role? This action cannot be undone."
        }
        confirmText="Remove"
        cancelText="Cancel"
        isLoading={!!removingRole}
        isDestructive={true}
      />

      {/* Role Request Modal */}
      <RoleRequestModal
        show={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedRoleToRequest(null);
          setSelectedCustomRoleInfo(null);
        }}
        onSuccess={handleRequestSuccess}
        userRoles={allUserRoles}
        primaryRole={primaryRole}
        preselectedRole={selectedRoleToRequest}
        preselectedRoleName={selectedCustomRoleInfo?.name || null}
        preselectedRoleDescription={selectedCustomRoleInfo?.description || null}
      />
    </div>
  );
}

