import React from "react";
import { SaveIcon } from "../../component/icons"


export default function Profile() {
    return (
        <div style={{
            backgroundColor: "#F3F7FF",
            padding: "10px",
            borderRadius: "12px",
            border: "none"
        }}>
                <div className="flex flex-col gap-4 border border-[#E8F0FF] p-4 rounded-lg bg-white">
            <div className="align-items-center  ">
                <h5
                    className="mb-0 me-3"
                    style={{
                        color: "#3B4A66",
                        fontSize: "24px",
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
                    Update your personal details
                </p>
            </div>


            {/* Profile Image */}
            <div className="d-flex align-items-center mb-4 mt-2">
                <img
                    src="https://i.pravatar.cc/120"
                    alt="Profile"
                    className="rounded-circle me-3"
                    width="99.96px"
                    height="98px"
                />
                <div>
                    <button className="btn border border-[#E8F0FF]  text-black btn-sm mb-2" style={{  fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
                        Change Avatar
                    </button>
                    
                </div>
            </div>

            {/* Form */}
            <form>
                <div className="grid grid-cols-1 gap-4p-4 rounded-lg mb-4">
                    <div className="col-span-1">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Name</label>
                        <input type="text" className="form-control w-full" defaultValue="Michael" />
                    </div>
                    <div className="col-span-1">
                        <label className="form-label w-full" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Email</label>
                        <input type="text" className="form-control w-full" placeholder="john.smith@firm.com" />
                    </div>
                    <div className="col-span-1">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Phone Number</label>
                        <input type="text" className="form-control w-full" style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }} defaultValue="Brown" />
                    </div>
                    <div className="col-span-1">
                    <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Availability</label>
                        <input
                            type="email"
                            className="form-control w-full"
                            style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                            defaultValue="michael@example.com"
                        />
                    </div>

                </div>

            </form>
            </div>


            
            <div className="grid grid-cols-1 gap-4 border border-[#E8F0FF] p-4 rounded-lg mt-4 bg-white">
                    <div className="col-span-1">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Name</label>
                        <input type="text" className="form-control w-full" defaultValue="Michael" />
                    </div>
                    <div className="col-span-1">
                        <label className="form-label w-full" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Email</label>
                        <input type="text" className="form-control w-full" placeholder="john.smith@firm.com" />
                    </div>
                    <div className="col-span-1">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Phone Number</label>
                        <input type="text" className="form-control w-full" style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }} defaultValue="Brown" />
                    </div>
                    <div className="col-span-1">
                    <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Availability</label>
                        <input
                            type="email"
                            className="form-control w-full"
                            style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                            defaultValue="michael@example.com"
                        />
                    </div>
                    <div className="mt-1">
                    <button
                        type="button"
                        className="btn d-flex align-items-center gap-2"
                        style={{ backgroundColor: "#F56D2D", color: "#ffffff", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                    >
                        <SaveIcon />
                        Save Changes
                    </button>

                </div>
            </div>
        </div>
    );      
}
