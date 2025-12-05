import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { EyeIcon, SaveIcon } from "../../Components/icons";
import { superAdminAPI, handleAPIError } from "../../../SuperAdmin/utils/superAdminAPI";

export default function APIKeysTab() {
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedKey, setSelectedKey] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showRevealModal, setShowRevealModal] = useState(false);
    const [revealedKey, setRevealedKey] = useState(null);
    const [formData, setFormData] = useState({ key: "" });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Fetch API keys
    const fetchAPIKeys = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await superAdminAPI.getAPIKeys({});

            if (response.success && response.data) {
                setApiKeys(Array.isArray(response.data) ? response.data : []);
            } else {
                setApiKeys([]);
            }
        } catch (err) {
            console.error('Error fetching API keys:', err);
            setError(handleAPIError(err));
            setApiKeys([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAPIKeys();
    }, []);

    const getStatusColor = (status) => {
        const statusLower = (status || "").toLowerCase();
        if (statusLower === "active") return "#22C55E";
        if (statusLower === "inactive" || statusLower === "not configured") return "#EF4444";
        return "#6B7280";
    };

    // Handle reveal API key
    const handleReveal = async (serviceName) => {
        if (!serviceName || serviceName === 'undefined') {
            toast.error('Invalid service name', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        try {
            const response = await superAdminAPI.revealAPIKey(serviceName);

            if (response.success && response.data) {
                setRevealedKey(response.data.key);
                setSelectedKey(response.data);
                setShowRevealModal(true);
            }
        } catch (err) {
            console.error('Error revealing API key');
            toast.error(handleAPIError(err), {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    // Handle update API key
    const handleUpdate = async () => {
        if (!selectedKey || !selectedKey.service) return;

        if (selectedKey.service === 'undefined') {
            toast.error('Invalid API key identifier. Please provide a valid service name.', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        setFormErrors({});

        // Validation - key is required for update
        if (!formData.key || !formData.key.trim()) {
            setFormErrors({ key: "API key value is required" });
            toast.error('Key value is required', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        try {
            setSubmitting(true);
            const updateData = {
                key: formData.key.trim()
            };

            const response = await superAdminAPI.updateAPIKey(selectedKey.service, updateData);

            if (response.success) {
                toast.success(response.message || "API key updated successfully in backend settings", {
                    position: "top-right",
                    autoClose: 3000,
                });
                setShowEditModal(false);
                setSelectedKey(null);
                setFormData({ key: "" });
                fetchAPIKeys();
            }
        } catch (err) {
            const errorMsg = handleAPIError(err);
            console.error('Error updating API key');

            // Handle specific error cases
            if (err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
                toast.error('API key not found. Only keys configured in backend settings are available.', {
                    position: "top-right",
                    autoClose: 3000,
                });
            } else if (err.message?.includes('400') || err.message?.toLowerCase().includes('invalid')) {
                toast.error(errorMsg || 'Invalid API key identifier. Please provide a valid service name.', {
                    position: "top-right",
                    autoClose: 3000,
                });
            } else {
                toast.error(errorMsg, {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Open edit modal
    const openEditModal = (apiKey) => {
        setSelectedKey(apiKey);
        setFormData({ key: "" });
        setFormErrors({});
        setShowEditModal(true);
    };

    return (
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#E8F0FF]">
            {/* Header Section */}
            <div className="mb-6">
                <h4 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                    API Key Management
                </h4>
                <p className="text-sm text-[#7B8AB2] font-[BasisGrotesquePro] mb-3">
                    Manage API keys for external integrations configured in backend settings
                </p>
                <div className="bg-[#FEF3C7] border border-[#FDE047] rounded-lg p-3 text-xs font-[BasisGrotesquePro] text-[#92400E]">
                    ℹ️ <strong>Note:</strong> You can only update API keys that are configured in the backend settings. Creating new keys or deleting existing configurations is not allowed through this interface.
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-red-600 font-[BasisGrotesquePro] text-sm">
                    {error}
                </div>
            )}

            {/* API Keys Table */}
            {loading ? (
                <div className="text-center py-10 font-[BasisGrotesquePro] text-[#7B8AB2]">
                    Loading API keys...
                </div>
            ) : apiKeys.length === 0 ? (
                <div className="text-center py-10 font-[BasisGrotesquePro] text-[#7B8AB2]">
                    No API keys found
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#E8F0FF]">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                                    Service
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                                    Key
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                                    Status
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {apiKeys.map((apiKey) => (
                                <tr key={apiKey.service} className="border-b border-[#E8F0FF] hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">
                                            {apiKey.service_display || apiKey.service}
                                        </div>
                                        {apiKey.env_variable && (
                                            <div className="text-xs text-[#7B8AB2] font-[BasisGrotesquePro] mt-1">
                                                {apiKey.env_variable}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm text-[#7B8AB2] font-mono">
                                            {apiKey.masked_key || "Not configured"}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-[BasisGrotesquePro] text-white"
                                            style={{ backgroundColor: getStatusColor(apiKey.status) }}
                                        >
                                            {apiKey.status_display || apiKey.status || "N/A"}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleReveal(apiKey.service)}
                                                disabled={!apiKey.service || apiKey.service === 'undefined'}
                                                className="p-2 text-[#7B8AB2] hover:text-[#F56D2D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Reveal Key"
                                            >
                                                <EyeIcon />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(apiKey)}
                                                disabled={!apiKey.service || apiKey.service === 'undefined'}
                                                className="p-2 text-[#7B8AB2] hover:text-[#F56D2D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Update Key"
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

            {/* Edit API Key Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                                Update API Key
                            </h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <div className="text-sm font-[BasisGrotesquePro] mb-2">
                                <strong>Service:</strong> {selectedKey?.service_display || selectedKey?.service}
                            </div>
                            {selectedKey?.env_variable && (
                                <div className="text-xs text-[#7B8AB2] font-[BasisGrotesquePro] mb-4">
                                    <strong>Environment Variable:</strong> {selectedKey.env_variable}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                                New API Key *
                            </label>
                            <input
                                type="text"
                                value={formData.key}
                                onChange={(e) => setFormData({ key: e.target.value })}
                                placeholder="Enter new API key value"
                                className={`w-full rounded-lg border ${formErrors.key ? 'border-red-500' : 'border-[#E8F0FF]'} px-3 py-2 text-sm focus:outline-none focus:border-[#F56D2D] font-[BasisGrotesquePro]`}
                            />
                            <p className="text-xs text-[#7B8AB2] font-[BasisGrotesquePro] mt-1">
                                Enter the new API key to update the backend settings
                            </p>
                            {formErrors.key && (
                                <p className="text-xs text-red-500 font-[BasisGrotesquePro] mt-1">
                                    {formErrors.key}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 text-sm font-medium text-[#1F2A55] bg-white border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={submitting}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro] disabled:opacity-50"
                            >
                                {submitting ? "Updating..." : "Update Key"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reveal API Key Modal */}
            {showRevealModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                                Reveal API Key
                            </h3>
                            <button
                                onClick={() => {
                                    setShowRevealModal(false);
                                    setRevealedKey(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <div className="text-sm font-[BasisGrotesquePro] mb-2">
                                <strong>Service:</strong> {selectedKey?.service_display || selectedKey?.service}
                            </div>
                            {selectedKey?.env_variable && (
                                <div className="text-xs text-[#7B8AB2] font-[BasisGrotesquePro] mb-4">
                                    <strong>Environment Variable:</strong> {selectedKey.env_variable}
                                </div>
                            )}
                        </div>

                        <div className="relative mb-4">
                            <div className="p-3 pr-16 bg-gray-50 border border-[#E8F0FF] rounded-lg font-mono text-sm break-all">
                                {revealedKey || "N/A"}
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(revealedKey || "");
                                    toast.success("API key copied to clipboard", {
                                        position: "top-right",
                                        autoClose: 2000,
                                    });
                                }}
                                className="absolute top-3 right-3 px-2 py-1 text-xs font-medium text-white bg-[#F56D2D] rounded hover:bg-[#FF7142] transition font-[BasisGrotesquePro]"
                                title="Copy to clipboard"
                            >
                                Copy
                            </button>
                        </div>

                        <div className="p-3 bg-[#FEF3C7] border border-[#FDE047] rounded-lg text-xs font-[BasisGrotesquePro] text-[#92400E]">
                            ⚠️ <strong>Warning:</strong> This is your full API key. Keep it secure and do not share it.
                        </div>

                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => {
                                    setShowRevealModal(false);
                                    setRevealedKey(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-[#1F2A55] bg-white border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
