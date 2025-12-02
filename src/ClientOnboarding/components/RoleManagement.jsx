import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { roleAPI, handleAPIError } from "../utils/apiUtils";
import RoleRequestModal from "./RoleRequestModal";

const ROLE_DISPLAY_NAMES = {
  super_admin: "Super Admin",
  firm: "Firm Admin",
  staff: "Staff (Tax Preparer)",
  client: "Client (Taxpayer)"
};

export default function RoleManagement() {
  const [roles, setRoles] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [removingRole, setRemovingRole] = useState(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleAPI.getRoles();
      if (response.success && response.data) {
        setRoles(response.data);
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

  const handleAddRoleSuccess = () => {
    fetchRoles(); // Refresh roles after successful addition
  };

  const handleRemoveRole = async (role) => {
    if (!window.confirm(`Are you sure you want to remove the ${ROLE_DISPLAY_NAMES[role] || role} role? This action cannot be undone.`)) {
      return;
    }

    try {
      setRemovingRole(role);
      const response = await roleAPI.removeRole(role);
      
      if (response.success) {
        const { toast } = await import("react-toastify");
        toast.success(`Role '${ROLE_DISPLAY_NAMES[role] || role}' removed successfully`, {
          position: "top-right",
          autoClose: 3000,
        });
        fetchRoles(); // Refresh roles
      } else {
        const { toast } = await import("react-toastify");
        toast.error(response.message || "Failed to remove role", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      const { toast } = await import("react-toastify");
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setRemovingRole(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5" style={{ fontFamily: "BasisGrotesquePro" }}>
        <p style={{ color: "#6B7280" }}>Loading role information...</p>
      </div>
    );
  }

  const primaryUser = roles?.primary_user;
  const linkedUsers = roles?.linked_users || [];
  const allRoles = roles?.all_roles || [];
  const primaryRole = primaryUser?.role || "";
  const activeRole = roles?.active_role || primaryRole;

  // Super admin cannot have multiple roles or request additional roles
  if (activeRole === 'super_admin' || allRoles.includes('super_admin')) {
    return (
      <div style={{ fontFamily: "BasisGrotesquePro" }}>
        <div className="mb-4">
          <h6
            style={{
              color: "#3B4A66",
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px"
            }}
          >
            My Role
          </h6>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <span
              className="px-3 py-2 rounded"
              style={{
                backgroundColor: "#E0F2FE",
                color: "#0369A1",
                border: "1px solid #7DD3FC",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              {ROLE_DISPLAY_NAMES[primaryRole] || primaryRole} (Primary)
            </span>
          </div>
          <p style={{ color: "#6B7280", fontSize: "14px" }}>
            Super Admin accounts cannot have additional roles.
          </p>
        </div>
      </div>
    );
  }

  // Get available roles to add (filter out roles user already has)
  const getAvailableRoles = () => {
    const available = [];
    if (!allRoles.includes('staff')) {
      available.push({ value: 'staff', label: 'Staff (Tax Preparer)' });
    }
    if (!allRoles.includes('firm')) {
      available.push({ value: 'firm', label: 'Firm Admin' });
    }
    return available;
  };

  const availableRoles = getAvailableRoles();

  return (
    <div style={{ fontFamily: "BasisGrotesquePro" }}>
      {/* My Roles Section */}
      <div className="mb-4">
        <h6
          style={{
            color: "#3B4A66",
            fontSize: "18px",
            fontWeight: "600",
            marginBottom: "16px"
          }}
        >
          My Roles
        </h6>
        <div className="d-flex flex-wrap gap-2 mb-3">
          {primaryUser && (
            <span
              className="px-3 py-2 rounded"
              style={{
                backgroundColor: "#E0F2FE",
                color: "#0369A1",
                border: "1px solid #7DD3FC",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              {ROLE_DISPLAY_NAMES[primaryRole] || primaryRole} (Primary)
            </span>
          )}
          {linkedUsers.map((linkedUser) => (
            <span
              key={linkedUser.id}
              className="px-3 py-2 rounded d-flex align-items-center gap-2"
              style={{
                backgroundColor: "#F0FDF4",
                color: "#166534",
                border: "1px solid #86EFAC",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              {ROLE_DISPLAY_NAMES[linkedUser.role] || linkedUser.role}
              <button
                type="button"
                onClick={() => handleRemoveRole(linkedUser.role)}
                disabled={removingRole === linkedUser.role}
                className="btn-close btn-close-sm"
                style={{
                  fontSize: "10px",
                  opacity: removingRole === linkedUser.role ? 0.5 : 1,
                  cursor: removingRole === linkedUser.role ? "not-allowed" : "pointer"
                }}
                aria-label={`Remove ${linkedUser.role} role`}
              />
            </span>
          ))}
        </div>
        {availableRoles.length > 0 && (
          <Button
            onClick={() => setShowRequestModal(true)}
            style={{
              backgroundColor: "#00C0C6",
              border: "none",
              fontFamily: "BasisGrotesquePro",
              fontWeight: "500",
              padding: "8px 20px"
            }}
          >
            Add Role
          </Button>
        )}
        {availableRoles.length === 0 && (
          <p style={{ color: "#6B7280", fontSize: "14px" }}>
            You have all available roles.
          </p>
        )}
      </div>

      {/* Role Request Modal */}
      <RoleRequestModal
        show={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={handleAddRoleSuccess}
        userRoles={allRoles}
        primaryRole={primaryRole}
      />
    </div>
  );
}
