import React, { useState, useEffect } from "react";
import { roleAPI, handleAPIError } from "../utils/apiUtils";
import { toast } from "react-toastify";

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

export default function RoleRequestsList({ refreshTrigger = 0 }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await roleAPI.getRoleRequests();
      
      if (response.success && response.data) {
        setRequests(response.data);
      } else {
        setError("Failed to load role requests");
      }
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      console.error("Error fetching role requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [refreshTrigger]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4" style={{ fontFamily: "BasisGrotesquePro" }}>
        <p style={{ color: "#6B7280" }}>Loading role requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4" style={{ fontFamily: "BasisGrotesquePro" }}>
        <p className="text-danger">{error}</p>
        <button
          className="btn btn-sm"
          onClick={fetchRequests}
          style={{
            backgroundColor: "#00C0C6",
            color: "white",
            border: "none",
            fontFamily: "BasisGrotesquePro"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-4" style={{ fontFamily: "BasisGrotesquePro" }}>
        <p style={{ color: "#6B7280" }}>No role requests found.</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "BasisGrotesquePro" }}>
      {requests.map((request) => {
        const statusColor = STATUS_COLORS[request.status] || STATUS_COLORS.pending;
        
        return (
          <div
            key={request.id}
            className="mb-3 p-3 rounded"
            style={{
              border: `1px solid ${statusColor.border}`,
              backgroundColor: statusColor.bg
            }}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h6
                  className="mb-1"
                  style={{
                    color: "#3B4A66",
                    fontWeight: "600",
                    fontSize: "16px"
                  }}
                >
                  {request.requested_role_display || request.requested_role}
                </h6>
                {request.firm && (
                  <p className="mb-1" style={{ color: "#6B7280", fontSize: "14px" }}>
                    Firm: {request.firm.name}
                  </p>
                )}
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
              <p className="mb-2" style={{ color: "#4B5563", fontSize: "14px" }}>
                <strong>Message:</strong> {request.message}
              </p>
            )}

            {request.review_notes && (
              <p className="mb-2" style={{ color: "#4B5563", fontSize: "14px" }}>
                <strong>Review Notes:</strong> {request.review_notes}
              </p>
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
              {request.reviewed_by && (
                <span style={{ fontSize: "12px", color: "#6B7280" }}>
                  By: {request.reviewed_by}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

