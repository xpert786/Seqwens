import React from "react";
import { SaveIcon } from "../icons"

export default function Profile() {
    return (
        <div >
            <div className="align-items-center mb-3 ">
                <h5
                    className="mb-0 me-3"
                    style={{
                        color: "#3B4A66",
                        fontSize: "20px",
                        fontWeight: "500",
                        fontFamily: "BasisGrotesquePro",
                    }}
                >
                    Personal Information
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
                    Update your personal details and tax information
                </p>
            </div>


            {/* Profile Image */}
            <div className="d-flex align-items-center mb-4 mt-6">
                <img
                    src="https://i.pravatar.cc/120"
                    alt="Profile"
                    className="rounded-circle me-3"
                    width="99.96px"
                    height="98px"
                />
                <div>
                    <button className="btn  text-white btn-sm mb-2" style={{ background: "#F56D2D", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
                        Change Photo
                    </button>
                    <p className="text-muted small mb-0" style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>JPG, PNG up to 2MB</p>
                </div>
            </div>

            {/* Form */}
            <form>
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>First Name</label>
                        <input type="text" className="form-control" defaultValue="Michael" />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Middle Initial</label>
                        <input type="text" className="form-control" />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Last Name</label>
                        <input type="text" className="form-control" style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }} defaultValue="Brown" />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Email</label>
                        <input
                            type="email"
                            className="form-control"
                            style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                            defaultValue="michael@example.com"
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Phone</label>
                        <input
                            type="text"
                            className="form-control"
                            style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                            defaultValue="+01 (565) 123-4567"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <button
                        type="button"
                        className="btn d-flex align-items-center gap-2"
                        style={{ backgroundColor: "#F56D2D", color: "#ffffff", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                    >
                        <SaveIcon />
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
