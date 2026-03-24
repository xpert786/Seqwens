import React, { useState, useEffect } from "react";
import Profile from "./Profile";
import Notifications from "./Notifications";
import Security from "./Security";
import MembershipBilling from "./MembershipBilling";
import { taxPreparerSettingsAPI, handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import RoleManagement from "../../../ClientOnboarding/components/RoleManagement";
import UserProfileWithRoles from "../../../ClientOnboarding/components/UserProfileWithRoles";


export default function AccountSettings() {
    const [activeTab, setActiveTab] = useState("profile");

    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch settings from API
    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await taxPreparerSettingsAPI.getSettings();
            console.log('Settings API response:', result);

            if (result.success && result.data) {
                // Map API response structure to component state
                setSettings({
                    profile: result.data.profile_information,
                    company_profile: result.data.company_profile,
                    notifications: result.data.notifications,
                    security: result.data.security
                });
                if (typeof window !== "undefined" && typeof window.setTaxHeaderProfile === "function") {
                    window.setTaxHeaderProfile(result.data.profile_information);
                }
            } else {
                throw new Error('Failed to fetch settings');
            }
        } catch (error) {
            console.error('Error fetching tax preparer settings:', error);
            setError(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    // Fetch settings on component mount
    useEffect(() => {
        fetchSettings();
    }, []);

    const tabs = [
        { id: "profile", label: "Profile" },
        { id: "notifications", label: "Notifications" },
        { id: "security", label: "Security" },
        { id: "membership", label: "Membership" },
        { id: "roles", label: "Roles" },
    ];

    return (
        <div className="min-h-screen px-4 font-basis">
            {/* Unified Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 mt-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-14 py-2 rounded-2xl bg-[#3AD6F2] flex items-center justify-center text-white shadow-xl shadow-[#3AD6F2]/30">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="mb-0 font-black text-gray-900 tracking-tight leading-none">
                                Settings
                            </h3>
                            <span className="text-gray-400 text-sm font-medium tracking-tight">Manage your profile and preferences.</span>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className="d-inline-block mb-4 tabs-mobile"
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
                                {tab.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>


            {/* Content Section */}
            <div>
                {loading ? (
                    <div className="text-center py-5">
                        <p style={{ fontFamily: "BasisGrotesquePro", color: "#6B7280" }}>Loading settings...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-5">
                        <p className="text-danger" style={{ fontFamily: "BasisGrotesquePro" }}>{error}</p>
                        <button
                            className="btn btn-primary mt-3"
                            onClick={fetchSettings}
                            style={{ backgroundColor: "#00C0C6", border: "none" }}
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        {activeTab === "profile" && <Profile profileData={settings?.profile} companyProfile={settings?.company_profile} onUpdate={fetchSettings} />}
                        {activeTab === "notifications" && <Notifications notifications={settings?.notifications} onUpdate={fetchSettings} />}
                        {activeTab === "security" && <Security security={settings?.security} onUpdate={fetchSettings} />}
                        {activeTab === "membership" && <MembershipBilling />}
                        {activeTab === "roles" && <UserProfileWithRoles />}
                    </>
                )}
            </div>
        </div>
    );
}
