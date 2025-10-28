import React, { useState } from "react";
import Overview from "./Overview";
import IRSFAQs from "./IRSFAQs";
import SeqwensTraining from "./SeqwensTraining";

export default function SupportCenter() {
    const [activeTab, setActiveTab] = useState("overview");
    const [showTicketDetail, setShowTicketDetail] = useState(false);
    const [showAddFAQModal, setShowAddFAQModal] = useState(false);
    const [showAddTrainingModal, setShowAddTrainingModal] = useState(false);

    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "irsFAQs", label: "IRS FAQs" },
        { id: "seqwensTraining", label: "Seqwens Training" }
    ];

    const handleTicketDetailToggle = (isShowing) => {
        setShowTicketDetail(isShowing);
    };

    const handleAddFAQModalToggle = (isShowing) => {
        setShowAddFAQModal(isShowing);
    };

    const handleAddTrainingModalToggle = (isShowing) => {
        setShowAddTrainingModal(isShowing);
    };

    const handleAddNew = () => {
        if (activeTab === "irsFAQs") {
            setShowAddFAQModal(true);
        } else if (activeTab === "seqwensTraining") {
            setShowAddTrainingModal(true);
        }
    };

    return (
        <div className="container-fluid px-4">
            {/* Header Section - only show when not in ticket detail */}
            {!showTicketDetail && (
                <div className="mb-6">
                    <h3 className="text-[#3B4A66] text-2xl font-semibold font-[BasisGrotesquePro] mb-2">
                        Support Center
                    </h3>
                    <p className="text-[#6B7280] text-sm font-normal font-[BasisGrotesquePro]">
                        Manage customer support tickets and communications
                    </p>
                </div>
            )}

            {/* Tab Navigation - only show when not in ticket detail */}
            {!showTicketDetail && (
                <div className="flex justify-between items-center mb-6">
                    <div className="flex space-x-1 border border-[#E8F0FF] rounded-lg p-2 bg-white">
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
                    
                    {/* Add New Button - only show for IRS FAQs and Training tabs */}
                    {(activeTab === "irsFAQs" || activeTab === "seqwensTraining") && (
                        <button
                            onClick={handleAddNew}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center transition-colors"
                            style={{ borderRadius: '7px' }}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add New
                        </button>
                    )}
                </div>
            )}

            {/* Tab Content */}
            <div>
                {activeTab === "overview" && <Overview showHeader={true} onTicketDetailToggle={handleTicketDetailToggle} />}
                {activeTab === "irsFAQs" && <IRSFAQs onAddFAQModalToggle={handleAddFAQModalToggle} showAddFAQModal={showAddFAQModal} />}
                {activeTab === "seqwensTraining" && <SeqwensTraining onAddTrainingModalToggle={handleAddTrainingModalToggle} showAddTrainingModal={showAddTrainingModal} />}
            </div>
        </div>
    );
}
