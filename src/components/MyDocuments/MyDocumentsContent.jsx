
import React, { useState } from "react";
import { FileIcon, OverdueIcon, UploadIcons, CompletedIcon, AwaitingIcon } from "../icons";
import "../../styles/Document.css"

const documents = [
    {
        name: "Tax_Return_2023_Draft.pdf",
        size: "1.2MB",
        type: "PDF",
        date: "Mar 12, 2024",
        folder: "For Review",
        status: "Waiting Signature",
        badgeClass: "bg-darkblue text-white",
        tags: ["Tax Return 2023", "Pending", "Draft", "Signature Needed"],
    },
    {
        name: "2023_W2_AHC_Corped.pdf",
        size: "834KB",
        type: "PDF",
        date: "Mar 10, 2024",
        folder: "Tax Year 2023",
        status: "Processed",
        badgeClass: "bg-darkgreen text-white",
        tags: ["Tax", "Processed", "Reviewed"],
    },
    {
        name: "Bank_Statement_Chs_2023.pdf",
        size: "2.1MB",
        type: "PDF",
        date: "Mar 9, 2024",
        folder: "Banking",
        status: "Quick Review",
        badgeClass: "bg-darkbroun text-white ",
        tags: ["Banking", "Review", "Statements"],
    },
    {
        name: "Medical_Expenses_2023.xlsx",
        size: "436KB",
        type: "Excel",
        date: "Mar 5, 2024",
        folder: "Medical",
        status: "Need Clarification",
        badgeClass: "bg-darkcolour text-white",
        tags: ["Medical", "Expenses", "Clarification", "2023"],
    },
];

export default function MyDocumentsContent() {
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [view, setView] = useState("list");

    return (
        <div  >

            <div className="row g-3 mb-3">
                {["Pending", "Completed", "Overdue", "Uploaded"].map((label, index) => {

                    const IconComponent = {
                        Pending: AwaitingIcon,
                        Completed: CompletedIcon,
                        Overdue: OverdueIcon,
                        Uploaded: UploadIcons,
                    }[label];

                    return (
                        <div className="col-sm-6 col-md-3" key={index}>
                            <div
                                className="bg-white p-3 d-flex flex-column justify-content-between"
                                style={{ borderRadius: "12px", height: "130px" }}
                            >
                                <div className="d-flex justify-content-between align-items-start">
                                    <div
                                        className="d-flex align-items-center justify-content-center"
                                        style={{
                                            width: "30px",
                                            height: "30px",

                                        }}
                                    >
                                        <IconComponent size={16} color="#00bcd4" />
                                    </div>
                                    <span className="fw-semibold text-dark">1</span>
                                </div>

                                {/* Bottom label */}
                                <div className="mt-2">
                                    <p className="mb-0 text-muted small fw-semibold" style={{ fontFamily: "BasisGrotesquePro", }}>{label}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>


            {/* Filters */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">

                <div className="mydocs-search-wrapper">
                    <i className="bi bi-search mydocs-search-icon"></i>
                    <input
                        type="text"
                        className="form-control mydocs-search-input"
                        placeholder="Search..."
                    />
                </div>


                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <select className="form-select" style={{ width: "140px" }}>
                        <option>All Status</option>
                        <option>Processed</option>
                        <option>Pending</option>
                    </select>

                    <select className="form-select" style={{ width: "120px" }}>
                        <option>Date</option>
                        <option>Name</option>
                    </select>

                    <button
                        className={`btn ${view === "list" ? "btn-info" : "btn-outline-secondary"}`}
                        onClick={() => setView("list")}
                    >
                        <i className="bi bi-list" />
                    </button>
                    <button
                        className={`btn ${view === "grid" ? "btn-info" : "btn-outline-secondary"}`}
                        onClick={() => setView("grid")}
                    >
                        <i className="bi bi-grid-3x3-gap" />
                    </button>
                </div>
            </div>

            <div className="p-4 bg-white" style={{ borderRadius: "15px" }}>


                <div className="align-items-center mb-3 ">
                    <h5 className="mb-0 me-3" style={{ fontSize: "20px", fontWeight: "500", color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
                        My Documents (8)
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
                        All documents you'we uploaded and shared documents
                    </p>
                </div>


                <div className="pt-2 pb-2">
                    <div className="row g-3">
                        {documents.map((doc, index) => (
                            <div className="col-12" key={index}>
                                <div
                                    className="p-3 border rounded-4"
                                    style={{
                                        backgroundColor: selectedIndex === index ? "#FFF4E6" : "#FFFFFF",
                                        cursor: "pointer",
                                        transition: "background-color 0.3s ease",
                                    }}
                                    onClick={() => setSelectedIndex(index)}
                                >
                                    <div className="d-flex justify-content-between align-items-start flex-wrap">
                                        {/* Left Side: File Info */}
                                        <div className="d-flex gap-3 align-items-start">
                                            <div
                                                className="d-flex align-items-center justify-content-center"
                                                style={{ width: 40, height: 40 }}
                                            >
                                                <span className="mydocs-icon-wrapper">
                                                    <FileIcon />
                                                </span>
                                            </div>

                                            <div>
                                                <div className="fw-medium" style={{ fontFamily: "BasisGrotesquePro" }}>
                                                    {doc.name}
                                                </div>
                                                <div className="text-muted " style={{ fontSize: "13px", fontFamily: "BasisGrotesquePro", color: "#131323", fontWeight: "400" }}>
                                                    Type: {doc.type} • Size: {doc.size} • Updated: {doc.date} • Folder: {doc.folder}
                                                </div>

                                                <div className="mt-2 d-flex flex-wrap gap-2">
                                                    {doc.tags.map((tag, tagIdx) => (
                                                        <span
                                                            key={tagIdx}
                                                            className="badge rounded-pill bg-white text-dark "
                                                            style={{ fontSize: "0.75rem", fontFamily: "BasisGrotesquePro" }}
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Status + Menu */}
                                        <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
                                            <span
                                                className={`badge ${doc.badgeClass} px-3 py-2`}
                                                style={{
                                                    borderRadius: "20px",
                                                    fontSize: "0.75rem",
                                                    fontWeight: "500",
                                                    fontFamily: "BasisGrotesquePro",
                                                    color: "#FFFFFF"

                                                }}
                                            >
                                                {doc.status}
                                            </span>

                                            <button
                                                className="btn btn-white border-0 p-2 d-flex align-items-center justify-content-center"
                                                style={{
                                                    width: "32px",
                                                    height: "32px",
                                                    borderRadius: "50%",
                                                    fontFamily: "BasisGrotesquePro",
                                                }}
                                            >
                                                <i className="bi bi-three-dots-vertical" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}


