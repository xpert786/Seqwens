import React, { useState, useEffect } from "react";
import { SaveIcon, EyeIcon, RefreshIcon, TrashIcon, EyeOffIcon, RefreshIcon1, TrashIcon1 } from "../../Components/icons";
import { superAdminAPI, handleAPIError } from "../../utils/superAdminAPI";
import { toast } from "react-toastify";
import { Modal, Button, Form } from "react-bootstrap";
import { superToastOptions } from "../../utils/toastConfig";

export default function Security() {
    const [twoFactorAuth, setTwoFactorAuth] = useState(true);
    const [passwordComplexity, setPasswordComplexity] = useState(false);
    const [ipWhitelisting, setIpWhitelisting] = useState(true);
    const [auditLogging, setAuditLogging] = useState(true);
    const [sessionTimeout, setSessionTimeout] = useState("30");
    const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");

    // API Keys statenp
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 });
    // Filters
    const [serviceFilter, setServiceFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentOnly, setCurrentOnly] = useState(false);
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showRevealModal, setShowRevealModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null);
    const [revealedKey, setRevealedKey] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        service: "",
        key: "",
        status: "active"
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Supported services
    const supportedServices = [
        { value: "stripe", label: "Stripe Integration" },
        { value: "email", label: "Email Service" },
        { value: "sms", label: "SMS Provider" },
        { value: "cloud_storage", label: "Cloud Storage" },
        { value: "zoom_account_id", label: "Zoom Account ID" },
        { value: "zoom_client_id", label: "Zoom Client ID" },
        { value: "zoom_client_secret", label: "Zoom Client Secret" }
    ];

    // Fetch API keys
    const fetchAPIKeys = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await superAdminAPI.getAPIKeys({
                service: serviceFilter || undefined,
                status: statusFilter || undefined,
                search: searchTerm || undefined,
                currentOnly: currentOnly
            });

            if (response.success && response.data) {
                setApiKeys(Array.isArray(response.data) ? response.data : []);
                if (response.summary) {
                    setSummary(response.summary);
                }
            } else {
                setApiKeys([]);
                setSummary({ total: 0, active: 0, inactive: 0 });
            }
        } catch (err) {
            console.error('Error fetching API keys:', err);
            setError(handleAPIError(err));
            setApiKeys([]);
            toast.error(handleAPIError(err), superToastOptions);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAPIKeys();
    }, [serviceFilter, statusFilter, searchTerm, currentOnly]);

    const getStatusColor = (status) => {
        const statusLower = (status || "").toLowerCase();
        if (statusLower === "active") return "#22C55E";
        if (statusLower === "inactive") return "#EF4444";
        return "#6B7280";
    };

    // Mask API key for display - always mask, never show full key
    const maskAPIKey = (key) => {
        if (!key || key === "N/A") return "N/A";
        // If already masked (contains asterisks), return as is
        if (key.includes('*')) return key;
        // Mask the key: show first 4 and last 4 characters, mask the rest
        if (key.length <= 8) {
            return '•'.repeat(key.length);
        }
        const first4 = key.substring(0, 4);
        const last4 = key.substring(key.length - 4);
        const masked = '•'.repeat(Math.max(8, key.length - 8));
        return `${first4}${masked}${last4}`;
    };

    // Handle create API key
    const handleCreate = async () => {
        setFormErrors({});

        // Validation
        if (!formData.service) {
            setFormErrors({ service: "Service is required" });
            return;
        }
        if (!formData.key) {
            setFormErrors({ key: "API key is required" });
            return;
        }

        try {
            setSubmitting(true);
            const response = await superAdminAPI.createAPIKey(formData);

            if (response.success) {
                toast.success(response.message || "API key created successfully", superToastOptions);
                setShowCreateModal(false);
                setFormData({ service: "", key: "", status: "active" });
                fetchAPIKeys();
            }
        } catch (err) {
            // Don't log full error details that might contain API keys
            const errorMsg = handleAPIError(err);
            console.error('Error creating API key');
            toast.error(errorMsg, superToastOptions);

            // Handle validation errors
            if (err.message && err.message.includes("errors")) {
                try {
                    const errorData = JSON.parse(err.message);
                    if (errorData.errors) {
                        setFormErrors(errorData.errors);
                    }
                } catch (e) {
                    // Not JSON, ignore
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Handle update API key
    const handleUpdate = async () => {
        if (!selectedKey) return;

        setFormErrors({});

        // Validation
        if (!formData.service) {
            setFormErrors({ service: "Service is required" });
            return;
        }
        // Key is optional for updates (can update just status)

        try {
            setSubmitting(true);
            // Only include key if it's provided
            const updateData = {
                service: formData.service,
                status: formData.status
            };
            if (formData.key && formData.key.trim()) {
                updateData.key = formData.key.trim();
            }
            const response = await superAdminAPI.updateAPIKey(selectedKey.id, updateData);

            if (response.success) {
                toast.success(response.message || "API key updated successfully", superToastOptions);
                setShowEditModal(false);
                setSelectedKey(null);
                setFormData({ service: "", key: "", status: "active" });
                fetchAPIKeys();
            }
        } catch (err) {
            // Don't log full error details that might contain API keys
            const errorMsg = handleAPIError(err);
            console.error('Error updating API key');
            toast.error(errorMsg, superToastOptions);

            // Handle validation errors
            if (err.message && err.message.includes("errors")) {
                try {
                    const errorData = JSON.parse(err.message);
                    if (errorData.errors) {
                        setFormErrors(errorData.errors);
                    }
                } catch (e) {
                    // Not JSON, ignore
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Handle reveal API key
    const handleReveal = async (keyId) => {
        try {
            const response = await superAdminAPI.revealAPIKey(keyId);

            if (response.success && response.data) {
                setRevealedKey(response.data.key);
                setSelectedKey(response.data);
                setShowRevealModal(true);
            }
        } catch (err) {
            // Don't log full error details that might contain API keys
            console.error('Error revealing API key');
            toast.error(handleAPIError(err), superToastOptions);
        }
    };

    // Handle delete API key
    const handleDelete = async () => {
        if (!selectedKey) return;

        try {
            const response = await superAdminAPI.deleteAPIKey(selectedKey.id);

            if (response.success) {
                toast.success(response.message || "API key deleted successfully", superToastOptions);
                setShowDeleteModal(false);
                setSelectedKey(null);
                fetchAPIKeys();
            }
        } catch (err) {
            console.error('Error deleting API key:', err);
            toast.error(handleAPIError(err), superToastOptions);
        }
    };

    // Handle toggle status
    const handleToggleStatus = async (apiKey) => {
        const newStatus = apiKey.status === "active" ? "inactive" : "active";

        try {
            const response = await superAdminAPI.updateAPIKey(apiKey.id, { status: newStatus });

            if (response.success) {
                toast.success(`API key ${newStatus === "active" ? "activated" : "deactivated"}`, superToastOptions);
                fetchAPIKeys();
            }
        } catch (err) {
            console.error('Error updating API key status:', err);
            toast.error(handleAPIError(err), superToastOptions);
        }
    };

    // Open edit modal
    const openEditModal = (apiKey) => {
        setSelectedKey(apiKey);
        setFormData({
            service: apiKey.service || "",
            key: "", // Don't pre-fill key for security
            status: apiKey.status || "active"
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    // Open delete modal
    const openDeleteModal = (apiKey) => {
        setSelectedKey(apiKey);
        setShowDeleteModal(true);
    };

    // Open create modal
    const openCreateModal = () => {
        setFormData({ service: "", key: "", status: "active" });
        setFormErrors({});
        setShowCreateModal(true);
    };

    return (
        <div style={{
            backgroundColor: "#F3F7FF",
            padding: "10px",
            borderRadius: "12px",
            border: "none"
        }}>
            {/* Security Configuration Card */}
            <div style={{
                border: "1px solid #E8F0FF",
                padding: "24px",
                borderRadius: "12px",
                backgroundColor: "white",
                marginBottom: "24px"
            }}>
                {/* Header */}
                {/* <div style={{ marginBottom: "24px" }}>
                    <h5
                        style={{
                            color: "#3B4A66",
                            fontSize: "24px",
                            fontWeight: "500",
                            fontFamily: "BasisGrotesquePro",
                            margin: "0 0 8px 0"
                        }}
                    >
                        Security Configuration
                    </h5>
                    
                </div> */}

                {/* Security Settings */}
                

                {/* Session Timeout and Max Login Attempts */}
                
            </div>

            {/* API Keys Management Card */}
            <div style={{
                border: "1px solid #E8F0FF",
                padding: "24px",
                borderRadius: "12px",
                backgroundColor: "white"
            }}>
                {/* Header */}
                <div style={{ marginBottom: "24px" }}>
                    <h5
                        style={{
                            color: "#3B4A66",
                            fontSize: "24px",
                            fontWeight: "500",
                            fontFamily: "BasisGrotesquePro",
                            margin: "0 0 8px 0"
                        }}
                    >
                        API Keys Management
                    </h5>
                    <p
                        style={{
                            color: "#4B5563",
                            fontSize: "14px",
                            fontWeight: "400",
                            fontFamily: "BasisGrotesquePro",
                            margin: "0"
                        }}
                    >
                        Manage third-party service integrations
                    </p>
                </div>

                {/* Filters and Actions */}
                <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "24px",
                    alignItems: "center"
                }}>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: "1",
                            minWidth: "200px",
                            padding: "8px 12px",
                            border: "1px solid #E8F0FF",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontFamily: "BasisGrotesquePro"
                        }}
                    />
                    <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        style={{
                            padding: "8px 12px",
                            border: "1px solid #E8F0FF",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontFamily: "BasisGrotesquePro",
                            backgroundColor: "white"
                        }}
                    >
                        <option value="">All Services</option>
                        {supportedServices.map(service => (
                            <option key={service.value} value={service.value}>{service.label}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: "8px 12px",
                            border: "1px solid #E8F0FF",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontFamily: "BasisGrotesquePro",
                            backgroundColor: "white"
                        }}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <label style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontFamily: "BasisGrotesquePro",
                        fontSize: "14px",
                        cursor: "pointer"
                    }}>
                        <input
                            type="checkbox"
                            checked={currentOnly}
                            onChange={(e) => setCurrentOnly(e.target.checked)}
                            style={{ cursor: "pointer" }}
                        />
                        Current Only
                    </label>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        style={{
                            backgroundColor: "#F56D2D",
                            color: "#ffffff",
                            fontSize: "14px",
                            fontWeight: "400",
                            fontFamily: "BasisGrotesquePro",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                        }}
                    >
                        Add API Key
                    </button>
                </div>

                {/* Summary */}
                {summary && (summary.total > 0 || summary.active > 0 || summary.inactive > 0) && (
                    <div style={{
                        display: "flex",
                        gap: "16px",
                        marginBottom: "16px",
                        padding: "12px",
                        backgroundColor: "#F9FAFB",
                        borderRadius: "8px"
                    }}>
                        <div style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>
                            <strong>Total:</strong> {summary.total}
                        </div>
                        <div style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", color: "#22C55E" }}>
                            <strong>Active:</strong> {summary.active}
                        </div>
                        <div style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", color: "#EF4444" }}>
                            <strong>Inactive:</strong> {summary.inactive}
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div style={{
                        padding: "12px",
                        backgroundColor: "#FEE2E2",
                        border: "1px solid #FCA5A5",
                        borderRadius: "6px",
                        marginBottom: "16px",
                        color: "#DC2626",
                        fontFamily: "BasisGrotesquePro",
                        fontSize: "14px"
                    }}>
                        {error}
                    </div>
                )}

                {/* API Keys Table */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px", fontFamily: "BasisGrotesquePro" }}>
                        Loading API keys...
                    </div>
                ) : apiKeys.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", fontFamily: "BasisGrotesquePro", color: "#6B7280" }}>
                        No API keys found
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            margin: "0"
                        }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #E8F0FF" }}>
                                    <th style={{
                                        color: "#3B4A66",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        fontFamily: "BasisGrotesquePro",
                                        padding: "12px 0",
                                        border: "none",
                                        textAlign: "left"
                                    }}>Service</th>
                                    <th style={{
                                        color: "#3B4A66",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        fontFamily: "BasisGrotesquePro",
                                        padding: "12px 0",
                                        border: "none",
                                        textAlign: "left"
                                    }}>Key</th>
                                    <th style={{
                                        color: "#3B4A66",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        fontFamily: "BasisGrotesquePro",
                                        padding: "12px 0",
                                        border: "none",
                                        textAlign: "left"
                                    }}>Status</th>
                                    <th style={{
                                        color: "#3B4A66",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        fontFamily: "BasisGrotesquePro",
                                        padding: "12px 0",
                                        border: "none",
                                        textAlign: "left"
                                    }}>Last Used</th>
                                    <th style={{
                                        color: "#3B4A66",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        fontFamily: "BasisGrotesquePro",
                                        padding: "12px 0",
                                        border: "none",
                                        textAlign: "left"
                                    }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {apiKeys.map((apiKey) => (
                                    <tr key={apiKey.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                                        <td style={{ padding: "12px 0", border: "none" }}>
                                            <div>
                                                <div style={{
                                                    color: "#3B4A66",
                                                    fontSize: "14px",
                                                    fontWeight: "500",
                                                    fontFamily: "BasisGrotesquePro",
                                                    marginBottom: "2px"
                                                }}>
                                                    {apiKey.service_display || apiKey.service}
                                                </div>
                                                {apiKey.env_variable && (
                                                    <div style={{
                                                        color: "#6B7280",
                                                        fontSize: "12px",
                                                        fontWeight: "400",
                                                        fontFamily: "BasisGrotesquePro"
                                                    }}>
                                                        {apiKey.env_variable}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 0", border: "none" }}>
                                            <div style={{
                                                color: "#6B7280",
                                                fontSize: "14px",
                                                fontWeight: "400",
                                                fontFamily: "monospace"
                                            }}>
                                                {maskAPIKey(apiKey.masked_key || apiKey.key)}
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 0", border: "none" }}>
                                            <span
                                                style={{
                                                    backgroundColor: getStatusColor(apiKey.status),
                                                    color: "white",
                                                    padding: "4px 8px",
                                                    borderRadius: "12px",
                                                    fontSize: "12px",
                                                    fontWeight: "500",
                                                    fontFamily: "BasisGrotesquePro"
                                                }}
                                            >
                                                {apiKey.status_display || apiKey.status || "N/A"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 0", border: "none" }}>
                                            <div style={{
                                                color: "#6B7280",
                                                fontSize: "14px",
                                                fontWeight: "400",
                                                fontFamily: "BasisGrotesquePro"
                                            }}>
                                                {apiKey.last_used_relative || apiKey.last_used_display || apiKey.last_used || "Never"}
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 0", border: "none" }}>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleReveal(apiKey.id)}
                                                    title="Reveal Key"
                                                    style={{
                                                        backgroundColor: "transparent",
                                                        border: "none",
                                                        color: "#6B7280",
                                                        padding: "4px",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    <EyeIcon />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(apiKey)}
                                                    title={apiKey.status === "active" ? "Deactivate" : "Activate"}
                                                    style={{
                                                        backgroundColor: "transparent",
                                                        border: "none",
                                                        color: "#6B7280",
                                                        padding: "4px",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    <RefreshIcon1 />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(apiKey)}
                                                    title="Edit"
                                                    style={{
                                                        backgroundColor: "transparent",
                                                        border: "none",
                                                        color: "#6B7280",
                                                        padding: "4px",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    <SaveIcon />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteModal(apiKey)}
                                                    title="Delete"
                                                    style={{
                                                        backgroundColor: "transparent",
                                                        border: "none",
                                                        color: "#6B7280",
                                                        padding: "4px",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    <TrashIcon1 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create API Key Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontFamily: "BasisGrotesquePro" }}>Create API Key</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>Service *</Form.Label>
                            <Form.Select
                                value={formData.service}
                                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                                isInvalid={!!formErrors.service}
                            >
                                <option value="">Select a service</option>
                                {supportedServices.map(service => (
                                    <option key={service.value} value={service.value}>{service.label}</option>
                                ))}
                            </Form.Select>
                            {formErrors.service && (
                                <Form.Control.Feedback type="invalid">{formErrors.service}</Form.Control.Feedback>
                            )}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>API Key *</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.key}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                placeholder="Enter API key"
                                isInvalid={!!formErrors.key}
                            />
                            {formErrors.key && (
                                <Form.Control.Feedback type="invalid">{formErrors.key}</Form.Control.Feedback>
                            )}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>Status</Form.Label>
                            <Form.Select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleCreate}
                        disabled={submitting}
                        style={{ backgroundColor: "#F56D2D", border: "none" }}
                    >
                        {submitting ? "Creating..." : "Create"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit API Key Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontFamily: "BasisGrotesquePro" }}>Edit API Key</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>Service *</Form.Label>
                            <Form.Select
                                value={formData.service}
                                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                                isInvalid={!!formErrors.service}
                            >
                                {supportedServices.map(service => (
                                    <option key={service.value} value={service.value}>{service.label}</option>
                                ))}
                            </Form.Select>
                            {formErrors.service && (
                                <Form.Control.Feedback type="invalid">{formErrors.service}</Form.Control.Feedback>
                            )}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>API Key</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.key}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                placeholder="Enter new API key (leave empty to keep current)"
                                isInvalid={!!formErrors.key}
                            />
                            <Form.Text className="text-muted" style={{ fontFamily: "BasisGrotesquePro" }}>
                                Leave empty to keep current key, or enter a new key to update
                            </Form.Text>
                            {formErrors.key && (
                                <Form.Control.Feedback type="invalid">{formErrors.key}</Form.Control.Feedback>
                            )}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>Status</Form.Label>
                            <Form.Select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleUpdate}
                        disabled={submitting}
                        style={{ backgroundColor: "#F56D2D", border: "none" }}
                    >
                        {submitting ? "Updating..." : "Update"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Reveal API Key Modal */}
            <Modal show={showRevealModal} onHide={() => setShowRevealModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontFamily: "BasisGrotesquePro" }}>Reveal API Key</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div style={{ fontFamily: "BasisGrotesquePro", marginBottom: "16px" }}>
                        <strong>Service:</strong> {selectedKey?.service_display || selectedKey?.service}
                    </div>
                    <div style={{
                        padding: "12px",
                        backgroundColor: "#F9FAFB",
                        borderRadius: "6px",
                        border: "1px solid #E5E7EB",
                        fontFamily: "monospace",
                        fontSize: "14px",
                        wordBreak: "break-all"
                    }}>
                        {revealedKey || "N/A"}
                    </div>
                    <div style={{
                        marginTop: "12px",
                        padding: "12px",
                        backgroundColor: "#FEF3C7",
                        borderRadius: "6px",
                        fontFamily: "BasisGrotesquePro",
                        fontSize: "12px",
                        color: "#92400E"
                    }}>
                        ⚠️ Warning: This is your full API key. Keep it secure and do not share it.
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => {
                        setShowRevealModal(false);
                        setRevealedKey(null);
                    }}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete API Key Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontFamily: "BasisGrotesquePro" }}>Delete API Key</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p style={{ fontFamily: "BasisGrotesquePro" }}>
                        Are you sure you want to delete the API key for <strong>{selectedKey?.service_display || selectedKey?.service}</strong>?
                        This action cannot be undone.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                    >
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
