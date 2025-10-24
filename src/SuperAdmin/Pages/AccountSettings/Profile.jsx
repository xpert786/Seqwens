import React, { useState } from "react";
import { SaveIcon } from "../../Components/icons"

export default function Profile() {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsAlerts, setSmsAlerts] = useState(false);
    const [slackIntegration, setSlackIntegration] = useState(true);
    const [weeklyReports, setWeeklyReports] = useState(true);

    return (
        <div style={{
            backgroundColor: "#F3F7FF",
            padding: "10px",
            borderRadius: "12px",
            border: "none"
        }}>
            <div className="flex flex-col gap-4 border border-[#E8F0FF] p-4 rounded-lg bg-white">
                {/* Platform Configuration Section */}
                <div>
                    <h5
                        className="mb-0 me-3"
                        style={{
                            color: "#3B4A66",
                            fontSize: "24px",
                            fontWeight: "500",
                            fontFamily: "BasisGrotesquePro",
                        }}
                    >
                        Platform Configuration
                    </h5>
                    <p
                        className="mb-0"
                        style={{
                            color: "#4B5563",
                            fontSize: "14px",
                            fontWeight: "400",
                            fontFamily: "BasisGrotesquePro",
                        }}
                    >
                        Core platform settings and configurations
                    </p>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Platform Name
                            </label>
                            <input 
                                type="text" 
                                className="form-control w-full" 
                                defaultValue="Tax Practice Management Platform"
                                style={{ 
                                    backgroundColor: "white", 
                                    border: "1px solid #E8F0FF", 
                                    borderRadius: "6px",
                                    padding: "8px 12px",
                                    fontSize: "14px",
                                    color: "#495057"
                                }}
                            />
                        </div>

                        <div>
                            <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Default Timezone
                            </label>
                            <select 
                                className="form-control w-full"
                                style={{ 
                                    backgroundColor: "white", 
                                    border: "1px solid #E8F0FF", 
                                    borderRadius: "6px",
                                    padding: "8px 12px",
                                    fontSize: "14px",
                                    color: "#495057"
                                }}
                            >
                                <option value="UTC">UTC</option>
                                <option value="EST">EST</option>
                                <option value="PST">PST</option>
                                <option value="CST">CST</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Maintenance Message
                            </label>
                            <textarea 
                                className="form-control w-full"
                                rows="4"
                                defaultValue="Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM EST."
                                style={{ 
                                    backgroundColor: "white", 
                                    border: "1px solid #E8F0FF", 
                                    borderRadius: "6px",
                                    padding: "8px 12px",
                                    fontSize: "14px",
                                    color: "#495057",
                                    resize: "vertical"
                                }}
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <div>
                                <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                    Enable Maintenance Mode
                                </label>
                            </div>
                            <div className="custom-toggle">
                                <input
                                    type="checkbox"
                                    id="maintenanceMode"
                                    checked={maintenanceMode}
                                    onChange={() => setMaintenanceMode(!maintenanceMode)}
                                />
                                <label htmlFor="maintenanceMode"></label>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Support Email
                            </label>
                            <input 
                                type="email" 
                                className="form-control w-full" 
                                defaultValue="support@taxpractice.com"
                                style={{ 
                                        backgroundColor: "white", 
                                    border: "1px solid #E8F0FF", 
                                    borderRadius: "6px",
                                    padding: "8px 12px",
                                    fontSize: "14px",
                                    color: "#495057"
                                }}
                            />
                        </div>

                        <div>
                            <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Session Timeout (minutes)
                            </label>
                            <select 
                                className="form-control w-full"
                                style={{ 
                                    backgroundColor: "white", 
                                    border: "1px solid #E8F0FF", 
                                    borderRadius: "6px",
                                    padding: "8px 12px",
                                    fontSize: "14px",
                                    color: "#495057"
                                }}
                            >
                                <option value="30">30</option>
                                <option value="60" selected>60</option>
                                <option value="120">120</option>
                                <option value="240">240</option>
                            </select>
                        </div>
                    </div>
                </div>
                </div>
                
                <div className="border border-[#E8F0FF] p-4 rounded-lg bg-white mt-4">
                {/* Notification Settings Section */}
                <div>
                    <h5
                        className="mb-0 me-3"
                        style={{
                            color: "#3B4A66",
                            fontSize: "24px",
                            fontWeight: "500",
                            fontFamily: "BasisGrotesquePro",
                        }}
                    >
                        Notification Settings
                    </h5>
                    <p
                        className="mb-0"
                        style={{
                            color: "#4B5563",
                            fontSize: "14px",
                            fontWeight: "400",
                            fontFamily: "BasisGrotesquePro",
                        }}
                    >
                        Configure system-wide notification preferences
                    </p>
                </div>

                {/* Notification Toggles */}
                <div className="flex flex-col gap-4">
                    {/* Email Notifications */}
                    <div className="flex justify-between items-center">
                        <div>
                            <div style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Email Notifications
                            </div>
                            <p style={{ color: "#6B7280", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro", margin: "4px 0 0 0" }}>
                                Send email alerts for system events
                            </p>
                        </div>
                        <div className="custom-toggle">
                            <input
                                type="checkbox"
                                id="emailNotifications"
                                checked={emailNotifications}
                                onChange={() => setEmailNotifications(!emailNotifications)}
                            />
                            <label htmlFor="emailNotifications"></label>
                        </div>
                    </div>

                    {/* SMS Alerts */}
                    <div className="flex justify-between items-center">
                        <div>
                            <div style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                SMS Alerts
                            </div>
                            <p style={{ color: "#6B7280", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro", margin: "4px 0 0 0" }}>
                                Send SMS for critical system issues
                            </p>
                        </div>
                        <div className="custom-toggle">
                            <input
                                type="checkbox"
                                id="smsAlerts"
                                checked={smsAlerts}
                                onChange={() => setSmsAlerts(!smsAlerts)}
                            />
                            <label htmlFor="smsAlerts"></label>
                        </div>
                    </div>

                    {/* Slack Integration */}
                    <div className="flex justify-between items-center">
                        <div>
                            <div style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Slack Integration
                            </div>
                            <p style={{ color: "#6B7280", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro", margin: "4px 0 0 0" }}>
                                Post alerts to Slack channels
                            </p>
                        </div>
                        <div className="custom-toggle">
                            <input
                                type="checkbox"
                                id="slackIntegration"
                                checked={slackIntegration}
                                onChange={() => setSlackIntegration(!slackIntegration)}
                            />
                            <label htmlFor="slackIntegration"></label>
                        </div>
                    </div>

                    {/* Weekly Reports */}
                    <div className="flex justify-between items-center">
                        <div>
                            <div style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Weekly Reports
                            </div>
                            <p style={{ color: "#6B7280", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro", margin: "4px 0 0 0" }}>
                                Automated weekly system reports
                            </p>
                        </div>
                        <div className="custom-toggle">
                            <input
                                type="checkbox"
                                id="weeklyReports"
                                checked={weeklyReports}
                                onChange={() => setWeeklyReports(!weeklyReports)}
                            />
                            <label htmlFor="weeklyReports"></label>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-6">
                    <button
                        type="button"
                        className="btn d-flex align-items-center gap-2 px-6 py-2 rounded-lg"
                        style={{ backgroundColor: "#F56D2D", color: "#ffffff", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro", border: "none" }}
                    >
                        <SaveIcon />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>

    );      
}
