import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Profile from "./Profile";
import Notifications from "./Notifications";
import Security from "./Security";
import Billing from "./Billing";
import RoleManagement from "../RoleManagement";
import UserProfileWithRoles from "../UserProfileWithRoles";
import '../../styles/AccountSetting.css';
export default function AccountSettings() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState(tabFromUrl || "profile");

    // Update active tab when URL parameter changes
    useEffect(() => {
        if (tabFromUrl) {
            setActiveTab(tabFromUrl);
        }
    }, [tabFromUrl]);

    const tabs = [
        { id: "profile", label: "Profile" },
        { id: "notifications", label: "Notifications" },
        { id: "security", label: "Security" },
        { id: "roles", label: "Roles" },
    ];

    return (
        <div className="container-fluid lg:px-4 md:px-2 px-1 account-settings-page">

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
                    Update your personal details and tax information
                </p>
            </div>

            <div
                className="d-inline-block mb-4 account-tabs"
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
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    // Update URL parameter when tab is clicked
                                    setSearchParams({ tab: tab.id });
                                }}
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
            <div className="card " style={{ borderRadius: "15px", border: "1px solid #E8F0FF" }}>
                <div className="card-body account-card-body" style={{
                    marginRight: "17",
                    marginBottom: "30",
                    marginLeft: "17",
                    padding: "28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "28px"
                }}>
                    {activeTab === "profile" && <Profile />}
                    {activeTab === "notifications" && <Notifications />}
                    {activeTab === "security" && <Security />}
                    {activeTab === "roles" && <UserProfileWithRoles />}
                </div>
            </div>
        </div>
    );
}
