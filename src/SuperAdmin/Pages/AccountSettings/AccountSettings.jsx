import React, { useState } from "react";
import Profile from "./Profile";
import Notifications from "./Notifications";
import Security from "./Security";
import Billing from "./Billing";
import SystemHealth from "./SystemHealth";
import PlatformControl from "./PlatformControl";
import LogsAndBackups from "./LogsAndBackups";
import RoleManagement from "./RoleManagement";
import ArchivedMonitoring from "./ArchivedMonitoring";
import { useModal } from "../../Context/ModalContext";          

export default function AccountSettings() {
    const [activeTab, setActiveTab] = useState("profile");
    const { handleShowRoleModal } = useModal();

    const tabs = [
        { id: "profile", label: "General" },
        { id: "Security", label: "Security" },
        { id: "systemHealth", label: "System Health" },     
        {id: "platformControl", label: "Platform Control" },
        {id: "logsAndBackups", label: "Logs and Backups" },
        {id: "roleManagement", label: "Role Management" },
        {id: "archiveMonitoring", label: "Archived Monitoring" },
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
                                    padding: "8px 6px",
                                    borderRadius: "8px",
                                    border: "none",
                                    fontSize: "14px",
                                    fontFamily: "BasisGrotesquePro",
                                    backgroundColor: activeTab === tab.id ? "#3B4A66" : "transparent",
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
                {activeTab === "profile" && <Profile />}
                {activeTab === "Security" && <Security />}
                {activeTab === "systemHealth" && <SystemHealth />}
                {activeTab === "platformControl" && <PlatformControl />}
                {activeTab === "logsAndBackups" && <LogsAndBackups />}
                {activeTab === "roleManagement" && <RoleManagement onShowModal={handleShowRoleModal} />}
                {activeTab === "archiveMonitoring" && <ArchivedMonitoring />}
            </div>
        </div>
    );
}


