import React, { useState, useEffect } from "react";
import { SaveIcon } from "../../component/icons"


export default function Profile({ profileData, companyProfile, onUpdate }) {
    const [formData, setFormData] = useState({
        first_name: profileData?.first_name || '',
        middle_name: profileData?.middle_name || '',
        last_name: profileData?.last_name || '',
        email: profileData?.email || '',
        phone_number: profileData?.phone_number || '',
        availability: profileData?.availability || 'full_time',
        company_name: companyProfile?.company_name || '',
        ptin: companyProfile?.ptin || '',
        efin: companyProfile?.efin || ''
    });

    // Update form data when props change
    useEffect(() => {
        if (profileData || companyProfile) {
            setFormData({
                first_name: profileData?.first_name || '',
                middle_name: profileData?.middle_name || '',
                last_name: profileData?.last_name || '',
                email: profileData?.email || '',
                phone_number: profileData?.phone_number || '',
                availability: profileData?.availability || 'full_time',
                company_name: companyProfile?.company_name || '',
                ptin: companyProfile?.ptin || '',
                efin: companyProfile?.efin || ''
            });
        }
    }, [profileData, companyProfile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Implement save functionality with API call
        console.log('Form data:', formData);
        if (onUpdate) {
            onUpdate();
        }
    };

    const profilePicture = profileData?.profile_picture || "https://i.pravatar.cc/120";
    const fullName = profileData?.name || `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim() || 'User';

    return (
        <div style={{
            backgroundColor: "#F3F7FF",
            padding: "10px",
            borderRadius: "12px",
            border: "none"
        }}>
            {/* Personal Information Section */}
            <div className="flex flex-col gap-4 border border-[#E8F0FF] p-4 rounded-lg bg-white mb-4">
                <div className="align-items-center">
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
                        src={profilePicture}
                        alt={fullName}
                        className="rounded-circle me-3"
                        width="99.96px"
                        height="98px"
                        style={{ objectFit: 'cover' }}
                    />
                    <div>
                        <button className="btn border border-[#E8F0FF] text-black btn-sm mb-2" style={{ fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
                            Change Avatar
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="row g-3 mb-4">
                        <div className="col-md-6">
                            <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                First Name
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                className="form-control w-full"
                                value={formData.first_name}
                                onChange={handleChange}
                                style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Middle Name
                            </label>
                            <input
                                type="text"
                                name="middle_name"
                                className="form-control w-full"
                                value={formData.middle_name || ''}
                                onChange={handleChange}
                                style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Last Name
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                className="form-control w-full"
                                value={formData.last_name}
                                onChange={handleChange}
                                style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                className="form-control w-full"
                                value={formData.email}
                                onChange={handleChange}
                                style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Phone Number
                            </label>
                            <input
                                type="text"
                                name="phone_number"
                                className="form-control w-full"
                                value={formData.phone_number}
                                onChange={handleChange}
                                style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Availability
                            </label>
                            <select
                                name="availability"
                                className="form-control w-full"
                                value={formData.availability}
                                onChange={handleChange}
                                style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                            >
                                <option value="full_time">Full-time</option>
                                <option value="part_time">Part-time</option>
                                <option value="contract">Contract</option>
                            </select>
                            {profileData?.availability_display && (
                                <small className="text-muted" style={{ fontFamily: "BasisGrotesquePro", fontSize: "12px" }}>
                                    Current: {profileData.availability_display}
                                </small>
                            )}
                        </div>
                    </div>

                    <div className="mt-1">
                        <button
                            type="submit"
                            className="btn d-flex align-items-center gap-2"
                            style={{ backgroundColor: "#F56D2D", color: "#ffffff", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                        >
                            <SaveIcon />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>

            {/* Company Profile Section */}
            <div className="grid grid-cols-1 gap-4 border border-[#E8F0FF] p-4 rounded-lg bg-white">
                <div className="align-items-center mb-3">
                    <h5
                        className="mb-0 me-3"
                        style={{
                            color: "#3B4A66",
                            fontSize: "24px",
                            fontWeight: "500",
                            fontFamily: "BasisGrotesquePro",
                        }}
                    >
                        Company Information
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
                        Update your company details
                    </p>
                </div>

                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                            Company Name
                        </label>
                        <input
                            type="text"
                            name="company_name"
                            className="form-control w-full"
                            value={formData.company_name}
                            onChange={handleChange}
                            style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                            PTIN
                        </label>
                        <input
                            type="text"
                            name="ptin"
                            className="form-control w-full"
                            value={formData.ptin}
                            onChange={handleChange}
                            style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                            EFIN
                        </label>
                        <input
                            type="text"
                            name="efin"
                            className="form-control w-full"
                            value={formData.efin}
                            onChange={handleChange}
                            style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                        />
                    </div>
                </div>

                <div className="mt-3">
                    <button
                        type="button"
                        onClick={handleSubmit}
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
