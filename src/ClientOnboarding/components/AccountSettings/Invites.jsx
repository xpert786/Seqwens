
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { userAPI, invitationAPI, handleAPIError } from "../../utils/apiUtils";
import "../../styles/Icon.css";
import { FiMail, FiBriefcase, FiUser, FiClock, FiCheck, FiX, FiArrowRight } from "react-icons/fi";

const Invites = () => {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedToken, setSelectedToken] = useState(null);
    const [rejecting, setRejecting] = useState(false);
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

    const handleDeclineInvite = (token) => {
        setSelectedToken(token);
        setShowRejectModal(true);
    };

    const confirmRejectInvite = async () => {
        if (!selectedToken) return;

        try {
            setRejecting(true);
            const response = await invitationAPI.declineInvitation(selectedToken);
            if (response.success) {
                toast.success(response.message || "Invitation rejected successfully", {
                    position: "top-right",
                    autoClose: 3000,
                    style: { borderRadius: "12px", fontFamily: "BasisGrotesquePro" }
                });
                await fetchInvites();
            } else {
                throw new Error(response.message || "Failed to reject invitation");
            }
        } catch (err) {
            console.error("Error rejecting invitation:", err);
            toast.error(handleAPIError(err));
        } finally {
            setRejecting(false);
            setShowRejectModal(false);
            setSelectedToken(null);
        }
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
                <div
                    className="d-flex flex-column align-items-center justify-content-center text-center px-4 py-5"
                    style={{
                        backgroundColor: "#F8FAFC",
                        borderRadius: "20px",
                        border: "2px dashed #E2E8F0",
                        minHeight: "300px"
                    }}
                >
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center mb-4"
                        style={{
                            width: "80px",
                            height: "80px",
                            backgroundColor: "#FFFFFF",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)"
                        }}
                    >
                        <FiMail size={32} style={{ color: "#94A3B8" }} />
                    </div>

                    <h5 style={{ color: "#3B4A66", fontWeight: "600" }}>No invitations yet</h5>
                    <p className="text-muted mx-auto" style={{ maxWidth: "300px", fontSize: "15px", lineHeight: "1.6" }}>
                        When a firm invites you to join their team, your pending requests will appear right here.
                    </p>

                    {/* Optional: Add a 'Refresh' button if relevant */}
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-link text-decoration-none mt-2"
                        style={{ color: "#00C0C6", fontWeight: "500", fontSize: "14px" }}
                    >
                        Check for updates
                    </button>
                </div>
            )}

            {/* Invites List */}
            <div className="d-flex flex-column gap-3">
                {invites.map((invite) => (
                    <div
                        key={invite.id}
                        className="card border-0 shadow-sm p-3 p-md-4" // Increased padding on tablet+
                        style={{ borderRadius: "16px", border: "1px solid #E8F0FF" }}
                    >
                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">

                            {/* Left Side: Info */}
                            <div className="d-flex gap-3 align-items-start align-items-sm-center">
                                <div
                                    className="rounded-circle d-flex flex-shrink-0 align-items-center justify-content-center"
                                    style={{ width: "48px", height: "48px", backgroundColor: "#E8F0FF", color: "#007AFF" }}
                                >
                                    <FiBriefcase size={20} />
                                </div>
                                <div>
                                    <h6 className="mb-1" style={{ color: "#3B4A66", fontWeight: "600", fontSize: "1.1rem" }}>
                                        {invite.firm_name}
                                    </h6>
                                    {/* Responsive Metadata Grid/Flex */}
                                    <div className="d-flex flex-wrap gap-x-3 gap-y-2 text-muted" style={{ fontSize: "13px" }}>
                                        <span className="d-flex align-items-center gap-1">
                                            <FiUser size={12} className="flex-shrink-0" />
                                            {invite.role_display}
                                        </span>
                                        <span className="d-flex align-items-center gap-1">
                                            <FiMail size={12} className="flex-shrink-0" />
                                            Invited by {invite.invited_by_name}
                                        </span>
                                        <span className="d-flex align-items-center gap-1">
                                            <FiClock size={12} className="flex-shrink-0" />
                                            Expires: {new Date(invite.expires_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Actions */}
                            <div className="d-flex gap-2 w-100 w-lg-auto mt-2 mt-lg-0">
                                <button
                                    onClick={() => handleReviewInvite(invite.token)}
                                    className="btn btn-primary flex-grow-1 flex-lg-grow-0 d-flex align-items-center justify-content-center gap-2"
                                    style={{
                                        backgroundColor: "#00C0C6",
                                        borderColor: "#00C0C6",
                                        padding: "10px 20px",
                                        borderRadius: "10px",
                                        fontWeight: "500"
                                    }}
                                >
                                    Review <span className="d-none d-sm-inline">Invite</span> <FiArrowRight size={14} />
                                </button>
                                <button
                                    onClick={() => handleDeclineInvite(invite.token)}
                                    className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2"
                                    style={{
                                        padding: "10px 20px",
                                        borderRadius: "10px",
                                        fontWeight: "500"
                                    }}
                                >
                                    <FiX size={14} /> <span className="d-sm-inline">Reject</span>
                                </button>
                            </div>

                        </div>
                    </div>
                ))}
            </div>

            {/* Reject Confirmation Modal */}
            {showRejectModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(19, 19, 35, 0.4)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1100,
                        padding: "20px",
                        animation: "fadeIn 0.2s ease-out"
                    }}
                    onClick={() => !rejecting && setShowRejectModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: "#FFFFFF",
                            width: "100%",
                            maxWidth: "400px",
                            borderRadius: "24px",
                            padding: "32px",
                            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                            position: "relative",
                            transform: "scale(1)",
                            animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="text-center mb-4">
                            <div
                                style={{
                                    width: "64px",
                                    height: "64px",
                                    backgroundColor: "#FFF5F5",
                                    color: "#FF4D4F",
                                    borderRadius: "20px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 20px",
                                    fontSize: "28px"
                                }}
                            >
                                <FiX />
                            </div>
                            <h4
                                style={{
                                    color: "#131323",
                                    fontSize: "20px",
                                    fontWeight: "700",
                                    fontFamily: "BasisGrotesquePro",
                                    marginBottom: "12px"
                                }}
                            >
                                Reject Invitation?
                            </h4>
                            <p
                                style={{
                                    color: "#6B7280",
                                    fontSize: "15px",
                                    lineHeight: "1.5",
                                    marginBottom: "0"
                                }}
                            >
                                Are you sure you want to reject this invitation? This action cannot be undone.
                            </p>
                        </div>

                        {/* Modal Actions */}
                        <div className="d-flex flex-column gap-2">
                            <button
                                onClick={confirmRejectInvite}
                                disabled={rejecting}
                                className="btn w-100"
                                style={{
                                    backgroundColor: "#FF4D4F",
                                    color: "#FFFFFF",
                                    padding: "12px",
                                    borderRadius: "12px",
                                    fontWeight: "600",
                                    fontSize: "15px",
                                    border: "none",
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 4px 12px rgba(255, 77, 79, 0.2)"
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#ff7875"}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#FF4D4F"}
                            >
                                {rejecting ? (
                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                ) : null}
                                {rejecting ? "Rejecting..." : "Yes, Reject Invite"}
                            </button>
                            <button
                                onClick={() => setShowRejectModal(false)}
                                disabled={rejecting}
                                className="btn w-100"
                                style={{
                                    backgroundColor: "#F9FAFB",
                                    color: "#4B5563",
                                    padding: "12px",
                                    borderRadius: "12px",
                                    fontWeight: "600",
                                    fontSize: "15px",
                                    border: "1px solid #E5E7EB",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#F3F4F6"}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#F9FAFB"}
                            >
                                Cancel
                            </button>
                        </div>

                        <style>
                            {`
                            @keyframes fadeIn {
                                from { opacity: 0; }
                                to { opacity: 1; }
                            }
                            @keyframes scaleIn {
                                from { transform: scale(0.9); opacity: 0; }
                                to { transform: scale(1); opacity: 1; }
                            }
                            `}
                        </style>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invites;
