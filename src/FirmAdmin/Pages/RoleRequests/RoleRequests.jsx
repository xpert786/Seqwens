import React, { useState, useEffect } from "react";
import { roleAPI, handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
import { Modal, Button, Form } from "react-bootstrap";

const STATUS_COLORS = {
  pending: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  approved: { bg: "#D1FAE5", text: "#065F46", border: "#34D399" },
  rejected: { bg: "#FEE2E2", text: "#991B1B", border: "#F87171" },
  cancelled: { bg: "#F3F4F6", text: "#374151", border: "#9CA3AF" }
};

const STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled"
};

export default function RoleRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async (status = "pending") => {
    try {
      setLoading(true);
      const response = await roleAPI.getFirmRoleRequests(status);
      
      if (response.success && response.data) {
        setRequests(response.data);
      } else {
        toast.error("Failed to load role requests", {
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(activeTab);
  }, [activeTab]);

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      const response = await roleAPI.approveRoleRequest(
        selectedRequest.id,
        reviewNotes
      );

      if (response.success) {
        toast.success("Role request approved successfully", {
          position: "top-right",
          autoClose: 3000,
        });
        setShowApproveModal(false);
        setSelectedRequest(null);
        setReviewNotes("");
        fetchRequests(activeTab);
      } else {
        toast.error(response.message || "Failed to approve request", {
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
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      const response = await roleAPI.rejectRoleRequest(
        selectedRequest.id,
        reviewNotes
      );

      if (response.success) {
        toast.success("Role request rejected", {
          position: "top-right",
          autoClose: 3000,
        });
        setShowRejectModal(false);
        setSelectedRequest(null);
        setReviewNotes("");
        fetchRequests(activeTab);
      } else {
        toast.error(response.message || "Failed to reject request", {
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
      setProcessing(false);
    }
  };

  const openApproveModal = (request) => {
    setSelectedRequest(request);
    setReviewNotes("");
    setShowApproveModal(true);
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setReviewNotes("");
    setShowRejectModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  const tabs = [
    { id: "pending", label: "Pending", count: requests.filter(r => r.status === "pending").length },
    { id: "approved", label: "Approved", count: requests.filter(r => r.status === "approved").length },
    { id: "rejected", label: "Rejected", count: requests.filter(r => r.status === "rejected").length }
  ];

  return (
    <div className="container-fluid px-4" style={{ fontFamily: "BasisGrotesquePro" }}>
      <div className="align-items-center mb-4">
        <h5
          className="mb-0 me-3"
          style={{
            color: "#3B4A66",
            fontSize: "28px",
            fontWeight: "500",
            fontFamily: "BasisGrotesquePro",
          }}
        >
          Role Requests
        </h5>
        <p
          className="mb-0"
          style={{
            color: "#4B5563",
            fontSize: "16px",
            fontWeight: "400",
            fontFamily: "BasisGrotesquePro",
          }}
        >
          Review and manage role requests from users
        </p>
      </div>

      {/* Tabs */}
      <div
        className="d-inline-block mb-4"
        style={{
          padding: "10px 12px",
          borderRadius: "12px",
          backgroundColor: "#FFFFFF",
          fontSize: "14px",
          fontWeight: "400",
          fontFamily: "BasisGrotesquePro",
          boxShadow: "0 0 0 1px #E8F0FF"
        }}
      >
        <ul
          className="d-flex gap-2 mb-0"
          style={{ listStyle: "none", padding: 0, margin: 0 }}
        >
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 22px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "15px",
                  fontFamily: "BasisGrotesquePro",
                  backgroundColor: activeTab === tab.id ? "#00C0C6" : "transparent",
                  color: activeTab === tab.id ? "#ffffff" : "#3B4A66",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
              >
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Requests List */}
      <div className="card" style={{ borderRadius: "15px", border: "1px solid #E8F0FF" }}>
        <div className="card-body" style={{ padding: "28px" }}>
          {loading ? (
            <div className="text-center py-5">
              <p style={{ color: "#6B7280" }}>Loading role requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-5">
              <p style={{ color: "#6B7280" }}>No {activeTab} requests found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => {
                const statusColor = STATUS_COLORS[request.status] || STATUS_COLORS.pending;
                
                return (
                  <div
                    key={request.id}
                    className="mb-3 p-4 rounded"
                    style={{
                      border: `1px solid ${statusColor.border}`,
                      backgroundColor: statusColor.bg
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h6
                          className="mb-1"
                          style={{
                            color: "#3B4A66",
                            fontWeight: "600",
                            fontSize: "18px"
                          }}
                        >
                          {request.user?.full_name || `${request.user?.email || "User"}`}
                        </h6>
                        <p className="mb-1" style={{ color: "#6B7280", fontSize: "14px" }}>
                          {request.user?.email}
                        </p>
                        <p className="mb-1" style={{ color: "#6B7280", fontSize: "14px" }}>
                          Current Roles: {request.user?.current_roles?.map(role => role).join(", ") || "None"}
                        </p>
                        <p className="mb-1" style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500" }}>
                          Requesting: {request.requested_role_display || request.requested_role}
                        </p>
                      </div>
                      <span
                        className="px-3 py-1 rounded"
                        style={{
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                          border: `1px solid ${statusColor.border}`,
                          fontSize: "12px",
                          fontWeight: "600",
                          textTransform: "uppercase"
                        }}
                      >
                        {STATUS_LABELS[request.status] || request.status}
                      </span>
                    </div>

                    {request.message && (
                      <div className="mb-3">
                        <p style={{ color: "#4B5563", fontSize: "14px", marginBottom: "4px", fontWeight: "500" }}>
                          Message:
                        </p>
                        <p style={{ color: "#4B5563", fontSize: "14px" }}>
                          {request.message}
                        </p>
                      </div>
                    )}

                    {request.review_notes && (
                      <div className="mb-3">
                        <p style={{ color: "#4B5563", fontSize: "14px", marginBottom: "4px", fontWeight: "500" }}>
                          Review Notes:
                        </p>
                        <p style={{ color: "#4B5563", fontSize: "14px" }}>
                          {request.review_notes}
                        </p>
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center">
                      <div style={{ fontSize: "12px", color: "#6B7280" }}>
                        <span>Requested: {formatDate(request.created_at)}</span>
                        {request.reviewed_at && (
                          <span className="ms-3">
                            Reviewed: {formatDate(request.reviewed_at)}
                          </span>
                        )}
                      </div>
                      {request.status === "pending" && (
                        <div className="d-flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => openApproveModal(request)}
                            style={{
                              backgroundColor: "#10B981",
                              border: "none",
                              fontFamily: "BasisGrotesquePro",
                              fontWeight: "500"
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => openRejectModal(request)}
                            style={{
                              backgroundColor: "#EF4444",
                              border: "none",
                              fontFamily: "BasisGrotesquePro",
                              fontWeight: "500"
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontFamily: "BasisGrotesquePro", fontWeight: "600" }}>
            Approve Role Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontFamily: "BasisGrotesquePro" }}>
          {selectedRequest && (
            <>
              <p>
                <strong>User:</strong> {selectedRequest.user?.full_name || selectedRequest.user?.email}
              </p>
              <p>
                <strong>Requesting:</strong> {selectedRequest.requested_role_display || selectedRequest.requested_role}
              </p>
              <Form.Group className="mt-3">
                <Form.Label>Review Notes (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this approval..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowApproveModal(false)}
            disabled={processing}
            style={{ fontFamily: "BasisGrotesquePro" }}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleApprove}
            disabled={processing}
            style={{
              backgroundColor: "#10B981",
              border: "none",
              fontFamily: "BasisGrotesquePro",
              fontWeight: "500"
            }}
          >
            {processing ? "Processing..." : "Confirm Approve"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontFamily: "BasisGrotesquePro", fontWeight: "600" }}>
            Reject Role Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontFamily: "BasisGrotesquePro" }}>
          {selectedRequest && (
            <>
              <p>
                <strong>User:</strong> {selectedRequest.user?.full_name || selectedRequest.user?.email}
              </p>
              <p>
                <strong>Requesting:</strong> {selectedRequest.requested_role_display || selectedRequest.requested_role}
              </p>
              <Form.Group className="mt-3">
                <Form.Label>Review Notes (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this rejection..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowRejectModal(false)}
            disabled={processing}
            style={{ fontFamily: "BasisGrotesquePro" }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleReject}
            disabled={processing}
            style={{
              backgroundColor: "#EF4444",
              border: "none",
              fontFamily: "BasisGrotesquePro",
              fontWeight: "500"
            }}
          >
            {processing ? "Processing..." : "Confirm Reject"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

