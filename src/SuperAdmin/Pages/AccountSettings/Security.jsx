import React, { useState } from "react";
import { SaveIcon, EyeIcon, RefreshIcon, TrashIcon, EyeOffIcon, RefreshIcon1, TrashIcon1 } from "../../Components/icons";

export default function Security() {
    const [twoFactorAuth, setTwoFactorAuth] = useState(true);
    const [passwordComplexity, setPasswordComplexity] = useState(false);
    const [ipWhitelisting, setIpWhitelisting] = useState(true);
    const [auditLogging, setAuditLogging] = useState(true);
    const [sessionTimeout, setSessionTimeout] = useState("30");
    const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");

    const apiKeys = [
        {
            id: 1,
            service: "Stripe Integration",
            key: "sk_live_***************",
            status: "Active",
            lastUsed: "2 hours ago",
            description: "Payment processing"
        },
        {
            id: 2,
            service: "Email Service",
            key: "key_***************",
            status: "Active",
            lastUsed: "1 day ago",
            description: "Email notifications"
        },
        {
            id: 3,
            service: "SMS Provider",
            key: "api_***************",
            status: "Inactive",
            lastUsed: "1 week ago",
            description: "SMS alerts"
        },
        {
            id: 4,
            service: "Cloud Storage",
            key: "aws_***************",
            status: "Active",
            lastUsed: "5 min ago",
            description: "Document uploads"
        }
    ];

    const getStatusColor = (status) => {
        return status === "Active" ? "#22C55E" : "#EF4444";
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
                        Security Configuration
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
                        Platform security settings and policies
                    </p>
                </div>

                {/* Security Settings */}
                <div style={{ marginBottom: "24px" }}>
                    {/* Two-Factor Authentication */}
                    <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        marginBottom: "20px"
                    }}>
                        <div>
                            <div style={{ 
                                color: "#3B4A66", 
                                fontSize: "16px", 
                                fontWeight: "500", 
                                fontFamily: "BasisGrotesquePro",
                                marginBottom: "4px"
                            }}>
                                Two-Factor Authentication
                            </div>
                            <p style={{ 
                                color: "#6B7280", 
                                fontSize: "14px", 
                                fontWeight: "400", 
                                fontFamily: "BasisGrotesquePro", 
                                margin: "0"
                            }}>
                                Require 2FA for all admin accounts
                            </p>
                        </div>
                        <div style={{
                            position: "relative",
                            width: "44px",
                            height: "24px",
                            backgroundColor: twoFactorAuth ? "#F56D2D" : "#D1D5DB",
                            borderRadius: "12px",
                            cursor: "pointer",
                            transition: "background-color 0.2s"
                        }} onClick={() => setTwoFactorAuth(!twoFactorAuth)}>
                            <div style={{
                                position: "absolute",
                                top: "2px",
                                left: twoFactorAuth ? "22px" : "2px",
                                width: "20px",
                                height: "20px",
                                backgroundColor: "white",
                                borderRadius: "50%",
                                transition: "left 0.2s",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                            }} />
                        </div>
                    </div>

                    {/* Password Complexity */}
                    <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        marginBottom: "20px"
                    }}>
                        <div>
                            <div style={{ 
                                color: "#3B4A66", 
                                fontSize: "16px", 
                                fontWeight: "500", 
                                fontFamily: "BasisGrotesquePro",
                                marginBottom: "4px"
                            }}>
                                Password Complexity
                            </div>
                            <p style={{ 
                                color: "#6B7280", 
                                fontSize: "14px", 
                                fontWeight: "400", 
                                fontFamily: "BasisGrotesquePro", 
                                margin: "0"
                            }}>
                                Enforce strong password requirements
                            </p>
                        </div>
                        <div style={{
                            position: "relative",
                            width: "44px",
                            height: "24px",
                            backgroundColor: passwordComplexity ? "#F56D2D" : "#D1D5DB",
                            borderRadius: "12px",
                            cursor: "pointer",
                            transition: "background-color 0.2s"
                        }} onClick={() => setPasswordComplexity(!passwordComplexity)}>
                            <div style={{
                                position: "absolute",
                                top: "2px",
                                left: passwordComplexity ? "22px" : "2px",
                                width: "20px",
                                height: "20px",
                                backgroundColor: "white",
                                borderRadius: "50%",
                                transition: "left 0.2s",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                            }} />
                        </div>
                    </div>

                    {/* IP Whitelisting */}
                    <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        marginBottom: "20px"
                    }}>
                        <div>
                            <div style={{ 
                                color: "#3B4A66", 
                                fontSize: "16px", 
                                fontWeight: "500", 
                                fontFamily: "BasisGrotesquePro",
                                marginBottom: "4px"
                            }}>
                                IP Whitelisting
                            </div>
                            <p style={{ 
                                color: "#6B7280", 
                                fontSize: "14px", 
                                fontWeight: "400", 
                                fontFamily: "BasisGrotesquePro", 
                                margin: "0"
                            }}>
                                Restrict admin access by IP address
                            </p>
                        </div>
                        <div style={{
                            position: "relative",
                            width: "44px",
                            height: "24px",
                            backgroundColor: ipWhitelisting ? "#F56D2D" : "#D1D5DB",
                            borderRadius: "12px",
                            cursor: "pointer",
                            transition: "background-color 0.2s"
                        }} onClick={() => setIpWhitelisting(!ipWhitelisting)}>
                            <div style={{
                                position: "absolute",
                                top: "2px",
                                left: ipWhitelisting ? "22px" : "2px",
                                width: "20px",
                                height: "20px",
                                backgroundColor: "white",
                                borderRadius: "50%",
                                transition: "left 0.2s",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                            }} />
                        </div>
                    </div>

                    {/* Audit Logging */}
                    <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        marginBottom: "24px"
                    }}>
                        <div>
                            <div style={{ 
                                color: "#3B4A66", 
                                fontSize: "16px", 
                                fontWeight: "500", 
                                fontFamily: "BasisGrotesquePro",
                                marginBottom: "4px"
                            }}>
                                Audit Logging
                            </div>
                            <p style={{ 
                                color: "#6B7280", 
                                fontSize: "14px", 
                                fontWeight: "400", 
                                fontFamily: "BasisGrotesquePro", 
                                margin: "0"
                            }}>
                                Log all administrative actions
                            </p>
                        </div>
                        <div style={{
                            position: "relative",
                            width: "44px",
                            height: "24px",
                            backgroundColor: auditLogging ? "#F56D2D" : "#D1D5DB",
                            borderRadius: "12px",
                            cursor: "pointer",
                            transition: "background-color 0.2s"
                        }} onClick={() => setAuditLogging(!auditLogging)}>
                            <div style={{
                                position: "absolute",
                                top: "2px",
                                left: auditLogging ? "22px" : "2px",
                                width: "20px",
                                height: "20px",
                                backgroundColor: "white",
                                borderRadius: "50%",
                                transition: "left 0.2s",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                            }} />
                        </div>
                    </div>
                </div>

                {/* Session Timeout and Max Login Attempts */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                        <label style={{ 
                            color: "#3B4A66", 
                            fontSize: "14px", 
                            fontWeight: "500", 
                            fontFamily: "BasisGrotesquePro",
                            display: "block",
                            marginBottom: "8px"
                        }}>
                            Session Timeout (minutes)
                        </label>
                        <input 
                            type="number" 
                            value={sessionTimeout}
                            onChange={(e) => setSessionTimeout(e.target.value)}
                            style={{ 
                                width: "100%",
                                backgroundColor: "white", 
                                border: "1px solid #E8F0FF", 
                                borderRadius: "6px",
                                padding: "8px 12px",
                                fontSize: "14px",
                                color: "#495057",
                                fontFamily: "BasisGrotesquePro"
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ 
                            color: "#3B4A66", 
                            fontSize: "14px", 
                            fontWeight: "500", 
                            fontFamily: "BasisGrotesquePro",
                            display: "block",
                            marginBottom: "8px"
                        }}>
                            Max Login Attempts
                        </label>
                        <input 
                            type="number" 
                            value={maxLoginAttempts}
                            onChange={(e) => setMaxLoginAttempts(e.target.value)}
                            style={{ 
                                width: "100%",
                                backgroundColor: "white", 
                                border: "1px solid #E8F0FF", 
                                borderRadius: "6px",
                                padding: "8px 12px",
                                fontSize: "14px",
                                color: "#495057",
                                fontFamily: "BasisGrotesquePro"
                            }}
                        />
                    </div>
                </div>
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

                {/* Active API Keys Section */}
                <div>
                    <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        marginBottom: "16px"
                    }}>
                        <h6
                            style={{
                                color: "#3B4A66",
                                fontSize: "18px",
                                fontWeight: "500",
                                fontFamily: "BasisGrotesquePro",
                                margin: "0"
                            }}
                        >
                            Active API Keys
                        </h6>
                        <button
                            type="button"
                            style={{ 
                                backgroundColor: "#F56D2D", 
                                color: "#ffffff", 
                                fontSize: "14px", 
                                fontWeight: "400", 
                                fontFamily: "BasisGrotesquePro", 
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "6px",
                                cursor: "pointer"
                            }}
                        >
                            Add API Key
                        </button>
                    </div>

                    {/* API Keys Table */}
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
                                                    {apiKey.service}
                                                </div>
                                                <div style={{ 
                                                    color: "#6B7280", 
                                                    fontSize: "12px", 
                                                    fontWeight: "400", 
                                                    fontFamily: "BasisGrotesquePro"
                                                }}>
                                                    {apiKey.description}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 0", border: "none" }}>
                                            <div style={{ 
                                                color: "#6B7280", 
                                                fontSize: "14px", 
                                                fontWeight: "400", 
                                                fontFamily: "BasisGrotesquePro" 
                                            }}>
                                                {apiKey.key}
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
                                                {apiKey.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 0", border: "none" }}>
                                            <div style={{ 
                                                color: "#6B7280", 
                                                fontSize: "14px", 
                                                fontWeight: "400", 
                                                fontFamily: "BasisGrotesquePro" 
                                            }}>
                                                {apiKey.lastUsed}
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 0", border: "none" }}>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <button
                                                    type="button"
                                                    style={{ 
                                                        backgroundColor: "transparent", 
                                                        border: "none", 
                                                        color: "#6B7280",
                                                        padding: "4px",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    <EyeOffIcon />      
                                                </button>
                                                <button
                                                    type="button"
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
                </div>
            </div>
        </div>
    );
}