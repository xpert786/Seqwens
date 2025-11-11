import React, { useState } from "react";
import { TotalFirmsIcon, BlueUserIcon, SystemHealthIcon } from "../../Components/icons";

export default function PlatformControl() {
    const [platformName, setPlatformName] = useState("Acme Tax Suite");
    const [primaryColor, setPrimaryColor] = useState("#FF8787");
    const [logoUrl, setLogoUrl] = useState("5");
    const [enableRetentionRules, setEnableRetentionRules] = useState(false);
    const [yearsToKeep, setYearsToKeep] = useState("");
    const [ipAddress, setIpAddress] = useState("203.120.45.0/24");
    const [require2FA, setRequire2FA] = useState(false);
    const [minPasswordLength, setMinPasswordLength] = useState("10");
    const [requireSpecialChar, setRequireSpecialChar] = useState(false);

    const auditData = [
        { label: "Active Firms", value: "128", icon: <TotalFirmsIcon /> },
        { label: "2FA Not Enforced", value: "12", icon: <BlueUserIcon /> },
        { label: "Pending IP Rules", value: "3", icon: <SystemHealthIcon /> }
    ];

    const storagePlans = [
        { name: "Starter", planId: "Plan ID 1", used: 50, total: 5000 },
        { name: "Growth", planId: "Plan ID 2", used: 4000, total: 5000 },
        { name: "Enterprise", planId: "Plan ID 3", used: 520, total: 5000 }
    ];

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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-[#4B5563] text-sm font-medium font-[BasisGrotesquePro] mb-2">
                            Platform Name
                        </label>
                        <input
                            type="text"
                            value={platformName}
                            onChange={(e) => setPlatformName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                        />
                    </div>
                    <div>
                        <label className="block text-[#4B5563] text-sm font-medium font-[BasisGrotesquePro] mb-2">
                            Primary Color
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-8 h-8 border border-gray-300  rounded cursor-pointer"
                                style={{ borderRadius: '10px' }}
                            />
                            <input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[#4B5563] text-sm font-medium font-[BasisGrotesquePro] mb-2">
                            Logo URL
                        </label>
                        <input
                            type="text"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                        />
                    </div>
                </div>

                {/* Live Preview */}
                <div >
                    <label className="block text-[#4B5563] text-sm font-semibold font-[BasisGrotesquePro] ">
                        Live preview
                    </label>
                    <div className="bg-[#F6F7FF] rounded-lg  flex flex-row items-center justify-start gap-2 pl-2">
                        <div
                            className="w-17 h-8 flex flex-col items-center justify-center text-white font-[BasisGrotesquePro]"
                            style={{ backgroundColor: primaryColor }}
                        >

                        </div>
                        <div className="text-[#4B5563] text-sm font-[BasisGrotesquePro] ml-3 mt-2  pt-2">
                            <p>{platformName}</p>
                            <p>firmsstaff.com</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* IP / Location Restrictions */}
                <div className="bg-white border border-[#E8F0FF] rounded-lg p-6">
                    <h3 className="text-[#4B5563] text-xl font-semibold font-[BasisGrotesquePro] mb-2">
                        IP / Location Restrictions
                    </h3>
                    <p className="text-[#4B5563] text-sm font-normal font-[BasisGrotesquePro] mb-6">
                        Limit where firms and staff can log in from.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="retentionRules"
                                checked={enableRetentionRules}
                                onChange={(e) => setEnableRetentionRules(e.target.checked)}
                                className="w-4 h-4 rounded focus:ring-[#3AD6F2] border-2"
                                style={{
                                    accentColor: "#3AD6F2",
                                    borderColor: "#3AD6F2",
                                }}
                            />
                            <label htmlFor="retentionRules" className="text-[#4B5563] text-sm font-medium font-[BasisGrotesquePro]">
                                Enable Retention Rules
                            </label>
                        </div>



                        <div>
                            <label className="block text-[#4B5563] text-sm font-medium font-[BasisGrotesquePro] mb-2">
                                years to keep
                            </label>
                            <div className="bg-white border border-[#E8F0FF] rounded-xl  pl-4 pr-4 pt-2 pb-2 ">
                                <div className="text-[#3B4A66] text-base font-semibold font-[BasisGrotesquePro] mb-1">
                                    203.120.45.0/24
                                </div>
                                <div className="text-[#6B7280] text-sm font-normal font-[BasisGrotesquePro]">
                                    ALLOW - Office VPN
                                </div>
                            </div>
                        </div>

                        <div className="text-gray-500 text-xs font-normal font-[BasisGrotesquePro] leading-relaxed">
                            <span className="text-[#3B4A66] font-semibold">Tip:</span> Use CIDR Notation For Ranges (Eg. 198.51.100.0/24). IP Restrictions Are Applied At The Tenant-Level And Can Be Overridden Per-Firm If Allowed.
                        </div>
                    </div>
                </div>

                {/* Security Enforcement */}
                <div className="bg-white border border-[#E8F0FF] rounded-lg p-6">
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
            </div>
        </div>
    );
}
