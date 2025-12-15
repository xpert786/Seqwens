import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { roleAPI, handleAPIError } from "../utils/apiUtils";
import { toast } from "react-toastify";

export default function RoleRequestModal({ show, onClose, onSuccess, userRoles = [], primaryRole = "", preselectedRole = null, preselectedRoleName = null, preselectedRoleDescription = null }) {
  const [requestedRole, setRequestedRole] = useState("");
  const [firmName, setFirmName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [errors, setErrors] = useState({});
  
  // Check if preselected role is a custom role
  const isCustomRole = preselectedRole && (preselectedRole.startsWith('custom_role_') || preselectedRoleName);

  // Fetch available roles from API
  useEffect(() => {
    if (show) {
      fetchAvailableRoles();
    }
  }, [show]);

  // Set preselected role when modal opens or preselectedRole changes
  useEffect(() => {
    if (show && preselectedRole) {
      setRequestedRole(preselectedRole);
    }
  }, [show, preselectedRole]);

  const fetchAvailableRoles = async () => {
    try {
      setLoading(true);
      const response = await roleAPI.getAvailableRoles();
      
      if (response.success && response.data) {
        // Filter out roles user already has
        const currentRoles = response.data.current_roles || [];
        let available = (response.data.available_roles || []).filter(
          role => !currentRoles.includes(role.role)
        );
        
        // Filter out duplicate roles - if both staff and tax_preparer exist, keep only tax_preparer
        const hasTaxPreparer = available.some(r => r.role === "tax_preparer");
        if (hasTaxPreparer) {
          available = available.filter(r => r.role !== "staff");
        }
        
        setAvailableRoles(available);
      } else {
        toast.error(response.message || "Failed to load available roles", {
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
      console.error("Error fetching available roles:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      setRequestedRole("");
      setFirmName("");
      setMessage("");
      setErrors({});
    }
  }, [show]);

  // Get selected role details
  const selectedRoleData = availableRoles.find(r => r.role === requestedRole);
  
  // For custom roles, create a role data object
  const customRoleData = isCustomRole && preselectedRole ? {
    role: preselectedRole,
    display_name: preselectedRoleName || preselectedRole,
    description: preselectedRoleDescription || "Custom Firm Role",
    requires_firm_name: false,
    requires_superadmin_approval: false
  } : null;
  
  // Use custom role data if it's a custom role, otherwise use selectedRoleData
  const effectiveRoleData = customRoleData || selectedRoleData;

  const validateForm = () => {
    const newErrors = {};
    
    if (!requestedRole) {
      newErrors.requestedRole = "Please select a role";
    }

    // Check if firm name is required
    if (effectiveRoleData?.requires_firm_name && !firmName.trim()) {
      newErrors.firmName = "Firm name is required for this role";
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
      const response = await roleAPI.addRole(
        requestedRole,
        effectiveRoleData?.requires_firm_name ? firmName.trim() : null,
        message.trim() || null
      );

      if (response.success) {
        toast.success(response.message || "Role request submitted successfully", {
          position: "top-right",
          autoClose: 3000,
        });
        onSuccess?.();
        onClose();
      } else {
        toast.error(response.message || "Failed to submit role request", {
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
        {loading ? (
          <div className="text-center py-4">
            <p style={{ color: "#6B7280" }}>Loading available roles...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: "#3B4A66", fontWeight: "500" }}>
                Select Role <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={requestedRole}
                onChange={(e) => {
                  if (!preselectedRole) {
                    setRequestedRole(e.target.value);
                    setFirmName(""); // Reset firm name when role changes
                    setErrors(prev => ({ ...prev, requestedRole: "", firmName: "" }));
                  }
                }}
                isInvalid={!!errors.requestedRole}
                disabled={!!preselectedRole || (!!requestedRole && !isCustomRole)}
                style={{
                  borderColor: errors.requestedRole ? "#EF4444" : "#ced4da",
                  fontFamily: "BasisGrotesquePro",
                  backgroundColor: (preselectedRole || (requestedRole && !isCustomRole)) ? "#F9FAFB" : "white",
                  cursor: (preselectedRole || (requestedRole && !isCustomRole)) ? "not-allowed" : "pointer"
                }}
              >
                <option value="">Choose a role...</option>
                {availableRoles.map((role) => (
                  <option key={role.role} value={role.role}>
                    {role.display_name}
                    {role.has_pending_request && " (Request Pending)"}
                  </option>
                ))}
                {/* Show custom role in dropdown if preselected */}
                {isCustomRole && preselectedRole && !availableRoles.find(r => r.role === preselectedRole) && (
                  <option value={preselectedRole} disabled>
                    {preselectedRoleName || preselectedRole}
                  </option>
                )}
              </Form.Select>
              {(preselectedRole || requestedRole) && (
                <Form.Text className="text-muted" style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>
                  Role selected: {effectiveRoleData?.display_name || availableRoles.find(r => r.role === (preselectedRole || requestedRole))?.display_name || (preselectedRole || requestedRole)}
                </Form.Text>
              )}
              {errors.requestedRole && (
                <Form.Text className="text-danger" style={{ fontSize: "12px" }}>
                  {errors.requestedRole}
                </Form.Text>
              )}
              {effectiveRoleData && (
                <Form.Text className="text-muted" style={{ fontSize: "12px", display: "block", marginTop: "8px" }}>
                  {effectiveRoleData.description}
                  {effectiveRoleData.requires_superadmin_approval && (
                    <span className="d-block mt-1" style={{ color: "#F59E0B" }}>
                      ⚠️ Requires superadmin approval
                    </span>
                  )}
                </Form.Text>
              )}
              {availableRoles.length === 0 && !loading && !isCustomRole && (
                <Form.Text className="text-muted" style={{ fontSize: "12px" }}>
                  You already have all available roles.
                </Form.Text>
              )}
            </Form.Group>

            {/* Firm Name Field - Show only if required */}
            {effectiveRoleData?.requires_firm_name && (
              <Form.Group className="mb-3">
                <Form.Label style={{ color: "#3B4A66", fontWeight: "500" }}>
                  Firm Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={firmName}
                  onChange={(e) => {
                    setFirmName(e.target.value);
                    setErrors(prev => ({ ...prev, firmName: "" }));
                  }}
                  isInvalid={!!errors.firmName}
                  placeholder="Enter your firm name"
                  style={{
                    borderColor: errors.firmName ? "#EF4444" : "#ced4da",
                    fontFamily: "BasisGrotesquePro"
                  }}
                />
                {errors.firmName && (
                  <Form.Text className="text-danger" style={{ fontSize: "12px" }}>
                    {errors.firmName}
                  </Form.Text>
                )}
              </Form.Group>
            )}

            {/* Optional Message Field */}
            <Form.Group className="mb-3">
              <Form.Label style={{ color: "#3B4A66", fontWeight: "500" }}>
                Message (Optional)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add any additional information about your role request..."
                style={{
                  fontFamily: "BasisGrotesquePro",
                  resize: "vertical"
                }}
              />
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
              disabled={submitting || (!isCustomRole && availableRoles.length === 0) || effectiveRoleData?.has_pending_request}
              style={{
                backgroundColor: "#00C0C6",
                border: "none",
                fontFamily: "BasisGrotesquePro",
                fontWeight: "500"
              }}
            >
              {submitting ? "Submitting..." : "Request Role"}
            </Button>
          </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}
