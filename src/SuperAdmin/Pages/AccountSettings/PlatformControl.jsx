import React, { useState, useEffect, useRef } from "react";
import { TotalFirmsIcon, BlueUserIcon, SystemHealthIcon, TrashIcon1 } from "../../Components/icons";
import { superAdminAPI, handleAPIError } from "../../utils/superAdminAPI";
import { toast } from "react-toastify";
import { superToastOptions } from "../../utils/toastConfig";
import { Modal, Button, Form } from "react-bootstrap";
import ConfirmationModal from "../../../components/ConfirmationModal";

export default function PlatformControl() {
    const [platformName, setPlatformName] = useState("Acme Tax Suite");
    const [primaryColor, setPrimaryColor] = useState("#FF8787");
    const [secondaryColor, setSecondaryColor] = useState("#22C55E");
    const [accentColor, setAccentColor] = useState("#F56D2D");
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [previewLogo, setPreviewLogo] = useState(null);
    const logoInputRef = useRef(null);
    const [allowFirmsToChangeBranding, setAllowFirmsToChangeBranding] = useState(false);
    const [previewColors, setPreviewColors] = useState({
        primary: "#FF8787",
        secondary: "#22C55E",
        accent: "#F56D2D"
    });
    const [previewPlatformName, setPreviewPlatformName] = useState("Acme Tax Suite");
    const [require2FA, setRequire2FA] = useState(false);
    const [minPasswordLength, setMinPasswordLength] = useState("10");
    const [requireSpecialChar, setRequireSpecialChar] = useState(false);

    // Audit Summary Data
    const auditData = [
        { label: "Active Firms", value: "128", icon: <TotalFirmsIcon /> },
        { label: "2FA Not Enforced", value: "12", icon: <BlueUserIcon /> },
        { label: "Pending IP Rules", value: "3", icon: <SystemHealthIcon /> }
    ];

    // IP Restrictions state
    const [ipRestrictions, setIpRestrictions] = useState([]);
    const [loadingIPRestrictions, setLoadingIPRestrictions] = useState(true);
    const [showIPModal, setShowIPModal] = useState(false);
    const [editingIPRestriction, setEditingIPRestriction] = useState(null);
    const [ipFormData, setIpFormData] = useState({
        restriction_type: "tenant",
        firm: null,
        ip_address: "",
        description: "",
        is_active: true
    });
    const [ipFormErrors, setIpFormErrors] = useState({});
    const [submittingIP, setSubmittingIP] = useState(false);
    const [ipFilter, setIpFilter] = useState(""); // "tenant", "firm", or ""

    // Fetch IP Restrictions
    const fetchIPRestrictions = async () => {
        try {
            setLoadingIPRestrictions(true);
            const filters = {};
            if (ipFilter) {
                filters.restrictionType = ipFilter;
            }
            const response = await superAdminAPI.getIPRestrictions(filters);

            if (response.success && response.data) {
                setIpRestrictions(Array.isArray(response.data) ? response.data : []);
            } else {
                setIpRestrictions([]);
            }
        } catch (err) {
            console.error('Error fetching IP restrictions:', err);
            toast.error(handleAPIError(err), superToastOptions);
            setIpRestrictions([]);
        } finally {
            setLoadingIPRestrictions(false);
        }
    };

    useEffect(() => {
        fetchIPRestrictions();
    }, [ipFilter]);

    // Handle create/update IP restriction
    const handleSaveIPRestriction = async () => {
        setIpFormErrors({});

        // Validation
        if (!ipFormData.ip_address || !ipFormData.ip_address.trim()) {
            setIpFormErrors({ ip_address: "IP address is required" });
            return;
        }
        if (ipFormData.restriction_type === "firm" && !ipFormData.firm) {
            setIpFormErrors({ firm: "Firm is required for firm-level restrictions" });
            return;
        }
        if (ipFormData.restriction_type === "tenant" && ipFormData.firm) {
            setIpFormErrors({ firm: "Firm must be null for tenant-level restrictions" });
            return;
        }

        try {
            setSubmittingIP(true);
            const payload = {
                restriction_type: ipFormData.restriction_type,
                ip_address: ipFormData.ip_address.trim(),
                description: ipFormData.description.trim() || "",
                is_active: ipFormData.is_active
            };

            if (ipFormData.restriction_type === "firm") {
                payload.firm = ipFormData.firm;
            } else {
                payload.firm = null;
            }

            let response;
            if (editingIPRestriction) {
                response = await superAdminAPI.updateIPRestriction(editingIPRestriction.id, payload);
            } else {
                response = await superAdminAPI.createIPRestriction(payload);
            }

            if (response.success) {
                toast.success(response.message || (editingIPRestriction ? "IP restriction updated successfully" : "IP restriction created successfully"), superToastOptions);
                setShowIPModal(false);
                setEditingIPRestriction(null);
                setIpFormData({
                    restriction_type: "tenant",
                    firm: null,
                    ip_address: "",
                    description: "",
                    is_active: true
                });
                fetchIPRestrictions();
            }
        } catch (err) {
            console.error('Error saving IP restriction:', err);
            const errorMsg = handleAPIError(err);
            toast.error(errorMsg, superToastOptions);

            // Handle validation errors
            if (err.message && err.message.includes("errors")) {
                try {
                    const errorData = JSON.parse(err.message);
                    if (errorData.errors) {
                        setIpFormErrors(errorData.errors);
                    }
                } catch (e) {
                    // Not JSON, ignore
                }
            }
        } finally {
            setSubmittingIP(false);
        }
    };

    const [showDeleteIPConfirm, setShowDeleteIPConfirm] = useState(false);
    const [ipToDelete, setIpToDelete] = useState(null);
    const [deletingIP, setDeletingIP] = useState(false);

    // Handle delete IP restriction
    const handleDeleteIPRestriction = async (id) => {
        setIpToDelete(id);
        setShowDeleteIPConfirm(true);
    };

    const confirmDeleteIPRestriction = async () => {
        if (!ipToDelete) return;

        try {
            setDeletingIP(true);
            const response = await superAdminAPI.deleteIPRestriction(ipToDelete);

            if (response.success) {
                toast.success(response.message || "IP restriction deleted successfully", superToastOptions);
                fetchIPRestrictions();
                setShowDeleteIPConfirm(false);
                setIpToDelete(null);
            }
        } catch (err) {
            console.error('Error deleting IP restriction:', err);
            toast.error(handleAPIError(err), superToastOptions);
        } finally {
            setDeletingIP(false);
        }
    };

    // Handle toggle IP restriction status
    const handleToggleIPStatus = async (restriction) => {
        try {
            const response = await superAdminAPI.updateIPRestriction(restriction.id, {
                ...restriction,
                is_active: !restriction.is_active
            });

            if (response.success) {
                toast.success(`IP restriction ${!restriction.is_active ? "activated" : "deactivated"}`, superToastOptions);
                fetchIPRestrictions();
            }
        } catch (err) {
            console.error('Error updating IP restriction status:', err);
            toast.error(handleAPIError(err), superToastOptions);
        }
    };


    // Open IP restriction modal for editing
    const openEditIPModal = (restriction) => {
        setEditingIPRestriction(restriction);
        setIpFormData({
            restriction_type: restriction.restriction_type || "tenant",
            firm: restriction.firm || null,
            ip_address: restriction.ip_address || "",
            description: restriction.description || "",
            is_active: restriction.is_active !== undefined ? restriction.is_active : true
        });
        setIpFormErrors({});
        setShowIPModal(true);
    };

    // Open IP restriction modal for creating
    const openCreateIPModal = () => {
        setEditingIPRestriction(null);
        setIpFormData({
            restriction_type: "tenant",
            firm: null,
            ip_address: "",
            description: "",
            is_active: true
        });
        setIpFormErrors({});
        setShowIPModal(true);
    };

    // Close IP modal
    const closeIPModal = () => {
        setShowIPModal(false);
        setEditingIPRestriction(null);
        setIpFormData({
            restriction_type: "tenant",
            firm: null,
            ip_address: "",
            description: "",
            is_active: true
        });
        setIpFormErrors({});
    };

    // Handle logo file selection
    const handleLogoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
            if (!validTypes.includes(file.type)) {
                toast.error('Please select a valid image file (PNG, JPG, or SVG)', superToastOptions);
                return;
            }

            // Validate file size (2MB limit)
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxSize) {
                toast.error('Logo file size must be less than 2MB', superToastOptions);
                return;
            }

            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className=" min-h-screen">
            {/* Audit Summary (Mock) */}
            <div className="bg-white border border-[#E8F0FF] rounded-lg p-6 mb-6">
                <h3 className="text-gray-800 text-xl font-semibold font-[BasisGrotesquePro] mb-4">
                    Audit Summary (Mock)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
                    {auditData.map((item, index) => (
                        <div key={index} className="relative border border-[#E8F0FF] rounded-lg p-6">
                            <div className="absolute top-4 right-4 w-12 h-12">
                                {item.icon}
                            </div>
                            <div>
                                <div className="text-gray-600 text-sm font-medium font-[BasisGrotesquePro]">
                                    {item.label}
                                </div>
                                <div className="text-gray-800 text-3xl font-bold font-[BasisGrotesquePro]">
                                    {item.value}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Platform Controls */}



            <div className="grid grid-cols-1 gap-6">
                {/* IP / Location Restrictions */}
                <div className="bg-white border border-[#E8F0FF] rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-[#4B5563] text-xl font-semibold font-[BasisGrotesquePro] mb-2">
                                IP / Location Restrictions
                            </h3>
                            <p className="text-[#4B5563] text-sm font-normal font-[BasisGrotesquePro]">
                                Limit where firms and staff can log in from.
                            </p>
                        </div>
                        <button
                            onClick={openCreateIPModal}
                            className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg text-sm font-[BasisGrotesquePro] hover:bg-[#E55A1F] transition-colors"
                            style={{ borderRadius: '7px' }}
                        >
                            Add IP Restriction
                        </button>
                    </div>

                    {/* Filter */}
                    <div className="mb-4">
                        <select
                            value={ipFilter}
                            onChange={(e) => setIpFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro] text-sm"
                        >
                            <option value="">All Restrictions</option>
                            <option value="tenant">Tenant-Level</option>
                            <option value="firm">Firm-Level</option>
                        </select>
                    </div>

                    {/* IP Restrictions List */}
                    {loadingIPRestrictions ? (
                        <div className="text-center py-8 text-gray-600 font-[BasisGrotesquePro]">
                            Loading IP restrictions...
                        </div>
                    ) : ipRestrictions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 font-[BasisGrotesquePro]">
                            No IP restrictions found
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {ipRestrictions.map((restriction) => (
                                <div
                                    key={restriction.id}
                                    className="bg-white border border-[#E8F0FF] rounded-xl p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="text-[#3B4A66] text-base font-semibold font-[BasisGrotesquePro] mb-1">
                                                {restriction.ip_address}
                                            </div>
                                            <div className="text-[#6B7280] text-sm font-normal font-[BasisGrotesquePro] mb-1">
                                                {restriction.description || "No description"}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`px-2 py-1 rounded text-xs font-[BasisGrotesquePro] ${restriction.restriction_type === "tenant"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-purple-100 text-purple-800"
                                                    }`}>
                                                    {restriction.restriction_type === "tenant" ? "Tenant-Level" : "Firm-Level"}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs font-[BasisGrotesquePro] ${restriction.is_active
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                                    }`}>
                                                    {restriction.is_active ? "Active" : "Inactive"}
                                                </span>
                                                {restriction.firm_name && (
                                                    <span className="text-xs text-gray-600 font-[BasisGrotesquePro]">
                                                        Firm: {restriction.firm_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleToggleIPStatus(restriction)}
                                                className="text-sm text-gray-600 hover:text-gray-800 font-[BasisGrotesquePro]"
                                                title={restriction.is_active ? "Deactivate" : "Activate"}
                                            >
                                                {restriction.is_active ? "Deactivate" : "Activate"}
                                            </button>
                                            <button
                                                onClick={() => openEditIPModal(restriction)}
                                                className="text-sm text-blue-600 hover:text-blue-800 font-[BasisGrotesquePro]"
                                                title="Edit"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteIPRestriction(restriction.id)}
                                                className="text-sm text-red-600 hover:text-red-800 font-[BasisGrotesquePro]"
                                                title="Delete"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="text-gray-500 text-xs font-normal font-[BasisGrotesquePro] leading-relaxed mt-4">
                        <span className="text-[#3B4A66] font-semibold">Tip:</span> Use CIDR Notation For Ranges (Eg. 198.51.100.0/24). IP Restrictions Are Applied At The Tenant-Level And Can Be Overridden Per-Firm If Allowed.
                    </div>
                </div>

            </div>

            {/* IP Restriction Modal */}
            <Modal show={showIPModal} onHide={closeIPModal} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontFamily: "BasisGrotesquePro" }}>
                        {editingIPRestriction ? "Edit IP Restriction" : "Create IP Restriction"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>Restriction Type *</Form.Label>
                            <Form.Select
                                value={ipFormData.restriction_type}
                                onChange={(e) => setIpFormData({
                                    ...ipFormData,
                                    restriction_type: e.target.value,
                                    firm: e.target.value === "tenant" ? null : ipFormData.firm
                                })}
                                isInvalid={!!ipFormErrors.restriction_type}
                            >
                                <option value="tenant">Tenant-Level (All Firms)</option>
                                <option value="firm">Firm-Level (Specific Firm)</option>
                            </Form.Select>
                            {ipFormErrors.restriction_type && (
                                <Form.Control.Feedback type="invalid">{ipFormErrors.restriction_type}</Form.Control.Feedback>
                            )}
                        </Form.Group>

                        {ipFormData.restriction_type === "firm" && (
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>Firm ID *</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={ipFormData.firm || ""}
                                    onChange={(e) => setIpFormData({
                                        ...ipFormData,
                                        firm: e.target.value ? parseInt(e.target.value) : null
                                    })}
                                    placeholder="Enter firm ID"
                                    isInvalid={!!ipFormErrors.firm}
                                />
                                {ipFormErrors.firm && (
                                    <Form.Control.Feedback type="invalid">{ipFormErrors.firm}</Form.Control.Feedback>
                                )}
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>IP Address / CIDR *</Form.Label>
                            <Form.Control
                                type="text"
                                value={ipFormData.ip_address}
                                onChange={(e) => setIpFormData({ ...ipFormData, ip_address: e.target.value })}
                                placeholder="e.g., 192.168.1.1 or 192.168.1.0/24"
                                isInvalid={!!ipFormErrors.ip_address}
                            />
                            <Form.Text className="text-muted" style={{ fontFamily: "BasisGrotesquePro" }}>
                                Use CIDR notation for IP ranges (e.g., 192.168.1.0/24)
                            </Form.Text>
                            {ipFormErrors.ip_address && (
                                <Form.Control.Feedback type="invalid">{ipFormErrors.ip_address}</Form.Control.Feedback>
                            )}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>Description</Form.Label>
                            <Form.Control
                                type="text"
                                value={ipFormData.description}
                                onChange={(e) => setIpFormData({ ...ipFormData, description: e.target.value })}
                                placeholder="e.g., Office VPN, Home Office"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Active"
                                checked={ipFormData.is_active}
                                onChange={(e) => setIpFormData({ ...ipFormData, is_active: e.target.checked })}
                                style={{ fontFamily: "BasisGrotesquePro" }}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeIPModal} style={{ borderRadius: '7px' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSaveIPRestriction}
                        disabled={submittingIP}
                        style={{ backgroundColor: "#F56D2D", border: "none", borderRadius: '7px' }}
                    >
                        {submittingIP ? "Saving..." : (editingIPRestriction ? "Update" : "Create")}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete IP Restriction Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteIPConfirm}
                onClose={() => {
                    if (!deletingIP) {
                        setShowDeleteIPConfirm(false);
                        setIpToDelete(null);
                    }
                }}
                onConfirm={confirmDeleteIPRestriction}
                title="Delete IP Restriction"
                message="Are you sure you want to delete this IP restriction?"
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={deletingIP}
                isDestructive={true}
            />
        </div>
    );
}
