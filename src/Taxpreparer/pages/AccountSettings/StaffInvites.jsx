import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { taxPreparerStaffInvitesAPI, handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import { getStorage } from "../../../ClientOnboarding/utils/userUtils";
import Pagination from "../../../ClientOnboarding/components/Pagination";
import DataSharingModal from "../../../ClientOnboarding/components/DataSharingModal";
import ConfirmationModal from "../../../components/ConfirmationModal";
import { Inbox } from "lucide-react";

export default function StaffInvites() {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        page_size: 10,
        total_count: 0,
        total_pages: 1
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [processingInvite, setProcessingInvite] = useState(null);
    const [showDataSharingModal, setShowDataSharingModal] = useState(false);
    const [selectedInvite, setSelectedInvite] = useState(null);
    const [dataSharingDecision, setDataSharingDecision] = useState("all");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [declineReason, setDeclineReason] = useState("");
    const [hasExistingMemberships, setHasExistingMemberships] = useState(null); // Cache memberships check
    const [currentFirmInfo, setCurrentFirmInfo] = useState(null); // Store current firm info for modal

    // Fetch pending invites
    const fetchInvites = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page,
                page_size: pagination.page_size,
            };

            if (searchTerm.trim()) {
                params.search = searchTerm.trim();
            }

            const response = await taxPreparerStaffInvitesAPI.getPendingInvites(params);

            if (response.success && response.data) {
                setInvites(response.data.invites || []);
                setPagination({
                    page: response.data.pagination?.page || page,
                    page_size: response.data.pagination?.page_size || 10,
                    total_count: response.data.pagination?.total_count || 0,
                    total_pages: response.data.pagination?.total_pages || 1
                });
            } else {
                throw new Error(response.message || 'Failed to fetch invites');
            }
        } catch (err) {
            console.error('Error fetching invites:', err);
            setError(handleAPIError(err));
            setInvites([]);
            toast.error(handleAPIError(err) || 'Failed to load invites');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites(currentPage);
    }, [currentPage]);

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage === 1) {
                fetchInvites(1);
            } else {
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Check if user has multiple firm memberships (for data sharing modal)
    // Uses cached value if available to avoid unnecessary API calls
    const checkDataSharingNeeded = async () => {
        // Return cached value if available
        if (hasExistingMemberships !== null) {
            return hasExistingMemberships;
        }

        try {
            const { userAPI } = await import("../../../ClientOnboarding/utils/apiUtils");
            const response = await userAPI.getMemberships();

            // Handle both direct array and response object
            const memberships = Array.isArray(response) ? response : (response?.data || response?.memberships || []);

            const hasMemberships = memberships && memberships.length > 0;

            // Store current firm info for modal
            if (hasMemberships && memberships.length > 0) {
                // Get current firm from userData or first membership
                const storage = getStorage();
                const userDataStr = storage?.getItem('userData');
                if (userDataStr) {
                    try {
                        const userData = JSON.parse(userDataStr);
                        const currentFirmId = userData.firm?.id || userData.firm_id;
                        const currentMembership = memberships.find(
                            (m) => m.firm?.id === currentFirmId || m.firm_id === currentFirmId
                        ) || memberships[0];

                        if (currentMembership) {
                            setCurrentFirmInfo({
                                name: currentMembership.firm?.name || 'Current Firm',
                                id: currentMembership.firm?.id || currentMembership.firm_id
                            });
                        }
                    } catch (e) {
                        // Silently handle parsing errors
                    }
                }
            }

            // Cache the result
            setHasExistingMemberships(hasMemberships);

            return hasMemberships;
        } catch (err) {
            // If API fails, assume no existing memberships
            console.log('Error checking memberships (expected for new users):', err);
            setHasExistingMemberships(false);
            return false;
        }
    };

    // Handle accept invite
    const handleAcceptInvite = async (invite) => {
        if (!invite || !invite.id) {
            console.error('Invalid invite object:', invite);
            toast.error('Invalid invite data');
            return;
        }

        console.log('✅ Accept invite clicked for invite ID:', invite.id);

        try {
            setProcessingInvite(invite.id);

            // Check if data sharing modal is needed (only if user might have existing memberships)
            let needsDataSharing = false;
            try {
                console.log('🔍 Checking if data sharing modal is needed...');
                needsDataSharing = await checkDataSharingNeeded();
                console.log('📊 Needs data sharing:', needsDataSharing);
            } catch (membershipCheckError) {
                // If membership check fails, proceed with accepting (assume no existing memberships)
                console.log('⚠️ Membership check failed, proceeding with accept:', membershipCheckError);
                needsDataSharing = false;
            }

            if (needsDataSharing) {
                console.log('📋 Showing data sharing modal');
                setSelectedInvite(invite);
                setShowDataSharingModal(true);
                setProcessingInvite(null);
                return;
            }

            // Accept directly - call the accept invite API
            console.log('✅ No data sharing needed, calling accept invite API directly...');
            console.log('📞 Will call: POST /user/tax-preparer/staff-invites/' + invite.id + '/accept/');
            await acceptInviteDirectly(invite.id);
        } catch (err) {
            console.error('❌ Error in handleAcceptInvite:', err);
            toast.error(handleAPIError(err) || 'Failed to accept invite');
            setProcessingInvite(null);
        }
    };

    // Accept invite directly (after data sharing decision)
    const acceptInviteDirectly = async (inviteId, dataSharingScope = null, categories = []) => {
        if (!inviteId) {
            console.error('❌ Invalid invite ID:', inviteId);
            toast.error('Invalid invite ID');
            setProcessingInvite(null);
            return;
        }

        try {
            setProcessingInvite(inviteId);
            console.log('📤 Calling acceptInvite API with:', { inviteId, dataSharingScope, categories });

            const payload = {};
            if (dataSharingScope) {
                payload.data_sharing_scope = dataSharingScope;
            }
            if (categories && categories.length > 0) {
                payload.selected_categories = categories;
            }

            console.log('📦 API payload:', payload);
            console.log('🌐 Making API call to: /user/tax-preparer/staff-invites/' + inviteId + '/accept/');
            const response = await taxPreparerStaffInvitesAPI.acceptInvite(inviteId, payload);
            console.log('📥 Accept invite API response:', response);

            if (response && response.success) {
                toast.success(response.message || "Invite accepted successfully!");
                setShowDataSharingModal(false);
                setSelectedInvite(null);
                setDataSharingDecision("all");
                setSelectedCategories([]);
                // Clear cached memberships so it will be rechecked next time
                setHasExistingMemberships(null);
                // Refresh the invites list
                await fetchInvites(currentPage);
            } else {
                const errorMsg = response?.message || 'Failed to accept invite';
                console.error('API returned unsuccessful response:', response);
                throw new Error(errorMsg);
            }
        } catch (err) {
            console.error('Error accepting invite:', err);
            const errorMessage = err?.message || handleAPIError(err) || 'Failed to accept invite';
            toast.error(errorMessage);
        } finally {
            setProcessingInvite(null);
        }
    };

    // Handle data sharing confirmation
    const handleDataSharingConfirm = (data) => {
        if (!selectedInvite || !selectedInvite.id) {
            console.error('❌ No invite selected for data sharing confirmation');
            toast.error('No invite selected');
            return;
        }

        console.log('✅ Data sharing confirmed for invite ID:', selectedInvite.id);
        console.log('📊 Data sharing data:', data);

        // Map scope values: "All" -> "all", "None" -> "none", "Selected" -> "selected"
        const scopeMap = {
            'All': 'all',
            'None': 'none',
            'Selected': 'selected'
        };

        const dataSharingScope = scopeMap[data.scope] || data.scope || 'all';
        const categories = data.selectedCategories || [];

        console.log('📞 Calling accept invite API with data sharing scope:', dataSharingScope);
        acceptInviteDirectly(selectedInvite.id, dataSharingScope, categories);
    };

    // Handle decline invite
    const handleDeclineInvite = async (invite) => {
        setSelectedInvite(invite);
        setShowDeclineModal(true);
    };

    // Confirm decline
    const confirmDecline = async () => {
        if (!selectedInvite) return;

        try {
            setProcessingInvite(selectedInvite.id);

            const response = await taxPreparerStaffInvitesAPI.declineInvite(
                selectedInvite.id,
                declineReason.trim() || null
            );

            if (response.success) {
                toast.success(response.message || "Invite declined successfully");
                setShowDeclineModal(false);
                setSelectedInvite(null);
                setDeclineReason("");
                fetchInvites(currentPage);
            } else {
                throw new Error(response.message || 'Failed to decline invite');
            }
        } catch (err) {
            console.error('Error declining invite:', err);
            toast.error(handleAPIError(err) || 'Failed to decline invite');
        } finally {
            setProcessingInvite(null);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });
        } catch (e) {
            return dateString;
        }
    };

    // Calculate days until expiry
    const getDaysUntilExpiry = (expiresAt) => {
        if (!expiresAt) return null;
        try {
            const expiry = new Date(expiresAt);
            const now = new Date();
            const diffTime = expiry - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch (e) {
            return null;
        }
    };

    // Pagination calculations
    const startIndex = (pagination.page - 1) * pagination.page_size;
    const endIndex = Math.min(startIndex + pagination.page_size, pagination.total_count);

    return (
        <div style={{ fontFamily: "BasisGrotesquePro" }}>
            {/* Header */}
            <div className="mb-4">
                <h6
                    style={{
                        color: "#3B4A66",
                        fontSize: "20px",
                        fontWeight: "600",
                        marginBottom: "8px",
                    }}
                >
                    Staff Invites
                </h6>
                <p
                    style={{
                        color: "#6B7280",
                        fontSize: "14px",
                        marginBottom: 0,
                    }}
                >
                    View and manage your pending staff invitations from firms
                </p>
            </div>
            {/* Search Bar */}
            <div className="mb-4">
                <div className="position-relative" style={{ maxWidth: '400px' }}>
                    <input
                        type="text"
                        className="form-control"
                            placeholder="Search by firm name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: "10px 16px 10px 40px",
                            borderRadius: "8px",
                            border: "1px solid #E8F0FF",
                            fontSize: "14px",
                            fontFamily: "BasisGrotesquePro",
                        }}
                    />
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#9CA3AF",
                        }}
                    >
                        <path
                            d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M14 14L11.1 11.1"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3" style={{ color: "#6B7280", fontFamily: "BasisGrotesquePro" }}>
                        Loading invites...
                    </p>
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="text-center py-5">
                    <p className="text-danger" style={{ fontFamily: "BasisGrotesquePro" }}>{error}</p>
                    <button
                        className="btn btn-primary mt-3"
                        onClick={() => fetchInvites(currentPage)}
                        style={{
                            backgroundColor: "#00C0C6",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 20px",
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && invites.length === 0 && (
                <div
                    className="d-flex align-items-center justify-content-center py-4 px-4 gap-3"
                    style={{
                        backgroundColor: "#F9FAFB",
                        borderRadius: "12px",
                        border: "1px dashed #E5E7EB",
                        minHeight: "120px"
                    }}
                >
                    <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "#F3F4F6",
                            borderRadius: "10px",
                            color: "#9CA3AF"
                        }}
                    >
                        <Inbox size={20} />
                    </div>
                    <div className="text-start">
                        <p className="mb-0" style={{ color: "#6B7280", fontFamily: "BasisGrotesquePro", fontSize: "14px", fontWeight: "500" }}>
                            {searchTerm ? "No invites found matching your search" : "No pending invites"}
                        </p>
                        {searchTerm && (
                            <button
                                className="btn btn-link p-0 mt-1"
                                onClick={() => {
                                    setSearchTerm("");
                                    setCurrentPage(1);
                                }}
                                style={{ color: "#00C0C6", textDecoration: "none", fontSize: "13px" }}
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Invites List */}
            {!loading && !error && invites.length > 0 && (
                <div className="mb-4">
                    {invites.map((invite) => {
                        const daysUntilExpiry = getDaysUntilExpiry(invite.expires_at);
                        const isExpired = invite.is_expired || (daysUntilExpiry !== null && daysUntilExpiry < 0);
                        const isProcessing = processingInvite === invite.id;

                        console.log('Rendering invite:', invite.id, 'isProcessing:', isProcessing);

                        return (
                            <div
                                key={invite.id}
                                className="mb-3 p-4"
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    borderRadius: "12px",
                                    border: "1px solid #E8F0FF",
                                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                                }}
                            >
                                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                                    {/* Left Section - Firm Info */}
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center gap-3 mb-2">
                                            {invite.firm_logo && (
                                                <img
                                                    src={invite.firm_logo}
                                                    alt={invite.firm_name}
                                                    style={{
                                                        width: "48px",
                                                        height: "48px",
                                                        borderRadius: "8px",
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            )}
                                            <div>
                                                <h6
                                                    style={{
                                                        color: "#3B4A66",
                                                        fontSize: "16px",
                                                        fontWeight: "600",
                                                        marginBottom: "4px",
                                                    }}
                                                >
                                                    {invite.firm_name || "Unknown Firm"}
                                                </h6>
                                                <p
                                                    style={{
                                                        color: "#6B7280",
                                                        fontSize: "14px",
                                                        marginBottom: 0,
                                                    }}
                                                >
                                                    {invite.role === "tax_preparer" ? "Tax Preparer" : invite.role}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Invite Details */}
                                        <div className="ms-5" style={{ fontSize: "13px", color: "#6B7280" }}>
                                            <div className="mb-1">
                                                <strong>Invited by:</strong> {invite.invited_by?.name || invite.invited_by?.email || "N/A"}
                                            </div>
                                            <div className="mb-1">
                                                <strong>Invited on:</strong> {formatDate(invite.invited_at)}
                                            </div>
                                            <div>
                                                <strong>Expires:</strong>{" "}
                                                {isExpired ? (
                                                    <span style={{ color: "#EF4444" }}>Expired</span>
                                                ) : daysUntilExpiry !== null ? (
                                                    <span style={{ color: daysUntilExpiry <= 3 ? "#F59E0B" : "#10B981" }}>
                                                        {daysUntilExpiry} {daysUntilExpiry === 1 ? "day" : "days"} left
                                                    </span>
                                                ) : (
                                                    formatDate(invite.expires_at)
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Section - Actions */}
                                    <div className="d-flex gap-2 align-items-start">
                                        {isExpired ? (
                                            <span
                                                className="badge"
                                                style={{
                                                    backgroundColor: "#FEE2E2",
                                                    color: "#DC2626",
                                                    padding: "6px 12px",
                                                    borderRadius: "6px",
                                                    fontSize: "13px",
                                                }}
                                            >
                                                Expired
                                            </span>
                                        ) : (
                                            <>
                                                <button
                                                    className="btn"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log('Accept button clicked for invite:', invite);
                                                        handleAcceptInvite(invite);
                                                    }}
                                                    disabled={isProcessing}
                                                    style={{
                                                        backgroundColor: "#00C0C6",
                                                        color: "#FFFFFF",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        padding: "8px 20px",
                                                        fontSize: "14px",
                                                        fontWeight: "500",
                                                        cursor: isProcessing ? "not-allowed" : "pointer",
                                                        opacity: isProcessing ? 0.6 : 1,
                                                    }}
                                                >
                                                    {isProcessing ? "Processing..." : "Accept"}
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDeclineInvite(invite);
                                                    }}
                                                    disabled={isProcessing}
                                                    style={{
                                                        backgroundColor: "#FFFFFF",
                                                        color: "#3B4A66",
                                                        border: "1px solid #E8F0FF",
                                                        borderRadius: "8px",
                                                        padding: "8px 20px",
                                                        fontSize: "14px",
                                                        fontWeight: "500",
                                                        cursor: isProcessing ? "not-allowed" : "pointer",
                                                        opacity: isProcessing ? 0.6 : 1,
                                                    }}
                                                >
                                                    Decline
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {!loading && !error && pagination.total_pages > 1 && (
                <div className="mt-4">
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.total_pages}
                        onPageChange={setCurrentPage}
                        totalItems={pagination.total_count}
                        itemsPerPage={pagination.page_size}
                        startIndex={startIndex}
                        endIndex={endIndex}
                    />
                </div>
            )}

            {/* Data Sharing Modal */}
            {showDataSharingModal && selectedInvite && (
                <DataSharingModal
                    show={showDataSharingModal}
                    onClose={() => {
                        setShowDataSharingModal(false);
                        setSelectedInvite(null);
                        setDataSharingDecision("all");
                        setSelectedCategories([]);
                        setProcessingInvite(null);
                        setCurrentFirmInfo(null);
                    }}
                    onConfirm={handleDataSharingConfirm}
                    currentFirm={currentFirmInfo || { name: 'Current Firm' }}
                    newFirm={{ name: selectedInvite.firm_name || 'New Firm' }}
                    warningMessage={`You already have access to ${currentFirmInfo?.name || 'another firm'}. Please choose how you want to share your data with ${selectedInvite.firm_name || 'the new firm'}.`}
                    dataSharingOptions={{
                        description: 'Please select how you would like to share your existing data with the new firm:',
                        options: [
                            {
                                value: 'All',
                                label: 'Share All Data',
                                description: 'Share all your existing data with the new firm'
                            },
                            {
                                value: 'None',
                                label: 'Don\'t Share Data',
                                description: 'Keep your data private and don\'t share with the new firm'
                            },
                            {
                                value: 'Selected',
                                label: 'Share Selected Categories',
                                description: 'Choose specific data categories to share'
                            }
                        ],
                        categories: [
                            { id: 1, name: 'Client Information', description: 'Basic client details and contact information' },
                            { id: 2, name: 'Tax Documents', description: 'Tax returns, forms, and related documents' },
                            { id: 3, name: 'Financial Records', description: 'Bank statements, invoices, and financial data' },
                            { id: 4, name: 'Communication History', description: 'Messages and communication logs' }
                        ]
                    }}
                    loading={processingInvite === selectedInvite.id}
                />
            )}

            {/* Decline Confirmation Modal */}
            {showDeclineModal && selectedInvite && (
                <ConfirmationModal
                    isOpen={showDeclineModal}
                    onClose={() => {
                        setShowDeclineModal(false);
                        setSelectedInvite(null);
                        setDeclineReason("");
                        setProcessingInvite(null);
                    }}
                    onConfirm={confirmDecline}
                    title="Decline Invitation"
                    message={
                        <div style={{ fontFamily: "BasisGrotesquePro" }}>
                            <p className="mb-3" style={{ color: "#3B4A66" }}>
                                Are you sure you want to decline the invitation from <strong>{selectedInvite.firm_name}</strong>?
                            </p>
                            <div className="mb-3">
                                <label
                                    style={{
                                        fontSize: "14px",
                                        color: "#6B7280",
                                        marginBottom: "8px",
                                        display: "block",
                                    }}
                                >
                                    Reason (optional):
                                </label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={declineReason}
                                    onChange={(e) => setDeclineReason(e.target.value)}
                                    placeholder="Enter reason for declining..."
                                    style={{
                                        fontSize: "14px",
                                        fontFamily: "BasisGrotesquePro",
                                        border: "1px solid #E8F0FF",
                                        borderRadius: "8px",
                                    }}
                                />
                            </div>
                        </div>
                    }
                    confirmText="Decline Invitation"
                    cancelText="Cancel"
                    confirmButtonStyle={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}
                    cancelButtonStyle={{ border: "1px solid #E8F0FF", color: "#3B4A66" }}
                    isLoading={processingInvite === selectedInvite.id}
                />
            )}
        </div>
    );
}

