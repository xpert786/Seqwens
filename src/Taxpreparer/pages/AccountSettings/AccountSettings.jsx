import React, { useState, useEffect } from "react";
import Profile from "./Profile";
import Notifications from "./Notifications";
import Security from "./Security";
import { taxPreparerSettingsAPI, handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";


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
            } else {
                throw new Error('Failed to fetch settings');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
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

    ];

    return (
        <div className="container-fluid px-4">

            <div className="align-items-center mb-3">
                <h5
                    className="mb-0 me-3"
                    style={{
                        color: "#3B4A66",
                        fontSize: "28px",
                        fontWeight: "500",
                        fontFamily: "BasisGrotesquePro",
                    }}
                >
                    Account Settings
                </h5>
                <p
                    className="mb-0"
                    style={{
                        color: "#4B5563",
                        fontSize: "16px",
                        fontWeight: "400",
                        fontFamily: "BasisGrotesquePro",
                    }}
                >
                    Manage your profile and preferences
                </p>
            </div>

            <div
                className="d-inline-block mb-4"
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
                    </>
                )}
            </div>
        </div>
    );
}
