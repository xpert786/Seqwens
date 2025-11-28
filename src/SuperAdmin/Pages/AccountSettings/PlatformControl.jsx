import React, { useState, useEffect, useRef } from "react";
import { TotalFirmsIcon, BlueUserIcon, SystemHealthIcon, TrashIcon1 } from "../../Components/icons";
import { superAdminAPI, handleAPIError } from "../../utils/superAdminAPI";
import { toast } from "react-toastify";
import { superToastOptions } from "../../utils/toastConfig";
import { Modal, Button, Form } from "react-bootstrap";

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

    // Retention Rules state
    const [retentionRule, setRetentionRule] = useState(null);
    const [loadingRetention, setLoadingRetention] = useState(true);
    const [retentionFormData, setRetentionFormData] = useState({
        enable_retention_rules: false,
        years_to_keep: 7,
        firm_id: null
    });
    const [submittingRetention, setSubmittingRetention] = useState(false);

    const auditData = [
        { label: "Active Firms", value: "128", icon: <TotalFirmsIcon /> },
        { label: "2FA Not Enforced", value: "12", icon: <BlueUserIcon /> },
        { label: "Pending IP Rules", value: ipRestrictions.filter(r => !r.is_active).length.toString(), icon: <SystemHealthIcon /> }
    ];

    const storagePlans = [
        { name: "Starter", planId: "Plan ID 1", used: 50, total: 5000 },
        { name: "Growth", planId: "Plan ID 2", used: 4000, total: 5000 },
        { name: "Enterprise", planId: "Plan ID 3", used: 520, total: 5000 }
    ];

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

    // Fetch Retention Rules
    const fetchRetentionRule = async () => {
        try {
            setLoadingRetention(true);
            const response = await superAdminAPI.getRetentionRule();
            
            if (response.success && response.data) {
                setRetentionRule(response.data);
                setRetentionFormData({
                    enable_retention_rules: response.data.enable_retention_rules || false,
                    years_to_keep: response.data.years_to_keep || 7,
                    firm_id: response.data.firm || null
                });
            }
        } catch (err) {
            console.error('Error fetching retention rule:', err);
            toast.error(handleAPIError(err), superToastOptions);
        } finally {
            setLoadingRetention(false);
        }
    };

    useEffect(() => {
        fetchIPRestrictions();
        fetchRetentionRule();
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

    // Handle delete IP restriction
    const handleDeleteIPRestriction = async (id) => {
        if (!window.confirm("Are you sure you want to delete this IP restriction?")) {
            return;
        }

        try {
            const response = await superAdminAPI.deleteIPRestriction(id);
            
            if (response.success) {
                toast.success(response.message || "IP restriction deleted successfully", superToastOptions);
                fetchIPRestrictions();
            }
        } catch (err) {
            console.error('Error deleting IP restriction:', err);
            toast.error(handleAPIError(err), superToastOptions);
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

    // Handle save retention rule
    const handleSaveRetentionRule = async () => {
        if (retentionFormData.years_to_keep < 1 || retentionFormData.years_to_keep > 100) {
            toast.error("Years to keep must be between 1 and 100", superToastOptions);
            return;
        }

        try {
            setSubmittingRetention(true);
            const payload = {
                enable_retention_rules: retentionFormData.enable_retention_rules,
                years_to_keep: retentionFormData.years_to_keep
            };
            
            if (retentionFormData.firm_id) {
                payload.firm_id = retentionFormData.firm_id;
            }

            const response = await superAdminAPI.createOrUpdateRetentionRule(payload);
            
            if (response.success) {
                toast.success(response.message || "Retention rule updated successfully", superToastOptions);
                fetchRetentionRule();
            }
        } catch (err) {
            console.error('Error saving retention rule:', err);
            toast.error(handleAPIError(err), superToastOptions);
        } finally {
            setSubmittingRetention(false);
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
            <div className="bg-white border border-[#E8F0FF] rounded-lg p-6 mb-6">
                <h3 className="text-gray-800 text-xl font-semibold font-[BasisGrotesquePro] mb-2">
                    Platform Controls
                </h3>
                <p className="text-gray-600 text-sm font-normal font-[BasisGrotesquePro] mb-6">
                    Global controls for branding, retention, security, and storage allocation.
                </p>

                {/* Storage Allocation per Plan */}
                <div className="mb-8">
                    <h4 className="text-gray-800 text-lg font-semibold font-[BasisGrotesquePro] mb-2">
                        Storage Allocation per Plan
                    </h4>
                    <p className="text-gray-600 text-sm font-normal font-[BasisGrotesquePro] mb-4">
                        Control system-level storage that maps to subscription plans.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {storagePlans.map((plan, index) => {
                            const percentage = (plan.used / plan.total) * 100;
                            return (
                                <div key={index} className="border border-[#E8F0FF] rounded-lg p-3">
                                    <div className="mb-2 flex flex-row justify-between items-center">
                                        <div>
                                            <div className="text-[#4B5563] text-sm font-thin font-[BasisGrotesquePro] mb-1">
                                                {plan.name}
                                            </div>
                                            <div className="text-[#4B5563] text-xs font-thin font-[BasisGrotesquePro]">
                                                {plan.planId}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="mb-2">
                                                <div className="text-[#4B5563] text-xs font-thin font-[BasisGrotesquePro]">
                                                    Allocation: {plan.used} GB/{plan.total} GB
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#3B4A66] rounded-full transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Global Branding */}
            <div className="bg-white border border-[#E8F0FF] rounded-lg p-6 mb-6">
                <h3 className="text-[#4B5563] text-xl font-semibold font-[BasisGrotesquePro] mb-2">
                    Global Branding
                </h3>
                <p className="text-[#4B5563] text-sm font-normal font-[BasisGrotesquePro] mb-6">
                    White-label the platform for each firm or globally.
                </p>

                {/* Toggle for allowing firms to change branding */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#E8F0FF]">
                    <div>
                        <div
                            style={{
                                color: "#3B4A66",
                                fontSize: "16px",
                                fontWeight: "500",
                                fontFamily: "BasisGrotesquePro",
                            }}
                        >
                            Allow Firms to Change Branding
                        </div>
                        <p
                            style={{
                                color: "#6B7280",
                                fontSize: "14px",
                                fontWeight: "400",
                                fontFamily: "BasisGrotesquePro",
                                margin: "4px 0 0 0",
                            }}
                        >
                            Enable firms to customize their own color branding
                        </p>
                    </div>
                    <div className="custom-toggle">
                        <input
                            type="checkbox"
                            id="allowFirmsToChangeBranding"
                            checked={allowFirmsToChangeBranding}
                            onChange={() => setAllowFirmsToChangeBranding(!allowFirmsToChangeBranding)}
                        />
                        <label htmlFor="allowFirmsToChangeBranding"></label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div>
                        <label className="block text-[#4B5563] text-sm font-medium font-[BasisGrotesquePro] mb-2">
                            Platform Name
                        </label>
                        <input
                            type="text"
                            value={platformName}
                            onChange={(e) => setPlatformName(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                            style={{ backgroundColor: "white" }}
                        />
                    </div>
                    <div>
                        <label className="block text-[#4B5563] text-sm font-medium font-[BasisGrotesquePro] mb-2">
                            Primary Color
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="relative rounded-lg border border-[#E8F0FF] p-1 flex-shrink-0">
                                <div
                                    className="w-12 h-8 rounded-lg cursor-pointer"
                                    style={{ backgroundColor: primaryColor }}
                                />
                                <input
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="flex-1 px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                                style={{ backgroundColor: "white" }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[#4B5563] text-sm font-medium font-[BasisGrotesquePro] mb-2">
                            Secondary Color
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="relative rounded-lg border border-[#E8F0FF] p-1 flex-shrink-0">
                                <div
                                    className="w-12 h-8 rounded-lg cursor-pointer"
                                    style={{ backgroundColor: secondaryColor }}
                                />
                                <input
                                    type="color"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <input
                                type="text"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="flex-1 px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                                style={{ backgroundColor: "white" }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[#4B5563] text-sm font-medium font-[BasisGrotesquePro] mb-2">
                            Accent Color
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="relative rounded-lg border border-[#E8F0FF] p-1 flex-shrink-0">
                                <div
                                    className="w-12 h-8 rounded-lg cursor-pointer"
                                    style={{ backgroundColor: accentColor }}
                                />
                                <input
                                    type="color"
                                    value={accentColor}
                                    onChange={(e) => setAccentColor(e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <input
                                type="text"
                                value={accentColor}
                                onChange={(e) => setAccentColor(e.target.value)}
                                className="flex-1 px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                                style={{ backgroundColor: "white" }}
                            />
                        </div>
                    </div>
                </div>

                {/* Logo Upload */}
                <div className="mb-6">
                    <label className="block text-[#4B5563] text-sm font-medium font-[BasisGrotesquePro] mb-2">
                        Logo
                    </label>
                    <div className="flex items-start gap-4">
                        {/* Logo Preview */}
                        {logoPreview && (
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 border border-[#E8F0FF] rounded-lg p-2 bg-white flex items-center justify-center">
                                    <img
                                        src={logoPreview}
                                        alt="Logo preview"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex-1 flex flex-col gap-2">
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                                onChange={handleLogoSelect}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                className="px-4 py-2 text-sm font-medium text-[#3B4A66] bg-white border border-[#E8F0FF] rounded-lg hover:bg-[#E8F0FF] transition font-[BasisGrotesquePro] flex items-center gap-2 w-fit"
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.25 8.75V11.0833C12.25 11.3928 12.1271 11.6895 11.9083 11.9083C11.6895 12.1271 11.3928 12.25 11.0833 12.25H2.91667C2.60725 12.25 2.3105 12.1271 2.09171 11.9083C1.87292 11.6895 1.75 11.3928 1.75 11.0833V8.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M9.91683 4.66667L7.00016 1.75L4.0835 4.66667" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M7 1.75V8.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {logoFile ? logoFile.name : 'Upload Logo'}
                            </button>
                            <p className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">PNG, JPG, SVG up to 2MB</p>
                            {logoFile && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLogoFile(null);
                                        setLogoPreview(null);
                                        if (logoInputRef.current) {
                                            logoInputRef.current.value = '';
                                        }
                                    }}
                                    className="text-xs text-[#DC2626] hover:text-[#B91C1C] font-[BasisGrotesquePro] w-fit"
                                >
                                    Remove Logo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preview Button */}
                <div className="mb-6">
                    <button
                        onClick={() => {
                            setPreviewColors({
                                primary: primaryColor,
                                secondary: secondaryColor,
                                accent: accentColor
                            });
                            setPreviewPlatformName(platformName);
                            setPreviewLogo(logoPreview);
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-[#E55A1F] transition font-[BasisGrotesquePro] flex items-center justify-center gap-2"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Preview Changes
                    </button>
                </div>

                {/* Live Preview */}
                <div>
                    <label className="block text-[#4B5563] text-sm font-semibold font-[BasisGrotesquePro] mb-2">
                        Live Preview
                    </label>
                    <div className="bg-[#F6F7FF] rounded-lg p-4 border border-[#E8F0FF]">
                        <div className="flex flex-row items-center justify-start gap-3 mb-4">
                            {previewLogo ? (
                                <div className="w-16 h-10 flex items-center justify-center bg-white border border-[#E8F0FF] rounded-lg p-1">
                                    <img
                                        src={previewLogo}
                                        alt="Logo preview"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div
                                    className="w-16 h-10 flex flex-col items-center justify-center text-white font-[BasisGrotesquePro] rounded-lg"
                                    style={{ backgroundColor: previewColors.primary }}
                                >
                                </div>
                            )}
                            <div className="text-[#4B5563] text-sm font-[BasisGrotesquePro]">
                                <p className="font-medium">{previewPlatformName}</p>
                                <p className="text-xs text-[#6B7280]">firmsstaff.com</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col gap-2">
                                <div
                                    className="w-full h-12 rounded-lg flex items-center justify-center text-white text-xs font-[BasisGrotesquePro]"
                                    style={{ backgroundColor: previewColors.primary }}
                                >
                                    Primary
                                </div>
                                <p className="text-xs text-[#6B7280] font-[BasisGrotesquePro] text-center">{previewColors.primary}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div
                                    className="w-full h-12 rounded-lg flex items-center justify-center text-white text-xs font-[BasisGrotesquePro]"
                                    style={{ backgroundColor: previewColors.secondary }}
                                >
                                    Secondary
                                </div>
                                <p className="text-xs text-[#6B7280] font-[BasisGrotesquePro] text-center">{previewColors.secondary}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div
                                    className="w-full h-12 rounded-lg flex items-center justify-center text-white text-xs font-[BasisGrotesquePro]"
                                    style={{ backgroundColor: previewColors.accent }}
                                >
                                    Accent
                                </div>
                                <p className="text-xs text-[#6B7280] font-[BasisGrotesquePro] text-center">{previewColors.accent}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                                <span className={`px-2 py-1 rounded text-xs font-[BasisGrotesquePro] ${
                                                    restriction.restriction_type === "tenant" 
                                                        ? "bg-blue-100 text-blue-800" 
                                                        : "bg-purple-100 text-purple-800"
                                                }`}>
                                                    {restriction.restriction_type === "tenant" ? "Tenant-Level" : "Firm-Level"}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs font-[BasisGrotesquePro] ${
                                                    restriction.is_active 
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

                {/* Retention Rules */}
                <div className="bg-white border border-[#E8F0FF] rounded-lg p-6">
                    <h3 className="text-[#4B5563] text-xl font-semibold font-[BasisGrotesquePro] mb-2">
                        Retention Rules
                    </h3>
                    <p className="text-[#4B5563] text-sm font-normal font-[BasisGrotesquePro] mb-6">
                        Configure data retention policies.
                    </p>

                    {loadingRetention ? (
                        <div className="text-center py-8 text-gray-600 font-[BasisGrotesquePro]">
                            Loading retention rules...
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="enableRetentionRules"
                                    checked={retentionFormData.enable_retention_rules}
                                    onChange={(e) => setRetentionFormData({
                                        ...retentionFormData,
                                        enable_retention_rules: e.target.checked
                                    })}
                                    className="w-4 h-4 rounded focus:ring-[#3AD6F2] border-2"
                                    style={{
                                        accentColor: "#3AD6F2",
                                        borderColor: "#3AD6F2",
                                    }}
                                />
                                <label htmlFor="enableRetentionRules" className="text-[#4B5563] text-sm font-medium font-[BasisGrotesquePro]">
                                    Enable Retention Rules
                                </label>
                            </div>

                            {retentionFormData.enable_retention_rules && (
                                <div>
                                    <label className="block text-[#4B5563] text-sm font-medium font-[BasisGrotesquePro] mb-2">
                                        Years to Keep Data
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={retentionFormData.years_to_keep}
                                        onChange={(e) => setRetentionFormData({
                                            ...retentionFormData,
                                            years_to_keep: parseInt(e.target.value) || 7
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                                    />
                                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">
                                        Enter a value between 1 and 100 years
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleSaveRetentionRule}
                                disabled={submittingRetention}
                                className="w-full px-4 py-2 bg-[#F56D2D] text-white rounded-lg text-sm font-[BasisGrotesquePro] hover:bg-[#E55A1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submittingRetention ? "Saving..." : "Save Retention Rule"}
                            </button>

                            {retentionRule && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-600 font-[BasisGrotesquePro]">
                                        <strong>Current Setting:</strong> {retentionRule.enable_retention_rules 
                                            ? `Data will be kept for ${retentionRule.years_to_keep} years`
                                            : "Retention rules are disabled"}
                                    </p>
                                    {retentionRule.updated_at && (
                                        <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">
                                            Last updated: {new Date(retentionRule.updated_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Security Enforcement */}
            <div className="bg-white border border-[#E8F0FF] rounded-lg p-6 mt-6">
                <h3 className="text-gray-800 text-xl font-semibold font-[BasisGrotesquePro] mb-2">
                    Security Enforcement
                </h3>
                <p className="text-gray-600 text-sm font-normal font-[BasisGrotesquePro] mb-6">
                    Mandate policies across all firms.
                </p>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="require2FA"
                            checked={require2FA}
                            onChange={(e) => setRequire2FA(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="require2FA" className="text-gray-700 text-sm font-medium font-[BasisGrotesquePro]">
                            Require 2-Factor Authentication For All Staff
                        </label>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-medium font-[BasisGrotesquePro] mb-2">
                            Minimum password length
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={minPasswordLength}
                                onChange={(e) => setMinPasswordLength(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro] pr-8"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="requireSpecialChar"
                            checked={requireSpecialChar}
                            onChange={(e) => setRequireSpecialChar(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="requireSpecialChar" className="text-gray-700 text-sm font-medium font-[BasisGrotesquePro]">
                            Require Special Character In Passwords
                        </label>
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
                    <Button variant="secondary" onClick={closeIPModal}>
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSaveIPRestriction}
                        disabled={submittingIP}
                        style={{ backgroundColor: "#F56D2D", border: "none" }}
                    >
                        {submittingIP ? "Saving..." : (editingIPRestriction ? "Update" : "Create")}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
