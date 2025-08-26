import React, { useState } from "react";
import { FaSearch, FaFilter, FaFolder } from "react-icons/fa";
import { BiGridAlt, BiListUl } from "react-icons/bi";
import "../../styles/Folders.css";

const folderData = [
    { name: "Tax Year 2023", description: "All documents related to 2023 tax year", count: "3 Documents", date: "12/06/2025" },
    { name: "Tax Year 2022", description: "Archived documents from 2022 tax year", count: "3 Documents", date: "10/06/2025" },
    { name: "Business Expenses", description: "Business-related receipts and documentation", count: "2 Documents", date: "12/05/2025" },
    { name: "Investment Documents", description: "Investment statements and tax forms", count: "2 Documents", date: "12/05/2025" },
    { name: "Banking", description: "Bank statements and financial records", count: "2 Documents", date: "03/06/2025" },
    { name: "Medical", description: "Medical expenses and insurance documents", count: "2 Documents", date: "12/05/2025" },
    { name: "Tax Returns", description: "Completed and draft tax returns", count: "3 Documents", date: "12/05/2025" },
];

export default function Folders() {
    const [view, setView] = useState("grid");
    const [selectedIndex, setSelectedIndex] = useState(null);

    return (
        <div className="folders-wrapper">
            {/* Top Controls */}
            <div className="d-flex justify-content-between align-items-center flex-wrap px-2 pt-4">
                <div className="d-flex align-items-center gap-2">
                    <div className="search-box">
                        <div className="search-box position-relative">
                            <i className="bi bi-search search-icon-inside"></i>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="form-control  ps-5"
                            />
                        </div>

                    </div>


                </div>
                <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
                    <button className="btn btn-outline-secondary d-flex align-items-center gap-2 rounded custom-btn">
                        <FaFilter /> Filter
                    </button>
                    <button
                        className={`btn ${view === "grid" ? "btn-info" : "btn-outline-secondary"} rounded`}
                        onClick={() => setView("grid")}
                    >
                        <BiGridAlt />
                    </button>
                    <button
                        className={`btn ${view === "list" ? "btn-info" : "btn-outline-secondary"} rounded`}
                        onClick={() => setView("list")}
                    >
                        <BiListUl />
                    </button>
                </div>
            </div>

            {/* Folder Box */}
            <div className="container-fluid p-2 mt-3">
                <div className="bg-white p-3 rounded-3 ">
                    <div className="mb-3">
                        <h5 className="folders-title">Document Folders</h5>
                        <p className="folders-subtitle">
                            Organize your documents by category and tax year
                        </p>
                    </div>


                    <div className="row g-3">
                        {folderData.map((folder, idx) => (
                            <div className="col-sm-6 col-md-4 col-lg-3" key={idx}>
                                <div
                                    className={`folder-card border rounded-3 p-3 h-100 ${selectedIndex === idx ? "active" : ""}`}
                                    onClick={() => setSelectedIndex(idx)}
                                >
                                    <div className="d-flex align-items-center justify-content-start gap-2">
                                        <FaFolder size={24} className="folder-icon" />
                                        <div className="fw-semibold folder-name">{folder.name}</div>
                                        <span className="badge bg-white text-muted border rounded-pill template-badge">
                                            Template
                                        </span>
                                    </div>
                                    <div className="ms-4">
                                        <div className="text-muted small mt-2 folder-desc">{folder.description}</div>
                                        <div className="d-flex justify-content-between text-muted small mt-2 me-2 folder-info">
                                            <span>{folder.count}</span>
                                            <span>Last: {folder.date}</span>
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
