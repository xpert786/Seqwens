import React, { useState } from "react";
import Overview from "./Overview";
import IRSFAQs from "./IRSFAQs";
import SeqwensTraining from "./SeqwensTraining";

export default function SupportCenter() {
    const [activeTab, setActiveTab] = useState("overview");

    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "irsFAQs", label: "IRS FAQs" },
        { id: "seqwensTraining", label: "Seqwens Training" }
    ];

    return (
        <div className="container-fluid px-4">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-[#3B4A66] text-2xl font-semibold font-[BasisGrotesquePro] mb-2">
                    Support Center
                </h3>
                <p className="text-[#6B7280] text-sm font-normal font-[BasisGrotesquePro]">
                    Manage customer support tickets and communications
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 w-fit border border-[#E8F0FF] rounded-lg p-2 bg-white">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium font-[BasisGrotesquePro] transition-colors ${
                            activeTab === tab.id
                                ? "bg-[#3B4A66] text-white"
                                : "bg-transparent text-[#3B4A66]"
                        }` }
                        style={{
                            borderRadius: '7px'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === "overview" && <Overview />}
                {activeTab === "irsFAQs" && <IRSFAQs />}
                {activeTab === "seqwensTraining" && <SeqwensTraining />}
            </div>
        </div>
    );
}
