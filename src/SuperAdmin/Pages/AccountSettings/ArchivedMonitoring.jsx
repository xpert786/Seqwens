import React, { useState } from "react";

export default function ArchivedMonitoring() {
    const [searchTerm, setSearchTerm] = useState("");
    const [enableRetentionRules, setEnableRetentionRules] = useState(false);
    const [retentionYears, setRetentionYears] = useState("5 Years");

    const firmsData = [
        {
            id: 1,
            firm: "Acme Tax Suite",
            offices: "5",
            archivedDocs: "12,500",
            storageUsed: "120GB",
            retention: "7 Years",
            lastAudit: "2025-09-12"
        },
        {
            id: 2,
            firm: "BlueSky Financial",
            offices: "3",
            archivedDocs: "8,000",
            storageUsed: "80GB",
            retention: "5 Years",
            lastAudit: "2026-04-20"
        },
        {
            id: 3,
            firm: "TaxPro Experts",
            offices: "8",
            archivedDocs: "20,000",
            storageUsed: "250GB",
            retention: "10 Years",
            lastAudit: "2024-11-05"
        }
    ];

    const retentionOptions = [
        "1 Year",
        "3 Years", 
        "5 Years",
        "7 Years",
        "10 Years"
    ];

    return (
        <div className="min-h-screen ">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Archive Monitoring */}
                <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-[#E8F0FF]">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-[#3B4A66] text-2xl font-semibold font-[BasisGrotesquePro] mb-2">
                                Archive Monitoring
                            </h3>
                            <p className="text-[#6B7280] text-sm font-normal font-[BasisGrotesquePro]">
                                Track, manage, and safeguard archives with ease
                            </p>
                        </div>
                        
                        {/* Export Button */}
                        <button className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium font-[BasisGrotesquePro] hover:bg-orange-600 transition-colors" style={{borderRadius: "7px"}}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export CSV
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative max-w-md mb-6">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-[300px] pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-[BasisGrotesquePro]"
                            placeholder="Search, Tickets or Users.."
                        />
                    </div>
                   

                    {/* Firms Data Table */}
                    <div className="space-y-3">
                        {/* Header Row */}
                        <div className="grid grid-cols-6 gap-4 py-3 px-4  rounded-lg">
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Firm</div>
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Offices</div>
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Archived Docs</div>
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Storage Used</div>
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Retention</div>
                            <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Last Audit</div>
                        </div>

                        {/* Data Rows */}
                        {firmsData.map((firm) => (
                            <div key={firm.id} className="grid grid-cols-6 gap-4 py-4 px-4 border border-[#E8F0FF] rounded-lg bg-white hover:bg-gray-50">
                                <div className="text-sm font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                                    {firm.firm}
                                </div>
                                <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">
                                    {firm.offices}
                                </div>
                                <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">
                                    {firm.archivedDocs}
                                </div>
                                <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">
                                    {firm.storageUsed}
                                </div>
                                <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">
                                    {firm.retention}
                                </div>
                                <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">
                                    {firm.lastAudit}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel - Data Retention */}
                <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
                    {/* Header */}
                    <div className="mb-6">
                        <h3 className="text-[#3B4A66] text-2xl font-semibold font-[BasisGrotesquePro] mb-2">
                            Data Retention
                        </h3>
                        <p className="text-[#6B7280] text-sm font-normal font-[BasisGrotesquePro]">
                            Auto-archive or purge data after a configurable retention period.
                        </p>
                    </div>

                    {/* Enable Retention Rules */}
                    <div className="mb-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={enableRetentionRules}
                                onChange={(e) => setEnableRetentionRules(e.target.checked)}
                                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <span className="ml-2 text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                                Enable Retention Rules
                            </span>
                        </label>
                    </div>

                    {/* Years to Keep */}
                    <div>
                        <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                            Years to keep
                        </label>
                        <div className="relative">
                            <select
                                value={retentionYears}
                                onChange={(e) => setRetentionYears(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-[BasisGrotesquePro] appearance-none"
                            >
                                {retentionOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
