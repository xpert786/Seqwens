import React, { useState, useEffect } from "react";
import { SaveIcon, EyeIcon, RefreshIcon, TrashIcon, EyeOffIcon, RefreshIcon1, TrashIcon1 } from "../../Components/icons";
import { superAdminAPI, handleAPIError } from "../../utils/superAdminAPI";
import { userAPI } from "../../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
import { Modal, Button, Form } from "react-bootstrap";
import { superToastOptions } from "../../utils/toastConfig";

import "../../style/Security.css";

export default function Security() {
    const [pwCurrent, setPwCurrent] = useState("");
    const [pwNew, setPwNew] = useState("");
    const [pwConfirm, setPwConfirm] = useState("");
    const [pwError, setPwError] = useState("");
    const [pwLoading, setPwLoading] = useState(false);

    // API Keys State
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [serviceFilter, setServiceFilter] = useState("");
    const [currentOnly, setCurrentOnly] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null);
    const [formData, setFormData] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 });
    const [supportedServices, setSupportedServices] = useState([]);
    const [showRevealModal, setShowRevealModal] = useState(false);
    const [revealedKey, setRevealedKey] = useState(null);

    useEffect(() => {
        fetchApiKeys();
    }, [searchTerm, statusFilter, serviceFilter, currentOnly]);

    const fetchApiKeys = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await superAdminAPI.getApiKeys({
                search: searchTerm,
                status: statusFilter,
                service: serviceFilter,
                current_only: currentOnly
            });

            if (response.success) {
                // Handle mixed response structures
                let keys = [];
                if (Array.isArray(response.data)) {
                    keys = response.data;
                } else if (response.data && Array.isArray(response.data.api_keys)) {
                    keys = response.data.api_keys;
                }
                setApiKeys(keys);

                // Handle summary (can be top-level or inside data)
                const summaryData = response.summary || (response.data && response.data.summary) || {};
                setSummary(summaryData);

                // Handle filters
                const services = (response.filters && response.filters.services) ||
                    (response.data && response.data.filters && response.data.filters.services) ||
                    [];

                // If no services returned from API, derive from keys if we have them
                if (services.length === 0 && keys.length > 0) {
                    const uniqueServices = new Map();
                    keys.forEach(k => {
                        if (!uniqueServices.has(k.service)) {
                            uniqueServices.set(k.service, {
                                value: k.service,
                                label: k.service_display || k.service
                            });
                        }
                    });
                    setSupportedServices(Array.from(uniqueServices.values()));
                } else {
                    setSupportedServices(services);
                }
            }
        } catch (err) {
            console.error("Error fetching API keys:", err);
            setError(handleAPIError(err));
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwError("");

        if (pwNew !== pwConfirm) {
            setPwError("New passwords do not match");
            return;
        }

        if (pwNew.length < 8) {
            setPwError("Password must be at least 8 characters long");
            return;
        }

        try {
            setPwLoading(true);
            const response = await userAPI.changePassword({
                current_password: pwCurrent,
                new_password: pwNew,
                confirm_password: pwConfirm
            });

            if (response.success) {
                toast.success("Password updated successfully");
                setPwCurrent("");
                setPwNew("");
                setPwConfirm("");
            } else {
                setPwError(response.message || "Failed to update password");
            }
        } catch (err) {
            setPwError(handleAPIError(err));
        } finally {
            setPwLoading(false);
        }
    };

    const openEditModal = (key) => {
        setSelectedKey(key);
        setFormData({ key: "" }); // Empty for security, user enters new key
        setFormErrors({});
        setShowEditModal(true);
    };

    const handleUpdate = async () => {
        if (!formData.key) {
            setFormErrors({ key: "API Key is required" });
            return;
        }

        try {
            setSubmitting(true);
            console.log("Updating API key:", selectedKey.id, formData);

            // The API expects 'key_value' but we'll send 'key' as well for compatibility
            const payload = {
                key: formData.key,
                key_value: formData.key, // Ensure backend gets the value
                service: selectedKey.service
            };

            const response = await superAdminAPI.updateApiKey(selectedKey.id, payload);

            if (response.success) {
                toast.success("API Key updated successfully", superToastOptions);
                setShowEditModal(false);
                fetchApiKeys();
            } else {
                toast.error(response.message || "Failed to update API key", superToastOptions);
            }
        } catch (err) {
            console.error("Error updating API key:", err);
            toast.error(handleAPIError(err), superToastOptions);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReveal = async (service) => {
        try {
            // Find the key object
            const keyObj = apiKeys.find(k => k.service === service);
            if (!keyObj) return;

            setSelectedKey(keyObj);

            // If we already have the unmasked key in the object (rare/insecure but possible)
            if (keyObj.key && !keyObj.key.includes('*')) {
                setRevealedKey(keyObj.key);
                setShowRevealModal(true);
                return;
            }

            // Otherwise fetch it
            const response = await superAdminAPI.revealApiKey(keyObj.id);
            if (response.success && response.data) {
                setRevealedKey(response.data.key);
                setShowRevealModal(true);
            } else {
                toast.error("Failed to reveal API key", superToastOptions);
            }
        } catch (err) {
            console.error("Error revealing API key:", err);
            toast.error(handleAPIError(err), superToastOptions);
        }
    };

    const maskAPIKey = (key) => {
        if (!key) return "N/A";
        if (key.includes('*')) return key; // Already masked
        if (key.length <= 8) return "********";
        return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#22C55E';
            case 'inactive': return '#EF4444';
            case 'expired': return '#F59E0B';
            default: return '#6B7280';
        }
    };

    return (
        <div
            className="security-settings-container"
            style={{
                backgroundColor: "#F3F7FF",
                padding: "10px",
                borderRadius: "12px",
                border: "none"
            }}
        >
            {/* Security Configuration Card */}
            <div
                className="security-card"
                style={{
                    border: "1px solid #E8F0FF",
                    padding: "24px",
                    borderRadius: "12px",
                    backgroundColor: "white",
                    marginBottom: "24px"
                }}
            >
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
                        Change Password
                    </h5>
                    <p style={{ color: "#6B7280", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
                        Update your account password.
                    </p>
                </div>

                <form onSubmit={handlePasswordChange}>
                    {pwError && <div className="text-danger mb-3" style={{ fontFamily: "BasisGrotesquePro" }}>{pwError}</div>}

                    <div className="row mb-3">
                        <div className="col-md-4">
                            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", color: "#3B4A66" }}>Current Password</label>
                            <input
                                type="password"
                                className="form-control"
                                value={pwCurrent}
                                onChange={(e) => setPwCurrent(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", color: "#3B4A66" }}>New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                value={pwNew}
                                onChange={(e) => setPwNew(e.target.value)}
                                minLength={8}
                                autoComplete="new-password"
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", color: "#3B4A66" }}>Confirm New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                value={pwConfirm}
                                onChange={(e) => setPwConfirm(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={pwLoading}
                            style={{
                                backgroundColor: "#2563EB",
                                border: "none",
                                fontFamily: "BasisGrotesquePro"
                            }}
                        >
                            {pwLoading ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </form>

                {/* Security Settings */}


                {/* Session Timeout and Max Login Attempts */}

            </div>

            {/* API Keys Management Card */}
            <div
                className="security-card"
                style={{
                    border: "1px solid #E8F0FF",
                    padding: "24px",
                    borderRadius: "12px",
                    backgroundColor: "white"
                }}
            >
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
                            margin: "0 0 8px 0"
                        }}
                    >
                        Manage third-party service integrations configured in backend settings
                    </p>
                    <div
                        className="security-alert"
                        style={{
                            backgroundColor: "#FEF3C7",
                            border: "1px solid #FDE047",
                            borderRadius: "6px",
                            padding: "12px",
                            fontSize: "13px",
                            fontFamily: "BasisGrotesquePro",
                            color: "#92400E"
                        }}
                    >
                        ℹ️ <strong>Note:</strong> You can only update API keys that are configured in the backend settings. Creating new keys or deleting existing configurations is not allowed through this interface.
                    </div>
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
                                                    onClick={() => handleReveal(apiKey.service)}
                                                    title="Reveal Key"
                                                    style={{
                                                        backgroundColor: "transparent",
                                                        border: "none",
                                                        color: "#6B7280",
                                                        padding: "4px",
                                                        cursor: "pointer"
                                                    }}
                                                    disabled={!apiKey.service || apiKey.service === 'undefined'}
                                                >
                                                    <EyeIcon />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(apiKey)}
                                                    title="Update Key"
                                                    style={{
                                                        backgroundColor: "transparent",
                                                        border: "none",
                                                        color: "#6B7280",
                                                        padding: "4px",
                                                        cursor: "pointer"
                                                    }}
                                                    disabled={!apiKey.service || apiKey.service === 'undefined'}
                                                >
                                                    <SaveIcon />
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

            {/* Edit API Key Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontFamily: "BasisGrotesquePro" }}>Update API Key</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <div style={{ marginBottom: "16px", fontFamily: "BasisGrotesquePro" }}>
                            <strong>Service:</strong> {selectedKey?.service_display || selectedKey?.service}
                        </div>
                        {selectedKey?.env_variable && (
                            <div style={{ marginBottom: "16px", fontFamily: "BasisGrotesquePro", fontSize: "12px", color: "#6B7280" }}>
                                <strong>Environment Variable:</strong> {selectedKey.env_variable}
                            </div>
                        )}
                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>New API Key *</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.key}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                placeholder="Enter new API key value"
                                isInvalid={!!formErrors.key}
                            />
                            <Form.Text className="text-muted" style={{ fontFamily: "BasisGrotesquePro" }}>
                                Enter the new API key to update the backend settings
                            </Form.Text>
                            {formErrors.key && (
                                <Form.Control.Feedback type="invalid">{formErrors.key}</Form.Control.Feedback>
                            )}
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
                        {submitting ? "Updating..." : "Update Key"}
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
                    {selectedKey?.env_variable && (
                        <div style={{ fontFamily: "BasisGrotesquePro", marginBottom: "16px", fontSize: "12px", color: "#6B7280" }}>
                            <strong>Environment Variable:</strong> {selectedKey.env_variable}
                        </div>
                    )}
                    <div style={{ position: "relative" }}>
                        <div style={{
                            padding: "12px",
                            paddingRight: "48px",
                            backgroundColor: "#F9FAFB",
                            borderRadius: "6px",
                            border: "1px solid #E5E7EB",
                            fontFamily: "monospace",
                            fontSize: "14px",
                            wordBreak: "break-all"
                        }}>
                            {revealedKey || "N/A"}
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(revealedKey || "");
                                toast.success("API key copied to clipboard", superToastOptions);
                            }}
                            style={{
                                position: "absolute",
                                top: "12px",
                                right: "12px",
                                backgroundColor: "#F56D2D",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                padding: "4px 8px",
                                fontSize: "12px",
                                cursor: "pointer",
                                fontFamily: "BasisGrotesquePro"
                            }}
                            title="Copy to clipboard"
                        >
                            Copy
                        </button>
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
                        ⚠️ <strong>Warning:</strong> This is your full API key. Keep it secure and do not share it.
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

        </div>
    );
}
