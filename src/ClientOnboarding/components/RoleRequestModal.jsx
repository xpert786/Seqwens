import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { roleAPI, handleAPIError } from "../utils/apiUtils";
import { toast } from "react-toastify";

const ROLE_DISPLAY_NAMES = {
  super_admin: "Super Admin",
  firm: "Firm Admin",
  staff: "Staff (Tax Preparer)",
  client: "Client (Taxpayer)"
};

// Available roles that can be added
const AVAILABLE_ROLES = [
  { value: "staff", label: "Staff (Tax Preparer)" },
  { value: "firm", label: "Firm Admin" }
];

export default function RoleRequestModal({ show, onClose, onSuccess, userRoles = [], primaryRole = "" }) {
  const [requestedRole, setRequestedRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      setRequestedRole("");
      setErrors({});
    }
  }, [show]);

  // Filter available roles based on user's current role
  // - Clients can add: Staff (Tax Preparer)
  // - Staff can add: Firm (Firm Admin)
  // - Firm Admins can add: Staff (to also be a Tax Preparer)
  // - Super Admin cannot add roles (handled by hiding the button)
  const getAvailableRolesForUser = () => {
    const currentRole = primaryRole || userRoles[0] || "";
    
    if (currentRole === 'client') {
      // Clients can add Staff role
      return AVAILABLE_ROLES.filter(role => role.value === 'staff');
    } else if (currentRole === 'staff') {
      // Staff can add Firm role
      return AVAILABLE_ROLES.filter(role => role.value === 'firm');
    } else if (currentRole === 'firm') {
      // Firm Admins can add Staff role
      return AVAILABLE_ROLES.filter(role => role.value === 'staff');
    }
    
    // Default: show all available roles (backend will validate)
    return AVAILABLE_ROLES;
  };

  // Filter out roles user already has
  const availableRoles = getAvailableRolesForUser().filter(
    role => !userRoles.includes(role.value)
  );

  const validateForm = () => {
    const newErrors = {};
    
    if (!requestedRole) {
      newErrors.requestedRole = "Please select a role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await roleAPI.addRole(requestedRole);

      if (response.success) {
        toast.success(response.message || "Role added successfully", {
          position: "top-right",
          autoClose: 3000,
        });
        onSuccess?.();
        onClose();
      } else {
        toast.error(response.message || "Failed to add role", {
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
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton style={{ borderBottom: "1px solid #E8F0FF" }}>
        <Modal.Title
          style={{
            color: "#3B4A66",
            fontFamily: "BasisGrotesquePro",
            fontWeight: "600",
            fontSize: "20px"
          }}
        >
          Add Role
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontFamily: "BasisGrotesquePro" }}>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label style={{ color: "#3B4A66", fontWeight: "500" }}>
              Select Role <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={requestedRole}
              onChange={(e) => {
                setRequestedRole(e.target.value);
                setErrors(prev => ({ ...prev, requestedRole: "" }));
              }}
              isInvalid={!!errors.requestedRole}
              style={{
                borderColor: errors.requestedRole ? "#EF4444" : "#ced4da",
                fontFamily: "BasisGrotesquePro"
              }}
            >
              <option value="">Choose a role...</option>
              {availableRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Form.Select>
            {errors.requestedRole && (
              <Form.Text className="text-danger" style={{ fontSize: "12px" }}>
                {errors.requestedRole}
              </Form.Text>
            )}
            {availableRoles.length === 0 && (
              <Form.Text className="text-muted" style={{ fontSize: "12px" }}>
                You already have all available roles.
              </Form.Text>
            )}
          </Form.Group>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
              style={{
                fontFamily: "BasisGrotesquePro",
                border: "none"
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || availableRoles.length === 0}
              style={{
                backgroundColor: "#00C0C6",
                border: "none",
                fontFamily: "BasisGrotesquePro",
                fontWeight: "500"
              }}
            >
              {submitting ? "Adding..." : "Add Role"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
