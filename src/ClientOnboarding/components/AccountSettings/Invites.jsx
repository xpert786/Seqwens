
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { userAPI, handleAPIError } from "../../utils/apiUtils";
import "../../styles/Icon.css";
import { FaEnvelope, FaBuilding, FaUserTag, FaClock, FaCheck, FaTimes, FaExternalLinkAlt } from "react-icons/fa";

const Invites = () => {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchInvites = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await userAPI.getPendingInvites();
            if (response.success) {
                setInvites(response.invites || []);
            } else {
                throw new Error(response.message || "Failed to fetch invites");
            }
        } catch (err) {
            console.error("Error fetching invites:", err);
            setError(handleAPIError(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const handleReviewInvite = (token) => {
        // Redirect to the accept invite page with the token
        navigate(`/accept-invite?token=${token}`);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <span className="ms-2">Loading invitations...</span>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="align-items-center mb-4">
                <h5
                    className="mb-0 me-3"
                    style={{
                        color: "#3B4A66",
                        fontSize: "20px",
                        fontWeight: "500",
                        fontFamily: "BasisGrotesquePro",
                    }}
                >
                    Pending Invitations
                </h5>
                <p
                    className="mb-0"
                    style={{
                        color: "#4B5563",
                        fontSize: "14px",
                        fontWeight: "400",
                        fontFamily: "BasisGrotesquePro",
                    }}
                >
                    Manage your pending invitations to join other firms or roles
                </p>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {!loading && invites.length === 0 && !error && (
                <div className="text-center py-5 bg-light rounded-3">
                    <FaEnvelope className="text-secondary mb-3" style={{ fontSize: "2rem", opacity: 0.5 }} />
                    <p className="text-muted mb-0">You have no pending invitations at this time.</p>
                </div>
            )}

            {/* Invites List */}
            <div className="d-flex flex-column gap-3">
                {invites.map((invite) => (
                    <div
                        key={invite.id}
                        className="card border-0 shadow-sm p-3"
                        style={{ borderRadius: "12px", border: "1px solid #E8F0FF" }}
                    >
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                            <div className="d-flex gap-3 align-items-center">
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: "48px", height: "48px", backgroundColor: "#E8F0FF", color: "#007AFF" }}
                                >
                                    <FaBuilding size={20} />
                                </div>
                                <div>
                                    <h6 className="mb-1" style={{ color: "#3B4A66", fontWeight: "600" }}>
                                        {invite.firm_name}
                                    </h6>
                                    <div className="d-flex gap-3 text-muted" style={{ fontSize: "13px" }}>
                                        <span className="d-flex align-items-center gap-1">
                                            <FaUserTag size={12} />
                                            {invite.role_display}
                                        </span>
                                        <span className="d-flex align-items-center gap-1">
                                            <FaEnvelope size={12} />
                                            Invited by {invite.invited_by_name}
                                        </span>
                                        <span className="d-flex align-items-center gap-1">
                                            <FaClock size={12} />
                                            Expires: {new Date(invite.expires_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex gap-2">
                                <button
                                    onClick={() => handleReviewInvite(invite.token)}
                                    className="btn btn-primary d-flex align-items-center gap-2"
                                    style={{
                                        backgroundColor: "#00C0C6",
                                        borderColor: "#00C0C6",
                                        padding: "8px 20px",
                                        borderRadius: "8px",
                                        fontWeight: "500"
                                    }}
                                >
                                    Review Invite <FaExternalLinkAlt size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Invites;
