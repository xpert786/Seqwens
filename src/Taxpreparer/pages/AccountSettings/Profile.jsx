import React, { useState, useEffect, useRef } from "react";
import { SaveIcon } from "../../component/icons";
import { toast } from "react-toastify";
import { taxPreparerSettingsAPI, handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";


export default function Profile({ profileData, companyProfile, onUpdate }) {
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        name: profileData?.name || `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim() || '',
        email: profileData?.email || '',
        phone_number: profileData?.phone_number || '',
        availability: profileData?.availability || 'full_time',
        company_name: companyProfile?.company_name || '',
        ptin: companyProfile?.ptin || '',
        efin: companyProfile?.efin || ''
    });
    const [saving, setSaving] = useState(false);
    const [uploadingPicture, setUploadingPicture] = useState(false);

    // Update form data when props change
    useEffect(() => {
        if (profileData || companyProfile) {
            setFormData({
                name: profileData?.name || `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim() || '',
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);

            // Parse name into first_name and last_name
            const nameParts = formData.name.trim().split(/\s+/);
            const first_name = nameParts[0] || '';
            const last_name = nameParts.slice(1).join(' ') || '';

            // Prepare update data - only include fields that API accepts
            const updateData = {
                first_name: first_name,
                last_name: last_name,
                email: formData.email,
                phone_number: formData.phone_number,
                availability: formData.availability,
                ptin: formData.ptin || '',
                efin: formData.efin || ''
            };

            const result = await taxPreparerSettingsAPI.updateSettings(updateData);

            if (result.success) {
                toast.success('Settings updated successfully');
                if (onUpdate) {
                    onUpdate();
                }
            } else {
                throw new Error(result.message || 'Failed to update settings');
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            const errorMessage = handleAPIError(error);
            toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to update settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        uploadProfilePicture(file);
    };

    const uploadProfilePicture = async (file) => {
        try {
            setUploadingPicture(true);

            const result = await taxPreparerSettingsAPI.updateProfilePicture(file);

            if (result.success) {
                toast.success('Profile picture updated successfully');
                if (onUpdate) {
                    onUpdate();
                }
            } else {
                throw new Error(result.message || 'Failed to update profile picture');
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            const errorMessage = handleAPIError(error);
            toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to update profile picture. Please try again.');
        } finally {
            setUploadingPicture(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleAvatarChange}
                        />
                        <button
                            type="button"
                            className="btn border border-[#E8F0FF] text-black btn-sm mb-2"
                            style={{ fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPicture}
                        >
                            {uploadingPicture ? 'Uploading...' : 'Change Avatar'}
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="row g-3 mb-4">
                        <div className="col-12">
                            <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                className="form-control w-full"
                                value={formData.name}
                                onChange={handleChange}
                                style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                            />
                        </div>
                        <div className="col-12">
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
                        <div className="col-12">
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
                        <div className="col-12">
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
                            disabled={saving}
                        >
                            <SaveIcon />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Company Profile Section */}
            <div className="flex flex-col gap-4 border border-[#E8F0FF] p-4 rounded-lg bg-white">
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
                        Company Profile
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
                    <div className="col-12">
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
                    <div className="col-12">
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
                    <div className="col-12">
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
                        disabled={saving}
                    >
                        <SaveIcon />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
