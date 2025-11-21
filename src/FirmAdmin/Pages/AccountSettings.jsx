import React from "react";
import Profile from "./AccountSettings/Profile";

export default function AccountSettings() {
    return (
        <div className="container-fluid px-4">
            <div className="align-items-center mb-4">
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

            <Profile />
        </div>
    );
}
