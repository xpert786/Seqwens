import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { roleAPI, handleAPIError } from "../utils/apiUtils";
import { toast } from "react-toastify";

export default function RoleRequestModal({ show, onClose, onSuccess, userRoles = [], primaryRole = "" }) {
  const [requestedRole, setRequestedRole] = useState("");
  const [firmName, setFirmName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [errors, setErrors] = useState({});

  // Fetch available roles from API
  useEffect(() => {
    if (show) {
      fetchAvailableRoles();
    }
  }, [show]);

  const fetchAvailableRoles = async () => {
    try {
      setLoading(true);
      const response = await roleAPI.getAvailableRoles();
      
      if (response.success && response.data) {
        // Filter out roles user already has
        const currentRoles = response.data.current_roles || [];
        const available = (response.data.available_roles || []).filter(
          role => !currentRoles.includes(role.role)
        );
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!requestedRole) {
      newErrors.requestedRole = "Please select a role";
    }

    // Check if firm name is required
    if (selectedRoleData?.requires_firm_name && !firmName.trim()) {
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
        selectedRoleData?.requires_firm_name ? firmName.trim() : null,
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
                  setRequestedRole(e.target.value);
                  setFirmName(""); // Reset firm name when role changes
                  setErrors(prev => ({ ...prev, requestedRole: "", firmName: "" }));
                }}
                isInvalid={!!errors.requestedRole}
                style={{
                  borderColor: errors.requestedRole ? "#EF4444" : "#ced4da",
                  fontFamily: "BasisGrotesquePro"
                }}
              >
                <option value="">Choose a role...</option>
                {availableRoles.map((role) => (
                  <option key={role.role} value={role.role}>
                    {role.display_name}
                    {role.has_pending_request && " (Request Pending)"}
                  </option>
                ))}
              </Form.Select>
              {errors.requestedRole && (
                <Form.Text className="text-danger" style={{ fontSize: "12px" }}>
                  {errors.requestedRole}
                </Form.Text>
              )}
              {selectedRoleData && (
                <Form.Text className="text-muted" style={{ fontSize: "12px", display: "block", marginTop: "8px" }}>
                  {selectedRoleData.description}
                  {selectedRoleData.requires_superadmin_approval && (
                    <span className="d-block mt-1" style={{ color: "#F59E0B" }}>
                      ⚠️ Requires superadmin approval
                    </span>
                  )}
                </Form.Text>
              )}
              {availableRoles.length === 0 && !loading && (
                <Form.Text className="text-muted" style={{ fontSize: "12px" }}>
                  You already have all available roles.
                </Form.Text>
              )}
            </Form.Group>

            {/* Firm Name Field - Show only if required */}
            {selectedRoleData?.requires_firm_name && (
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
              disabled={submitting || availableRoles.length === 0 || selectedRoleData?.has_pending_request}
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
